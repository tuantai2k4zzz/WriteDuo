'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable Holographic Panel with cyber borders, glassmorphism, and HUD corners
 */
export interface HolographicPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: 'cyan' | 'amber' | 'emerald' | 'violet' | 'rose';
  className?: string;
  hasScanline?: boolean;
}

export const HolographicPanel: React.FC<HolographicPanelProps> = ({
  children,
  glowColor = 'cyan',
  className = '',
  hasScanline = false,
  style,
  ...props
}) => {
  const colorMap = {
    cyan: {
      wrapper: 'bg-white/95 dark:bg-gradient-to-br dark:from-[#040b1a]/95 dark:to-[#061026]/95 border-cyan-200/90 dark:border-cyan-500/25 shadow-sm shadow-cyan-100/50 dark:shadow-[0_0_35px_rgba(6,182,212,0.08)]',
      corner: 'border-cyan-500 dark:border-cyan-400',
      scanline: 'rgba(6, 182, 212, 0.7)',
    },
    amber: {
      wrapper: 'bg-white/95 dark:bg-gradient-to-br dark:from-[#1a1004]/95 dark:to-[#261606]/95 border-amber-200/90 dark:border-amber-500/25 shadow-sm shadow-amber-100/50 dark:shadow-[0_0_35px_rgba(245,158,11,0.08)]',
      corner: 'border-amber-500 dark:border-amber-400',
      scanline: 'rgba(245, 158, 11, 0.7)',
    },
    emerald: {
      wrapper: 'bg-white/95 dark:bg-gradient-to-br dark:from-[#041a10]/95 dark:to-[#062618]/95 border-emerald-200/90 dark:border-emerald-500/25 shadow-sm shadow-emerald-100/50 dark:shadow-[0_0_35px_rgba(16,185,129,0.08)]',
      corner: 'border-emerald-500 dark:border-emerald-400',
      scanline: 'rgba(16, 185, 129, 0.7)',
    },
    violet: {
      wrapper: 'bg-white/95 dark:bg-gradient-to-br dark:from-[#120826]/95 dark:to-[#1a0c36]/95 border-violet-200/90 dark:border-violet-500/25 shadow-sm shadow-violet-100/50 dark:shadow-[0_0_35px_rgba(139,92,246,0.08)]',
      corner: 'border-violet-500 dark:border-violet-400',
      scanline: 'rgba(139, 92, 246, 0.7)',
    },
    rose: {
      wrapper: 'bg-white/95 dark:bg-gradient-to-br dark:from-[#260610]/95 dark:to-[#360818]/95 border-rose-200/90 dark:border-rose-500/25 shadow-sm shadow-rose-100/50 dark:shadow-[0_0_35px_rgba(244,63,94,0.08)]',
      corner: 'border-rose-500 dark:border-rose-400',
      scanline: 'rgba(244, 63, 94, 0.7)',
    },
  };

  const theme = colorMap[glowColor];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 ${theme.wrapper} ${className}`}
      style={style}
      {...props}
    >
      {/* 4 Tech Corner Brackets */}
      <div
        className={`pointer-events-none absolute top-0 left-0 h-3 w-3 rounded-tl-lg border-t-2 border-l-2 ${theme.corner}`}
      />
      <div
        className={`pointer-events-none absolute top-0 right-0 h-3 w-3 rounded-tr-lg border-t-2 border-r-2 ${theme.corner}`}
      />
      <div
        className={`pointer-events-none absolute bottom-0 left-0 h-3 w-3 rounded-bl-lg border-b-2 border-l-2 ${theme.corner}`}
      />
      <div
        className={`pointer-events-none absolute bottom-0 right-0 h-3 w-3 rounded-br-lg border-b-2 border-r-2 ${theme.corner}`}
      />

      {/* Optional Animated Scanline */}
      {hasScanline && (
        <div
          className="pointer-events-none absolute inset-x-0 h-[1.5px] opacity-40"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.scanline}, transparent)`,
            animation: 'scanline 5s linear infinite',
          }}
        />
      )}

      {children}
    </div>
  );
};

