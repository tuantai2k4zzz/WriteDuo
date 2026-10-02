import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvaluationInput, EvaluationResult, IAIEvaluator } from '../ai.interface';

@Injectable()
export class OpenAIProvider implements IAIEvaluator {
  public readonly name = 'OpenAIProvider';
  private readonly logger = new Logger(OpenAIProvider.name);
  private apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 10;
  }

  async evaluateTranslation(input: EvaluationInput): Promise<EvaluationResult> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API Key is not configured');
    }

    const systemPrompt = `Bạn là gia sư tiếng Anh 1-kèm-1. Đánh giá câu dịch tiếng Việt của học viên so với câu tiếng Anh và bản dịch chuẩn.
Trả về JSON gồm:
- score: number (0-100)
- status: "correct" | "almost_correct" | "missing_info" | "partially_incorrect" | "incorrect"
- semantic_similarity: number (0-1)
- overview: string (1 câu tổng quan sư phạm)
- explanation: string (lời nhận xét ngắn gọn)
- whatYouGotRight: string[] (những điểm đã hiểu đúng)
- specificMistakes: [{ errorType, where, relatedEnglish, correctMeaning, whyIncorrect, howToFix, fixedSnippet }]
- grammarInsight: { relevantRule, whyThisStructure, comparisonOrContrast }
- completeSentenceMemorize: { textEn, translationVi, keyPoints: string[] }
- missing_information: string[]
- extra_information: string[]`;

    const userPrompt = `Câu tiếng Anh: "${input.sentenceEn}"
Bản dịch chuẩn: "${input.referenceTranslationVi}"
Câu học viên: "${input.userTranslationVi}"
Các cách dịch khác: ${JSON.stringify(input.alternativeTranslations || [])}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      return JSON.parse(content);
    } catch (err: any) {
      this.logger.error(`OpenAI evaluation failed: ${err.message}`);
      throw err;
    }
  }
}
