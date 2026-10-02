import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  Reading,
  ReadingSchema,
  Sentence,
  SentenceSchema,
  User,
  UserSchema,
  UserProgress,
  UserProgressSchema,
  UserMistake,
  UserMistakeSchema,
  UserVocabulary,
  UserVocabularySchema,
} from './schemas';

import { AIModule } from './modules/ai/ai.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { ProgressModule } from './modules/progress/progress.module';
import { VocabularyModule } from './modules/vocabulary/vocabulary.module';
import { ReviewModule } from './modules/review/review.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://127.0.0.1:27017/study_vspeak',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Reading.name, schema: ReadingSchema },
      { name: Sentence.name, schema: SentenceSchema },
      { name: User.name, schema: UserSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
      { name: UserMistake.name, schema: UserMistakeSchema },
      { name: UserVocabulary.name, schema: UserVocabularySchema },
    ]),
    AIModule,
    LessonsModule,
    EvaluationModule,
    ProgressModule,
    VocabularyModule,
    ReviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [MongooseModule],
})
export class AppModule {}
