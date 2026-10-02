'use client';

import React, { useEffect } from 'react';
import { useLearningStore } from '../lib/store';
import { playSound } from '../lib/audio';
import confetti from 'canvas-confetti';
import { Trophy, Zap, Flame, ArrowRight, Shield, Target, CheckCircle2, AlertCircle, BookMarked } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LessonCompleteModal: React.FC = () => {
  const { isLessonCompleted, activeLesson, sentences, exitLesson, userProgress } =
    useLearningStore();

  useEffect(() => {
    if (isLessonCompleted) {
      playSound('complete');
      // Confetti burst
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#06b6d4', '#f59e0b', '#10b981', '#6366f1'],
        gravity: 0.8,
        scalar: 1.1,
      });
      setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#06b6d4', '#f59e0b'],
        });
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#06b6d4', '#f59e0b'],
        });
      }, 250);
    }
  }, [isLessonCompleted]);

  if (!isLessonCompleted || !activeLesson) return null;

  const xpEarned = sentences.length * 10;
  const vocabCount = sentences.length * 3;
  const identifiedWeakness = sentences[0]?.grammarAnalysis?.tense || 'Present Perfect / Câu ghép';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl p-8 text-center bg-white dark:bg-[#070e1c] border border-cyan-500/30 shadow-2xl shadow-cyan-500/10"
        >
          {/* Top Scan Bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Trophy Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 15, delay: 0.15 }}
            className="mx-auto mb-4 relative w-20 h-20"
          >
            <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 border-2 border-amber-500/40 text-amber-500 shadow-md">
              <Trophy className="h-10 w-10 text-amber-500" />
            </div>
          </motion.div>

          {/* Title */}
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-400 font-mono mb-1">
            LESSON COMPLETE · 2026
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            Hoàn Thành Bài Học!
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-6 line-clamp-1">
            "{activeLesson.title}" · {sentences.length} câu hoàn tất
          </p>

          {/* 4-Stat Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* XP */}
            <div className="rounded-2xl p-3.5 bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/60 text-left">
              <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 text-xs font-bold mb-1 font-mono">
                <Zap className="h-4 w-4 fill-cyan-500 text-cyan-500" />
                <span>KINH NGHIỆM</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">+{xpEarned} XP</div>
            </div>

            {/* Streak */}
            <div className="rounded-2xl p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-left">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1 font-mono">
                <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span>CHUỖI STREAK</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {userProgress?.streakCount ?? 3} Ngày
              </div>
            </div>

            {/* Sentences */}
            <div className="rounded-2xl p-3.5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-left">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-1 font-mono">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>CÂU TƯƠNG TÁC</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {sentences.length}/{sentences.length}
              </div>
            </div>

            {/* Vocabulary */}
            <div className="rounded-2xl p-3.5 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 text-left">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-bold mb-1 font-mono">
                <BookMarked className="h-4 w-4 text-blue-500" />
                <span>TỪ VỰNG MỚI</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">+{vocabCount} Từ</div>
            </div>
          </div>

          {/* Weakness Identified Banner (Section 28) */}
          <div className="rounded-2xl p-3.5 mb-6 bg-violet-50/70 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/60 text-left flex items-start gap-3">
            <div className="p-1.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 font-mono block">
                ĐIỂM NGỮ PHÁP ĐƯỢC AI CỦNG CỐ
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {identifiedWeakness} · Đã lưu vào lịch Spaced Repetition
              </p>
            </div>
          </div>

          {/* Return Button */}
          <motion.button
            onClick={exitLesson}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black tracking-wider uppercase text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 font-mono transition-all cursor-pointer"
          >
            <span>Trở Về Danh Sách Bài Học</span>
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
