import { Controller, Get } from '@nestjs/common';
import { ProgressService } from './progress.service';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  async getProgress() {
    const data = await this.progressService.getProgress();
    return {
      success: true,
      data,
    };
  }
}

@Controller('grammar')
export class GrammarController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('weaknesses')
  async getWeaknesses() {
    const data = await this.progressService.getGrammarWeaknesses();
    return {
      success: true,
      data,
    };
  }
}
