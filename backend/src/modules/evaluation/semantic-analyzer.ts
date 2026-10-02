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

    // 1. Pattern: "it's name" or "its name" instead of "named" or "called"
    const hasItsNameAnomaly = /it['’]?s\s+name/i.test(learnerSentence);
    if (hasItsNameAnomaly) {
      specificMistakes.push({
        errorType: 'grammar_error',
        where: "it's name",
        relatedEnglish: "it's name",
        correctMeaning: 'named / called',
        whyIncorrect:
          '"it\'s" là viết tắt của "it is", không phải tính từ sở hữu. Để diễn đạt tên của thú cưng trong câu này, cấu trúc tự nhiên nhất là dùng mệnh đề phân từ rút gọn: "a dog named Max" hoặc "a dog called Max".',
        howToFix: 'Thay cụm "it\'s name" bằng từ "named" hoặc "called".',
        fixedSnippet: referenceSentence,
      });
    }

    // Two-pointer / LCS alignment algorithm
    let rIdx = 0;
    let exactMatches = 0;
    let equivalentMatches = 0;
    let incorrectCount = 0;

    for (let lIdx = 0; lIdx < learnerRawTokens.length; lIdx++) {
      const lRaw = learnerRawTokens[lIdx];
      const lClean = this.cleanWord(lRaw);

      if (rIdx < refRawTokens.length) {
        const rRaw = refRawTokens[rIdx];
        const rClean = this.cleanWord(rRaw);

        // Check Exact Match
        if (lClean === rClean) {
          tokenDiffs.push({
            learnerToken: lRaw,
            referenceToken: rRaw,
            status: 'EXACT_CORRECT',
          });
          exactMatches++;
          rIdx++;
          continue;
        }

        // Check Semantic Equivalent (e.g. called ≈ named)
        const eqCheck = this.checkEquivalent(lClean, rClean);
        if (eqCheck.isEquivalent) {
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
            noteVi: eqCheck.note || `Từ "${lRaw}" diễn đạt hoàn toàn đúng nghĩa và tự nhiên trong câu này.`,
            contextDifference: eqCheck.contextDiff,
          });
          equivalentMatches++;
          rIdx++;
          continue;
        }

        // Lookahead to check if learner missed reference word (Missing token)
        // e.g. Learner: "I have a dog Max", Ref: "I have a dog named Max"
        if (lIdx + 1 < learnerRawTokens.length) {
          const nextLClean = this.cleanWord(learnerRawTokens[lIdx + 1]);
          if (nextLClean === rClean || this.checkEquivalent(nextLClean, rClean).isEquivalent) {
            // Current lRaw is extra or mismatched
          }
        }

        if (rIdx + 1 < refRawTokens.length) {
          const nextRClean = this.cleanWord(refRawTokens[rIdx + 1]);
          if (lClean === nextRClean) {
            // Missing rRaw
            missingElements.push({
              word: rRaw,
              positionHint: `Giữa "${refRawTokens[rIdx - 1] || ''}" và "${rRaw}"`,
              whyNeeded: `Từ "${rRaw}" là thành phần liên kết ngữ nghĩa quan trọng của câu.`,
            });
            tokenDiffs.push({
              learnerToken: '',
              referenceToken: rRaw,
              status: 'MISSING',
              explanation: `Thiếu từ "${rRaw}"`,
            });
            rIdx++; // advance reference to catch up with learner
            // Now match current lRaw with new rRaw
            tokenDiffs.push({
              learnerToken: lRaw,
              referenceToken: refRawTokens[rIdx],
              status: 'EXACT_CORRECT',
            });
            exactMatches++;
            rIdx++;
            continue;
          }
        }

        // If part of "it's name" anomaly
        if (lClean === "it's" || lClean === 'its' || (lClean === 'name' && hasItsNameAnomaly)) {
          tokenDiffs.push({
            learnerToken: lRaw,
            referenceToken: rRaw,
            status: 'INCORRECT',
            explanation:
              lClean === 'name'
                ? 'Dùng quá khứ phân từ "named" (được đặt tên là) thay cho danh từ/động từ "name".'
                : '"it\'s" = "it is". Cấu trúc tự nhiên: a dog named Max.',
          });
          incorrectCount++;
          // if next ref token is target participle, align it
          if (rClean === 'named') {
            rIdx++;
          }
          continue;
        }

        // Generic word mismatch
        tokenDiffs.push({
          learnerToken: lRaw,
          referenceToken: rRaw,
          status: 'INCORRECT',
          explanation: `Từ "${lRaw}" chưa tương ứng với từ "${rRaw}" trong ngữ cảnh này.`,
        });
        incorrectCount++;
        rIdx++;
      } else {
        // Extra tokens from learner
        tokenDiffs.push({
          learnerToken: lRaw,
          status: 'PARTIALLY_CORRECT',
          explanation: `Từ dư hoặc diễn đạt thêm: "${lRaw}"`,
        });
      }
    }

    // Any remaining reference tokens are missing
    while (rIdx < refRawTokens.length) {
      const rRaw = refRawTokens[rIdx];
      missingElements.push({
        word: rRaw,
        positionHint: `Cuối câu`,
        whyNeeded: `Cần có từ "${rRaw}" để câu hoàn chỉnh nghĩa.`,
      });
      tokenDiffs.push({
        learnerToken: '',
        referenceToken: rRaw,
        status: 'MISSING',
        explanation: `Thiếu từ "${rRaw}"`,
      });
      rIdx++;
    }

    // Scoring calculations
    const totalRefWords = Math.max(refRawTokens.length, 1);
    const validWordsCount = exactMatches + equivalentMatches;
    const completeness = Math.max(0, Math.min(100, Math.round(((totalRefWords - missingElements.length) / totalRefWords) * 100)));
    const wordAccuracy = Math.max(0, Math.min(100, Math.round((validWordsCount / Math.max(learnerRawTokens.length, totalRefWords)) * 100)));
    const grammarAccuracy = hasItsNameAnomaly ? 70 : incorrectCount > 0 ? Math.max(50, 95 - incorrectCount * 15) : 98;
    const naturalness = equivalentMatches > 0 && incorrectCount === 0 ? 96 : hasItsNameAnomaly ? 60 : wordAccuracy >= 85 ? 94 : 75;
    const semanticMeaning = Math.round(validWordsCount >= totalRefWords - 1 ? 95 : (validWordsCount / totalRefWords) * 100);

    let overallStatus: 'EXACT_MATCH' | 'SEMANTICALLY_CORRECT' | 'PARTIALLY_CORRECT' | 'NEEDS_CORRECTION';
    if (missingElements.length === 0 && incorrectCount === 0) {
      if (equivalentMatches > 0) {
        overallStatus = 'SEMANTICALLY_CORRECT';
      } else {
        overallStatus = 'EXACT_MATCH';
      }
    } else if (semanticMeaning >= 70 || (validWordsCount >= 3 && missingElements.length <= 1)) {
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
