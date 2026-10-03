export interface Token {
  text: string;
  lemma: string;
  pos: string;
  ipa: string;
  cefr: string;
  meaningVi: string;
  usageInSentence?: string;
  derivatives?: string[];
  collocations?: string[];
  exampleEn?: string;
  exampleVi?: string;
}

export interface GrammarComponent {
  role: string;
  text: string;
  noteVi?: string;
}

export interface GrammarAnalysis {
  tense: string;
  tenseExplanationVi: string;
  components: GrammarComponent[];
  notableStructures: string[];
}

export interface LinkingRule {
  words: string;
  explanationVi: string;
}

export interface PronunciationGuide {
  ipaFull: string;
  sentenceStressWords: string[];
  linkingRules: LinkingRule[];
  vietnameseCommonPitfalls: string[];
  intonation?: string;
}

export interface SentenceHints {
  level1: string;
  level2: string;
  level3: string;
}

export interface VietnameseNuance {
  naturalTranslation: string;
  contrastExplanation: string;
}

export interface GrammarDetailed {
  whyStructure: string;
  positioningReason: string;
  prepositionsArticlesNotes: string;
  meaningImpact: string;
  contrastExamples: string;
}

export interface Sentence {
  _id: string;
  readingId: string;
  paragraphIndex: number;
  sentenceIndex: number;
  textEn: string;
  audioUrl?: string;
  primaryTranslationVi: string;
  alternativeTranslations: string[];
  tokens: Token[];
  grammarAnalysis: GrammarAnalysis;
  pronunciationGuide: PronunciationGuide;
  isAnalyzed: boolean;
  isSpacedRecall?: boolean;
  hints?: SentenceHints;
  englishContextMeaning?: string;
  vietnameseNuance?: VietnameseNuance;
  grammarDetailed?: GrammarDetailed;
}

export interface Lesson {
  _id: string;
  slug: string;
  title: string;
  topic: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'IELTS' | 'TOEIC';
  category: string;
  wordCount: number;
  totalSentences: number;
  paragraphs?: string[];
  order: number;
  isCompleted?: boolean;
}

export interface SpecificMistake {
  errorType: 'missing_info' | 'wrong_meaning' | 'wrong_tense' | 'wrong_subject_object' | 'unnatural_phrasing' | 'extra_info';
  where: string;
  relatedEnglish: string;
  correctMeaning: string;
  whyIncorrect: string;
  howToFix: string;
  fixedSnippet: string;
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

export interface EvaluationResult {
  score: number;
  status: 'correct' | 'almost_correct' | 'missing_info' | 'partially_incorrect' | 'incorrect';
  semantic_similarity: number;
  overview?: string;
  explanation: string;
  whatYouGotRight?: string[];
  specificMistakes?: SpecificMistake[];
  grammarInsight?: GrammarInsight;
  completeSentenceMemorize?: CompleteSentenceMemorize;
  missing_information: string[];
  extra_information: string[];
  isCachedAlternative?: boolean;
  semanticAnalysis?: SemanticEvaluationData;
}

export interface AnswerEvaluationResponse {
  evaluation: EvaluationResult;
  userAnswer: string;
  referenceAnswer: string;
  sentenceId: string;
  textEn: string;
  primaryTranslationVi?: string;
  grammarAnalysis: GrammarAnalysis;
  pronunciationGuide: PronunciationGuide;
  tokens: Token[];
  mode?: 'en_to_vi' | 'vi_to_en';
  isDeepAnalysisReady?: boolean;
  tier?: string;
  progress?: {
    xp: number;
    hearts?: number;
    streakCount: number;
    todayXp: number;
  };
}

export interface ParagraphMetrics {
  meaning: number;
  grammar: number;
  vocabulary: number;
  naturalness: number;
  completeness: number;
}

export interface ParagraphSentenceResult {
  sentenceIndex: number;
  userText: string;
  referenceText: string;
  score: number;
  status: 'correct' | 'almost_correct' | 'incorrect';
  feedback?: string;
  metrics?: ParagraphMetrics;
  strengths?: string[];
  improvements?: string[];
}

export interface ParagraphEvaluationResponse {
  score: number;
  status: 'correct' | 'almost_correct' | 'incorrect';
  overview: string;
  feedback?: string[];
  metrics?: ParagraphMetrics;
  strengths?: string[];
  improvements?: string[];
  promptText: string;
  referenceParagraph: string;
  xpBonus: number;
  mode: 'en_to_vi' | 'vi_to_en';
  sentenceResults?: ParagraphSentenceResult[];
}

export interface UserProgressData {
  xp: number;
  streakCount: number;
  hearts?: number;
  currentLevel: string;
  dailyGoalXp: number;
  todayXp: number;
  totalReadings: number;
  totalSentences: number;
  completedReadingsCount: number;
  completedSentencesCount: number;
}

export interface GrammarWeakness {
  tag: string;
  category: string;
  errorCount: number;
  masteryScore: number;
  sampleMistakes: Array<{
    userAnswer: string;
    expectedAnswer: string;
    explanation: string;
  }>;
}

export interface SavedWord {
  _id: string;
  word: string;
  meaningVi: string;
  pos: string;
  ipa: string;
  cefr: string;
  exampleEn: string;
  exampleVi: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface ReviewQueueItem {
  id: string;
  exerciseType: 'cloze' | 'translation';
  textEn: string;
  maskedText: string;
  targetWord: string;
  targetMeaning: string;
  primaryTranslationVi: string;
  grammarTense: string;
  tenseExplanationVi: string;
  stressWords: string[];
  linkingRules: LinkingRule[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  xp?: number;
  streak?: number;
  hearts?: number;
  currentLevel?: string;
  dailyGoalXp?: number;
  todayXp?: number;
  savedWordsCount?: number;
  weakWordsCount?: number;
  completedLessonsCount?: number;
  completedSentencesCount?: number;
}

export interface WeakVocabularyItem {
  _id: string;
  userId: string;
  word: string;
  meaningVi: string;
  ipa?: string;
  pos?: string;
  cefr?: string;
  sampleSentence?: string;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  mistakeCount: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
}
