import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserProgressDocument = UserProgress & Document;

@Schema({ timestamps: true })
export class UserProgress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: 0 })
  xp: number;

  @Prop({ default: 0 })
  streakCount: number;

  @Prop({ default: Date.now })
  lastActiveDate: Date;

  @Prop({ default: 5, min: 0, max: 5 })
  hearts: number;

  @Prop({ default: Date.now })
  lastHeartRefill: Date;

  @Prop({ default: 'A1' })
  currentLevel: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Reading' }], default: [] })
  completedReadings: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Sentence' }], default: [] })
  completedSentences: Types.ObjectId[];

  @Prop({ default: 50 })
  dailyGoalXp: number;

  @Prop({ default: 0 })
  todayXp: number;
}

export const UserProgressSchema = SchemaFactory.createForClass(UserProgress);
UserProgressSchema.index({ userId: 1 }, { unique: true });
