import { create } from 'zustand';
import {
  Lesson,
  Sentence,
  AnswerEvaluationResponse,
  ParagraphEvaluationResponse,
  UserProgressData,
  Token,
  AuthUser,
} from '../types';
import { api, getStoredToken } from './api';

interface LearningState {
  currentTab: 'learn' | 'vocab' | 'weakness';
  setCurrentTab: (tab: 'learn' | 'vocab' | 'weakness') => void;

  selectedLevel: string;
  setSelectedLevel: (level: string) => void;

  // Exercise Mode: EN -> VI (Ask in EN, answer in VI) or VI -> EN (Ask in VI, answer in EN)
  exerciseMode: 'en_to_vi' | 'vi_to_en';
  setExerciseMode: (mode: 'en_to_vi' | 'vi_to_en') => void;
  toggleExerciseMode: () => void;

  // Theme: Dark (TUANTAIDZ HUD) vs Light (Clean Lab)
  themeMode: 'dark' | 'light';
  initTheme: () => void;
  toggleThemeMode: () => void;

  // Auth & Multi-User State
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  loadUser: () => Promise<AuthUser | null>;
  refreshUserData: () => Promise<void>;
  logout: () => void;

  // Active Lesson
  activeLesson: Lesson | null;
  sentences: Sentence[];
  currentSentenceIndex: number;
  userAnswerInput: string;
  isEvaluating: boolean;
  evaluationResponse: AnswerEvaluationResponse | null;
  isDrawerOpen: boolean;
  isLessonCompleted: boolean;
  isAnswerRevealed: boolean;
  isSidebarMobileOpen: boolean;

  // Boss Challenge: Reverse Paragraph Translation
  isParagraphChallengeActive: boolean;
  paragraphEvaluationResponse: ParagraphEvaluationResponse | null;
  startParagraphChallenge: () => void;
  exitParagraphChallenge: () => void;
  setParagraphEvaluationResponse: (res: ParagraphEvaluationResponse | null) => void;

  // Word Popover
  activeToken: Token | null;
  isWordModalOpen: boolean;

  // User Progress
  userProgress: UserProgressData | null;
  setUserProgress: (p: UserProgressData) => void;

  // Actions
  startLesson: (lesson: Lesson, sentences: Sentence[]) => void;
  exitLesson: () => void;
  setUserAnswerInput: (val: string | ((prev: string) => string)) => void;
  setEvaluating: (loading: boolean) => void;
  setEvaluationResult: (res: AnswerEvaluationResponse | null) => void;
  nextSentence: () => void;
  retryCurrentSentence: () => void;
  revealAnswer: () => void;
  setSidebarMobileOpen: (open: boolean) => void;
  openWordModal: (token: Token) => void;
  closeWordModal: () => void;
}

