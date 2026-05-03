import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { createCollectionMeta, createSuccessResponse } from '../common/api-response.util';
import { createMockExecutionLog, createMockWorkflowExecution } from '../common/mock-data';
import { ExecutionLog } from './execution-log.schema';
import { WorkflowExecution } from './workflow-execution.schema';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectModel(WorkflowExecution.name)
    private readonly workflowExecutionModel: Model<WorkflowExecution>,
    @InjectModel(ExecutionLog.name)
    private readonly executionLogModel: Model<ExecutionLog>,
  ) {}

  async findAll() {
    const items = await this.workflowExecutionModel.find().sort({ startedAt: -1 }).lean().exec();

    return createSuccessResponse(
      'Workflow executions retrieved. Execution remains mock-only until analyst approval and guarded actions are implemented.',
      items,
      createCollectionMeta(items.length),
    );
  }

  async mockStart() {
    const executionPayload = createMockWorkflowExecution();
    const execution = await this.workflowExecutionModel.create(executionPayload);

    await this.executionLogModel.create(createMockExecutionLog(execution.executionId));

    return createSuccessResponse(
      'Mock workflow execution started. No real response action is performed in this phase.',
      execution.toObject(),
    );
  }
}
