import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ApprovalRequest, ApprovalRequestSchema } from '../approvals/approval-request.schema';
import { IncidentsModule } from '../incidents/incidents.module';
import { NormalizedAlertsModule } from '../normalized-alerts/normalized-alerts.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import {
  AnalystReviewController,
  ReviewApprovalController,
} from './analyst-review.controller';
import { AnalystReview, AnalystReviewSchema } from './analyst-review.schema';
import { AnalystReviewService } from './analyst-review.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnalystReview.name, schema: AnalystReviewSchema },
      { name: ApprovalRequest.name, schema: ApprovalRequestSchema },
    ]),
    RecommendationsModule,
    WorkflowsModule,
    NormalizedAlertsModule,
    IncidentsModule,
  ],
  controllers: [AnalystReviewController, ReviewApprovalController],
  providers: [AnalystReviewService],
  exports: [AnalystReviewService],
})
export class AnalystReviewModule {}
