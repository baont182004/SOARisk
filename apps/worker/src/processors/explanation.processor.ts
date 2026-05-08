import {
  GENERATE_EXPLANATION_JOB_NAME,
  QUEUE_NAMES,
  type GenerateExplanationJobData,
} from '@soc-soar/shared';
import { Worker } from 'bullmq';

import { postApi } from '../api-client';
import { queueConnection } from '../queues';

export function createExplanationWorker() {
  console.log('[worker] started explanation processor.');

  return new Worker<
    GenerateExplanationJobData,
    { status: 'completed'; recommendationId: string; explanationId?: string },
    typeof GENERATE_EXPLANATION_JOB_NAME
  >(
    QUEUE_NAMES.EXPLANATION,
    async (job) => {
      const { recommendationId, force } = job.data;

      if (!recommendationId) {
        throw new Error('generate-explanation job requires recommendationId.');
      }

      await job.updateProgress({ status: 'processing', recommendationId });

      const suffix = force === true ? '?force=true' : '';
      const response = await postApi(
        `/explanations/from-recommendation/${recommendationId}${suffix}`,
      );

      await job.updateProgress({ status: 'completed', recommendationId });

      const explanationId = (response.data as { explanationId?: string } | undefined)
        ?.explanationId;

      return {
        status: 'completed',
        recommendationId,
        ...(explanationId ? { explanationId } : {}),
      };
    },
    { connection: queueConnection },
  );
}
