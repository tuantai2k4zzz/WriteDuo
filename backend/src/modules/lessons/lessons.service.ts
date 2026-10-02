import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reading, ReadingDocument, Sentence, SentenceDocument, UserProgress, UserProgressDocument } from '../../schemas';
import { lookupLocalDictionary } from '../vocabulary/dictionary.data';

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(Reading.name) private readingModel: Model<ReadingDocument>,
    @InjectModel(Sentence.name) private sentenceModel: Model<SentenceDocument>,
    @InjectModel(UserProgress.name) private progressModel: Model<UserProgressDocument>,
  ) {}

  async getAllLessons(level?: string) {
    const filter: Record<string, any> = { isPublished: true };
    if (level) {
      filter.level = level.toUpperCase();
    }

    const readings = await this.readingModel
      .find(filter)
      .sort({ order: 1, level: 1 })
      .select('-paragraphs')
      .lean();

    const progress = await this.progressModel.findOne().lean();
    const completedSet = new Set(
      (progress?.completedReadings || []).map((id) => id.toString()),
    );

    return readings.map((r) => ({
      ...r,
      isCompleted: completedSet.has(r._id.toString()),
    }));
  }

  async getLessonById(idOrSlug: string) {
    let reading: ReadingDocument | null = null;

    if (Types.ObjectId.isValid(idOrSlug)) {
      reading = await this.readingModel.findById(idOrSlug).lean();
    }
    if (!reading) {
      reading = await this.readingModel.findOne({ slug: idOrSlug }).lean();
    }

    if (!reading) {
      throw new NotFoundException(`Lesson not found: ${idOrSlug}`);
    }

    const sentences = await this.sentenceModel
      .find({ readingId: reading._id })
      .sort({ paragraphIndex: 1, sentenceIndex: 1 })
      .lean();

    const enrichedSentences = sentences.map((s) => this.enrichSentence(s));

    return {
      lesson: reading,
      sentences: enrichedSentences,
      totalCount: enrichedSentences.length,
    };
  }

  async getSentenceById(sentenceId: string) {
    if (!Types.ObjectId.isValid(sentenceId)) {
      throw new NotFoundException(`Invalid sentence ID: ${sentenceId}`);
    }

    const sentence = await this.sentenceModel.findById(sentenceId).lean();
    if (!sentence) {
      throw new NotFoundException(`Sentence not found: ${sentenceId}`);
    }

    return this.enrichSentence(sentence);
  }

  async getPronunciationGuide(sentenceId: string) {
    const sentence = await this.getSentenceById(sentenceId);
    return {
      sentenceId: sentence._id,
      textEn: sentence.textEn,
      pronunciationGuide: sentence.pronunciationGuide,
      tokens: sentence.tokens,
    };
  }

  private enrichSentence(sentence: any) {
    const tokens = (sentence.tokens || []).map((t: any) => {
      const local = !t.meaningVi ? lookupLocalDictionary(t.text) : null;
      const meaningVi = t.meaningVi || local?.meaningVi || '';
      const ipa = t.ipa || local?.ipa || '';
      const pos = t.pos && t.pos !== 'word' ? t.pos : local?.pos || t.pos || 'word';
      const cefr = t.cefr || local?.cefr || 'A1';

      return {
        ...t,
        meaningVi,
        ipa,
        pos,
        cefr,
        usageInSentence: `Đóng vai trò là ${pos} trong câu`,
        lemma: t.lemma || t.text,
        derivatives: [t.lemma, `${t.lemma}s`].filter(Boolean),
        collocations: [`cụm từ liên quan tới "${t.text}"`],
        exampleEn: local?.exampleEn || sentence.textEn,
        exampleVi: local?.exampleVi || sentence.primaryTranslationVi,
      };
    });

    const subjectComp = sentence.grammarAnalysis?.components?.find((c: any) =>
      c.role?.toLowerCase().includes('subject'),
    );
    const verbComp = sentence.grammarAnalysis?.components?.find((c: any) =>
      c.role?.toLowerCase().includes('verb'),
    );

    const keyVocabHints = (tokens.slice(0, 3) || [])
      .map((t: any) => `"${t.text}": ${t.meaningVi || t.lemma}`)
      .join(', ');

    const hints = {
      level1: `Xác định rõ chủ thể hành động (${subjectComp?.text || 'chủ ngữ'}), hành động chính (${verbComp?.text || 'động từ'}), và bối cảnh xảy ra.`,
      level2: `Từ vựng & cấu trúc trọng tâm: ${keyVocabHints || sentence.grammarAnalysis?.tense || 'các từ khóa chính trong câu'}.`,
      level3: `Gợi ý cách sắp xếp ý: Bắt đầu bằng chủ ngữ [${subjectComp?.text || 'Chủ thể'}], tiếp nối bằng hành động [${verbComp?.text || 'động từ'}], sau đó diễn đạt mượt mà các thành phần bổ ngữ còn lại.`,
    };

    const englishContextMeaning = `In this context, the sentence states that "${sentence.textEn}", expressing an action, state, or routine clearly.`;

    const vietnameseNuance = {
      naturalTranslation: sentence.primaryTranslationVi,
      contrastExplanation: `Trong tiếng Anh, trật tự câu tuân thủ cấu trúc S-V-O (${sentence.textEn.slice(0, 30)}...). Khi chuyển ngữ sang tiếng Việt, cần ưu tiên sự tự nhiên, uyển chuyển thay vì bám sát từng từ gây gượng gạo.`,
    };

    const grammarDetailed = {
      whyStructure:
        sentence.grammarAnalysis?.tenseExplanationVi ||
        'Cấu trúc này được sử dụng để thể hiện chính xác thời điểm và bản chất của hành động.',
      positioningReason:
        'Chủ ngữ đứng đầu câu để xác định đối tượng thực hiện hành động, theo sau là động từ chính và tân ngữ hoặc cụm bổ nghĩa.',
      prepositionsArticlesNotes:
        'Mạo từ và giới từ kết nối các danh từ và tạo mối liên kết không gian/thời gian cụ thể.',
      meaningImpact:
        'Cấu trúc ngữ pháp chuẩn xác giúp người đọc hiểu rõ hành động diễn ra trong hoàn cảnh nào và mức độ chắc chắn ra sao.',
      contrastExamples:
        'Đối chiếu: Nếu thay đổi thì hoặc bỏ bớt các từ bổ nghĩa, câu sẽ trở nên mơ hồ hoặc mang sắc thái nghĩa hoàn toàn khác.',
    };

    const pronunciationGuide = {
      ...(sentence.pronunciationGuide || {}),
      intonation: sentence.textEn.endsWith('?')
        ? 'Ngữ điệu đi lên ở cuối câu hỏi Yes/No (Rising ↗) hoặc đi xuống ở câu hỏi WH (Falling ↘).'
        : 'Ngữ điệu hạ xuống ở cuối câu trần thuật (Falling intonation ↘).',
      sentenceStressWords:
        sentence.pronunciationGuide?.sentenceStressWords?.length > 0
          ? sentence.pronunciationGuide.sentenceStressWords
          : tokens.filter((t: any) => ['noun', 'verb', 'adjective'].includes(t.pos?.toLowerCase())).map((t: any) => t.text),
      vietnameseCommonPitfalls:
        sentence.pronunciationGuide?.vietnameseCommonPitfalls?.length > 0
          ? sentence.pronunciationGuide.vietnameseCommonPitfalls
          : [
              'Người học Việt thường bỏ quên âm cuối (ending sounds) như /s/, /z/, /t/, /d/.',
              'Chú ý nhấn đúng trọng âm từ và không thêm dấu sắc vào các âm không có trọng âm.',
            ],
    };

    return {
      ...sentence,
      tokens,
      hints,
      englishContextMeaning,
      vietnameseNuance,
      grammarDetailed,
      pronunciationGuide,
    };
  }
}
