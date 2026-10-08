'use client';

import { create } from 'zustand';
import {
  TutorMessage,
  TutorContext,
  TutorQuota,
  TutorStructuredResponse,
  Sentence,
  Lesson,
} from '../types';
import { api } from './api';
import { useLearningStore } from './store';
import { playSound } from './audio';

export type TutorStatus = 'idle' | 'thinking' | 'answering' | 'error';
export type DepthMode = 'quick' | 'normal' | 'deep';

interface TutorState {
  // Sidebar view tab: 'tutor' (Mini AI Tutor) vs 'reference' (7-tab material archive)
  sidebarTab: 'tutor' | 'reference';
  setSidebarTab: (tab: 'tutor' | 'reference') => void;

  // Tutor Conversation State
  messages: TutorMessage[];
  status: TutorStatus;
  error: string | null;
  depthMode: DepthMode;
  setDepthMode: (depth: DepthMode) => void;
  quota: TutorQuota | null;
  streamingChunk: string;
  isStreaming: boolean;

  // Active Scoped Sentence ID
  currentSentenceId: string | null;

  // Actions
  syncSentenceContext: (sentence: Sentence, lesson: Lesson | null, mode: 'en_to_vi' | 'vi_to_en') => void;
  askTutor: (question: string, overrideContext?: Partial<TutorContext>) => Promise<void>;
  resetConversation: () => void;
  loadQuota: () => Promise<void>;
  askAboutWord: (word: string, customQuestion?: string) => Promise<void>;
  askAboutSelection: (selectedText: string) => Promise<void>;
  askAboutUserMistake: () => Promise<void>;
}

