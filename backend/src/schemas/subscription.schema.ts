import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: 'pro_monthly' })
  planCode: string; // 'pro_monthly' | 'pro_annual'

  @Prop({
    required: true,
    enum: ['active', 'canceled', 'expired', 'past_due'],
    default: 'active',
    index: true,
  })
  status: string;

  @Prop({ required: true, default: Date.now })
  startDate: Date;

  @Prop({ required: true })
  currentPeriodEnd: Date;

  @Prop({ default: true })
  autoRenew: boolean;

  @Prop({ type: Types.ObjectId, ref: 'PaymentOrder' })
  lastPaymentOrderId?: Types.ObjectId;

  @Prop({ default: null })
  canceledAt?: Date;

  @Prop({ default: '' })
  cancellationReason?: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
SubscriptionSchema.index({ userId: 1, status: 1 });
