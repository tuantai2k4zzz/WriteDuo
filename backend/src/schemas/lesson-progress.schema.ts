import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LessonProgressDocument = LessonProgress & Document;

@Schema({ timestamps: true })
export class LessonProgress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Reading', required: true, index: true })
  lessonId: Types.ObjectId;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ default: 0, min: 0, max: 100 })
  progress: number; // percentage (0 - 100)

  @Prop({ default: 0 })
  score: number;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: Date.now })
  lastAttemptAt: Date;

  @Prop({ type: Date, required: false })
  completedAt?: Date;
}

export const LessonProgressSchema = SchemaFactory.createForClass(LessonProgress);
LessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
