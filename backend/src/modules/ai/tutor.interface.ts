export interface TutorContext {
  userId?: string;
  lessonId?: string;
  lessonTitle?: string;
  lessonTopic?: string;
  lessonLevel?: string;
  sentenceId?: string;
  exerciseMode: 'en_to_vi' | 'vi_to_en';
  sourceSentence: string;
  sourceLanguage?: 'vi' | 'en';
  targetLanguage?: 'en' | 'vi';
  referenceAnswer: string;
  userAnswer?: string;
  grammarTopic?: string;
  grammarExplanation?: string;
  sentenceStructure?: any;
  tokens?: Array<{
    text: string;
    lemma?: string;
    pos?: string;
    ipa?: string;
    meaningVi?: string;
    usageInSentence?: string;
  }>;
  pronunciationData?: any;
  previousEvaluation?: {
    score?: number;
    status?: string;
    overview?: string;
    explanation?: string;
  };
  mistakes?: Array<{
    errorType: string;
    where: string;
    relatedEnglish: string;
    whyIncorrect: string;
    howToFix: string;
    fixedSnippet: string;
  }>;
  selectedText?: string;
  selectedWord?: string;
  userLevel?: string;
  cefrLevel?: string;
  isAnswerRevealed?: boolean;
  depthMode?: 'quick' | 'normal' | 'deep';
  weaknesses?: string[];
}

export interface TutorChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface TutorChatRequest {
  message: string;
  context: TutorContext;
  conversationHistory?: TutorChatMessage[];
  depthMode?: 'quick' | 'normal' | 'deep';
}

export interface TutorExample {
  en: string;
  vi: string;
  note?: string;
}

export interface TutorComparison {
  itemA: string;
  itemB: string;
  difference: string;
  exampleA?: string;
  exampleB?: string;
}

export interface TutorVocabularyItem {
  word: string;
  pos?: string;
  ipa?: string;
  meaningInContext: string;
  generalMeaning?: string;
  exampleEn?: string;
  exampleVi?: string;
  wordFamily?: string;
  commonCollocations?: string[];
  commonConfusion?: string;
}

export interface TutorMiniQuiz {
  question: string;
  options: string[];
  correctOption: string;
  explanation: string;
}

export interface TutorStructuredResponse {
  answer: string;
  keyPoint: string;
  explanationType: 'why' | 'grammar' | 'vocabulary' | 'comparison' | 'mistake' | 'hint' | 'quiz' | 'general';
  examples?: TutorExample[];
  comparison?: TutorComparison;
  relatedVocabulary?: TutorVocabularyItem[];
  grammarPoint?: string;
  memoryTip?: string;
  miniQuiz?: TutorMiniQuiz;
  followUpSuggestions: string[];
  isHintOnly?: boolean;
}

export interface TutorChatResponse {
  success: boolean;
  data: TutorStructuredResponse;
  quota?: {
    usedToday: number;
    limitToday: number;
    remaining: number;
  };
}
