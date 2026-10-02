import { Injectable, Logger } from '@nestjs/common';
import {
  EvaluationInput,
  EvaluationResult,
  IAIEvaluator,
  SpecificMistake,
  GrammarInsight,
  CompleteSentenceMemorize,
} from '../ai.interface';

@Injectable()
export class MockAIProvider implements IAIEvaluator {
  public readonly name = 'MockLocalProvider';
  private readonly logger = new Logger(MockAIProvider.name);

  isAvailable(): boolean {
    return true;
  }

  async evaluateTranslation(input: EvaluationInput): Promise<EvaluationResult> {
    const isViToEn = input.mode === 'vi_to_en';

    if (isViToEn) {
      return this.evaluateViToEn(input);
    } else {
      return this.evaluateEnToVi(input);
    }
  }

  // --- VI -> EN EVALUATION ---
  private evaluateViToEn(input: EvaluationInput): Promise<EvaluationResult> {
    const userClean = this.normalize(input.userTranslationVi); // In vi_to_en, this contains user's English
    const targetEnClean = this.normalize(input.sentenceEn);
    const sentenceEn = input.sentenceEn.trim();
    const refVi = input.referenceTranslationVi.trim();

    const tenseName = input.grammarAnalysis?.tense || 'Cấu trúc câu chuẩn';
    const tenseExpl =
      input.grammarAnalysis?.tenseExplanationVi ||
      'Sử dụng đúng thì và trật tự từ vựng theo văn phong tiếng Anh.';

    const defaultGrammarInsight: GrammarInsight = {
      relevantRule: tenseName,
      whyThisStructure: tenseExpl,
      comparisonOrContrast:
        'Trật tự câu tiếng Anh tiêu chuẩn: S + V + O + (Trạng ngữ nơi chốn) + (Trạng ngữ thời gian).',
    };

    const keyPoints: string[] = [];
    if (input.grammarAnalysis?.components && input.grammarAnalysis.components.length > 0) {
      input.grammarAnalysis.components.forEach((c: any) => {
        if (c.role && c.text) {
          keyPoints.push(`${c.role}: "${c.text}"`);
        }
      });
    }
    if (keyPoints.length === 0) {
      keyPoints.push(`Trọng tâm: ${tenseName}`);
    }

    const defaultMemorize: CompleteSentenceMemorize = {
      textEn: sentenceEn,
      translationVi: refVi,
      keyPoints: keyPoints.slice(0, 3),
    };

    // 1. Exact match with target English sentence
    if (userClean === targetEnClean) {
      return Promise.resolve({
        score: 100,
        status: 'correct',
        semantic_similarity: 1.0,
        overview: 'Tuyệt đỉnh! Bạn viết câu tiếng Anh hoàn toàn chuẩn xác và chuẩn ngữ pháp.',
        explanation: 'Câu viết đúng chính tả, đúng thì và đúng trật tự từ tiếng Anh.',
        whatYouGotRight: [
          'Chính xác cấu trúc câu và thì động từ',
          'Sử dụng đúng từ vựng và giới từ liên kết',
          'Ngữ pháp và chính tả chuẩn 100%',
        ],
        specificMistakes: [],
        grammarInsight: defaultGrammarInsight,
        completeSentenceMemorize: defaultMemorize,
        missing_information: [],
        extra_information: [],
      });
    }

    // 2. Empty check
    const userWords = userClean.split(/\s+/).filter(Boolean);
    const targetWords = targetEnClean.split(/\s+/).filter(Boolean);

    if (userWords.length === 0) {
      return Promise.resolve({
        score: 0,
        status: 'incorrect',
        semantic_similarity: 0.0,
        overview: 'Bạn chưa nhập câu tiếng Anh.',
        explanation: 'Hãy thử viết câu tiếng Anh tương ứng với câu tiếng Việt được cho.',
        whatYouGotRight: [],
        specificMistakes: [
          {
            errorType: 'missing_info',
            where: 'Chưa nhập câu',
            relatedEnglish: sentenceEn,
            correctMeaning: refVi,
            whyIncorrect: 'Cần nhập câu tiếng Anh để Tuantaidz AI chấm điểm.',
            howToFix: `Viết: "${sentenceEn}"`,
            fixedSnippet: sentenceEn,
          },
        ],
        grammarInsight: defaultGrammarInsight,
        completeSentenceMemorize: defaultMemorize,
        missing_information: ['Chưa nhập nội dung.'],
        extra_information: [],
      });
    }

    // 3. Heuristic checks for English
    const whatYouGotRight: string[] = [];
    const specificMistakes: SpecificMistake[] = [];
    const missingInfo: string[] = [];

    // Check key English tokens
    const tokens: any[] = input.tokens || [];
    let matchedTokens = 0;
    const missingKeyTokens: string[] = [];

    for (const t of tokens) {
      const tNorm = this.normalize(t.text || '');
      if (tNorm.length > 2) {
        if (userClean.includes(tNorm)) {
          matchedTokens++;
        } else {
          missingKeyTokens.push(t.text);
        }
      }
    }

    if (matchedTokens > 0) {
      whatYouGotRight.push(`Đã sử dụng đúng các từ vựng cốt lõi của câu (${matchedTokens} từ)`);
    }

    // Check missing critical keywords
    if (missingKeyTokens.length > 0 && missingKeyTokens.length <= 3) {
      const miss = missingKeyTokens[0];
      const tokenObj = tokens.find((t) => t.text === miss);
      specificMistakes.push({
        errorType: 'missing_info',
        where: `Thiếu từ vựng quan trọng: "${miss}"`,
        relatedEnglish: miss,
        correctMeaning: tokenObj?.meaningVi || miss,
        whyIncorrect: `Từ "${miss}" là một thành phần mang nghĩa quan trọng của câu.`,
        howToFix: `Bổ sung từ "${miss}" vào đúng vị trí trong câu.`,
        fixedSnippet: sentenceEn,
      });
      missingInfo.push(`Thiếu từ: "${miss}"`);
    }

    // Check Capitalization & Punctuation
    const rawInput = input.userTranslationVi.trim();
    if (rawInput.length > 0 && rawInput[0] !== rawInput[0].toUpperCase()) {
      specificMistakes.push({
        errorType: 'unnatural_phrasing',
        where: 'Chữ cái đầu câu',
        relatedEnglish: rawInput.slice(0, 10),
        correctMeaning: sentenceEn.slice(0, 10),
        whyIncorrect: 'Trong tiếng Anh chuẩn, chữ cái đầu câu luôn phải viết hoa.',
        howToFix: `Viết hoa chữ "${rawInput[0].toUpperCase()}" ở đầu câu.`,
        fixedSnippet: sentenceEn,
      });
    }

    // Calculate word overlap & Levenshtein
    let overlapCount = 0;
    for (const tw of targetWords) {
      if (userWords.includes(tw)) {
        overlapCount++;
      }
    }
    const overlapRatio = overlapCount / Math.max(targetWords.length, 1);
    const levSim = this.levenshteinSimilarity(userClean, targetEnClean);
    let baseScore = Math.round((overlapRatio * 0.65 + levSim * 0.35) * 100);

    let status: 'correct' | 'almost_correct' | 'missing_info' | 'partially_incorrect' | 'incorrect';
    let overview: string;
    let explanation: string;

    if (baseScore >= 85 || specificMistakes.length === 0) {
      status = 'correct';
      baseScore = Math.max(baseScore, 88);
      overview = 'Rất chuẩn! Câu tiếng Anh của bạn rất chính xác và tự nhiên.';
      explanation = 'Bạn đã nắm vững từ vựng và ngữ pháp của câu này.';
      if (whatYouGotRight.length === 0) {
        whatYouGotRight.push('Diễn đạt đúng ngữ pháp và từ vựng chuẩn');
      }
    } else if (baseScore >= 70) {
      status = 'almost_correct';
      baseScore = Math.max(baseScore, 74);
      overview = 'Rất gần với đáp án chuẩn! Chỉ cần sửa một vài chi tiết nhỏ.';
      explanation = 'Ý câu hoàn toàn đúng, chú ý thêm cách dùng từ hoặc chính tả.';
      if (whatYouGotRight.length === 0) {
        whatYouGotRight.push('Nắm vững cấu trúc câu chính');
      }
    } else if (baseScore >= 45) {
      status = 'missing_info';
      baseScore = Math.max(baseScore, 55);
      overview = 'Bạn đã nắm được một phần câu nhưng còn thiếu từ vựng quan trọng.';
      explanation = `Hãy xem câu mẫu: "${sentenceEn}" để hoàn thiện hơn.`;
    } else {
      status = 'incorrect';
      baseScore = Math.min(baseScore, 35);
      overview = 'Câu tiếng Anh chưa chính xác so với ý câu tiếng Việt.';
      explanation = 'Đừng lo! Hãy xem đáp án mẫu và phân tích ngữ pháp bên dưới để ghi nhớ nhé.';
    }

    if (status !== 'correct' && specificMistakes.length === 0) {
      specificMistakes.push({
        errorType: 'unnatural_phrasing',
        where: 'Cấu trúc câu',
        relatedEnglish: sentenceEn,
        correctMeaning: refVi,
        whyIncorrect: 'Trật tự từ hoặc cách dùng thì chưa hoàn toàn chuẩn xác.',
        howToFix: `Câu chuẩn mẫu: "${sentenceEn}"`,
        fixedSnippet: sentenceEn,
      });
    }

    return Promise.resolve({
      score: baseScore,
      status,
      semantic_similarity: Number((baseScore / 100).toFixed(2)),
      overview,
      explanation,
      whatYouGotRight,
      specificMistakes,
      grammarInsight: defaultGrammarInsight,
      completeSentenceMemorize: defaultMemorize,
      missing_information: missingInfo.slice(0, 3),
      extra_information: [],
    });
  }

