import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';
import {
  UserVocabulary,
  UserVocabularySchema,
  User,
  UserSchema,
  Sentence,
  SentenceSchema,
} from '../../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserVocabulary.name, schema: UserVocabularySchema },
      { name: User.name, schema: UserSchema },
      { name: Sentence.name, schema: SentenceSchema },
    ]),
  ],
  controllers: [VocabularyController],
  providers: [VocabularyService],
  exports: [VocabularyService],
})
export class VocabularyModule {}
