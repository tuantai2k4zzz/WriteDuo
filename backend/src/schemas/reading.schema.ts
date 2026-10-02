import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReadingDocument = Reading & Document;

@Schema({ timestamps: true })
export class Reading {
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  topic: string;

  @Prop({ required: true, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'IELTS', 'TOEIC'] })
  level: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  wordCount: number;

  @Prop({ required: true })
  totalSentences: number;

  @Prop({ type: [String], default: [] })
  paragraphs: string[];

  @Prop({ required: true, default: 1 })
  order: number;

  @Prop({ default: true })
  isPublished: boolean;
}

export const ReadingSchema = SchemaFactory.createForClass(Reading);
ReadingSchema.index({ level: 1, order: 1 });