export const useLearningStore = create<LearningState>((set, get) => ({
  currentTab: 'learn',
  setCurrentTab: (tab) => set({ currentTab: tab }),

  selectedLevel: 'ALL',
  setSelectedLevel: (level) => set({ selectedLevel: level }),

  exerciseMode: 'en_to_vi',
  setExerciseMode: (exerciseMode) => set({ exerciseMode, userAnswerInput: '', evaluationResponse: null, isDrawerOpen: false }),
  toggleExerciseMode: () => {
    const current = get().exerciseMode;
    const next = current === 'en_to_vi' ? 'vi_to_en' : 'en_to_vi';
    set({ exerciseMode: next, userAnswerInput: '', evaluationResponse: null, isDrawerOpen: false });
  },

  themeMode: 'dark',
  initTheme: () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vspeak_theme_mode') as 'dark' | 'light' | null;
        if (saved) {
          if (saved === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          set({ themeMode: saved });
        }
      } catch (e) {}
    }
  },
  toggleThemeMode: () => {
    const nextTheme = get().themeMode === 'dark' ? 'light' : 'dark';
    if (typeof document !== 'undefined') {
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('vspeak_theme_mode', nextTheme);
      } catch (e) {}
    }
    set({ themeMode: nextTheme });
  },

  // Auth & Multi-User Implementation
  user: null,
  setUser: (user) => set({ user }),
  isAuthModalOpen: false,
  authModalMode: 'login',
  openAuthModal: (mode = 'login') => set({ isAuthModalOpen: true, authModalMode: mode }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),

  loadUser: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ user: null, userProgress: null });
      return null;
    }
    try {
      const me = await api.getMe();
      set({
        user: me,
        userProgress: {
          xp: me.xp || 0,
          streakCount: me.streak || 0,
          hearts: me.hearts ?? 5,
          currentLevel: me.currentLevel || 'A1',
          dailyGoalXp: me.dailyGoalXp || 50,
          todayXp: me.todayXp || 0,
          totalReadings: 27,
          totalSentences: 484,
          completedReadingsCount: me.completedLessonsCount || 0,
          completedSentencesCount: me.completedSentencesCount || 0,
        },
      });
      return me;
    } catch (err) {
      console.warn('Authentication token invalid or expired:', err);
      api.logout();
      set({ user: null, userProgress: null });
      return null;
    }
  },

  refreshUserData: async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const me = await api.getMe();
      set({
        user: me,
        userProgress: {
          xp: me.xp || 0,
          streakCount: me.streak || 0,
          hearts: me.hearts ?? 5,
          currentLevel: me.currentLevel || 'A1',
          dailyGoalXp: me.dailyGoalXp || 50,
          todayXp: me.todayXp || 0,
          totalReadings: 27,
          totalSentences: 484,
          completedReadingsCount: me.completedLessonsCount || 0,
          completedSentencesCount: me.completedSentencesCount || 0,
        },
      });
    } catch {}
  },

  logout: () => {
    api.logout();
    set({
      user: null,
      userProgress: null,
      activeLesson: null,
      currentTab: 'learn',
    });
  },

  activeLesson: null,
  sentences: [],
  currentSentenceIndex: 0,
  userAnswerInput: '',
  isEvaluating: false,
  evaluationResponse: null,
  isDrawerOpen: false,
  isLessonCompleted: false,
  isAnswerRevealed: false,
  isSidebarMobileOpen: false,

  isParagraphChallengeActive: false,
  paragraphEvaluationResponse: null,

  activeToken: null,
  isWordModalOpen: false,

  userProgress: null,
  setUserProgress: (userProgress) => set({ userProgress }),

  startLesson: (lesson, sentences) =>
    set({
      activeLesson: lesson,
      sentences,
      currentSentenceIndex: 0,
      userAnswerInput: '',
      evaluationResponse: null,
      isDrawerOpen: false,
      isLessonCompleted: false,
      isAnswerRevealed: false,
      isSidebarMobileOpen: false,
      isParagraphChallengeActive: false,
      paragraphEvaluationResponse: null,
    }),

  exitLesson: () =>
    set({
      activeLesson: null,
      sentences: [],
      currentSentenceIndex: 0,
      userAnswerInput: '',
      evaluationResponse: null,
      isDrawerOpen: false,
      isLessonCompleted: false,
      isAnswerRevealed: false,
      isSidebarMobileOpen: false,
      isParagraphChallengeActive: false,
      paragraphEvaluationResponse: null,
    }),

  setUserAnswerInput: (val) =>
    set((state) => ({
      userAnswerInput: typeof val === 'function' ? val(state.userAnswerInput) : val,
    })),

  setEvaluating: (loading) => set({ isEvaluating: loading }),

  setEvaluationResult: (res) =>
    set((state) => ({
      evaluationResponse: res,
      isDrawerOpen: !!res,
      userProgress: res?.progress
        ? {
            ...state.userProgress!,
            xp: res.progress.xp,
            hearts: res.progress.hearts,
            streakCount: res.progress.streakCount,
            todayXp: res.progress.todayXp,
          }
        : state.userProgress,
    })),

  startParagraphChallenge: () =>
    set({
      isParagraphChallengeActive: true,
      isLessonCompleted: false,
      isDrawerOpen: false,
      userAnswerInput: '',
    }),

  exitParagraphChallenge: () =>
    set({
      isParagraphChallengeActive: false,
      isLessonCompleted: true,
    }),

  setParagraphEvaluationResponse: (res) =>
    set((state) => ({
      paragraphEvaluationResponse: res,
      userProgress: res?.xpBonus && state.userProgress
        ? {
            ...state.userProgress,
            xp: state.userProgress.xp + res.xpBonus,
            todayXp: state.userProgress.todayXp + res.xpBonus,
          }
        : state.userProgress,
    })),

  nextSentence: () => {
    const { currentSentenceIndex, sentences } = get();
    if (currentSentenceIndex + 1 < sentences.length) {
      set({
        currentSentenceIndex: currentSentenceIndex + 1,
        userAnswerInput: '',
        evaluationResponse: null,
        isDrawerOpen: false,
        isAnswerRevealed: false,
      });
    } else {
      // Finished all individual sentences -> Transition to Paragraph Reverse Translation Challenge!
      set({
        isParagraphChallengeActive: true,
        isLessonCompleted: false,
        isDrawerOpen: false,
        isAnswerRevealed: false,
      });
    }
  },

  retryCurrentSentence: () => {
    set({
      userAnswerInput: '',
      evaluationResponse: null,
      isDrawerOpen: false,
    });
  },

  revealAnswer: () => set({ isAnswerRevealed: true }),

  setSidebarMobileOpen: (open) => set({ isSidebarMobileOpen: open }),

  openWordModal: (token) => set({ activeToken: token, isWordModalOpen: true }),
  closeWordModal: () => set({ activeToken: null, isWordModalOpen: false }),
}));
