'use client';

import React, { useEffect, useRef } from 'react';
import { Sentence } from '../../types';
import { useTutorStore } from '../../lib/tutorStore';
import { useLearningStore } from '../../lib/store';
import { TutorHeader } from './TutorHeader';
import { TutorContextBadge } from './TutorContextBadge';
import { TutorMessageItem } from './TutorMessageItem';
import { TutorQuickActions } from './TutorQuickActions';
import { TutorInput } from './TutorInput';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface TutorPanelProps {
  sentence: Sentence;
}

export const TutorPanel: React.FC<TutorPanelProps> = ({ sentence }) => {
  const {
    messages,
    status,
    error,
    streamingChunk,
    isStreaming,
    syncSentenceContext,
    loadQuota,
    askTutor,
  } = useTutorStore();

  const { activeLesson, currentSentenceIndex, sentences, exerciseMode } = useLearningStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync sentence context when sentence changes
  useEffect(() => {
    syncSentenceContext(sentence, activeLesson, exerciseMode);
  }, [sentence._id, syncSentenceContext, activeLesson, exerciseMode]);

  // Load quota on mount
  useEffect(() => {
    loadQuota();
  }, [loadQuota]);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingChunk, status]);

  return (
    <div className="flex flex-col h-full space-y-3.5">
      {/* 1. Tutor Header */}
      <TutorHeader />

      {/* 2. Context Grounding Badge */}
      <TutorContextBadge
        sentence={sentence}
        exerciseMode={exerciseMode}
        sentenceIndex={currentSentenceIndex}
        totalSentences={sentences.length}
      />

      {/* 3. Conversation Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[500px] sm:max-h-[620px] min-h-[260px]">
        {/* Welcoming Message if conversation is empty */}
        {messages.length === 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-center space-y-3.5 my-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white mx-auto shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                Gia sư AI đã sẵn sàng hỗ trợ bạn
              </h4>
              <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                Hỏi mình bất kỳ điều gì về từ vựng, ngữ pháp, hoặc tại sao câu lại diễn đạt như vậy.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1 text-left">
              <button
                type="button"
                onClick={() =>
                  askTutor('Giải thích vì sao câu này lại dùng cấu trúc ngữ pháp như vậy?')
                }
                className="p-3 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                🤔 Vì sao câu dùng cấu trúc này?
              </button>
              <button
                type="button"
                onClick={() =>
                  askTutor('Gợi ý cho tôi hướng dịch câu này mà không lộ đáp án.')
                }
                className="p-3 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                💡 Cho tôi gợi ý để tự viết câu
              </button>
              <button
                type="button"
                onClick={() =>
                  askTutor('Tạo một bài tập nhỏ kiểm tra nhanh kiến thức câu này.')
                }
                className="p-3 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                📝 Cho tôi 1 bài tập luyện tập
              </button>
            </div>
          </div>
        )}

        {/* Existing Messages */}
        {messages.map((msg) => (
          <TutorMessageItem key={msg.id} message={msg} />
        ))}

        {/* Live Streaming Assistant Message */}
        {isStreaming && streamingChunk && (
          <div className="flex justify-start">
            <div className="max-w-[96%] w-full rounded-2xl rounded-tl-xs bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 p-4 sm:p-5 shadow-xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Gia Sư đang trả lời...</span>
              </div>
              <div className="text-sm sm:text-[15px] font-medium text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                {streamingChunk}
                <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse align-middle" />
              </div>
            </div>
          </div>
        )}

        {/* Thinking Indicator */}
        {status === 'thinking' && !streamingChunk && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-xs bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 px-4 py-3 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce" />
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce delay-100" />
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce delay-200" />
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 ml-1">
                AI Tutor đang phân tích ngữ cảnh...
              </span>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => askTutor('Giải thích lại câu này giúp tôi')}
                className="mt-1.5 text-xs font-bold underline flex items-center gap-1 hover:text-rose-900 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử lại câu hỏi</span>
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Quick Action Question Chips */}
      <TutorQuickActions sentence={sentence} />

      {/* 5. Tutor Input */}
      <TutorInput />
    </div>
  );
};
