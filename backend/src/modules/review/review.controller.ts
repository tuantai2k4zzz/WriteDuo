import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('smart-queue')
  @UseGuards(OptionalJwtAuthGuard)
  async getSmartQueue(@CurrentUser('userId') userId?: string) {
    const data = await this.reviewService.getSmartReviewQueue(userId);
    return {
      success: true,
      data,
    };
  }
}
