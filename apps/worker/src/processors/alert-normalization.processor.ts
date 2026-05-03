import { QUEUE_NAMES } from '@soc-soar/shared';
import { Worker } from 'bullmq';

import { queueConnection } from '../queues';

export function createAlertNormalizationWorker() {
  return new Worker(
    QUEUE_NAMES.ALERT_NORMALIZATION,
    async (job) => {
      console.log(`[alert-normalization-queue] placeholder processing job ${job.id}`);
      return {
        status: 'placeholder',
        message: 'Alert normalization logic will be implemented in a later phase.',
      };
    },
    { connection: queueConnection },
  );
}
