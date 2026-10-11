import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AIUsageLogDocument = AIUsageLog & Document;

@Schema({ timestamps: true })
export class AIUsageLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['tutor_chat', 'paragraph_evaluation', 'sentence_eval', 'deep_analysis', 'roleplay', 'vocab_lookup'],
  })
  operation: string;

  @Prop({ default: 0 })
  tokenCount: number;

  @Prop({ default: 0 })
  costEstimateVnd: number; // In VND (e.g. 50 VND / Gemini Flash call)

  @Prop({ required: true, index: true })
  dateKey: string; // 'YYYY-MM-DD' for daily grouping

  @Prop({ default: 'free' })
  planAtTime: string;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;
}

export const AIUsageLogSchema = SchemaFactory.createForClass(AIUsageLog);
AIUsageLogSchema.index({ userId: 1, dateKey: 1 });
