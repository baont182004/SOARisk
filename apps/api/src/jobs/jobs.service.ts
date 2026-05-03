import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { QUEUE_NAMES } from '@soc-soar/shared';
import { Queue } from 'bullmq';

import { AlertsService } from '../alerts/alerts.service';
import { createSuccessResponse } from '../common/api-response.util';
import { createMockJobCatalog } from '../common/mock-data';

@Injectable()
export class JobsService implements OnModuleDestroy {
  private readonly alertNormalizationQueue = new Queue(QUEUE_NAMES.ALERT_NORMALIZATION, {
    connection: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    },
  });

  constructor(private readonly alertsService: AlertsService) {}

  findAll() {
    return createSuccessResponse('Registered placeholder job queues retrieved.', {
      queues: [
        {
          name: QUEUE_NAMES.PCAP_DEMO,
          purpose: 'Demo PCAP intake for sample alert generation.',
        },
        {
          name: QUEUE_NAMES.ALERT_NORMALIZATION,
          purpose: 'Future normalized alert transformation pipeline.',
        },
        {
          name: QUEUE_NAMES.RECOMMENDATION,
          purpose: 'Future playbook recommendation pipeline.',
        },
        {
          name: QUEUE_NAMES.WORKFLOW_EXECUTION,
          purpose: 'Future workflow orchestration pipeline.',
        },
        {
          name: QUEUE_NAMES.REPORT_GENERATION,
          purpose: 'Future report generation pipeline.',
        },
      ],
      catalog: createMockJobCatalog(),
    });
  }

  async enqueueAlertNormalization(alertId: string) {
    await this.alertsService.findRawAlertDocumentByAlertIdOrThrow(alertId);

    const job = await this.alertNormalizationQueue.add('normalize-alert', {
      alertId,
    });

    return createSuccessResponse('Alert normalization job queued successfully.', {
      jobId: job.id,
      queueName: QUEUE_NAMES.ALERT_NORMALIZATION,
      jobName: job.name,
      alertId,
    });
  }

  async onModuleDestroy() {
    await this.alertNormalizationQueue.close();
  }
}
