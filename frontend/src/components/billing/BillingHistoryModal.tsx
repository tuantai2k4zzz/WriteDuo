'use client';

import React, { useState, useEffect } from 'react';
import { useLearningStore } from '@/lib/store';
import { api } from '@/lib/api';
import { UserSubscription, PaymentOrder } from '@/types';

export default function BillingHistoryModal() {
  const {
    isBillingHistoryModalOpen,
    closeBillingHistoryModal,
    openPricingModal,
    loadEntitlements,
  } = useLearningStore();

  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (isBillingHistoryModalOpen) {
      setLoading(true);
      api
        .getBillingHistory()
        .then((data) => {
          setSubscription(data.subscription || null);
          setOrders(data.orders || []);
        })
        .catch((err) => console.error('Failed to load billing history:', err))
        .finally(() => setLoading(false));
    }
  }, [isBillingHistoryModalOpen]);

  if (!isBillingHistoryModalOpen) return null;

  const handleCancelAutoRenew = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy tự động gia hạn? Bạn vẫn sẽ giữ nguyên quyền lợi Pro cho đến hết chu kỳ đã thanh toán.')) {
      return;
    }
    setCanceling(true);
    try {
      await api.cancelSubscription('Người dùng chủ động hủy');
      await loadEntitlements();
      // Reload history
      const updated = await api.getBillingHistory();
      setSubscription(updated.subscription || null);
      alert('Đã tắt tự động gia hạn thành công.');
    } catch (err: any) {
      alert('Có lỗi xảy ra: ' + err.message);
    } finally {
      setCanceling(false);
    }
  };

  const calculateDaysRemaining = (endDateStr: string) => {
    const end = new Date(endDateStr).getTime();
    const now = Date.now();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 text-white p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={closeBillingHistoryModal}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
            Quản Lý Gói &amp; Hóa Đơn
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">Lịch Sử Thanh Toán &amp; Thuê Bao</h2>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Đang tải lịch sử thanh toán...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* CURRENT SUBSCRIPTION CARD */}
            <div className="p-5 rounded-xl bg-slate-800/80 border border-cyan-500/30 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {subscription?.planCode === 'pro_annual'
                        ? 'WriteDuo Pro Trọn Năm'
                        : subscription?.planCode === 'pro_monthly'
                        ? 'WriteDuo Pro Hàng Tháng'
                        : 'Gói Miễn Phí (Free)'}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                        subscription?.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {subscription?.status === 'active' ? 'Đang Hoạt Động' : 'Miễn Phí'}
                    </span>
                  </div>

                  {subscription?.currentPeriodEnd && (
                    <p className="text-xs text-slate-300 mt-2">
                      Hết hạn vào: <strong>{new Date(subscription.currentPeriodEnd).toLocaleDateString('vi-VN')}</strong> (Còn {calculateDaysRemaining(subscription.currentPeriodEnd)} ngày)
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {subscription?.status === 'active' && subscription.autoRenew && (
                    <button
                      onClick={handleCancelAutoRenew}
                      disabled={canceling}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors"
                    >
                      {canceling ? 'Đang xử lý...' : 'Hủy Tự Gia Hạn'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      closeBillingHistoryModal();
                      openPricingModal();
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all"
                  >
                    Đổi / Gia Hạn Gói
                  </button>
                </div>
              </div>
            </div>

            {/* ORDERS TABLE */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 mb-3">Lịch Sử Giao Dịch VietQR</h3>
              {orders.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-800/40 border border-slate-700/60 text-slate-400 text-xs">
                  Chưa có giao dịch thanh toán nào được ghi nhận.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-700/80">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Mã Đơn</th>
                        <th className="p-3">Gói</th>
                        <th className="p-3">Số Tiền</th>
                        <th className="p-3">Ngày Tạo</th>
                        <th className="p-3">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {orders.map((ord) => (
                        <tr key={ord.orderCode} className="hover:bg-slate-800/40">
                          <td className="p-3 font-mono font-medium text-cyan-300">{ord.orderCode}</td>
                          <td className="p-3 font-semibold text-white">
                            {ord.planCode === 'pro_annual' ? 'Pro Năm' : 'Pro Tháng'}
                          </td>
                          <td className="p-3 font-bold text-emerald-400">
                            {ord.amountVnd.toLocaleString('vi-VN')}₫
                          </td>
                          <td className="p-3 text-slate-400">
                            {new Date(ord.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                ord.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : ord.status === 'pending'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {ord.status === 'completed'
                                ? 'Thành công'
                                : ord.status === 'pending'
                                ? 'Đang chờ'
                                : 'Đã hủy'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
