'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, Circle, Flame, Award, ArrowRight } from 'lucide-react';
import { HolographicPanel, NeonBadge, EnergyBar } from '../hud/HUDPrimitives';
import { playSound } from '../../lib/audio';

interface DailyMissionProps {
  todayXp: number;
  goalXp: number;
  weaknessCount: number;
  onNavigateTab: (tab: 'learn' | 'vocab' | 'weakness') => void;
}

export const DailyMission: React.FC<DailyMissionProps> = ({
  todayXp,
  goalXp = 50,
  weaknessCount,
  onNavigateTab,
}) => {
  const xpPercent = Math.min(100, Math.round((todayXp / goalXp) * 100));

  const missions = [
    {
      id: 'xp',
      title: `Thu thập ${goalXp} XP hôm nay`,
      progress: `${todayXp}/${goalXp} XP`,
      completed: todayXp >= goalXp,
      reward: '+30 XP',
      tab: 'learn' as const,
    },
    {
      id: 'weakness',
      title: 'Khắc phục 1 điểm yếu ngữ pháp',
      progress: weaknessCount > 0 ? `Còn ${weaknessCount} lỗi` : 'Đã sạch lỗi',
      completed: weaknessCount === 0 || todayXp > 30,
      reward: '+25 XP',
      tab: 'weakness' as const,
    },
    {
      id: 'vocab',
      title: 'Lưu hoặc ôn 5 từ vựng mới',
      progress: 'Đang hoạt động',
      completed: todayXp > 20,
      reward: '+20 XP',
      tab: 'vocab' as const,
    },
  ];

  return (
    <HolographicPanel glowColor="amber" className="p-6 mb-8">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black font-mono text-white tracking-tight flex items-center gap-2">
              NHIỆM VỤ HÔM NAY
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Tiến độ mục tiêu ngày của Tuấn Tài
            </p>
          </div>
        </div>

        <NeonBadge label={`${xpPercent}% HOÀN THÀNH`} color="amber" pulse />
      </div>

      {/* Main XP Progress Bar */}
      <div className="space-y-1.5 mb-5">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-slate-300 font-bold">Mục tiêu XP ngày</span>
          <span className="text-amber-400 font-black">{todayXp} / {goalXp} XP</span>
        </div>
        <EnergyBar value={xpPercent} color="amber" height="h-2.5" />
      </div>

      {/* Mission List */}
      <div className="space-y-2.5">
        {missions.map((m) => (
          <div
            key={m.id}
            onClick={() => {
              playSound('click');
              onNavigateTab(m.tab);
            }}
            className="group flex items-center justify-between gap-3 rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.01]"
            style={{
              background: m.completed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              border: m.completed ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div className="flex items-center gap-2.5">
              {m.completed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-slate-500 flex-shrink-0" />
              )}
              <div>
                <div className={`text-xs font-bold font-mono ${m.completed ? 'text-emerald-300 line-through opacity-80' : 'text-slate-200'}`}>
                  {m.title}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {m.progress}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                {m.reward}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </HolographicPanel>
  );
};
