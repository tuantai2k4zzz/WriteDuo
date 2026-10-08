import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { TutorService } from './tutor.service';
import { TutorChatDto } from './dto/tutor-chat.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('ai/tutor')
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  @Post('chat')
  @UseGuards(OptionalJwtAuthGuard)
  async chat(
    @Body() dto: TutorChatDto,
    @CurrentUser('userId') userId?: string,
    @Req() req?: Request,
  ) {
    const clientIp =
      (req?.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      '127.0.0.1';

    const result = await this.tutorService.askTutor(dto, userId, clientIp);
    return {
      success: result.success,
      data: result.data,
      quota: result.quota,
    };
  }

  @Get('quota')
  @UseGuards(OptionalJwtAuthGuard)
  async getQuota(
    @CurrentUser('userId') userId?: string,
    @Req() req?: Request,
  ) {
    const clientIp =
      (req?.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      '127.0.0.1';

    const identifier = userId || clientIp;
    const isAuth = !!userId;
    const quota = this.tutorService.getQuota(identifier, isAuth);

    return {
      success: true,
      data: quota,
    };
  }

  @Post('stream')
  @UseGuards(OptionalJwtAuthGuard)
  async streamChat(
    @Body() dto: TutorChatDto,
    @Res() res: Response,
    @CurrentUser('userId') userId?: string,
    @Req() req?: Request,
  ) {
    const clientIp =
      (req?.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      '127.0.0.1';

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const result = await this.tutorService.askTutor(dto, userId, clientIp);

      if (!result.success) {
        res.write(`event: error\ndata: ${JSON.stringify(result.data)}\n\n`);
        res.end();
        return;
      }

      // Stream the main answer in natural visual chunks for typing effect
      const answerText = result.data.answer || '';
      const chunkSize = 28; // Words or chars per burst
      for (let i = 0; i < answerText.length; i += chunkSize) {
        const textSlice = answerText.slice(i, i + chunkSize);
        res.write(`event: chunk\ndata: ${JSON.stringify({ text: textSlice })}\n\n`);
        // Small delay between chunks for smooth streaming feel
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      // Send the complete structured payload at the end
      res.write(`event: complete\ndata: ${JSON.stringify({ data: result.data, quota: result.quota })}\n\n`);
      res.write('event: done\ndata: [DONE]\n\n');
      res.end();
    } catch (err: any) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
      res.end();
    }
  }
}
