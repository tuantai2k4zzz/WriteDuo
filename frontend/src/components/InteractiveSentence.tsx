'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLearningStore } from '../lib/store';
import { speakEnglish, speakVietnamese, playSound } from '../lib/audio';
import { api } from '../lib/api';
import ExerciseSidebar from './ExerciseSidebar';
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
  const [showHint, setShowHint] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sentence = sentences[currentSentenceIndex];
  const isViToEn = exerciseMode === 'vi_to_en';

  // Reset hint on new sentence
  useEffect(() => {
    setShowHint(false);
    setOptimisticStatus(null);
  }, [currentSentenceIndex, exerciseMode]);

  // Auto-speak prompt on sentence change
  useEffect(() => {
    if (sentence) {
      if (isViToEn) {
        speakVietnamese(sentence.primaryTranslationVi);
      } else {
        speakEnglish(sentence.textEn, 0.95);
      }
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [sentence, isViToEn]);

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

      // Fast Evaluation (< 100ms response time)
      const res = await api.evaluateAnswer(
        sentence._id,
        userAnswerInput,
        exerciseMode
      );

      setEvaluationResult(res);

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

  // Speech Recognition (Voice Input adapted to mode)
  const toggleRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        'Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói (Web Speech API). Hãy thử trên Google Chrome.',
      );
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isViToEn ? 'en-US' : 'vi-VN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setUserAnswerInput(
            userAnswerInput ? `${userAnswerInput} ${transcript}` : transcript,
          );
          playSound('click');
        }
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsRecording(false);
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
            <motion.div
              key={`${sentence._id}-${exerciseMode}`}
              initial={{ rotateY: 35, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -35, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-cyan-500/30 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-lg shadow-slate-200/40 dark:shadow-cyan-500/5 backdrop-blur-xl"
              style={{
                perspective: '1000px',
              }}
            >
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-3xl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-3xl" />

              {/* Card Header: Mode Label & Audio Controls */}
              <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-mono">
                    {isViToEn ? 'CÂU HỎI TIẾNG VIỆT' : 'CÂU HỎI TIẾNG ANH'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
                    {isViToEn ? 'Viết lại bằng tiếng Anh chuẩn' : 'Tra cứu từng từ nếu cần'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Pronounce Button */}
                  <button
                    type="button"
                    onClick={() =>
                      isViToEn
                        ? speakVietnamese(sentence.primaryTranslationVi)
                        : speakEnglish(sentence.textEn, 0.95)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-md shadow-cyan-500/25 hover:bg-cyan-400 active:scale-95 transition-all"
                    title="Nghe phát âm chuẩn (1.0x)"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>

                  {!isViToEn && (
                    <button
                      type="button"
                      onClick={() => speakEnglish(sentence.textEn, 0.65)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 active:scale-95 transition-all"
                      title="Nghe tốc độ chậm (0.65x)"
                    >
                      <Turtle className="h-4 w-4 text-amber-500" />
                    </button>
                  )}

                  {/* Hint Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    className={`flex h-9 px-2.5 items-center gap-1 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                      showHint
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                    title="Xem gợi ý nếu bị kẹt"
                  >
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                    <span>{showHint ? 'Ẩn Gợi Ý' : 'Gợi Ý'}</span>
                  </button>
                </div>
              </div>

              {/* Prompt Text Display */}
              {isViToEn ? (
                /* VI -> EN Prompt */
                <div className="space-y-3">
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-relaxed">
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
                          onClick={() => openWordModal(token)}
                          className="interactive-token group relative rounded-xl border-b-2 border-dashed border-cyan-400/50 dark:border-cyan-400/60 px-1.5 py-0.5 text-xl sm:text-2xl font-black text-slate-900 dark:text-white transition-all hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-600 dark:hover:text-cyan-300"
                        >
                          <span>{token.text}</span>
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm z-10">
                            {token.meaningVi || 'Tra từ'}
                          </span>
                        </button>
                      ))
                    ) : (
                      <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
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
            </motion.div>

            {/* ── ANSWER INPUT FORM (OPTIMISTIC UI) ── */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div
                className={`relative rounded-3xl border-2 transition-all duration-300 bg-white dark:bg-slate-900/90 shadow-sm ${
                  isEvaluating
                    ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                    : 'border-slate-200 dark:border-slate-800 focus-within:border-cyan-500 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                }`}
              >
                <textarea
                  ref={inputRef}
                  value={userAnswerInput}
                  onChange={(e) => setUserAnswerInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isEvaluating}
                  placeholder={
                    isViToEn
                      ? 'Gõ câu tiếng Anh tương ứng (ví dụ: She has been working here...)'
                      : 'Dịch câu trên sang tiếng Việt tự nhiên nhất...'
                  }
                  rows={3}
                  className="w-full resize-none rounded-3xl p-5 text-base sm:text-lg font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent focus:outline-none"
                />

                {/* Voice Dictation Toolbar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 rounded-b-3xl">
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_#f43f5e]'
                        : 'text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title={isViToEn ? 'Nói tiếng Anh' : 'Nói tiếng Việt'}
                  >
                    {isRecording ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                    <span>{isRecording ? 'Đang lắng nghe...' : `Nói (${isViToEn ? 'EN' : 'VI'})`}</span>
                  </button>

                  <span className="text-[11px] font-mono font-semibold text-slate-400">
                    Nhấn <kbd className="rounded border bg-white dark:bg-slate-700 px-1 py-0.5 text-[10px]">Enter</kbd> để kiểm tra
                  </span>
                </div>
              </div>

              {/* ── ACTION SUBMIT BUTTON WITH OPTIMISTIC UI ── */}
              <button
                type="submit"
                disabled={!userAnswerInput.trim() || isEvaluating}
                className={`w-full flex items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-black tracking-wider uppercase transition-all duration-300 font-mono active:scale-[0.98] ${
                  isEvaluating
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                    : userAnswerInput.trim()
                    ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                }`}
              >
                {isEvaluating ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin text-cyan-200" />
                    <span>{optimisticStatus || 'JARVIS Đang Chấm Điểm (< 1s)...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>KIỂM TRA CÂU TRẢ LỜI</span>
                  </>
                )}
              </button>
            </form>
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
