import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import type { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return this.appService.getHello();
  }

  @Get(['tts', 'api/v1/tts'])
  async getTts(
    @Query('text') text: string,
    @Query('lang') lang: string,
    @Res() res: Response,
  ) {
    if (!text || !text.trim()) {
      return res.status(HttpStatus.BAD_REQUEST).send('Missing text query parameter');
    }

    const cleanText = text.trim().slice(0, 200);
    const targetLang = (lang || 'en').startsWith('vi') ? 'vi' : 'en';
    const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${targetLang}&q=${encodeURIComponent(cleanText)}`;

    try {
      const resp = await fetch(googleUrl, {
        headers: {
          Referer: 'https://translate.google.com/',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!resp.ok) {
        return res.status(resp.status).send('TTS upstream provider error');
      }

      const buffer = Buffer.from(await resp.arrayBuffer());
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(buffer);
    } catch (err: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`TTS error: ${err.message}`);
    }
  }
}

