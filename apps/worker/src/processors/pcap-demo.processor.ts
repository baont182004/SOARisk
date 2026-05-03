import { QUEUE_NAMES } from '@soc-soar/shared';
import { Worker } from 'bullmq';

import { queueConnection } from '../queues';

export function createPcapDemoWorker() {
  return new Worker(
    QUEUE_NAMES.PCAP_DEMO,
    async (job) => {
      console.log(`[pcap-demo-queue] placeholder processing job ${job.id}`);
      return {
        status: 'placeholder',
        message:
          'PCAP demo jobs will later emit sample alerts only. No packet analysis is implemented here.',
      };
    },
    { connection: queueConnection },
  );
}
