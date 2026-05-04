import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import {
  QUEUE_NAMES,
  NORMALIZE_ALERT_JOB_NAME,
  RECOMMEND_PLAYBOOKS_JOB_NAME,
  buildNormalizeAlertJobId,
  buildRecommendPlaybooksJobId,
  type NormalizeAlertJobData,
  type NormalizeAlertJobResult,
  type NormalizeAlertJobStatusSnapshot,
  type NormalizeAlertQueuedResponse,
  type RecommendPlaybooksJobData,
  type RecommendPlaybooksQueuedResponse,
} from '@soc-soar/shared';
import { Job, Queue } from 'bullmq';

import { AlertsService } from '../alerts/alerts.service';
import { createSuccessResponse } from '../common/api-response.util';
import { createMockJobCatalog } from '../common/mock-data';
import { NormalizeAlertQueryDto } from '../normalized-alerts/dto/normalize-alert-query.dto';
import { NormalizedAlertsService } from '../normalized-alerts/normalized-alerts.service';
import { GenerateRecommendationQueryDto } from '../recommendations/dto/generate-recommendation-query.dto';

@Injectable()
export class JobsService implements OnModuleDestroy {
  private readonly alertNormalizationQueue = new Queue<
    NormalizeAlertJobData,
    NormalizeAlertJobResult,
    typeof NORMALIZE_ALERT_JOB_NAME
  >(QUEUE_NAMES.ALERT_NORMALIZATION, {
    connection: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    },
  });
  private readonly recommendationQueue = new Queue<
    RecommendPlaybooksJobData,
    { status: 'placeholder' },
    typeof RECOMMEND_PLAYBOOKS_JOB_NAME
  >(QUEUE_NAMES.RECOMMENDATION, {
    connection: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    },
  });

  constructor(
    private readonly alertsService: AlertsService,
    private readonly normalizedAlertsService: NormalizedAlertsService,
  ) {}

  findAll() {
    return createSuccessResponse('Registered job queues retrieved.', {
      queues: [
        {
          name: QUEUE_NAMES.PCAP_DEMO,
          purpose: 'Demo PCAP intake for sample alert generation.',
        },
        {
          name: QUEUE_NAMES.ALERT_NORMALIZATION,
          purpose: 'Background deterministic normalization of raw alerts.',
        },
        {
          name: QUEUE_NAMES.RECOMMENDATION,
          purpose: 'Queued playbook recommendation generation placeholder.',
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

  async enqueueAlertNormalization(alertId: string, query: NormalizeAlertQueryDto) {
    await this.alertsService.findRawAlertDocumentByAlertIdOrThrow(alertId);

    const force = query.force === true;
    const requestedAt = new Date().toISOString();
    const jobId = force
      ? `${buildNormalizeAlertJobId(alertId)}:${Date.now()}`
      : buildNormalizeAlertJobId(alertId);
    const jobData: NormalizeAlertJobData = {
      alertId,
      force,
      requestedAt,
    };
    const existingJob = force ? null : await this.alertNormalizationQueue.getJob(jobId);
    const job =
      existingJob ??
      (await this.alertNormalizationQueue.add(NORMALIZE_ALERT_JOB_NAME, jobData, {
        jobId,
      }));

    console.log(`[jobs] queued normalization job for alertId=${alertId} jobId=${String(job.id)}`);

    const response: NormalizeAlertQueuedResponse = {
      jobId: String(job.id),
      queueName: QUEUE_NAMES.ALERT_NORMALIZATION,
      jobName: job.name,
      alertId,
      force,
      status: 'queued',
    };

    return createSuccessResponse('Alert normalization job queued successfully.', response);
  }

  async enqueuePlaybookRecommendation(
    normalizedAlertId: string,
    query: GenerateRecommendationQueryDto,
  ) {
    await this.normalizedAlertsService.findNormalizedAlertDataByIdOrThrow(normalizedAlertId);

    const topK = query.topK ?? 3;
    const force = query.force === true;
    const requestedAt = new Date().toISOString();
    const jobId = force
      ? `${buildRecommendPlaybooksJobId(normalizedAlertId)}:${Date.now()}`
      : buildRecommendPlaybooksJobId(normalizedAlertId);
    const jobData: RecommendPlaybooksJobData = {
      normalizedAlertId,
      topK,
      force,
      requestedAt,
    };
    const existingJob = force ? null : await this.recommendationQueue.getJob(jobId);
    const job =
      existingJob ??
      (await this.recommendationQueue.add(RECOMMEND_PLAYBOOKS_JOB_NAME, jobData, {
        jobId,
      }));

    console.log(
      `[jobs] queued recommendation job for normalizedAlertId=${normalizedAlertId} jobId=${String(job.id)}`,
    );

    const response: RecommendPlaybooksQueuedResponse = {
      jobId: String(job.id),
      queueName: QUEUE_NAMES.RECOMMENDATION,
      jobName: job.name,
      normalizedAlertId,
      topK,
      force,
      status: 'queued',
    };

    return createSuccessResponse('Playbook recommendation job queued successfully.', response);
  }

  async findAlertNormalizationJob(jobId: string) {
    const job = await this.getAlertNormalizationJobOrThrow(jobId);

    return createSuccessResponse(
      'Alert normalization job status retrieved.',
      await this.mapJobStatus(job),
    );
  }

  async findAlertNormalizationJobByAlertId(alertId: string) {
    const job = await this.getAlertNormalizationJobOrThrow(buildNormalizeAlertJobId(alertId));

    return createSuccessResponse(
      'Alert normalization job status retrieved by alert identifier.',
      await this.mapJobStatus(job),
    );
  }

  async onModuleDestroy() {
    await Promise.all([this.alertNormalizationQueue.close(), this.recommendationQueue.close()]);
  }

  private async getAlertNormalizationJobOrThrow(jobId: string) {
    const job = await this.alertNormalizationQueue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Alert normalization job '${jobId}' was not found.`);
    }

    return job;
  }

  private async mapJobStatus(
    job: Job<NormalizeAlertJobData, NormalizeAlertJobResult, typeof NORMALIZE_ALERT_JOB_NAME>,
  ): Promise<NormalizeAlertJobStatusSnapshot> {
    return {
      jobId: String(job.id),
      queueName: QUEUE_NAMES.ALERT_NORMALIZATION,
      name: job.name,
      state: await job.getState(),
      progress: job.progress,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason || undefined,
      timestamp: job.timestamp,
      processedOn: job.processedOn || undefined,
      finishedOn: job.finishedOn || undefined,
    };
  }
}
