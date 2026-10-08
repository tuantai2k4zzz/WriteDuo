import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TutorChatRequest,
  TutorChatResponse,
  TutorStructuredResponse,
} from './tutor.interface';
import { buildTutorPrompt } from './prompts/tutor.prompt';
import { LocalTutorGenerator } from './providers/local-tutor-generator';

interface UsageRecord {
  count: number;
  dateString: string;
}

@Injectable()
export class TutorService {
  private readonly logger = new Logger(TutorService.name);
  private apiKey: string;
  private responseCache = new Map<string, { data: TutorStructuredResponse; timestamp: number }>();
  private usageTracker = new Map<string, UsageRecord>();

  // Max quota per day
  private readonly GUEST_LIMIT = 50;
  private readonly USER_LIMIT = 150;
  private readonly CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  private isGeminiAvailable(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 10;
  }

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private checkAndIncrementUsage(identifier: string, isAuth: boolean): { allowed: boolean; used: number; limit: number } {
    const today = this.getTodayKey();
    const limit = isAuth ? this.USER_LIMIT : this.GUEST_LIMIT;
    const record = this.usageTracker.get(identifier);

    if (!record || record.dateString !== today) {
      this.usageTracker.set(identifier, { count: 1, dateString: today });
      return { allowed: true, used: 1, limit };
    }

    if (record.count >= limit) {
      return { allowed: false, used: record.count, limit };
    }

    record.count += 1;
    return { allowed: true, used: record.count, limit };
  }

  public getQuota(identifier: string, isAuth: boolean) {
    const today = this.getTodayKey();
    const limit = isAuth ? this.USER_LIMIT : this.GUEST_LIMIT;
    const record = this.usageTracker.get(identifier);
    const used = record && record.dateString === today ? record.count : 0;
    return {
      usedToday: used,
      limitToday: limit,
      remaining: Math.max(0, limit - used),
    };
  }

  private getCacheKey(req: TutorChatRequest): string {
    const sId = req.context.sentenceId || req.context.sourceSentence || 'unknown';
    const q = req.message.trim().toLowerCase();
    const depth = req.depthMode || 'normal';
    const userAns = req.context.userAnswer ? req.context.userAnswer.trim().toLowerCase() : '';
    return `${sId}:${q}:${depth}:${userAns}`;
  }

  async askTutor(
    request: TutorChatRequest,
    userId?: string,
    clientIp: string = '127.0.0.1',
  ): Promise<TutorChatResponse> {
    const identifier = userId || clientIp;
    const isAuth = !!userId;

    // 1. Quota & Rate Limit verification
    const quotaCheck = this.checkAndIncrementUsage(identifier, isAuth);
    if (!quotaCheck.allowed) {
      return {
        success: false,
        data: {
          answer: `Bạn đã đạt giới hạn câu hỏi miễn phí trong ngày (${quotaCheck.limit} câu/ngày). Hãy quay lại vào ngày mai hoặc đăng nhập tài khoản để tiếp tục nhận hỗ trợ từ AI Tutor nhé!`,
          keyPoint: 'Đã đạt giới hạn câu hỏi trong ngày.',
          explanationType: 'general',
          followUpSuggestions: ['Xem lại các câu hỏi trước'],
        },
        quota: {
          usedToday: quotaCheck.used,
          limitToday: quotaCheck.limit,
          remaining: 0,
        },
      };
    }

    // 2. Cache inspection for ultra-low latency (<5ms)
    const cacheKey = this.getCacheKey(request);
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.logger.log(`Serving Tutor response from memory cache for key: ${cacheKey}`);
      return {
        success: true,
        data: cached.data,
        quota: this.getQuota(identifier, isAuth),
      };
    }

    // 3. If Gemini is available, attempt to query the model
    if (this.isGeminiAvailable()) {
      try {
        const responseData = await this.queryGemini(request);
        if (responseData) {
          this.responseCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
          return {
            success: true,
            data: responseData,
            quota: this.getQuota(identifier, isAuth),
          };
        }
      } catch (err: any) {
        this.logger.warn(`Gemini Tutor query failed: ${err.message}. Seamlessly falling back to LocalTutorGenerator.`);
      }
    }

    // 4. Resilient Pedagogical Fallback
    const fallbackResponse = LocalTutorGenerator.generateResponse(
      request.message,
      request.context,
      request.depthMode || 'normal',
    );

    this.responseCache.set(cacheKey, { data: fallbackResponse, timestamp: Date.now() });

    return {
      success: true,
      data: fallbackResponse,
      quota: this.getQuota(identifier, isAuth),
    };
  }

  private async queryGemini(request: TutorChatRequest): Promise<TutorStructuredResponse | null> {
    const prompt = buildTutorPrompt(
      request.message,
      request.context,
      request.conversationHistory || [],
      request.depthMode || 'normal',
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

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
              temperature: 0.2,
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
          lastError = new Error(`Model ${model} error: ${errData?.error?.message || response.statusText}`);
        }
      } catch (e) {
        lastError = e;
      }
    }

    clearTimeout(timeoutId);

    if (!rawText) {
      if (lastError) throw lastError;
      return null;
    }

    try {
      // Clean possible markdown code fences and extract main JSON object
      let cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanJson = jsonMatch[0];
      }
      const parsed: TutorStructuredResponse = JSON.parse(cleanJson);
      if (!parsed.answer) {
        return null;
      }
      return parsed;
    } catch (parseErr) {
      this.logger.warn(`Failed to parse Gemini Tutor JSON: ${rawText.slice(0, 100)}...`);
      return null;
    }
  }
}
