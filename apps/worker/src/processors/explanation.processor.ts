import {
  GENERATE_EXPLANATION_JOB_NAME,
  QUEUE_NAMES,
  type GenerateExplanationJobData,
} from '@soc-soar/shared';
import { Worker } from 'bullmq';

import { queueConnection } from '../queues';

export function createExplanationWorker() {
  console.log('[worker] started explanation processor.');

  return new Worker<
    GenerateExplanationJobData,
    { status: 'placeholder' },
    typeof GENERATE_EXPLANATION_JOB_NAME
  >(
    QUEUE_NAMES.EXPLANATION,
    async (job) => {
      console.log(
        `[explanation-queue] placeholder processing job ${job.id} for recommendationId=${job.data.recommendationId ?? 'unknown'}`,
      );

      return {
        status: 'placeholder',
      };
    },
    { connection: queueConnection },
  );
}
