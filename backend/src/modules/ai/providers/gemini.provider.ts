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
      ? `Bạn là Chuyên gia Ngôn ngữ học Tiếng Anh và Giảng viên AI chấm bài dịch (Semantic Translation Intelligence 2.0).
Nhiệm vụ: Phân tích sâu sắc bài dịch [VI -> EN] của học viên dựa trên ngữ nghĩa và ngữ cảnh:
- Câu tiếng Việt gốc: "${input.referenceTranslationVi}"
- Câu tiếng Anh mẫu: "${input.sentenceEn}"
- Học viên viết: "${input.userTranslationVi}"

QUY TẮC CHẤM THI CỐT LÕI (SEMANTIC TRANSLATION INTELLIGENCE 2.0):
1. ĐÁNH GIÁ NGỮ NGHĨA & ĐỘ TỰ NHIÊN (Không đối chiếu máy móc):
   - Nếu học viên dùng từ đồng nghĩa, cấu trúc tương đương hoặc diễn đạt tự nhiên (ví dụ: "called" ≈ "named", "It" ≈ "He" khi nói về vật nuôi, "own" ≈ "have", "kids" ≈ "children"), HÃY XÁC NHẬN ĐÚNG (status: SEMANTICALLY_CORRECT), KHÔNG TRỪ ĐIỂM!
   - Thêm vào danh sách "alternatives" để giải thích cho học viên hiểu tại sao cách nói của họ đúng và khi nào nên dùng.
2. PHÂN TÍCH TỪNG TỪ (tokens) của học viên:
   - Tách từng từ của học viên:
     * EXACT_CORRECT: Khớp chuẩn xác với câu mẫu.
     * SEMANTICALLY_CORRECT: Khác từ trong mẫu nhưng đúng nghĩa và tự nhiên (ví dụ It ≈ He, called ≈ named).
     * PARTIALLY_CORRECT: Gần đúng nhưng hơi dư/lặp từ hoặc chưa tự nhiên (ví dụ thừa 'it' trong 'and it has').
     * INCORRECT: Sai ngữ pháp hoặc sai nghĩa thực sự.
3. CHỈ RÕ LỖI SAI CỤ THỂ (specificMistakes):
   - "where": TRÍCH ĐÚNG từ/cụm từ học viên viết sai trong câu (Ví dụ: "and it has", "dog Max", "boughted"). TUYỆT ĐỐI KHÔNG bịa đặt hoặc lấy câu khác!
   - "relatedEnglish": Từ/cụm từ tiếng Anh chuẩn tương ứng.
   - "whyIncorrect": Giải thích sư phạm ngắn gọn, dễ hiểu tại sao chưa chuẩn.
   - "howToFix": Hướng dẫn sửa cụ thể.
   - "fixedSnippet": Câu hoặc cụm câu chuẩn.
   - Nếu học viên không có lỗi sai nghiêm trọng (câu hoàn toàn đúng hoặc chỉ là diễn đạt tương đương), để "specificMistakes": [].
4. CHẤM ĐIỂM ĐA CHIỀU (0-100):
   - semanticMeaning (0-100)
   - grammarAccuracy (0-100)
   - naturalness (0-100)
   - completeness (0-100)

Trả về DUY NHẤT một JSON hợp lệ:
{
  "score": 90,
  "status": "correct" | "almost_correct" | "incorrect",
  "overview": "Nhận xét tổng quan 1 câu",
  "explanation": "Lời khuyên sư phạm ngắn gọn",
  "whatYouGotRight": ["Điểm học viên làm tốt"],
  "scores": {
    "semanticMeaning": 95,
    "grammarAccuracy": 90,
    "wordAccuracy": 90,
    "naturalness": 90,
    "completeness": 95
  },
  "tokens": [
    {
      "learner": "từ",
      "reference": "từ_mẫu",
      "status": "EXACT_CORRECT" | "SEMANTICALLY_CORRECT" | "PARTIALLY_CORRECT" | "INCORRECT",
      "explanation": "ghi chú",
      "alternativeTo": "từ_mẫu",
      "relation": "từ ≈ từ_mẫu"
    }
  ],
  "alternatives": [
    {
      "learnerExpression": "từ của học viên",
      "referenceExpression": "từ trong mẫu",
      "relationship": "A ≈ B",
      "noteVi": "Giải thích ngữ cảnh",
      "contextDifference": "Sắc thái khác biệt"
    }
  ],
  "specificMistakes": [
    {
      "errorType": "grammar_error" | "missing_info" | "unnatural_phrasing",
      "where": "từ/cụm học viên viết",
      "relatedEnglish": "từ chuẩn",
      "correctMeaning": "nghĩa chuẩn",
      "whyIncorrect": "lý do",
      "howToFix": "cách sửa",
      "fixedSnippet": "${input.sentenceEn}"
    }
  ],
  "grammarInsight": {
    "relevantRule": "Tên quy tắc ngữ pháp trọng tâm",
    "whyThisStructure": "Tại sao dùng cấu trúc này trong câu",
    "comparisonOrContrast": "Lưu ý quan trọng"
  },
  "completeSentenceMemorize": {
    "textEn": "${input.sentenceEn}",
    "translationVi": "${input.referenceTranslationVi}",
    "keyPoints": ["Điểm cốt lõi cần nhớ"]
  }
}`
      : `Bạn là Chuyên gia Ngôn ngữ học và Giảng viên AI chấm bài dịch [EN -> VI] (Semantic Translation Intelligence 2.0).
- Tiếng Anh: "${input.sentenceEn}"
- Dịch chuẩn: "${input.referenceTranslationVi}"
- Học viên dịch: "${input.userTranslationVi}"

Chấm điểm công tâm, tôn trọng các cách dịch thoáng, tự nhiên và chuẩn văn phong tiếng Việt.
Trả về DUY NHẤT một JSON hợp lệ:
{
  "score": 88,
  "status": "correct" | "almost_correct" | "incorrect",
  "overview": "Nhận xét tổng quan",
  "explanation": "Giải thích ngắn gọn",
  "whatYouGotRight": ["Điểm dịch tốt"],
  "scores": {
    "semanticMeaning": 90,
    "grammarAccuracy": 90,
    "wordAccuracy": 85,
    "naturalness": 90,
    "completeness": 90
  },
  "tokens": [
    {
      "learner": "từ",
      "status": "EXACT_CORRECT" | "SEMANTICALLY_CORRECT" | "PARTIALLY_CORRECT" | "INCORRECT",
      "explanation": "ghi chú"
    }
  ],
  "alternatives": [],
  "specificMistakes": [],
  "grammarInsight": {
    "relevantRule": "Cấu trúc câu",
    "whyThisStructure": "Lý do dùng",
    "comparisonOrContrast": "Điểm cần nhớ"
  },
  "completeSentenceMemorize": {
    "textEn": "${input.sentenceEn}",
    "translationVi": "${input.referenceTranslationVi}",
    "keyPoints": ["Trọng tâm câu"]
  }
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7500);

    try {
      // Primary: gemini-flash-lite-latest (fastest & high quota), secondary: gemini-flash-latest
      const models = ['gemini-flash-lite-latest', 'gemini-flash-latest'];
      let rawText = '';
      let lastError: any = null;

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json',
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) break;
          } else {
            const errData = await response.json().catch(() => ({}));
            lastError = new Error(`Model ${model} failed: ${errData?.error?.message || response.statusText}`);
          }
        } catch (e: any) {
          lastError = e;
        }
      }

      clearTimeout(timeoutId);

      if (!rawText) {
        throw lastError || new Error('Empty response from Gemini');
      }

      const parsed: any = JSON.parse(rawText);
      const fallbackAnalysis = SemanticAnalyzer.analyzeTokens(input.userTranslationVi, input.sentenceEn);

      // Map AI tokens directly into SemanticTokenDiff format
      const tokenDiffs = Array.isArray(parsed.tokens) && parsed.tokens.length > 0
        ? parsed.tokens.map((t: any) => ({
            learnerToken: t.learner || t.learnerToken || '',
            referenceToken: t.reference || t.referenceToken,
            status: t.status || 'EXACT_CORRECT',
            explanation: t.explanation,
            alternativeTo: t.alternativeTo,
            relation: t.relation,
          }))
        : fallbackAnalysis.tokenDiffs;

      const alternatives = Array.isArray(parsed.alternatives) && parsed.alternatives.length > 0
        ? parsed.alternatives
        : fallbackAnalysis.alternatives;

      const scores = parsed.scores || fallbackAnalysis.scores;
      const overallStatus =
        parsed.status === 'correct' && alternatives.length > 0 && (!parsed.specificMistakes || parsed.specificMistakes.length === 0)
          ? 'SEMANTICALLY_CORRECT'
          : parsed.status === 'correct'
          ? 'EXACT_MATCH'
          : parsed.status === 'almost_correct'
          ? 'PARTIALLY_CORRECT'
          : 'NEEDS_CORRECTION';

      return {
        score: Math.min(Math.max(parsed.score || scores.semanticMeaning || 0, 0), 100),
        status: parsed.status || (parsed.score >= 80 ? 'correct' : parsed.score >= 50 ? 'almost_correct' : 'incorrect'),
        semantic_similarity: parsed.semantic_similarity || Number(((parsed.score || 80) / 100).toFixed(2)),
        overview: parsed.overview || 'Đã phân tích bản dịch.',
        explanation: parsed.explanation || 'Phân tích ngữ nghĩa thông minh hoàn tất.',
        whatYouGotRight: Array.isArray(parsed.whatYouGotRight) && parsed.whatYouGotRight.length > 0
          ? parsed.whatYouGotRight
          : ['Đã truyền đạt được ý nghĩa câu'],
        specificMistakes: Array.isArray(parsed.specificMistakes)
          ? parsed.specificMistakes
          : fallbackAnalysis.specificMistakes,
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
        semanticAnalysis: {
          overallStatus,
          scores,
          tokenDiffs,
          alternatives,
          missingElements: fallbackAnalysis.missingElements,
          naturalnessNote: parsed.explanation,
        },
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      this.logger.warn(`Gemini evaluation error/timeout (${err.message}). Instant fallback to MockLocalProvider.`);
      throw err;
    }
  }
}
