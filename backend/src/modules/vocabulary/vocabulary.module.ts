import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';
import { AuthModule } from '../auth/auth.module';
import {
  UserVocabulary,
  UserVocabularySchema,
  WeakVocabulary,
  WeakVocabularySchema,
  User,
  UserSchema,
  Sentence,
  SentenceSchema,
} from '../../schemas';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: UserVocabulary.name, schema: UserVocabularySchema },
      { name: WeakVocabulary.name, schema: WeakVocabularySchema },
      { name: User.name, schema: UserSchema },
      { name: Sentence.name, schema: SentenceSchema },
    ]),
  ],
  controllers: [VocabularyController],
  providers: [VocabularyService],
  exports: [VocabularyService],
})
export class VocabularyModule {}
