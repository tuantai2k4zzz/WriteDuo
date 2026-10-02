'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Shield, Cpu, Terminal, Radio } from 'lucide-react';

export const TuantaidzBrandPlate: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="relative inline-flex items-center gap-2 rounded-xl px-3 py-1.5 backdrop-blur-md overflow-hidden bg-white/90 dark:bg-[#020617]/90 border border-cyan-300 dark:border-cyan-500/40 shadow-sm dark:shadow-[0_0_20px_rgba(6,182,212,0.2)]">
        <div className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-mono tracking-widest text-cyan-600 dark:text-cyan-400 font-bold uppercase">
            OPERATING SYSTEM
          </span>
          <span className="text-xs font-black font-mono tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
            TUANTAIDZ <span className="text-amber-500 dark:text-amber-400">PRO</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl p-6 sm:p-7 mb-8 backdrop-blur-2xl bg-gradient-to-br from-cyan-50/80 via-white/90 to-blue-50/80 dark:from-[#030a1c]/95 dark:via-[#071230]/92 dark:to-[#0c1840]/95 border border-cyan-200/90 dark:border-cyan-500/45 shadow-sm dark:shadow-[0_0_60px_rgba(6,182,212,0.15)]"
    >
      {/* ── TOP NEON LASER STRIP ── */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent, #06b6d4, #f59e0b, #06b6d4, transparent)',
          boxShadow: '0 0 15px #06b6d4',
        }}
      />

      {/* ── CORNER ACCENT BRACKETS ── */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-500 dark:border-cyan-400 rounded-tl-2xl" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-500 dark:border-amber-400 rounded-tr-2xl" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-500/50 dark:border-cyan-400/50 rounded-bl-2xl" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-500/50 dark:border-amber-400/50 rounded-br-2xl" />

      {/* ── BACKGROUND WATERMARK BRAND ── */}
      <div
        className="pointer-events-none absolute -right-6 -bottom-6 text-7xl sm:text-8xl font-black font-mono tracking-tighter opacity-[0.04] dark:opacity-[0.05] select-none text-cyan-600 dark:text-cyan-300"
      >
        TUANTAIDZ
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Info: Neon Signboard Plate */}
        <div className="flex items-start gap-4 sm:gap-5">
          {/* Cyber Insignia Core */}
          <div className="relative flex h-16 w-16 sm:h-18 sm:w-18 flex-shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-amber-500/15 dark:from-cyan-500/20 dark:to-amber-500/20 border-2 border-cyan-400 dark:border-cyan-500/60 shadow-md shadow-cyan-500/20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-1 rounded-xl border border-dashed border-cyan-400/50"
            />
            <div className="flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tighter text-cyan-700 dark:text-white drop-shadow-[0_0_12px_#06b6d4]">
                T
              </span>
              <span className="text-[8px] font-mono font-bold text-amber-600 dark:text-amber-400 tracking-widest -mt-1">
                DZ
              </span>
            </div>
          </div>

          <div>
            {/* System Status Ticker */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black font-mono tracking-wider uppercase text-cyan-700 dark:text-cyan-300 backdrop-blur-md bg-cyan-100/70 dark:bg-cyan-500/12 border border-cyan-200 dark:border-cyan-500/35"
              >
                <Radio className="h-3 w-3 text-cyan-600 dark:text-cyan-400 animate-pulse" />
                <span>TUANTAIDZ LEARNING OS · 2026</span>
              </span>

              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping mr-0.5" />
                NEURAL ENGINE ONLINE
              </span>
            </div>

            {/* Glowing Main Title */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 flex-wrap">
              <span>TRUNG TÂM ĐIỀU HÀNH</span>
              <span
                className="font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-sky-600 to-amber-600 dark:from-cyan-300 dark:via-sky-400 dark:to-amber-400 filter drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]"
              >
                TUANTAIDZ
              </span>
            </h2>

            <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300/80 max-w-xl">
              Hệ điều hành huấn luyện phản xạ tiếng Anh tự thích ứng: Phân tích cú pháp sâu · Trí nhớ dài hạn SRS · Thách thức ngôn ngữ tương tác.
            </p>
          </div>
        </div>

        {/* Right HUD Hardware Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 flex-shrink-0 md:max-w-xs w-full">
          <div
            className="rounded-xl p-2.5 text-center bg-white/80 dark:bg-white/[0.03] border border-cyan-200 dark:border-cyan-500/20 shadow-xs dark:shadow-none"
          >
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">CHỈ HUY</div>
            <div className="text-xs font-black font-mono text-cyan-700 dark:text-cyan-300">TUẤN TÀI DZ</div>
          </div>

          <div
            className="rounded-xl p-2.5 text-center bg-white/80 dark:bg-white/[0.03] border border-amber-200 dark:border-amber-500/20 shadow-xs dark:shadow-none"
          >
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">GIAO THỨC</div>
            <div className="text-xs font-black font-mono text-amber-700 dark:text-amber-300">QUANTUM AI</div>
          </div>

          <div
            className="rounded-xl p-2.5 text-center col-span-2 sm:col-span-1 bg-white/80 dark:bg-white/[0.03] border border-emerald-200 dark:border-emerald-500/20 shadow-xs dark:shadow-none"
          >
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">TRẠNG THÁI</div>
            <div className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-300">SẴN SÀNG</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
