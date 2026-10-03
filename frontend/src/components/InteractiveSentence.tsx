'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLearningStore } from '../lib/store';
import { speakEnglish, speakVietnamese, playSound } from '../lib/audio';
import { api } from '../lib/api';
import { telemetry } from '../lib/telemetry';
import ExerciseSidebar from './ExerciseSidebar';
import { SentenceReactor } from './learning/SentenceReactor';
import {
  Volume2,
  Turtle,
  Mic,
  MicOff,
  Send,
  X,
  Sparkles,
  Zap,
  BookOpen,
  ArrowLeftRight,
  Trophy,
  Moon,
  Sun,
  Lightbulb,
  Check,
  Shield,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const InteractiveSentence: React.FC = () => {
  const {
    activeLesson,
    sentences,
    currentSentenceIndex,
    userAnswerInput,
    setUserAnswerInput,
    isEvaluating,
    setEvaluating,
    setEvaluationResult,
    openWordModal,
    exitLesson,
    userProgress,
    isSidebarMobileOpen,
    setSidebarMobileOpen,
    exerciseMode,
    toggleExerciseMode,
    startParagraphChallenge,
    themeMode,
    toggleThemeMode,
  } = useLearningStore();

  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const interimHolderRef = useRef<string>('');

  const sentence = sentences[currentSentenceIndex];
  const isViToEn = exerciseMode === 'vi_to_en';

  // Reset hint on new sentence
  useEffect(() => {
    setShowHint(false);
    setOptimisticStatus(null);
    setSpeechError(null);
    setInterimTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
  }, [currentSentenceIndex, exerciseMode]);

  // Safely auto-speak prompt on sentence change (without blocking subsequent gestures)
  useEffect(() => {
    if (sentence) {
      try {
        if (isViToEn && sentence.primaryTranslationVi) {
          speakVietnamese(sentence.primaryTranslationVi);
        } else if (!isViToEn && sentence.textEn) {
          speakEnglish(sentence.textEn, 0.95);
        }
      } catch {}
    }
  }, [sentence, isViToEn]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  if (!activeLesson || !sentence) return null;

  const progressPercent = Math.round(
    ((currentSentenceIndex + 1) / sentences.length) * 100
  );

  const handleModeSwitch = () => {
    playSound('mode_switch');
    toggleExerciseMode();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userAnswerInput.trim() || isEvaluating) return;

    try {
      // Optimistic UI: Immediately give visual feedback
      setOptimisticStatus('Đã nhận câu trả lời · Đang chấm điểm...');
      setEvaluating(true);
      playSound('click');
      telemetry.track('answer_submitted', { sentenceId: sentence._id, mode: exerciseMode });

      // Fast Evaluation (< 100ms response time)
      const res = await api.evaluateAnswer(
        sentence._id,
        userAnswerInput,
        exerciseMode
      );

      setEvaluationResult(res);

      if (res?.evaluation?.score >= 80) {
        telemetry.track('answer_correct', { score: res.evaluation.score });
      } else {
        telemetry.track('answer_incorrect', { score: res?.evaluation?.score ?? 0 });
      }

      // If deep analysis is not yet ready, fetch it in the background
      if (!res.isDeepAnalysisReady) {
        setTimeout(async () => {
          try {
            const deepRes = await api.getDeepAnalysis(
              sentence._id,
              userAnswerInput,
              exerciseMode
            );
            if (deepRes && deepRes.evaluation) {
              setEvaluationResult({
                ...res,
                evaluation: deepRes.evaluation,
                isDeepAnalysisReady: true,
              });
            }
          } catch (e) {
            // Ignore background error, Fast evaluation is already displayed
          }
        }, 600);
      }
    } catch (err: any) {
      alert(`Đánh giá thất bại: ${err.message}`);
    } finally {
      setEvaluating(false);
      setOptimisticStatus(null);
    }
  };

  // Keyboard shortcut: Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Speech Recognition (Voice Input adapted to mode & mobile)
  const toggleRecording = () => {
    setSpeechError(null);

    // If already recording, stop it cleanly
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
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        setSpeechError(
          'Trên điện thoại, trình duyệt yêu cầu HTTPS để bật Micro. Hãy đảm bảo bạn truy cập web qua HTTPS (hoặc localhost).',
        );
      } else {
        setSpeechError(
          'Trình duyệt này chưa hỗ trợ nhận diện giọng nói. Hãy mở trang trên Safari (iOS) hoặc Google Chrome (Android).',
        );
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = isViToEn ? 'en-US' : 'vi-VN';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false; // Most stable across mobile browsers

      recognition.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
        setInterimTranscript('');
        interimHolderRef.current = '';
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
          interimHolderRef.current = interimChunk;
        }

        if (finalChunk.trim()) {
          setUserAnswerInput((prev) => {
            const trimmed = prev.trim();
            const chunkTrimmed = finalChunk.trim();
            return trimmed ? `${trimmed} ${chunkTrimmed}` : chunkTrimmed;
          });
          setInterimTranscript('');
          interimHolderRef.current = '';
          playSound('click');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
        setInterimTranscript('');

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError(
            'Quyền Micro bị từ chối. Vui lòng cho phép quyền Microphone trong Cài đặt trình duyệt để nói.',
          );
        } else if (event.error === 'network') {
          setSpeechError('Lỗi kết nối mạng khi nhận diện giọng nói. Vui lòng kiểm tra Internet.');
        } else if (event.error === 'no-speech') {
          // No speech detected, quietly finish
        } else {
          setSpeechError(`Lỗi micro (${event.error}). Vui lòng bấm thử lại.`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        // If any non-final transcript remained when recognition finished, append it
        if (interimHolderRef.current.trim()) {
          const remaining = interimHolderRef.current.trim();
          setUserAnswerInput((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${remaining}` : remaining;
          });
          interimHolderRef.current = '';
        }
        setInterimTranscript('');
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
      setSpeechError('Không thể bật micro. Vui lòng cấp quyền micro và thử lại.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] dark:bg-[#060a14] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* ── TOP HEADER HUD ── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-cyan-500/20 bg-white/90 dark:bg-[#070d1a]/90 px-4 py-3 backdrop-blur-xl shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Exit Button */}
          <button
            onClick={exitLesson}
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80 hover:text-slate-700 dark:hover:text-white transition-all active:scale-95"
            title="Thoát bài học"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Thoát</span>
          </button>

          {/* Progress Bar with Cyan Arc Pulse */}
          <div className="flex-1 max-w-xl">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1 text-slate-400">
              <span>TIẾN ĐỘ BÀI HỌC</span>
              <span className="text-cyan-600 dark:text-cyan-400">
                {currentSentenceIndex + 1}/{sentences.length} ({progressPercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800/80 border border-slate-300/40 dark:border-cyan-500/20 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
              />
            </div>
          </div>

          {/* Actions & Gamification */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Boss Challenge Shortcut */}
            <button
              onClick={startParagraphChallenge}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-400/40 text-amber-600 dark:text-amber-300 text-xs font-black transition-all active:scale-95 shadow-xs"
              title="Chuyển sang thử thách dịch cả đoạn văn"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Dịch Cả Bài</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleThemeMode}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-cyan-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all active:scale-95"
              title="Đổi giao diện Sáng / Tối"
            >
              {themeMode === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </button>

            {userProgress && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-black text-xs border border-amber-200 dark:border-amber-900/50">
                <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{userProgress.xp} XP</span>
              </div>
            )}

            {/* Mobile Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => setSidebarMobileOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-xs font-black border border-cyan-200 dark:border-cyan-800"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Gia sư</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── EXERCISE WORKSPACE (Left/Center) ── */}
          <main className="lg:col-span-7 xl:col-span-8 flex flex-col max-w-2xl mx-auto w-full space-y-5">

            {/* ── TWO-WAY MODE SWITCHER (Segmented HUD Bar) ── */}
            <div className="flex items-center justify-between gap-3 p-1.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-cyan-500/20 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2 pl-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                  CHẾ ĐỘ HỌC
                </span>
              </div>

              {/* Segmented Switch Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    if (isViToEn) handleModeSwitch();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    !isViToEn
                      ? 'bg-white dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 shadow-sm border border-cyan-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span>🇬🇧 EN ➔ 🇻🇳 VI</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!isViToEn) handleModeSwitch();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isViToEn
                      ? 'bg-white dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 shadow-sm border border-cyan-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span>🇻🇳 VI ➔ 🇬🇧 EN</span>
                </button>
              </div>
            </div>

            {/* SRS Recall Notification */}
            {sentence.isSpacedRecall && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-950/40 dark:to-purple-950/40 px-4 py-2.5 text-xs font-black text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-800/60 shadow-xs"
              >
                <Sparkles className="h-4 w-4 text-violet-500 animate-spin" />
                <span>HỒI TƯỞNG CHỦ ĐỘNG: Câu này được AI tự động đưa vào để chống quên!</span>
              </motion.div>
            )}

            {/* ── QUESTION CARD WITH 3D FLIP ANIMATION ── */}
            {/* ── SENTENCE REACTOR (HOLOGRAPHIC SYNTACTIC MAP) - LÊN TRÊN CÙNG ── */}
            <SentenceReactor sentence={sentence} onTokenClick={openWordModal} />

            {/* ── CÂU HỎI VÀ TRẢ LỜI CẠNH NHAU (SIDE BY SIDE TRÊN DESKTOP, LIỀN KỀ TRÊN MOBILE) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
              {/* ── QUESTION CARD ── */}
              <motion.div
                key={`${sentence._id}-${exerciseMode}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="relative flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-cyan-500/30 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl h-full"
              >
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-3xl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-3xl" />

                <div>
                  {/* Card Header: Mode Label & Audio Controls */}
                  <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-mono">
                        {isViToEn ? 'CÂU HỎI TIẾNG VIỆT' : 'CÂU HỎI TIẾNG ANH'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Pronounce Button */}
                      <button
                        type="button"
                        onClick={() =>
                          isViToEn
                            ? speakVietnamese(sentence.primaryTranslationVi || '')
                            : speakEnglish(sentence.textEn || '', 0.95)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-sm hover:bg-cyan-400 active:scale-95 transition-all cursor-pointer"
                        title="Nghe phát âm chuẩn (1.0x)"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>

                      {!isViToEn && (
                        <button
                          type="button"
                          onClick={() => speakEnglish(sentence.textEn || '', 0.65)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
                          title="Nghe tốc độ chậm (0.65x)"
                        >
                          <Turtle className="h-3.5 w-3.5 text-amber-500" />
                        </button>
                      )}

                      {/* Hint Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowHint(!showHint)}
                        className={`flex h-8 px-2 items-center gap-1 rounded-xl text-[11px] font-bold border transition-all active:scale-95 cursor-pointer ${
                          showHint
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                        title="Xem gợi ý nếu bị kẹt"
                      >
                        <Lightbulb className="h-3 w-3 text-amber-500" />
                        <span>{showHint ? 'Ẩn' : 'Gợi Ý'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Prompt Text Display */}
                  {isViToEn ? (
                    /* VI -> EN Prompt */
                    <div className="space-y-3">
                      <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed">
                        {sentence.primaryTranslationVi}
                      </p>
                      {showHint && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-semibold"
                        >
                          💡 Gợi ý ngữ pháp: Sử dụng thì{' '}
                          <strong>{sentence.grammarAnalysis?.tense || 'chuẩn'}</strong>. Trật tự câu: S + V + O.
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    /* EN -> VI Interactive Tokens */
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-2.5">
                        {sentence.tokens && sentence.tokens.length > 0 ? (
                          sentence.tokens.map((token, i) => (
                            <button
                              type="button"
                              key={i}
                              onClick={() => {
                                if (token?.text) {
                                  speakEnglish(token.text);
                                }
                                openWordModal(token);
                              }}
                              className="interactive-token group relative rounded-xl border-b-2 border-dashed border-cyan-400/50 dark:border-cyan-400/60 px-1.5 py-0.5 text-lg sm:text-xl font-black text-slate-900 dark:text-white transition-all hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-600 dark:hover:text-cyan-300 cursor-pointer"
                            >
                              <span>{token.text}</span>
                              <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm z-10">
                                {token.meaningVi || 'Tra từ'}
                              </span>
                            </button>
                          ))
                        ) : (
                          <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                            {sentence.textEn}
                          </span>
                        )}
                      </div>
                      {showHint && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-semibold"
                        >
                          💡 Gợi ý dịch: Hãy chú ý cấu trúc "{sentence.grammarAnalysis?.tense || 'câu'}". Dịch tự nhiên theo văn phong tiếng Việt.
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{isViToEn ? '🇬🇧 Viết lại bằng tiếng Anh' : '🇻🇳 Chạm từ để tra từ & nghe phát âm'}</span>
                  <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                    {sentence.grammarAnalysis?.tense || 'Chuẩn'}
                  </span>
                </div>
              </motion.div>

              {/* ── ANSWER INPUT FORM (OPTIMISTIC UI) ── */}
              <form onSubmit={handleSubmit} className="flex flex-col justify-between gap-3 h-full">
                <div
                  className={`relative flex-1 flex flex-col justify-between rounded-3xl border-2 transition-all duration-300 bg-white dark:bg-slate-900/90 p-4 sm:p-5 shadow-sm ${
                    isEvaluating
                      ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                      : 'border-slate-200 dark:border-slate-800 focus-within:border-cyan-500 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                  }`}
                >
                  {/* Card Header for Answer */}
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                      {isViToEn ? 'CÂU TRẢ LỜI (TIẾNG ANH)' : 'CÂU TRẢ LỜI (TIẾNG VIỆT)'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                      Enter ↵ để gửi
                    </span>
                  </div>

                  <textarea
                    ref={inputRef}
                    value={userAnswerInput}
                    onChange={(e) => setUserAnswerInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isEvaluating}
                    placeholder={
                      isViToEn
                        ? 'Gõ câu tiếng Anh tương ứng (hoặc bấm Nói để nói)...'
                        : 'Dịch câu trên sang tiếng Việt tự nhiên nhất (hoặc bấm Nói)...'
                    }
                    rows={4}
                    className="w-full flex-1 resize-none text-base sm:text-lg font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent focus:outline-none"
                  />

                  {/* Speech Error Banner if permission or network issue */}
                  {speechError && (
                    <div className="my-2 flex items-start justify-between gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                      <span>⚠️ {speechError}</span>
                      <button
                        type="button"
                        onClick={() => setSpeechError(null)}
                        className="p-0.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Voice Dictation Toolbar */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80 gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all active:scale-95 cursor-pointer flex-shrink-0 ${
                          isRecording
                            ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_#f43f5e]'
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title={isViToEn ? 'Nói tiếng Anh' : 'Nói tiếng Việt'}
                      >
                        {isRecording ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                        <span>{isRecording ? 'Đang nghe...' : `Nói (${isViToEn ? 'EN' : 'VI'})`}</span>
                      </button>

                      {/* Live Interim Transcript */}
                      {isRecording && interimTranscript && (
                        <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 italic truncate animate-pulse">
                          "{interimTranscript}"
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 flex-shrink-0">
                      {userAnswerInput.trim().split(/\s+/).filter(Boolean).length} từ
                    </span>
                  </div>
                </div>

                {/* ── ACTION SUBMIT BUTTON WITH OPTIMISTIC UI ── */}
                <button
                  type="submit"
                  disabled={!userAnswerInput.trim() || isEvaluating}
                  className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-xs sm:text-sm font-black tracking-wider uppercase transition-all duration-300 font-mono active:scale-[0.98] cursor-pointer ${
                    isEvaluating
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                      : userAnswerInput.trim()
                      ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/25 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  {isEvaluating ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin text-cyan-200" />
                      <span>{optimisticStatus || 'TUANTAIDZ AI Đang Chấm Điểm (< 1s)...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>KIỂM TRA CÂU TRẢ LỜI</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </main>

          {/* ── DESKTOP RIGHT SIDEBAR ── */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-20">
            <ExerciseSidebar sentence={sentence} />
          </div>
        </div>
      </div>

      {/* ── MOBILE ACCORDION DRAWER ── */}
      <AnimatePresence>
        {isSidebarMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[85vh] overflow-hidden shadow-2xl"
            >
              <ExerciseSidebar
                sentence={sentence}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setSidebarMobileOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
