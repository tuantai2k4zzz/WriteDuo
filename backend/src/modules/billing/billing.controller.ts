import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { EntitlementService } from './entitlement.service';
import { JwtAuthGuard, OptionalJwtAuthGuard, AdminGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly entitlementService: EntitlementService,
  ) {}

  // 1. Get Available Plans & Pricing
  @Get('plans')
  async getPlans() {
    const plans = await this.billingService.getPlans();
    return {
      success: true,
      data: plans,
    };
  }

  // 2. Get User Entitlements (Works for guest or logged in user)
  @Get('entitlements')
  @UseGuards(OptionalJwtAuthGuard)
  async getEntitlements(@CurrentUser('userId') userId?: string) {
    const entitlements = await this.entitlementService.getEntitlements(userId);
    return {
      success: true,
      data: entitlements,
    };
  }

  // 3. Get Active User Subscription
  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async getSubscription(@CurrentUser('userId') userId: string) {
    const sub = await this.billingService.getUserSubscription(userId);
    return {
      success: true,
      data: sub,
    };
  }

  // 4. Create Checkout Order & VietQR
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(
    @CurrentUser('userId') userId: string,
    @Body('planCode') planCode: string,
  ) {
    const order = await this.billingService.createCheckoutOrder(userId, planCode);
    return {
      success: true,
      data: order,
    };
  }

  // 5. Get Order Status (for polling during payment)
  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  async getOrderStatus(
    @Param('id') orderIdOrCode: string,
    @CurrentUser('userId') userId: string,
  ) {
    const order = await this.billingService.getOrderStatus(orderIdOrCode, userId);
    return {
      success: true,
      data: order,
    };
  }

  // 6. User Billing History (Invoices & Past Orders)
  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getBillingHistory(@CurrentUser('userId') userId: string) {
    const history = await this.billingService.getBillingHistory(userId);
    return {
      success: true,
      data: history,
    };
  }

  // 7. Cancel Subscription Auto-Renew
  @Post('subscription/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(
    @CurrentUser('userId') userId: string,
    @Body('reason') reason?: string,
  ) {
    const result = await this.billingService.cancelSubscription(userId, reason);
    return result;
  }

  // 8. Inbound Payment Webhook (Signed by provider)
  @Post('webhook')
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    return this.billingService.handlePaymentWebhook(payload, signature);
  }

  // 9. Sandbox / Demo Simulated Payment (Instant local test verification)
  @Post('simulate-payment')
  @UseGuards(JwtAuthGuard)
  async simulatePayment(
    @CurrentUser('userId') userId: string,
    @Body('orderId') orderId: string,
  ) {
    const result = await this.billingService.simulateSandboxPayment(orderId, userId);
    return {
      success: true,
      data: result,
    };
  }

  // 10. Admin Monetization Stats
  @Get('admin/stats')
  @UseGuards(AdminGuard)
  async getMonetizationStats() {
    const stats = await this.billingService.getMonetizationStats();
    return {
      success: true,
      data: stats,
    };
  }

  // 11. Admin Manual Verification of Order
  @Post('admin/verify-order/:orderCode')
  @UseGuards(AdminGuard)
  async adminVerifyOrder(
    @Param('orderCode') orderCode: string,
    @CurrentUser('userId') adminUserId: string,
  ) {
    const result = await this.billingService.verifyAndActivateOrder(orderCode, {
      providerTransactionId: `ADMIN-MANUAL-${Date.now()}`,
      rawPayload: { verifiedByAdmin: adminUserId },
    });
    return {
      success: true,
      data: result,
    };
  }
}
