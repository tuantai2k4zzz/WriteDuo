import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { AIModule } from '../ai/ai.module';
import { Sentence, SentenceSchema, Reading, ReadingSchema, UserProgress, UserProgressSchema, UserMistake, UserMistakeSchema, EvaluationCache, EvaluationCacheSchema } from '../../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sentence.name, schema: SentenceSchema },
      { name: Reading.name, schema: ReadingSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
      { name: UserMistake.name, schema: UserMistakeSchema },
      { name: EvaluationCache.name, schema: EvaluationCacheSchema },
    ]),
    AIModule,
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
