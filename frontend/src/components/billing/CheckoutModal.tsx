'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLearningStore } from '@/lib/store';
import { api } from '@/lib/api';
import { PaymentOrder } from '@/types';

export default function CheckoutModal() {
  const {
    isCheckoutModalOpen,
    closeCheckoutModal,
    selectedCheckoutPlan,
    loadEntitlements,
    refreshUserData,
  } = useLearningStore();

  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Checkout Order
  useEffect(() => {
    if (isCheckoutModalOpen && selectedCheckoutPlan) {
      setLoading(true);
      setIsSuccess(false);
      api
        .createCheckout(selectedCheckoutPlan.code)
        .then((newOrder) => {
          setOrder(newOrder);
        })
        .catch((err) => {
          console.error('Failed to create checkout order:', err);
          alert('Không thể tạo đơn hàng thanh toán: ' + err.message);
          closeCheckoutModal();
        })
        .finally(() => setLoading(false));
    } else {
      setOrder(null);
      setIsSuccess(false);
    }
  }, [isCheckoutModalOpen, selectedCheckoutPlan]);

  // Status Polling
  useEffect(() => {
    if (!order || isSuccess || order.status === 'completed') return;

    pollTimerRef.current = setInterval(async () => {
      try {
        const latest = await api.getOrderStatus(order.orderCode);
        if (latest.status === 'completed') {
          setIsSuccess(true);
          await loadEntitlements();
          await refreshUserData();
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        }
      } catch (e) {
        // Ignore network polling glitches
      }
    }, 3000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [order, isSuccess]);

  if (!isCheckoutModalOpen || !selectedCheckoutPlan) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulatePayment = async () => {
    if (!order) return;
    setIsSimulating(true);
    try {
      const res = await api.simulatePayment(order.orderCode);
      if (res.success) {
        setIsSuccess(true);
        await loadEntitlements();
        await refreshUserData();
      }
    } catch (err: any) {
      alert('Không thể kích hoạt thử nghiệm: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-500/20 text-white p-6 md:p-8 max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={closeCheckoutModal}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* SUCCESS CELEBRATION STATE */}
        {isSuccess ? (
          <div className="text-center py-8 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg className="w-10 h-10 text-emerald-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white">Thanh Toán Thành Công! 🎉</h3>
            <p className="text-sm text-cyan-300 max-w-md mx-auto">
              Chúc mừng bạn đã chính thức trở thành hội viên <strong>WriteDuo Pro</strong>. Toàn bộ 100 lượt Gia Sư AI mỗi ngày và các bài học nâng cao đã được kích hoạt ngay lập tức!
            </p>
            <div className="pt-4">
              <button
                onClick={closeCheckoutModal}
                className="w-full py-3.5 px-6 rounded-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all"
              >
                Bắt Đầu Học Ngay Với Gói Pro 🚀
              </button>
            </div>
          </div>
        ) : loading || !order ? (
          /* LOADING STATE */
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-300">Đang khởi tạo mã VietQR thanh toán tự động...</p>
          </div>
        ) : (
          /* ORDER & QR DETAILS */
          <div>
            {/* Header */}
            <div className="text-center mb-6">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                Cổng Thanh Toán VietQR 247
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-2">
                Nâng Cấp {selectedCheckoutPlan.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Mở ứng dụng ngân hàng hoặc MoMo, quét mã QR bên dưới để thanh toán tức thì.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950 border border-slate-800 mb-6">
              <div className="relative p-2 bg-white rounded-xl shadow-lg">
                <img
                  src={order.qrCodeUrl}
                  alt="VietQR Thanh Toán WriteDuo"
                  className="w-56 h-56 object-contain rounded-lg"
                />
                <div className="absolute inset-x-0 bottom-2 text-center">
                  <span className="text-[10px] font-bold bg-slate-900/90 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                    Napas 247 Quét Tự Động
                  </span>
                </div>
              </div>

              {/* Live Polling Indicator */}
              <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span>Hệ thống đang chờ nhận chuyển khoản (kiểm tra mỗi 3 giây)...</span>
              </div>
            </div>

            {/* Payment Details Accordion */}
            <div className="space-y-2.5 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 text-xs md:text-sm mb-6">
              <div className="flex items-center justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Ngân hàng:</span>
                <span className="font-semibold text-white">{order.bankInfo.bankId}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Chủ tài khoản:</span>
                <span className="font-semibold text-white">{order.bankInfo.accountName}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-300">{order.bankInfo.accountNo}</span>
                  <button
                    onClick={() => handleCopy(order.bankInfo.accountNo, 'accountNo')}
                    className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-[11px] text-slate-300 transition-colors"
                  >
                    {copiedField === 'accountNo' ? '✓ Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Số tiền thanh toán:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-400 text-sm">
                    {order.amountVnd.toLocaleString('vi-VN')}₫
                  </span>
                  <button
                    onClick={() => handleCopy(order.amountVnd.toString(), 'amount')}
                    className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-[11px] text-slate-300 transition-colors"
                  >
                    {copiedField === 'amount' ? '✓ Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Nội dung chuyển khoản (bắt buộc):</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                    {order.transferContent}
                  </span>
                  <button
                    onClick={() => handleCopy(order.transferContent, 'memo')}
                    className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-[11px] text-slate-300 transition-colors"
                  >
                    {copiedField === 'memo' ? '✓ Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
            </div>

            {/* Sandbox Simulation Button (For Testing & Verification) */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={handleSimulatePayment}
                disabled={isSimulating}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-2 transition-all"
              >
                {isSimulating ? (
                  <span className="w-4 h-4 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>⚡ Kích Hoạt Thử Nghiệm (Sandbox / Test Mode)</span>
                )}
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Dành cho môi trường phát triển / kiểm thử: Kích hoạt ngay lập tức mà không cần chuyển khoản thực tế.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