/**
 * Neon Badge for status, metrics, and CEFR indicators
 */
export const NeonBadge: React.FC<{
  label: string;
  color?: 'cyan' | 'amber' | 'emerald' | 'violet' | 'rose';
  icon?: React.ReactNode;
  pulse?: boolean;
}> = ({ label, color = 'cyan', icon, pulse = false }) => {
  const styles = {
    cyan: 'bg-cyan-100/80 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/30 shadow-xs dark:shadow-[0_0_12px_rgba(6,182,212,0.15)]',
    amber: 'bg-amber-100/80 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30 shadow-xs dark:shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    emerald: 'bg-emerald-100/80 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    violet: 'bg-violet-100/80 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-500/30 shadow-xs dark:shadow-[0_0_12px_rgba(139,92,246,0.15)]',
    rose: 'bg-rose-100/80 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/30 shadow-xs dark:shadow-[0_0_12px_rgba(244,63,94,0.15)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-mono font-black tracking-wider uppercase backdrop-blur-md ${styles[color]}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-current" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {icon}
      <span>{label}</span>
    </span>
  );
};

/**
 * High-tech Energy / Progress Bar
 */
export const EnergyBar: React.FC<{
  value: number; // 0 to 100
  color?: 'cyan' | 'amber' | 'emerald' | 'violet';
  height?: string;
  showTicks?: boolean;
}> = ({ value, color = 'cyan', height = 'h-2', showTicks = true }) => {
  const gradientMap = {
    cyan: 'linear-gradient(90deg, #0284c7, #06b6d4, #22d3ee)',
    amber: 'linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)',
    emerald: 'linear-gradient(90deg, #059669, #10b981, #34d399)',
    violet: 'linear-gradient(90deg, #7c3aed, #8b5cf6, #c4b5fd)',
  };

  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`relative w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/50 ${height}`}>
      <motion.div
        className="h-full rounded-full transition-all duration-500"
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        style={{
          background: gradientMap[color],
          boxShadow: `0 0 12px ${color === 'cyan' ? '#06b6d4' : color === 'amber' ? '#f59e0b' : color === 'emerald' ? '#10b981' : '#8b5cf6'}`,
        }}
      />
      {showTicks && (
        <div className="pointer-events-none absolute inset-0 flex justify-between px-1 opacity-20">
          {[25, 50, 75].map((tick) => (
            <div key={tick} className="h-full w-px bg-slate-500 dark:bg-white" />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * AI Thinking & Scanning Indicator (replacing simple spinners)
 */
export const AIThinkingIndicator: React.FC<{
  message?: string;
  subtext?: string;
}> = ({
  message = 'TUANTAIDZ AI ĐANG PHÂN TÍCH...',
  subtext = 'Neural Syntax Engine · Semantic Mapping',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      {/* Holographic Ring Scanner */}
      <div className="relative flex h-16 w-16 items-center justify-center mb-4">
        {/* Outer rotating dashed ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/60"
        />
        {/* Inner reverse rotating ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-2 rounded-full border border-cyan-300/40 border-t-cyan-400"
        />
        {/* Center pulsing core */}
        <motion.div
          animate={{ scale: [0.85, 1.15, 0.85] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="h-4 w-4 rounded-full bg-cyan-400 shadow-[0_0_16px_#22d3ee]"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
        </span>
        <h4 className="text-sm font-black font-mono tracking-wider text-cyan-700 dark:text-cyan-300">
          {message}
        </h4>
      </div>
      <p className="mt-1 text-xs font-mono text-slate-600 dark:text-slate-400">
        {subtext}
      </p>
    </div>
  );
};

/**
 * Circular Progress Ring for HUD statistics
 */
export const ProgressRing: React.FC<{
  progress: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}> = ({
  progress,
  size = 110,
  strokeWidth = 8,
  color = '#06b6d4',
  label,
  sublabel,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          className="text-slate-200 dark:text-white/10"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-base font-black font-mono text-slate-900 dark:text-white leading-none">
          {label ?? `${Math.round(progress)}%`}
        </span>
        {sublabel && (
          <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};
