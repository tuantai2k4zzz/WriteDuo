'use client';

import React from 'react';
import { useTutorStore, DepthMode, TutorStatus } from '../../lib/tutorStore';
import { Sparkles, RotateCcw, Zap } from 'lucide-react';

export const TutorHeader: React.FC = () => {
  const { status, depthMode, setDepthMode, resetConversation, messages, quota } = useTutorStore();

  const getStatusBadge = (s: TutorStatus) => {
    switch (s) {
      case 'thinking':
        return {
          dot: 'bg-amber-400 animate-ping',
          text: 'AI Đang suy nghĩ...',
          textColor: 'text-amber-600 dark:text-amber-400',
        };
      case 'answering':
        return {
          dot: 'bg-cyan-400 animate-pulse',
          text: 'AI Đang giải thích...',
          textColor: 'text-cyan-600 dark:text-cyan-400',
        };
      case 'error':
        return {
          dot: 'bg-rose-500',
          text: 'Lỗi phản hồi',
          textColor: 'text-rose-600 dark:text-rose-400',
        };
      default:
        return {
          dot: 'bg-emerald-500 animate-pulse',
          text: 'Sẵn sàng trợ giúp',
          textColor: 'text-emerald-600 dark:text-emerald-400',
        };
    }
  };

  const statusInfo = getStatusBadge(status);

  return (
    <div className="pb-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
      {/* Top row: Title + Status + Reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.dot}`} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <span>Gia Sư Đồng Hành</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                AI TUTOR
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={resetConversation}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Xóa cuộc trò chuyện câu này"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <span className={`text-[11px] font-medium ${statusInfo.textColor}`}>
            {statusInfo.text}
          </span>
        </div>
      </div>

      {/* Subtitle & Depth toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
          AI hiểu bài học & câu bạn đang nhìn vào.
        </p>

        {/* Depth Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg text-[10px] font-semibold">
          <button
            type="button"
            onClick={() => setDepthMode('quick')}
            className={`px-2 py-0.5 rounded-md transition ${
              depthMode === 'quick'
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="Giải thích siêu nhanh (1-2 câu)"
          >
            Nhanh
          </button>
          <button
            type="button"
            onClick={() => setDepthMode('normal')}
            className={`px-2 py-0.5 rounded-md transition ${
              depthMode === 'normal'
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="Chuẩn sư phạm (có ví dụ)"
          >
            Chuẩn
          </button>
          <button
            type="button"
            onClick={() => setDepthMode('deep')}
            className={`px-2 py-0.5 rounded-md transition ${
              depthMode === 'deep'
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="Chuyên sâu (cấu trúc + ngoại lệ + mẹo)"
          >
            Sâu
          </button>
        </div>
      </div>

      {quota && (
        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-0.5 font-mono">
          <span>Hạn mức hôm nay:</span>
          <span>
            {quota.usedToday}/{quota.limitToday} câu ({quota.remaining} còn lại)
          </span>
        </div>
      )}
    </div>
  );
};
