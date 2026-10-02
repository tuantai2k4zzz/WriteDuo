import { Body, Controller, Post } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { EvaluateAnswerDto } from './dto/evaluate-answer.dto';
import { EvaluateParagraphDto } from './dto/evaluate-paragraph.dto';

@Controller('answers')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post('evaluate')
  async evaluateAnswer(@Body() dto: EvaluateAnswerDto) {
    const result = await this.evaluationService.evaluateAnswer(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('deep-analysis')
  async getDeepAnalysis(@Body() dto: EvaluateAnswerDto) {
    const result = await this.evaluationService.getDeepAnalysis(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('evaluate-paragraph')
  async evaluateParagraph(@Body() dto: EvaluateParagraphDto) {
    const result = await this.evaluationService.evaluateParagraph(dto);
    return {
      success: true,
      data: result,
    };
  }
}
