export type SemanticTokenStatus =
  | 'EXACT_CORRECT' // 🟢 Khớp chuẩn xác
  | 'SEMANTICALLY_CORRECT' // 🟢〰️ Tương đương ngữ nghĩa (called ≈ named)
  | 'PARTIALLY_CORRECT' // 🟡 Gần đúng / chưa chuẩn ngữ cảnh
  | 'INCORRECT' // 🔴 Sai ngữ pháp / ngữ nghĩa
  | 'MISSING'; // ⚪ Bị bỏ sót

export interface SemanticTokenDiff {
  learnerToken: string;
  referenceToken?: string;
  status: SemanticTokenStatus;
  explanation?: string;
  alternativeTo?: string;
  relation?: string;
}

export interface SemanticAlternative {
  learnerExpression: string;
  referenceExpression: string;
  relationship: string; // ví dụ: "called ≈ named"
  noteVi: string;
  contextDifference?: string;
}

export interface SemanticDimensionScores {
  semanticMeaning: number; // 0 - 100
  grammarAccuracy: number; // 0 - 100
  wordAccuracy: number; // 0 - 100
  naturalness: number; // 0 - 100
  completeness: number; // 0 - 100
}

export interface SemanticEvaluationData {
  overallStatus: 'EXACT_MATCH' | 'SEMANTICALLY_CORRECT' | 'PARTIALLY_CORRECT' | 'NEEDS_CORRECTION';
  scores: SemanticDimensionScores;
  tokenDiffs: SemanticTokenDiff[];
  alternatives: SemanticAlternative[];
  missingElements: Array<{ word: string; positionHint: string; whyNeeded: string }>;
  naturalnessNote?: string;
  contextRecommendation?: {
    recommended: string;
    learnerVersion: string;
    why: string;
    whenToUseLearnerVersion: string;
  };
}

export interface SpecificMistake {
  errorType:
    | 'missing_info'
    | 'wrong_meaning'
    | 'wrong_tense'
    | 'wrong_subject_object'
    | 'unnatural_phrasing'
    | 'extra_info'
    | 'grammar_error';
  where: string; // Vị trí sai hoặc thiếu
  relatedEnglish: string; // Phần tiếng Anh liên quan
  correctMeaning: string; // Nghĩa đúng trong ngữ cảnh
  whyIncorrect: string; // Vì sao cách hiểu hiện tại chưa chính xác
  howToFix: string; // Bạn cần bổ sung hoặc sửa điều gì
  fixedSnippet: string; // Câu/cụm hoàn chỉnh sau khi sửa
}

export interface GrammarInsight {
  relevantRule: string;
  whyThisStructure: string;
  comparisonOrContrast?: string;
}

export interface CompleteSentenceMemorize {
  textEn: string;
  translationVi: string;
  keyPoints: string[];
}

export interface EvaluationInput {
  sentenceEn: string;
  userTranslationVi: string;
  referenceTranslationVi: string;
  alternativeTranslations?: string[];
  grammarAnalysis?: any;
  tokens?: any[];
  context?: string;
  mode?: 'en_to_vi' | 'vi_to_en';
}

export interface EvaluationResult {
  score: number; // 0 - 100
  status: 'correct' | 'almost_correct' | 'missing_info' | 'partially_incorrect' | 'incorrect';
  semantic_similarity: number; // 0.0 - 1.0
  overview: string; // Đánh giá tổng quan mang tính sư phạm
  explanation: string; // Lời nhận xét ngắn gọn
  whatYouGotRight: string[]; // Những điểm học viên đã hiểu đúng
  specificMistakes: SpecificMistake[]; // Chỉ ra lỗi sai cụ thể
  grammarInsight?: GrammarInsight; // Giải thích ngữ pháp liên quan trực tiếp
  completeSentenceMemorize?: CompleteSentenceMemorize; // Câu hoàn chỉnh cần ghi nhớ
  missing_information: string[];
  extra_information: string[];
  isCachedAlternative?: boolean;
  semanticAnalysis?: SemanticEvaluationData; // Mở rộng hệ thống Semantic Intelligence 2.0
}

export interface IAIEvaluator {
  name: string;
  isAvailable(): boolean;
  evaluateTranslation(input: EvaluationInput): Promise<EvaluationResult>;
}
