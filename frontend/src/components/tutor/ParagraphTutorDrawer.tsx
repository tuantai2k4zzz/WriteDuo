'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  RotateCcw,
  Send,
  Loader2,
  Mic,
  MicOff,
  BookOpen,
  Award,
  Zap,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Target,
} from 'lucide-react';
import { useTutorStore, DepthMode, TutorStatus } from '../../lib/tutorStore';
import { useLearningStore } from '../../lib/store';
import { playSound } from '../../lib/audio';
import { TutorMessageItem } from './TutorMessageItem';
import { ParagraphEvaluationResponse } from '../../types';

interface ParagraphTutorDrawerProps {
  fullEn: string;
  fullVi: string;
  userInput: string;
  result: ParagraphEvaluationResponse | null;
  exerciseMode: 'en_to_vi' | 'vi_to_en';
}

export const ParagraphTutorDrawer: React.FC<ParagraphTutorDrawerProps> = ({
  fullEn,
  fullVi,
  userInput,
  result,
  exerciseMode,
}) => {
  const {
    isParagraphTutorOpen,
    closeParagraphTutor,
    messages,
    status,
    error,
    streamingChunk,
    isStreaming,
    depthMode,
    setDepthMode,
    resetConversation,
    quota,
    askTutor,
    setActiveParagraphContext,
  } = useTutorStore();

  const { activeLesson, user, openAuthModal } = useLearningStore();

  const [inputQuery, setInputQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isBusy = status === 'thinking' || status === 'answering';

  const isViToEn = exerciseMode === 'vi_to_en';

  // Sync active paragraph context to tutorStore
  useEffect(() => {
    setActiveParagraphContext({
      isParagraphMode: true,
      lessonId: activeLesson?._id,
      lessonTitle: activeLesson?.title,
      lessonTopic: activeLesson?.topic,
      lessonLevel: activeLesson?.level,
      exerciseMode,
      sourceSentence: isViToEn ? fullVi : fullEn,
      referenceAnswer: isViToEn ? fullEn : fullVi,
      userAnswer: userInput.trim() || undefined,
      fullParagraphEn: fullEn,
      fullParagraphVi: fullVi,
      paragraphEvaluation: result
        ? {
            score: result.score,
            status: result.status,
            overview: result.overview,
            strengths: result.strengths,
            improvements: result.improvements,
            metrics: result.metrics,
          }
        : undefined,
      sentenceResults: result?.sentenceResults,
    });
  }, [
    activeLesson,
    exerciseMode,
    fullEn,
    fullVi,
    userInput,
    result,
    isViToEn,
    setActiveParagraphContext,
  ]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isParagraphTutorOpen) {
        closeParagraphTutor();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isParagraphTutorOpen, closeParagraphTutor]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Auto-scroll chat container on new user question
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages.length, isStreaming]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isBusy) return;

    if (!user) {
      playSound('incorrect');
      openAuthModal('login');
      return;
    }

    setInputQuery('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await askTutor(textToSend, {
      isParagraphMode: true,
      lessonId: activeLesson?._id,
      lessonTitle: activeLesson?.title,
      exerciseMode,
      sourceSentence: isViToEn ? fullVi : fullEn,
      referenceAnswer: isViToEn ? fullEn : fullVi,
      userAnswer: userInput.trim() || undefined,
      fullParagraphEn: fullEn,
      fullParagraphVi: fullVi,
      paragraphEvaluation: result
        ? {
            score: result.score,
            status: result.status,
            overview: result.overview,
            strengths: result.strengths,
            improvements: result.improvements,
            metrics: result.metrics,
          }
        : undefined,
      sentenceResults: result?.sentenceResults,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoiceRecording = () => {
    setSpeechError(null);

    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsRecording(false);
      setInterimTranscript('');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Trình duyệt chưa hỗ trợ ghi âm trực tiếp.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'vi-VN'; // Asking tutor in Vietnamese
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            finalChunk += text;
          } else {
            interimChunk += text;
          }
        }

        if (interimChunk) {
          setInterimTranscript(interimChunk);
        }

        if (finalChunk.trim()) {
          setInputQuery((prev) => (prev ? `${prev} ${finalChunk.trim()}` : finalChunk.trim()));
          setInterimTranscript('');
        }
      };

      recognition.onerror = (event: any) => {
        setIsRecording(false);
        setInterimTranscript('');
        if (event.error !== 'no-speech') {
          setSpeechError(`Lỗi mic: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimTranscript('');
      };

      recognition.start();
    } catch {
      setIsRecording(false);
      setSpeechError('Không thể mở micro.');
    }
  };

  const getStatusBadge = (s: TutorStatus) => {
    switch (s) {
      case 'thinking':
        return {
          dot: 'bg-amber-400 animate-ping',
          text: 'AI Đang suy nghĩ...',
          textColor: 'text-amber-600 dark:text-amber-400',
        };
      case 'answering':
        return {
          dot: 'bg-cyan-400 animate-pulse',
          text: 'AI Đang trả lời...',
          textColor: 'text-cyan-600 dark:text-cyan-400',
        };
      case 'error':
        return {
          dot: 'bg-rose-500',
          text: 'Lỗi phản hồi',
          textColor: 'text-rose-600 dark:text-rose-400',
        };
      default:
        return {
          dot: 'bg-emerald-500 animate-pulse',
          text: 'Sẵn sàng trợ giúp',
          textColor: 'text-emerald-600 dark:text-emerald-400',
        };
    }
  };

  const statusInfo = getStatusBadge(status);
  const isUnlimited = user?.role === 'premium' || user?.role === 'admin' || quota?.isUnlimited;

  return (
    <AnimatePresence>
      {isParagraphTutorOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeParagraphTutor}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Slide-over Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 w-full sm:w-[500px] lg:w-[540px] xl:w-[580px] h-full bg-white dark:bg-[#080e1e] border-l border-slate-200 dark:border-cyan-500/30 shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            {/* ── 1. HEADER ── */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#080e1e]/90 backdrop-blur-md flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                        Gia Sư AI · Dịch Cả Bài
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        PARAGRAPH
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                        <span className={statusInfo.textColor}>{statusInfo.text}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Reset Conversation */}
                  <button
                    type="button"
                    onClick={resetConversation}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                    title="Xóa hội thoại & làm mới"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Close Drawer */}
                  <button
                    type="button"
                    onClick={closeParagraphTutor}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    title="Đóng khung Gia Sư (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Depth Mode Selector & Quota */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-[11px] font-bold">
                  {(
                    [
                      { key: 'quick', label: '⚡ Nhanh' },
                      { key: 'normal', label: '🎯 Chuẩn' },
                      { key: 'deep', label: '🔬 Sâu' },
                    ] as { key: DepthMode; label: string }[]
                  ).map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setDepthMode(m.key)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        depthMode === m.key
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-300 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Quota Indicator */}
                <div className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                  {isUnlimited ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      👑 Unlimited AI
                    </span>
                  ) : quota ? (
                    <span>
                      Còn lại: <strong className="text-cyan-600 dark:text-cyan-400">{quota.remaining}</strong> câu
                    </span>
                  ) : null}
                </div>
              </div>

              {/* ── 2. CONTEXT HUD BANNER ── */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-cyan-500/20 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                  <span className="truncate font-semibold text-slate-700 dark:text-slate-300">
                    {activeLesson?.title || 'Bài học'}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px] shrink-0">
                    ({isViToEn ? 'VI ➔ EN' : 'EN ➔ VI'})
                  </span>
                </div>

                <div className="shrink-0">
                  {result ? (
                    <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Đã chấm: {result.score}%
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {userInput.trim().split(/\s+/).filter(Boolean).length} từ
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── 3. CHAT CONVERSATION AREA ── */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 ai-chat-scrollbar"
            >
              {/* Welcoming state if messages empty */}
              {messages.length === 0 && (
                <div className="my-auto py-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-500/20">
                    <Sparkles className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                      Gia Sư AI Đồng Hành Toàn Bài
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      Hỏi bất cứ điều gì về cách dịch đoạn văn, liên từ kết nối câu, từ vựng hay phân tích lỗi sai nhé!
                    </p>
                  </div>

                  {/* Smart Prompt Suggestions */}
                  <div className="grid grid-cols-1 gap-2 pt-2 text-left max-w-md mx-auto">
                    {!result ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleSend(
                              'Gợi ý cho mình bố cục và các liên từ nối tự nhiên để dịch đoạn văn này mà không làm lộ trước đáp án nhé!'
                            )
                          }
                          className="p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-slate-200 transition shadow-xs cursor-pointer flex items-center gap-2 group"
                        >
                          <span className="text-base">💡</span>
                          <span className="flex-1">Gợi ý bố cục & các liên từ nối câu</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSend(
                              'Trong đoạn văn này có những từ vựng và cụm từ cố định (collocations) nào quan trọng cần chú ý?'
                            )
                          }
                          className="p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-slate-200 transition shadow-xs cursor-pointer flex items-center gap-2 group"
                        >
                          <span className="text-base">📚</span>
                          <span className="flex-1">Từ vựng & cụm từ quan trọng trong đoạn</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSend(
                              'Gợi mở cho mình hướng dịch câu mở đầu của đoạn văn này thật tự nhiên và đúng thì nhé!'
                            )
                          }
                          className="p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-slate-200 transition shadow-xs cursor-pointer flex items-center gap-2 group"
                        >
                          <span className="text-base">🎯</span>
                          <span className="flex-1">Gợi mở cách dịch câu mở đầu đoạn văn</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleSend(
                              `Gia sư hãy phân tích chi tiết toàn bộ bài dịch của mình (đạt ${result.score}%). Chỉ rõ các lỗi ngữ pháp và từ vựng cần cải thiện giúp mình nhé!`
                            )
                          }
                          className="p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-slate-200 transition shadow-xs cursor-pointer flex items-center gap-2 group"
                        >
                          <span className="text-base">🔍</span>
                          <span className="flex-1">Phân tích chi tiết toàn bài dịch của tôi</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSend(
                              'Tại sao bài dịch của mình bị trừ điểm và cách viết lại để đạt điểm tuyệt đối 100%?'
                            )
                          }
                          className="p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-slate-200 transition shadow-xs cursor-pointer flex items-center gap-2 group"
                        >
                          <span className="text-base">⚠️</span>
                          <span className="flex-1">Vì sao bị trừ điểm & cách sửa từng câu?</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSend(
                              'Gợi ý cho mình các cách diễn đạt nâng cao hơn cho đoạn văn này theo văn phong người bản xứ!'
                            )
                          }
                          className="p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-slate-200 transition shadow-xs cursor-pointer flex items-center gap-2 group"
                        >
                          <span className="text-base">🌟</span>
                          <span className="flex-1">Hành văn nâng cao như người bản xứ</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Existing Message History */}
              {messages.map((msg) => (
                <TutorMessageItem key={msg.id} message={msg} />
              ))}

              {/* Streaming Assistant Response */}
              {isStreaming && streamingChunk && (
                <div className="flex justify-start">
                  <div className="max-w-[96%] w-full rounded-2xl rounded-tl-xs bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 p-4 sm:p-5 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Gia Sư đang trả lời...</span>
                    </div>
                    <div className="text-sm sm:text-[15px] font-medium text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                      {streamingChunk}
                      <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse align-middle" />
                    </div>
                  </div>
                </div>
              )}

              {/* Thinking Indicator */}
              {status === 'thinking' && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span>Gia Sư đang phân tích đoạn văn...</span>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {error && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* ── 4. QUICK PROMPT CHIP BAR (When messages already exist) ── */}
            {messages.length > 0 && !isBusy && (
              <div className="px-4 py-2 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold no-scrollbar">
                <button
                  type="button"
                  onClick={() =>
                    handleSend(
                      result
                        ? 'Giải thích chi tiết câu bị trừ điểm nhiều nhất trong bài.'
                        : 'Gợi ý từ vựng và liên từ nối giữa các câu trong đoạn này.'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap hover:border-indigo-400 transition cursor-pointer"
                >
                  {result ? '⚠️ Câu bị trừ điểm' : '🔗 Liên từ nối'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSend(
                      result
                        ? 'Gợi ý cách viết lại đoạn văn này hay nhất theo văn phong chuẩn.'
                        : 'Gợi ý cấu trúc xương sống của đoạn văn này.'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap hover:border-indigo-400 transition cursor-pointer"
                >
                  {result ? '🌟 Viết lại tự nhiên hơn' : '💡 Khung cấu trúc'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSend(
                      'Tạo 1 câu hỏi trắc nghiệm mini củng cố điểm ngữ pháp trọng tâm của bài này!'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap hover:border-indigo-400 transition cursor-pointer"
                >
                  📝 Thử thách trắc nghiệm
                </button>
              </div>
            )}

            {/* ── 5. INPUT FORM ── */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080e1e]">
              <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
                <textarea
                  ref={textareaRef}
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isBusy}
                  placeholder={
                    result
                      ? 'Hỏi Gia sư về kết quả, lỗi sai hoặc cách sửa...'
                      : 'Hỏi Gia sư về bố cục, gợi ý dịch, liên từ...'
                  }
                  rows={1}
                  className="w-full bg-transparent resize-none border-none outline-hidden text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 max-h-[100px] min-h-[38px] py-1.5 px-1 leading-relaxed"
                />

                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  disabled={isBusy}
                  className={`shrink-0 p-2.5 rounded-xl transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title={isRecording ? 'Dừng ghi âm' : 'Nói để đặt câu hỏi'}
                >
                  {isRecording ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputQuery.trim() || isBusy}
                  className={`shrink-0 p-2.5 rounded-xl transition-all flex items-center justify-center ${
                    inputQuery.trim() && !isBusy
                      ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md active:scale-95 cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                  title="Gửi câu hỏi cho Gia Sư"
                >
                  {isBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Interim voice transcript or speech error */}
              {(isRecording && interimTranscript) || speechError ? (
                <div className="mt-1 px-1 text-xs">
                  {isRecording && interimTranscript && (
                    <span className="text-cyan-600 dark:text-cyan-400 italic">
                      "{interimTranscript}"
                    </span>
                  )}
                  {speechError && (
                    <span className="text-rose-500 font-semibold">{speechError}</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1.5 font-medium">
                  <span>Enter: Gửi câu hỏi</span>
                  <span>Shift + Enter: Xuống dòng</span>
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
