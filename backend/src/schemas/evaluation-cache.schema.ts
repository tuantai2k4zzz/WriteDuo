import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EvaluationCacheDocument = EvaluationCache & Document;

@Schema({ timestamps: true })
export class EvaluationCache {
  @Prop({ required: true, unique: true, index: true })
  cacheKey: string;

  @Prop({ type: Types.ObjectId, ref: 'Sentence', required: true, index: true })
  sentenceId: Types.ObjectId;

  @Prop({ required: true, enum: ['en_to_vi', 'vi_to_en'] })
  mode: string;

  @Prop({ required: true })
  userAnswerNorm: string;

  @Prop({ required: true })
  userAnswerRaw: string;

  @Prop({ type: Object, required: true })
  evaluation: any;

  @Prop({ default: true })
  isDeepAnalysis: boolean;

  // TTL: Auto-expire cache after 60 days
  @Prop({ default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), index: { expires: '60d' } })
  expiresAt: Date;
}

export const EvaluationCacheSchema = SchemaFactory.createForClass(EvaluationCache);
