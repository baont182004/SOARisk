import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RawAlert, RawAlertSchema } from '../alerts/raw-alert.schema';
import {
  ApprovalRequest,
  ApprovalRequestSchema,
} from '../approvals/approval-request.schema';
import { Incident, IncidentSchema } from '../incidents/incident.schema';
import {
  NormalizedAlert,
  NormalizedAlertSchema,
} from '../normalized-alerts/normalized-alert.schema';
import { Playbook, PlaybookSchema } from '../playbooks/playbook.schema';
import {
  Recommendation,
  RecommendationSchema,
} from '../recommendations/recommendation.schema';
import { Report, ReportSchema } from '../reports/report.schema';
import {
  WorkflowExecution,
  WorkflowExecutionSchema,
} from '../workflows/workflow-execution.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RawAlert.name, schema: RawAlertSchema },
      { name: NormalizedAlert.name, schema: NormalizedAlertSchema },
      { name: Playbook.name, schema: PlaybookSchema },
      { name: Recommendation.name, schema: RecommendationSchema },
      { name: ApprovalRequest.name, schema: ApprovalRequestSchema },
      { name: WorkflowExecution.name, schema: WorkflowExecutionSchema },
      { name: Incident.name, schema: IncidentSchema },
      { name: Report.name, schema: ReportSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
