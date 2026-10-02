import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvaluationInput, EvaluationResult, IAIEvaluator } from '../ai.interface';
import { SemanticAnalyzer } from '../../evaluation/semantic-analyzer';

@Injectable()
export class GeminiProvider implements IAIEvaluator {
  public readonly name = 'GeminiProvider';
  private readonly logger = new Logger(GeminiProvider.name);
  private apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 10;
  }

  async evaluateTranslation(input: EvaluationInput): Promise<EvaluationResult> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API Key is not configured');
    }

    const isViToEn = input.mode === 'vi_to_en';

    const prompt = isViToEn
      ? `Gia sư Tuantaidz AI: Học viên làm bài dịch [VI -> EN].
- Tiếng Việt gốc: "${input.referenceTranslationVi}"
- Tiếng Anh mẫu: "${input.sentenceEn}"
- Học viên viết: "${input.userTranslationVi}"

QUY TẮC CHẤM NGỮ NGHĨA THÔNG MINH (Semantic Translation Intelligence 2.0):
1. KHÔNG bắt lỗi từ đồng nghĩa hoặc cách diễn đạt tương đương tự nhiên (ví dụ: "called" thay cho "named" là ĐÚNG 100%, ghi rõ "called ≈ named" trong ghi chú, KHÔNG trừ điểm).
2. Phân tích chính xác cụm từ sai nếu có (ví dụ "it's name" -> where: "it's name", giải thích "it's" = "it is", sửa thành "named" hoặc "called").
3. Chấm điểm đa chiều (0-100), nhận xét ngắn gọn, sư phạm, tích cực.

JSON format duy nhất:
{
  "score": 90,
  "status": "correct" | "almost_correct" | "incorrect",
  "overview": "Nhận xét tổng quan 1 câu",
  "explanation": "Giải thích ngắn gọn",
  "whatYouGotRight": ["Điểm làm tốt"],
  "specificMistakes": [
    {
      "errorType": "grammar_error" | "missing_info" | "unnatural_phrasing",
      "where": "cụm từ học viên viết chưa chuẩn (ví dụ: it's name)",
      "relatedEnglish": "từ tiếng Anh",
      "correctMeaning": "nghĩa đúng",
      "whyIncorrect": "lý do chưa chuẩn",
      "howToFix": "cách sửa chuẩn",
      "fixedSnippet": "${input.sentenceEn}"
    }
  ],
  "grammarInsight": {
    "relevantRule": "Cấu trúc thì/ngữ pháp",
    "whyThisStructure": "Lý do dùng",
    "comparisonOrContrast": "Lưu ý"
  },
  "completeSentenceMemorize": {
    "textEn": "${input.sentenceEn}",
    "translationVi": "${input.referenceTranslationVi}",
    "keyPoints": ["Ý chính cần nhớ"]
  }
}`
      : `Gia sư Tuantaidz AI: Học viên làm bài dịch [EN -> VI].
- Tiếng Anh: "${input.sentenceEn}"
- Dịch chuẩn: "${input.referenceTranslationVi}"
- Học viên dịch: "${input.userTranslationVi}"
Chấm điểm (0-100), chỉ tóm tắt các ý chính (ngắn gọn, không dài dòng).
JSON format duy nhất:
{
  "score": 85,
  "status": "correct",
  "overview": "Nhận xét 1 câu",
  "explanation": "Giải thích ngắn gọn",
  "whatYouGotRight": ["Điểm dịch tốt"],
  "specificMistakes": [],
  "grammarInsight": {
    "relevantRule": "Thì hoặc cấu trúc",
    "whyThisStructure": "Lý do dùng",
    "comparisonOrContrast": "Điểm cần nhớ"
  },
  "completeSentenceMemorize": {
    "textEn": "${input.sentenceEn}",
    "translationVi": "${input.referenceTranslationVi}",
    "keyPoints": ["Trọng tâm câu"]
  }
}`;

    // Fast Timeout Controller: Abort after 1800ms to guarantee sub-2s response
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    try {
      // Use gemini-2.5-flash
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 350,
            responseMimeType: 'application/json',
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Empty response from Gemini');
      }

      const parsed: EvaluationResult = JSON.parse(rawText);
      const semanticData = SemanticAnalyzer.analyzeTokens(input.userTranslationVi, input.sentenceEn);

      return {
        score: Math.min(Math.max(parsed.score || semanticData.scores.semanticMeaning || 0, 0), 100),
        status: parsed.status || (parsed.score >= 80 ? 'correct' : parsed.score >= 50 ? 'almost_correct' : 'incorrect'),
        semantic_similarity: parsed.semantic_similarity || (parsed.score / 100),
        overview: parsed.overview || 'Đã đánh giá câu trả lời.',
        explanation: parsed.explanation || 'Đã phân tích bản dịch.',
        whatYouGotRight: Array.isArray(parsed.whatYouGotRight) && parsed.whatYouGotRight.length > 0
          ? parsed.whatYouGotRight
          : ['Đã truyền đạt được ý nghĩa câu'],
        specificMistakes: Array.isArray(parsed.specificMistakes) && parsed.specificMistakes.length > 0
          ? parsed.specificMistakes
          : semanticData.specificMistakes,
        grammarInsight: parsed.grammarInsight || {
          relevantRule: 'Cấu trúc câu',
          whyThisStructure: 'Tuân theo cấu trúc ngữ pháp chuẩn.',
        },
        completeSentenceMemorize: parsed.completeSentenceMemorize || {
          textEn: input.sentenceEn,
          translationVi: input.referenceTranslationVi,
          keyPoints: ['Cấu trúc chuẩn'],
        },
        missing_information: Array.isArray(parsed.missing_information) ? parsed.missing_information : [],
        extra_information: Array.isArray(parsed.extra_information) ? parsed.extra_information : [],
        semanticAnalysis: parsed.semanticAnalysis || {
          overallStatus: semanticData.overallStatus,
          scores: semanticData.scores,
          tokenDiffs: semanticData.tokenDiffs,
          alternatives: semanticData.alternatives,
          missingElements: semanticData.missingElements,
          naturalnessNote: semanticData.naturalnessNote,
        },
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      this.logger.warn(`Gemini evaluation error/timeout (${err.message}). Instant fallback to MockLocalProvider.`);
      throw err;
    }
  }
}
