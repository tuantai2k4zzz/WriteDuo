'use client';

import React from 'react';
import { useLearningStore } from '@/lib/store';
import { Trophy, Medal, Target, CheckCircle2, Award, Zap, Share2 } from 'lucide-react';

interface Props {
  onOpenShareCard?: () => void;
}

export default function TopLearnersLeaderboard({ onOpenShareCard }: Props) {
  const { user, userProgress } = useLearningStore();

  const userXp = user?.xp ?? userProgress?.xp ?? 0;
  const userStreak = user?.streak ?? userProgress?.streakCount ?? 1;

  // Real mock rankings with current user dynamically blended
  const sampleLearners = [
    {
      id: '1',
      name: 'Nguyễn Anh Tuấn (Tuantaidz)',
      xp: Math.max(1250, userXp + 450),
      wordsCount: 142,
      quizzes: 28,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Tuantaidz',
      rank: 1,
      badge: '👑 Master',
    },
    {
      id: '2',
      name: 'Lê Minh Hoàng',
      xp: Math.max(890, userXp + 120),
      wordsCount: 88,
      quizzes: 19,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=HoangLe',
      rank: 2,
      badge: '🔥 Pro',
    },
    {
      id: 'current-user',
      name: user?.name ? `${user.name} (Bạn)` : 'Bạn',
      xp: userXp,
      wordsCount: user?.savedWordsCount ?? 14,
      quizzes: user?.completedLessonsCount ?? 3,
      avatar: user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email || 'User'}`,
      rank: 3,
      isCurrentUser: true,
      badge: user?.role === 'premium' ? '👑 Pro VIP' : '⚡ Learner',
    },
    {
      id: '4',
      name: 'Trần Quỳnh Trang',
      xp: Math.max(320, Math.floor(userXp * 0.7)),
      wordsCount: 45,
      quizzes: 11,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=QuynhTrang',
      rank: 4,
      badge: 'B2 IELTS',
    },
    {
      id: '5',
      name: 'Phạm Quốc Bảo',
      xp: Math.max(180, Math.floor(userXp * 0.4)),
      wordsCount: 29,
      quizzes: 6,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=QuocBao',
      rank: 5,
      badge: 'A2 English',
    },
  ];

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-500">
            <Trophy className="w-5 h-5 fill-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Bảng Vinh Danh Top Học Viên Tuần
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cập nhật trực tiếp theo điểm kinh nghiệm (XP) và bài tập hoàn thành.
            </p>
          </div>
        </div>

        {onOpenShareCard && (
          <button
            onClick={onOpenShareCard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Tạo Thẻ Khoe Thứ Hạng</span>
          </button>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold font-mono">
            <tr>
              <th className="pb-3 text-center w-12">Hạng</th>
              <th className="pb-3">Học Viên</th>
              <th className="pb-3 text-right">Từ Đã Thuộc</th>
              <th className="pb-3 text-right">Bài Đã Học</th>
              <th className="pb-3 text-right">Tổng XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {sampleLearners.map((learner) => (
              <tr
                key={learner.id}
                className={`transition-colors ${
                  learner.isCurrentUser
                    ? 'bg-cyan-500/10 font-bold border-l-2 border-l-cyan-500'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <td className="py-3 text-center">
                  {learner.rank === 1 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black shadow-sm">
                      1
                    </span>
                  ) : learner.rank === 2 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-bold shadow-sm">
                      2
                    </span>
                  ) : learner.rank === 3 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/80 text-white font-bold shadow-sm">
                      3
                    </span>
                  ) : (
                    <span className="font-mono text-slate-400 font-bold">{learner.rank}</span>
                  )}
                </td>

                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={learner.avatar}
                      alt={learner.name}
                      className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{learner.name}</span>
                        {learner.isCurrentUser && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 text-[9px] font-black uppercase">
                            Bạn
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{learner.badge}</span>
                    </div>
                  </div>
                </td>

                <td className="py-3 text-right font-mono font-semibold">{learner.wordsCount} từ</td>
                <td className="py-3 text-right font-mono font-semibold">{learner.quizzes} bài</td>
                <td className="py-3 text-right">
                  <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                    {learner.xp} XP
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
