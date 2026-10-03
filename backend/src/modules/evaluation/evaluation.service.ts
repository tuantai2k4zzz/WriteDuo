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
import { VocabularyService } from '../vocabulary/vocabulary.service';
import { EvaluateAnswerDto } from './dto/evaluate-answer.dto';
import { EvaluateParagraphDto } from './dto/evaluate-paragraph.dto';
import { EvaluationResult, CompleteSentenceMemorize, GrammarInsight, EvaluationInput } from '../ai/ai.interface';
import { SemanticAnalyzer } from './semantic-analyzer';

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
    private readonly vocabularyService: VocabularyService,
  ) {}

  private norm(s: string): string {
    return (s || '')
      .toLowerCase()
      .replace(/[.,?!:;"'()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
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

  // --- MAIN EVALUATION (TIER 1 FAST RESPONSE + ASYNC DEEP ANALYSIS) ---
  async evaluateAnswer(dto: EvaluateAnswerDto, userId?: string) {
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
      if (cached.evaluation?.semanticAnalysis?.tokenDiffs && cached.evaluation.semanticAnalysis.tokenDiffs.length > 0) {
        this.logger.log(`Instant Memory Cache Hit (0ms) for: "${userTrimmed}" (Deep: ${cached.isDeep})`);
        this.persistProgressAndMistakesAsync(cached.evaluation, sentence, userTrimmed, mode, userId);
        return this.formatResponse(cached.evaluation, sentence, userTrimmed, mode, cached.isDeep, 'memory_cache');
      } else {
        this.evalCache.delete(cacheKey);
      }
    }

    // 2. Persistent MongoDB Cache Hit (< 15ms)
    try {
      const dbCached = await this.cacheModel.findOne({ cacheKey });
      if (dbCached && dbCached.evaluation?.semanticAnalysis?.tokenDiffs && dbCached.evaluation.semanticAnalysis.tokenDiffs.length > 0) {
        this.logger.log(`Persistent DB Cache Hit (<15ms) for: "${userTrimmed}"`);
        this.evalCache.set(cacheKey, { evaluation: dbCached.evaluation, isDeep: dbCached.isDeepAnalysis });
        this.persistProgressAndMistakesAsync(dbCached.evaluation, sentence, userTrimmed, mode, userId);
        return this.formatResponse(dbCached.evaluation, sentence, userTrimmed, mode, dbCached.isDeepAnalysis, 'db_cache');
      } else if (dbCached) {
        // Invalidate legacy cache without semantic analysis
        await this.cacheModel.deleteOne({ cacheKey });
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
      this.persistProgressAndMistakesAsync(exactEvaluation, sentence, userTrimmed, mode, userId);

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

    let finalEvaluation: EvaluationResult;
    let isDeep = false;
    let tier = 'fast_evaluation';

    const activeProvider = this.aiService.getActiveProvider();
    if (activeProvider.name !== 'MockAIProvider') {
      try {
        this.logger.log(`Evaluating dynamically with ${activeProvider.name}...`);
        finalEvaluation = await this.aiService.evaluateTranslation(evalInput);
        isDeep = true;
        tier = 'ai_deep_evaluation';
      } catch (err: any) {
        this.logger.warn(`AI Provider failed (${err.message}), falling back to local engine.`);
        finalEvaluation = await this.mockProvider.evaluateTranslation(evalInput);
      }
    } else {
      finalEvaluation = await this.mockProvider.evaluateTranslation(evalInput);
    }

    if (!finalEvaluation.grammarInsight) finalEvaluation.grammarInsight = defaultGrammarInsight;
    if (!finalEvaluation.completeSentenceMemorize) finalEvaluation.completeSentenceMemorize = defaultMemorize;

    // Cache in RAM and DB
    this.evalCache.set(cacheKey, { evaluation: finalEvaluation, isDeep });
    if (isDeep) {
      this.saveToPersistentCacheAsync(cacheKey, sentence._id, mode, userNorm, userTrimmed, finalEvaluation, true);
    } else {
      this.triggerBackgroundDeepAnalysis(sentence, evalInput, cacheKey, userNorm, userTrimmed, mode);
    }

    // Asynchronous Persistence of Progress & Mistakes
    this.persistProgressAndMistakesAsync(finalEvaluation, sentence, userTrimmed, mode, userId);

    // Auto-cache acceptable alternative translation in DB
    if (mode === 'en_to_vi' && finalEvaluation.score >= 92 && !sentence.alternativeTranslations.includes(userTrimmed)) {
      sentence.alternativeTranslations.push(userTrimmed);
      sentence.save().catch(() => {});
    }

    return this.formatResponse(finalEvaluation, sentence, userTrimmed, mode, isDeep, tier);
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
    if (
      memCached &&
      memCached.isDeep &&
      memCached.evaluation?.semanticAnalysis?.tokenDiffs &&
      memCached.evaluation.semanticAnalysis.tokenDiffs.length > 0
    ) {
      return {
        isReady: true,
        evaluation: memCached.evaluation,
      };
    }

    // Check DB persistent cache
    const dbCached = await this.cacheModel.findOne({ cacheKey });
    if (
      dbCached &&
      dbCached.isDeepAnalysis &&
      dbCached.evaluation?.semanticAnalysis?.tokenDiffs &&
      dbCached.evaluation.semanticAnalysis.tokenDiffs.length > 0
    ) {
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
    userId?: string,
  ) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return; // Do not mutate database for unauthenticated guest
    }

    setImmediate(async () => {
      try {
        const userObjectId = new Types.ObjectId(userId);
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

        let earnedXp = 0;
        if (evaluation.status === 'correct') {
          earnedXp = 10;
          const isAlreadyCompleted = progress.completedSentences.some((id) => id.equals(sentence._id as Types.ObjectId));
          if (!isAlreadyCompleted) {
            progress.completedSentences.push(sentence._id as Types.ObjectId);
          }
        } else if (evaluation.status === 'almost_correct') {
          earnedXp = 7;
        } else if (evaluation.status === 'missing_info') {
          earnedXp = 4;
        } else {
          earnedXp = 2;
        }

        if (isNewDay) {
          progress.todayXp = earnedXp;
        } else {
          progress.todayXp = (progress.todayXp || 0) + earnedXp;
        }
        progress.xp = (progress.xp || 0) + earnedXp;

        await progress.save();

        // Auto Spaced Repetition (SRS)
        const tag = sentence.grammarAnalysis?.tense || 'General Syntax';
        const existingMistake = await this.mistakeModel.findOne({
          userId: userObjectId,
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
              userId: userObjectId,
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

        // Automatic Weak Vocabulary detection based on learner mistakes/correct words
        if (evaluation.semanticAnalysis?.tokenDiffs && evaluation.semanticAnalysis.tokenDiffs.length > 0) {
          for (const diff of evaluation.semanticAnalysis.tokenDiffs) {
            if (diff.status === 'EXACT_CORRECT' && diff.learnerToken) {
              await this.vocabularyService.recordWordAttempt(userId, diff.learnerToken, true, sentence.textEn);
            } else if (
              ['WRONG_FORM', 'REPLACE_SUGGESTION', 'EXTRA', 'MISSING'].includes(diff.status)
            ) {
              const targetWord = diff.referenceToken || diff.learnerToken;
              if (targetWord) {
                await this.vocabularyService.recordWordAttempt(userId, targetWord, false, sentence.textEn);
              }
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`Failed async progress persistence: ${err.message}`);
      }
    });
  }

  // --- PARAGRAPH EVALUATION (POST-LESSON BOSS CHALLENGE) ---
  // --- PARAGRAPH EVALUATION (POST-LESSON BOSS CHALLENGE) ---
  async evaluateParagraph(dto: EvaluateParagraphDto, userId?: string) {
    let targetSentences: Array<{
      textEn: string;
      primaryTranslationVi: string;
      alternativeTranslations?: string[];
    }> = [];

    if (dto.sentences && dto.sentences.length > 0) {
      targetSentences = dto.sentences.map((s) => ({
        textEn: s.textEn.trim(),
        primaryTranslationVi: s.primaryTranslationVi.trim(),
        alternativeTranslations: s.alternativeTranslations || [],
      }));
    } else {
      try {
        const isObjectId = Types.ObjectId.isValid(dto.lessonId);
        const reading = isObjectId
          ? await this.readingModel.findById(dto.lessonId)
          : await this.readingModel.findOne({ slug: dto.lessonId });

        if (reading) {
          const sList = await this.sentenceModel
            .find({ readingId: reading._id })
            .sort({ paragraphIndex: 1, sentenceIndex: 1 });

          targetSentences = sList.map((s) => ({
            textEn: s.textEn.trim(),
            primaryTranslationVi: s.primaryTranslationVi.trim(),
            alternativeTranslations: s.alternativeTranslations || [],
          }));
        }
      } catch (err: any) {
        this.logger.warn(`Could not load sentences from DB: ${err.message}`);
      }
    }

    let fullEn = dto.fullEn?.trim();
    let fullVi = dto.fullVi?.trim();

    if (targetSentences.length > 0) {
      if (!fullEn) fullEn = targetSentences.map((s) => s.textEn).join(' ');
      if (!fullVi) fullVi = targetSentences.map((s) => s.primaryTranslationVi).join(' ');
    } else {
      // Fallback if no individual sentences provided
      if (!fullEn) fullEn = dto.userParagraph.trim() || 'This is a practice reading lesson.';
      if (!fullVi) fullVi = dto.userParagraph.trim() || 'Đây là một bài học đọc luyện tập.';

      // Split fullEn and fullVi into sentences
      const enSplits = fullEn.split(/(?<=[.!?])\s+/).filter(Boolean);
      const viSplits = fullVi.split(/(?<=[.!?])\s+/).filter(Boolean);
      const maxLen = Math.max(enSplits.length, viSplits.length, 1);

      for (let i = 0; i < maxLen; i++) {
        targetSentences.push({
          textEn: enSplits[i] || enSplits[enSplits.length - 1] || fullEn,
          primaryTranslationVi: viSplits[i] || viSplits[viSplits.length - 1] || fullVi,
        });
      }
    }

    const mode = dto.mode || 'en_to_vi';
    const userTrimmed = dto.userParagraph.trim();
    const targetParagraph = mode === 'vi_to_en' ? fullEn : fullVi;
    const promptText = mode === 'vi_to_en' ? fullVi : fullEn;

    // Split user paragraph into sentences
    const userRawSentences = userTrimmed
      .split(/(?<=[.!?\n])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    // Align user sentences to target sentences
    const alignedUserParts: string[] = [];
    const N = targetSentences.length;

    if (userRawSentences.length === N) {
      for (let i = 0; i < N; i++) {
        alignedUserParts.push(userRawSentences[i]);
      }
    } else if (userRawSentences.length > N) {
      // User has more sentences than target: partition or merge
      const ratio = userRawSentences.length / N;
      for (let i = 0; i < N; i++) {
        const start = Math.floor(i * ratio);
        const end = i === N - 1 ? userRawSentences.length : Math.floor((i + 1) * ratio);
        alignedUserParts.push(userRawSentences.slice(start, end).join(' '));
      }
    } else if (userRawSentences.length > 0) {
      // User has fewer sentences (e.g. 1 long paragraph without period, or missed a sentence)
      // Partition user text by word tokens proportionally to target sentences
      const userWords = userTrimmed.split(/\s+/).filter(Boolean);
      const targetLengths = targetSentences.map(
        (s) => (mode === 'vi_to_en' ? s.textEn : s.primaryTranslationVi).split(/\s+/).length,
      );
      const totalTargetWords = targetLengths.reduce((a, b) => a + b, 0) || 1;

      let currentWordIdx = 0;
      for (let i = 0; i < N; i++) {
        const proportion = targetLengths[i] / totalTargetWords;
        const count = i === N - 1 ? userWords.length - currentWordIdx : Math.round(proportion * userWords.length);
        const chunk = userWords.slice(currentWordIdx, currentWordIdx + Math.max(1, count)).join(' ');
        alignedUserParts.push(chunk);
        currentWordIdx += Math.max(1, count);
      }
    } else {
      for (let i = 0; i < N; i++) {
        alignedUserParts.push('');
      }
    }

    // Evaluate each individual sentence using the EXACT single sentence checking logic!
    const sentenceResults: Array<{
      sentenceIndex: number;
      score: number;
      status: 'correct' | 'almost_correct' | 'incorrect';
      userText: string;
      referenceText: string;
      feedback: string;
      metrics: { meaning: number; grammar: number; vocabulary: number; naturalness: number; completeness: number };
      strengths: string[];
      improvements: string[];
    }> = [];

    for (let i = 0; i < N; i++) {
      const targetUnit = targetSentences[i];
      const userUnit = alignedUserParts[i] || '';
      const refText = mode === 'vi_to_en' ? targetUnit.textEn : targetUnit.primaryTranslationVi;

      const evalUnit = await this.evaluateSingleSentenceCore(userUnit, targetUnit, mode);
      sentenceResults.push({
        sentenceIndex: i + 1,
        score: evalUnit.score,
        status: evalUnit.status,
        userText: userUnit,
        referenceText: refText,
        feedback: evalUnit.overview,
        metrics: evalUnit.metrics,
        strengths: evalUnit.strengths,
        improvements: evalUnit.improvements,
      });
    }

    // Aggregate individual sentence results!
    const totalScore = sentenceResults.reduce((acc, r) => acc + r.score, 0);
    const overallScore = Math.round(totalScore / N);

    const overallMeaning = Math.round(sentenceResults.reduce((acc, r) => acc + r.metrics.meaning, 0) / N);
    const overallGrammar = Math.round(sentenceResults.reduce((acc, r) => acc + r.metrics.grammar, 0) / N);
    const overallVocab = Math.round(sentenceResults.reduce((acc, r) => acc + r.metrics.vocabulary, 0) / N);
    const overallNaturalness = Math.round(sentenceResults.reduce((acc, r) => acc + r.metrics.naturalness, 0) / N);
    const overallCompleteness = Math.round(sentenceResults.reduce((acc, r) => acc + r.metrics.completeness, 0) / N);

    const aggregatedStrengths: string[] = [];
    const aggregatedImprovements: string[] = [];

    sentenceResults.forEach((r) => {
      if (r.score >= 80) {
        aggregatedStrengths.push(`Câu ${r.sentenceIndex}: ${r.feedback}`);
      } else {
        aggregatedImprovements.push(`Câu ${r.sentenceIndex}: ${r.improvements[0] || r.feedback}`);
      }
    });

    if (aggregatedStrengths.length === 0) {
      aggregatedStrengths.push('Đã nỗ lực dịch trọn vẹn toàn bộ đoạn văn');
    }
    if (aggregatedImprovements.length === 0 && overallScore < 95) {
      aggregatedImprovements.push('Văn phong có thể trau chuốt thêm để đạt độ tự nhiên cao hơn');
    }

    const overallStatus: 'correct' | 'almost_correct' | 'incorrect' =
      overallScore >= 80 ? 'correct' : overallScore >= 50 ? 'almost_correct' : 'incorrect';

    const overview =
      overallScore >= 95
        ? 'Tuyệt đỉnh! Toàn bộ các câu trong bài đều được dịch xuất sắc và chuẩn xác 100%.'
        : overallScore >= 80
        ? `Rất tốt! Bạn đạt ${overallScore}/100 điểm tổng kết toàn bài đọc.`
        : overallScore >= 50
        ? `Khá ổn! Đạt ${overallScore}/100 điểm, hãy xem chi tiết từng câu bên dưới để cải thiện.`
        : `Cần luyện thêm! Đạt ${overallScore}/100 điểm, hãy chú ý đối chiếu từng câu với bài mẫu.`;

    // Award 50 XP bonus asynchronously if user is logged in
    if (userId && Types.ObjectId.isValid(userId)) {
      this.awardParagraphXpAsync(userId);
    }

    return {
      score: overallScore,
      status: overallStatus,
      overview,
      metrics: {
        meaning: overallMeaning,
        grammar: overallGrammar,
        vocabulary: overallVocab,
        naturalness: overallNaturalness,
        completeness: overallCompleteness,
      },
      strengths: aggregatedStrengths,
      improvements: aggregatedImprovements,
      promptText,
      referenceParagraph: targetParagraph,
      xpBonus: 50,
      mode,
      sentenceResults: sentenceResults.map((r) => ({
        sentenceIndex: r.sentenceIndex,
        userText: r.userText,
        referenceText: r.referenceText,
        score: r.score,
        status: r.status,
        feedback: r.feedback,
        metrics: r.metrics,
        strengths: r.strengths,
        improvements: r.improvements,
      })),
    };
  }

  private async evaluateSingleSentenceCore(
    userText: string,
    sentence: {
      textEn: string;
      primaryTranslationVi: string;
      alternativeTranslations?: string[];
      grammarAnalysis?: any;
      tokens?: any;
    },
    mode: 'en_to_vi' | 'vi_to_en',
  ): Promise<{
    score: number;
    status: 'correct' | 'almost_correct' | 'incorrect';
    metrics: { meaning: number; grammar: number; vocabulary: number; naturalness: number; completeness: number };
    overview: string;
    strengths: string[];
    improvements: string[];
  }> {
    const userTrimmed = userText.trim();
    const evalInput: EvaluationInput = {
      sentenceEn: sentence.textEn,
      userTranslationVi: userTrimmed,
      referenceTranslationVi: sentence.primaryTranslationVi,
      alternativeTranslations: sentence.alternativeTranslations,
      grammarAnalysis: sentence.grammarAnalysis,
      tokens: sentence.tokens,
      mode,
    };

    let evalResult: EvaluationResult;
    try {
      evalResult = await this.mockProvider.evaluateTranslation(evalInput);
    } catch {
      // Local semantic analyzer fallback
      const target = mode === 'vi_to_en' ? sentence.textEn : sentence.primaryTranslationVi;
      const analysis = SemanticAnalyzer.analyzeTokens(userTrimmed, target);
      evalResult = {
        score: analysis.overallStatus === 'EXACT_MATCH' ? 100 : analysis.overallStatus === 'SEMANTICALLY_CORRECT' ? 95 : 70,
        status: analysis.overallStatus === 'EXACT_MATCH' || analysis.overallStatus === 'SEMANTICALLY_CORRECT' ? 'correct' : 'almost_correct',
        semantic_similarity: 0.9,
        overview: 'Đã phân tích ngữ nghĩa câu dịch.',
        explanation: 'Khớp ngữ nghĩa cốt lõi.',
        whatYouGotRight: ['Hiểu được ý chính câu'],
        specificMistakes: [],
        missing_information: [],
        extra_information: [],
        semanticAnalysis: analysis,
      };
    }

    const scores = evalResult.semanticAnalysis?.scores;
    const meaning = scores?.semanticMeaning ?? evalResult.score;
    const grammar = scores?.grammarAccuracy ?? evalResult.score;
    const vocab = scores?.wordAccuracy ?? evalResult.score;
    const naturalness = scores?.naturalness ?? evalResult.score;
    const completeness = scores?.completeness ?? evalResult.score;

    const strengths: string[] =
      evalResult.whatYouGotRight && evalResult.whatYouGotRight.length > 0
        ? evalResult.whatYouGotRight
        : [evalResult.overview || 'Dịch đúng cấu trúc và ý nghĩa'];

    const improvements: string[] = [];
    if (evalResult.specificMistakes && evalResult.specificMistakes.length > 0) {
      evalResult.specificMistakes.forEach((m) => {
        if (m.whyIncorrect) improvements.push(m.whyIncorrect);
        else if (m.howToFix) improvements.push(m.howToFix);
      });
    }
    if (evalResult.missing_information && evalResult.missing_information.length > 0) {
      improvements.push(...evalResult.missing_information);
    }
    if (improvements.length === 0 && evalResult.score < 90) {
      improvements.push('Cần chú ý trau chuốt cấu trúc từ vựng để câu tự nhiên hơn');
    }

    const normStatus: 'correct' | 'almost_correct' | 'incorrect' =
      evalResult.status === 'correct'
        ? 'correct'
        : evalResult.status === 'almost_correct'
        ? 'almost_correct'
        : 'incorrect';

    return {
      score: evalResult.score,
      status: normStatus,
      metrics: {
        meaning: Math.round(meaning),
        grammar: Math.round(grammar),
        vocabulary: Math.round(vocab),
        naturalness: Math.round(naturalness),
        completeness: Math.round(completeness),
      },
      overview: evalResult.overview || evalResult.explanation || 'Đã phân tích câu dịch.',
      strengths,
      improvements,
    };
  }

  private awardParagraphXpAsync(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    this.progressModel
      .findOne({ userId: userObjectId })
      .then((progress) => {
        if (progress) {
          const { streakCount, isNewDay } = this.calculateStreak(progress.lastActiveDate, progress.streakCount);
          progress.streakCount = streakCount;
          progress.lastActiveDate = new Date();
          progress.xp += 50;
          if (isNewDay) {
            progress.todayXp = 50;
          } else {
            progress.todayXp = (progress.todayXp || 0) + 50;
          }
          progress.save().catch(() => {});
        }
      })
      .catch(() => {});
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
