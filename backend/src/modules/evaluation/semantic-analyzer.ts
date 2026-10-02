import {
  SemanticEvaluationData,
  SemanticTokenDiff,
  SemanticAlternative,
  SemanticTokenStatus,
  SpecificMistake,
} from '../ai/ai.interface';

export class SemanticAnalyzer {
  // Common semantic equivalents & paraphrases map
  private static readonly EQUIVALENTS_MAP: Record<string, { ref: string; note: string; contextDiff?: string }[]> = {
    called: [
      {
        ref: 'named',
        note: '"called" là cách diễn đạt hoàn toàn tự nhiên và rất phổ biến trong giao tiếp hàng ngày.',
        contextDiff: '"called" tự nhiên trong hội thoại; "named" trang trọng hoặc xác định rõ ràng danh xưng.',
      },
    ],
    named: [
      {
        ref: 'called',
        note: '"named" nêu rõ danh tính của người/vật; "called" cũng tương đương hoàn toàn và tự nhiên trong giao tiếp.',
      },
    ],
    own: [
      {
        ref: 'have',
        note: '"own" mang nghĩa sở hữu chính xác, tương đương "have" trong ngữ cảnh nói về thú cưng/vật nuôi.',
      },
    ],
    start: [{ ref: 'begin', note: 'Hai từ hoàn toàn tương đương trong ngữ cảnh bắt đầu hành động.' }],
    begin: [{ ref: 'start', note: 'Hai từ hoàn toàn tương đương trong ngữ cảnh bắt đầu hành động.' }],
    delicious: [{ ref: 'tasty', note: '"delicious" và "tasty" đều diễn tả đồ ăn ngon, "delicious" có sắc thái khen ngợi mạnh hơn.' }],
    kids: [{ ref: 'children', note: '"kids" rất tự nhiên trong văn nói thường ngày; "children" trang trọng hơn.' }],
    exhausted: [{ ref: 'tired', note: '"exhausted" (kiệt sức) nhấn mạnh mức độ mệt mỏi mạnh hơn "tired".' }],
    really: [{ ref: 'very', note: '"really" rất tự nhiên trong văn phong nói; "very" mang tính trung tính.' }],
    healthy: [{ ref: 'wholesome', note: 'Đều chỉ thực phẩm lành mạnh, tốt cho sức khỏe.' }],
    it: [
      {
        ref: 'he',
        note: '"It" và "He" đều chuẩn khi nói về thú cưng. "He" mang sắc thái thân thiết; "It" đúng chuẩn ngữ pháp.',
      },
      {
        ref: 'she',
        note: '"It" và "She" đều chuẩn khi nói về thú cưng. "She" mang sắc thái thân thiết; "It" đúng chuẩn ngữ pháp.',
      },
    ],
    he: [
      {
        ref: 'it',
        note: '"He" và "It" đều có thể dùng để nói về vật nuôi.',
      },
    ],
    she: [
      {
        ref: 'it',
        note: '"She" và "It" đều có thể dùng để nói về vật nuôi.',
      },
    ],
  };

