import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { AnalystReviewService } from './analyst-review.service';
import { AnalystReviewUpdateDto } from './dto/analyst-review-update.dto';

@Controller('analyst-review')
export class AnalystReviewController {
  constructor(private readonly analystReviewService: AnalystReviewService) {}

  @Get(':recommendationId')
  findByRecommendation(@Param('recommendationId') recommendationId: string) {
    return this.analystReviewService.findByRecommendation(recommendationId);
  }

  @Post(':recommendationId/update')
  update(
    @Param('recommendationId') recommendationId: string,
    @Body() dto: AnalystReviewUpdateDto,
  ) {
    return this.analystReviewService.updateByRecommendation(recommendationId, dto);
  }

  @Post(':recommendationId/confirm')
  confirm(
    @Param('recommendationId') recommendationId: string,
    @Body() dto: AnalystReviewUpdateDto,
  ) {
    return this.analystReviewService.confirmByRecommendation(recommendationId, dto);
  }
}

@Controller('approval')
export class ReviewApprovalController {
  constructor(private readonly analystReviewService: AnalystReviewService) {}

  @Post(':reviewId/approve')
  approve(
    @Param('reviewId') reviewId: string,
    @Body() body: { decidedBy?: string; decisionReason?: string },
  ) {
    return this.analystReviewService.approve(reviewId, body);
  }

  @Post(':reviewId/reject')
  reject(
    @Param('reviewId') reviewId: string,
    @Body() body: { decidedBy?: string; decisionReason?: string },
  ) {
    return this.analystReviewService.reject(reviewId, body);
  }

  @Post(':reviewId/request-changes')
  requestChanges(
    @Param('reviewId') reviewId: string,
    @Body() body: { actor?: string; reason?: string },
  ) {
    return this.analystReviewService.requestChanges(reviewId, body);
  }
}
