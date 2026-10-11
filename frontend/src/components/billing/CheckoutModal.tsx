'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLearningStore } from '@/lib/store';
import { api } from '@/lib/api';
import { PaymentOrder } from '@/types';
import { playSound } from '@/lib/audio';

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
  const [isCheckingManual, setIsCheckingManual] = useState(false);
  const [manualCheckMsg, setManualCheckMsg] = useState<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Checkout Order
  useEffect(() => {
    if (isCheckoutModalOpen && selectedCheckoutPlan) {
      setLoading(true);
      setIsSuccess(false);
      setManualCheckMsg(null);
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
      setManualCheckMsg(null);
    }
  }, [isCheckoutModalOpen, selectedCheckoutPlan]);

  // Live Status Polling (Auto-check every 3 seconds)
  useEffect(() => {
    if (!order || isSuccess || order.status === 'completed') return;

    pollTimerRef.current = setInterval(async () => {
      try {
        const latest = await api.getOrderStatus(order.orderCode);
        if (latest.status === 'completed') {
          playSound('correct');
          setIsSuccess(true);
          await loadEntitlements();
          await refreshUserData();
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        }
      } catch (e) {
        // Silently retry polling
      }
    }, 3000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [order, isSuccess]);

  if (!isCheckoutModalOpen || !selectedCheckoutPlan) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    playSound('click');
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // User explicitly clicks "I have transferred" to verify right away
  const handleCheckNow = async () => {
    if (!order) return;
    setIsCheckingManual(true);
    setManualCheckMsg(null);
    playSound('click');

    try {
      const latest = await api.getOrderStatus(order.orderCode);
      if (latest.status === 'completed') {
        playSound('correct');
        setIsSuccess(true);
        await loadEntitlements();
        await refreshUserData();
      } else {
        setManualCheckMsg(
          'Hệ thống đang đồng bộ dữ liệu giao dịch từ MB Bank. Nếu bạn vừa chuyển khoản thành công, vui lòng đợi 15 - 30 giây để ngân hàng ghi nhận tín hiệu.',
        );
      }
    } catch (err: any) {
      setManualCheckMsg('Lỗi khi kiểm tra trạng thái đơn: ' + err.message);
    } finally {
      setIsCheckingManual(false);
    }
  };

  const bankName =
    order?.bankInfo?.bankId ||
    order?.bankInfo?.bankName ||
    'MB Bank (Ngân hàng Quân Đội)';
  const accountNo =
    order?.bankInfo?.accountNo ||
    order?.bankInfo?.accountNumber ||
    '0865903707';
  const accountName = order?.bankInfo?.accountName || 'BUI TUAN TAI';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-500/20 text-white p-4 sm:p-6 md:p-8 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={closeCheckoutModal}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
                className="w-full py-3.5 px-6 rounded-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                Bắt Đầu Học Ngay Với Gói Pro 🚀
              </button>
            </div>
          </div>
        ) : loading || !order ? (
          /* LOADING STATE */
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-300">Đang khởi tạo mã VietQR Napas 24/7...</p>
          </div>
        ) : (
          /* REAL ORDER & QR DETAILS */
          <div>
            {/* Header */}
            <div className="text-center mb-6">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                Cổng Thanh Toán VietQR 24/7 (MB Bank)
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-2">
                Nâng Cấp {selectedCheckoutPlan.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Mở ứng dụng Ngân hàng (MB Bank, Vietcombank, Techcombank,...) hoặc MoMo quét mã QR bên dưới.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950 border border-slate-800 mb-6">
              <div className="relative p-2 bg-white rounded-xl shadow-lg">
                <img
                  src={order.qrCodeUrl}
                  alt="VietQR MBBank WriteDuo"
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
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-300 font-medium">
                  Hệ thống đang lắng nghe giao dịch từ MB Bank (tự động cập nhật)...
                </span>
              </div>
            </div>

            {/* Payment Details Accordion */}
            <div className="space-y-2.5 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 text-xs md:text-sm mb-5">
              <div className="flex items-center justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Ngân hàng thụ hưởng:</span>
                <span className="font-semibold text-white">{bankName}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Chủ tài khoản:</span>
                <span className="font-semibold text-white uppercase">{accountName}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-300">{accountNo}</span>
                  <button
                    onClick={() => handleCopy(accountNo, 'accountNo')}
                    className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-[11px] text-slate-300 transition-colors cursor-pointer"
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
                    className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-[11px] text-slate-300 transition-colors cursor-pointer"
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
                    className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-[11px] text-slate-300 transition-colors cursor-pointer"
                  >
                    {copiedField === 'memo' ? '✓ Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
            </div>

            {/* Manual Check Banner / Notification */}
            {manualCheckMsg && (
              <div className="mb-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
                {manualCheckMsg}
              </div>
            )}

            {/* Action Buttons: Check Now & Support */}
            <div className="space-y-3 pt-1">
              <button
                onClick={handleCheckNow}
                disabled={isCheckingManual}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isCheckingManual ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang kiểm tra với ngân hàng...</span>
                  </>
                ) : (
                  <>
                    <span>🔄 Tôi Đã Chuyển Khoản (Kiểm Tra Ngay)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-800">
                <span>Cần hỗ trợ gấp?</span>
                <a
                  href="https://zalo.me/0865903707"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Nhắn Zalo Admin (0865903707)</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
