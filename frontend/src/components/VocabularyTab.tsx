'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { SavedWord } from '../types';
import { speakEnglish, playSound } from '../lib/audio';
import { Search, Volume2, BookmarkCheck, Trash2, Heart, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export const VocabularyTab: React.FC = () => {
  const [words, setWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCefr, setSelectedCefr] = useState('ALL');

  const loadWords = async () => {
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
  }, [search, selectedCefr]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteWord(id);
      setWords(words.filter((w) => w._id !== id));
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BookmarkCheck className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Sổ Từ Vựng Cá Nhân</h1>
        </div>
        <p className="text-sm font-semibold text-gray-500">
          Các từ vựng bạn đã lưu trong quá trình làm bài Reading. Nhấp loa để nghe phát âm chuẩn.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm từ vựng hoặc nghĩa tiếng Việt..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 shadow-sm"
          />
        </div>

        {/* CEFR Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {cefrLevels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedCefr(lvl)}
              className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                selectedCefr === lvl
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Vocabulary List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 font-semibold">Đang tải sổ từ vựng...</div>
      ) : words.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center bg-gray-50/50">
          <Layers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-base font-black text-gray-700">Chưa có từ vựng nào</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Khi học bài Reading, nhấp vào bất kỳ từ tiếng Anh nào trong câu và chọn "Lưu Sổ Tay" để ôn tập tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {words.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-300 transition-all"
            >
              <div className="flex-1 pr-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-black text-gray-900">{item.word}</span>
                  {item.cefr && (
                    <span className="rounded-md bg-blue-100 px-1.5 py-0.2 text-[10px] font-black text-blue-700">
                      {item.cefr}
                    </span>
                  )}
                  {item.pos && (
                    <span className="text-xs font-bold text-gray-400">({item.pos})</span>
                  )}
                </div>

                {item.ipa && (
                  <p className="text-xs font-mono font-semibold text-emerald-600 mb-1">
                    {item.ipa}
                  </p>
                )}

                <p className="text-sm font-bold text-gray-700">{item.meaningVi}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => speakEnglish(item.word)}
                  className="rounded-xl p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  title="Nghe phát âm"
                >
                  <Volume2 className="h-5 w-5" />
                </button>

                <button
                  onClick={() => handleToggleFavorite(item._id)}
                  className="rounded-xl p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                  title="Yêu thích"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      item.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleDelete(item._id)}
                  className="rounded-xl p-2 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                  title="Xoá"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
