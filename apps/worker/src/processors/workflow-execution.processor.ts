import {
  QUEUE_NAMES,
  START_WORKFLOW_JOB_NAME,
  type StartWorkflowJobData,
} from '@soc-soar/shared';
import { Worker } from 'bullmq';

import { postApi } from '../api-client';
import { queueConnection } from '../queues';

export function createWorkflowExecutionWorker() {
  return new Worker<
    StartWorkflowJobData,
    { status: 'completed'; executionId: string; workflowStatus?: string },
    typeof START_WORKFLOW_JOB_NAME
  >(
    QUEUE_NAMES.WORKFLOW_EXECUTION,
    async (job) => {
      const { executionId } = job.data;

      if (!executionId) {
        throw new Error('start-workflow job requires executionId.');
      }

      await job.updateProgress({ status: 'processing', executionId });

      const response = await postApi(`/workflows/${executionId}/start`);

      await job.updateProgress({ status: 'completed', executionId });

      const workflowStatus = (response.data as { status?: string } | undefined)?.status;

      return {
        status: 'completed',
        executionId,
        ...(workflowStatus ? { workflowStatus } : {}),
      };
    },
    { connection: queueConnection },
  );
}
