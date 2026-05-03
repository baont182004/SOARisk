import { QUEUE_NAMES } from '@soc-soar/shared';
import { Worker } from 'bullmq';

import { queueConnection } from '../queues';

export function createWorkflowExecutionWorker() {
  return new Worker(
    QUEUE_NAMES.WORKFLOW_EXECUTION,
    async (job) => {
      console.log(`[workflow-execution-queue] placeholder processing job ${job.id}`);
      return {
        status: 'placeholder',
        message:
          'Workflow execution remains mock-only until analyst approval and guarded actions are defined.',
      };
    },
    { connection: queueConnection },
  );
}
