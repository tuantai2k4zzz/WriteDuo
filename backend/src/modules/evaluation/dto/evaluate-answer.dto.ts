import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class EvaluateAnswerDto {
  @IsNotEmpty()
  @IsString()
  sentenceId: string;

  @IsNotEmpty()
  @IsString()
  userAnswer: string;

  @IsOptional()
  @IsIn(['en_to_vi', 'vi_to_en'])
  mode?: 'en_to_vi' | 'vi_to_en';

  @IsOptional()
  @IsString()
  userId?: string;
}
