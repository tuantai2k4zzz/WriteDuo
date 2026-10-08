'use client';

import React, { useState } from 'react';
import { useLearningStore } from '../lib/store';
import { playSound } from '../lib/audio';
import { Flame, Zap, BookOpen, BookmarkCheck, Target, Sun, Moon, LogIn, LogOut, Shield } from 'lucide-react';
import { AdminDashboardModal } from './admin/AdminDashboardModal';

export const Header: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    userProgress,
    user,
    openAuthModal,
    logout,
    activeLesson,
    themeMode,
    toggleThemeMode,
  } = useLearningStore();

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  if (activeLesson) {
    return null;
  }

  const xp = user ? (user.xp ?? userProgress?.xp ?? 0) : (userProgress?.xp ?? 0);
  const streak = user ? (user.streak ?? userProgress?.streakCount ?? 0) : (userProgress?.streakCount ?? 0);

  const handleTabChange = (tab: 'learn' | 'vocab' | 'weakness') => {
    playSound('click');
    setCurrentTab(tab);
  };

  const handleThemeChange = () => {
    playSound('mode_switch');
    toggleThemeMode();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-cyan-500/20 bg-white/90 dark:bg-[#070b14]/92 backdrop-blur-xl transition-colors duration-300 shadow-xs">
        <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-3 sm:px-6 gap-2">
          {/* Brand Logo with Stark Arc Reactor Glow */}
          <div
            className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
            onClick={() => handleTabChange('learn')}
          >
            <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md shadow-cyan-500/30 group-hover:shadow-[0_0_20px_rgba(0,242,254,0.6)] transition-all">
              <span className="text-base sm:text-xl font-black">W</span>
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl border border-cyan-300/40 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base sm:text-lg">
                  Write
                </span>
                <span className="rounded-md bg-cyan-500/15 border border-cyan-500/40 px-1.5 py-0.2 text-[9px] font-black font-mono uppercase text-cyan-600 dark:text-cyan-300">
                  OS
                </span>
              </div>
              <p className="hidden sm:block text-[11px] font-mono font-semibold text-slate-400">
                AI Adaptive Learning System
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Hidden on mobile) */}
          <nav className="hidden sm:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => handleTabChange('learn')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-all cursor-pointer ${
                currentTab === 'learn'
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Bài Học</span>
            </button>

            <button
              onClick={() => handleTabChange('vocab')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-all cursor-pointer ${
                currentTab === 'vocab'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookmarkCheck className="h-4 w-4" />
              <span>Từ Vựng</span>
            </button>

            <button
              onClick={() => handleTabChange('weakness')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-all cursor-pointer ${
                currentTab === 'weakness'
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Target className="h-4 w-4" />
              <span>Điểm Yếu</span>
            </button>
          </nav>

          {/* Gamification Stats & User Session Control */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Theme Mode Toggle (Stark Dark vs Clean Light) */}
            <button
              onClick={handleThemeChange}
              className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-cyan-500/30 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-cyan-300 hover:shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all active:scale-95 cursor-pointer"
              title="Đổi giao diện Sáng / Tối (Stark Tech)"
            >
              {themeMode === 'dark' ? (
                <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
              ) : (
                <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-700" />
              )}
            </button>

            {/* Streak */}
            <div
              className="flex items-center gap-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 px-2 sm:px-2.5 py-1 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 shadow-xs"
              title="Chuỗi ngày liên tiếp của bạn"
            >
              <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500 animate-pulse flex-shrink-0" />
              <span className="text-[11px] sm:text-xs font-black font-mono">
                {streak}<span className="hidden sm:inline"> ngày</span>
              </span>
            </div>

            {/* XP */}
            <div
              className="flex items-center gap-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 px-2 sm:px-2.5 py-1 border border-cyan-200 dark:border-cyan-900/60 text-cyan-700 dark:text-cyan-300 shadow-xs"
              title="Kinh nghiệm tích luỹ của bạn"
            >
              <Zap className="h-3.5 w-3.5 fill-cyan-500 text-cyan-500 flex-shrink-0" />
              <span className="text-[11px] sm:text-xs font-black font-mono">
                {xp} <span className="text-[10px] hidden sm:inline">XP</span>
              </span>
            </div>

            {/* Admin Management Button (Visible only to Admin users) */}
            {(user?.role === 'admin' || user?.email === 'admin@writeduo.com') && (
              <button
                onClick={() => {
                  playSound('click');
                  setIsAdminModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-purple-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 border border-purple-500/50 text-purple-700 dark:text-purple-200 text-xs font-black transition active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.25)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-pointer"
                title="Mở Bảng Điều Khiển Quản Trị Viên (Admin Panel)"
              >
                <Shield className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span className="hidden sm:inline">Quản Trị Users</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}

            {/* User Session Profile / Login Button */}
            {user ? (
              <div className="flex items-center gap-1 sm:gap-1.5 pl-0.5">
                <div
                  onClick={() => {
                    if (user?.role === 'admin' || user?.email === 'admin@writeduo.com') {
                      playSound('click');
                      setIsAdminModalOpen(true);
                    }
                  }}
                  className={`flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-xl border shadow-xs max-w-[130px] ${
                    user?.role === 'admin' || user?.email === 'admin@writeduo.com'
                      ? 'bg-purple-500/15 border-purple-500/40 cursor-pointer hover:bg-purple-500/25'
                      : user?.role === 'premium'
                      ? 'bg-amber-500/15 border-amber-500/40'
                      : 'bg-cyan-500/10 border-cyan-500/30'
                  }`}
                  title={`Đang đăng nhập: ${user.email} (Role: ${user.role || (user.email === 'admin@writeduo.com' ? 'admin' : 'user')})`}
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`}
                    alt={user.name}
                    className="h-5 w-5 sm:h-6 sm:w-6 rounded-lg bg-cyan-900/40 border border-cyan-400/40 flex-shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="hidden sm:inline text-xs font-bold text-slate-800 dark:text-cyan-200 truncate leading-tight">
                      {user.name}
                    </span>
                    {(user?.role === 'admin' || user?.email === 'admin@writeduo.com') && (
                      <span className="text-[9px] font-black text-purple-600 dark:text-purple-300 uppercase tracking-widest leading-none">
                        Admin 🛡️
                      </span>
                    )}
                    {user?.role === 'premium' && (
                      <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-none">
                        VIP 👑
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    playSound('click');
                    logout();
                  }}
                  className="flex items-center justify-center h-8 w-8 sm:h-auto sm:w-auto sm:px-2.5 sm:py-1 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer"
                  title="Đăng xuất tài khoản này"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline sm:ml-1">Thoát</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  playSound('click');
                  openAuthModal('login');
                }}
                className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-2.5 sm:px-3.5 py-1.5 text-xs font-black text-white shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:from-cyan-400 hover:to-blue-500 active:scale-95 transition-all cursor-pointer flex-shrink-0"
                title="Đăng nhập tài khoản"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="text-[11px] sm:text-xs">Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Dock (Visible on mobile only, perfect for thumb interaction) */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#070d1a]/95 backdrop-blur-2xl border-t border-cyan-500/20 px-3 py-1.5 shadow-[0_-4px_25px_rgba(0,0,0,0.15)] flex items-center justify-around">
        <button
          onClick={() => handleTabChange('learn')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentTab === 'learn'
              ? 'text-cyan-600 dark:text-cyan-400 font-black'
              : 'text-slate-500 dark:text-slate-400 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-lg ${currentTab === 'learn' ? 'bg-cyan-500/15' : ''}`}>
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-[10px]">Bài Học</span>
        </button>

        <button
          onClick={() => handleTabChange('vocab')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentTab === 'vocab'
              ? 'text-blue-600 dark:text-blue-400 font-black'
              : 'text-slate-500 dark:text-slate-400 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-lg ${currentTab === 'vocab' ? 'bg-blue-500/15' : ''}`}>
            <BookmarkCheck className="h-5 w-5" />
          </div>
          <span className="text-[10px]">Từ Vựng</span>
        </button>

        <button
          onClick={() => handleTabChange('weakness')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentTab === 'weakness'
              ? 'text-purple-600 dark:text-purple-400 font-black'
              : 'text-slate-500 dark:text-slate-400 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-lg ${currentTab === 'weakness' ? 'bg-purple-500/15' : ''}`}>
            <Target className="h-5 w-5" />
          </div>
          <span className="text-[10px]">Điểm Yếu</span>
        </button>
      </nav>

      {/* Admin Management Dashboard Modal */}
      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </>
  );
};
