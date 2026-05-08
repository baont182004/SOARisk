import {
  GENERATE_REPORT_JOB_NAME,
  QUEUE_NAMES,
  type GenerateReportJobData,
} from '@soc-soar/shared';
import { Worker } from 'bullmq';

import { postApi } from '../api-client';
import { queueConnection } from '../queues';

export function createReportGenerationWorker() {
  return new Worker<
    GenerateReportJobData,
    { status: 'completed'; executionId: string; reportId?: string },
    typeof GENERATE_REPORT_JOB_NAME
  >(
    QUEUE_NAMES.REPORT_GENERATION,
    async (job) => {
      const { executionId } = job.data;

      if (!executionId) {
        throw new Error('generate-report job requires executionId.');
      }

      await job.updateProgress({ status: 'processing', executionId });

      const response = await postApi(`/reports/from-workflow/${executionId}`);

      await job.updateProgress({ status: 'completed', executionId });

      return {
        status: 'completed',
        executionId,
        ...((response.data as { reportId?: string } | undefined)?.reportId
          ? { reportId: (response.data as { reportId: string }).reportId }
          : {}),
      };
    },
    { connection: queueConnection },
  );
}
