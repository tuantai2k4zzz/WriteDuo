import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { MockAIProvider } from './providers/mock.provider';

@Module({
  imports: [ConfigModule],
  providers: [AIService, GeminiProvider, OpenAIProvider, MockAIProvider],
  exports: [AIService, MockAIProvider, GeminiProvider],
})
export class AIModule {}
