'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { AdminStats, AdminUserItem } from '../../types';
import { playSound } from '../../lib/audio';
import {
  Shield,
  Users,
  Crown,
  Zap,
  Search,
  X,
  Sparkles,
  Check,
  Calendar,
  Clock,
  RefreshCw,
  Award,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'premium' | 'admin'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        api.adminGetStats().catch(() => null),
        api.adminGetUsers().catch(() => []),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateRole = async (userId: string, newRole: 'user' | 'premium' | 'admin') => {
    try {
      setUpdatingUserId(userId);
      playSound('click');
      await api.adminUpdateUserRole(userId, newRole);

      // Optimistic update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );

      // Re-fetch stats
      api.adminGetStats().then(setStats).catch(() => {});

      const roleLabels: Record<string, string> = {
        user: 'Thường (50 câu)',
        premium: 'Premium (Vô hạn)',
        admin: 'Quản trị viên (Admin)',
      };

      setSuccessToast(`Đã cập nhật quyền thành: ${roleLabels[newRole]}`);
      setTimeout(() => setSuccessToast(null), 3000);
      playSound('correct');
    } catch (err: any) {
      alert(`Lỗi khi cập nhật quyền: ${err.message}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Filter users based on search & role
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const formatDate = (isoString: string) => {
    if (!isoString) return 'Chưa rõ';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Chưa rõ';
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-5xl rounded-3xl bg-white dark:bg-[#070d1a] border border-cyan-500/30 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Bảng Quản Trị Hệ Thống (Admin Panel)
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/40 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] font-black uppercase">
                  WriteDuo OS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Quản lý người dùng, thời gian đăng ký và phân quyền AI Tutor (Thường: 50 câu/ngày | Premium: Vô hạn).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Toast */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{successToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Users */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono font-bold uppercase">Tổng Người Dùng</span>
                <Users className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {stats?.totalUsers ?? '...'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-semibold">Tài khoản đã tạo</div>
            </div>

            {/* Standard Users */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono font-bold uppercase">Role Thường</span>
                <Zap className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-700 dark:text-slate-300 font-mono">
                {stats?.standardUsers ?? '...'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-semibold">Giới hạn 50 câu/ngày</div>
            </div>

            {/* Premium Users */}
            <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900/50">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
                <span className="text-[11px] font-mono font-bold uppercase">Role Premium</span>
                <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {stats?.premiumUsers ?? '...'}
              </div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">Vô hạn câu hỏi AI</div>
            </div>

            {/* Total AI Queries */}
            <div className="p-4 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/20 border border-indigo-300 dark:border-indigo-900/50">
              <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
                <span className="text-[11px] font-mono font-bold uppercase">Tổng Lượt Hỏi AI</span>
                <Sparkles className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {stats?.totalAiQueries ?? '...'}
              </div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 font-semibold">Lượt tra cứu gia sư</div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm user theo email hoặc tên..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(
                [
                  { id: 'all', label: 'Tất cả' },
                  { id: 'user', label: 'Role Thường' },
                  { id: 'premium', label: '👑 Premium' },
                  { id: 'admin', label: '🛡️ Admin' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterRole(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    filterRole === tab.id
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Người dùng</th>
                    <th className="py-3 px-4">Thời gian đăng ký</th>
                    <th className="py-3 px-4">Tiến độ (XP)</th>
                    <th className="py-3 px-4">Lượt hỏi AI</th>
                    <th className="py-3 px-4">Role hiện tại</th>
                    <th className="py-3 px-4 text-right">Phân quyền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-500" />
                        <span>Đang tải danh sách người dùng...</span>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Không tìm thấy người dùng nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isUpdating = updatingUserId === u.id;
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                        >
                          {/* User info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white truncate">
                                  {u.name}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono truncate">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Registered timestamp */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{formatDate(u.createdAt)}</span>
                            </div>
                          </td>

                          {/* Learning Stats */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 font-mono">
                              <span className="font-bold text-amber-600 dark:text-amber-400">
                                {u.xp} XP
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({u.streak} ngày)
                              </span>
                            </div>
                          </td>

                          {/* AI Queries Count */}
                          <td className="py-3.5 px-4 font-mono">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-300 font-bold">
                              {u.aiQueriesCount} lượt
                            </span>
                          </td>

                          {/* Current Role Badge */}
                          <td className="py-3.5 px-4">
                            {u.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-[10px] font-mono">
                                <Shield className="w-3 h-3 text-purple-500" />
                                <span>ADMIN</span>
                              </span>
                            ) : u.role === 'premium' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold text-[10px] font-mono">
                                <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span>PREMIUM (VÔ HẠN)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[10px] font-mono">
                                <span>THƯỜNG (50 CÂU)</span>
                              </span>
                            )}
                          </td>

                          {/* Actions: Role Selector */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              {/* Option: Set Standard */}
                              {u.role !== 'user' && (
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateRole(u.id, 'user')}
                                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold transition disabled:opacity-50"
                                  title="Đặt về tài khoản thường (giới hạn 50 câu/ngày)"
                                >
                                  Về Thường
                                </button>
                              )}

                              {/* Option: Promote to Premium */}
                              {u.role !== 'premium' && (
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateRole(u.id, 'premium')}
                                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-[10px] font-black shadow-xs transition active:scale-95 disabled:opacity-50"
                                  title="Cấp quyền Premium: Sử dụng AI Tutor không giới hạn!"
                                >
                                  👑 Cấp Premium
                                </button>
                              )}

                              {/* Option: Promote to Admin */}
                              {u.role !== 'admin' && (
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateRole(u.id, 'admin')}
                                  className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black shadow-xs transition active:scale-95 disabled:opacity-50"
                                  title="Thăng cấp lên Quản trị viên"
                                >
                                  🛡️ Admin
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
