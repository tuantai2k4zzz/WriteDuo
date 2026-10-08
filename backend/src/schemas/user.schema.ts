import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false, default: '' })
  passwordHash: string;

  @Prop({ default: 'https://api.dicebear.com/7.x/bottts/svg?seed=DuolingoLearner' })
  avatar: string;

  @Prop({ default: 'user', enum: ['user', 'premium', 'admin'] })
  role: string;

  @Prop({ default: 0 })
  aiQueriesCount: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
