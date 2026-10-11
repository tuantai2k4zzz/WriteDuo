import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Plan,
  PlanSchema,
  Subscription,
  SubscriptionSchema,
  PaymentOrder,
  PaymentOrderSchema,
  AIUsageLog,
  AIUsageLogSchema,
  User,
  UserSchema,
} from '../../schemas';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { EntitlementService } from './entitlement.service';
import { VietQRPayOSProvider } from './providers/vietqr-payos.provider';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Plan.name, schema: PlanSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: PaymentOrder.name, schema: PaymentOrderSchema },
      { name: AIUsageLog.name, schema: AIUsageLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BillingController],
  providers: [
    BillingService,
    EntitlementService,
    VietQRPayOSProvider,
  ],
  exports: [BillingService, EntitlementService],
})
export class BillingModule {}
