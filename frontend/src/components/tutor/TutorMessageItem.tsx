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
  Target,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TutorMessageItemProps {
  message: TutorMessage;
}

// Render inline markdown tokens: `code`, **bold**, *italic*, formulas
function renderInlineContent(text: string): React.ReactNode {
  // Tokenize `code`, **bold**, *italic*
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Inline code: `word`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const code = part.slice(1, -1);
      return (
        <code
          key={idx}
          className="mx-0.5 px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/90 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 font-mono text-xs sm:text-[13px] font-bold shadow-2xs inline-block align-baseline"
        >
          {code}
        </code>
      );
    }

    // Bold focus term: **word**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const boldText = part.slice(2, -2);
      return (
        <strong
          key={idx}
          className="font-bold text-slate-950 dark:text-white bg-indigo-50/90 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-md text-indigo-950 dark:text-indigo-200 border border-indigo-200/70 dark:border-indigo-900/50 inline-block align-baseline"
        >
          {boldText}
        </strong>
      );
    }

    // Italic / Formula: *word*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const italicText = part.slice(1, -1);
      if (italicText.includes('+') || italicText.includes('➔') || italicText.includes('->')) {
        return (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mx-0.5 my-0.5 rounded-lg bg-indigo-100/90 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-semibold font-mono text-xs sm:text-[13px] align-baseline"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>{italicText}</span>
          </span>
        );
      }
      return (
        <em key={idx} className="italic text-slate-800 dark:text-slate-200 font-medium">
          {italicText}
        </em>
      );
    }

    return <span key={idx}>{part}</span>;
  });
}

