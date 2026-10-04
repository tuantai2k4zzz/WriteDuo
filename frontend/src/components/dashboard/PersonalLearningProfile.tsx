'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PersonalLearningProfile as ProfileType, SkillMasteryScores } from '../../types';
import { DepthCard } from '../motion/DepthCard';
import { AnimatedNumber } from '../motion/AnimatedNumber';
import { MagneticButton } from '../motion/MagneticButton';
import {
  Trophy,
  Flame,
  Zap,
  BookOpen,
  AlertCircle,
  Brain,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Target,
  Compass,
} from 'lucide-react';

interface PersonalLearningProfileProps {
  profile: ProfileType | null;
  onStartFirstLesson: () => void;
  onOpenWeaknessTab?: () => void;
  onOpenVocabTab?: () => void;
}

export const PersonalLearningProfile: React.FC<PersonalLearningProfileProps> = ({
  profile,
  onStartFirstLesson,
  onOpenWeaknessTab,
  onOpenVocabTab,
}) => {
  // If user is brand new with no activity yet
  const isNewLearner = !profile || (!profile.learningStatistics.hasActivity && profile.xp === 0);

  if (isNewLearner) {
    return (
      <DepthCard glowColor="cyan" className="p-8 mb-8 text-center relative overflow-hidden">
        {/* Onboarding Holographic Pulse */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_30px_rgba(6,182,212,0.4)] mb-5">
          <Sparkles className="h-10 w-10 text-white animate-pulse" />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-400/30 mb-3">
          CHÀO MỪNG BẠN ĐẾN VỚI LearnEN 2026 OS
        </span>

        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Chưa Có Dữ Liệu Học Cá Nhân
        </h3>

        <p className="max-w-md mx-auto text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed font-medium">
          Hệ thống AI Tutor đang sẵn sàng thiết lập Ma trận Năng lực riêng cho bạn. Hãy hoàn thành bài học đầu tiên để kích hoạt phân tích điểm mạnh và điểm yếu.
        </p>

        <MagneticButton
          onClick={onStartFirstLesson}
          className="rounded-xl px-7 py-3 text-sm font-mono font-black text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_4px_25px_rgba(6,182,212,0.4)]"
        >
          <span className="flex items-center gap-2">
            <span>🚀 Bắt Đầu Bài Học Đầu Tiên</span>
            <ArrowRight className="h-4 w-4" />
          </span>
        </MagneticButton>
      </DepthCard>
    );
  }

  const {
    xp,
    streak,
    currentLevel,
    dailyGoalXp,
    todayXp,
    savedVocabulary,
    weakVocabulary,
    grammarWeakness,
    mastery,
    readingProgress,
    translationProgress,
    adaptiveRecommendation,
  } = profile;

  const xpProgressPercent = Math.min(100, Math.round((todayXp / Math.max(1, dailyGoalXp)) * 100));

  const skillList: Array<{ key: keyof SkillMasteryScores; label: string; icon: string; color: string }> = [
    { key: 'grammar', label: 'Ngữ Pháp', icon: '⚙️', color: 'from-cyan-500 to-blue-500' },
    { key: 'vocabulary', label: 'Từ Vựng', icon: '📚', color: 'from-blue-500 to-indigo-500' },
    { key: 'translation', label: 'Phản Xạ Dịch', icon: '🔄', color: 'from-indigo-500 to-purple-500' },
    { key: 'pronunciation', label: 'Phát Âm & IPA', icon: '🎙️', color: 'from-purple-500 to-pink-500' },
    { key: 'listening', label: 'Nghe Hiểu', icon: '🎧', color: 'from-pink-500 to-rose-500' },
    { key: 'reading', label: 'Đọc Hiểu', icon: '📖', color: 'from-emerald-500 to-teal-500' },
    { key: 'writing', label: 'Viết Đoạn Văn', icon: '✍️', color: 'from-amber-500 to-orange-500' },
    { key: 'speaking', label: 'Giao Tiếp', icon: '💬', color: 'from-rose-500 to-red-500' },
  ];

  return (
    <div className="space-y-6 mb-8">
      {/* ── TOP STATS COMMAND CENTER ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Level */}
        <DepthCard glowColor="cyan" className="p-4">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold mb-1">
            <span>LEVEL HIỆN TẠI</span>
            <Trophy className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {currentLevel}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {readingProgress.completedCount} bài đọc đã hoàn thành
          </div>
        </DepthCard>

        {/* Total XP */}
        <DepthCard glowColor="amber" className="p-4">
          <div className="flex items-center justify-between text-xs font-mono text-amber-600 dark:text-amber-400 font-bold mb-1">
            <span>TỔNG ĐIỂM XP</span>
            <Zap className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            <AnimatedNumber value={xp} suffix=" XP" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Mục tiêu hôm nay: {todayXp}/{dailyGoalXp} XP ({xpProgressPercent}%)
          </div>
        </DepthCard>

        {/* Streak */}
        <DepthCard glowColor="amber" className="p-4">
          <div className="flex items-center justify-between text-xs font-mono text-orange-600 dark:text-orange-400 font-bold mb-1">
            <span>CHUỖI HỌC TẬP</span>
            <Flame className="h-4 w-4 fill-current text-orange-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <AnimatedNumber value={streak} />
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">ngày</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Học mỗi ngày để giữ streak!
          </div>
        </DepthCard>

        {/* Vocabulary & Weakness */}
        <DepthCard glowColor="violet" className="p-4">
          <div className="flex items-center justify-between text-xs font-mono text-violet-600 dark:text-violet-400 font-bold mb-1">
            <span>SỔ TAY TỪ VỰNG</span>
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            <AnimatedNumber value={savedVocabulary.total} />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {weakVocabulary.total > 0 ? (
              <span className="text-rose-500 font-bold">{weakVocabulary.total} từ cần củng cố</span>
            ) : (
              <span className="text-emerald-500 font-bold">Chưa có từ vựng yếu</span>
            )}
          </div>
        </DepthCard>
      </div>

      {/* ── 8-DIMENSION SKILL MATRIX ── */}
      <DepthCard glowColor="cyan" className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white font-mono">
                MA TRẬN NĂNG LỰC 8 CHIỀU — NEXT-GEN LEARNING MATRIX
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Đo lường năng lực thực tế được đồng bộ trực tiếp từ AI Tutor
            </p>
          </div>

          {adaptiveRecommendation && (
            <div className="flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30 px-3 py-1.5 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300">
              <Target className="h-3.5 w-3.5" />
              <span>Ưu tiên: {adaptiveRecommendation.priorityArea}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {skillList.map((s) => {
            const score = mastery[s.key] ?? 50;
            return (
              <div
                key={s.key}
                className="group relative rounded-xl p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 hover:border-cyan-400/40 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">{s.icon}</span>
                  <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-200">
                    <AnimatedNumber value={score} suffix="%" />
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate mb-2">
                  {s.label}
                </div>
                {/* Micro Progress Bar */}
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full bg-gradient-to-r ${s.color}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Grammar Weaknesses Alert strip if any */}
        {grammarWeakness && grammarWeakness.length > 0 && (
          <div className="mt-5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <div className="text-xs text-rose-900 dark:text-rose-200 font-medium">
                <span className="font-bold">Điểm yếu cần chú ý: </span>
                {grammarWeakness.slice(0, 3).map((w) => `${w.tag} (${w.errorCount} lần sai)`).join(' · ')}
              </div>
            </div>

            {onOpenWeaknessTab && (
              <button
                onClick={onOpenWeaknessTab}
                className="text-xs font-mono font-black text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer flex-shrink-0"
              >
                <span>Xem chi tiết lỗi</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </DepthCard>
    </div>
  );
};
