'use client';

import React, { useState, useEffect } from 'react';
import { useLearningStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Plan } from '@/types';

export default function PricingModal() {
  const {
    isPricingModalOpen,
    closePricingModal,
    openCheckoutModal,
    entitlements,
    user,
    openAuthModal,
  } = useLearningStore();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isPricingModalOpen) {
      setLoading(true);
      api
        .getPlans()
        .then((data) => {
          if (data && data.length > 0) {
            setPlans(data);
          }
        })
        .catch((err) => console.error('Failed to load plans:', err))
        .finally(() => setLoading(false));
    }
  }, [isPricingModalOpen]);

  if (!isPricingModalOpen) return null;

  const freePlan = plans.find((p) => p.code === 'free') || {
    code: 'free',
    name: 'Miễn Phí (Free)',
    description: 'Học cơ bản vững chắc với đầy đủ tính năng luyện dịch phản xạ.',
    priceVnd: 0,
    originalPriceVnd: 0,
    billingCycle: 'monthly' as const,
    dailyAiLimit: 10,
    features: [
      'Truy cập các bài học A1 - B1',
      'Luyện dịch 2 chiều Anh ⇄ Việt',
      '10 lượt Gia Sư AI cơ bản / ngày',
      'Tra cứu từ vựng & cấu trúc ngữ pháp',
      'Theo dõi tiến độ & streak học tập',
    ],
  };

  const proMonthly = plans.find((p) => p.code === 'pro_monthly') || {
    code: 'pro_monthly',
    name: 'WriteDuo Pro Tháng',
    description: 'Tăng tốc phản xạ và làm chủ ngữ pháp chuyên sâu không giới hạn.',
    priceVnd: 99000,
    originalPriceVnd: 159000,
    billingCycle: 'monthly' as const,
    dailyAiLimit: 100,
    features: [
      'Mở khóa toàn bộ bài học (A1 - C1, IELTS, TOEIC)',
      '100 lượt Gia Sư AI chuyên sâu / ngày',
      'Phân tích ngữ pháp đa tầng & so sánh sắc thái',
      'Luyện dịch toàn đoạn văn (Reverse Paragraph Translation)',
      'Hệ thống lặp lại ngắt quãng (Spaced Repetition)',
      'Báo cáo phân tích điểm yếu ngữ pháp chuyên sâu',
      'Ưu tiên máy chủ AI độ trễ thấp & hỗ trợ 24/7',
    ],
  };

  const proAnnual = plans.find((p) => p.code === 'pro_annual') || {
    code: 'pro_annual',
    name: 'WriteDuo Pro Trọn Năm',
    description: 'Gói tối ưu nhất cho người học nghiêm túc muốn đạt chuẩn 7.5+ IELTS.',
    priceVnd: 699000,
    originalPriceVnd: 1188000,
    billingCycle: 'annual' as const,
    dailyAiLimit: 100,
    badge: 'Tiết kiệm 41%',
    isPopular: true,
    features: [
      'Tất cả quyền lợi của gói Pro Hàng Tháng',
      'Tiết kiệm 489,000 VND so với thanh toán từng tháng',
      'Tương đương chỉ ~58,000 VND / tháng',
      'Truy cập độc quyền phòng thi mô phỏng IELTS Lab',
      'Huy hiệu Pro VIP nổi bật trên Bảng Xếp Hạng',
      'Cam kết cập nhật liên tục mọi tính năng mới trong năm',
    ],
  };

  const activeProPlan = billingCycle === 'annual' ? proAnnual : proMonthly;
  const isCurrentPro = entitlements?.isPro;

  const handleSelectPlan = (plan: Plan) => {
    if (plan.code === 'free') {
      closePricingModal();
      return;
    }
    if (!user) {
      closePricingModal();
      openAuthModal('login');
      return;
    }
    openCheckoutModal(plan);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 text-white p-6 md:p-8">
        {/* Close Button */}
        <button
          onClick={closePricingModal}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Nâng Tầm Trình Độ Tiếng Anh 2026
          </div>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
            Đầu Tư Vào Kết Quả Học Thực Sự
          </h2>
          <p className="mt-2 text-sm md:text-base text-slate-300">
            WriteDuo không khóa tính năng vô lý. Chúng tôi trao cho bạn trợ lý AI giải thích tường tận mọi cấu trúc, sửa từng lỗi sai và đồng hành đến khi bạn tự tin diễn đạt.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center p-1 mt-6 rounded-xl bg-slate-800/80 border border-slate-700">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hàng Tháng
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                billingCycle === 'annual'
                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Theo Năm</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                -41% TIẾT KIỆM
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* FREE PLAN */}
          <div className="relative flex flex-col p-6 rounded-xl bg-slate-800/50 border border-slate-700/80 hover:border-slate-600 transition-all">
            <div className="mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Gói Khởi Động
              </span>
              <h3 className="text-xl font-bold text-white mt-1">{freePlan.name}</h3>
              <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{freePlan.description}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">0₫</span>
                <span className="text-xs text-slate-400">/ mãi mãi</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">10 câu hỏi Gia Sư AI miễn phí mỗi ngày</p>
            </div>

            <ul className="flex-1 space-y-3 mb-6 text-xs md:text-sm text-slate-300">
              {freePlan.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(freePlan)}
              disabled={!isCurrentPro}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                !isCurrentPro
                  ? 'bg-slate-700/60 text-slate-400 border border-slate-600/50 cursor-default'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              {!isCurrentPro ? 'Gói Hiện Tại Của Bạn' : 'Sử Dụng Bản Miễn Phí'}
            </button>
          </div>

          {/* PRO PLAN */}
          <div className="relative flex flex-col p-6 rounded-xl bg-gradient-to-b from-slate-800/90 via-slate-800/60 to-slate-900 border-2 border-cyan-400/80 shadow-xl shadow-cyan-500/10">
            {/* Top Badge */}
            <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-[11px] font-extrabold uppercase tracking-wide shadow-md">
              {billingCycle === 'annual' ? '🌟 LỰA CHỌN TỐI ƯU NHẤT' : '🔥 PHỔ BIẾN NHẤT'}
            </div>

            <div className="mb-4">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Gói Chuyên Nghiệp
              </span>
              <h3 className="text-xl font-bold text-white mt-1">{activeProPlan.name}</h3>
              <p className="text-xs text-slate-300 mt-1 min-h-[32px]">{activeProPlan.description}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-cyan-300">
                  {activeProPlan.priceVnd.toLocaleString('vi-VN')}₫
                </span>
                <span className="text-xs text-slate-400">
                  / {billingCycle === 'annual' ? 'năm' : 'tháng'}
                </span>
                {activeProPlan.originalPriceVnd > activeProPlan.priceVnd && (
                  <span className="text-xs text-slate-500 line-through">
                    {activeProPlan.originalPriceVnd.toLocaleString('vi-VN')}₫
                  </span>
                )}
              </div>
              <p className="text-xs text-cyan-400/90 font-medium mt-1">
                100 lượt Gia Sư AI chuyên sâu / ngày (độ trễ siêu tốc &lt; 1s)
              </p>
            </div>

            <ul className="flex-1 space-y-3 mb-6 text-xs md:text-sm text-slate-200">
              {activeProPlan.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(activeProPlan)}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all transform active:scale-[0.98]"
            >
              {isCurrentPro ? 'Gia Hạn / Đổi Gói Pro' : 'Nâng Cấp WriteDuo Pro Ngay 🚀'}
            </button>
          </div>
        </div>

        {/* Transparency & Fair Use Note */}
        <div className="border-t border-slate-800 pt-5 text-center text-xs text-slate-400 space-y-1">
          <p className="flex items-center justify-center gap-1.5 text-slate-300">
            <svg className="w-4 h-4 text-emerald-400 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Thanh toán an toàn qua chuẩn <strong>VietQR Napas 247</strong> (Hỗ trợ 40+ ngân hàng VN & MoMo). Kích hoạt tự động sau 3 giây.</span>
          </p>
          <p>
            Chính sách minh bạch: Giới hạn 100 câu/ngày nhằm duy trì chất lượng AI và hạ tầng ổn định. Hủy bất cứ lúc nào, không tự động trừ tiền âm thầm.
          </p>
        </div>
      </div>
    </div>
  );
}
