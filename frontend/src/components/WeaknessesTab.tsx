'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { GrammarWeakness } from '../types';
import { Target, AlertCircle, ArrowRight, CheckCircle2, RefreshCw, Dna, Zap, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { HolographicPanel, NeonBadge, EnergyBar } from './hud/HUDPrimitives';
import { playSound } from '../lib/audio';

export const WeaknessesTab: React.FC = () => {
  const [weaknesses, setWeaknesses] = useState<GrammarWeakness[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWeaknesses = async () => {
    try {
      setLoading(true);
      const data = await api.getGrammarWeaknesses();
      setWeaknesses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeaknesses();
  }, []);

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
                <h1 className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                  MISTAKE DNA — PHÂN TÍCH ĐIỂM YẾU
                </h1>
                <NeonBadge label="NEURAL REPAIR" color="rose" pulse />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-300 leading-relaxed max-w-2xl">
                Hệ thống ma trận giải phẫu các dị thường ngữ pháp & phản xạ dịch thuật của Tuấn Tài. Tự động lập lịch hồi tưởng nhằm triệt tiêu điểm yếu.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playSound('click');
              loadWeaknesses();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-mono font-bold text-rose-300 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer self-start sm:self-center"
            title="Làm mới ma trận lỗi"
          >
            <RefreshCw className="h-4 w-4" />
            <span>QUÉT LẠI</span>
          </button>
        </div>
      </HolographicPanel>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="text-center py-16 font-mono text-slate-400 animate-pulse">
          TUANTAIDZ AI ĐANG QUÉT DNA LỖI SAI...
        </div>
      ) : weaknesses.length === 0 ? (
        <HolographicPanel glowColor="emerald" className="p-12 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400 mb-4" />
          <h3 className="text-lg font-black font-mono text-white">CHƯA PHÁT HIỆN DỊ THƯỜNG</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Hệ thống chưa ghi nhận lỗ hổng ngữ pháp nghiêm trọng nào. Khi bạn gặp lỗi trong các bài đọc, AI sẽ lập tức mã hóa chuỗi DNA lỗi tại đây!
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${urgency === 'high' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black font-mono text-white">
                            {item.tag}
                          </h3>
                          <NeonBadge
                            label={urgency === 'high' ? 'CẦN ÔN GẤP' : 'THEO DÕI'}
                            color={urgency === 'high' ? 'rose' : 'amber'}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 uppercase">
                          CHỦ ĐỀ: {item.category} · TẦN SUẤT SAI: {item.errorCount} LẦN
                        </span>
                      </div>
                    </div>

                    {/* Mastery Level Bar */}
                    <div className="flex items-center gap-3 sm:w-48">
                      <div className="w-full">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                          <span>ĐỘ THÀNH THẠO</span>
                          <span className="text-white font-bold">{item.masteryScore}%</span>
                        </div>
                        <EnergyBar
                          value={item.masteryScore}
                          color={item.masteryScore >= 70 ? 'emerald' : item.masteryScore >= 40 ? 'amber' : 'violet'}
                          height="h-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sample Mistakes DNA */}
                  {item.sampleMistakes && item.sampleMistakes.length > 0 && (
                    <div className="rounded-xl p-3 bg-black/40 border border-white/5 space-y-2">
                      <span className="text-[10px] font-mono font-black uppercase text-slate-400 block tracking-wider">
                        TIÊU BẢN DỊ THƯỜNG GẦN ĐÂY:
                      </span>
                      {item.sampleMistakes.map((mistake, mIdx) => (
                        <div key={mIdx} className="text-xs space-y-1 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-rose-400 font-bold">Lỗi bạn viết:</span>
                            <span className="line-through text-slate-400">"{mistake.userAnswer}"</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">Chuẩn xác:</span>
                            <span className="text-emerald-300">"{mistake.expectedAnswer}"</span>
                          </div>
                          {mistake.explanation && (
                            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                              💡 {mistake.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </HolographicPanel>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
