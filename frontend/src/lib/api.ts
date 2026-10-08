import {
  Lesson,
  Sentence,
  AnswerEvaluationResponse,
  UserProgressData,
  GrammarWeakness,
  SavedWord,
  AuthUser,
  WeakVocabularyItem,
} from '../types';

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://write-duo-ye5x-peach.vercel.app/api/v1';
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

const TOKEN_KEY = 'writeduo_auth_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // ignore json parse error
    }
    if (res.status === 401 && typeof window !== 'undefined') {
      // If token is invalid or expired, clear it
      setStoredToken(null);
    }
    throw new Error(errorMsg);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ success: boolean; token: string; user: AuthUser }> {
    const data = await fetchJson<{ success: boolean; token: string; user: AuthUser }>(
      `${API_BASE_URL}/auth/login`,
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    if (data.token) {
      setStoredToken(data.token);
    }
    return data;
  },

  async register(email: string, password: string, name: string): Promise<{ success: boolean; token: string; user: AuthUser }> {
    const data = await fetchJson<{ success: boolean; token: string; user: AuthUser }>(
      `${API_BASE_URL}/auth/register`,
      {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }
    );
    if (data.token) {
      setStoredToken(data.token);
    }
    return data;
  },

  async getMe(): Promise<AuthUser> {
    return fetchJson<AuthUser>(`${API_BASE_URL}/users/me`);
  },

  async getLearningProfile(): Promise<import('../types').PersonalLearningProfile> {
    return fetchJson<import('../types').PersonalLearningProfile>(`${API_BASE_URL}/users/learning-profile`);
  },

  async getStats(): Promise<AuthUser> {
    return fetchJson<AuthUser>(`${API_BASE_URL}/users/me`);
  },

  logout(): void {
    setStoredToken(null);
  },

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
    mode?: 'en_to_vi' | 'vi_to_en',
    fullEn?: string,
    fullVi?: string,
    sentences?: Array<{
      _id?: string;
      textEn: string;
      primaryTranslationVi: string;
      alternativeTranslations?: string[];
    }>,
  ): Promise<import('../types').ParagraphEvaluationResponse> {
    return fetchJson<import('../types').ParagraphEvaluationResponse>(
      `${API_BASE_URL}/answers/evaluate-paragraph`,
      {
        method: 'POST',
        body: JSON.stringify({ lessonId, userParagraph, mode, fullEn, fullVi, sentences }),
      }
    );
  },

  // Progress & Adaptive
  async getProgress(): Promise<UserProgressData> {
    return fetchJson<UserProgressData>(`${API_BASE_URL}/progress`);
  },

  async completeLesson(lessonId: string, score: number = 100): Promise<any> {
    return fetchJson(`${API_BASE_URL}/progress/complete`, {
      method: 'POST',
      body: JSON.stringify({ lessonId, score }),
    });
  },

  async getLessonProgress(lessonId: string): Promise<{
    lessonId: string;
    completed: boolean;
    progress: number;
    score: number;
    attempts: number;
    lastAttemptAt: string | null;
  }> {
    return fetchJson(`${API_BASE_URL}/progress/${encodeURIComponent(lessonId)}`);
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
    return fetchJson<{ items: SavedWord[]; totalCount: number }>(`${API_BASE_URL}/vocabulary/saved${queryString}`);
  },

  async getWeakVocabulary(): Promise<WeakVocabularyItem[]> {
    return fetchJson<WeakVocabularyItem[]>(`${API_BASE_URL}/vocabulary/weak`);
  },

  async checkWordSaved(word: string): Promise<{ isSaved: boolean; id: string | null }> {
    const params = new URLSearchParams({ word });
    return fetchJson<{ isSaved: boolean; id: string | null }>(`${API_BASE_URL}/vocabulary/check?${params.toString()}`);
  },

  async saveVocabulary(data: {
    word: string;
    meaningVi?: string;
    pos?: string;
    ipa?: string;
    cefr?: string;
    exampleEn?: string;
    exampleVi?: string;
  }): Promise<SavedWord> {
    return fetchJson<SavedWord>(`${API_BASE_URL}/vocabulary/saved`, {
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
      `${API_BASE_URL}/vocabulary/saved/${encodeURIComponent(id)}`,
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

  // ==========================================
  // 🚀 CONTEXT-AWARE MINI AI TUTOR API
  // ==========================================
  async askTutor(dto: {
    message: string;
    context: import('../types').TutorContext;
    conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    depthMode?: 'quick' | 'normal' | 'deep';
  }): Promise<import('../types').TutorChatResponse> {
    return fetchJson<import('../types').TutorChatResponse>(`${API_BASE_URL}/ai/tutor/chat`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async getTutorQuota(): Promise<{
    success: boolean;
    data: import('../types').TutorQuota;
  }> {
    return fetchJson<{ success: boolean; data: import('../types').TutorQuota }>(
      `${API_BASE_URL}/ai/tutor/quota`
    );
  },

  async streamTutor(
    dto: {
      message: string;
      context: import('../types').TutorContext;
      conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
      depthMode?: 'quick' | 'normal' | 'deep';
    },
    onChunk: (chunk: string) => void,
    onComplete: (data: import('../types').TutorStructuredResponse, quota?: import('../types').TutorQuota) => void,
    onError: (err: any) => void
  ): Promise<void> {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/ai/tutor/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify(dto),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Không thể kết nối với AI Tutor.`);
      }

      if (!res.body) {
        // Fallback to normal non-streaming response
        const json = await api.askTutor(dto);
        if (json.success) {
          onComplete(json.data, json.quota);
        } else {
          onError(new Error(json.data.answer || 'Lỗi xử lý'));
        }
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let completedData: import('../types').TutorStructuredResponse | null = null;
      let completedQuota: import('../types').TutorQuota | undefined = undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                onChunk(parsed.text);
              } else if (parsed.data) {
                completedData = parsed.data;
                completedQuota = parsed.quota;
              }
            } catch {
              // Ignore non-json chunk
            }
          }
        }
      }

      if (completedData) {
        onComplete(completedData, completedQuota);
      }
    } catch (err: any) {
      // Graceful fallback to non-streaming API
      try {
        const fallback = await api.askTutor(dto);
        if (fallback.success) {
          onComplete(fallback.data, fallback.quota);
        } else {
          onError(err);
        }
      } catch {
        onError(err);
      }
    }
  },

  // Admin Endpoints
  async adminGetStats(): Promise<import('../types').AdminStats> {
    const res = await fetchJson<{ success: boolean; data: import('../types').AdminStats }>(
      `${API_BASE_URL}/admin/stats`,
    );
    return res.data;
  },

  async adminGetUsers(): Promise<import('../types').AdminUserItem[]> {
    const res = await fetchJson<{ success: boolean; data: import('../types').AdminUserItem[] }>(
      `${API_BASE_URL}/admin/users`,
    );
    return res.data;
  },

  async adminUpdateUserRole(userId: string, role: string): Promise<any> {
    return fetchJson(`${API_BASE_URL}/admin/users/${encodeURIComponent(userId)}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },
};

