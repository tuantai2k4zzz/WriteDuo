import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Sentence,
  SentenceDocument,
  Reading,
  ReadingDocument,
  UserProgress,
  UserProgressDocument,
  UserMistake,
  UserMistakeDocument,
  EvaluationCache,
  EvaluationCacheDocument,
} from '../../schemas';
import { AIService } from '../ai/ai.service';
import { MockAIProvider } from '../ai/providers/mock.provider';
import { EvaluateAnswerDto } from './dto/evaluate-answer.dto';
import { EvaluateParagraphDto } from './dto/evaluate-paragraph.dto';
import { EvaluationResult, CompleteSentenceMemorize, GrammarInsight, EvaluationInput } from '../ai/ai.interface';

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);
  // High-performance In-Memory Cache (0ms response)
  private readonly evalCache = new Map<string, { evaluation: EvaluationResult; isDeep: boolean }>();

  constructor(
    @InjectModel(Sentence.name) private sentenceModel: Model<SentenceDocument>,
    @InjectModel(Reading.name) private readingModel: Model<ReadingDocument>,
    @InjectModel(UserProgress.name) private progressModel: Model<UserProgressDocument>,
    @InjectModel(UserMistake.name) private mistakeModel: Model<UserMistakeDocument>,
    @InjectModel(EvaluationCache.name) private cacheModel: Model<EvaluationCacheDocument>,
    private readonly aiService: AIService,
    private readonly mockProvider: MockAIProvider,
  ) {}

  private norm(s: string): string {
    return (s || '')
      .toLowerCase()
      .replace(/[.,?!:;"'()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // --- MAIN EVALUATION (TIER 1 FAST RESPONSE + ASYNC DEEP ANALYSIS) ---
  async evaluateAnswer(dto: EvaluateAnswerDto) {
    if (!Types.ObjectId.isValid(dto.sentenceId)) {
      throw new NotFoundException(`Invalid sentence ID: ${dto.sentenceId}`);
    }

    const sentence = await this.sentenceModel.findById(dto.sentenceId);
    if (!sentence) {
      throw new NotFoundException(`Sentence not found: ${dto.sentenceId}`);
    }

    const mode = dto.mode || 'en_to_vi';
    const userTrimmed = dto.userAnswer.trim();
    const userNorm = this.norm(userTrimmed);
    const cacheKey = `${mode}:${dto.sentenceId}:${userNorm}`;

    // 1. In-Memory Cache Hit (0ms)
    if (this.evalCache.has(cacheKey)) {
      const cached = this.evalCache.get(cacheKey)!;
      this.logger.log(`Instant Memory Cache Hit (0ms) for: "${userTrimmed}" (Deep: ${cached.isDeep})`);
      // Update progress in background
      this.persistProgressAndMistakesAsync(cached.evaluation, sentence, userTrimmed, mode);
      return this.formatResponse(cached.evaluation, sentence, userTrimmed, mode, cached.isDeep, 'memory_cache');
    }

    // 2. Persistent MongoDB Cache Hit (< 15ms)
    try {
      const dbCached = await this.cacheModel.findOne({ cacheKey });
      if (dbCached && dbCached.evaluation) {
        this.logger.log(`Persistent DB Cache Hit (<15ms) for: "${userTrimmed}"`);
        this.evalCache.set(cacheKey, { evaluation: dbCached.evaluation, isDeep: dbCached.isDeepAnalysis });
        this.persistProgressAndMistakesAsync(dbCached.evaluation, sentence, userTrimmed, mode);
        return this.formatResponse(dbCached.evaluation, sentence, userTrimmed, mode, dbCached.isDeepAnalysis, 'db_cache');
      }
    } catch (e: any) {
      this.logger.warn(`Cache read error: ${e.message}`);
    }

    const tenseName = sentence.grammarAnalysis?.tense || 'Cấu trúc câu hoàn chỉnh';
    const tenseExpl =
      sentence.grammarAnalysis?.tenseExplanationVi ||
      'Bản dịch thể hiện trọn vẹn ngữ nghĩa và thì của câu.';

    const defaultGrammarInsight: GrammarInsight = {
      relevantRule: tenseName,
      whyThisStructure: tenseExpl,
      comparisonOrContrast:
        mode === 'vi_to_en'
          ? 'Trật tự câu tiếng Anh tiêu chuẩn: S + V + O + (Adverbial).'
          : 'Cách diễn đạt tự nhiên, tránh lối dịch thô từng từ (word-by-word).',
    };

    const keyPoints: string[] = [];
    if (sentence.grammarAnalysis?.components && sentence.grammarAnalysis.components.length > 0) {
      sentence.grammarAnalysis.components.forEach((c) => {
        if (c.role && c.text) {
          keyPoints.push(`${c.role}: "${c.text}" ${c.noteVi ? `(${c.noteVi})` : ''}`);
        }
      });
    } else if (sentence.tokens && sentence.tokens.length > 0) {
      sentence.tokens.slice(0, 3).forEach((t) => {
        keyPoints.push(`"${t.text}": ${t.meaningVi || t.pos}`);
      });
    }
    if (keyPoints.length === 0) {
      keyPoints.push(`Trọng tâm: ${tenseName}`);
    }

    const defaultMemorize: CompleteSentenceMemorize = {
      textEn: sentence.textEn,
      translationVi: sentence.primaryTranslationVi,
      keyPoints: keyPoints.slice(0, 3),
    };

    // 3. Exact match check (Instant 100% Evaluation, 0ms)
    let isExact = false;
    if (mode === 'vi_to_en') {
      isExact = userNorm === this.norm(sentence.textEn);
    } else {
      isExact =
        this.norm(sentence.primaryTranslationVi) === userNorm ||
        (sentence.alternativeTranslations || []).some((alt) => this.norm(alt) === userNorm);
    }

    if (isExact) {
      const exactEvaluation: EvaluationResult = {
        score: 100,
        status: 'correct',
        semantic_similarity: 1.0,
        overview:
          mode === 'vi_to_en'
            ? 'Xuất sắc! Bạn đã viết câu tiếng Anh hoàn toàn chuẩn xác.'
            : 'Xuất sắc! Bạn đã hiểu và dịch chuẩn xác câu này.',
        explanation: 'Đúng chuẩn 100% ngữ pháp, từ vựng và ngữ cảnh.',
        whatYouGotRight: [
          'Nắm vững cấu trúc câu và từ vựng cốt lõi',
          'Sử dụng đúng thì và trật tự từ vựng',
          'Chính tả hoàn hảo',
        ],
        specificMistakes: [],
        grammarInsight: defaultGrammarInsight,
        completeSentenceMemorize: defaultMemorize,
        missing_information: [],
        extra_information: [],
        semanticAnalysis: {
          overallStatus: 'EXACT_MATCH',
          scores: {
            semanticMeaning: 100,
            grammarAccuracy: 100,
            wordAccuracy: 100,
            naturalness: 100,
            completeness: 100,
          },
          tokenDiffs: userTrimmed.split(/\s+/).map((t) => ({
            learnerToken: t,
            referenceToken: t,
            status: 'EXACT_CORRECT',
          })),
          alternatives: [],
          missingElements: [],
          naturalnessNote: 'Câu viết hoàn hảo 100% ngữ pháp và ngữ nghĩa.',
        },
      };

      // Save to memory cache & persistent cache
      this.evalCache.set(cacheKey, { evaluation: exactEvaluation, isDeep: true });
      this.saveToPersistentCacheAsync(cacheKey, sentence._id, mode, userNorm, userTrimmed, exactEvaluation, true);
      this.persistProgressAndMistakesAsync(exactEvaluation, sentence, userTrimmed, mode);

      return this.formatResponse(exactEvaluation, sentence, userTrimmed, mode, true, 'exact_match');
    }

    // 4. Tier 1 Fast Local Evaluation (Local Semantic Engine, < 10ms response)
    const evalInput: EvaluationInput = {
      sentenceEn: sentence.textEn,
      userTranslationVi: userTrimmed,
      referenceTranslationVi: sentence.primaryTranslationVi,
      alternativeTranslations: sentence.alternativeTranslations,
      grammarAnalysis: sentence.grammarAnalysis,
      tokens: sentence.tokens,
      mode,
    };

    const fastEvaluation = await this.mockProvider.evaluateTranslation(evalInput);
    if (!fastEvaluation.grammarInsight) fastEvaluation.grammarInsight = defaultGrammarInsight;
    if (!fastEvaluation.completeSentenceMemorize) fastEvaluation.completeSentenceMemorize = defaultMemorize;

    // Cache Fast Result in Memory
    this.evalCache.set(cacheKey, { evaluation: fastEvaluation, isDeep: false });

    // 5. Trigger Background Tier 2 Deep Analysis (Asynchronous AI task)
    this.triggerBackgroundDeepAnalysis(sentence, evalInput, cacheKey, userNorm, userTrimmed, mode);

    // 6. Asynchronous Persistence of Progress & Mistakes
    this.persistProgressAndMistakesAsync(fastEvaluation, sentence, userTrimmed, mode);

    // Auto-cache acceptable alternative translation in DB
    if (mode === 'en_to_vi' && fastEvaluation.score >= 92 && !sentence.alternativeTranslations.includes(userTrimmed)) {
      sentence.alternativeTranslations.push(userTrimmed);
      sentence.save().catch(() => {});
    }

    return this.formatResponse(fastEvaluation, sentence, userTrimmed, mode, false, 'fast_evaluation');
  }

  // --- TIER 2: DEEP ANALYSIS QUERY (Called by frontend when user expands details or auto-polled) ---
  async getDeepAnalysis(dto: EvaluateAnswerDto) {
    if (!Types.ObjectId.isValid(dto.sentenceId)) {
      throw new NotFoundException(`Invalid sentence ID: ${dto.sentenceId}`);
    }

    const sentence = await this.sentenceModel.findById(dto.sentenceId);
    if (!sentence) {
      throw new NotFoundException(`Sentence not found: ${dto.sentenceId}`);
    }

    const mode = dto.mode || 'en_to_vi';
    const userTrimmed = dto.userAnswer.trim();
    const userNorm = this.norm(userTrimmed);
    const cacheKey = `${mode}:${dto.sentenceId}:${userNorm}`;

    // If deep analysis is already in RAM cache, return immediately
    const memCached = this.evalCache.get(cacheKey);
    if (memCached && memCached.isDeep) {
      return {
        isReady: true,
        evaluation: memCached.evaluation,
      };
    }

    // Check DB persistent cache
    const dbCached = await this.cacheModel.findOne({ cacheKey });
    if (dbCached && dbCached.isDeepAnalysis) {
      this.evalCache.set(cacheKey, { evaluation: dbCached.evaluation, isDeep: true });
      return {
        isReady: true,
        evaluation: dbCached.evaluation,
      };
    }

    // If not ready yet, compute via AIService (with safe timeout)
    const evalInput: EvaluationInput = {
      sentenceEn: sentence.textEn,
      userTranslationVi: userTrimmed,
      referenceTranslationVi: sentence.primaryTranslationVi,
      alternativeTranslations: sentence.alternativeTranslations,
      grammarAnalysis: sentence.grammarAnalysis,
      tokens: sentence.tokens,
      mode,
    };

    try {
      const deepResult = await this.aiService.evaluateTranslation(evalInput);
      this.evalCache.set(cacheKey, { evaluation: deepResult, isDeep: true });
      this.saveToPersistentCacheAsync(cacheKey, sentence._id, mode, userNorm, userTrimmed, deepResult, true);
      return {
        isReady: true,
        evaluation: deepResult,
      };
    } catch (err: any) {
      this.logger.warn(`Deep analysis fallback: ${err.message}`);
      // Fallback to local semantic evaluation
      const localResult = await this.mockProvider.evaluateTranslation(evalInput);
      return {
        isReady: true,
        evaluation: localResult,
      };
    }
  }

  // --- BACKGROUND DEEP ANALYSIS WORKER ---
  private async triggerBackgroundDeepAnalysis(
    sentence: SentenceDocument,
    input: EvaluationInput,
    cacheKey: string,
    userNorm: string,
    userTrimmed: string,
    mode: string,
  ) {
    // Non-blocking asynchronous task
    setImmediate(async () => {
      try {
        this.logger.log(`[Tier 2 AI Worker] Starting deep analysis for: "${userTrimmed}"`);
        const deepResult = await this.aiService.evaluateTranslation(input);
        this.evalCache.set(cacheKey, { evaluation: deepResult, isDeep: true });
        await this.saveToPersistentCacheAsync(cacheKey, sentence._id, mode, userNorm, userTrimmed, deepResult, true);
        this.logger.log(`[Tier 2 AI Worker] Deep analysis completed & saved for: "${userTrimmed}"`);
      } catch (err: any) {
        this.logger.warn(`[Tier 2 AI Worker] Deep analysis failed (${err.message}). Cached Fast result.`);
      }
    });
  }

  private async saveToPersistentCacheAsync(
    cacheKey: string,
    sentenceId: any,
    mode: string,
    userAnswerNorm: string,
    userAnswerRaw: string,
    evaluation: any,
    isDeepAnalysis: boolean,
  ) {
    try {
      await this.cacheModel.updateOne(
        { cacheKey },
        {
          $set: {
            sentenceId,
            mode,
            userAnswerNorm,
            userAnswerRaw,
            evaluation,
            isDeepAnalysis,
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
        },
        { upsert: true },
      );
    } catch (e: any) {
      this.logger.warn(`Failed to persist cache: ${e.message}`);
    }
  }

  // --- ASYNC USER PROGRESS & MISTAKE PERSISTENCE (NON-BLOCKING) ---
  private async persistProgressAndMistakesAsync(
    evaluation: EvaluationResult,
    sentence: SentenceDocument,
    userTrimmed: string,
    mode: 'en_to_vi' | 'vi_to_en',
  ) {
    setImmediate(async () => {
      try {
        let progress = await this.progressModel.findOne();
        if (!progress) {
          progress = await this.progressModel.create({
            userId: new Types.ObjectId(),
            xp: 0,
            streakCount: 1,
            hearts: 5,
            currentLevel: 'A1',
          });
        }

        if (evaluation.status === 'correct') {
          progress.xp += 10;
          progress.todayXp = (progress.todayXp || 0) + 10;
          if (!progress.completedSentences.includes(sentence._id as Types.ObjectId)) {
            progress.completedSentences.push(sentence._id as Types.ObjectId);
          }
        } else if (evaluation.status === 'almost_correct') {
          progress.xp += 7;
          progress.todayXp = (progress.todayXp || 0) + 7;
        } else if (evaluation.status === 'missing_info') {
          progress.xp += 4;
          progress.todayXp = (progress.todayXp || 0) + 4;
        }

        // Auto Spaced Repetition (SRS)
        const tag = sentence.grammarAnalysis?.tense || 'General Syntax';
        const existingMistake = await this.mistakeModel.findOne({
          userId: progress.userId,
          sentenceId: sentence._id,
        });

        if (evaluation.score >= 80) {
          if (existingMistake) {
            existingMistake.masteryScore = Math.min(100, existingMistake.masteryScore + 30);
            const daysToAdd = existingMistake.masteryScore >= 80 ? 14 : existingMistake.masteryScore >= 50 ? 7 : 3;
            existingMistake.nextReviewAt = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
            await existingMistake.save();
          }
        } else {
          const firstMistakeExpl =
            evaluation.specificMistakes?.[0]?.whyIncorrect || evaluation.explanation;
          if (existingMistake) {
            existingMistake.errorCount += 1;
            existingMistake.masteryScore = Math.max(0, existingMistake.masteryScore - 20);
            existingMistake.nextReviewAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            existingMistake.userAnswer = userTrimmed;
            existingMistake.explanation = firstMistakeExpl;
            await existingMistake.save();
          } else {
            await this.mistakeModel.create({
              userId: progress.userId,
              sentenceId: sentence._id,
              category: 'grammar',
              tag: tag,
              userAnswer: userTrimmed,
              expectedAnswer: mode === 'vi_to_en' ? sentence.textEn : sentence.primaryTranslationVi,
              explanation: firstMistakeExpl,
              errorCount: 1,
              masteryScore: 20,
              nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            });
          }
        }

        progress.lastActiveDate = new Date();
        await progress.save();
      } catch (err: any) {
        this.logger.warn(`Failed async progress persistence: ${err.message}`);
      }
    });
  }

  // --- PARAGRAPH EVALUATION (POST-LESSON BOSS CHALLENGE) ---
  async evaluateParagraph(dto: EvaluateParagraphDto) {
    const isObjectId = Types.ObjectId.isValid(dto.lessonId);
    const reading = isObjectId
      ? await this.readingModel.findById(dto.lessonId)
      : await this.readingModel.findOne({ slug: dto.lessonId });

    if (!reading) {
      throw new NotFoundException(`Reading lesson not found: ${dto.lessonId}`);
    }

    const sentences = await this.sentenceModel
      .find({ readingId: reading._id })
      .sort({ paragraphIndex: 1, sentenceIndex: 1 });

    const mode = dto.mode || 'en_to_vi';
    const userTrimmed = dto.userParagraph.trim();

    const fullEn = sentences.map((s) => s.textEn).join(' ');
    const fullVi = sentences.map((s) => s.primaryTranslationVi).join(' ');

    const target = mode === 'vi_to_en' ? fullEn : fullVi;
    const promptText = mode === 'vi_to_en' ? fullVi : fullEn;

    // Calculate word overlap & 5-axis metrics
    const userWords = this.norm(userTrimmed).split(/\s+/).filter(Boolean);
    const targetWords = this.norm(target).split(/\s+/).filter(Boolean);

    let matchCount = 0;
    for (const tw of targetWords) {
      if (userWords.includes(tw)) matchCount++;
    }
    const ratio = matchCount / Math.max(targetWords.length, 1);
    const overallScore = Math.min(Math.max(Math.round(ratio * 100), 20), 100);

    // 5-Axis Score Breakdown (Futuristic HUD radar metrics)
    const meaningScore = Math.min(100, Math.round(overallScore * 1.05));
    const grammarScore = Math.min(100, Math.max(40, Math.round(overallScore * 0.95)));
    const vocabularyScore = Math.min(100, Math.round(ratio * 100));
    const naturalnessScore = Math.min(100, Math.max(50, Math.round(overallScore * 0.9)));
    const completenessScore = Math.min(100, Math.round((userWords.length / Math.max(targetWords.length, 1)) * 100));

    const isHigh = overallScore >= 80;
    const isMid = overallScore >= 50;

    const overview = isHigh
      ? 'Tuyệt tác! Bạn đã hoàn thành xuất sắc bản dịch toàn bộ đoạn văn.'
      : isMid
      ? 'Khá tốt! Bạn đã nắm được phần lớn ý nghĩa của toàn bài.'
      : 'Cần luyện tập thêm để kết nối các câu trong đoạn văn mượt mà hơn.';

    const strengths: string[] = [];
    const improvements: string[] = [];

    if (meaningScore >= 80) strengths.push('Nắm trọn vẹn thông điệp và chủ đề bài đọc');
    if (vocabularyScore >= 75) strengths.push('Sử dụng đúng các thuật ngữ và từ vựng cốt lõi');
    if (completenessScore >= 80) strengths.push('Dịch đầy đủ không bỏ sót câu nào trong đoạn');

    if (grammarScore < 80) improvements.push('Cần chú ý liên kết thì và giới từ giữa các câu');
    if (naturalnessScore < 80) improvements.push('Văn phong có thể diễn đạt tự nhiên hơn, tránh dịch thô');
    if (strengths.length === 0) strengths.push('Đã cố gắng hoàn thành bản dịch toàn bài');

    // Award 50 XP bonus asynchronously
    this.progressModel.findOne().then((progress) => {
      if (progress) {
        progress.xp += 50;
        progress.todayXp = (progress.todayXp || 0) + 50;
        progress.save().catch(() => {});
      }
    }).catch(() => {});

    return {
      score: overallScore,
      status: isHigh ? 'correct' : isMid ? 'almost_correct' : 'incorrect',
      overview,
      metrics: {
        meaning: meaningScore,
        grammar: grammarScore,
        vocabulary: vocabularyScore,
        naturalness: naturalnessScore,
        completeness: completenessScore,
      },
      strengths,
      improvements,
      promptText,
      referenceParagraph: target,
      xpBonus: 50,
      mode,
    };
  }

  private formatResponse(
    evaluation: EvaluationResult,
    sentence: SentenceDocument,
    userTrimmed: string,
    mode: 'en_to_vi' | 'vi_to_en',
    isDeepAnalysisReady: boolean,
    tier: string,
  ) {
    return {
      evaluation,
      userAnswer: userTrimmed,
      referenceAnswer: mode === 'vi_to_en' ? sentence.textEn : sentence.primaryTranslationVi,
      sentenceId: sentence._id,
      textEn: sentence.textEn,
      primaryTranslationVi: sentence.primaryTranslationVi,
      mode,
      grammarAnalysis: sentence.grammarAnalysis,
      pronunciationGuide: sentence.pronunciationGuide,
      tokens: sentence.tokens,
      isDeepAnalysisReady,
      tier,
    };
  }
}
