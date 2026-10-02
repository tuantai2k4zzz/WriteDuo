import { Injectable, Logger } from '@nestjs/common';
import { EvaluationInput, EvaluationResult, IAIEvaluator } from './ai.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { MockAIProvider } from './providers/mock.provider';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(
    private readonly geminiProvider: GeminiProvider,
    private readonly openAIProvider: OpenAIProvider,
    private readonly mockProvider: MockAIProvider,
  ) {}

  getActiveProvider(): IAIEvaluator {
    if (this.geminiProvider.isAvailable()) {
      return this.geminiProvider;
    }
    if (this.openAIProvider.isAvailable()) {
      return this.openAIProvider;
    }
    return this.mockProvider;
  }

  async evaluateTranslation(input: EvaluationInput): Promise<EvaluationResult> {
    const primary = this.getActiveProvider();
    this.logger.log(`Evaluating using primary provider: ${primary.name}`);

    try {
      return await primary.evaluateTranslation(input);
    } catch (err: any) {
      this.logger.warn(`Primary provider ${primary.name} failed: ${err.message}. Falling back to MockLocalProvider.`);
      return await this.mockProvider.evaluateTranslation(input);
    }
  }
}
