'use client';

import React, { useState } from 'react';
import { useLearningStore } from '../lib/store';
import { api } from '../lib/api';
import { playSound } from '../lib/audio';
import { X, Lock, Mail, User, ShieldCheck, Zap, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, openAuthModal, loadUser } = useLearningStore();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync mode with store when modal opens
  React.useEffect(() => {
    setMode(authModalMode || 'login');
    setErrorMsg(null);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ Email và Mật khẩu.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên của bạn.');
      return;
    }

    try {
      setLoading(true);
      playSound('click');

      if (mode === 'login') {
        await api.login(email.trim(), password);
      } else {
        await api.register(email.trim(), password, name.trim());
      }

      await loadUser();
      playSound('complete');
      closeAuthModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'Xác thực không thành công. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (testEmail: string, testName: string) => {
    setEmail(testEmail);
    setPassword('Password123!');
    setName(testName);
    setErrorMsg(null);
    playSound('click');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-cyan-500/40 bg-white/95 dark:bg-[#070d1a]/95 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,242,254,0.25)] backdrop-blur-2xl"
        >
          {/* Header Glow Reactor */}
          <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={() => {
              playSound('click');
              closeAuthModal();
            }}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header Identity */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/30 mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {mode === 'login' ? 'Đăng Nhập WriteDuo' : 'Tạo Tài Khoản Mới'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {mode === 'login'
                ? 'Dữ liệu học tập, từ vựng và XP được cô lập riêng theo tài khoản'
                : 'Bắt đầu hành trình học tiếng Anh với không gian dữ liệu riêng biệt'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-600 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold font-mono text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Họ và tên
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full rounded-xl border border-cyan-500/30 bg-slate-50 dark:bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold font-mono text-slate-600 dark:text-slate-300 uppercase mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-cyan-500/30 bg-slate-50 dark:bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold font-mono text-slate-600 dark:text-slate-300 uppercase mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-cyan-500/30 bg-slate-50 dark:bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Đăng Nhập Ngay' : 'Kích Hoạt Tài Khoản'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Test Accounts for instant verification */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/10">
            <p className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase text-center mb-2">
              ⚡ Tài khoản thử nghiệm độc lập dữ liệu:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('test-a@example.com', 'Learner A')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/30 px-2 py-1.5 text-[11px] font-bold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors cursor-pointer"
              >
                <KeyRound className="h-3 w-3" />
                <span>Test User A</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('test-b@example.com', 'Learner B')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/30 px-2 py-1.5 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
              >
                <KeyRound className="h-3 w-3" />
                <span>Test User B</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="mt-4 text-center">
            {mode === 'login' ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                >
                  Đăng ký miễn phí
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                >
                  Đăng nhập
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
