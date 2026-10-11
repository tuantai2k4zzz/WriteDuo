'use client';

import React, { useState } from 'react';
import { useLearningStore } from '@/lib/store';
import { Flame, Zap, Award, Sparkles, Copy, Check, Share2, Crown } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareableAchievementCard({ isOpen, onClose }: Props) {
  const { user, userProgress, entitlements } = useLearningStore();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const xp = user?.xp ?? userProgress?.xp ?? 0;
  const streak = user?.streak ?? userProgress?.streakCount ?? 1;
  const level = user?.currentLevel ?? userProgress?.currentLevel ?? 'A2';
  const name = user?.name || 'Học Viên WriteDuo';
  const avatar = user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email || 'User'}`;
  const isPro = entitlements?.isPro;

  const shareText = `🔥 Tôi vừa đạt chuỗi streak ${streak} ngày và ${xp} XP trên WriteDuo — Nền tảng học tiếng Anh với Gia Sư AI số 1! Cùng vào luyện dịch phản xạ nhé: https://writeduo.com`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent('https://writeduo.com');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-500/20 text-white p-6 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-4">
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
            Thẻ Vinh Danh Học Viên 2026
          </span>
          <h3 className="text-lg font-bold text-white mt-1">Khoe Thành Tích Học Tập</h3>
        </div>

        {/* ── THE HOLOGRAM ACHIEVEMENT BADGE (Clean Cyberpunk HUD) ── */}
        <div className="relative rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 border-2 border-cyan-400/60 shadow-xl shadow-cyan-500/20 overflow-hidden mb-6">
          {/* Cyber Scanline Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

          {/* Top Row: Brand & Pro Badge */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-black text-xs text-white">
                W
              </div>
              <span className="font-mono font-black text-sm tracking-tight text-white">
                WriteDuo OS
              </span>
            </div>

            {isPro ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-bold uppercase">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>Pro Member</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold uppercase">
                {level} Level
              </span>
            )}
          </div>

          {/* User Profile Info */}
          <div className="flex items-center gap-3.5 mb-5 relative z-10">
            <img
              src={avatar}
              alt={name}
              className="w-14 h-14 rounded-2xl border-2 border-cyan-400/60 bg-slate-800 shadow-md"
            />
            <div>
              <h4 className="text-base font-black text-white">{name}</h4>
              <p className="text-xs text-cyan-300/80 font-mono">
                {isPro ? 'Hội Viên Pro VIP • Tinh Hoa Phản Xạ' : 'Học Viên Xuất Sắc • WriteDuo'}
              </p>
            </div>
          </div>

          {/* 3 Metric Pills */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 mb-4 relative z-10 font-mono">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-0.5">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span className="text-base font-black">{streak}</span>
              </div>
              <span className="text-[10px] text-slate-400">NGÀY STREAK</span>
            </div>

            <div className="text-center border-x border-slate-800">
              <div className="flex items-center justify-center gap-1 text-cyan-400 mb-0.5">
                <Zap className="w-3.5 h-3.5 fill-cyan-400" />
                <span className="text-base font-black">{xp}</span>
              </div>
              <span className="text-[10px] text-slate-400">TỔNG XP</span>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-400 mb-0.5">
                <Award className="w-3.5 h-3.5" />
                <span className="text-base font-black">{level}</span>
              </div>
              <span className="text-[10px] text-slate-400">TRÌNH ĐỘ</span>
            </div>
          </div>

          {/* Footer Motto */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 relative z-10 pt-1">
            <span>Rèn luyện phản xạ với AI mỗi ngày</span>
            <span className="font-mono text-cyan-400 font-bold">writeduo.com</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleCopyLink}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 transition-all active:scale-98 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>Đã Sao Chép Lời Mời!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-950" />
                <span>Sao Chép Nội Dung Khoe Bạn Bè</span>
              </>
            )}
          </button>

          <button
            onClick={handleShareFacebook}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Chia Sẻ Lên Facebook</span>
          </button>
        </div>
      </div>
    </div>
  );
}
