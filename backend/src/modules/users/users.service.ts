import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  User,
  UserDocument,
  UserProgress,
  UserProgressDocument,
  UserVocabulary,
  UserVocabularyDocument,
  WeakVocabulary,
  WeakVocabularyDocument,
  LessonProgress,
  LessonProgressDocument,
  UserMistake,
  UserMistakeDocument,
  Reading,
  ReadingDocument,
  Sentence,
  SentenceDocument,
} from '../../schemas';

export interface SkillMasteryScores {
  grammar: number;
  vocabulary: number;
  translation: number;
  pronunciation: number;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserProgress.name) private progressModel: Model<UserProgressDocument>,
    @InjectModel(UserVocabulary.name) private vocabModel: Model<UserVocabularyDocument>,
    @InjectModel(WeakVocabulary.name) private weakVocabModel: Model<WeakVocabularyDocument>,
    @InjectModel(LessonProgress.name) private lessonProgressModel: Model<LessonProgressDocument>,
    @InjectModel(UserMistake.name) private mistakeModel: Model<UserMistakeDocument>,
    @InjectModel(Reading.name) private readingModel: Model<ReadingDocument>,
    @InjectModel(Sentence.name) private sentenceModel: Model<SentenceDocument>,
  ) {}

  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid User ID format: ${id}`);
    }
    return new Types.ObjectId(id);
  }

  async getMe(userId: string) {
    const userObjectId = this.toObjectId(userId);
    const user = await this.userModel.findById(userObjectId).select('-passwordHash').lean();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const learningProfile = await this.getLearningProfile(userId);

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      xp: learningProfile.xp,
      streak: learningProfile.streak,
      hearts: learningProfile.hearts,
      currentLevel: learningProfile.currentLevel,
      dailyGoalXp: learningProfile.dailyGoalXp,
      todayXp: learningProfile.todayXp,
      savedWordsCount: learningProfile.savedVocabulary.total,
      weakWordsCount: learningProfile.weakVocabulary.total,
      completedLessonsCount: learningProfile.readingProgress.completedCount,
      completedSentencesCount: learningProfile.translationProgress.completedSentencesCount,
      learningProgress: {
        completedReadings: learningProfile.readingProgress.completedReadings,
        completedSentences: learningProfile.translationProgress.completedSentences,
        lessonsDetail: learningProfile.lessonHistory,
      },
      learningProfile,
    };
  }

  async getStats(userId: string) {
    return this.getMe(userId);
  }

  async getLearningProfile(userId: string) {
    const userObjectId = this.toObjectId(userId);

    let progress = await this.progressModel.findOne({ userId: userObjectId }).lean();
    if (!progress) {
      const created = await this.progressModel.create({
        userId: userObjectId,
        xp: 0,
        streakCount: 0,
        hearts: 5,
        currentLevel: 'A1',
        dailyGoalXp: 50,
        todayXp: 0,
        completedReadings: [],
        completedSentences: [],
      });
      progress = created.toObject();
    }

    const [
      savedWordsCount,
      weakWordsList,
      completedLessonsList,
      mistakesList,
      totalReadingsCount,
      totalSentencesCount,
    ] = await Promise.all([
      this.vocabModel.countDocuments({ userId: userObjectId }),
      this.weakVocabModel.find({ userId: userObjectId }).sort({ mistakeCount: -1 }).limit(20).lean(),
      this.lessonProgressModel.find({ userId: userObjectId }).lean(),
      this.mistakeModel.find({ userId: userObjectId }).sort({ errorCount: -1 }).limit(30).lean(),
      this.readingModel.countDocuments({ isPublished: true }),
      this.sentenceModel.countDocuments(),
    ]);

    // Categorize mistakes strictly for this user
    const grammarWeaknesses: Array<{ tag: string; errorCount: number; masteryScore: number; explanation?: string }> = [];
    const pronunciationWeaknesses: Array<{ tag: string; errorCount: number; masteryScore: number }> = [];

    const grammarMap: Record<string, { tag: string; errorCount: number; masteryScore: number; explanation?: string }> = {};
    for (const m of mistakesList) {
      if (m.category === 'pronunciation') {
        pronunciationWeaknesses.push({ tag: m.tag, errorCount: m.errorCount, masteryScore: m.masteryScore });
      } else {
        if (!grammarMap[m.tag]) {
          grammarMap[m.tag] = { tag: m.tag, errorCount: 0, masteryScore: m.masteryScore, explanation: m.explanation };
        }
        grammarMap[m.tag].errorCount += m.errorCount;
        grammarMap[m.tag].masteryScore = Math.min(grammarMap[m.tag].masteryScore, m.masteryScore);
      }
    }
    grammarWeaknesses.push(...Object.values(grammarMap));

    // Calculate Dynamic 8-Skill Mastery
    const completedSentencesCount = (progress.completedSentences || []).length;
    const completedReadingsCount = (progress.completedReadings || []).length;

    const grammarScore = Math.max(15, Math.min(95, 75 - grammarWeaknesses.length * 8 + Math.min(25, completedSentencesCount * 2)));
    const vocabScore = Math.max(20, Math.min(98, 40 + Math.min(45, savedWordsCount * 3) - Math.min(20, weakWordsList.length * 2)));
    const transScore = Math.max(10, Math.min(96, 30 + Math.min(60, completedSentencesCount * 4)));
    const pronScore = Math.max(25, Math.min(92, 70 - pronunciationWeaknesses.length * 10 + Math.min(20, completedSentencesCount)));
    const readingScore = Math.max(15, Math.min(98, Math.round((completedReadingsCount / Math.max(1, totalReadingsCount)) * 100)));
    const writingScore = Math.max(10, Math.min(95, Math.round((completedLessonsList.filter((l) => l.completed).length / Math.max(1, totalReadingsCount)) * 100)));
    const listeningScore = Math.max(30, Math.min(90, 45 + Math.min(40, completedSentencesCount * 2)));
    const speakingScore = Math.max(20, Math.min(88, 35 + Math.min(45, completedSentencesCount * 2)));

    const mastery: SkillMasteryScores = {
      grammar: grammarScore,
      vocabulary: vocabScore,
      translation: transScore,
      pronunciation: pronScore,
      listening: listeningScore,
      reading: readingScore,
      writing: writingScore,
      speaking: speakingScore,
    };

    // Calculate Adaptive Priority
    let priorityArea = 'Khởi đầu lộ trình A1';
    let actionTitle = 'Bắt đầu bài đọc đầu tiên';
    let actionDesc = 'Khám phá các cấu trúc câu thực tế và xây dựng phản xạ dịch tự nhiên.';

    if (grammarWeaknesses.length > 0) {
      const topWeak = grammarWeaknesses[0];
      priorityArea = `Củng cố ngữ pháp: ${topWeak.tag}`;
      actionTitle = `Ôn luyện ${topWeak.tag}`;
      actionDesc = `Hệ thống ghi nhận bạn đang gặp khó khăn ở ${topWeak.tag}. Hãy làm bài tập để khắc phục ngay.`;
    } else if (weakWordsList.length > 0) {
      priorityArea = `Khắc phục ${weakWordsList.length} từ vựng yếu`;
      actionTitle = 'Ôn tập từ vựng ngắt quãng';
      actionDesc = `Có ${weakWordsList.length} từ vựng bạn hay nhầm lẫn. Luyện tập lại sẽ giúp nhớ sâu vĩnh viễn.`;
    } else if (completedReadingsCount > 0) {
      priorityArea = 'Chinh phục bài đọc tiếp theo';
      actionTitle = 'Nâng cấp kỹ năng dịch và viết';
      actionDesc = 'Bạn đang tiến bộ rất nhanh! Tiếp tục chuỗi bài học hôm nay để đạt mục tiêu ngày.';
    }

    return {
      userId: userObjectId.toString(),
      xp: progress.xp || 0,
      streak: progress.streakCount || 0,
      hearts: progress.hearts ?? 5,
      currentLevel: progress.currentLevel || 'A1',
      dailyGoalXp: progress.dailyGoalXp || 50,
      todayXp: progress.todayXp || 0,
      savedVocabulary: {
        total: savedWordsCount,
      },
      weakVocabulary: {
        total: weakWordsList.length,
        items: weakWordsList,
      },
      grammarWeakness: grammarWeaknesses,
      pronunciationWeakness: pronunciationWeaknesses,
      listeningWeakness: [],
      readingProgress: {
        completedCount: completedReadingsCount,
        totalCount: totalReadingsCount,
        percent: Math.min(100, Math.round((completedReadingsCount / Math.max(1, totalReadingsCount)) * 100)),
        completedReadings: progress.completedReadings || [],
      },
      writingProgress: {
        completedCount: completedLessonsList.filter((l) => l.completed).length,
        percent: Math.min(100, Math.round((completedLessonsList.filter((l) => l.completed).length / Math.max(1, totalReadingsCount)) * 100)),
      },
      translationProgress: {
        completedSentencesCount,
        totalSentencesCount,
        percent: Math.min(100, Math.round((completedSentencesCount / Math.max(1, totalSentencesCount)) * 100)),
        completedSentences: progress.completedSentences || [],
      },
      lessonHistory: completedLessonsList,
      mastery,
      learningStatistics: {
        totalReadings: totalReadingsCount,
        totalSentences: totalSentencesCount,
        completedReadings: completedReadingsCount,
        completedSentences: completedSentencesCount,
        streakDays: progress.streakCount || 0,
        hasActivity: (progress.xp || 0) > 0 || completedSentencesCount > 0,
      },
      adaptiveRecommendation: {
        priorityArea,
        actionTitle,
        actionDesc,
      },
    };
  }
}

