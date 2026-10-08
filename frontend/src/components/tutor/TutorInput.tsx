'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTutorStore } from '../../lib/tutorStore';
import { useLearningStore } from '../../lib/store';
import { playSound } from '../../lib/audio';
import { Send, Sparkles, Loader2, Lock } from 'lucide-react';

export const TutorInput: React.FC = () => {
  const { askTutor, status } = useTutorStore();
  const { user, openAuthModal } = useLearningStore();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBusy = status === 'thinking' || status === 'answering';

  const handleSend = () => {
    if (!user) {
      playSound('incorrect');
      openAuthModal('login');
      return;
    }

    if (!text.trim() || isBusy) return;
    const query = text.trim();
    setText('');
    askTutor(query);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setText(e.target.value);
    // Auto grow textarea height up to 120px
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
      <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isBusy}
          placeholder="Hỏi tôi vì sao câu này dùng như vậy..."
          rows={1}
          className="w-full bg-transparent resize-none border-none outline-hidden text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 max-h-[120px] min-h-[36px] py-2 px-1 leading-relaxed"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || isBusy}
          className={`shrink-0 p-2.5 rounded-xl transition-all flex items-center justify-center ${
            text.trim() && !isBusy
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer active:scale-95'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
          title="Gửi câu hỏi cho Gia Sư"
        >
          {isBusy ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 px-1 pt-1.5 font-mono">
        <span>Enter: Gửi câu hỏi</span>
        <span>Shift + Enter: Xuống dòng</span>
      </div>
    </div>
  );
};
