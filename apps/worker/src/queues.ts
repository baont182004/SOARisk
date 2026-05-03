import { QUEUE_NAMES } from '@soc-soar/shared';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

import { workerConfig } from './config';

const connection = new IORedis({
  host: workerConfig.redisHost,
  port: workerConfig.redisPort,
  maxRetriesPerRequest: null,
});

export const queueConnection = connection;

export const queues = {
  pcapDemoQueue: new Queue(QUEUE_NAMES.PCAP_DEMO, { connection }),
  alertNormalizationQueue: new Queue(QUEUE_NAMES.ALERT_NORMALIZATION, {
    connection,
  }),
  recommendationQueue: new Queue(QUEUE_NAMES.RECOMMENDATION, { connection }),
  workflowExecutionQueue: new Queue(QUEUE_NAMES.WORKFLOW_EXECUTION, {
    connection,
  }),
  reportGenerationQueue: new Queue(QUEUE_NAMES.REPORT_GENERATION, {
    connection,
  }),
};
