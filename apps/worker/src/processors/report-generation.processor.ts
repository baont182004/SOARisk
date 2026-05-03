import { QUEUE_NAMES } from '@soc-soar/shared';
import { Worker } from 'bullmq';

import { queueConnection } from '../queues';

export function createReportGenerationWorker() {
  return new Worker(
    QUEUE_NAMES.REPORT_GENERATION,
    async (job) => {
      console.log(`[report-generation-queue] placeholder processing job ${job.id}`);
      return {
        status: 'placeholder',
        message: 'Report generation logic will be added in a later phase.',
      };
    },
    { connection: queueConnection },
  );
}
