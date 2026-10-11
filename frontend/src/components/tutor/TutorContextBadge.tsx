'use client';

import React from 'react';
import { Sentence } from '../../types';
import { Sparkles } from 'lucide-react';

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
  const sentenceSnippet = isViToEn ? sentence.primaryTranslationVi : sentence.textEn;

  return (
    <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/50 text-xs sm:text-[13px]">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
        <span className="font-bold text-indigo-950 dark:text-indigo-200 shrink-0">
          Câu {sentenceIndex + 1}/{totalSentences}:
        </span>
        <span
          className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[150px] sm:max-w-[220px]"
          title={sentenceSnippet}
        >
          "{sentenceSnippet}"
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {tense && (
          <span
            className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-100 dark:border-indigo-800/80 shadow-2xs truncate max-w-[140px]"
            title={tense}
          >
            {tense}
          </span>
        )}
        <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold text-xs border border-slate-200 dark:border-slate-700">
          {isViToEn ? 'VI➔EN' : 'EN➔VI'}
        </span>
      </div>
    </div>
  );
};
