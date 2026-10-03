import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressController, GrammarController } from './progress.controller';
import { ProgressService } from './progress.service';
import { AuthModule } from '../auth/auth.module';
import {
  UserProgress,
  UserProgressSchema,
  UserMistake,
  UserMistakeSchema,
  Reading,
  ReadingSchema,
  Sentence,
  SentenceSchema,
  LessonProgress,
  LessonProgressSchema,
} from '../../schemas';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: UserProgress.name, schema: UserProgressSchema },
      { name: UserMistake.name, schema: UserMistakeSchema },
      { name: Reading.name, schema: ReadingSchema },
      { name: Sentence.name, schema: SentenceSchema },
      { name: LessonProgress.name, schema: LessonProgressSchema },
    ]),
  ],
  controllers: [ProgressController, GrammarController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
