import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getProgress(@CurrentUser('userId') userId: string) {
    const data = await this.progressService.getProgress(userId);
    return {
      success: true,
      data,
    };
  }

  @Get(':lessonId')
  @UseGuards(JwtAuthGuard)
  async getLessonProgress(
    @CurrentUser('userId') userId: string,
    @Param('lessonId') lessonId: string,
  ) {
    const data = await this.progressService.getLessonProgress(userId, lessonId);
    return {
      success: true,
      data,
    };
  }

  @Post('complete')
  @UseGuards(JwtAuthGuard)
  async completeLesson(
    @CurrentUser('userId') userId: string,
    @Body('lessonId') lessonId: string,
    @Body('score') score?: number,
  ) {
    const data = await this.progressService.completeLesson(userId, lessonId, score);
    return {
      success: true,
      data,
      message: 'Chúc mừng bạn đã hoàn thành bài học!',
    };
  }

  @Post(':lessonId')
  @UseGuards(JwtAuthGuard)
  async completeLessonParam(
    @CurrentUser('userId') userId: string,
    @Param('lessonId') lessonId: string,
    @Body('score') score?: number,
  ) {
    return this.completeLesson(userId, lessonId, score);
  }
}

@Controller('grammar')
export class GrammarController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('weaknesses')
  @UseGuards(JwtAuthGuard)
  async getWeaknesses(@CurrentUser('userId') userId: string) {
    const data = await this.progressService.getGrammarWeaknesses(userId);
    return {
      success: true,
      data,
    };
  }
}
