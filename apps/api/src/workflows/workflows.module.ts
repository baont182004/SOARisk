import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ExecutionLog, ExecutionLogSchema } from './execution-log.schema';
import { WorkflowExecution, WorkflowExecutionSchema } from './workflow-execution.schema';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkflowExecution.name, schema: WorkflowExecutionSchema },
      { name: ExecutionLog.name, schema: ExecutionLogSchema },
    ]),
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
