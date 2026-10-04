'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, CheckCircle2 } from 'lucide-react';

interface AIAnalysisLoaderProps {
  statusText?: string;
}

const analysisSteps = [
  { label: 'Semantic Matching', desc: 'So khớp ngữ nghĩa câu trả lời', icon: '🧠' },
  { label: 'Grammar & Syntax', desc: 'Kiểm tra cấu trúc và thì của câu', icon: '⚙️' },
  { label: 'Vocabulary & Nuance', desc: 'Đánh giá độ chuẩn xác từ vựng', icon: '📖' },
  { label: 'Naturalness Polish', desc: 'Đo lường độ tự nhiên bản ngữ', icon: '✨' },
];

export const AIAnalysisLoader: React.FC<AIAnalysisLoaderProps> = ({
  statusText = 'AI TUTOR ĐANG PHÂN TÍCH...',
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % analysisSteps.length);
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-400/40 bg-white/95 dark:bg-[#040915]/95 p-6 backdrop-blur-2xl shadow-[0_10px_40px_rgba(6,182,212,0.18)]">
      {/* Laser Scanning Line Animation */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06b6d4]"
        animate={{ y: [0, 160, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="flex flex-col items-center text-center space-y-4">
        {/* Holographic Arc Reactor Rings */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          {/* Outer dashed spinning ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/60"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />

          {/* Middle counter-rotating ring */}
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-cyan-500/40 border-t-cyan-400 border-b-cyan-400"
            animate={{ rotate: -360 }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
          />

          {/* Inner pulsing core */}
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.8)]"
            animate={{ scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Brain className="h-5 w-5 text-white" />
          </motion.div>
        </div>

        {/* Title */}
        <div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-black tracking-widest text-cyan-600 dark:text-cyan-400 uppercase">
            <Sparkles className="h-3.5 w-3.5 animate-spin" />
            <span>{statusText}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Next-Gen Neural Semantic Evaluation
          </p>
        </div>

        {/* 4 Multi-Layer Indicators */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-sm pt-2">
          {analysisSteps.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            const isDone = idx < currentStepIndex;

            return (
              <div
                key={step.label}
                className={`flex items-center gap-2 rounded-xl p-2 text-left transition-all duration-200 border ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-cyan-800 dark:text-cyan-200'
                    : isDone
                    ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-500/5 text-slate-700 dark:text-slate-300'
                    : 'border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-600'
                }`}
              >
                <span className="text-sm">{step.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold truncate">{step.label}</div>
                </div>
                {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
