import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getLessons(
    @Query('level') level?: string,
    @CurrentUser('userId') userId?: string,
  ) {
    const lessons = await this.lessonsService.getAllLessons(level, userId);
    return {
      success: true,
      data: lessons,
      count: lessons.length,
    };
  }

  @Get(':id')
  async getLesson(@Param('id') id: string) {
    const result = await this.lessonsService.getLessonById(id);
    return {
      success: true,
      data: result,
    };
  }
}

@Controller('sentences')
export class SentencesController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get(':id')
  async getSentence(@Param('id') id: string) {
    const sentence = await this.lessonsService.getSentenceById(id);
    return {
      success: true,
      data: sentence,
    };
  }
}

@Controller('pronunciation')
export class PronunciationController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get(':sentenceId')
  async getPronunciation(@Param('sentenceId') sentenceId: string) {
    const guide = await this.lessonsService.getPronunciationGuide(sentenceId);
    return {
      success: true,
      data: guide,
    };
  }
}
