import 'dotenv/config';

import { QueueEvents } from 'bullmq';

import { connectToDatabase, disconnectFromDatabase } from './db';
import { createAlertNormalizationWorker } from './processors/alert-normalization.processor';
import { createExplanationWorker } from './processors/explanation.processor';
import { createPcapDemoWorker } from './processors/pcap-demo.processor';
import { createRecommendationWorker } from './processors/recommendation.processor';
import { createReportGenerationWorker } from './processors/report-generation.processor';
import { createWorkflowExecutionWorker } from './processors/workflow-execution.processor';
import { workerConfig } from './config';
import { queueConnection, queues } from './queues';

async function bootstrap() {
  await connectToDatabase();
  await queueConnection.ping();

  console.log(
    `[worker] connected to Redis at ${workerConfig.redisHost}:${workerConfig.redisPort}.`,
  );

  const workers = [
    createPcapDemoWorker(),
    createAlertNormalizationWorker(),
    createRecommendationWorker(),
    createExplanationWorker(),
    createWorkflowExecutionWorker(),
    createReportGenerationWorker(),
  ];

  const queueEvents = Object.values(queues).map(
    (queue) =>
      new QueueEvents(queue.name, {
        connection: queueConnection,
      }),
  );

  for (const queue of Object.values(queues)) {
    console.log(`Queue ready: ${queue.name}`);
  }

  for (const worker of workers) {
    worker.on('completed', (job) => {
      console.log(`[${worker.name}] completed job ${job.id}`);
    });

    worker.on('failed', (job, error) => {
      console.error(`[${worker.name}] failed job ${job?.id}`, error);
    });
  }

  let shuttingDown = false;

  const shutdown = async () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    await Promise.all([
      ...workers.map((worker) => worker.close()),
      ...queueEvents.map((events) => events.close()),
      ...Object.values(queues).map((queue) => queue.close()),
    ]);
    await disconnectFromDatabase();
    await queueConnection.quit();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  console.log(
    'SOC SOAR worker started. Alert normalization is worker-backed; containment and blocking remain out of scope.',
  );
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start worker runtime', error);
  process.exit(1);
});
