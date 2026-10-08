'use client';

import React, { useState } from 'react';
import { TutorMessage, TutorStructuredResponse } from '../../types';
import { speakEnglish, playSound } from '../../lib/audio';
import { api } from '../../lib/api';
import { useTutorStore } from '../../lib/tutorStore';
import {
  Volume2,
  Copy,
  Check,
  BookmarkPlus,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TutorMessageItemProps {
  message: TutorMessage;
}

export const TutorMessageItem: React.FC<TutorMessageItemProps> = ({ message }) => {
  const { askTutor } = useTutorStore();
  const [copied, setCopied] = useState(false);
  const [savedWord, setSavedWord] = useState<string | null>(null);

  // Interactive Mini Quiz selection state
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);

  const isUser = message.role === 'user';
  const structured = message.structured;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    playSound('click');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveWord = async (word: string, meaning: string, pos?: string, ipa?: string) => {
    try {
      await api.saveVocabulary({
        word,
        meaningVi: meaning,
        pos,
        ipa,
      });
      setSavedWord(word);
      playSound('correct');
      setTimeout(() => setSavedWord(null), 2500);
    } catch {
      // offline or network error
    }
  };

  const handleQuizAnswer = (option: string, correctOption: string) => {
    if (isQuizSubmitted) return;
    setSelectedQuizOption(option);
    setIsQuizSubmitted(true);
    if (option.trim().startsWith(correctOption) || option.includes(correctOption)) {
      playSound('correct');
    } else {
      playSound('almost');
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-indigo-600 text-white px-3.5 py-2.5 text-xs font-medium shadow-xs leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  // Parse structured markdown sections inside answer
  const formatAnswerContent = (text: string) => {
    // Break by headers
    const parts = text.split(/(###\s+[^\n]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('###')) {
        const headerTitle = part.replace(/^###\s+/, '').trim();
        let icon = <Lightbulb className="w-3.5 h-3.5 text-indigo-500" />;
        if (headerTitle.includes('Vì sao')) {
          icon = <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />;
        } else if (headerTitle.includes('Trong câu này')) {
          icon = <Sparkles className="w-3.5 h-3.5 text-emerald-500" />;
        } else if (headerTitle.includes('So sánh')) {
          icon = <BookOpen className="w-3.5 h-3.5 text-amber-500" />;
        } else if (headerTitle.includes('Mẹo nhớ')) {
          icon = <Lightbulb className="w-3.5 h-3.5 text-amber-500" />;
        }

        return (
          <div
            key={index}
            className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-100 mt-2.5 mb-1 pt-1 border-t border-slate-100 dark:border-slate-800 first:border-0 first:pt-0"
          >
            {icon}
            <span>{headerTitle}</span>
          </div>
        );
      }

      // Render paragraph text with code blocks and bold
      return (
        <div
          key={index}
          className="text-slate-700 dark:text-slate-200 text-xs leading-relaxed space-y-1.5"
        >
          {part
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map((line, lIdx) => {
              // Parse simple markdown tokens: `code` and **bold**
              const formattedLine = line.replace(
                /`([^`]+)`/g,
                '<code class="px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-bold">$1</code>'
              );

              return (
                <p
                  key={lIdx}
                  dangerouslySetInnerHTML={{ __html: formattedLine }}
                  className="leading-relaxed"
                />
              );
            })}
        </div>
      );
    });
  };

  return (
    <div className="flex justify-start">
      <div className="max-w-[95%] w-full rounded-2xl rounded-tl-xs bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-xs space-y-3">
        {/* Key Takeaway Pill */}
        {structured?.keyPoint && (
          <div className="px-2.5 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 text-[11px] font-semibold text-indigo-800 dark:text-indigo-300 flex items-start gap-1.5">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">💡 Cốt lõi:</span>
            <span>{structured.keyPoint}</span>
          </div>
        )}

        {/* Formatted Markdown Sections */}
        <div className="space-y-1 text-xs">
          {formatAnswerContent(message.content)}
        </div>

        {/* Comparison Card (if present) */}
        {structured?.comparison && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-200 block text-[11px]">
              ⚖️ Đối chiếu hai cấu trúc:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 block">
                  {structured.comparison.itemA}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-mono font-bold text-slate-600 dark:text-slate-400 block">
                  {structured.comparison.itemB}
                </span>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] pt-1 leading-relaxed">
              👉 {structured.comparison.difference}
            </p>
          </div>
        )}

        {/* Examples List */}
        {structured?.examples && structured.examples.length > 0 && (
          <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] block">
              📖 Ví dụ minh họa thực tế:
            </span>
            {structured.examples.map((ex, i) => (
              <div key={i} className="flex items-start justify-between gap-2 text-xs">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    "{ex.en}"
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    → {ex.vi}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => speakEnglish(ex.en)}
                  className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  title="Nghe câu ví dụ này"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Related Vocabulary chips */}
        {structured?.relatedVocabulary && structured.relatedVocabulary.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] block">
              🔤 Từ vựng liên quan:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {structured.relatedVocabulary.map((vocab, vIdx) => (
                <div
                  key={vIdx}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-[11px]"
                >
                  <span className="font-bold text-emerald-800 dark:text-emerald-200">
                    {vocab.word}
                  </span>
                  {vocab.pos && (
                    <span className="text-[9px] px-1 rounded-sm bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                      {vocab.pos}
                    </span>
                  )}
                  <span className="text-slate-500 dark:text-slate-400">
                    ({vocab.meaningInContext})
                  </span>
                  <button
                    type="button"
                    onClick={() => speakEnglish(vocab.word)}
                    className="p-0.5 text-emerald-600 hover:text-emerald-800"
                    title="Nghe từ"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveWord(vocab.word, vocab.meaningInContext, vocab.pos, vocab.ipa)}
                    className="p-0.5 text-emerald-600 hover:text-emerald-800"
                    title="Lưu vào sổ từ"
                  >
                    <BookmarkPlus className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            {savedWord && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                ✓ Đã lưu từ "{savedWord}" vào sổ từ cá nhân!
              </span>
            )}
          </div>
        )}

        {/* Interactive Mini Quiz Card */}
        {structured?.miniQuiz && (
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-purple-50/90 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Thử Thách Bài Tập Nhỏ</span>
              </span>
              {isQuizSubmitted && (
                <span className="text-[10px] font-bold text-indigo-600">
                  {selectedQuizOption?.trim().startsWith(structured.miniQuiz.correctOption)
                    ? '✓ Đúng rồi!'
                    : '✗ Hãy xem giải thích'}
                </span>
              )}
            </div>

            <p className="font-bold text-xs text-slate-800 dark:text-slate-100">
              {structured.miniQuiz.question}
            </p>

            <div className="space-y-1.5">
              {structured.miniQuiz.options.map((opt, oIdx) => {
                const isCorrect = opt.trim().startsWith(structured.miniQuiz!.correctOption);
                const isSelected = selectedQuizOption === opt;

                let optStyle =
                  'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-300';
                if (isQuizSubmitted) {
                  if (isCorrect) {
                    optStyle = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold';
                  } else if (isSelected) {
                    optStyle = 'border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200';
                  } else {
                    optStyle = 'opacity-60 border-slate-200 dark:border-slate-800';
                  }
                }

                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleQuizAnswer(opt, structured.miniQuiz!.correctOption)}
                    disabled={isQuizSubmitted}
                    className={`w-full p-2 rounded-xl text-left text-xs border transition flex items-center justify-between ${optStyle}`}
                  >
                    <span>{opt}</span>
                    {isQuizSubmitted && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    {isQuizSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {isQuizSubmitted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-2 border-t border-indigo-100 dark:border-indigo-900/50 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed"
              >
                <strong className="text-indigo-700 dark:text-indigo-300">Giải thích: </strong>
                {structured.miniQuiz.explanation}
              </motion.div>
            )}
          </div>
        )}

        {/* Action bar: Listen, Copy, Quiz */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Sao chép nội dung"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã chép' : 'Chép'}</span>
            </button>

            <button
              type="button"
              onClick={() => askTutor('Cho tôi một bài tập nhỏ để kiểm tra kiến thức câu này')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition font-medium"
              title="Tạo bài tập thực hành"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tạo bài tập</span>
            </button>
          </div>

          <span className="text-[10px] text-slate-400 font-mono">
            WriteDuo AI Tutor
          </span>
        </div>

        {/* Follow-up chips */}
        {structured?.followUpSuggestions && structured.followUpSuggestions.length > 0 && (
          <div className="pt-1.5 space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">
              Gợi ý hỏi tiếp:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {structured.followUpSuggestions.map((suggestion, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => askTutor(suggestion)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-800 text-[11px] text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300 transition text-left"
                >
                  💬 {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
