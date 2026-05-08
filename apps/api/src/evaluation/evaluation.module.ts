import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RawAlert, RawAlertSchema } from '../alerts/raw-alert.schema';
import { Incident, IncidentSchema } from '../incidents/incident.schema';
import {
  NormalizedAlert,
  NormalizedAlertSchema,
} from '../normalized-alerts/normalized-alert.schema';
import { PlaybooksModule } from '../playbooks/playbooks.module';
import {
  WorkflowExecution,
  WorkflowExecutionSchema,
} from '../workflows/workflow-execution.schema';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';

@Module({
  imports: [
    PlaybooksModule,
    MongooseModule.forFeature([
      { name: RawAlert.name, schema: RawAlertSchema },
      { name: NormalizedAlert.name, schema: NormalizedAlertSchema },
      { name: WorkflowExecution.name, schema: WorkflowExecutionSchema },
      { name: Incident.name, schema: IncidentSchema },
    ]),
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService],
})
export class EvaluationModule {}
