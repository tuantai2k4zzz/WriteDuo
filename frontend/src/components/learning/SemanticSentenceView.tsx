'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SemanticEvaluationData,
  SemanticTokenDiff,
  SemanticTokenStatus,
  SemanticAlternative,
} from '../../types';
import { Sparkles, Check, AlertCircle, Info, ChevronRight, Zap, BookOpen } from 'lucide-react';
import { playSound } from '../../lib/audio';

interface SemanticSentenceViewProps {
  semanticData?: SemanticEvaluationData;
  userAnswer: string;
  referenceAnswer: string;
}

export const SemanticSentenceView: React.FC<SemanticSentenceViewProps> = ({
  semanticData,
  userAnswer,
  referenceAnswer,
}) => {
  const [selectedToken, setSelectedToken] = useState<SemanticTokenDiff | null>(null);

  // If semanticData is not yet populated (fallback mode), generate simple tokens
  const tokenDiffs: SemanticTokenDiff[] =
    semanticData?.tokenDiffs && semanticData.tokenDiffs.length > 0
      ? semanticData.tokenDiffs
      : userAnswer
          .trim()
          .split(/\s+/)
          .map((t) => ({
            learnerToken: t,
            status: 'EXACT_CORRECT',
          }));

  const alternatives: SemanticAlternative[] = semanticData?.alternatives || [];
  const scores = semanticData?.scores;

  const getStatusStyle = (status: SemanticTokenStatus) => {
    switch (status) {
      case 'EXACT_CORRECT':
        return {
          pill: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20',
          dot: 'bg-emerald-400',
          label: 'Chính xác',
          color: '#10b981',
          underline: 'none',
        };
      case 'SEMANTICALLY_CORRECT':
        return {
          pill: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/25',
          dot: 'bg-cyan-400 animate-pulse',
          label: 'Tương đương',
          color: '#06b6d4',
          underline: 'underline decoration-cyan-400 decoration-dashed underline-offset-4',
        };
      case 'PARTIALLY_CORRECT':
        return {
          pill: 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20',
          dot: 'bg-amber-400',
          label: 'Gần đúng',
          color: '#f59e0b',
          underline: 'none',
        };
      case 'INCORRECT':
        return {
          pill: 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25',
          dot: 'bg-rose-400',
          label: 'Cần sửa',
          color: '#f43f5e',
          underline: 'line-through decoration-rose-500/70',
        };
      case 'MISSING':
        return {
          pill: 'bg-slate-800/80 border-dashed border-slate-600 text-slate-400 hover:border-cyan-500/60',
          dot: 'bg-slate-500',
          label: 'Thiếu từ',
          color: '#94a3b8',
          underline: 'none',
        };
    }
  };

  return (
    <div
      className="relative rounded-2xl p-5 mb-5 backdrop-blur-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(6,14,32,0.95) 0%, rgba(4,9,24,0.98) 100%)',
        border: '1px solid rgba(6,182,212,0.3)',
        boxShadow: '0 0 30px rgba(6,182,212,0.06)',
      }}
    >
      {/* ── TOP HEADER: SEMANTIC DIMENSIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-mono font-black tracking-wider text-cyan-300 uppercase">
            SEMANTIC TRANSLATION ANALYZER 2.0
          </span>
        </div>

        {/* 4 Multi-dimensional Scores */}
        {scores && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <span>Ý nghĩa:</span>
              <span className="font-bold">{scores.semanticMeaning}%</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              <span>Ngữ pháp:</span>
              <span className="font-bold">{scores.grammarAccuracy}%</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <span>Tự nhiên:</span>
              <span className="font-bold">{scores.naturalness}%</span>
            </div>
          </div>
        )}
      </div>

      {/* ── INTERACTIVE TOKEN DIFF ROW (4 STATUSES) ── */}
      <div className="mb-4">
        <div className="text-[11px] font-mono font-bold text-slate-400 mb-2 flex items-center justify-between">
          <span>PHÂN TÍCH TỪNG TỪ (BẤM VÀO TỪ ĐỂ XEM CHI TIẾT):</span>
          <div className="hidden sm:flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Đúng</span>
            <span className="flex items-center gap-1 text-cyan-400"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Tương đương (≈)</span>
            <span className="flex items-center gap-1 text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Gần đúng</span>
            <span className="flex items-center gap-1 text-rose-400"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Cần sửa</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tokenDiffs.map((diff, idx) => {
            const style = getStatusStyle(diff.status);
            const isSelected = selectedToken === diff;

            if (diff.status === 'MISSING') {
              return (
                <button
                  key={idx}
                  onClick={() => {
                    playSound('click');
                    setSelectedToken(isSelected ? null : diff);
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-mono border transition-all cursor-pointer ${style.pill} ${
                    isSelected ? 'ring-2 ring-cyan-400/50 scale-105' : ''
                  }`}
                  title={`Thiếu từ: "${diff.referenceToken}"`}
                >
                  <span className="text-[10px] text-slate-400 font-bold">[+] Thiếu:</span>
                  <span className="font-black text-cyan-300">"{diff.referenceToken}"</span>
                </button>
              );
            }

            return (
              <button
                key={idx}
                onClick={() => {
                  playSound('click');
                  setSelectedToken(isSelected ? null : diff);
                }}
                className={`group relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-mono font-bold border transition-all cursor-pointer ${style.pill} ${style.underline} ${
                  isSelected ? 'ring-2 ring-cyan-400/50 scale-105 shadow-[0_0_15px_rgba(6,182,212,0.25)]' : ''
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                <span>{diff.learnerToken}</span>

                {/* Subtext indicator for equivalent alternatives */}
                {diff.status === 'SEMANTICALLY_CORRECT' && (
                  <span className="text-[10px] text-cyan-400 font-sans font-black ml-0.5">
                    ≈
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── EXPANDABLE DETAIL POPOVER FOR CLICKED TOKEN ── */}
      <AnimatePresence>
        {selectedToken && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl p-3.5 mb-4 bg-slate-900/90 border border-cyan-500/30 text-xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-cyan-400" />
                <span className="font-mono font-black text-white">
                  TỪ: "{selectedToken.learnerToken || selectedToken.referenceToken}"
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                  style={{
                    color: getStatusStyle(selectedToken.status).color,
                    background: `${getStatusStyle(selectedToken.status).color}15`,
                  }}
                >
                  {getStatusStyle(selectedToken.status).label.toUpperCase()}
                </span>
              </div>

              {selectedToken.referenceToken && (
                <span className="text-[11px] font-mono text-slate-400">
                  Câu mẫu: <strong className="text-emerald-300">"{selectedToken.referenceToken}"</strong>
                </span>
              )}
            </div>

            <p className="text-slate-300 font-semibold leading-relaxed">
              {selectedToken.explanation ||
                (selectedToken.status === 'EXACT_CORRECT'
                  ? 'Từ này hoàn toàn khớp và chuẩn xác với câu mẫu.'
                  : selectedToken.status === 'SEMANTICALLY_CORRECT'
                  ? `Từ "${selectedToken.learnerToken}" là cách diễn đạt tương đương hoàn toàn hợp lệ.`
                  : 'Cần đối chiếu với câu mẫu để diễn đạt tự nhiên hơn.')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DEDICATED LANGUAGE NOTE / ALTERNATIVE CARD (called ≈ named) ── */}
      {alternatives.length > 0 && (
        <div
          className="rounded-2xl p-4 my-2"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(2,6,23,0.95) 100%)',
            border: '1px solid rgba(6,182,212,0.35)',
            boxShadow: '0 0 20px rgba(6,182,212,0.08)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-cyan-400 font-black">✦</span>
            <h4 className="text-xs font-mono font-black text-cyan-300 tracking-wider uppercase">
              LANGUAGE NOTE: {alternatives.map((a) => a.relationship).join(' · ')}
            </h4>
          </div>

          <div className="space-y-2 text-xs font-semibold text-slate-200 leading-relaxed">
            {alternatives.map((alt, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-emerald-300 font-bold">
                  ✓ Ý nghĩa hoàn toàn đúng · Diễn đạt tự nhiên.
                </p>
                <p className="text-slate-300">
                  {alt.noteVi}
                </p>
                {alt.contextDifference && (
                  <p className="text-[11px] text-slate-400 font-mono">
                    💡 Sắc thái: {alt.contextDifference}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
