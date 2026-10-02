import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserProgress, UserProgressDocument, UserMistake, UserMistakeDocument, Reading, ReadingDocument, Sentence, SentenceDocument } from '../../schemas';

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(UserProgress.name) private progressModel: Model<UserProgressDocument>,
    @InjectModel(UserMistake.name) private mistakeModel: Model<UserMistakeDocument>,
    @InjectModel(Reading.name) private readingModel: Model<ReadingDocument>,
    @InjectModel(Sentence.name) private sentenceModel: Model<SentenceDocument>,
  ) {}

  async getProgress() {
    let progress = await this.progressModel.findOne().lean();
    if (!progress) {
      const created = await this.progressModel.create({
        userId: new Types.ObjectId(),
        xp: 140,
        streakCount: 3,
        hearts: 5,
        currentLevel: 'A1',
        dailyGoalXp: 50,
        todayXp: 20,
      });
      progress = created.toObject();
    }

    const totalReadings = await this.readingModel.countDocuments({ isPublished: true });
    const totalSentences = await this.sentenceModel.countDocuments();

    return {
      ...progress,
      totalReadings,
      totalSentences,
      completedReadingsCount: (progress.completedReadings || []).length,
      completedSentencesCount: (progress.completedSentences || []).length,
    };
  }

  async getGrammarWeaknesses() {
    const mistakes = await this.mistakeModel.find().sort({ errorCount: -1 }).limit(10).lean();

    // Group by tag
    const weaknessMap: Record<string, { tag: string; category: string; errorCount: number; masteryScore: number; sampleMistakes: any[] }> = {};

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