  /**
   * Normalizes word for matching (removes punctuation, lowercases)
   */
  private static cleanWord(w: string): string {
    return (w || '').toLowerCase().replace(/[.,!?;:()"'`]/g, '').trim();
  }

  /**
   * Checks if two words are semantically equivalent
   */
  public static checkEquivalent(
    learnerWord: string,
    refWord: string
  ): { isEquivalent: boolean; note?: string; contextDiff?: string } {
    const lClean = this.cleanWord(learnerWord);
    const rClean = this.cleanWord(refWord);

    if (lClean === rClean) {
      return { isEquivalent: true };
    }

    const matches = this.EQUIVALENTS_MAP[lClean];
    if (matches) {
      const match = matches.find((m) => m.ref === rClean);
      if (match) {
        return { isEquivalent: true, note: match.note, contextDiff: match.contextDiff };
      }
    }

    const reverseMatches = this.EQUIVALENTS_MAP[rClean];
    if (reverseMatches) {
      const match = reverseMatches.find((m) => m.ref === lClean);
      if (match) {
        return { isEquivalent: true, note: match.note, contextDiff: match.contextDiff };
      }
    }

    return { isEquivalent: false };
  }

  /**
   * Performs fine-grained token alignment between learner sentence and reference sentence
   */
  public static analyzeTokens(
    learnerSentence: string,
    referenceSentence: string
  ): {
    tokenDiffs: SemanticTokenDiff[];
    alternatives: SemanticAlternative[];
    missingElements: Array<{ word: string; positionHint: string; whyNeeded: string }>;
    specificMistakes: SpecificMistake[];
    scores: {
      semanticMeaning: number;
      grammarAccuracy: number;
      wordAccuracy: number;
      naturalness: number;
      completeness: number;
    };
    overallStatus: 'EXACT_MATCH' | 'SEMANTICALLY_CORRECT' | 'PARTIALLY_CORRECT' | 'NEEDS_CORRECTION';
    naturalnessNote?: string;
  } {
    const learnerRawTokens = learnerSentence.trim().split(/\s+/).filter(Boolean);
    const refRawTokens = referenceSentence.trim().split(/\s+/).filter(Boolean);

    const tokenDiffs: SemanticTokenDiff[] = [];
    const alternatives: SemanticAlternative[] = [];
    const missingElements: Array<{ word: string; positionHint: string; whyNeeded: string }> = [];
    const specificMistakes: SpecificMistake[] = [];

    // Detect specific common grammatical patterns in learner sentence
    const learnerLower = learnerSentence.toLowerCase();

    // Dynamic Programming (Needleman-Wunsch / LCS) Sequence Alignment
    const m = learnerRawTokens.length;
    const n = refRawTokens.length;

    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    const bt: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      dp[i][0] = dp[i - 1][0] - 1.0;
      bt[i][0] = 2; // learner extra
    }
    for (let j = 1; j <= n; j++) {
      dp[0][j] = dp[0][j - 1] - 1.0;
      bt[0][j] = 3; // ref missing
    }

    for (let i = 1; i <= m; i++) {
      const lClean = this.cleanWord(learnerRawTokens[i - 1]);
      for (let j = 1; j <= n; j++) {
        const rClean = this.cleanWord(refRawTokens[j - 1]);

        let matchScore = -1.2;
        if (lClean === rClean) {
          matchScore = 3.0;
        } else if (this.checkEquivalent(lClean, rClean).isEquivalent) {
          matchScore = 2.6;
        }

        const scoreDiag = dp[i - 1][j - 1] + matchScore;
        const scoreLearnerExtra = dp[i - 1][j] - 1.0;
        const scoreRefMissing = dp[i][j - 1] - 1.0;

        if (scoreDiag >= scoreLearnerExtra && scoreDiag >= scoreRefMissing) {
          dp[i][j] = scoreDiag;
          bt[i][j] = 1;
        } else if (scoreLearnerExtra >= scoreRefMissing) {
          dp[i][j] = scoreLearnerExtra;
          bt[i][j] = 2;
        } else {
          dp[i][j] = scoreRefMissing;
          bt[i][j] = 3;
        }
      }
    }

    // Backtrack to extract aligned operations
    let i = m;
    let j = n;
    interface AlignStep {
      type: 'exact' | 'equiv' | 'mismatch' | 'learner_extra' | 'ref_missing';
      lIdx?: number;
      rIdx?: number;
    }
    const steps: AlignStep[] = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && bt[i][j] === 1) {
        const lClean = this.cleanWord(learnerRawTokens[i - 1]);
        const rClean = this.cleanWord(refRawTokens[j - 1]);
        if (lClean === rClean) {
          steps.push({ type: 'exact', lIdx: i - 1, rIdx: j - 1 });
        } else if (this.checkEquivalent(lClean, rClean).isEquivalent) {
          steps.push({ type: 'equiv', lIdx: i - 1, rIdx: j - 1 });
        } else {
          steps.push({ type: 'mismatch', lIdx: i - 1, rIdx: j - 1 });
        }
        i--;
        j--;
      } else if (i > 0 && (j === 0 || bt[i][j] === 2)) {
        steps.push({ type: 'learner_extra', lIdx: i - 1 });
        i--;
      } else {
        steps.push({ type: 'ref_missing', rIdx: j - 1 });
        j--;
      }
    }

    steps.reverse();

    let exactMatches = 0;
    let equivalentMatches = 0;
    let incorrectCount = 0;

