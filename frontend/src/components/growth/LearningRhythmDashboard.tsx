'use client';

import React from 'react';
import { useLearningStore } from '@/lib/store';
import { playSound } from '@/lib/audio';
import { Flame, Clock, Award, CheckCircle2, Sparkles, BookOpen, Headphones, Zap, ArrowRight, Share2 } from 'lucide-react';

interface Props {
  onStartLesson?: () => void;
  onOpenVocab?: () => void;
  onOpenWeakness?: () => void;
  onOpenShareCard?: () => void;
}

export default function LearningRhythmDashboard({
  onStartLesson,
  onOpenVocab,
  onOpenWeakness,
  onOpenShareCard,
}: Props) {
  const { user, userProgress, entitlements, openPricingModal } = useLearningStore();

  const streak = user?.streak ?? userProgress?.streakCount ?? 1;
  const xp = user?.xp ?? userProgress?.xp ?? 0;
  const completedLessons = userProgress?.completedReadingsCount ?? user?.completedLessonsCount ?? 0;
  const savedWords = user?.savedWordsCount ?? 18;
  const todayXp = userProgress?.todayXp ?? 15;
  const goalXp = userProgress?.dailyGoalXp ?? 50;
  const targetPct = Math.min(100, Math.round((todayXp / Math.max(1, goalXp)) * 100));

  return (
    <div className="space-y-6 mb-8">
      {/* ── 1. IELTS PATH TO 8.0 BAND HERO BANNER (Inspired by Reference Image 3) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/15 border border-indigo-400/30">
        {/* Futuristic Background Circuit Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Lộ Trình Học Cá Nhân Hóa 2026</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Master English: Lộ Trình Hướng Tới 8.0 IELTS
            </h1>

            <p className="text-sm sm:text-base text-indigo-100/90 font-medium">
              Rèn luyện phản xạ ngữ pháp, dịch song ngữ hai chiều và mở rộng hơn 2,500 cấu trúc tự nhiên với sự hỗ trợ của Gia Sư AI.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  playSound('click');
                  if (onStartLesson) onStartLesson();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-sm shadow-lg shadow-black/10 hover:bg-indigo-50 transition active:scale-95 cursor-pointer"
              >
                <span>Học Tiếp Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onOpenShareCard && (
                <button
                  onClick={() => {
                    playSound('click');
                    onOpenShareCard();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-sm transition active:scale-95 cursor-pointer"
                  title="Chia sẻ thành tích lên mạng xã hội"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Khoe Thành Tích</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress Capsule Widget (Right) */}
          <div className="lg:w-72 rounded-2xl bg-black/25 backdrop-blur-md p-4 sm:p-5 border border-white/15 space-y-3 shrink-0">
            <div className="flex items-center justify-between text-xs text-indigo-200">
              <span className="font-semibold uppercase tracking-wider">Tiến Độ Tích Lũy</span>
              <span className="font-bold text-amber-300">Level {Math.max(1, Math.floor(xp / 100) + 1)}</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{xp}</span>
              <span className="text-xs text-indigo-200 font-mono">XP</span>
            </div>

            {/* XP Level Bar */}
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 to-cyan-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${(xp % 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs text-indigo-100">
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-bold">{streak} Ngày</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-300 font-semibold">
                <span>+18% Độ Chính Xác</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. DAILY LEARNING RHYTHM OVERVIEW (Inspired by Reference Image 1) ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              DAILY LEARNING OVERVIEW
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Nhịp điệu học tập của bạn, sẵn sàng tiếp tục.
            </h2>
          </div>

          {!entitlements?.isPro && (
            <button
              onClick={() => {
                playSound('click');
                openPricingModal();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-400/40 text-cyan-700 dark:text-cyan-300 text-xs font-bold hover:bg-cyan-500/25 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Nâng Cấp Pro Mở Khóa AI</span>
            </button>
          )}
        </div>

        {/* 4 Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Study Time */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-4 h-4 text-cyan-500" />
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase">
                STUDY TIME
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {Math.max(15, completedLessons * 8 + streak * 5)}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">PHÚT ĐÃ LUYỆN</span>
            </div>
          </div>

          {/* Streak */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase">
                STREAK
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {streak}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">NGÀY LIÊN TIẾP</span>
            </div>
          </div>

          {/* Lessons Completed */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase">
                COMPLETED
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {completedLessons}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">BÀI ĐÃ HOÀN THÀNH</span>
            </div>
          </div>

          {/* Quiz Accuracy */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-4 h-4 text-purple-500" />
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 uppercase">
                ACCURACY
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                89%
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">ĐỘ CHÍNH XÁC DỊCH</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. THREE SPECIALIZED MODULE PILLARS (Inspired by Reference Image 3) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Grammar Precision */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex flex-col justify-between group shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold font-mono text-emerald-600 dark:text-emerald-400 uppercase">
                28 MODULES
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500 font-bold text-xs">
                S+V
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Grammar Precision
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Giải phẫu từng thì ngữ pháp, giới từ, trật tự từ và mạo từ tiếng Anh chuẩn mực.
            </p>
          </div>
          <button
            onClick={onOpenWeakness}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            Luyện Ngữ Pháp Chuyên Sâu
          </button>
        </div>

        {/* Card 2: Vocabulary Mastery */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-indigo-500/30 hover:border-indigo-500/60 transition-all flex flex-col justify-between group shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold font-mono text-indigo-600 dark:text-indigo-400 uppercase">
                2,500+ WORDS LEARNED
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-500 font-bold text-xs">
                A-Z
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Vocabulary Mastery
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Từ vựng theo ngữ cảnh bài đọc thực tế, không học vẹt, tra cứu một chạm.
            </p>
          </div>
          <button
            onClick={onOpenVocab}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            Mở Sổ Tay Từ Vựng
          </button>
        </div>

        {/* Card 3: Listening & Speaking Intelligence */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-blue-500/30 hover:border-blue-500/60 transition-all flex flex-col justify-between group shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold font-mono text-blue-600 dark:text-blue-400 uppercase">
                42 PRACTICE SETS
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-500 font-bold text-xs">
                <Headphones className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Listening Intelligence
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Luyện tai phát âm chuẩn bản xứ với phát thanh chuẩn IPA, nuốt âm và nối âm.
            </p>
          </div>
          <button
            onClick={onStartLesson}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            Luyện Tai &amp; Phản Xạ
          </button>
        </div>
      </div>
    </div>
  );
}
