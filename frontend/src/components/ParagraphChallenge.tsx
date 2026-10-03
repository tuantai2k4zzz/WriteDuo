'use client';

import React, { useState } from 'react';
import { useLearningStore } from '../lib/store';
import { api } from '../lib/api';
import { playSound, speakEnglish, speakVietnamese } from '../lib/audio';
import { ParagraphEvaluationResponse } from '../types';
import {
  Volume2,
  Mic,
  Send,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Trophy,
  Zap,
  BookOpen,
  ArrowLeftRight,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Target,
  Layers,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ParagraphChallenge: React.FC = () => {
  const {
    activeLesson,
    sentences,
    exerciseMode,
    toggleExerciseMode,
    exitParagraphChallenge,
    exitLesson,
  } = useLearningStore();

  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ParagraphEvaluationResponse | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  if (!activeLesson || sentences.length === 0) return null;

  // Stitched complete texts from all sentences
  const fullEn = sentences.map((s) => s.textEn.trim()).join(' ');
  const fullVi = sentences.map((s) => s.primaryTranslationVi.trim()).join(' ');

  const isViToEn = exerciseMode === 'vi_to_en';
  const promptText = isViToEn ? fullVi : fullEn;
  const targetPlaceholder = isViToEn
    ? 'Viết lại toàn bộ đoạn văn bằng tiếng Anh tự nhiên nhất...'
    : 'Dịch toàn bộ đoạn văn trên sang tiếng Việt mạch lạc nhất...';

  const handleSpeech = () => {
    if (isViToEn) {
      speakVietnamese(promptText);
    } else {
      speakEnglish(promptText, 0.95);
    }
  };

  const handleModeSwitch = () => {
    playSound('mode_switch');
    toggleExerciseMode();
    setUserInput('');
    setResult(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      playSound('click');
      const res = await api.evaluateParagraph(
        activeLesson._id,
        userInput.trim(),
        exerciseMode,
        fullEn,
        fullVi,
        sentences,
      );
      setResult(res);
      if (res.score >= 80) {
        playSound('complete');
      } else {
        playSound('almost');
      }
    } catch (err: any) {
      console.warn('API paragraph evaluation failed, using local engine:', err);
      // Client-side sentence-by-sentence evaluation fallback
      const N = sentences.length;
      const userSentences = userInput
        .trim()
        .split(/(?<=[.!?\n])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const sentenceResults: Array<{
        sentenceIndex: number;
        userText: string;
        referenceText: string;
        score: number;
        status: 'correct' | 'almost_correct' | 'incorrect';
        feedback?: string;
      }> = [];

      let totalScore = 0;
      for (let i = 0; i < N; i++) {
        const s = sentences[i];
        const refText = isViToEn ? s.textEn.trim() : s.primaryTranslationVi.trim();
        const userText = userSentences[i] || (userSentences.length === 1 && i === 0 ? userSentences[0] : '');

        const cleanU = userText.toLowerCase().replace(/[.,!?;:()"'`]/g, '');
        const cleanR = refText.toLowerCase().replace(/[.,!?;:()"'`]/g, '');

        let sentScore = 70;
        if (cleanU && cleanU === cleanR) {
          sentScore = 100;
        } else if (!cleanU) {
          sentScore = 20;
        } else {
          const uWords = cleanU.split(/\s+/).filter(Boolean);
          const rWords = cleanR.split(/\s+/).filter(Boolean);
          let match = 0;
          for (const w of rWords) {
            if (uWords.includes(w)) match++;
          }
          sentScore = Math.min(100, Math.max(30, Math.round((match / Math.max(rWords.length, 1)) * 100)));
        }

        totalScore += sentScore;
        sentenceResults.push({
          sentenceIndex: i + 1,
          userText,
          referenceText: refText,
          score: sentScore,
          status: sentScore >= 80 ? 'correct' : sentScore >= 50 ? 'almost_correct' : 'incorrect',
          feedback: sentScore >= 80 ? 'Dịch chính xác và tự nhiên' : 'Cần đối chiếu từ vựng và thì của câu này',
        });
      }

      const score = Math.round(totalScore / Math.max(N, 1));
      const target = isViToEn ? fullEn : fullVi;

      const fallbackRes: ParagraphEvaluationResponse = {
        score,
        status: score >= 80 ? 'correct' : score >= 50 ? 'almost_correct' : 'incorrect',
        overview:
          score >= 80
            ? 'Tuyệt tác! Bạn đã dịch trọn vẹn toàn bộ đoạn văn xuất sắc.'
            : 'Khá tốt! Bạn đã nắm được phần lớn ý nghĩa của toàn bài.',
        metrics: {
          meaning: score,
          grammar: Math.max(40, Math.min(100, Math.round(score * 0.95))),
          vocabulary: score,
          naturalness: Math.max(50, Math.min(100, Math.round(score * 0.9))),
          completeness: Math.min(100, Math.round(score)),
        },
        strengths: sentenceResults.filter((r) => r.score >= 80).map((r) => `Câu ${r.sentenceIndex}: ${r.feedback}`),
        improvements: sentenceResults.filter((r) => r.score < 80).map((r) => `Câu ${r.sentenceIndex}: ${r.feedback}`),
        promptText,
        referenceParagraph: target,
        xpBonus: 50,
        mode: exerciseMode,
        sentenceResults,
      };
      setResult(fallbackRes);
      if (score >= 80) {
        playSound('complete');
      } else {
        playSound('almost');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleVoiceRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Trình duyệt chưa hỗ trợ Web Speech API.');
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

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setUserInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          playSound('click');
        }
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const metrics = result?.metrics || {
    meaning: result?.score || 85,
    grammar: Math.max(50, Math.round((result?.score || 85) * 0.95)),
    vocabulary: Math.max(60, Math.round((result?.score || 85) * 0.98)),
    naturalness: Math.max(50, Math.round((result?.score || 85) * 0.92)),
    completeness: Math.max(60, Math.round((result?.score || 85) * 1.0)),
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#060a14] text-slate-800 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 transition-colors duration-300">
      <div className="mx-auto w-full max-w-5xl space-y-6">

        {/* ── TOP HUD HEADER ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-cyan-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-sm">
              <Trophy className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-mono">
                  BOSS CHALLENGE · 2026
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {activeLesson.title}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Thử Thách: Dịch Ngược Cả Đoạn Văn
              </h1>
            </div>
          </div>

          {/* Mode Switcher & Exit */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleModeSwitch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 shadow-xs hover:border-cyan-500 active:scale-95"
              title="Đổi chế độ dịch"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 text-cyan-500" />
              <span>{isViToEn ? '🇻🇳 VI ➔ 🇬🇧 EN' : '🇬🇧 EN ➔ 🇻🇳 VI'}</span>
            </button>

            <button
              onClick={exitParagraphChallenge}
              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Bỏ qua
            </button>
          </div>
        </div>

        {/* ── BOSS BATTLE 2.0 HUD: BOSS HP & LEARNING STAGES ── */}
        <div
          className="rounded-2xl p-4 backdrop-blur-md bg-rose-50/95 dark:bg-gradient-to-br dark:from-[#14040c]/90 dark:to-[#0a0218]/90 border border-rose-300 dark:border-rose-500/30 shadow-xs dark:shadow-[0_0_25px_rgba(244,63,94,0.1)]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-rose-500 animate-pulse font-mono font-black text-sm">⚔️</span>
              <span className="text-xs font-mono font-black text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                BOSS: {activeLesson.title.toUpperCase()} (LEVEL {activeLesson.level})
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
              {result
                ? result.score >= 80
                  ? '🏆 TRÙM ĐÃ BỊ ĐÁNH BẠI (VICTORY)'
                  : `HP CÒN LẠI: ${Math.max(0, 100 - result.score)}%`
                : `BOSS SHIELD: 100% HP`}
            </div>
          </div>

          {/* Boss HP Bar */}
          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-900 border border-rose-300 dark:border-rose-900/60 overflow-hidden mb-3">
            <motion.div
              initial={{ width: '100%' }}
              animate={{
                width: result
                  ? `${Math.max(0, 100 - result.score)}%`
                  : `${Math.max(15, 100 - Math.min(85, Math.floor(userInput.length / 4)))}%`,
              }}
              transition={{ duration: 0.6 }}
              className="h-full rounded-full"
              style={{
                background: result && result.score >= 80
                  ? '#10b981'
                  : 'linear-gradient(90deg, #f43f5e, #fb7185, #fda4af)',
                boxShadow: '0 0 12px rgba(244,63,94,0.5)',
              }}
            />
          </div>

          {/* 4 Objective Stages */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-center text-[10px] font-mono font-bold">
            <div className="p-1.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
              1. TỪ VỰNG ✓
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
              2. CÚ PHÁP ✓
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
              3. CÂU ĐƠN ✓
            </div>
            <div className={`p-1.5 rounded-lg border ${result && result.score >= 80 ? 'bg-emerald-100/80 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100/80 dark:bg-rose-500/15 border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 animate-pulse'}`}>
              4. TOÀN ĐOẠN ⚔️
            </div>
          </div>
        </div>

        {/* ── 2-COLUMN SPLIT WORKSPACE (IF NOT SUBMITTED) ── */}
        {!result ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

            {/* Left: Source Passage Card */}
            <div className="flex flex-col justify-between rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-cyan-500/30 p-6 shadow-sm backdrop-blur-xl">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5 font-mono">
                    <BookOpen className="h-4 w-4" />
                    {isViToEn ? 'ĐOẠN VĂN TIẾNG VIỆT NGUỒN' : 'ORIGINAL ENGLISH PASSAGE'}
                  </span>

                  <button
                    onClick={handleSpeech}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-600 dark:hover:text-cyan-300 transition-all border border-slate-200 dark:border-slate-700/60"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-cyan-500" />
                    <span>Nghe đọc</span>
                  </button>
                </div>

                <p className="text-base sm:text-lg leading-relaxed font-semibold text-slate-800 dark:text-slate-200">
                  {promptText}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-medium">
                💡 Mục tiêu: Dịch toàn bộ đoạn văn liền mạch, đúng thì và đúng ngữ cảnh bài học.
              </div>
            </div>

            {/* Right: User Translation Input Form */}
            <div className="flex flex-col justify-between rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 shadow-sm focus-within:border-cyan-500 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all">
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-3 text-xs font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-3 font-mono">
                  <span>BẢN DỊCH CỦA BẠN ({isViToEn ? 'ENGLISH' : 'TIẾNG VIỆT'})</span>
                  <span>{userInput.trim().split(/\s+/).filter(Boolean).length} từ</span>
                </div>

                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={8}
                  placeholder={targetPlaceholder}
                  className="w-full flex-1 resize-none bg-transparent text-base sm:text-lg leading-relaxed font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_#f43f5e]'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-500'
                  }`}
                >
                  <Mic className="h-4 w-4" />
                  <span>{isRecording ? 'Đang nghe...' : 'Nói'}</span>
                </button>

                <button
                  onClick={() => handleSubmit()}
                  disabled={!userInput.trim() || isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black tracking-wider uppercase text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-mono active:scale-95 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin text-cyan-200" />
                      <span>TUANTAIDZ AI Đang Chấm Điểm...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Chấm Điểm Toàn Bài (Boss Fight)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── 5-AXIS RADAR SCORE HUD RESULT DISPLAY ── */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-cyan-500/30 p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl"
          >
            {/* Header Score Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg font-mono ${
                    result.score >= 80
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'
                      : result.score >= 50
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30'
                      : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30'
                  }`}
                >
                  {result.score}%
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-mono">
                      KẾT QUẢ BOSS CHALLENGE
                    </span>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1 font-mono">
                      <Zap className="h-3 w-3 fill-amber-500" /> +{result.xpBonus} XP
                    </span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
                    {result.overview}
                  </h3>
                </div>
              </div>

              {/* Retry & Complete Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setResult(null)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 active:scale-95 transition-all"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Dịch Lại</span>
                </button>

                <button
                  onClick={exitLesson}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-md shadow-emerald-500/20 font-mono transition-all active:scale-95"
                >
                  <span>Hoàn Thành Bài</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ── 5-AXIS SCORE HUD METRICS (Meaning, Grammar, Vocabulary, Naturalness, Completeness) ── */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-cyan-400 flex items-center gap-1.5 font-mono">
                <Target className="h-4 w-4 text-cyan-500" />
                <span>CHỈ SỐ ĐÁNH GIÁ 5 CHIỀU (HUD METRICS)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { label: 'Ý NGHĨA (Meaning)', val: metrics.meaning, color: 'bg-emerald-500' },
                  { label: 'NGỮ PHÁP (Grammar)', val: metrics.grammar, color: 'bg-cyan-500' },
                  { label: 'TỪ VỰNG (Vocabulary)', val: metrics.vocabulary, color: 'bg-blue-500' },
                  { label: 'TỰ NHIÊN (Natural)', val: metrics.naturalness, color: 'bg-indigo-500' },
                  { label: 'TRỌN VẸN (Complete)', val: metrics.completeness, color: 'bg-violet-500' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500 dark:text-slate-400 font-mono">{item.label}</span>
                      <span className="font-mono font-black text-slate-800 dark:text-white">{item.val}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── WHAT YOU DID WELL & WHAT TO IMPROVE ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> ĐIỂM BẠN ĐÃ LÀM TỐT
                </span>
                <ul className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 space-y-1">
                  {(result.strengths && result.strengths.length > 0 ? result.strengths : (result.feedback || [])).map(
                    (st, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{st}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* Improvements */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 font-mono flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> ĐIỂM CẦN CẢI THIỆN
                </span>
                <ul className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 space-y-1">
                  {(result.improvements && result.improvements.length > 0
                    ? result.improvements
                    : ['Chú ý các liên từ nối giữa các câu trong đoạn văn', 'Luyện thêm để chuyển ý tự nhiên hơn']
                  ).map((imp, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">⚠</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── SENTENCE-BY-SENTENCE BREAKDOWN (KẾT QUẢ TỪNG CÂU) ── */}
            {result.sentenceResults && result.sentenceResults.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-cyan-400 flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                    <span>CHI TIẾT ĐÁNH GIÁ TỪNG CÂU ({result.sentenceResults.length} CÂU)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Chấm theo logic kiểm tra từng câu riêng lẻ
                  </span>
                </div>

                <div className="space-y-3">
                  {result.sentenceResults.map((sent) => (
                    <div
                      key={sent.sentenceIndex}
                      className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2.5 transition-all hover:border-cyan-500/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                            Câu {sent.sentenceIndex}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-black font-mono ${
                              sent.score >= 80
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : sent.score >= 50
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {sent.score}% · {sent.status === 'correct' ? 'Chuẩn xác' : sent.status === 'almost_correct' ? 'Khá tốt' : 'Cần sửa'}
                          </span>
                        </div>

                        <button
                          onClick={() => (isViToEn ? speakEnglish(sent.referenceText) : speakVietnamese(sent.referenceText))}
                          className="flex items-center gap-1 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline p-1 cursor-pointer"
                          title="Nghe câu mẫu"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Nghe mẫu</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs sm:text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-slate-400 font-mono text-[11px] shrink-0 w-16">Bạn dịch:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {sent.userText ? `"${sent.userText}"` : <span className="text-rose-500 italic">(Chưa dịch câu này)</span>}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-cyan-500 font-mono text-[11px] shrink-0 w-16">Đáp án:</span>
                          <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                            "{sent.referenceText}"
                          </span>
                        </div>
                      </div>

                      {sent.feedback && (
                        <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800 flex items-start gap-1.5">
                          <span className="text-cyan-500 font-bold">ℹ</span>
                          <span>{sent.feedback}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reference Complete Passage */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                <span className="uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  BẢN DỊCH THAM KHẢO TOÀN BÀI
                </span>
                <button
                  onClick={() =>
                    isViToEn
                      ? speakEnglish(result.referenceParagraph)
                      : speakVietnamese(result.referenceParagraph)
                  }
                  className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>Nghe mẫu</span>
                </button>
              </div>
              <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-400/20 text-slate-800 dark:text-cyan-100 text-sm sm:text-base leading-relaxed font-semibold">
                {result.referenceParagraph}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
