import { QUEUE_NAMES } from '@soc-soar/shared';
import { Worker } from 'bullmq';

import { queueConnection } from '../queues';

export function createAlertNormalizationWorker() {
  return new Worker(
    QUEUE_NAMES.ALERT_NORMALIZATION,
    async (job) => {
      console.log(
        `[alert-normalization-queue] placeholder processing job ${job.id} for alertId=${job.data.alertId ?? 'unknown'}`,
      );
      return {
        status: 'placeholder',
        message:
          'Alert normalization worker received the job, but database-backed normalization remains in the API for Phase 2A.',
      };
    },
    { connection: queueConnection },
  );
}