export const useTutorStore = create<TutorState>((set, get) => ({
  sidebarTab: 'tutor', // Default view is now the interactive Mini AI Tutor!
  setSidebarTab: (tab) => set({ sidebarTab: tab }),

  messages: [],
  status: 'idle',
  error: null,
  depthMode: 'normal',
  setDepthMode: (depthMode) => set({ depthMode }),
  quota: null,
  streamingChunk: '',
  isStreaming: false,
  currentSentenceId: null,

  // Load quota status from server
  loadQuota: async () => {
    try {
      const res = await api.getTutorQuota();
      if (res.success && res.data) {
        set({ quota: res.data });
      }
    } catch {
      // Ignore quota fetch error for guests
    }
  },

  // Sync sentence context: resets conversation when sentence changes (Memory scoped to current exercise)
  syncSentenceContext: (sentence, lesson, mode) => {
    const prevId = get().currentSentenceId;
    if (prevId !== sentence._id) {
      set({
        currentSentenceId: sentence._id,
        messages: [],
        status: 'idle',
        error: null,
        streamingChunk: '',
        isStreaming: false,
      });
    }
  },

  resetConversation: () => {
    playSound('click');
    set({
      messages: [],
      status: 'idle',
      error: null,
      streamingChunk: '',
      isStreaming: false,
    });
  },

  // Core Ask Tutor Action
  askTutor: async (question: string, overrideContext?: Partial<TutorContext>) => {
    const q = question.trim();
    if (!q || get().status === 'thinking' || get().status === 'answering') return;

    playSound('click');

    // Get current learning store snapshot
    const learningState = useLearningStore.getState();
    const sentence = learningState.sentences[learningState.currentSentenceIndex];
    const lesson = learningState.activeLesson;
    const isViToEn = learningState.exerciseMode === 'vi_to_en';

    if (!sentence) return;

    // Build rich structured context
    const fullContext: TutorContext = {
      userId: learningState.user?.id,
      lessonId: lesson?._id,
      lessonTitle: lesson?.title,
      lessonTopic: lesson?.topic,
      lessonLevel: lesson?.level,
      sentenceId: sentence._id,
      exerciseMode: learningState.exerciseMode,
      sourceSentence: isViToEn ? sentence.primaryTranslationVi : sentence.textEn,
      sourceLanguage: isViToEn ? 'vi' : 'en',
      targetLanguage: isViToEn ? 'en' : 'vi',
      referenceAnswer: isViToEn ? sentence.textEn : sentence.primaryTranslationVi,
      userAnswer: learningState.userAnswerInput || undefined,
      grammarTopic: sentence.grammarAnalysis?.tense || 'Cấu trúc câu tự nhiên',
      grammarExplanation: sentence.grammarAnalysis?.tenseExplanationVi,
      sentenceStructure: sentence.grammarAnalysis?.components,
      tokens: sentence.tokens?.map((t) => ({
        text: t.text,
        lemma: t.lemma,
        pos: t.pos,
        ipa: t.ipa,
        meaningVi: t.meaningVi,
      })),
      pronunciationData: sentence.pronunciationGuide,
      previousEvaluation: learningState.evaluationResponse
        ? {
            score: learningState.evaluationResponse.evaluation.score,
            status: learningState.evaluationResponse.evaluation.status,
            overview: learningState.evaluationResponse.evaluation.overview,
            explanation: learningState.evaluationResponse.evaluation.explanation,
          }
        : undefined,
      mistakes: learningState.evaluationResponse?.evaluation.specificMistakes || [],
      isAnswerRevealed: learningState.isAnswerRevealed,
      depthMode: get().depthMode,
      ...overrideContext,
    };

    const userMessage: TutorMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: Date.now(),
      depthMode: get().depthMode,
    };

    const conversationHistory = get().messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Update state with user message and enter thinking state
    set((state) => ({
      messages: [...state.messages, userMessage],
      status: 'thinking',
      error: null,
      streamingChunk: '',
      isStreaming: true,
      sidebarTab: 'tutor',
    }));

    const assistantMsgId = `assistant-${Date.now()}`;

    try {
      let accumulatedText = '';

      await api.streamTutor(
        {
          message: q,
          context: fullContext,
          conversationHistory,
          depthMode: get().depthMode,
        },
        (chunk) => {
          accumulatedText += chunk;
          set({
            status: 'answering',
            streamingChunk: accumulatedText,
          });
        },
        (structuredData, quota) => {
          const assistantMessage: TutorMessage = {
            id: assistantMsgId,
            role: 'assistant',
            content: structuredData.answer,
            structured: structuredData,
            timestamp: Date.now(),
            depthMode: get().depthMode,
          };

          set((state) => ({
            messages: [...state.messages, assistantMessage],
            status: 'idle',
            streamingChunk: '',
            isStreaming: false,
            quota: quota || state.quota,
          }));

          playSound('complete');
        },
        (err) => {
          set({
            status: 'error',
            error: err.message || 'Gia sư AI đang bận. Vui lòng thử lại sau giây lát!',
            isStreaming: false,
            streamingChunk: '',
          });
        }
      );
    } catch (err: any) {
      set({
        status: 'error',
        error: err.message || 'Không thể kết nối với Gia sư AI.',
        isStreaming: false,
        streamingChunk: '',
      });
    }
  },

  // Specialized Helper: Ask about a specific word
  askAboutWord: async (word: string, customQuestion?: string) => {
    const q = customQuestion || `Vì sao từ "${word}" được dùng trong câu này?`;
    set({ sidebarTab: 'tutor' });
    useLearningStore.getState().setSidebarMobileOpen(true);
    await get().askTutor(q, { selectedWord: word });
  },

  // Specialized Helper: Ask about selected text/phrase
  askAboutSelection: async (selectedText: string) => {
    const q = `Giải thích cụm từ "${selectedText}" trong câu này.`;
    set({ sidebarTab: 'tutor' });
    useLearningStore.getState().setSidebarMobileOpen(true);
    await get().askTutor(q, { selectedText });
  },

  // Specialized Helper: Ask about user's mistake
  askAboutUserMistake: async () => {
    const q = `Tại sao câu của tôi sai và làm sao để sửa tự nhiên hơn?`;
    set({ sidebarTab: 'tutor' });
    useLearningStore.getState().setSidebarMobileOpen(true);
    await get().askTutor(q);
  },
}));
