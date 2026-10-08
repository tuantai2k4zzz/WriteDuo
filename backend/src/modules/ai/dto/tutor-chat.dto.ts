import { IsString, IsNotEmpty, IsOptional, IsObject, IsArray, IsIn } from 'class-validator';
import type { TutorContext, TutorChatMessage } from '../tutor.interface';

export class TutorChatDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsObject()
  @IsNotEmpty()
  context: TutorContext;

  @IsArray()
  @IsOptional()
  conversationHistory?: TutorChatMessage[];

  @IsString()
  @IsOptional()
  @IsIn(['quick', 'normal', 'deep'])
  depthMode?: 'quick' | 'normal' | 'deep';
}
