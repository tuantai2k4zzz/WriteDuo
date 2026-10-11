import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  User,
  UserDocument,
  Subscription,
  SubscriptionDocument,
  Plan,
  PlanDocument,
  AIUsageLog,
  AIUsageLogDocument,
} from '../../schemas';

export interface UserEntitlements {
  planCode: string;
  planName: string;
  isPro: boolean;
  isAdmin: boolean;
  status: 'active' | 'free' | 'expired' | 'canceled';
  expiresAt: string | null;
  dailyAiLimit: number;
  usedToday: number;
  remainingToday: number;
  canAccessAllLevels: boolean;
  canUseFullReverseTranslation: boolean;
  canUseDeepGrammar: boolean;
  canUseSpacedRepetitionHub: boolean;
  features: string[];
}

@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);

  // Default fallback limits
  public readonly FREE_DAILY_AI_LIMIT = 10;
  public readonly PRO_DAILY_AI_LIMIT = 100;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
    @InjectModel(AIUsageLog.name) private aiUsageModel: Model<AIUsageLogDocument>,
  ) {}

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  async getEntitlements(userId?: string): Promise<UserEntitlements> {
    // 1. Guest / unauthenticated fallback
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return {
        planCode: 'free',
        planName: 'Khách Học Thử (Miễn Phí)',
        isPro: false,
        isAdmin: false,
        status: 'free',
        expiresAt: null,
        dailyAiLimit: 5,
        usedToday: 0,
        remainingToday: 5,
        canAccessAllLevels: false,
        canUseFullReverseTranslation: false,
        canUseDeepGrammar: false,
        canUseSpacedRepetitionHub: false,
        features: ['15 Bài học cơ bản A1-A2', 'Luyện dịch câu cơ bản', 'Tra cứu từ vựng'],
      };
    }

    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      return this.getEntitlements(undefined);
    }

    const isAdmin = user.role === 'admin';
    const now = new Date();

    // 2. Check active subscription in database
    const subscription = await this.subscriptionModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: 'active',
        currentPeriodEnd: { $gte: now },
      })
      .sort({ currentPeriodEnd: -1 })
      .lean();

    const isPro = isAdmin || !!subscription || user.role === 'premium';
    const planCode = isPro ? (subscription?.planCode || 'pro_monthly') : 'free';

    // 3. Resolve plan metadata
    let dailyLimit = isPro ? this.PRO_DAILY_AI_LIMIT : this.FREE_DAILY_AI_LIMIT;
    let planName = isPro ? (subscription?.planCode === 'pro_annual' ? 'WriteDuo Pro Trọn Năm' : 'WriteDuo Pro Hàng Tháng') : 'Miễn Phí';

    try {
      const planDoc = await this.planModel.findOne({ code: planCode }).lean();
      if (planDoc) {
        dailyLimit = planDoc.dailyAiLimit || dailyLimit;
        planName = planDoc.name || planName;
      }
    } catch {}

    if (isAdmin) {
      dailyLimit = 999999;
      planName = 'Quản Trị Viên (Admin VIP)';
    }

    // 4. Calculate actual usage today
    const todayKey = this.getTodayKey();
    const usedToday = await this.aiUsageModel.countDocuments({
      userId: new Types.ObjectId(userId),
      dateKey: todayKey,
    });

    const remainingToday = isAdmin ? 999999 : Math.max(0, dailyLimit - usedToday);

    const expiresAt = subscription?.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd).toISOString()
      : null;

    return {
      planCode,
      planName,
      isPro,
      isAdmin,
      status: isPro ? 'active' : 'free',
      expiresAt,
      dailyAiLimit: dailyLimit,
      usedToday,
      remainingToday,
      canAccessAllLevels: isPro,
      canUseFullReverseTranslation: isPro,
      canUseDeepGrammar: isPro,
      canUseSpacedRepetitionHub: isPro,
      features: isPro
        ? [
            'Mở khóa toàn bộ thư viện A1 đến C1 & IELTS/TOEIC',
            '100 lượt Gia Sư AI chuyên sâu mỗi ngày',
            'Phân tích ngữ pháp chuyên sâu & đa phong cách (Multi-Tone)',
            'Chấm điểm toàn đoạn văn (Reverse Paragraph Translation)',
            'Hồi tưởng ngắt quãng thông minh (Spaced Repetition)',
            'Không quảng cáo & ưu tiên máy chủ tốc độ cao',
          ]
        : [
            'Học thử bài học căn bản A1 - B1',
            '10 lượt Gia Sư AI cơ bản mỗi ngày',
            'Luyện dịch phản xạ câu đơn',
            'Sổ tay lưu từ vựng cá nhân',
          ],
    };
  }

  async checkAIAllowance(
    userId?: string,
    operation: string = 'tutor_chat',
  ): Promise<{ allowed: boolean; remaining: number; plan: string; reason?: string }> {
    const entitlements = await this.getEntitlements(userId);

    if (entitlements.isAdmin) {
      return { allowed: true, remaining: 999999, plan: 'admin' };
    }

    if (entitlements.remainingToday <= 0) {
      return {
        allowed: false,
        remaining: 0,
        plan: entitlements.planCode,
        reason: entitlements.isPro
          ? `Bạn đã đạt giới hạn ${entitlements.dailyAiLimit} câu hỏi AI trong ngày hôm nay. Hạn mức sẽ tự động đặt lại vào 00:00 ngày mai.`
          : `Bạn đã sử dụng hết ${entitlements.dailyAiLimit} câu hỏi AI miễn phí hôm nay. Hãy nâng cấp lên WriteDuo Pro để tiếp tục học với 100 câu/ngày!`,
      };
    }

    return {
      allowed: true,
      remaining: entitlements.remainingToday,
      plan: entitlements.planCode,
    };
  }

  async recordAIUsage(
    userId?: string,
    operation: string = 'tutor_chat',
    metadata?: Record<string, any>,
  ): Promise<void> {
    if (!userId || !Types.ObjectId.isValid(userId)) return;

    try {
      const todayKey = this.getTodayKey();
      const user = await this.userModel.findById(userId).select('role').lean();
      const planAtTime = user?.role === 'premium' ? 'pro' : user?.role || 'free';

      // Estimate cost in VND: ~50 VND per Gemini Flash API call
      const costEstimateVnd = operation === 'paragraph_evaluation' ? 120 : 50;

      await this.aiUsageModel.create({
        userId: new Types.ObjectId(userId),
        operation,
        tokenCount: metadata?.tokenCount || 400,
        costEstimateVnd,
        dateKey: todayKey,
        planAtTime,
        metadata,
      });

      // Increment overall counter on user document
      await this.userModel.findByIdAndUpdate(userId, { $inc: { aiQueriesCount: 1 } });
    } catch (err: any) {
      this.logger.warn(`Could not record AI usage: ${err.message}`);
    }
  }

  async canAccessLessonLevel(userId: string | undefined, level: string): Promise<{ allowed: boolean; reason?: string }> {
    const normLevel = level.toUpperCase();
    const freeLevels = ['A1', 'A2', 'B1'];

    if (freeLevels.includes(normLevel)) {
      return { allowed: true };
    }

    const entitlements = await this.getEntitlements(userId);
    if (entitlements.isPro || entitlements.isAdmin) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Cấp độ ${normLevel} (B2, C1, IELTS, TOEIC) thuộc gói WriteDuo Pro độc quyền. Vui lòng nâng cấp để mở khóa.`,
    };
  }
}
