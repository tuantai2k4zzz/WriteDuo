'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { playSound } from '../../lib/audio';

interface TimeRewindRepairProps {
  userSnippet: string;
  fixedSnippet: string;
  reason?: string;
  rule?: string;
  onClose?: () => void;
}

export const TimeRewindRepair: React.FC<TimeRewindRepairProps> = ({
  userSnippet,
  fixedSnippet,
  reason,
  rule,
}) => {
  const [phase, setPhase] = useState<'anomaly' | 'repaired'>('anomaly');

  useEffect(() => {
    // Automatically transition from anomaly detected to repaired state within 900ms
    const timer = setTimeout(() => {
      setPhase('repaired');
      playSound('correct');
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 my-4 backdrop-blur-md transition-all duration-300 border ${
        phase === 'anomaly'
          ? 'bg-rose-50/95 dark:bg-gradient-to-br dark:from-[#260610]/95 dark:to-[#140408]/98 border-rose-300 dark:border-rose-500/50 shadow-sm dark:shadow-[0_0_30px_rgba(244,63,94,0.15)]'
          : 'bg-emerald-50/95 dark:bg-gradient-to-br dark:from-[#041e14]/95 dark:to-[#020f0a]/98 border-emerald-300 dark:border-emerald-500/50 shadow-sm dark:shadow-[0_0_30px_rgba(16,185,129,0.15)]'
      }`}
    >
      {/* Top Status */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {phase === 'anomaly' ? (
            <>
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 animate-pulse" />
              <span className="text-xs font-mono font-black text-rose-700 dark:text-rose-300 tracking-wider uppercase">
                PHÁT HIỆN DỊ THƯỜNG CÚ PHÁP
              </span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-300 tracking-wider uppercase">
                ĐÃ SỬA CHỮA (TIME REWIND)
              </span>
            </>
          )}
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-black/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
          TUANTAIDZ REPAIR PROTOCOL
        </span>
      </div>

      {/* Snippet Transformation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-3 bg-white/90 dark:bg-black/40 border border-slate-200 dark:border-white/5 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Bạn viết:</span>
          <span className="text-sm font-black text-rose-600 dark:text-rose-400 line-through">
            "{userSnippet}"
          </span>
        </div>

        <ArrowRight className="hidden sm:block h-4 w-4 text-slate-400 dark:text-slate-500" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Chuẩn xác:</span>
          <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
            "{fixedSnippet}"
          </span>
        </div>
      </div>

      {/* Reason & Rule */}
      {(reason || rule) && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col gap-1 text-xs">
          {rule && (
            <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300 font-mono font-bold">
              <Zap className="h-3.5 w-3.5" />
              <span>Quy tắc: {rule}</span>
            </div>
          )}
          {reason && (
            <p className="text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
              💡 {reason}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
