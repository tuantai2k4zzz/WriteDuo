'use client';

import React, { useState, useEffect } from 'react';
import { useLearningStore } from '../lib/store';
import { speakEnglish, playSound } from '../lib/audio';
import { api } from '../lib/api';
import { Token } from '../types';
import { Volume2, Bookmark, Check, X, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const WordModal: React.FC = () => {
  const {
    activeToken,
    isWordModalOpen,
    closeWordModal,
    sentences,
    currentSentenceIndex,
    user,
    openAuthModal,
    refreshUserData,
  } = useLearningStore();

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resolvedToken, setResolvedToken] = useState<Token | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const currentSentence = sentences[currentSentenceIndex];

  useEffect(() => {
    if (!activeToken) {
      setResolvedToken(null);
      setIsSaved(false);
      return;
    }

    setResolvedToken(activeToken);
    // Note: Pronunciation is played on token click; modal provides on-demand speaker button.

    // Check if current user already saved this word
    if (user) {
      api.checkWordSaved(activeToken.text)
        .then((res) => setIsSaved(res.isSaved))
        .catch(() => {});
    }

    // If meaningVi is missing or default placeholder, call on-demand AI & dictionary lookup!
    if (!activeToken.meaningVi || activeToken.meaningVi.trim() === '' || activeToken.meaningVi.includes('Đang cập nhật')) {
      setIsLookingUp(true);
      api.lookupWord(activeToken.text, currentSentence?.textEn)
        .then((res) => {
          setResolvedToken({
            ...activeToken,
            meaningVi: res.meaningVi,
            ipa: res.ipa || activeToken.ipa,
            pos: res.pos || activeToken.pos,
            cefr: res.cefr || activeToken.cefr,
            exampleEn: res.exampleEn,
            exampleVi: res.exampleVi,
          });
        })
        .catch(() => {
          // Keep current fallback
        })
        .finally(() => {
          setIsLookingUp(false);
        });
    } else {
      setIsLookingUp(false);
    }
  }, [activeToken, currentSentence, user]);

  if (!isWordModalOpen || !activeToken) return null;

  const tokenToDisplay = resolvedToken || activeToken;
  const isSynthetic = tokenToDisplay.exampleEn?.includes('Example with');
  const exampleEn = (!isSynthetic && tokenToDisplay.exampleEn) || currentSentence?.textEn;
  const exampleVi = (!isSynthetic && tokenToDisplay.exampleVi) || currentSentence?.primaryTranslationVi;

  const handleSave = async () => {
    if (!user) {
      playSound('click');
      openAuthModal('login');
      return;
    }

    try {
      setIsSaving(true);
      if (isSaved) {
        await api.deleteWord(tokenToDisplay.text);
        setIsSaved(false);
        playSound('click');
      } else {
        await api.saveVocabulary({
          word: tokenToDisplay.text,
          meaningVi: tokenToDisplay.meaningVi,
          pos: tokenToDisplay.pos,
          ipa: tokenToDisplay.ipa,
          cefr: tokenToDisplay.cefr,
          exampleEn: tokenToDisplay.exampleEn || currentSentence?.textEn,
        });
        setIsSaved(true);
        playSound('click');
      }
      refreshUserData();
    } catch (err) {
      console.error('Failed to save/unsave word:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs"
        onClick={closeWordModal}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4"
        >
          {/* Top Bar */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {tokenToDisplay.text}
                </h3>
                <button
                  type="button"
                  onClick={() => speakEnglish(tokenToDisplay.text)}
                  className="p-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 transition-all active:scale-95 cursor-pointer"
                  title="Nghe phát âm từ này"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
                {tokenToDisplay.cefr && (
                  <span className="rounded-md bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[11px] font-black text-emerald-700 dark:text-emerald-300">
                    {tokenToDisplay.cefr}
                  </span>
                )}
                {tokenToDisplay.pos && (
                  <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    {tokenToDisplay.pos}
                  </span>
                )}
              </div>
              {tokenToDisplay.ipa && (
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                  {tokenToDisplay.ipa}
                </p>
              )}
            </div>

            <button
              onClick={closeWordModal}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Meaning Card */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200/70 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Ý nghĩa tiếng Việt (theo ngữ cảnh)
              </span>
              {isLookingUp && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  <span>AI tra từ...</span>
                </span>
              )}
            </div>

            {isLookingUp ? (
              <div className="flex items-center gap-2 py-1 text-slate-500 dark:text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span className="italic text-xs">Đang nhận diện nghĩa từ vựng...</span>
              </div>
            ) : (
              <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                {tokenToDisplay.meaningVi || 'Đang cập nhật nghĩa...'}
              </p>
            )}

            {exampleEn && (
              <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                  Ví dụ trong câu:
                </span>
                <p className="text-slate-600 dark:text-slate-300 italic">"{exampleEn}"</p>
                {exampleVi && (
                  <p className="text-slate-500 text-[11px] mt-0.5">→ {exampleVi}</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => speakEnglish(tokenToDisplay.text)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 py-3 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Volume2 className="h-4 w-4 text-emerald-600" />
              <span>Phát Âm</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || !tokenToDisplay.meaningVi}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold transition-all shadow-sm cursor-pointer ${
                isSaved
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
              title={isSaved ? 'Bấm để huỷ lưu từ này' : 'Lưu từ vào sổ tay cá nhân'}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : isSaved ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Đã Lưu (Bỏ lưu)</span>
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" />
                  <span>Lưu Sổ Tay</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
