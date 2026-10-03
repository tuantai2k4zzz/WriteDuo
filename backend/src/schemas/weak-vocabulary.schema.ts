import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WeakVocabularyDocument = WeakVocabulary & Document;

@Schema({ timestamps: true })
export class WeakVocabulary {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  word: string;

  @Prop({ default: '' })
  meaningVi: string;

  @Prop({ default: '' })
  ipa: string;

  @Prop({ default: '' })
  pos: string;

  @Prop({ default: 'A1' })
  cefr: string;

  @Prop({ default: '' })
  sampleSentence: string;

  @Prop({ default: 0 })
  correctCount: number;

  @Prop({ default: 0 })
  wrongCount: number;

  @Prop({ default: 0 })
  accuracy: number; // Percentage 0 - 100

  @Prop({ default: 0 })
  mistakeCount: number;

  @Prop({ default: Date.now })
  lastReviewedAt: Date;

  @Prop({ default: Date.now, index: true })
  nextReviewAt: Date;
}

export const WeakVocabularySchema = SchemaFactory.createForClass(WeakVocabulary);
WeakVocabularySchema.index({ userId: 1, word: 1 }, { unique: true });
WeakVocabularySchema.index({ userId: 1, nextReviewAt: 1 });
