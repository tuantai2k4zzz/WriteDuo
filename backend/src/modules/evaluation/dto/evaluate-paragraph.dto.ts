import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class EvaluateParagraphDto {
  @IsNotEmpty()
  @IsString()
  lessonId: string;

  @IsNotEmpty()
  @IsString()
  userParagraph: string;

  @IsOptional()
  @IsIn(['en_to_vi', 'vi_to_en'])
  mode?: 'en_to_vi' | 'vi_to_en';

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  fullEn?: string;

  @IsOptional()
  @IsString()
  fullVi?: string;

  @IsOptional()
  sentences?: Array<{
    _id?: string;
    textEn: string;
    primaryTranslationVi: string;
    alternativeTranslations?: string[];
  }>;
}