// Render structured blocks (lists, formulas, paragraphs) inside each section
function renderSectionBlock(blockText: string, blockKey: number | string) {
  const lines = blockText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const elements: React.ReactNode[] = [];
  let currentListItems: string[] = [];

  const flushList = (listKey: string) => {
    if (currentListItems.length === 0) return;
    elements.push(
      <ul key={listKey} className="space-y-2.5 my-3 pl-0.5">
        {currentListItems.map((item, iIdx) => {
          let cleanItem = item.replace(/^[-*]\s+/, '');
          const isCheck = cleanItem.startsWith('✓') || cleanItem.startsWith('[x]');
          const isCross = cleanItem.startsWith('✗') || cleanItem.startsWith('[ ]');

          if (isCheck) cleanItem = cleanItem.replace(/^✓\s*/, '');
          if (isCross) cleanItem = cleanItem.replace(/^✗\s*/, '');

          let indicatorNode: React.ReactNode = (
            <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0 mt-2 shadow-2xs" />
          );

          if (isCheck) {
            indicatorNode = (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shrink-0 font-bold text-xs mt-0.5">
                ✓
              </span>
            );
          } else if (isCross) {
            indicatorNode = (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 shrink-0 font-bold text-xs mt-0.5">
                ✗
              </span>
            );
          }

          return (
            <li
              key={iIdx}
              className={`flex items-start gap-2.5 text-sm sm:text-[15px] leading-relaxed ${
                isCheck
                  ? 'p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-100'
                  : isCross
                  ? 'p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-rose-950 dark:text-rose-100'
                  : 'text-slate-800 dark:text-slate-100'
              }`}
            >
              {indicatorNode}
              <div className="flex-1 font-normal tracking-wide">
                {renderInlineContent(cleanItem)}
              </div>
            </li>
          );
        })}
      </ul>
    );
    currentListItems = [];
  };

  lines.forEach((line, lIdx) => {
    if (
      line.startsWith('- ') ||
      line.startsWith('* ') ||
      line.startsWith('✓ ') ||
      line.startsWith('✗ ')
    ) {
      currentListItems.push(line);
    } else {
      flushList(`list-${blockKey}-${lIdx}`);

      const isFullFormula =
        (line.startsWith('*') && line.endsWith('*') && line.includes('+')) ||
        (line.includes('➔') && line.includes('['));

      if (isFullFormula) {
        elements.push(
          <div
            key={`formula-${blockKey}-${lIdx}`}
            className="p-3 my-2.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50/60 dark:from-indigo-950/50 dark:to-purple-950/40 border border-indigo-200/90 dark:border-indigo-800/80 text-indigo-950 dark:text-indigo-200 font-medium text-sm sm:text-[15px] flex items-center gap-2.5 shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <div className="leading-relaxed">
              {renderInlineContent(line)}
            </div>
          </div>
        );
      } else {
        elements.push(
          <p
            key={`p-${blockKey}-${lIdx}`}
            className="text-sm sm:text-[15px] leading-relaxed text-slate-800 dark:text-slate-100 font-normal tracking-wide"
          >
            {renderInlineContent(line)}
          </p>
        );
      }
    }
  });

  flushList(`list-${blockKey}-end`);
  return <div key={blockKey} className="space-y-2">{elements}</div>;
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
        <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-indigo-600 text-white px-4 py-3 text-sm sm:text-[15px] font-medium shadow-xs leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  // Parse structured markdown sections inside answer
  const formatAnswerContent = (text: string) => {
    // Break by markdown headers: ### or ##
    const parts = text.split(/(?:^|\n)(#{2,3}\s+[^\n]+)/g);
    let currentHeader: string | null = null;
    const sections: { title: string | null; content: string }[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;

      if (part.startsWith('###') || part.startsWith('##')) {
        if (currentHeader) {
          sections.push({ title: currentHeader, content: '' });
        }
        currentHeader = part.replace(/^#{2,3}\s+/, '').trim();
      } else {
        sections.push({
          title: currentHeader,
          content: part,
        });
        currentHeader = null;
      }
    }

    if (currentHeader) {
      sections.push({ title: currentHeader, content: '' });
    }

    // Fallback if no parts matched
    if (sections.length === 0 && text.trim().length > 0) {
      sections.push({ title: null, content: text.trim() });
    }

    return sections.map((sec, sIdx) => {
      let headerIcon = <Sparkles className="w-4 h-4 text-indigo-500" />;
      let iconBadgeBg =
        'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200/70 dark:border-indigo-900/60';

      if (sec.title) {
        const t = sec.title.toLowerCase();
        if (t.includes('vì sao') || t.includes('tại sao') || t.includes('giải thích')) {
          headerIcon = <HelpCircle className="w-4 h-4 text-indigo-500" />;
          iconBadgeBg =
            'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200/70 dark:border-indigo-900/60';
        } else if (t.includes('trong câu này') || t.includes('phân tích')) {
          headerIcon = <Sparkles className="w-4 h-4 text-emerald-500" />;
          iconBadgeBg =
            'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-900/60';
        } else if (t.includes('gợi ý') || t.includes('tư duy') || t.includes('hint')) {
          headerIcon = <Lightbulb className="w-4 h-4 text-amber-500" />;
          iconBadgeBg =
            'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/70 dark:border-amber-900/60';
        } else if (t.includes('so sánh') || t.includes('đối chiếu') || t.includes('khác nhau')) {
          headerIcon = <BookOpen className="w-4 h-4 text-purple-500" />;
          iconBadgeBg =
            'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200/70 dark:border-purple-900/60';
        } else if (t.includes('mẹo nhớ') || t.includes('quy tắc') || t.includes('lưu ý')) {
          headerIcon = <Target className="w-4 h-4 text-amber-500" />;
          iconBadgeBg =
            'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/70 dark:border-amber-900/60';
        } else if (t.includes('ví dụ') || t.includes('minh họa')) {
          headerIcon = <BookOpen className="w-4 h-4 text-blue-500" />;
          iconBadgeBg =
            'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/70 dark:border-blue-900/60';
        }
      }

      return (
        <div
          key={sIdx}
          className="space-y-2 mt-4 pt-3.5 border-t border-slate-200/80 dark:border-slate-800/80 first:mt-0 first:pt-0 first:border-0"
        >
          {sec.title && (
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-2">
              <div
                className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 ${iconBadgeBg}`}
              >
                {headerIcon}
              </div>
              <span className="tracking-tight">{sec.title}</span>
            </div>
          )}
          {renderSectionBlock(sec.content, sIdx)}
        </div>
      );
    });
  };

  return (
    <div className="flex justify-start">
      <div className="max-w-[96%] w-full rounded-2xl rounded-tl-xs bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
        {/* 1. Key Takeaway Callout Card */}
        {structured?.keyPoint && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50/40 to-indigo-50/20 dark:from-indigo-950/60 dark:via-purple-950/30 dark:to-slate-900 border border-indigo-200/90 dark:border-indigo-800/80 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
              <span>Điểm Cốt Lõi Cần Nhớ</span>
            </div>
            <p className="text-sm sm:text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-relaxed pl-0.5">
              {structured.keyPoint}
            </p>
          </div>
        )}

        {/* 2. Formatted Markdown Sections with Clear Hierarchy */}
        <div className="space-y-2 text-slate-800 dark:text-slate-100">
          {formatAnswerContent(message.content)}
        </div>

        {/* 3. Comparison Card (if present) */}
        {structured?.comparison && (
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <span className="font-bold text-slate-800 dark:text-slate-100 block text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
              <span>⚖️ Đối chiếu hai cấu trúc:</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 shadow-2xs">
                <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 block text-sm sm:text-[15px]">
                  {structured.comparison.itemA}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 block text-sm sm:text-[15px]">
                  {structured.comparison.itemB}
                </span>
              </div>
            </div>
            <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-[15px] pt-1 leading-relaxed font-medium">
              👉 {structured.comparison.difference}
            </p>
          </div>
        )}

        {/* 4. Examples List */}
        {structured?.examples && structured.examples.length > 0 && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm uppercase tracking-wider block">
              📖 Ví dụ minh họa thực tế:
            </span>
            <div className="space-y-2.5">
              {structured.examples.map((ex, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80"
                >
                  <div className="space-y-1 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-[15px] leading-snug">
                      "{ex.en}"
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium">
                      → {ex.vi}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakEnglish(ex.en)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer"
                    title="Nghe câu ví dụ này"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Related Vocabulary chips */}
        {structured?.relatedVocabulary && structured.relatedVocabulary.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm uppercase tracking-wider block">
              🔤 Từ vựng liên quan:
            </span>
            <div className="flex flex-wrap gap-2">
              {structured.relatedVocabulary.map((vocab, vIdx) => (
                <div
                  key={vIdx}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-xs sm:text-sm"
                >
                  <span className="font-bold text-emerald-800 dark:text-emerald-200">
                    {vocab.word}
                  </span>
                  {vocab.pos && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold uppercase">
                      {vocab.pos}
                    </span>
                  )}
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    ({vocab.meaningInContext})
                  </span>
                  <button
                    type="button"
                    onClick={() => speakEnglish(vocab.word)}
                    className="p-1 text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-300 cursor-pointer"
                    title="Nghe từ"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSaveWord(
                        vocab.word,
                        vocab.meaningInContext,
                        vocab.pos,
                        vocab.ipa
                      )
                    }
                    className="p-1 text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-300 cursor-pointer"
                    title="Lưu vào sổ từ"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {savedWord && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block">
                ✓ Đã lưu từ "{savedWord}" vào sổ từ cá nhân!
              </span>
            )}
          </div>
        )}

        {/* 6. Interactive Mini Quiz Card */}
        {structured?.miniQuiz && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-purple-50/90 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Thử Thách Bài Tập Nhỏ</span>
              </span>
              {isQuizSubmitted && (
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedQuizOption?.trim().startsWith(structured.miniQuiz.correctOption)
                    ? '✓ Đúng rồi!'
                    : '✗ Hãy xem giải thích'}
                </span>
              )}
            </div>

            <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              {structured.miniQuiz.question}
            </p>

            <div className="space-y-2">
              {structured.miniQuiz.options.map((opt, oIdx) => {
                const isCorrect = opt.trim().startsWith(structured.miniQuiz!.correctOption);
                const isSelected = selectedQuizOption === opt;

                let optStyle =
                  'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-indigo-300';
                if (isQuizSubmitted) {
                  if (isCorrect) {
                    optStyle =
                      'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold';
                  } else if (isSelected) {
                    optStyle =
                      'border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 font-medium';
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
                    className={`w-full p-2.5 sm:p-3 rounded-xl text-left text-sm sm:text-[15px] border transition flex items-center justify-between cursor-pointer ${optStyle}`}
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
                className="pt-2.5 border-t border-indigo-100 dark:border-indigo-900/50 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed"
              >
                <strong className="text-indigo-700 dark:text-indigo-300 font-bold">
                  Giải thích:{' '}
                </strong>
                {structured.miniQuiz.explanation}
              </motion.div>
            )}
          </div>
        )}

        {/* 7. Action bar: Listen, Copy, Quiz */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer font-medium"
              title="Sao chép nội dung"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Đã chép' : 'Chép'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                askTutor('Cho tôi một bài tập nhỏ để kiểm tra kiến thức câu này')
              }
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition font-semibold cursor-pointer"
              title="Tạo bài tập thực hành"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tạo bài tập</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-mono font-medium">
            WriteDuo AI Tutor
          </span>
        </div>

        {/* 8. Follow-up chips */}
        {structured?.followUpSuggestions && structured.followUpSuggestions.length > 0 && (
          <div className="pt-2 space-y-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
              Gợi ý hỏi tiếp:
            </span>
            <div className="flex flex-wrap gap-2">
              {structured.followUpSuggestions.map((suggestion, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => askTutor(suggestion)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-xs sm:text-[13px] text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-300 transition text-left font-medium cursor-pointer"
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
