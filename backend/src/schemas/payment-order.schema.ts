import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentOrderDocument = PaymentOrder & Document;

@Schema({ timestamps: true })
export class PaymentOrder {
  @Prop({ required: true, unique: true, index: true })
  orderCode: string; // e.g. 'WD928371'

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  planCode: string;

  @Prop({ required: true })
  amountVnd: number;

  @Prop({ default: 'VND' })
  currency: string;

  @Prop({
    required: true,
    enum: ['pending', 'completed', 'failed', 'canceled', 'expired'],
    default: 'pending',
    index: true,
  })
  status: string;

  @Prop({ default: 'vietqr', enum: ['vietqr', 'payos', 'momo', 'sandbox'] })
  provider: string;

  @Prop({ default: 'QR_TRANSFER' })
  paymentMethod: string;

  @Prop({ required: true })
  transferContent: string; // Content required in bank transfer memo, e.g. 'WD928371'

  @Prop({ default: '' })
  qrCodeUrl: string;

  @Prop({ type: Object, default: {} })
  bankInfo: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };

  @Prop({ default: null })
  paidAt?: Date;

  @Prop({ default: '' })
  providerTransactionId?: string;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;

  @Prop({ type: Object, default: {} })
  webhookPayload?: Record<string, any>;

  @Prop({ default: null })
  idempotencyKey?: string;
}

export const PaymentOrderSchema = SchemaFactory.createForClass(PaymentOrder);
PaymentOrderSchema.index({ userId: 1, createdAt: -1 });
