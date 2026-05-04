import {
  QUEUE_NAMES,
  START_WORKFLOW_JOB_NAME,
  type StartWorkflowJobData,
} from '@soc-soar/shared';
import { Worker } from 'bullmq';

import { queueConnection } from '../queues';

export function createWorkflowExecutionWorker() {
  return new Worker<
    StartWorkflowJobData,
    { status: 'placeholder' },
    typeof START_WORKFLOW_JOB_NAME
  >(
    QUEUE_NAMES.WORKFLOW_EXECUTION,
    async (job) => {
      console.log(
        `[workflow-execution-queue] placeholder processing job ${job.id} for executionId=${job.data.executionId ?? 'unknown'}`,
      );
      return {
        status: 'placeholder',
        message:
          'Workflow execution remains mock-only until analyst approval and guarded actions are defined.',
      };
    },
    { connection: queueConnection },
  );
}
