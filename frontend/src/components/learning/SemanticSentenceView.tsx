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

  // If semanticData is not yet populated (fallback mode), compare against reference tokens intelligently
  const tokenDiffs: SemanticTokenDiff[] = React.useMemo(() => {
    if (semanticData?.tokenDiffs && semanticData.tokenDiffs.length > 0) {
      return semanticData.tokenDiffs;
    }
    const cleanWord = (w: string) => w.toLowerCase().replace(/[.,!?;:()"'`]/g, '').trim();
    const refWords = referenceAnswer.trim().split(/\s+/).filter(Boolean).map(cleanWord);
    const equivMap: Record<string, string> = { called: 'named', named: 'called', own: 'have', have: 'own' };

    return userAnswer
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => {
        const clean = cleanWord(t);
        if (refWords.includes(clean)) {
          return {
            learnerToken: t,
            referenceToken: t,
            status: 'EXACT_CORRECT' as SemanticTokenStatus,
            explanation: 'Khớp từ trong câu mẫu',
          };
        }
        if (equivMap[clean] && refWords.includes(equivMap[clean])) {
          return {
            learnerToken: t,
            referenceToken: equivMap[clean],
            status: 'SEMANTICALLY_CORRECT' as SemanticTokenStatus,
            explanation: `"${t}" là cách diễn đạt tương đương hoàn toàn tự nhiên.`,
            relation: `${t} ≈ ${equivMap[clean]}`,
          };
        }
        return {
          learnerToken: t,
          status: 'INCORRECT' as SemanticTokenStatus,
          explanation: `Từ "${t}" chưa khớp với câu mẫu hoặc sai cấu trúc.`,
        };
      });
  }, [semanticData, userAnswer, referenceAnswer]);

  const alternatives: SemanticAlternative[] = semanticData?.alternatives || [];
  const scores = semanticData?.scores;

  const getStatusStyle = (status: SemanticTokenStatus) => {
    switch (status) {
      case 'EXACT_CORRECT':
        return {
          pill: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20',
          dot: 'bg-emerald-500 dark:bg-emerald-400',
          label: 'Chính xác',
          color: '#10b981',
          underline: 'none',
        };
      case 'SEMANTICALLY_CORRECT':
        return {
          pill: 'bg-cyan-50 dark:bg-cyan-500/15 border-cyan-300 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-200 hover:bg-cyan-100 dark:hover:bg-cyan-500/25',
          dot: 'bg-cyan-500 dark:bg-cyan-400 animate-pulse',
          label: 'Tương đương',
          color: '#06b6d4',
          underline: 'underline decoration-cyan-500 dark:decoration-cyan-400 decoration-dashed underline-offset-4',
        };
      case 'PARTIALLY_CORRECT':
        return {
          pill: 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20',
          dot: 'bg-amber-500 dark:bg-amber-400',
          label: 'Gần đúng',
          color: '#f59e0b',
          underline: 'none',
        };
      case 'INCORRECT':
        return {
          pill: 'bg-rose-50 dark:bg-rose-500/15 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/25',
          dot: 'bg-rose-500 dark:bg-rose-400',
          label: 'Cần sửa',
          color: '#f43f5e',
          underline: 'line-through decoration-rose-500/70',
        };
      case 'MISSING':
        return {
          pill: 'bg-slate-100 dark:bg-slate-800/80 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-cyan-500/60',
          dot: 'bg-slate-400 dark:bg-slate-500',
          label: 'Thiếu từ',
          color: '#94a3b8',
          underline: 'none',
        };
    }
  };

  return (
    <div
      className="relative rounded-2xl p-5 mb-5 backdrop-blur-xl bg-slate-50/90 dark:bg-[#060e20]/95 border border-slate-200 dark:border-cyan-500/30 shadow-sm dark:shadow-[0_0_30px_rgba(6,182,212,0.06)]"
    >
      {/* ── TOP HEADER: SEMANTIC DIMENSIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <span className="text-xs font-mono font-black tracking-wider text-cyan-700 dark:text-cyan-300 uppercase">
            SEMANTIC TRANSLATION ANALYZER 2.0
          </span>
        </div>

        {/* 4 Multi-dimensional Scores */}
        {scores && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
              <span>Ý nghĩa:</span>
              <span className="font-bold">{scores.semanticMeaning}%</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-300">
              <span>Ngữ pháp:</span>
              <span className="font-bold">{scores.grammarAccuracy}%</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300">
              <span>Tự nhiên:</span>
              <span className="font-bold">{scores.naturalness}%</span>
            </div>
          </div>
        )}
      </div>

      {/* ── INTERACTIVE TOKEN DIFF ROW (4 STATUSES) ── */}
      <div className="mb-4">
        <div className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
          <span>PHÂN TÍCH TỪNG TỪ (BẤM VÀO TỪ ĐỂ XEM CHI TIẾT):</span>
          <div className="hidden sm:flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" /> Đúng</span>
            <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400" /> Tương đương (≈)</span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" /> Gần đúng</span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" /> Cần sửa</span>
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
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">[+] Thiếu:</span>
                  <span className="font-black text-cyan-700 dark:text-cyan-300">"{diff.referenceToken}"</span>
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
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-sans font-black ml-0.5">
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
            className="overflow-hidden rounded-xl p-3.5 mb-4 bg-white/95 dark:bg-slate-900/90 border border-cyan-200 dark:border-cyan-500/30 text-xs shadow-xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span className="font-mono font-black text-slate-900 dark:text-white">
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
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Câu mẫu: <strong className="text-emerald-700 dark:text-emerald-300">"{selectedToken.referenceToken}"</strong>
                </span>
              )}
            </div>

            <p className="text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
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
          className="rounded-2xl p-4 my-2.5 bg-cyan-50/90 dark:bg-[#031329] border border-cyan-300 dark:border-cyan-500/40 shadow-xs dark:shadow-[0_0_25px_rgba(6,182,212,0.12)]"
        >
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-cyan-600 dark:text-cyan-400 font-black text-sm">✦</span>
            <h4 className="text-xs font-mono font-black text-cyan-800 dark:text-cyan-300 tracking-wider uppercase">
              LANGUAGE NOTE: {alternatives.map((a) => a.relationship).join(' · ')}
            </h4>
          </div>

          <div className="space-y-2.5">
            {alternatives.map((alt, idx) => (
              <div key={idx} className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                  <span>✓</span>
                  <span>Ý nghĩa hoàn toàn đúng · Diễn đạt tự nhiên.</span>
                </div>

                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-relaxed pl-0.5">
                  {alt.noteVi}
                </p>

                {alt.contextDifference && (
                  <div className="rounded-xl p-2.5 bg-white/90 dark:bg-[#020b17] border border-cyan-200 dark:border-cyan-500/25 flex items-start gap-2 text-xs font-mono">
                    <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0">💡 Sắc thái:</span>
                    <span className="text-slate-700 dark:text-cyan-100/90 font-medium leading-relaxed">
                      {alt.contextDifference}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
