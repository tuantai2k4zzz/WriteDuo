'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sentence, Token, GrammarComponent } from '../../types';
import { playSound } from '../../lib/audio';
import { Layers, Info, Lock, Unlock, Eye, EyeOff } from 'lucide-react';

interface SentenceReactorProps {
  sentence: Sentence;
  onTokenClick?: (token: Token) => void;
}

export const SentenceReactor: React.FC<SentenceReactorProps> = ({
  sentence,
  onTokenClick,
}) => {
  const [activeComponent, setActiveComponent] = useState<GrammarComponent | null>(null);
  const [unlockedIndices, setUnlockedIndices] = useState<Set<number>>(new Set());

  // Reset unlocked state when sentence changes so learner always starts with hidden blueprint
  useEffect(() => {
    setUnlockedIndices(new Set());
    setActiveComponent(null);
  }, [sentence._id]);

  const grammar = sentence.grammarAnalysis;
  const components = grammar?.components || [];
  const totalItems = components.length > 0 ? components.length : sentence.tokens.length;
  const allUnlocked = unlockedIndices.size === totalItems && totalItems > 0;

  const handleToggleUnlock = (idx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playSound('click');
    setUnlockedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    playSound('click');
    if (allUnlocked) {
      setUnlockedIndices(new Set());
    } else {
      const all = new Set<number>();
      for (let i = 0; i < totalItems; i++) all.add(i);
      setUnlockedIndices(all);
    }
  };

  // Categorize colors by grammatical role
  const getRoleStyle = (role: string) => {
    const lower = role.toLowerCase();
    if (lower.includes('subject') || lower.includes('chủ')) {
      return { border: 'border-cyan-400/60', text: 'text-cyan-700 dark:text-cyan-300', bg: 'bg-cyan-50 dark:bg-cyan-500/10', glow: '#06b6d4' };
    }
    if (lower.includes('verb') || lower.includes('động') || lower.includes('auxiliary')) {
      return { border: 'border-amber-400/60', text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-500/10', glow: '#f59e0b' };
    }
    if (lower.includes('object') || lower.includes('tân')) {
      return { border: 'border-violet-400/60', text: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-50 dark:bg-violet-500/10', glow: '#8b5cf6' };
    }
    if (lower.includes('duration') || lower.includes('time') || lower.includes('thời')) {
      return { border: 'border-emerald-400/60', text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-500/10', glow: '#10b981' };
    }
    return { border: 'border-rose-400/60', text: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 dark:bg-rose-500/10', glow: '#f43f5e' };
  };

  return (
    <div className="relative rounded-2xl p-4 sm:p-5 mb-5 backdrop-blur-md bg-white/95 dark:bg-gradient-to-br dark:from-[#060f23]/92 dark:to-[#030816]/95 border border-cyan-200 dark:border-cyan-500/30 shadow-xs dark:shadow-[0_0_30px_rgba(6,182,212,0.08)]">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 mb-2.5 flex-wrap">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <span className="text-xs font-mono font-black tracking-wider text-cyan-700 dark:text-cyan-300 uppercase">
            SENTENCE REACTOR — BẢN ĐỒ CÚ PHÁP
          </span>
        </div>

        <div className="flex items-center gap-2">
          {grammar?.tense && (
            <span className="rounded-md bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-black text-cyan-700 dark:text-cyan-400">
              {grammar.tense}
            </span>
          )}

          {/* Toggle all lock / unlock button */}
          <button
            type="button"
            onClick={handleToggleAll}
            className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title={allUnlocked ? 'Khóa tất cả từ' : 'Mở khóa tất cả từ'}
          >
            {allUnlocked ? (
              <>
                <Lock className="h-2.5 w-2.5 text-amber-500" />
                <span>Khóa lại</span>
              </>
            ) : (
              <>
                <Unlock className="h-2.5 w-2.5 text-cyan-500" />
                <span>Mở hết</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Helpful hint for user */}
      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5 font-mono">
        <Lock className="h-3 w-3 text-amber-500 flex-shrink-0" />
        <span>Các từ vựng được khóa để luyện phản xạ tự nhớ. Bấm vào từng ô để mở khóa gợi ý khi cần.</span>
      </p>

      {/* Syntactic Structure Nodes (Subject, Verb, Object, Modifiers...) */}
      {components.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {components.map((comp, idx) => {
            const style = getRoleStyle(comp.role);
            const isSelected = activeComponent?.text === comp.text;
            const isUnlocked = unlockedIndices.has(idx);

            return (
              <motion.button
                type="button"
                key={idx}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={(e) => {
                  if (!isUnlocked) {
                    handleToggleUnlock(idx, e);
                  } else {
                    playSound('click');
                    setActiveComponent(isSelected ? null : comp);
                  }
                }}
                className={`flex flex-col items-center rounded-xl px-3 py-2 border transition-all cursor-pointer ${
                  isSelected
                    ? `${style.bg} ${style.border} ring-2 ring-cyan-400/40`
                    : isUnlocked
                    ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/60 hover:border-slate-400 dark:hover:border-slate-500'
                    : 'bg-slate-100/70 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-cyan-500/25 hover:border-cyan-400/60'
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 15px ${style.glow}40` : 'none',
                }}
                title={isUnlocked ? 'Bấm để xem phân tích cú pháp' : 'Bấm để mở khóa từ này'}
              >
                <span className={`text-[10px] font-mono font-bold tracking-wider uppercase mb-0.5 ${style.text}`}>
                  {comp.role}
                </span>

                {isUnlocked ? (
                  <motion.span
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-sm font-black text-slate-900 dark:text-white font-mono"
                  >
                    {comp.text}
                  </motion.span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-mono font-black text-slate-400 dark:text-slate-500 py-0.5">
                    <Lock className="h-3 w-3 text-amber-500/80" />
                    <span>•••</span>
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      ) : (
        /* If components not explicitly tagged, split sentence into interactive token chips */
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {sentence.tokens.map((token, idx) => {
            const isUnlocked = unlockedIndices.has(idx);

            return (
              <motion.button
                type="button"
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!isUnlocked) {
                    handleToggleUnlock(idx);
                  } else {
                    playSound('click');
                    onTokenClick?.(token);
                  }
                }}
                className={`inline-flex flex-col items-center rounded-lg px-2.5 py-1.5 border transition-all cursor-pointer ${
                  isUnlocked
                    ? 'bg-slate-50 dark:bg-slate-900/80 border-cyan-200 dark:border-cyan-500/30 text-slate-900 dark:text-white hover:border-cyan-400'
                    : 'bg-slate-100/60 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-cyan-500/20 text-slate-400 dark:text-slate-500 hover:border-cyan-400/60'
                }`}
                title={isUnlocked ? 'Bấm để tra cứu nghĩa từ vựng' : 'Bấm để mở khóa từ này'}
              >
                {isUnlocked ? (
                  <motion.span
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-xs font-mono font-black text-cyan-800 dark:text-cyan-200"
                  >
                    {token.text}
                  </motion.span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-mono font-black text-slate-400 dark:text-slate-500">
                    <Lock className="h-2.5 w-2.5 text-amber-500/80" />
                    <span>•••</span>
                  </span>
                )}
                <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                  {token.pos || 'word'}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Holographic Explanation Popover for clicked component */}
      <AnimatePresence>
        {activeComponent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl p-3.5 mt-2 bg-cyan-50/90 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/35 shadow-xs"
          >
            <div className="flex items-center gap-2 mb-1">
              <Info className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-mono font-black text-cyan-700 dark:text-cyan-300">
                VAI TRÒ: {activeComponent.role.toUpperCase()} ({activeComponent.text})
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
              {activeComponent.noteVi ||
                `Thành phần "${activeComponent.text}" đảm nhiệm vai trò ${activeComponent.role} trong câu, tạo nên mạch ngữ nghĩa chuẩn xác.`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

