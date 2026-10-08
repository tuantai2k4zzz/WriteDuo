'use client';

import React from 'react';
import { Sentence } from '../../types';
import { Sparkles, Layers, ArrowRight } from 'lucide-react';

interface TutorContextBadgeProps {
  sentence: Sentence;
  exerciseMode: 'en_to_vi' | 'vi_to_en';
  sentenceIndex: number;
  totalSentences: number;
}

export const TutorContextBadge: React.FC<TutorContextBadgeProps> = ({
  sentence,
  exerciseMode,
  sentenceIndex,
  totalSentences,
}) => {
  const isViToEn = exerciseMode === 'vi_to_en';
  const tense = sentence.grammarAnalysis?.tense;

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-[11px]">
      <div className="flex items-center gap-1.5 min-w-0">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span className="font-semibold text-indigo-900 dark:text-indigo-200 truncate">
          Đang hiểu câu {sentenceIndex + 1}/{totalSentences}:
        </span>
        <span className="font-mono text-slate-500 dark:text-slate-400 truncate max-w-[120px] sm:max-w-[180px]">
          "{isViToEn ? sentence.primaryTranslationVi : sentence.textEn}"
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {tense && (
          <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 font-bold text-[10px] border border-indigo-100 dark:border-indigo-800/80">
            {tense}
          </span>
        )}
        <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
          {isViToEn ? 'VI➔EN' : 'EN➔VI'}
        </span>
      </div>
    </div>
  );
};
