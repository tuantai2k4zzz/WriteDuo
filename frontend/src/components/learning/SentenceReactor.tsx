'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sentence, Token, GrammarComponent } from '../../types';
import { playSound, speakEnglish } from '../../lib/audio';
import { Sparkles, Layers, Info } from 'lucide-react';

interface SentenceReactorProps {
  sentence: Sentence;
  onTokenClick?: (token: Token) => void;
}

export const SentenceReactor: React.FC<SentenceReactorProps> = ({
  sentence,
  onTokenClick,
}) => {
  const [activeComponent, setActiveComponent] = useState<GrammarComponent | null>(null);
  const [hoveredTokenIndex, setHoveredTokenIndex] = useState<number | null>(null);

  const grammar = sentence.grammarAnalysis;
  const components = grammar?.components || [];

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
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <span className="text-xs font-mono font-black tracking-wider text-cyan-700 dark:text-cyan-300 uppercase">
            SENTENCE REACTOR — BẢN ĐỒ CÚ PHÁP
          </span>
        </div>
        {grammar?.tense && (
          <span className="rounded-md bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-black text-cyan-700 dark:text-cyan-400">
            {grammar.tense}
          </span>
        )}
      </div>

      {/* Syntactic Structure Nodes (Subject, Verb, Object, Modifiers...) */}
      {components.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {components.map((comp, idx) => {
            const style = getRoleStyle(comp.role);
            const isSelected = activeComponent?.text === comp.text;

            return (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  playSound('click');
                  setActiveComponent(isSelected ? null : comp);
                }}
                className={`flex flex-col items-center rounded-xl px-3 py-2 border transition-all cursor-pointer ${
                  isSelected
                    ? `${style.bg} ${style.border} ring-2 ring-cyan-400/40`
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/60 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 15px ${style.glow}40` : 'none',
                }}
              >
                <span className={`text-[10px] font-mono font-bold tracking-wider uppercase mb-0.5 ${style.text}`}>
                  {comp.role}
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                  {comp.text}
                </span>
              </motion.button>
            );
          })}
        </div>
      ) : (
        /* If components not explicitly tagged, split sentence into interactive token chips */
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {sentence.tokens.map((token, idx) => (
            <motion.span
              key={idx}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                playSound('click');
                onTokenClick?.(token);
              }}
              onMouseEnter={() => setHoveredTokenIndex(idx)}
              onMouseLeave={() => setHoveredTokenIndex(null)}
              className="inline-flex flex-col items-center rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/80 border border-cyan-200 dark:border-cyan-500/20 hover:border-cyan-400 text-slate-900 dark:text-white cursor-pointer transition-all"
            >
              <span className="text-xs font-mono font-black text-cyan-800 dark:text-cyan-200">
                {token.text}
              </span>
              <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                {token.pos || 'word'}
              </span>
            </motion.span>
          ))}
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