  // --- EN -> VI EVALUATION ---
  private evaluateEnToVi(input: EvaluationInput): Promise<EvaluationResult> {
    const userClean = this.normalize(input.userTranslationVi);
    const refClean = this.normalize(input.referenceTranslationVi);
    const sentenceEn = input.sentenceEn.trim();
    const refVi = input.referenceTranslationVi.trim();

    const tenseName = input.grammarAnalysis?.tense || 'Cấu trúc câu tiếng Anh';
    const tenseExpl =
      input.grammarAnalysis?.tenseExplanationVi ||
      'Giúp diễn đạt trọn vẹn ngữ cảnh và trật tự ý trong câu.';

    const defaultGrammarInsight: GrammarInsight = {
      relevantRule: tenseName,
      whyThisStructure: tenseExpl,
      comparisonOrContrast:
        'Chú ý trật tự từ: trong tiếng Anh, trạng từ thời gian/nơi chốn thường đứng cuối câu hoặc đầu câu.',
    };

    const keyPoints: string[] = [];
    if (input.grammarAnalysis?.components && input.grammarAnalysis.components.length > 0) {
      input.grammarAnalysis.components.forEach((c: any) => {
        if (c.role && c.text) {
          keyPoints.push(`${c.role}: "${c.text}" ${c.noteVi ? `(${c.noteVi})` : ''}`);
        }
      });
    } else if (input.tokens && input.tokens.length > 0) {
      input.tokens.slice(0, 3).forEach((t: any) => {
        keyPoints.push(`"${t.text}": ${t.meaningVi || t.pos}`);
      });
    }
    if (keyPoints.length === 0) {
      keyPoints.push(`Cấu trúc chính: ${tenseName}`);
    }

    const defaultMemorize: CompleteSentenceMemorize = {
      textEn: sentenceEn,
      translationVi: refVi,
      keyPoints: keyPoints.slice(0, 3),
    };

    // 1. Exact match with primary reference
    if (userClean === refClean) {
      return Promise.resolve({
        score: 100,
        status: 'correct',
        semantic_similarity: 1.0,
        overview: 'Tuyệt vời! Bạn đã dịch hoàn toàn chính xác và tự nhiên.',
        explanation: 'Bản dịch chuẩn xác cả về ngữ nghĩa, thì và ngữ cảnh diễn đạt.',
        whatYouGotRight: [
          'Dịch chuẩn xác chủ ngữ và hành động',
          'Nắm vững thì và ngữ cảnh diễn đạt',
          'Cách dùng từ tiếng Việt rất tự nhiên và mạch lạc',
        ],
        specificMistakes: [],
        grammarInsight: defaultGrammarInsight,
        completeSentenceMemorize: defaultMemorize,
        missing_information: [],
        extra_information: [],
      });
    }

    // 2. Check alternative translations
    if (input.alternativeTranslations && input.alternativeTranslations.length > 0) {
      for (const alt of input.alternativeTranslations) {
        if (this.normalize(alt) === userClean) {
          return Promise.resolve({
            score: 98,
            status: 'correct',
            semantic_similarity: 0.98,
            overview: 'Rất tốt! Bạn đã sử dụng một cách diễn đạt tương đương rất tự nhiên.',
            explanation: `Bản dịch đúng nghĩa tương đương với: "${alt}".`,
            whatYouGotRight: [
              'Hiểu đúng ý nghĩa cốt lõi của câu',
              'Sử dụng lối diễn đạt tiếng Việt linh hoạt và chuẩn xác',
            ],
            specificMistakes: [],
            grammarInsight: defaultGrammarInsight,
            completeSentenceMemorize: defaultMemorize,
            missing_information: [],
            extra_information: [],
            isCachedAlternative: true,
          });
        }
      }
    }

    // 3. Empty input handling
    const userWords = userClean.split(/\s+/).filter(Boolean);
    const refWords = refClean.split(/\s+/).filter(Boolean);

    if (userWords.length === 0) {
      return Promise.resolve({
        score: 0,
        status: 'incorrect',
        semantic_similarity: 0.0,
        overview: 'Bạn chưa nhập câu trả lời.',
        explanation: 'Hãy thử suy nghĩ và tự gõ bản dịch tiếng Việt trước khi xem gợi ý.',
        whatYouGotRight: [],
        specificMistakes: [
          {
            errorType: 'missing_info',
            where: 'Chưa có nội dung dịch',
            relatedEnglish: sentenceEn,
            correctMeaning: refVi,
            whyIncorrect: 'Cần nhập bản dịch để hệ thống phân tích và chỉ ra điểm cần cải thiện.',
            howToFix: `Dịch câu sang tiếng Việt theo ngữ cảnh.`,
            fixedSnippet: refVi,
          },
        ],
        grammarInsight: defaultGrammarInsight,
        completeSentenceMemorize: defaultMemorize,
        missing_information: ['Chưa nhập câu trả lời.'],
        extra_information: [],
      });
    }

    // 4. Detailed Component & Semantic Analysis
    const components: any[] = input.grammarAnalysis?.components || [];
    const tokens: any[] = input.tokens || [];

    const whatYouGotRight: string[] = [];
    const specificMistakes: SpecificMistake[] = [];
    const missingInfo: string[] = [];

    // Analyze Subject
    const subjectComp = components.find((c) => c.role?.toLowerCase().includes('subject'));
    let subjectMatched = false;
    if (subjectComp) {
      const subjKeywords = this.extractKeywords(subjectComp.text, subjectComp.noteVi, tokens);
      subjectMatched = subjKeywords.some((kw) => userClean.includes(kw));
      if (subjectMatched) {
        whatYouGotRight.push(`Chủ thể: đã xác định đúng "${subjectComp.text}"`);
      } else {
        specificMistakes.push({
          errorType: 'wrong_subject_object',
          where: `Chưa xác định đúng chủ thể ("${subjectComp.text}")`,
          relatedEnglish: subjectComp.text,
          correctMeaning: this.findTokenMeaning(subjectComp.text, tokens) || subjectComp.noteVi || 'chủ ngữ',
          whyIncorrect: 'Chủ thể thực hiện hành động chưa được thể hiện rõ ràng trong bản dịch.',
          howToFix: `Làm rõ ai là người thực hiện hành động trong câu.`,
          fixedSnippet: refVi,
        });
      }
    }

    // Analyze Verb / Main Action
    const verbComp = components.find((c) => c.role?.toLowerCase().includes('verb'));
    let verbMatched = false;
    if (verbComp) {
      const verbKeywords = this.extractKeywords(verbComp.text, verbComp.noteVi, tokens);
      verbMatched = verbKeywords.some((kw) => userClean.includes(kw));
      if (verbMatched) {
        whatYouGotRight.push(`Hành động chính: đã nhận ra hành động "${verbComp.text}"`);
      } else {
        specificMistakes.push({
          errorType: 'wrong_meaning',
          where: `Động từ / hành động chính ("${verbComp.text}")`,
          relatedEnglish: verbComp.text,
          correctMeaning: this.findTokenMeaning(verbComp.text, tokens) || verbComp.noteVi || 'hành động chính',
          whyIncorrect: 'Dịch chưa sát nghĩa động từ cốt lõi của câu.',
          howToFix: `Xem lại nghĩa của động từ "${verbComp.text}" trong ngữ cảnh này.`,
          fixedSnippet: refVi,
        });
      }
    }

    // Calculate word overlap and Levenshtein similarity
    let matchCount = 0;
    const missingWords: string[] = [];
    const stopWords = ['và', 'của', 'là', 'có', 'ở', 'được', 'bị', 'cho', 'một', 'các', 'những'];

    for (const w of refWords) {
      if (userWords.includes(w)) {
        matchCount++;
      } else if (!stopWords.includes(w) && w.length > 2) {
        missingWords.push(w);
      }
    }

    const overlapRatio = matchCount / Math.max(refWords.length, 1);
    const levSim = this.levenshteinSimilarity(userClean, refClean);
    const baseScore = Math.round((overlapRatio * 0.6 + levSim * 0.4) * 100);

    let status: 'correct' | 'almost_correct' | 'missing_info' | 'partially_incorrect' | 'incorrect';
    let score = baseScore;
    let overview: string;
    let explanation: string;

    if (baseScore >= 82 || (subjectMatched && verbMatched && specificMistakes.length === 0)) {
      status = 'correct';
      score = Math.max(score, 88);
      overview = 'Bản dịch chính xác và đúng ngữ cảnh!';
      explanation = 'Bạn đã nắm trọn vẹn ý nghĩa của câu. Cách diễn đạt rất tự nhiên.';
      if (whatYouGotRight.length === 0) {
        whatYouGotRight.push('Dịch đúng đại ý và cấu trúc câu');
      }
    } else if (baseScore >= 68) {
      status = 'almost_correct';
      score = Math.max(score, 72);
      overview = 'Bạn đã hiểu đúng ý chính, diễn đạt rất gần với đáp án chuẩn!';
      explanation = 'Chỉ cần tinh chỉnh thêm một vài từ để câu văn mượt mà hơn.';
      if (whatYouGotRight.length === 0) {
        whatYouGotRight.push('Hiểu đúng nội dung chính của câu');
      }
    } else if (subjectMatched || verbMatched || baseScore >= 40) {
      status = 'partially_incorrect';
      score = Math.min(Math.max(score, 45), 65);
      overview = 'Bạn đã nắm được một phần câu, nhưng chưa diễn đạt đầy đủ các thành phần.';
      explanation = 'Cần xem lại nghĩa của từ vựng và thì của động từ trong câu.';
    } else {
      status = 'incorrect';
      score = Math.min(score, 30);
      overview = 'Bản dịch chưa đúng nghĩa hoặc hiểu nhầm ý của câu gốc.';
      explanation = 'Đừng nản lòng! Hãy xem lại phân tích từ vựng và cấu trúc ngữ pháp bên dưới nhé.';
    }

    if (whatYouGotRight.length === 0) {
      if (userWords.length > 0) {
        whatYouGotRight.push('Đã tích cực tự suy nghĩ và nhập câu trả lời');
      }
    }

    if (status !== 'correct' && specificMistakes.length === 0) {
      specificMistakes.push({
        errorType: 'unnatural_phrasing',
        where: 'Cách diễn đạt câu dịch',
        relatedEnglish: sentenceEn,
        correctMeaning: refVi,
        whyIncorrect: 'Cách dùng từ chưa thực sự tự nhiên theo ngữ cảnh tiếng Việt.',
        howToFix: `Tham khảo cách diễn đạt tự nhiên hơn: "${refVi}".`,
        fixedSnippet: refVi,
      });
    }

    return Promise.resolve({
      score,
      status,
      semantic_similarity: Number((score / 100).toFixed(2)),
      overview,
      explanation,
      whatYouGotRight,
      specificMistakes,
      grammarInsight: defaultGrammarInsight,
      completeSentenceMemorize: defaultMemorize,
      missing_information: missingInfo.slice(0, 3),
      extra_information: [],
    });
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[.,?!:;"'()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractKeywords(text?: string, note?: string, tokens?: any[]): string[] {
    const kws: string[] = [];
    if (text) {
      const clean = this.normalize(text);
      clean.split(/\s+/).forEach((w) => {
        if (w.length > 1) kws.push(w);
      });
    }
    if (tokens && text) {
      const matchToken = tokens.find(
        (t) => t.text?.toLowerCase() === text.toLowerCase() || text.toLowerCase().includes(t.text?.toLowerCase()),
      );
      if (matchToken && matchToken.meaningVi) {
        const viClean = this.normalize(matchToken.meaningVi);
        viClean.split(/\s+/).forEach((w) => {
          if (w.length > 1) kws.push(w);
        });
      }
    }
    if (note) {
      const matches = note.match(/['"](.*?)['"]/g);
      if (matches) {
        matches.forEach((m) => {
          const c = this.normalize(m);
          if (c) kws.push(c);
        });
      }
    }
    return Array.from(new Set(kws));
  }

  private findTokenMeaning(text: string, tokens: any[]): string {
    const lower = text.toLowerCase();
    const token = tokens.find((t) => t.text?.toLowerCase() === lower);
    return token?.meaningVi || '';
  }

  private levenshteinSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }
}
