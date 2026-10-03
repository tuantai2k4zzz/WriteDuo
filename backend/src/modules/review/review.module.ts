import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { AuthModule } from '../auth/auth.module';
import { UserMistake, UserMistakeSchema, Sentence, SentenceSchema, UserProgress, UserProgressSchema } from '../../schemas';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: UserMistake.name, schema: UserMistakeSchema },
      { name: Sentence.name, schema: SentenceSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
    ]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
