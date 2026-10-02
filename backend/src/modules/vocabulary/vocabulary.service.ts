import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  UserVocabulary,
  UserVocabularyDocument,
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
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Sentence.name) private sentenceModel: Model<SentenceDocument>,
    private configService: ConfigService,
  ) {}

  private async getActiveUserId(): Promise<Types.ObjectId> {
    const user = await this.userModel.findOne();
    if (user) return user._id as Types.ObjectId;
    return new Types.ObjectId();
  }

  async getVocabularyList(query?: string, cefr?: string) {
    const userId = await this.getActiveUserId();
    const filter: Record<string, any> = { userId };

    if (query) {
      filter.$or = [
        { word: { $regex: query, $options: 'i' } },
        { meaningVi: { $regex: query, $options: 'i' } },
      ];
    }
    if (cefr) {
      filter.cefr = cefr.toUpperCase();
    }

    const words = await this.vocabModel.find(filter).sort({ createdAt: -1 }).lean();
    return {
      items: words,
      totalCount: words.length,
    };
  }

  async saveWord(dto: SaveVocabDto) {
    const userId = await this.getActiveUserId();
    const cleanWord = dto.word.trim().toLowerCase();

    const existing = await this.vocabModel.findOne({ userId, word: cleanWord });
    if (existing) {
      existing.meaningVi = dto.meaningVi || existing.meaningVi;
      existing.exampleEn = dto.exampleEn || existing.exampleEn;
      await existing.save();
      return existing;
    }

    const created = await this.vocabModel.create({
      userId,
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

  async toggleFavorite(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid vocabulary ID: ${id}`);
    }
    const item = await this.vocabModel.findById(id);
    if (!item) {
      throw new NotFoundException(`Vocabulary item not found: ${id}`);
    }
    item.isFavorite = !item.isFavorite;
    await item.save();
    return item;
  }

  async deleteWord(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid vocabulary ID: ${id}`);
    }
    await this.vocabModel.findByIdAndDelete(id);
    return { success: true, deletedId: id };
  }

  /**
   * On-demand intelligent vocabulary lookup:
   * 1. High-speed local dictionary table
   * 2. MongoDB Sentence cache
   * 3. Google Gemini 3.7-Flash API for contextual dictionary definitions
   * 4. Auto-caches results into MongoDB Sentence tokens for instant future lookups
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

    // 1. High-speed local dictionary
    const local = lookupLocalDictionary(cleanWord);
    if (local) {
      this.cacheWordToSentences(cleanWord, local.meaningVi, local.ipa, local.pos, local.cefr);
      return {
        word: cleanWord,
        meaningVi: local.meaningVi,
        ipa: local.ipa,
        pos: local.pos,
        cefr: local.cefr,
        exampleEn: local.exampleEn || contextSentence || '',
        exampleVi: local.exampleVi || '',
      };
    }

    // 2. Check if another sentence already has meaningVi for this word in MongoDB
    try {
      const cachedSent = await this.sentenceModel
        .findOne({
          tokens: {
            $elemMatch: {
              text: { $regex: `^${cleanWord}$`, $options: 'i' },
              meaningVi: { $exists: true, $ne: '' },
            },
          },
        })
        .lean();

      if (cachedSent) {
        const t = cachedSent.tokens.find(
          (tk: any) => tk.text?.toLowerCase() === cleanWord && tk.meaningVi,
        );
        if (t) {
          return {
            word: cleanWord,
            meaningVi: t.meaningVi,
            ipa: t.ipa || '',
            pos: t.pos || 'word',
            cefr: t.cefr || 'A1',
            exampleEn: contextSentence || cachedSent.textEn,
            exampleVi: cachedSent.primaryTranslationVi,
          };
        }
      }
    } catch {
      // Fallback to AI
    }

    // 3. Call Gemini AI via configured key
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    if (apiKey && apiKey.trim().length > 10) {
      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      for (const model of modelsToTry) {
        try {
          const prompt = `Tra cứu từ vựng tiếng Anh theo ngữ cảnh: "${cleanWord}".
Câu ngữ cảnh: "${contextSentence || ''}".
Trả về DUY NHẤT một chuỗi JSON hợp lệ theo định dạng:
{
  "meaningVi": "nghĩa tiếng Việt chính xác và tự nhiên theo ngữ cảnh",
  "ipa": "/phiên âm IPA/",
  "pos": "noun|verb|adjective|adverb|preposition|conjunction",
  "cefr": "A1|A2|B1|B2|C1|C2",
  "exampleEn": "câu ví dụ tiếng Anh ngắn",
  "exampleVi": "dịch ví dụ sang tiếng Việt"
}`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);

          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json',
              },
            }),
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (raw) {
              const parsed = JSON.parse(raw);
              const result = {
                word: cleanWord,
                meaningVi: parsed.meaningVi || 'nghĩa từ vựng',
                ipa: parsed.ipa || '',
                pos: parsed.pos || 'word',
                cefr: parsed.cefr || 'B1',
                exampleEn: parsed.exampleEn || contextSentence || '',
                exampleVi: parsed.exampleVi || '',
              };
              this.cacheWordToSentences(cleanWord, result.meaningVi, result.ipa, result.pos, result.cefr);
              return result;
            }
          }
        } catch (e: any) {
          this.logger.debug(`Gemini ${model} lookup failed: ${e.message}`);
        }
      }
    }

    // 4. Fast high-reliability translation fallback
    try {
      const res = await fetch(
        'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=' +
          encodeURIComponent(cleanWord),
      );
      if (res.ok) {
        const data = await res.json();
        const translated = (data[0] || []).map((x: any) => x[0]).join('').trim();
        if (translated) {
          const result = {
            word: cleanWord,
            meaningVi: translated,
            ipa: `/${cleanWord}/`,
            pos: 'word',
            cefr: 'B1',
            exampleEn: contextSentence || '',
            exampleVi: '',
          };
          this.cacheWordToSentences(cleanWord, result.meaningVi, result.ipa, result.pos, result.cefr);
          return result;
        }
      }
    } catch {
      // Ignore
    }

    // 5. Ultimate fallback if offline
    return {
      word: cleanWord,
      meaningVi: cleanWord,
      ipa: `/${cleanWord}/`,
      pos: 'word',
      cefr: 'B1',
      exampleEn: contextSentence || '',
      exampleVi: '',
    };
  }

  private async cacheWordToSentences(
    word: string,
    meaningVi: string,
    ipa: string,
    pos: string,
    cefr: string,
  ) {
    try {
      await this.sentenceModel.updateMany(
        { 'tokens.text': { $regex: `^${word}$`, $options: 'i' } },
        {
          $set: {
            'tokens.$[elem].meaningVi': meaningVi,
            'tokens.$[elem].ipa': ipa,
            'tokens.$[elem].pos': pos,
            'tokens.$[elem].cefr': cefr,
          },
        },
        {
          arrayFilters: [{ 'elem.text': { $regex: `^${word}$`, $options: 'i' } }],
        },
      );
    } catch {
      // Safe ignore
    }
  }
}
