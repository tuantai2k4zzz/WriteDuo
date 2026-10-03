import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  UserVocabulary,
  UserVocabularyDocument,
  WeakVocabulary,
  WeakVocabularyDocument,
  User,
  UserDocument,
  Sentence,
  SentenceDocument,
} from '../../schemas';
import { SaveVocabDto } from './dto/save-vocab.dto';
import { lookupLocalDictionary } from './dictionary.data';

@Injectable()
export class VocabularyService {
  private readonly logger = new Logger(VocabularyService.name);

  constructor(
    @InjectModel(UserVocabulary.name) private vocabModel: Model<UserVocabularyDocument>,
    @InjectModel(WeakVocabulary.name) private weakVocabModel: Model<WeakVocabularyDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Sentence.name) private sentenceModel: Model<SentenceDocument>,
    private configService: ConfigService,
  ) {}

  private toObjectId(userId: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid User ID');
    }
    return new Types.ObjectId(userId);
  }

  async getVocabularyList(userId: string, query?: string, cefr?: string, page: number = 1, limit: number = 50) {
    const userObjectId = this.toObjectId(userId);
    const filter: Record<string, any> = { userId: userObjectId };

    if (query && query.trim()) {
      filter.$or = [
        { word: { $regex: query.trim(), $options: 'i' } },
        { meaningVi: { $regex: query.trim(), $options: 'i' } },
      ];
    }
    if (cefr && cefr !== 'ALL') {
      filter.cefr = cefr.toUpperCase();
    }

    const skip = Math.max(0, (page - 1) * limit);
    const [words, totalCount] = await Promise.all([
      this.vocabModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.vocabModel.countDocuments(filter),
    ]);

    return {
      items: words,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async checkWordSaved(userId: string, word: string) {
    const userObjectId = this.toObjectId(userId);
    const cleanWord = word.trim().toLowerCase();
    const item = await this.vocabModel.findOne({ userId: userObjectId, word: cleanWord }).lean();
    return {
      isSaved: !!item,
      id: item?._id || null,
    };
  }

  async saveWord(userId: string, dto: SaveVocabDto) {
    const userObjectId = this.toObjectId(userId);
    const cleanWord = dto.word.trim().toLowerCase();

    const existing = await this.vocabModel.findOne({ userId: userObjectId, word: cleanWord });
    if (existing) {
      existing.meaningVi = dto.meaningVi || existing.meaningVi;
      existing.exampleEn = dto.exampleEn || existing.exampleEn;
      existing.exampleVi = dto.exampleVi || existing.exampleVi;
      existing.ipa = dto.ipa || existing.ipa;
      existing.pos = dto.pos || existing.pos;
      existing.cefr = dto.cefr || existing.cefr;
      await existing.save();
      return existing;
    }

    const created = await this.vocabModel.create({
      userId: userObjectId,
      word: cleanWord,
      meaningVi: dto.meaningVi || '',
      pos: dto.pos || 'word',
      ipa: dto.ipa || '',
      cefr: dto.cefr || 'A1',
      exampleEn: dto.exampleEn || '',
      exampleVi: dto.exampleVi || '',
      isFavorite: false,
      repetitionCount: 0,
      nextReviewAt: new Date(),
    });

    return created;
  }

  async toggleFavorite(userId: string, id: string) {
    const userObjectId = this.toObjectId(userId);
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid vocabulary ID: ${id}`);
    }
    const item = await this.vocabModel.findOne({ _id: new Types.ObjectId(id), userId: userObjectId });
    if (!item) {
      throw new NotFoundException(`Vocabulary item not found or unauthorized: ${id}`);
    }
    item.isFavorite = !item.isFavorite;
    await item.save();
    return item;
  }

  async deleteWord(userId: string, idOrWord: string) {
    const userObjectId = this.toObjectId(userId);
    let deleted;

    if (Types.ObjectId.isValid(idOrWord)) {
      deleted = await this.vocabModel.findOneAndDelete({
        _id: new Types.ObjectId(idOrWord),
        userId: userObjectId,
      });
    }

    if (!deleted) {
      const cleanWord = idOrWord.trim().toLowerCase();
      deleted = await this.vocabModel.findOneAndDelete({
        word: cleanWord,
        userId: userObjectId,
      });
    }

    if (!deleted) {
      throw new NotFoundException('Từ vựng không tồn tại trong sổ tay hoặc không có quyền xoá.');
    }

    return { success: true, deletedId: deleted._id };
  }

  // --- WEAK VOCABULARY SYSTEM ---
  async getWeakVocabulary(userId: string) {
    const userObjectId = this.toObjectId(userId);
    const items = await this.weakVocabModel
      .find({ userId: userObjectId })
      .sort({ mistakeCount: -1, accuracy: 1 })
      .limit(30)
      .lean();

    return items;
  }

  async recordWordAttempt(userId: string, word: string, isCorrect: boolean, sampleSentence?: string) {
    const userObjectId = this.toObjectId(userId);
    const cleanWord = word.trim().toLowerCase().replace(/[.,?!:;"'()]/g, '');
    if (!cleanWord || cleanWord.length < 2) return;

    let item = await this.weakVocabModel.findOne({ userId: userObjectId, word: cleanWord });

    if (!item) {
      // Lookup details from dictionary data
      const dict = lookupLocalDictionary(cleanWord);
      item = new this.weakVocabModel({
        userId: userObjectId,
        word: cleanWord,
        meaningVi: dict?.meaningVi || '',
        ipa: dict?.ipa || '',
        pos: dict?.pos || 'word',
        cefr: dict?.cefr || 'A1',
        sampleSentence: sampleSentence || '',
        correctCount: isCorrect ? 1 : 0,
        wrongCount: isCorrect ? 0 : 1,
        mistakeCount: isCorrect ? 0 : 1,
        accuracy: isCorrect ? 100 : 0,
        lastReviewedAt: new Date(),
        nextReviewAt: new Date(Date.now() + (isCorrect ? 3 : 1) * 24 * 60 * 60 * 1000),
      });
    } else {
      if (isCorrect) {
        item.correctCount += 1;
      } else {
        item.wrongCount += 1;
        item.mistakeCount += 1;
      }
      const total = item.correctCount + item.wrongCount;
      item.accuracy = total > 0 ? Number(((item.correctCount / total) * 100).toFixed(1)) : 0;
      item.lastReviewedAt = new Date();
      const intervalDays = item.accuracy >= 80 ? 7 : item.accuracy >= 50 ? 3 : 1;
      item.nextReviewAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
      if (sampleSentence) {
        item.sampleSentence = sampleSentence;
      }
    }

    await item.save();
    return item;
  }

  /**
   * On-demand intelligent vocabulary lookup:
   * 1. High-speed local dictionary table
   * 2. MongoDB Sentence cache
   * 3. Google Gemini API for contextual dictionary definitions
   */
  async lookupWord(word: string, contextSentence?: string) {
    const cleanWord = word.trim().toLowerCase().replace(/[.,?!:;"'()]/g, '');
    if (!cleanWord) {
      return {
        word,
        meaningVi: 'Chưa xác định',
        ipa: '',
        pos: 'word',
        cefr: 'A1',
      };
    }

    // Step 1: Instant Local Dictionary
    const localEntry = lookupLocalDictionary(cleanWord);
    if (localEntry) {
      return {
        word: cleanWord,
        meaningVi: localEntry.meaningVi,
        ipa: localEntry.ipa,
        pos: localEntry.pos,
        cefr: localEntry.cefr,
        exampleEn: localEntry.exampleEn || contextSentence || `Example with ${cleanWord}.`,
        exampleVi: localEntry.exampleVi || '',
        isLocal: true,
      };
    }

    // Step 2: Sentence Token Cache Search
    const sentenceWithToken = await this.sentenceModel.findOne({
      'tokens.lemma': cleanWord,
    }).lean();

    if (sentenceWithToken && sentenceWithToken.tokens) {
      const match = sentenceWithToken.tokens.find(
        (t) => t.lemma?.toLowerCase() === cleanWord || t.text?.toLowerCase() === cleanWord,
      );
      if (match && match.meaningVi && match.meaningVi.trim() !== '') {
        return {
          word: cleanWord,
          meaningVi: match.meaningVi,
          ipa: match.ipa || '',
          pos: match.pos || 'word',
          cefr: match.cefr || sentenceWithToken.tokens[0]?.cefr || 'A1',
          exampleEn: sentenceWithToken.textEn,
          exampleVi: sentenceWithToken.primaryTranslationVi,
          isCached: true,
        };
      }
    }

    // Step 3: AI Lookup
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey.trim().length > 10) {
      try {
        const prompt = `Tra từ điển Anh - Việt cho từ "${cleanWord}".
Ngữ cảnh (nếu có): "${contextSentence || ''}"
Trả về DUY NHẤT một JSON hợp lệ:
{
  "word": "${cleanWord}",
  "meaningVi": "nghĩa tiếng Việt ngắn gọn, súc tích (1-3 từ)",
  "ipa": "/phiên âm quốc tế/",
  "pos": "danh từ/động từ/tính từ/trạng từ/giới từ",
  "cefr": "A1/A2/B1/B2/C1/C2",
  "exampleEn": "1 câu ví dụ ngắn bằng tiếng Anh",
  "exampleVi": "dịch câu ví dụ sang tiếng Việt"
}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
          }),
        });

        if (resp.ok) {
          const json = await resp.json();
          const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const parsed = JSON.parse(raw);
            return {
              word: cleanWord,
              meaningVi: parsed.meaningVi || 'Đang cập nhật',
              ipa: parsed.ipa || '',
              pos: parsed.pos || 'word',
              cefr: parsed.cefr || 'A1',
              exampleEn: parsed.exampleEn || contextSentence || '',
              exampleVi: parsed.exampleVi || '',
              isAi: true,
            };
          }
        }
      } catch (err: any) {
        this.logger.warn(`AI lookup error for "${cleanWord}": ${err.message}`);
      }
    }

    return {
      word: cleanWord,
      meaningVi: 'Nghĩa từ vựng',
      ipa: '',
      pos: 'word',
      cefr: 'A1',
      exampleEn: contextSentence || '',
      exampleVi: '',
    };
  }
}
