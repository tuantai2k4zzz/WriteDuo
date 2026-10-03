'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkillVector } from '../../lib/adaptive';
import { Sparkles, Brain, Zap, Activity } from 'lucide-react';
import { HolographicPanel, NeonBadge } from '../hud/HUDPrimitives';

interface LearningGalaxyProps {
  skills: SkillVector;
}

export const LearningGalaxy: React.FC<LearningGalaxyProps> = ({ skills }) => {
  const [selectedSkill, setSelectedSkill] = useState<keyof SkillVector | null>('grammar');

  const skillMeta: Record<
    keyof SkillVector,
    { label: string; desc: string; color: string; icon: string }
  > = {
    grammar: {
      label: 'Ngữ Pháp',
      desc: 'Cấu trúc câu, các thì, liên từ & trật tự từ',
      color: '#06b6d4',
      icon: '⚙️',
    },
    vocabulary: {
      label: 'Từ Vựng',
      desc: 'Vốn từ CEFR, collocations & từ vựng ngữ cảnh',
      color: '#3b82f6',
      icon: '📚',
    },
    translation: {
      label: 'Phản Xạ Dịch',
      desc: 'Chuyển hóa ngữ nghĩa tự nhiên 2 chiều EN ↔ VI',
      color: '#8b5cf6',
      icon: '🔄',
    },
    pronunciation: {
      label: 'Phát Âm & IPA',
      desc: 'Trọng âm, nối âm & ngữ điệu câu',
      color: '#ec4899',
      icon: '🎙️',
    },
    listening: {
      label: 'Nghe Hiểu',
      desc: 'Bắt nhịp âm thanh bản xứ & từ khóa chính',
      color: '#14b8a6',
      icon: '🎧',
    },
    reading: {
      label: 'Đọc Hiểu',
      desc: 'Tốc độ quét thông tin & nắm ý đoạn văn',
      color: '#10b981',
      icon: '📖',
    },
    writing: {
      label: 'Viết Đoạn Văn',
      desc: 'Mạch lạc, liên kết câu & văn phong tự nhiên',
      color: '#f59e0b',
      icon: '✍️',
    },
    speaking: {
      label: 'Giao Tiếp',
      desc: 'Độ lưu loát & tự tin phản hồi tức thì',
      color: '#f43f5e',
      icon: '💬',
    },
  };

  const keys = Object.keys(skills) as (keyof SkillVector)[];
  const count = keys.length;
  const radius = 95;
  const center = 130;

  // Calculate radar polygon points
  const points = keys
    .map((k, i) => {
      const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
      const val = skills[k] / 100;
      const r = radius * val;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');

  const activeMeta = selectedSkill ? skillMeta[selectedSkill] : null;
  const activeScore = selectedSkill ? skills[selectedSkill] : null;

  return (
    <HolographicPanel glowColor="cyan" className="p-4 sm:p-6 mb-6 sm:mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              NEURAL GALAXY — MA TRẬN NĂNG LỰC
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Hệ thống 8 trục năng lực ngôn ngữ theo thời gian thực
          </p>
        </div>

        <NeonBadge label="QUANTUM ADAPTIVE v2.0" color="cyan" pulse />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Radar Graphic */}
        <div className="md:col-span-6 flex justify-center relative">
          {/* Subtle spinning galaxy background ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 m-auto h-56 w-56 rounded-full border border-dashed border-cyan-500/20 pointer-events-none"
          />

          <svg width={260} height={260} className="relative z-10 select-none">
            {/* Concentric grid circles */}
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <circle
                key={pct}
                cx={center}
                cy={center}
                r={radius * pct}
                fill="none"
                stroke="currentColor"
                className="text-slate-300 dark:text-white/10"
                strokeDasharray={pct === 1 ? '4 4' : 'none'}
              />
            ))}

            {/* Axis spokes */}
            {keys.map((k, i) => {
              const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
              const x2 = center + radius * Math.cos(angle);
              const y2 = center + radius * Math.sin(angle);
              return (
                <line
                  key={k}
                  x1={center}
                  y1={center}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(6, 182, 212, 0.25)"
                />
              );
            })}

            {/* Filled Skill Polygon */}
            <motion.polygon
              points={points}
              fill="rgba(6, 182, 212, 0.2)"
              stroke="#06b6d4"
              strokeWidth="2"
              filter="drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
            />

            {/* Interactive Nodes */}
            {keys.map((k, i) => {
              const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
              const val = skills[k] / 100;
              const r = radius * val;
              const x = center + r * Math.cos(angle);
              const y = center + r * Math.sin(angle);
              const isSelected = selectedSkill === k;

              return (
                <g key={k} className="cursor-pointer" onClick={() => setSelectedSkill(k)}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 6 : 4}
                    fill={isSelected ? '#38bdf8' : skillMeta[k].color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    style={{ filter: `drop-shadow(0 0 8px ${skillMeta[k].color})` }}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Skill Node Detail Panel */}
        <div className="md:col-span-6 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {activeMeta && activeScore !== null && (
              <motion.div
                key={selectedSkill}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-xl p-4 sm:p-5 bg-slate-50/90 dark:bg-white/[0.03] border border-cyan-200 dark:border-cyan-500/20 shadow-xs dark:shadow-none"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{activeMeta.icon}</span>
                    <h4 className="text-base font-black font-mono text-slate-900 dark:text-white">
                      {activeMeta.label}
                    </h4>
                  </div>
                  <span
                    className="text-lg font-black font-mono px-2.5 py-0.5 rounded-lg border"
                    style={{
                      color: activeMeta.color,
                      borderColor: `${activeMeta.color}60`,
                      background: `${activeMeta.color}15`,
                      boxShadow: `0 0 15px ${activeMeta.color}30`,
                    }}
                  >
                    {activeScore}%
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {activeMeta.desc}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span>ĐỘ THÀNH THẠO</span>
                    <span>{activeScore >= 80 ? 'XUẤT SẮC' : activeScore >= 60 ? 'TỐT' : 'CẦN CẢI THIỆN'}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${activeScore}%` }}
                      className="h-full rounded-full"
                      style={{ background: activeMeta.color }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span>💡 Chọn các node trên radar để xem chi tiết</span>
                  <span className="text-cyan-600 dark:text-cyan-400">8 Trục Năng Lực</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick select pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-3">
            {keys.map((k) => (
              <button
                key={k}
                onClick={() => setSelectedSkill(k)}
                className={`rounded-lg py-1.5 px-2 text-[10px] font-mono font-bold transition-all text-center truncate cursor-pointer border ${
                  selectedSkill === k
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300'
                    : 'bg-white/80 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                {skillMeta[k].label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </HolographicPanel>
  );
};
