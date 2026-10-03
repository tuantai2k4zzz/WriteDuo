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
} from '../../schemas';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserProgress.name) private progressModel: Model<UserProgressDocument>,
    @InjectModel(UserVocabulary.name) private vocabModel: Model<UserVocabularyDocument>,
    @InjectModel(WeakVocabulary.name) private weakVocabModel: Model<WeakVocabularyDocument>,
    @InjectModel(LessonProgress.name) private lessonProgressModel: Model<LessonProgressDocument>,
  ) {}

  async getMe(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(userObjectId).select('-passwordHash').lean();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

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
      });
      progress = created.toObject();
    }

    const [savedWordsCount, weakWordsCount, completedLessonsList] = await Promise.all([
      this.vocabModel.countDocuments({ userId: userObjectId }),
      this.weakVocabModel.countDocuments({ userId: userObjectId }),
      this.lessonProgressModel.find({ userId: userObjectId, completed: true }).lean(),
    ]);

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      xp: progress.xp || 0,
      streak: progress.streakCount || 0,
      hearts: progress.hearts ?? 5,
      currentLevel: progress.currentLevel || 'A1',
      dailyGoalXp: progress.dailyGoalXp || 50,
      todayXp: progress.todayXp || 0,
      savedWordsCount,
      weakWordsCount,
      completedLessonsCount: (progress.completedReadings || []).length,
      completedSentencesCount: (progress.completedSentences || []).length,
      learningProgress: {
        completedReadings: progress.completedReadings || [],
        completedSentences: progress.completedSentences || [],
        lessonsDetail: completedLessonsList,
      },
    };
  }

  async getStats(userId: string) {
    return this.getMe(userId);
  }
}
