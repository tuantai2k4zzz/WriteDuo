import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserProgress,
  UserProgressDocument,
  UserMistake,
  UserMistakeDocument,
  Reading,
  ReadingDocument,
  Sentence,
  SentenceDocument,
  LessonProgress,
  LessonProgressDocument,
} from '../../schemas';

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(UserProgress.name) private progressModel: Model<UserProgressDocument>,
    @InjectModel(UserMistake.name) private mistakeModel: Model<UserMistakeDocument>,
    @InjectModel(Reading.name) private readingModel: Model<ReadingDocument>,
    @InjectModel(Sentence.name) private sentenceModel: Model<SentenceDocument>,
    @InjectModel(LessonProgress.name) private lessonProgressModel: Model<LessonProgressDocument>,
  ) {}

  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid ID format: ${id}`);
    }
    return new Types.ObjectId(id);
  }

  private calculateStreak(
    lastActiveDate: Date | undefined,
    currentStreak: number,
  ): { streakCount: number; isNewDay: boolean } {
    const now = new Date();
    if (!lastActiveDate) {
      return { streakCount: 1, isNewDay: true };
    }

    const nowDateStr = now.toISOString().slice(0, 10);
    const lastDateStr = new Date(lastActiveDate).toISOString().slice(0, 10);

    if (nowDateStr === lastDateStr) {
      return { streakCount: currentStreak || 1, isNewDay: false };
    }

    const nowDayTime = new Date(nowDateStr).getTime();
    const lastDayTime = new Date(lastDateStr).getTime();
    const diffDays = Math.round((nowDayTime - lastDayTime) / (24 * 60 * 60 * 1000));

    if (diffDays === 1) {
      return { streakCount: (currentStreak || 0) + 1, isNewDay: true };
    } else {
      return { streakCount: 1, isNewDay: true };
    }
  }

  async getProgress(userId: string) {
    const userObjectId = this.toObjectId(userId);
    let progress = await this.progressModel.findOne({ userId: userObjectId });

    if (!progress) {
      progress = await this.progressModel.create({
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
    }

    const totalReadings = await this.readingModel.countDocuments({ isPublished: true });
    const totalSentences = await this.sentenceModel.countDocuments();

    return {
      ...progress.toObject(),
      totalReadings,
      totalSentences,
      completedReadingsCount: (progress.completedReadings || []).length,
      completedSentencesCount: (progress.completedSentences || []).length,
    };
  }

  async recordSentenceStudy(userId: string, sentenceId: string, xpEarned: number = 10) {
    const userObjectId = this.toObjectId(userId);
    let progress = await this.progressModel.findOne({ userId: userObjectId });

    if (!progress) {
      progress = await this.progressModel.create({
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
    }

    // Streak update
    const { streakCount, isNewDay } = this.calculateStreak(progress.lastActiveDate, progress.streakCount);
    progress.streakCount = streakCount;
    progress.lastActiveDate = new Date();

    if (isNewDay) {
      progress.todayXp = xpEarned;
    } else {
      progress.todayXp = (progress.todayXp || 0) + xpEarned;
    }

    progress.xp = (progress.xp || 0) + xpEarned;

    if (Types.ObjectId.isValid(sentenceId)) {
      const sentenceObjId = new Types.ObjectId(sentenceId);
      const isAlreadyCompleted = progress.completedSentences.some((id) => id.equals(sentenceObjId));
      if (!isAlreadyCompleted) {
        progress.completedSentences.push(sentenceObjId);
      }
    }

    await progress.save();
    return progress;
  }

  async completeLesson(userId: string, lessonSlugOrId: string, score: number = 100) {
    const userObjectId = this.toObjectId(userId);

    // Find reading
    let reading: ReadingDocument | null = null;
    if (Types.ObjectId.isValid(lessonSlugOrId)) {
      reading = await this.readingModel.findById(lessonSlugOrId);
    }
    if (!reading) {
      reading = await this.readingModel.findOne({ slug: lessonSlugOrId });
    }
    if (!reading) {
      throw new NotFoundException(`Lesson not found: ${lessonSlugOrId}`);
    }

    let progress = await this.progressModel.findOne({ userId: userObjectId });
    if (!progress) {
      progress = await this.progressModel.create({
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
    }

    // Award +50 XP for completing full lesson
    const bonusXp = 50;
    const { streakCount, isNewDay } = this.calculateStreak(progress.lastActiveDate, progress.streakCount);
    progress.streakCount = streakCount;
    progress.lastActiveDate = new Date();

    if (isNewDay) {
      progress.todayXp = bonusXp;
    } else {
      progress.todayXp = (progress.todayXp || 0) + bonusXp;
    }
    progress.xp = (progress.xp || 0) + bonusXp;

    const readingObjId = reading._id as Types.ObjectId;
    const isAlreadyCompleted = progress.completedReadings.some((id) => id.equals(readingObjId));
    if (!isAlreadyCompleted) {
      progress.completedReadings.push(readingObjId);
    }
    await progress.save();

    // Update / upsert LessonProgress collection
    const lessonProgress = await this.lessonProgressModel.findOneAndUpdate(
      { userId: userObjectId, lessonId: readingObjId },
      {
        $set: {
          completed: true,
          progress: 100,
          score: Math.max(score, 80),
          lastAttemptAt: new Date(),
          completedAt: new Date(),
        },
        $inc: { attempts: 1 },
      },
      { upsert: true, new: true },
    );

    return {
      success: true,
      earnedXp: bonusXp,
      totalXp: progress.xp,
      streak: progress.streakCount,
      completedLessonId: readingObjId,
      lessonProgress,
    };
  }

  async getLessonProgress(userId: string, lessonSlugOrId: string) {
    const userObjectId = this.toObjectId(userId);
    let reading: ReadingDocument | null = null;
    if (Types.ObjectId.isValid(lessonSlugOrId)) {
      reading = await this.readingModel.findById(lessonSlugOrId);
    }
    if (!reading) {
      reading = await this.readingModel.findOne({ slug: lessonSlugOrId });
    }
    if (!reading) {
      throw new NotFoundException(`Lesson not found: ${lessonSlugOrId}`);
    }

    const lessonProgress = await this.lessonProgressModel
      .findOne({ userId: userObjectId, lessonId: reading._id })
      .lean();

    return {
      lessonId: reading._id,
      completed: lessonProgress?.completed || false,
      progress: lessonProgress?.progress || 0,
      score: lessonProgress?.score || 0,
      attempts: lessonProgress?.attempts || 0,
      lastAttemptAt: lessonProgress?.lastAttemptAt || null,
    };
  }

  async getGrammarWeaknesses(userId: string) {
    const userObjectId = this.toObjectId(userId);
    const mistakes = await this.mistakeModel
      .find({ userId: userObjectId })
      .sort({ errorCount: -1 })
      .limit(10)
      .lean();

    // Group by tag
    const weaknessMap: Record<
      string,
      { tag: string; category: string; errorCount: number; masteryScore: number; sampleMistakes: any[] }
    > = {};

    for (const m of mistakes) {
      if (!weaknessMap[m.tag]) {
        weaknessMap[m.tag] = {
          tag: m.tag,
          category: m.category,
          errorCount: 0,
          masteryScore: m.masteryScore,
          sampleMistakes: [],
        };
      }
      weaknessMap[m.tag].errorCount += m.errorCount;
      if (weaknessMap[m.tag].sampleMistakes.length < 2) {
        weaknessMap[m.tag].sampleMistakes.push({
          userAnswer: m.userAnswer,
          expectedAnswer: m.expectedAnswer,
          explanation: m.explanation,
        });
      }
    }

    return Object.values(weaknessMap);
  }
}
