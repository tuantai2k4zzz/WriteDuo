import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Plan,
  PlanDocument,
  Subscription,
  SubscriptionDocument,
  PaymentOrder,
  PaymentOrderDocument,
  User,
  UserDocument,
} from '../../schemas';
import { VietQRPayOSProvider } from './providers/vietqr-payos.provider';
import { EntitlementService } from './entitlement.service';

@Injectable()
export class BillingService implements OnModuleInit {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(PaymentOrder.name) private orderModel: Model<PaymentOrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private vietqrProvider: VietQRPayOSProvider,
    private entitlementService: EntitlementService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultPlans();
  }

  // Seed standard plans if empty
  private async seedDefaultPlans() {
    try {
      const count = await this.planModel.countDocuments();
      if (count === 0) {
        this.logger.log('Seeding initial WriteDuo subscription plans...');
        const initialPlans = [
          {
            code: 'free',
            name: 'Gói Miễn Phí (Starter)',
            priceVnd: 0,
            originalPriceVnd: 0,
            billingCycle: 'free',
            dailyAiLimit: 10,
            isPopular: false,
            isActive: true,
            order: 1,
            features: [
              'Truy cập bài học căn bản A1 - B1',
              'Luyện dịch phản xạ 2 chiều Việt - Anh',
              '10 lượt Gia Sư AI cơ bản / ngày',
              'Sổ tay từ vựng & theo dõi chuỗi ngày Streak',
            ],
          },
          {
            code: 'pro_monthly',
            name: 'WriteDuo Pro (Hàng Tháng)',
            priceVnd: 99000,
            originalPriceVnd: 149000,
            billingCycle: 'monthly',
            dailyAiLimit: 100,
            isPopular: true,
            isActive: true,
            order: 2,
            features: [
              'Mở khóa toàn bộ thư viện bài học A1 - C1 & IELTS/TOEIC',
              '100 lượt Gia Sư AI chuyên sâu / ngày',
              'Gia Sư phân tích toàn đoạn (Reverse Paragraph Translation)',
              'Phân tích ngữ pháp đa phong cách (Multi-Tone)',
              'Hồi tưởng ngắt quãng chống quên (Spaced Repetition)',
              'Không giới hạn trái tim & ưu tiên máy chủ AI tốc độ cao',
            ],
          },
          {
            code: 'pro_annual',
            name: 'WriteDuo Pro (Trọn Năm)',
            priceVnd: 699000,
            originalPriceVnd: 1188000,
            billingCycle: 'annual',
            dailyAiLimit: 100,
            isPopular: false,
            isActive: true,
            order: 3,
            features: [
              'Tất cả quyền lợi của gói Pro Hàng Tháng',
              'Tiết kiệm 41% so với đóng từng tháng (chỉ ~58k/tháng)',
              'Bộ huy hiệu học viên VIP Hologram độc quyền',
              'Được ưu tiên trải nghiệm sớm tính năng AI Roleplay',
              'Hỗ trợ kỹ thuật 1-kèm-1 ưu tiên 24/7',
            ],
          },
        ];

        await this.planModel.insertMany(initialPlans);
        this.logger.log('Successfully seeded WriteDuo subscription plans.');
      }
    } catch (err: any) {
      this.logger.warn(`Could not seed plans: ${err.message}`);
    }
  }

  // Get active plans for frontend pricing table
  async getPlans() {
    return this.planModel.find({ isActive: true }).sort({ order: 1 }).lean();
  }

  // Generate unique order code
  private generateOrderCode(): string {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `WD${randomDigits}`;
  }

  // Create checkout session / VietQR payment order
  async createCheckoutOrder(userId: string, planCode: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ.');
    }

    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng.');
    }

    const plan = await this.planModel.findOne({ code: planCode, isActive: true }).lean();
    if (!plan || plan.priceVnd <= 0) {
      throw new BadRequestException('Gói đăng ký không hợp lệ hoặc miễn phí.');
    }

    const orderCode = this.generateOrderCode();
    const paymentParams = {
      orderCode,
      amountVnd: plan.priceVnd,
      planCode: plan.code,
      planName: plan.name,
      userEmail: user.email,
      userName: user.name,
    };

    const qrResult = await this.vietqrProvider.createPaymentOrder(paymentParams);

    const order = await this.orderModel.create({
      orderCode,
      userId: new Types.ObjectId(userId),
      planCode: plan.code,
      amountVnd: plan.priceVnd,
      currency: 'VND',
      status: 'pending',
      provider: 'vietqr',
      paymentMethod: 'QR_TRANSFER',
      transferContent: qrResult.transferContent,
      qrCodeUrl: qrResult.qrCodeUrl,
      bankInfo: qrResult.bankInfo,
      metadata: {
        planName: plan.name,
        billingCycle: plan.billingCycle,
        userEmail: user.email,
      },
    });

    return {
      orderId: order._id.toString(),
      orderCode: order.orderCode,
      amountVnd: order.amountVnd,
      planCode: plan.code,
      planName: plan.name,
      transferContent: order.transferContent,
      qrCodeUrl: order.qrCodeUrl,
      bankInfo: order.bankInfo,
      status: order.status,
    };
  }

  // Check order status
  async getOrderStatus(orderIdOrCode: string, userId: string) {
    let order: PaymentOrderDocument | null = null;

    if (Types.ObjectId.isValid(orderIdOrCode)) {
      order = await this.orderModel.findById(orderIdOrCode);
    }
    if (!order) {
      order = await this.orderModel.findOne({ orderCode: orderIdOrCode });
    }

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn thanh toán.');
    }

    // Ensure ownership or admin
    if (order.userId.toString() !== userId) {
      const user = await this.userModel.findById(userId).select('role').lean();
      if (user?.role !== 'admin') {
        throw new BadRequestException('Bạn không có quyền xem đơn hàng này.');
      }
    }

    return {
      orderId: order._id.toString(),
      orderCode: order.orderCode,
      planCode: order.planCode,
      amountVnd: order.amountVnd,
      status: order.status,
      transferContent: order.transferContent,
      qrCodeUrl: order.qrCodeUrl,
      bankInfo: order.bankInfo,
      paidAt: order.paidAt,
      metadata: order.metadata,
    };
  }

  // IDEMPOTENT: Verify and activate subscription upon payment receipt
  async verifyAndActivateOrder(orderCode: string, transactionDetails: any) {
    const order = await this.orderModel.findOne({ orderCode });
    if (!order) {
      this.logger.warn(`Webhook received for non-existent order code: ${orderCode}`);
      throw new NotFoundException(`Order code not found: ${orderCode}`);
    }

    // Idempotency: if already completed, return immediately without re-extending
    if (order.status === 'completed') {
      this.logger.log(`Order ${orderCode} already verified and completed.`);
      return { success: true, alreadyCompleted: true };
    }

    order.status = 'completed';
    order.paidAt = new Date();
    order.providerTransactionId = transactionDetails.providerTransactionId || `TX-${Date.now()}`;
    order.webhookPayload = transactionDetails.rawPayload || transactionDetails;
    await order.save();

    // Calculate subscription period
    const now = new Date();
    const periodDays = order.planCode === 'pro_annual' ? 365 : 30;

    // Check existing subscription to extend if still active
    const existingSub = await this.subscriptionModel
      .findOne({
        userId: order.userId,
        status: 'active',
        currentPeriodEnd: { $gte: now },
      })
      .sort({ currentPeriodEnd: -1 });

    const startDate = existingSub ? existingSub.startDate : now;
    const baseEnd = existingSub && existingSub.currentPeriodEnd > now ? existingSub.currentPeriodEnd : now;
    const newPeriodEnd = new Date(baseEnd.getTime() + periodDays * 24 * 60 * 60 * 1000);

    let sub: SubscriptionDocument;
    if (existingSub) {
      existingSub.currentPeriodEnd = newPeriodEnd;
      existingSub.planCode = order.planCode;
      existingSub.lastPaymentOrderId = order._id;
      existingSub.autoRenew = true;
      existingSub.status = 'active';
      sub = await existingSub.save();
    } else {
      sub = await this.subscriptionModel.create({
        userId: order.userId,
        planCode: order.planCode,
        status: 'active',
        startDate,
        currentPeriodEnd: newPeriodEnd,
        autoRenew: true,
        lastPaymentOrderId: order._id,
      });
    }

    // Update user role to 'premium'
    await this.userModel.findByIdAndUpdate(order.userId, { role: 'premium' });

    this.logger.log(
      `Successfully activated Pro subscription for user ${order.userId}. Valid until ${newPeriodEnd.toISOString()}`,
    );

    return {
      success: true,
      orderCode: order.orderCode,
      subscriptionId: sub._id.toString(),
      currentPeriodEnd: newPeriodEnd,
    };
  }

  // Handle incoming payment webhook
  async handlePaymentWebhook(payload: any, signature?: string) {
    const verified = await this.vietqrProvider.verifyWebhook(payload, signature);
    if (!verified.isValid || !verified.orderCode) {
      throw new BadRequestException(verified.error || 'Invalid webhook signature or data');
    }

    return this.verifyAndActivateOrder(verified.orderCode, verified);
  }

  // Sandbox payment disabled for production
  async simulateSandboxPayment(_orderId: string, _userId: string) {
    throw new BadRequestException(
      'Hệ thống đang hoạt động ở chế độ sản xuất thực tế (Production). Tính năng Sandbox Test đã được tắt hoàn toàn. Vui lòng thanh toán qua VietQR MB Bank.',
    );
  }

  // Get active user subscription details
  async getUserSubscription(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    const now = new Date();
    const sub = await this.subscriptionModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: 'active',
      })
      .sort({ currentPeriodEnd: -1 })
      .lean();

    if (!sub) return null;

    const isActive = sub.currentPeriodEnd >= now;
    const daysRemaining = Math.max(
      0,
      Math.ceil((new Date(sub.currentPeriodEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const plan = await this.planModel.findOne({ code: sub.planCode }).lean();

    return {
      id: sub._id.toString(),
      planCode: sub.planCode,
      planName: plan?.name || (sub.planCode === 'pro_annual' ? 'Pro Trọn Năm' : 'Pro Hàng Tháng'),
      status: isActive ? 'active' : 'expired',
      startDate: sub.startDate,
      currentPeriodEnd: sub.currentPeriodEnd,
      daysRemaining,
      autoRenew: sub.autoRenew,
      canceledAt: sub.canceledAt,
    };
  }

  // Cancel subscription renewal (User keeps access until period ends)
  async cancelSubscription(userId: string, reason?: string) {
    const sub = await this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });

    if (!sub) {
      throw new NotFoundException('Không tìm thấy gói đăng ký Pro đang hoạt động.');
    }

    sub.autoRenew = false;
    sub.canceledAt = new Date();
    sub.cancellationReason = reason || 'Người dùng hủy gia hạn';
    await sub.save();

    return {
      success: true,
      message: 'Đã hủy tự động gia hạn thành công. Bạn vẫn giữ toàn bộ quyền lợi Pro cho đến hết chu kỳ hiện tại.',
      currentPeriodEnd: sub.currentPeriodEnd,
    };
  }

  // Get billing history (past receipts/orders + active subscription)
  async getBillingHistory(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      return { subscription: null, orders: [] };
    }

    const [subscription, orders] = await Promise.all([
      this.getUserSubscription(userId),
      this.orderModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return {
      subscription,
      orders: orders.map((o) => ({
        id: o._id.toString(),
        orderCode: o.orderCode,
        planCode: o.planCode,
        planName: o.metadata?.planName || o.planCode,
        amountVnd: o.amountVnd,
        status: o.status,
        createdAt: (o as any).createdAt,
        paidAt: o.paidAt,
        paymentMethod: o.paymentMethod,
      })),
    };
  }

  // Get monetization metrics for Admin
  async getMonetizationStats() {
    const now = new Date();
    const totalOrders = await this.orderModel.countDocuments();
    const completedOrders = await this.orderModel.countDocuments({ status: 'completed' });
    const pendingOrders = await this.orderModel.countDocuments({ status: 'pending' });

    // Aggregate revenue
    const revenueAgg = await this.orderModel.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amountVnd' } } },
    ]);
    const totalRevenueVnd = revenueAgg[0]?.totalRevenue || 0;

    // Active subscriptions
    const activeSubs = await this.subscriptionModel.countDocuments({
      status: 'active',
      currentPeriodEnd: { $gte: now },
    });

    const monthlySubs = await this.subscriptionModel.countDocuments({
      status: 'active',
      planCode: 'pro_monthly',
      currentPeriodEnd: { $gte: now },
    });

    const annualSubs = await this.subscriptionModel.countDocuments({
      status: 'active',
      planCode: 'pro_annual',
      currentPeriodEnd: { $gte: now },
    });

    // Approximate MRR: monthly * 99,000 + (annual * 699,000 / 12)
    const mrr = Math.round(monthlySubs * 99000 + (annualSubs * 699000) / 12);

    // Total Users & Conversion Rate
    const totalUsers = await this.userModel.countDocuments();
    const conversionRate = totalUsers > 0 ? Number(((activeSubs / totalUsers) * 100).toFixed(2)) : 0;

    // AI Cost Estimation
    const allUsers = await this.userModel.find().select('aiQueriesCount').lean();
    const totalQueries = allUsers.reduce((sum, u) => sum + (u.aiQueriesCount || 0), 0);
    const estimatedAiCostVnd = Math.round(totalQueries * 50); // ~50 VND / query

    const estimatedMarginVnd = Math.max(0, totalRevenueVnd - estimatedAiCostVnd);

    return {
      totalRevenueVnd,
      mrr,
      activeSubs,
      monthlySubs,
      annualSubs,
      totalOrders,
      completedOrders,
      pendingOrders,
      conversionRate,
      totalAiQueries: totalQueries,
      estimatedAiCostVnd,
      estimatedMarginVnd,
    };
  }

  // Get orders list for Admin inspection & manual verification
  async getAdminOrders(status?: string) {
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const orders = await this.orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'name email avatar role')
      .lean();

    return orders.map((o: any) => ({
      id: o._id.toString(),
      orderCode: o.orderCode,
      amountVnd: o.amountVnd,
      planCode: o.planCode,
      planName: o.metadata?.planName || o.planCode,
      status: o.status,
      createdAt: o.createdAt,
      paidAt: o.paidAt,
      paymentMethod: o.paymentMethod,
      transferContent: o.transferContent,
      qrCodeUrl: o.qrCodeUrl,
      bankInfo: o.bankInfo,
      user: o.userId
        ? {
            id: o.userId._id ? o.userId._id.toString() : String(o.userId),
            name: o.userId.name || 'Người dùng',
            email: o.userId.email || '',
            avatar: o.userId.avatar || '',
            role: o.userId.role || 'user',
          }
        : null,
    }));
  }
}

