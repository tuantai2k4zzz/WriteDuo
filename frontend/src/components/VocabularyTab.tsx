'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { SavedWord } from '../types';
import { speakEnglish, playSound } from '../lib/audio';
import { Search, Volume2, BookmarkCheck, Trash2, Heart, Layers, Sparkles, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HolographicPanel, NeonBadge } from './hud/HUDPrimitives';

import { useLearningStore } from '../lib/store';
import { LogIn } from 'lucide-react';

export const VocabularyTab: React.FC = () => {
  const { user, openAuthModal, refreshUserData } = useLearningStore();
  const [words, setWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCefr, setSelectedCefr] = useState('ALL');

  const loadWords = async () => {
    if (!user) {
      setWords([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.getVocabulary(search, selectedCefr);
      setWords(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWords();
  }, [search, selectedCefr, user]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteWord(id);
      setWords(words.filter((w) => w._id !== id));
      refreshUserData();
      playSound('click');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const updated = await api.toggleFavoriteWord(id);
      setWords(words.map((w) => (w._id === id ? updated : w)));
      playSound('click');
    } catch (err) {
      console.error(err);
    }
  };

  const cefrLevels = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1'];

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 text-center">
        <HolographicPanel glowColor="cyan" className="p-10 max-w-lg mx-auto">
          <BookmarkCheck className="h-14 w-14 text-cyan-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            CUNG ĐIỆN TỪ VỰNG CÁ NHÂN
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
            Mỗi tài khoản có một kho từ vựng riêng biệt được lưu trữ trên máy chủ đám mây. Vui lòng đăng nhập để xem và quản lý các từ của bạn.
          </p>
          <button
            onClick={() => {
              playSound('click');
              openAuthModal('login');
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-black text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:from-cyan-400 hover:to-blue-500 active:scale-95 transition-all cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            <span>ĐĂNG NHẬP NGAY</span>
          </button>
        </HolographicPanel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* ── HEADER BANNER ── */}
      <HolographicPanel glowColor="cyan" className="p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <BookOpen className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  MEMORY PALACE — CUNG ĐIỆN TỪ VỰNG
                </h1>
                <NeonBadge label="SEMANTIC MAPPING" color="cyan" pulse />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                Lưu trữ và kết nối các mắt xích từ vựng theo chuẩn CEFR quốc tế. Bấm vào biểu tượng loa để kích hoạt phát âm chuẩn bản xứ.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400 self-start sm:self-center">
            <span>TỔNG SỐ TỪ:</span>
            <span className="px-2 py-0.5 rounded-lg bg-cyan-100 dark:bg-cyan-500/15 border border-cyan-300 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-300 font-bold">
              {words.length}
            </span>
          </div>
        </div>
      </HolographicPanel>

      {/* ── SEARCH & CEFR FILTER HUD ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tra cứu từ vựng hoặc nghĩa tiếng Việt trong cung điện..."
            className="w-full rounded-2xl border border-cyan-200 dark:border-cyan-500/30 bg-white/90 dark:bg-slate-900/90 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 backdrop-blur-md shadow-xs dark:shadow-none"
          />
        </div>

        {/* CEFR Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {cefrLevels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                playSound('click');
                setSelectedCefr(lvl);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-mono font-bold transition-all cursor-pointer border ${
                selectedCefr === lvl
                  ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'bg-white/80 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* ── VOCABULARY GRID ── */}
      {loading ? (
        <div className="text-center py-16 font-mono text-slate-500 dark:text-slate-400 animate-pulse">
          TUANTAIDZ AI ĐANG TRÍCH XUẤT CUNG ĐIỆN TỪ VỰNG...
        </div>
      ) : words.length === 0 ? (
        <HolographicPanel glowColor="cyan" className="p-12 text-center">
          <BookmarkCheck className="mx-auto h-12 w-12 text-cyan-600 dark:text-cyan-500/60 mb-3" />
          <h3 className="text-base font-black text-slate-900 dark:text-white">CHƯA CÓ TỪ VỰNG NÀO</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Khi đọc bài học, bạn có thể nhấp vào bất kỳ từ tiếng Anh nào để tra nghĩa và bấm nút "Lưu Vào Sổ Từ" để thêm vào đây!
          </p>
        </HolographicPanel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {words.map((item) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className="group relative rounded-2xl p-4 sm:p-5 transition-all backdrop-blur-xl bg-white/95 dark:bg-gradient-to-br dark:from-[#061026]/90 dark:to-[#030816]/95 border border-cyan-200/90 dark:border-cyan-500/25 shadow-sm dark:shadow-[0_0_20px_rgba(6,182,212,0.05)]"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        {item.word}
                      </h3>
                      {item.pos && (
                        <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 italic">
                          ({item.pos})
                        </span>
                      )}
                      {item.cefr && (
                        <NeonBadge label={item.cefr} color="cyan" />
                      )}
                    </div>
                    {item.ipa && (
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {item.ipa}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => speakEnglish(item.word, 0.95)}
                      className="p-2 rounded-xl text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                      title="Phát âm"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(item._id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Yêu thích"
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          item.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm font-bold text-cyan-800 dark:text-cyan-200 mb-2">
                  {item.meaningVi}
                </p>

                {item.exampleEn && (
                  <div className="rounded-xl p-2.5 bg-slate-50/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/5 text-xs space-y-1">
                    <p className="text-slate-700 dark:text-slate-300 font-mono italic">
                      "{item.exampleEn}"
                    </p>
                    {item.exampleVi && (
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {item.exampleVi}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
