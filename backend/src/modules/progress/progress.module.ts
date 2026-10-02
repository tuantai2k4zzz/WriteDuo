import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressController, GrammarController } from './progress.controller';
import { ProgressService } from './progress.service';
import { UserProgress, UserProgressSchema, UserMistake, UserMistakeSchema, Reading, ReadingSchema, Sentence, SentenceSchema } from '../../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserProgress.name, schema: UserProgressSchema },
      { name: UserMistake.name, schema: UserMistakeSchema },
      { name: Reading.name, schema: ReadingSchema },
      { name: Sentence.name, schema: SentenceSchema },
    ]),
  ],
  controllers: [ProgressController, GrammarController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