    for (const step of steps) {
      if (step.type === 'exact' && step.lIdx !== undefined && step.rIdx !== undefined) {
        const lRaw = learnerRawTokens[step.lIdx];
        const rRaw = refRawTokens[step.rIdx];
        tokenDiffs.push({
          learnerToken: lRaw,
          referenceToken: rRaw,
          status: 'EXACT_CORRECT',
        });
        exactMatches++;
      } else if (step.type === 'equiv' && step.lIdx !== undefined && step.rIdx !== undefined) {
        const lRaw = learnerRawTokens[step.lIdx];
        const rRaw = refRawTokens[step.rIdx];
        const eqCheck = this.checkEquivalent(lRaw, rRaw);
        tokenDiffs.push({
          learnerToken: lRaw,
          referenceToken: rRaw,
          status: 'SEMANTICALLY_CORRECT',
          explanation: eqCheck.note,
          alternativeTo: rRaw,
          relation: `${lRaw} ≈ ${rRaw}`,
        });
        alternatives.push({
          learnerExpression: lRaw,
          referenceExpression: rRaw,
          relationship: `${lRaw} ≈ ${rRaw}`,
          noteVi: eqCheck.note || `Từ "${lRaw}" diễn đạt tương đương hoàn toàn tự nhiên.`,
          contextDifference: eqCheck.contextDiff,
        });
        equivalentMatches++;
      } else if (step.type === 'mismatch' && step.lIdx !== undefined && step.rIdx !== undefined) {
        const lRaw = learnerRawTokens[step.lIdx];
        const rRaw = refRawTokens[step.rIdx];
        tokenDiffs.push({
          learnerToken: lRaw,
          referenceToken: rRaw,
          status: 'INCORRECT',
          explanation: `Từ "${lRaw}" khác với từ "${rRaw}" trong câu mẫu.`,
        });
        specificMistakes.push({
          errorType: 'unnatural_phrasing',
          where: lRaw,
          relatedEnglish: rRaw,
          correctMeaning: rRaw,
          whyIncorrect: `Trong câu mẫu sử dụng "${rRaw}".`,
          howToFix: `Dùng "${rRaw}" thay cho "${lRaw}".`,
          fixedSnippet: referenceSentence,
        });
        incorrectCount++;
      } else if (step.type === 'learner_extra' && step.lIdx !== undefined) {
        const lRaw = learnerRawTokens[step.lIdx];
        tokenDiffs.push({
          learnerToken: lRaw,
          status: 'INCORRECT',
          explanation: `Từ "${lRaw}" không có trong câu chuẩn.`,
        });
        specificMistakes.push({
          errorType: 'unnatural_phrasing',
          where: lRaw,
          relatedEnglish: '',
          correctMeaning: '',
          whyIncorrect: `Từ "${lRaw}" không xuất hiện trong câu chuẩn.`,
          howToFix: `Lược bỏ từ "${lRaw}".`,
          fixedSnippet: referenceSentence,
        });
        incorrectCount++;
      } else if (step.type === 'ref_missing' && step.rIdx !== undefined) {
        const rRaw = refRawTokens[step.rIdx];
        missingElements.push({
          word: rRaw,
          positionHint: 'Trong câu',
          whyNeeded: `Cần có từ "${rRaw}" để câu trọn vẹn ngữ nghĩa.`,
        });
        tokenDiffs.push({
          learnerToken: '',
          referenceToken: rRaw,
          status: 'MISSING',
          explanation: `Thiếu từ "${rRaw}"`,
        });
      }
    }

    // Scoring calculations
    const totalRefWords = Math.max(refRawTokens.length, 1);
    const validWordsCount = exactMatches + equivalentMatches;
    const completeness = Math.max(
      0,
      Math.min(100, Math.round(((totalRefWords - missingElements.length) / totalRefWords) * 100)),
    );
    const wordAccuracy = Math.max(
      0,
      Math.min(100, Math.round((validWordsCount / Math.max(learnerRawTokens.length, totalRefWords)) * 100)),
    );
    const hasGrammarFlaw = incorrectCount > 0;
    const grammarAccuracy = hasGrammarFlaw ? Math.max(50, 95 - incorrectCount * 12) : 98;
    const naturalness =
      equivalentMatches > 0 && incorrectCount === 0
        ? 96
        : hasGrammarFlaw
        ? 62
        : wordAccuracy >= 85
        ? 94
        : 75;
    const semanticMeaning = Math.round(
      validWordsCount >= totalRefWords - 1 && missingElements.length <= 1
        ? 90
        : (validWordsCount / totalRefWords) * 100,
    );

    let overallStatus: 'EXACT_MATCH' | 'SEMANTICALLY_CORRECT' | 'PARTIALLY_CORRECT' | 'NEEDS_CORRECTION';
    if (missingElements.length === 0 && incorrectCount === 0) {
      if (equivalentMatches > 0) {
        overallStatus = 'SEMANTICALLY_CORRECT';
      } else {
        overallStatus = 'EXACT_MATCH';
      }
    } else if (semanticMeaning >= 65 || (validWordsCount >= 3 && missingElements.length <= 1)) {
      overallStatus = 'PARTIALLY_CORRECT';
    } else {
      overallStatus = 'NEEDS_CORRECTION';
    }

    let naturalnessNote: string | undefined;
    if (alternatives.length > 0) {
      naturalnessNote = `Câu của bạn sử dụng diễn đạt tương đương "${alternatives[0].relationship}" hoàn toàn tự nhiên và chính xác.`;
    }

    return {
      tokenDiffs,
      alternatives,
      missingElements,
      specificMistakes,
      scores: {
        semanticMeaning,
        grammarAccuracy,
        wordAccuracy,
        naturalness,
        completeness,
      },
      overallStatus,
      naturalnessNote,
    };
  }
}
