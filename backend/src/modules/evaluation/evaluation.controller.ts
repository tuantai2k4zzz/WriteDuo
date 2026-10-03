import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { EvaluateAnswerDto } from './dto/evaluate-answer.dto';
import { EvaluateParagraphDto } from './dto/evaluate-paragraph.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('answers')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post('evaluate')
  @UseGuards(OptionalJwtAuthGuard)
  async evaluateAnswer(
    @Body() dto: EvaluateAnswerDto,
    @CurrentUser('userId') userId?: string,
  ) {
    const result = await this.evaluationService.evaluateAnswer(dto, userId);
    return {
      success: true,
      data: result,
    };
  }

  @Post('deep-analysis')
  @UseGuards(OptionalJwtAuthGuard)
  async getDeepAnalysis(@Body() dto: EvaluateAnswerDto) {
    const result = await this.evaluationService.getDeepAnalysis(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('evaluate-paragraph')
  @UseGuards(OptionalJwtAuthGuard)
  async evaluateParagraph(
    @Body() dto: EvaluateParagraphDto,
    @CurrentUser('userId') userId?: string,
  ) {
    const result = await this.evaluationService.evaluateParagraph(dto, userId);
    return {
      success: true,
      data: result,
    };
  }
}
