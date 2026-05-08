import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ApprovalRequest,
  ApprovalRequestSchema,
} from '../approvals/approval-request.schema';
import { IncidentsModule } from '../incidents/incidents.module';
import { NormalizedAlertsModule } from '../normalized-alerts/normalized-alerts.module';
import { PlaybooksModule } from '../playbooks/playbooks.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { ReportsModule } from '../reports/reports.module';
import { ExecutionLog, ExecutionLogSchema } from './execution-log.schema';
import { WorkflowExecution, WorkflowExecutionSchema } from './workflow-execution.schema';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkflowExecution.name, schema: WorkflowExecutionSchema },
      { name: ExecutionLog.name, schema: ExecutionLogSchema },
      { name: ApprovalRequest.name, schema: ApprovalRequestSchema },
    ]),
    RecommendationsModule,
    PlaybooksModule,
    NormalizedAlertsModule,
    IncidentsModule,
    ReportsModule,
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
