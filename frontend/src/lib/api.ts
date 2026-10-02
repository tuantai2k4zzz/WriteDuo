import {
  Lesson,
  Sentence,
  AnswerEvaluationResponse,
  UserProgressData,
  GrammarWeakness,
  SavedWord,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  const json = await res.json();
  return json.data;
}

export const api = {
  // Lessons
  async getLessons(level?: string): Promise<Lesson[]> {
    const url = level && level !== 'ALL'
      ? `${API_BASE_URL}/lessons?level=${encodeURIComponent(level)}`
      : `${API_BASE_URL}/lessons`;
    return fetchJson<Lesson[]>(url);
  },

  async getLesson(slugOrId: string): Promise<{ lesson: Lesson; sentences: Sentence[]; totalCount: number }> {
    return fetchJson<{ lesson: Lesson; sentences: Sentence[]; totalCount: number }>(
      `${API_BASE_URL}/lessons/${encodeURIComponent(slugOrId)}`
    );
  },

  async getSentence(sentenceId: string): Promise<Sentence> {
    return fetchJson<Sentence>(`${API_BASE_URL}/sentences/${encodeURIComponent(sentenceId)}`);
  },

  // Evaluation
  async evaluateAnswer(
    sentenceId: string,
    userAnswer: string,
    mode?: 'en_to_vi' | 'vi_to_en'
  ): Promise<AnswerEvaluationResponse> {
    return fetchJson<AnswerEvaluationResponse>(`${API_BASE_URL}/answers/evaluate`, {
      method: 'POST',
      body: JSON.stringify({ sentenceId, userAnswer, mode }),
    });
  },

  async getDeepAnalysis(
    sentenceId: string,
    userAnswer: string,
    mode?: 'en_to_vi' | 'vi_to_en'
  ): Promise<{ isReady: boolean; evaluation: import('../types').EvaluationResult }> {
    return fetchJson(`${API_BASE_URL}/answers/deep-analysis`, {
      method: 'POST',
      body: JSON.stringify({ sentenceId, userAnswer, mode }),
    });
  },

  async evaluateParagraph(
    lessonId: string,
    userParagraph: string,
    mode?: 'en_to_vi' | 'vi_to_en'
  ): Promise<import('../types').ParagraphEvaluationResponse> {
    return fetchJson<import('../types').ParagraphEvaluationResponse>(
      `${API_BASE_URL}/answers/evaluate-paragraph`,
      {
        method: 'POST',
        body: JSON.stringify({ lessonId, userParagraph, mode }),
      }
    );
  },

  // Progress & Adaptive
  async getProgress(): Promise<UserProgressData> {
    return fetchJson<UserProgressData>(`${API_BASE_URL}/progress`);
  },

  async getGrammarWeaknesses(): Promise<GrammarWeakness[]> {
    return fetchJson<GrammarWeakness[]>(`${API_BASE_URL}/grammar/weaknesses`);
  },

  // Vocabulary
  async getVocabulary(query?: string, cefr?: string): Promise<{ items: SavedWord[]; totalCount: number }> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (cefr && cefr !== 'ALL') params.append('cefr', cefr);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<{ items: SavedWord[]; totalCount: number }>(`${API_BASE_URL}/vocabulary${queryString}`);
  },

  async saveVocabulary(data: {
    word: string;
    meaningVi?: string;
    pos?: string;
    ipa?: string;
    cefr?: string;
    exampleEn?: string;
  }): Promise<SavedWord> {
    return fetchJson<SavedWord>(`${API_BASE_URL}/vocabulary/save`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async toggleFavoriteWord(id: string): Promise<SavedWord> {
    return fetchJson<SavedWord>(`${API_BASE_URL}/vocabulary/${encodeURIComponent(id)}/favorite`, {
      method: 'POST',
    });
  },

  async deleteWord(id: string): Promise<{ success: boolean; deletedId: string }> {
    return fetchJson<{ success: boolean; deletedId: string }>(
      `${API_BASE_URL}/vocabulary/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
  },

  async lookupWord(word: string, context?: string): Promise<{
    word: string;
    meaningVi: string;
    ipa: string;
    pos: string;
    cefr: string;
    exampleEn?: string;
    exampleVi?: string;
  }> {
    const params = new URLSearchParams({ word });
    if (context) params.append('context', context);
    return fetchJson(`${API_BASE_URL}/vocabulary/lookup?${params.toString()}`);
  },

  // Proactive Spaced Repetition (SRS)
  async getSmartReviewQueue(): Promise<{ dueCount: number; items: import('../types').ReviewQueueItem[] }> {
    return fetchJson<{ dueCount: number; items: import('../types').ReviewQueueItem[] }>(
      `${API_BASE_URL}/review/smart-queue`
    );
  },
};
