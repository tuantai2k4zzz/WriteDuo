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
  WeakVocabulary,
  WeakVocabularySchema,
  LessonProgress,
  LessonProgressSchema,
  EvaluationCache,
  EvaluationCacheSchema,
} from './schemas';

import { AIModule } from './modules/ai/ai.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { ProgressModule } from './modules/progress/progress.module';
import { VocabularyModule } from './modules/vocabulary/vocabulary.module';
import { ReviewModule } from './modules/review/review.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        if (!uri) {
          if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
            throw new Error(
              'Missing MONGODB_URI! Please configure MONGODB_URI in Vercel Project Settings > Environment Variables.',
            );
          }
          console.warn('⚠️ [MongoDB] MONGODB_URI is not set! Falling back to local mongodb://127.0.0.1:27017/study_vspeak');
          return {
            uri: 'mongodb://127.0.0.1:27017/study_vspeak',
            serverSelectionTimeoutMS: 5000,
          };
        }
        return {
          uri,
          serverSelectionTimeoutMS: 8000,
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Reading.name, schema: ReadingSchema },
      { name: Sentence.name, schema: SentenceSchema },
      { name: User.name, schema: UserSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
      { name: UserMistake.name, schema: UserMistakeSchema },
      { name: UserVocabulary.name, schema: UserVocabularySchema },
      { name: WeakVocabulary.name, schema: WeakVocabularySchema },
      { name: LessonProgress.name, schema: LessonProgressSchema },
      { name: EvaluationCache.name, schema: EvaluationCacheSchema },
    ]),
    AuthModule,
    UsersModule,
    AdminModule,
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
