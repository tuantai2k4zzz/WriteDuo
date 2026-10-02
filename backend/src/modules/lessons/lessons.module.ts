import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LessonsController, SentencesController, PronunciationController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { Reading, ReadingSchema, Sentence, SentenceSchema, UserProgress, UserProgressSchema } from '../../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reading.name, schema: ReadingSchema },
      { name: Sentence.name, schema: SentenceSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
    ]),
  ],
  controllers: [LessonsController, SentencesController, PronunciationController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
