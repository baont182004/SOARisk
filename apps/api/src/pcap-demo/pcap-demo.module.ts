import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AlertsModule } from '../alerts/alerts.module';
import { AnalystReviewModule } from '../analyst-review/analyst-review.module';
import { ApprovalRequest, ApprovalRequestSchema } from '../approvals/approval-request.schema';
import { ExplanationsModule } from '../explanations/explanations.module';
import {
  RecommendationExplanation,
  RecommendationExplanationSchema,
} from '../explanations/explanation.schema';
import { Incident, IncidentSchema } from '../incidents/incident.schema';
import {
  NormalizedAlert,
  NormalizedAlertSchema,
} from '../normalized-alerts/normalized-alert.schema';
import { NormalizedAlertsModule } from '../normalized-alerts/normalized-alerts.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { Recommendation, RecommendationSchema } from '../recommendations/recommendation.schema';
import { Report, ReportSchema } from '../reports/report.schema';
import {
  WorkflowExecution,
  WorkflowExecutionSchema,
} from '../workflows/workflow-execution.schema';
import { PcapController, PcapDemoController } from './pcap-demo.controller';
import { PcapDemoService } from './pcap-demo.service';
import { PcapFile, PcapFileSchema } from './pcap-file.schema';
import { PcapJob, PcapJobSchema } from './pcap-job.schema';

@Module({
  imports: [
    AlertsModule,
    AnalystReviewModule,
    NormalizedAlertsModule,
    RecommendationsModule,
    ExplanationsModule,
    MongooseModule.forFeature([
      { name: PcapFile.name, schema: PcapFileSchema },
      { name: PcapJob.name, schema: PcapJobSchema },
      { name: ApprovalRequest.name, schema: ApprovalRequestSchema },
      { name: WorkflowExecution.name, schema: WorkflowExecutionSchema },
      { name: Incident.name, schema: IncidentSchema },
      { name: Report.name, schema: ReportSchema },
      { name: NormalizedAlert.name, schema: NormalizedAlertSchema },
      { name: Recommendation.name, schema: RecommendationSchema },
      { name: RecommendationExplanation.name, schema: RecommendationExplanationSchema },
    ]),
  ],
  controllers: [PcapController, PcapDemoController],
  providers: [PcapDemoService],
  exports: [PcapDemoService],
})
export class PcapDemoModule {}
