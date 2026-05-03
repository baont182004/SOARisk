import { QUEUE_NAMES } from '@soc-soar/shared';
import { Worker } from 'bullmq';

import { queueConnection } from '../queues';

export function createRecommendationWorker() {
  return new Worker(
    QUEUE_NAMES.RECOMMENDATION,
    async (job) => {
      console.log(`[recommendation-queue] placeholder processing job ${job.id}`);
      return {
        status: 'placeholder',
        message: 'Playbook recommendation scoring is not implemented yet.',
      };
    },
    { connection: queueConnection },
  );
}
