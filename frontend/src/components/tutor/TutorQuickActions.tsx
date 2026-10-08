'use client';

import React from 'react';
import { Sentence } from '../../types';
import { useTutorStore } from '../../lib/tutorStore';
import { useLearningStore } from '../../lib/store';
import { Sparkles, HelpCircle, BookOpen, Lightbulb } from 'lucide-react';

interface TutorQuickActionsProps {
  sentence: Sentence;
}

export const TutorQuickActions: React.FC<TutorQuickActionsProps> = ({ sentence }) => {
  const { askTutor, status } = useTutorStore();
  const { evaluationResponse, userAnswerInput } = useLearningStore();

  const isAnswering = status === 'thinking' || status === 'answering';
  const grammarTense = sentence.grammarAnalysis?.tense || '';
  const tokens = sentence.tokens || [];
  const hasUserAnswer = userAnswerInput.trim().length > 0;
  const isEvaluated = !!evaluationResponse;
  const isCorrect = evaluationResponse?.evaluation.status === 'correct';

  // Compute dynamic smart suggestion chips
  const chips: Array<{ label: string; query: string; icon?: string }> = [];

  // 1. If user answered and made a mistake
  if (isEvaluated && !isCorrect) {
    chips.push({
      label: '✍️ Câu của tôi sai ở đâu?',
      query: 'Tại sao câu trả lời của tôi chưa đúng và làm sao để sửa lại cho chuẩn?',
    });
    chips.push({
      label: '⚖️ Vì sao phải sửa như vậy?',
      query: 'Giải thích vì sao cần sửa câu như vậy để diễn đạt tự nhiên hơn?',
    });
    chips.push({
      label: '💬 Có cách nói khác không?',
      query: 'Ngoài đáp án mẫu, còn cách diễn đạt tương đương nào khác không?',
    });
  } else if (isEvaluated && isCorrect) {
    chips.push({
      label: '🌟 Cách nói nâng cao hơn?',
      query: 'Có cách diễn đạt nâng cao hoặc tự nhiên hơn của người bản xứ cho câu này không?',
    });
    chips.push({
      label: '📝 Thử thách bài tập mới',
      query: 'Tạo cho tôi một bài tập trắc nghiệm nhỏ để luyện tập nâng cao nhé!',
    });
  } else {
    // Before submission / during exercise
    chips.push({
      label: '💡 Gợi ý cho tôi',
      query: 'Gợi ý cho tôi hướng suy nghĩ để viết câu này mà không lộ đáp án.',
    });

    if (grammarTense) {
      chips.push({
        label: `📖 Vì sao dùng ${grammarTense}?`,
        query: `Tại sao trong câu này lại sử dụng thì ${grammarTense}?`,
      });
    }

    // Specific word comparisons
    const textEnLower = sentence.textEn.toLowerCase();
    if (textEnLower.includes('take') && textEnLower.includes('walk')) {
      chips.push({
        label: '🤔 Vì sao dùng take mà không dùng go?',
        query: 'Tại sao câu này dùng take mà không dùng go?',
      });
    } else if (textEnLower.includes('for') && (textEnLower.includes('year') || textEnLower.includes('month') || textEnLower.includes('hour'))) {
      chips.push({
        label: '⚖️ Phân biệt for và since',
        query: 'Tại sao dùng for mà không dùng since trong câu này?',
      });
    } else if (tokens.length > 0) {
      const token = tokens[0];
      chips.push({
        label: `🔤 "${token.text}" nghĩa là gì ở đây?`,
        query: `Từ "${token.text}" có nghĩa là gì trong ngữ cảnh câu này?`,
      });
    }

    chips.push({
      label: '🎯 Cấu trúc câu là gì?',
      query: 'Giải thích trật tự cấu trúc các thành phần trong câu này.',
    });
  }

  return (
    <div className="space-y-1.5 pt-2">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        <Sparkles className="w-3 h-3 text-indigo-500" />
        <span>Gợi ý câu hỏi nhanh theo bài:</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {chips.slice(0, 4).map((chip, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isAnswering}
            onClick={() => askTutor(chip.query)}
            className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800/80 dark:hover:bg-indigo-950/50 border border-slate-200/90 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-800 text-[11px] font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-300 transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
};
