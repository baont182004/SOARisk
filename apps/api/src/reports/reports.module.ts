import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ApprovalRequest,
  ApprovalRequestSchema,
} from '../approvals/approval-request.schema';
import {
  RecommendationExplanation,
  RecommendationExplanationSchema,
} from '../explanations/explanation.schema';
import { Incident, IncidentSchema } from '../incidents/incident.schema';
import {
  NormalizedAlert,
  NormalizedAlertSchema,
} from '../normalized-alerts/normalized-alert.schema';
import {
  Recommendation,
  RecommendationSchema,
} from '../recommendations/recommendation.schema';
import { ExecutionLog, ExecutionLogSchema } from '../workflows/execution-log.schema';
import {
  WorkflowExecution,
  WorkflowExecutionSchema,
} from '../workflows/workflow-execution.schema';
import { Report, ReportSchema } from './report.schema';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: Incident.name, schema: IncidentSchema },
      { name: NormalizedAlert.name, schema: NormalizedAlertSchema },
      { name: Recommendation.name, schema: RecommendationSchema },
      { name: RecommendationExplanation.name, schema: RecommendationExplanationSchema },
      { name: WorkflowExecution.name, schema: WorkflowExecutionSchema },
      { name: ExecutionLog.name, schema: ExecutionLogSchema },
      { name: ApprovalRequest.name, schema: ApprovalRequestSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
