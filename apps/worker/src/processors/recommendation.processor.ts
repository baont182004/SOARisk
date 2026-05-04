import {
  QUEUE_NAMES,
  RECOMMEND_PLAYBOOKS_JOB_NAME,
  type RecommendPlaybooksJobData,
} from '@soc-soar/shared';
import { Worker } from 'bullmq';

import { queueConnection } from '../queues';

export function createRecommendationWorker() {
  return new Worker<
    RecommendPlaybooksJobData,
    { status: 'placeholder' },
    typeof RECOMMEND_PLAYBOOKS_JOB_NAME
  >(
    QUEUE_NAMES.RECOMMENDATION,
    async (job) => {
      console.log(
        `[recommendation-queue] placeholder processing job ${job.id} for normalizedAlertId=${job.data.normalizedAlertId ?? 'unknown'} topK=${job.data.topK ?? 3}`,
      );
      return {
        status: 'placeholder',
      };
    },
    { connection: queueConnection },
  );
}
