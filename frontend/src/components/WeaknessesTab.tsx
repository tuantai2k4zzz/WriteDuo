'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { GrammarWeakness, WeakVocabularyItem } from '../types';
import { useLearningStore } from '../lib/store';
import { Target, AlertCircle, ArrowRight, CheckCircle2, RefreshCw, Dna, Zap, ShieldAlert, LogIn, BookX, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { HolographicPanel, NeonBadge, EnergyBar } from './hud/HUDPrimitives';
import { playSound, speakEnglish } from '../lib/audio';

export const WeaknessesTab: React.FC = () => {
  const { user, openAuthModal } = useLearningStore();
  const [subTab, setSubTab] = useState<'words' | 'grammar'>('words');
  const [weaknesses, setWeaknesses] = useState<GrammarWeakness[]>([]);
  const [weakWords, setWeakWords] = useState<WeakVocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [grammarData, wordsData] = await Promise.all([
        api.getGrammarWeaknesses().catch(() => []),
        api.getWeakVocabulary().catch(() => []),
      ]);
      setWeaknesses(grammarData);
      setWeakWords(wordsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 text-center">
        <HolographicPanel glowColor="rose" className="p-10 max-w-lg mx-auto">
          <Dna className="h-14 w-14 text-rose-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            MA TRẬN ĐIỂM YẾU CÁ NHÂN
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
            Hệ thống AI tự động phát hiện và theo dõi các từ vựng bạn hay làm sai theo chu kỳ Spaced Repetition riêng biệt. Vui lòng đăng nhập để bắt đầu chẩn đoán.
          </p>
          <button
            onClick={() => {
              playSound('click');
              openAuthModal('login');
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-6 py-3 text-xs font-black text-white shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:from-rose-400 hover:to-red-500 active:scale-95 transition-all cursor-pointer"
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
      <HolographicPanel glowColor="rose" className="p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <Dna className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  MISTAKE DNA — PHÂN TÍCH ĐIỂM YẾU
                </h1>
                <NeonBadge label="NEURAL REPAIR" color="rose" pulse />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                Hệ thống tự động phát hiện các từ vựng và cấu trúc ngữ pháp bạn trả lời sai để lên lịch hồi tưởng ngắt quãng (SRS).
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playSound('click');
              loadData();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-rose-300 dark:border-rose-500/30 bg-rose-100/80 dark:bg-rose-500/10 px-4 py-2 text-xs font-mono font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer self-start sm:self-center"
            title="Làm mới ma trận lỗi"
          >
            <RefreshCw className="h-4 w-4" />
            <span>QUÉT LẠI</span>
          </button>
        </div>
      </HolographicPanel>

      {/* Sub-Tabs: Từ vựng yếu vs Ngữ pháp */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => {
            playSound('click');
            setSubTab('words');
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all cursor-pointer ${
            subTab === 'words'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookX className="h-4 w-4" />
          <span>TỪ VỰNG YẾU ({weakWords.length})</span>
        </button>

        <button
          onClick={() => {
            playSound('click');
            setSubTab('grammar');
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all cursor-pointer ${
            subTab === 'grammar'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Target className="h-4 w-4" />
          <span>DỊ THƯỜNG NGỮ PHÁP ({weaknesses.length})</span>
        </button>
      </div>

      {/* ── CONTENT: WEAK VOCABULARY TAB ── */}
      {loading ? (
        <div className="text-center py-16 font-mono text-slate-500 dark:text-slate-400 animate-pulse">
          TUANTAIDZ AI ĐANG QUÉT DANH SÁCH LỖI SAI...
        </div>
      ) : subTab === 'words' ? (
        weakWords.length === 0 ? (
          <HolographicPanel glowColor="emerald" className="p-12 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500 dark:text-emerald-400 mb-4" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">CHƯA CÓ TỪ VỰNG YẾU</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Bạn chưa có từ vựng nào bị sai nhiều lần. Khi luyện tập các bài học, mọi từ bạn dịch sai sẽ được AI tự động đưa vào đây để kèm cặp riêng!
            </p>
          </HolographicPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weakWords.map((item, idx) => {
              const accuracy = item.accuracy ?? 0;
              const isUrgent = accuracy < 50 || item.mistakeCount >= 3;

              return (
                <motion.div
                  key={item._id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <HolographicPanel
                    glowColor={isUrgent ? 'rose' : 'amber'}
                    className="p-5 h-full flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <h3
                            onClick={() => speakEnglish(item.word)}
                            className="text-lg font-black text-slate-900 dark:text-white hover:text-cyan-500 transition-colors cursor-pointer"
                            title="Bấm để nghe phát âm"
                          >
                            {item.word}
                          </h3>
                          {item.cefr && (
                            <span className="rounded-md bg-cyan-100 dark:bg-cyan-950 px-2 py-0.5 text-[10px] font-black text-cyan-700 dark:text-cyan-300">
                              {item.cefr}
                            </span>
                          )}
                          {item.pos && (
                            <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                              {item.pos}
                            </span>
                          )}
                        </div>

                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                          isUrgent
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40'
                        }`}>
                          {item.mistakeCount} LỖI SAI
                        </span>
                      </div>

                      {item.meaningVi && (
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                          {item.meaningVi}
                        </p>
                      )}

                      {/* Accuracy Meter */}
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center justify-between text-[11px] font-mono font-semibold">
                          <span className="text-slate-500">ĐỘ CHÍNH XÁC:</span>
                          <span className={`font-black ${isUrgent ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {accuracy}% ({item.correctCount} đúng / {item.wrongCount} sai)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isUrgent ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.max(5, accuracy)}%` }}
                          />
                        </div>
                      </div>

                      {item.sampleSentence && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 mb-2">
                          "{item.sampleSentence}"
                        </p>
                      )}
                    </div>

                    {item.nextReviewAt && (
                      <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                        <Calendar className="h-3 w-3 text-cyan-500" />
                        <span>Lịch ôn tiếp theo: {new Date(item.nextReviewAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    )}
                  </HolographicPanel>
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        /* ── CONTENT: GRAMMAR TAB ── */
        weaknesses.length === 0 ? (
          <HolographicPanel glowColor="emerald" className="p-12 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500 dark:text-emerald-400 mb-4" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">CHƯA PHÁT HIỆN DỊ THƯỜNG NGỮ PHÁP</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Hệ thống chưa ghi nhận lỗi ngữ pháp thường trực nào của bạn. Hãy tiếp tục luyện các bài dịch!
            </p>
          </HolographicPanel>
        ) : (
          <div className="space-y-4">
            {weaknesses.map((item, idx) => {
              const urgency = item.errorCount >= 3 ? 'high' : item.errorCount === 2 ? 'medium' : 'low';

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <HolographicPanel
                    glowColor={urgency === 'high' ? 'rose' : urgency === 'medium' ? 'amber' : 'violet'}
                    className="p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${urgency === 'high' ? 'bg-rose-100/80 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400' : 'bg-amber-100/80 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400'}`}>
                          <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                              {item.tag}
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {item.category.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Số lần gặp lỗi: <span className="font-bold text-rose-600 dark:text-rose-400">{item.errorCount} lần</span>
                          </p>
                        </div>
                      </div>

                      <div className="w-full sm:w-48">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1 text-slate-500">
                          <span>MỨC ĐỘ THÔNG THẠO</span>
                          <span>{item.masteryScore}%</span>
                        </div>
                        <EnergyBar
                          value={item.masteryScore}
                          color={item.masteryScore >= 80 ? 'cyan' : item.masteryScore >= 50 ? 'amber' : 'violet'}
                        />
                      </div>
                    </div>

                    {item.sampleMistakes && item.sampleMistakes.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                          MẪU LỖI ĐIỂN HÌNH ĐÃ GHI NHẬN:
                        </span>
                        {item.sampleMistakes.map((sm, sIdx) => (
                          <div
                            key={sIdx}
                            className="rounded-xl border border-slate-200/80 dark:border-white/5 bg-slate-50/80 dark:bg-[#070b16]/70 p-3 text-xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] mb-1 font-mono">
                              <span className="text-rose-600 dark:text-rose-400 font-bold">
                                Câu dịch của bạn: "{sm.userAnswer}"
                              </span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                Chuẩn xác: "{sm.expectedAnswer}"
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 font-medium mt-1">
                              💡 {sm.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </HolographicPanel>
                </motion.div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
