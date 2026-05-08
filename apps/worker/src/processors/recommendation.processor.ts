import {
  QUEUE_NAMES,
  RECOMMEND_PLAYBOOKS_JOB_NAME,
  type RecommendPlaybooksJobData,
} from '@soc-soar/shared';
import { Worker } from 'bullmq';

import { postApi } from '../api-client';
import { queueConnection } from '../queues';

export function createRecommendationWorker() {
  return new Worker<
    RecommendPlaybooksJobData,
    { status: 'completed'; normalizedAlertId: string; recommendationId?: string },
    typeof RECOMMEND_PLAYBOOKS_JOB_NAME
  >(
    QUEUE_NAMES.RECOMMENDATION,
    async (job) => {
      const { normalizedAlertId, topK, force } = job.data;

      if (!normalizedAlertId) {
        throw new Error('recommend-playbooks job requires normalizedAlertId.');
      }

      await job.updateProgress({ status: 'processing', normalizedAlertId });

      const query = new URLSearchParams();
      if (topK !== undefined) {
        query.set('topK', String(topK));
      }
      if (force === true) {
        query.set('force', 'true');
      }

      const suffix = query.toString() ? `?${query.toString()}` : '';
      const response = await postApi(
        `/recommendations/from-normalized/${normalizedAlertId}${suffix}`,
      );

      await job.updateProgress({ status: 'completed', normalizedAlertId });

      const recommendationId = (response.data as { recommendationId?: string } | undefined)
        ?.recommendationId;

      return {
        status: 'completed',
        normalizedAlertId,
        ...(recommendationId ? { recommendationId } : {}),
      };
    },
    { connection: queueConnection },
  );
}
