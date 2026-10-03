import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserMistake, UserMistakeDocument, Sentence, SentenceDocument, UserProgress, UserProgressDocument } from '../../schemas';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(UserMistake.name) private mistakeModel: Model<UserMistakeDocument>,
    @InjectModel(Sentence.name) private sentenceModel: Model<SentenceDocument>,
    @InjectModel(UserProgress.name) private progressModel: Model<UserProgressDocument>,
  ) {}

  async getSmartReviewQueue(userId?: string) {
    const filter: Record<string, any> = {};
    if (userId && Types.ObjectId.isValid(userId)) {
      filter.userId = new Types.ObjectId(userId);
    }

    // 1. Find mistakes due for review for this specific user
    const dueMistakes = await this.mistakeModel
      .find(filter)
      .sort({ nextReviewAt: 1, errorCount: -1 })
      .limit(6)
      .lean();

    const sentenceIds = dueMistakes.map((m) => m.sentenceId);
    let sentences = await this.sentenceModel.find({ _id: { $in: sentenceIds } }).lean();

    // 2. If no mistakes due, pick 3 random sentences from any beginner/intermediate lessons for retention drill
    if (sentences.length < 3) {
      const fallbackSentences = await this.sentenceModel
        .find({ isAnalyzed: true })
        .limit(4)
        .lean();
      sentences = [...sentences, ...fallbackSentences.slice(0, 4 - sentences.length)];
    }

    // 3. Format into proactive Smart Challenge items
    const items = sentences.map((s, idx) => {
      const tokens = (s.tokens || []).filter((t) => t.text.length > 2);
      const targetToken = tokens[idx % Math.max(tokens.length, 1)] || { text: 'word', lemma: 'word', meaningVi: 'từ vựng' };

      const maskedText = s.textEn.replace(new RegExp(`\\b${targetToken.text}\\b`, 'i'), '__________');

      return {
        id: s._id,
        exerciseType: idx % 2 === 0 ? 'cloze' : 'translation',
        textEn: s.textEn,
        maskedText,
        targetWord: targetToken.text,
        targetMeaning: targetToken.meaningVi,
        primaryTranslationVi: s.primaryTranslationVi,
        grammarTense: s.grammarAnalysis?.tense || 'Cấu trúc câu',
        tenseExplanationVi: s.grammarAnalysis?.tenseExplanationVi || '',
        stressWords: s.pronunciationGuide?.sentenceStressWords || [],
        linkingRules: s.pronunciationGuide?.linkingRules || [],
      };
    });

    return {
      dueCount: items.length,
      items,
    };
  }
}
