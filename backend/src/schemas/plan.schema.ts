import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlanDocument = Plan & Document;

@Schema({ timestamps: true })
export class Plan {
  @Prop({ required: true, unique: true, index: true })
  code: string; // 'free' | 'pro_monthly' | 'pro_annual' | 'credit_boost_100'

  @Prop({ required: true })
  name: string; // 'Gói Học Thử Miễn Phí', 'Pro Hàng Tháng', 'Pro Trọn Năm'

  @Prop({ required: true, default: 0 })
  priceVnd: number; // 0, 99000, 699000

  @Prop({ default: 0 })
  originalPriceVnd: number; // e.g. 1188000 (shows genuine yearly savings of 41%)

  @Prop({ required: true, enum: ['monthly', 'annual', 'one_time', 'free'], default: 'monthly' })
  billingCycle: string;

  @Prop({ required: true, default: 10 })
  dailyAiLimit: number; // Free: 10 queries, Pro: 100 queries/day

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ default: false })
  isPopular: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  order: number;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
