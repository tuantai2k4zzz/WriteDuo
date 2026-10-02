import { Controller, Get } from '@nestjs/common';
import { ReviewService } from './review.service';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('smart-queue')
  async getSmartQueue() {
    const data = await this.reviewService.getSmartReviewQueue();
    return {
      success: true,
      data,
    };
  }
}
