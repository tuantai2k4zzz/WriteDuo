'use client';

import React from 'react';
import { useLearningStore } from '@/lib/store';

export default function UpgradeModal() {
  const {
    isUpgradeModalOpen,
    upgradeReason,
    closeUpgradeModal,
    openPricingModal,
  } = useLearningStore();

  if (!isUpgradeModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-500/20 text-white p-6 md:p-8 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={closeUpgradeModal}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon & Tag */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Đặc Quyền Hội Viên Pro
            </span>
            <h3 className="text-lg md:text-xl font-bold text-white">
              Mở Khóa Giới Hạn Học Tập
            </h3>
          </div>
        </div>

        {/* Contextual Reason Description */}
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 text-sm text-slate-200 mb-6 leading-relaxed">
          {upgradeReason}
        </div>

        {/* Value Proposition Highlights */}
        <div className="space-y-2.5 text-xs md:text-sm text-slate-300 mb-6">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span><strong>100 lượt Gia Sư AI</strong> chuyên sâu mỗi ngày (thay vì 10 lượt cơ bản)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>Mở khóa toàn bộ bài học nâng cao <strong>B2, C1, IELTS &amp; TOEIC</strong></span>
          </div>
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>Chấm điểm toàn đoạn văn &amp; ôn tập lặp lại ngắt quãng thông minh</span>
          </div>
        </div>

        {/* Price & CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              closeUpgradeModal();
              openPricingModal();
            }}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all"
          >
            Nâng Cấp Pro (99k/tháng) 🚀
          </button>
          <button
            onClick={closeUpgradeModal}
            className="w-full sm:w-auto py-3 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Để Sau, Tiếp Tục Học
          </button>
        </div>
      </div>
    </div>
  );
}
