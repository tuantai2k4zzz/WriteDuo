import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SaveVocabDto {
  @IsNotEmpty()
  @IsString()
  word: string;

  @IsOptional()
  @IsString()
  meaningVi?: string;

  @IsOptional()
  @IsString()
  pos?: string;

  @IsOptional()
  @IsString()
  ipa?: string;

  @IsOptional()
  @IsString()
  cefr?: string;

  @IsOptional()
  @IsString()
  exampleEn?: string;

  @IsOptional()
  @IsString()
  exampleVi?: string;
}
