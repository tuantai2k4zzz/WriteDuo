import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserVocabularyDocument = UserVocabulary & Document;

@Schema({ timestamps: true })
export class UserVocabulary {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  word: string;

  @Prop({ default: '' })
  meaningVi: string;

  @Prop({ default: '' })
  pos: string;

  @Prop({ default: '' })
  ipa: string;

  @Prop({ default: 'A1' })
  cefr: string;

  @Prop({ default: '' })
  exampleEn: string;

  @Prop({ default: '' })
  exampleVi: string;

  @Prop({ default: false })
  isFavorite: boolean;

  @Prop({ default: 1 })
  intervalDays: number;

  @Prop({ default: 0 })
  repetitionCount: number;

  @Prop({ default: Date.now, index: true })
  nextReviewAt: Date;
}

export const UserVocabularySchema = SchemaFactory.createForClass(UserVocabulary);
UserVocabularySchema.index({ userId: 1, word: 1 }, { unique: true });
