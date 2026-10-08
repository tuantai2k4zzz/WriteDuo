import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../schemas';
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

  private readonly STANDARD_USER_LIMIT = 50; // User thường chỉ được 50 câu/ngày
  private readonly CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

  constructor(
    private configService: ConfigService,
    @Optional() @InjectModel(User.name) private userModel?: Model<UserDocument>,
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  private isGeminiAvailable(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 10;
  }

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private async checkAndIncrementUsage(userId?: string): Promise<{
    allowed: boolean;
    requiresAuth?: boolean;
    used: number;
    limit: number;
    isUnlimited: boolean;
    role: string;
  }> {
    // 1. Phải đăng nhập mới được hỏi AI!
    if (!userId) {
      return {
        allowed: false,
        requiresAuth: true,
        used: 0,
        limit: 0,
        isUnlimited: false,
        role: 'guest',
      };
    }

    let role = 'user';
    if (this.userModel && Types.ObjectId.isValid(userId)) {
      try {
        const user = await this.userModel.findById(userId).select('role').lean();
        if (user && user.role) {
          role = user.role;
        }
      } catch {}
    }

    const today = this.getTodayKey();
    const isUnlimited = role === 'premium' || role === 'admin';
    const limit = isUnlimited ? 999999 : this.STANDARD_USER_LIMIT;

    const record = this.usageTracker.get(userId);
    let usedToday = 1;

    if (!record || record.dateString !== today) {
      this.usageTracker.set(userId, { count: 1, dateString: today });
      usedToday = 1;
    } else {
      if (!isUnlimited && record.count >= limit) {
        return {
          allowed: false,
          requiresAuth: false,
          used: record.count,
          limit,
          isUnlimited,
          role,
        };
      }
      record.count += 1;
      usedToday = record.count;
    }

    // Increment overall database usage counter asynchronously
    if (this.userModel && Types.ObjectId.isValid(userId)) {
      this.userModel.findByIdAndUpdate(userId, { $inc: { aiQueriesCount: 1 } }).catch(() => {});
    }

    return {
      allowed: true,
      requiresAuth: false,
      used: usedToday,
      limit,
      isUnlimited,
      role,
    };
  }

  public async getQuota(userId?: string) {
    if (!userId) {
      return {
        usedToday: 0,
        limitToday: 0,
        remaining: 0,
        isUnlimited: false,
        requiresAuth: true,
        role: 'guest',
      };
    }

    let role = 'user';
    if (this.userModel && Types.ObjectId.isValid(userId)) {
      try {
        const user = await this.userModel.findById(userId).select('role').lean();
        if (user && user.role) {
          role = user.role;
        }
      } catch {}
    }

    const today = this.getTodayKey();
    const isUnlimited = role === 'premium' || role === 'admin';
    const limit = isUnlimited ? 999999 : this.STANDARD_USER_LIMIT;

    const record = this.usageTracker.get(userId);
    const used = record && record.dateString === today ? record.count : 0;

    return {
      usedToday: used,
      limitToday: limit,
      remaining: isUnlimited ? 999999 : Math.max(0, limit - used),
      isUnlimited,
      requiresAuth: false,
      role,
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
    const effectiveUserId = userId || request.context?.userId;

    // 1. Quota & Authentication verification
    const quotaCheck = await this.checkAndIncrementUsage(effectiveUserId);

    if (quotaCheck.requiresAuth) {
      return {
        success: false,
        requiresAuth: true,
        data: {
          answer: '🔒 **Bạn cần đăng nhập tài khoản để sử dụng Gia Sư AI.**\nVui lòng đăng nhập hoặc tạo tài khoản để nhận hỗ trợ giải thích ngữ pháp, từ vựng và chấm câu bài học nhé!',
          keyPoint: 'Vui lòng đăng nhập để dùng Gia Sư AI.',
          explanationType: 'general',
          followUpSuggestions: ['Đăng nhập tài khoản'],
        },
        quota: {
          usedToday: 0,
          limitToday: 0,
          remaining: 0,
          isUnlimited: false,
          requiresAuth: true,
          role: 'guest',
        },
      };
    }

    if (!quotaCheck.allowed) {
      return {
        success: false,
        data: {
          answer: `⚠️ **Bạn đã sử dụng hết hạn mức ${quotaCheck.limit} câu hỏi AI hôm nay.**\nHãy quay lại vào ngày mai hoặc liên hệ Admin để nâng cấp lên tài khoản **Premium** sử dụng AI không giới hạn nhé!`,
          keyPoint: `Đã đạt giới hạn ${quotaCheck.limit} câu hỏi hôm nay.`,
          explanationType: 'general',
          followUpSuggestions: ['Xem lại các câu hỏi trước'],
        },
        quota: {
          usedToday: quotaCheck.used,
          limitToday: quotaCheck.limit,
          remaining: 0,
          isUnlimited: false,
          role: quotaCheck.role,
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
        quota: await this.getQuota(effectiveUserId),
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
            quota: await this.getQuota(effectiveUserId),
          };
        }
      } catch (err: any) {
        this.logger.warn(`Gemini Tutor query failed: ${err.message}. Seamlessly falling back to LocalTutorGenerator.`);
      }
    }

    // 4. Local Generator Fallback
    const fallbackData = LocalTutorGenerator.generateResponse(
      request.message,
      request.context,
      request.depthMode || 'normal',
    );
    this.responseCache.set(cacheKey, { data: fallbackData, timestamp: Date.now() });
    return {
      success: true,
      data: fallbackData,
      quota: await this.getQuota(effectiveUserId),
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
