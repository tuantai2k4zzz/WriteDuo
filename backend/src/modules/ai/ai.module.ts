import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { MockAIProvider } from './providers/mock.provider';
import { TutorService } from './tutor.service';
import { TutorController } from './tutor.controller';

@Module({
  imports: [ConfigModule],
  controllers: [TutorController],
  providers: [AIService, GeminiProvider, OpenAIProvider, MockAIProvider, TutorService],
  exports: [AIService, MockAIProvider, GeminiProvider, TutorService],
})
export class AIModule {}

