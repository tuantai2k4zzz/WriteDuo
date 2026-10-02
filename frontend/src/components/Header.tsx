'use client';

import React from 'react';
import { useLearningStore } from '../lib/store';
import { playSound } from '../lib/audio';
import { Flame, Zap, BookOpen, BookmarkCheck, Target, Sun, Moon, Shield } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    userProgress,
    activeLesson,
    themeMode,
    toggleThemeMode,
  } = useLearningStore();

  if (activeLesson) {
    return null;
  }

  const xp = userProgress?.xp ?? 140;
  const streak = userProgress?.streakCount ?? 3;

  const handleTabChange = (tab: 'learn' | 'vocab' | 'weakness') => {
    playSound('click');
    setCurrentTab(tab);
  };

  const handleThemeChange = () => {
    playSound('mode_switch');
    toggleThemeMode();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-500/20 bg-white/80 dark:bg-[#070b14]/90 backdrop-blur-xl transition-colors duration-300 shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo with Stark Arc Reactor Glow */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => handleTabChange('learn')}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md shadow-cyan-500/30 group-hover:shadow-[0_0_20px_rgba(0,242,254,0.6)] transition-all">
            <span className="text-xl font-black">W</span>
            {/* Miniature Arc Reactor Ring */}
            <div className="absolute inset-0 rounded-2xl border border-cyan-300/40 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-lg">
                Write
              </span>
              <span className="rounded-md bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-400">
                JARVIS 2026
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400">
              Interactive Reading & Writing
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => handleTabChange('learn')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-all ${
              currentTab === 'learn'
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Bài Học</span>
          </button>

          <button
            onClick={() => handleTabChange('vocab')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-all ${
              currentTab === 'vocab'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookmarkCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Từ Vựng</span>
          </button>

          <button
            onClick={() => handleTabChange('weakness')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-all ${
              currentTab === 'weakness'
                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Điểm Yếu</span>
          </button>
        </nav>

        {/* Gamification Stats & Theme Mode Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Mode Toggle (Stark Dark vs Clean Light) */}
          <button
            onClick={handleThemeChange}
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-cyan-500/30 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-cyan-300 hover:shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all active:scale-95"
            title="Đổi giao diện Sáng / Tối (Stark Tech)"
          >
            {themeMode === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </button>

          {/* Streak */}
          <div
            className="flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 shadow-xs"
            title="Chuỗi ngày liên tiếp"
          >
            <Flame className="h-4 w-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span className="text-xs font-black">{streak} ngày</span>
          </div>

          {/* XP */}
          <div
            className="flex items-center gap-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 px-3 py-1.5 border border-cyan-200 dark:border-cyan-900/60 text-cyan-700 dark:text-cyan-300 shadow-xs"
            title="Kinh nghiệm tích luỹ"
          >
            <Zap className="h-4 w-4 fill-cyan-500 text-cyan-500" />
            <span className="text-xs font-black">{xp} XP</span>
          </div>
        </div>
      </div>
    </header>
  );
};
