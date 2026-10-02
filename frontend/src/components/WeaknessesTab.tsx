'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { GrammarWeakness } from '../types';
import { Target, AlertCircle, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Điểm Yếu Cần Khắc Phục (Adaptive Learning)
            </h1>
          </div>
          <p className="text-sm font-semibold text-gray-500">
            Hệ thống tự động ghi nhớ các điểm ngữ pháp hoặc từ vựng bạn dịch chưa chính xác để đề xuất bài tập thích ứng.
          </p>
        </div>

        <button
          onClick={loadWeaknesses}
          className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 hover:bg-gray-50 shadow-sm"
          title="Làm mới"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 font-semibold">Đang tổng hợp điểm yếu...</div>
      ) : weaknesses.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center bg-gray-50/50">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-3" />
          <h3 className="text-base font-black text-gray-800">Chưa ghi nhận điểm yếu nào</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Bạn đang làm rất tốt! Khi bạn làm sai hoặc dịch thiếu ý trong các bài học, hệ thống sẽ tự động tổng hợp các chủ điểm ngữ pháp tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {weaknesses.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-purple-100 p-1.5 text-purple-700">
                    <AlertCircle className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-gray-900">{item.tag}</h3>
                    <span className="text-xs font-semibold text-gray-400 uppercase">
                      Chủ đề: {item.category} · Số lần sai: {item.errorCount}
                    </span>
                  </div>
                </div>

                {/* Mastery Bar */}
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all"
                      style={{ width: `${item.masteryScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-purple-700">{item.masteryScore}%</span>
                </div>
              </div>

              {/* Sample Mistakes */}
              {item.sampleMistakes && item.sampleMistakes.length > 0 && (
                <div className="mt-3 rounded-xl bg-gray-50 p-3 border border-gray-100 space-y-2">
                  <span className="text-[11px] font-black uppercase text-gray-400 block">
                    Ví dụ câu bạn từng làm chưa đúng:
                  </span>
                  {item.sampleMistakes.map((sm, i) => (
                    <div key={i} className="text-xs space-y-1">
                      <div className="text-rose-600 font-semibold">
                        ❌ Bạn dịch: "{sm.userAnswer}"
                      </div>
                      <div className="text-green-700 font-bold">
                        ✅ Đáp án đúng: "{sm.expectedAnswer}"
                      </div>
                      {sm.explanation && (
                        <div className="text-gray-500 italic">💡 Nhận xét: {sm.explanation}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
