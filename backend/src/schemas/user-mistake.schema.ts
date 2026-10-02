import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserMistakeDocument = UserMistake & Document;

@Schema({ timestamps: true })
export class UserMistake {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Sentence', required: true })
  sentenceId: Types.ObjectId;

  @Prop({ required: true, enum: ['grammar', 'vocabulary', 'pronunciation', 'translation_miss'], index: true })
  category: string;

  @Prop({ required: true, index: true })
  tag: string; // e.g. "Present Perfect", "preposition_for", "/θ/"

  @Prop({ default: '' })
  userAnswer: string;

  @Prop({ default: '' })
  expectedAnswer: string;

  @Prop({ default: '' })
  explanation: string;

  @Prop({ default: 1 })
  errorCount: number;

  @Prop({ default: 0, min: 0, max: 100 })
  masteryScore: number;

  @Prop({ default: Date.now, index: true })
  nextReviewAt: Date;
}

export const UserMistakeSchema = SchemaFactory.createForClass(UserMistake);
UserMistakeSchema.index({ userId: 1, tag: 1 });
UserMistakeSchema.index({ userId: 1, nextReviewAt: 1 });
