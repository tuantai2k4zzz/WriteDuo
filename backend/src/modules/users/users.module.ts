import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import {
  User,
  UserSchema,
  UserProgress,
  UserProgressSchema,
  UserVocabulary,
  UserVocabularySchema,
  WeakVocabulary,
  WeakVocabularySchema,
  LessonProgress,
  LessonProgressSchema,
  UserMistake,
  UserMistakeSchema,
  Reading,
  ReadingSchema,
  Sentence,
  SentenceSchema,
} from '../../schemas';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
      { name: UserVocabulary.name, schema: UserVocabularySchema },
      { name: WeakVocabulary.name, schema: WeakVocabularySchema },
      { name: LessonProgress.name, schema: LessonProgressSchema },
      { name: UserMistake.name, schema: UserMistakeSchema },
      { name: Reading.name, schema: ReadingSchema },
      { name: Sentence.name, schema: SentenceSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
