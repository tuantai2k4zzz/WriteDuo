'use client';

import React from 'react';
import { Lesson } from '../types';
import { BookOpen, CheckCircle, ArrowRight, Layers, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  lesson: Lesson;
  onSelect: (lesson: Lesson) => void;
  isLoading?: boolean;
}

export const ReadingCard: React.FC<Props> = ({ lesson, onSelect, isLoading }) => {
  const getLevelConfig = (level: string) => {
    switch (level) {
      case 'A1': return { badge: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10', glow: 'shadow-emerald-500/20' };
      case 'A2': return { badge: 'border-teal-500/50 text-teal-400 bg-teal-500/10', glow: 'shadow-teal-500/20' };
      case 'B1': return { badge: 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10', glow: 'shadow-cyan-500/20' };
      case 'B2': return { badge: 'border-indigo-400/50 text-indigo-300 bg-indigo-500/10', glow: 'shadow-indigo-500/20' };
      case 'C1':
      case 'C2': return { badge: 'border-purple-400/50 text-purple-300 bg-purple-500/10', glow: 'shadow-purple-500/20' };
      case 'IELTS': return { badge: 'border-rose-400/50 text-rose-300 bg-rose-500/10', glow: 'shadow-rose-500/20' };
      case 'TOEIC': return { badge: 'border-amber-400/50 text-amber-300 bg-amber-500/10', glow: 'shadow-amber-500/20' };
      default: return { badge: 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10', glow: 'shadow-cyan-500/20' };
    }
  };

  const config = getLevelConfig(lesson.level);
  const isCompleted = lesson.isCompleted;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.97 }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all duration-300 cursor-pointer backdrop-blur-md
        ${isCompleted
          ? 'border-emerald-500/30 bg-emerald-50/80 dark:bg-[#0a1a12]/90 shadow-sm dark:shadow-emerald-500/10'
          : 'border-slate-200/90 dark:border-cyan-500/20 bg-white/95 dark:bg-[#060d1a]/95 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 shadow-sm hover:shadow-md dark:hover:shadow-cyan-500/15'
        }`}
    >
      {/* Scan line top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Completed glow overlay */}
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
      )}

      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-600 dark:text-cyan-400/70 font-mono">
            {lesson.topic}
          </span>
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-widest font-mono ${config.badge}`}>
            {lesson.level}
          </span>
        </div>

        {/* Title */}
        <h3 className={`text-base font-black tracking-tight leading-snug mb-2 line-clamp-2 transition-colors
          ${isCompleted ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300'}`}>
          {lesson.title}
        </h3>

        {/* Meta Stats */}
        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400/80 mb-5 font-mono">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3 w-3 text-cyan-600 dark:text-cyan-500/60" />
            <span>{lesson.wordCount} từ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="h-3 w-3 text-cyan-600 dark:text-cyan-500/60" />
            <span>{lesson.totalSentences} câu</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onSelect(lesson)}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-black tracking-wider uppercase transition-all duration-200 active:scale-95 disabled:opacity-60 font-mono
          ${isCompleted
            ? 'bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30'
            : 'bg-cyan-50 dark:bg-cyan-500/15 border border-cyan-300 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 hover:border-cyan-400'
          }`}
      >
        {isLoading ? (
          <>
            <Zap className="h-3.5 w-3.5 animate-pulse" />
            <span>Đang Tải...</span>
          </>
        ) : isCompleted ? (
          <>
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Luyện Lại</span>
          </>
        ) : (
          <>
            <span>Khởi Động</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      {/* Corner accent */}
      <div className="absolute bottom-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 right-0 w-full h-full"
          style={{
            background: 'radial-gradient(circle at 100% 100%, rgba(6,182,212,0.08) 0%, transparent 70%)',
          }}
        />
        <div className="absolute bottom-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
      </div>
    </motion.div>
  );
};
