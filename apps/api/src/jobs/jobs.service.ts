import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import {
  GENERATE_EXPLANATION_JOB_NAME,
  GENERATE_REPORT_JOB_NAME,
  QUEUE_NAMES,
  NORMALIZE_ALERT_JOB_NAME,
  RECOMMEND_PLAYBOOKS_JOB_NAME,
  START_WORKFLOW_JOB_NAME,
  buildGenerateReportJobId,
  buildGenerateExplanationJobId,
  buildNormalizeAlertJobId,
  buildRecommendPlaybooksJobId,
  buildStartWorkflowJobId,
  type GenerateExplanationJobData,
  type GenerateExplanationQueuedResponse,
  type GenerateReportJobData,
  type GenerateReportQueuedResponse,
  type NormalizeAlertJobData,
  type NormalizeAlertJobResult,
  type NormalizeAlertJobStatusSnapshot,
  type QueueJobStatusSnapshot,
  type NormalizeAlertQueuedResponse,
  type RecommendPlaybooksJobData,
  type RecommendPlaybooksQueuedResponse,
  type StartWorkflowJobData,
  type StartWorkflowQueuedResponse,
} from '@soc-soar/shared';
import { Job, Queue } from 'bullmq';

import { AlertsService } from '../alerts/alerts.service';
import { createSuccessResponse } from '../common/api-response.util';
import { createMockJobCatalog } from '../common/mock-data';
import { GenerateExplanationQueryDto } from '../explanations/dto/generate-explanation-query.dto';
import { NormalizeAlertQueryDto } from '../normalized-alerts/dto/normalize-alert-query.dto';
import { NormalizedAlertsService } from '../normalized-alerts/normalized-alerts.service';
import { GenerateRecommendationQueryDto } from '../recommendations/dto/generate-recommendation-query.dto';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { WorkflowsService } from '../workflows/workflows.service';

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
    { status: 'completed'; normalizedAlertId: string; recommendationId?: string },
    typeof RECOMMEND_PLAYBOOKS_JOB_NAME
  >(QUEUE_NAMES.RECOMMENDATION, {
    connection: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    },
  });
  private readonly explanationQueue = new Queue<
    GenerateExplanationJobData,
    { status: 'completed'; recommendationId: string; explanationId?: string },
    typeof GENERATE_EXPLANATION_JOB_NAME
  >(QUEUE_NAMES.EXPLANATION, {
    connection: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    },
  });
  private readonly workflowExecutionQueue = new Queue<
    StartWorkflowJobData,
    { status: 'completed'; executionId: string; workflowStatus?: string },
    typeof START_WORKFLOW_JOB_NAME
  >(QUEUE_NAMES.WORKFLOW_EXECUTION, {
    connection: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    },
  });
  private readonly reportGenerationQueue = new Queue<
    GenerateReportJobData,
    unknown,
    typeof GENERATE_REPORT_JOB_NAME
  >(QUEUE_NAMES.REPORT_GENERATION, {
    connection: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    },
  });

  constructor(
    private readonly alertsService: AlertsService,
    private readonly normalizedAlertsService: NormalizedAlertsService,
    private readonly recommendationsService: RecommendationsService,
    private readonly workflowsService: WorkflowsService,
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
          purpose: 'Queued playbook recommendation generation.',
        },
        {
          name: QUEUE_NAMES.EXPLANATION,
          purpose: 'Queued recommendation explanation generation.',
        },
        {
          name: QUEUE_NAMES.WORKFLOW_EXECUTION,
          purpose: 'Queued workflow start for asynchronous orchestration.',
        },
        {
          name: QUEUE_NAMES.REPORT_GENERATION,
          purpose: 'Queued report generation for completed workflow executions.',
        },
      ],
      catalog: createMockJobCatalog(),
    });
  }

  async enqueueAlertNormalization(alertId: string, query: NormalizeAlertQueryDto) {
    try {
      await this.alertsService.findRawAlertDocumentByAlertIdOrThrow(alertId);

      const force = query.force === true;
      const requestedAt = new Date().toISOString();
      const jobId = force
        ? `${buildNormalizeAlertJobId(alertId)}__${Date.now()}`
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
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        }));

      console.log(
        `[jobs] queued normalization job for alertId=${alertId} jobId=${String(job.id)}`,
      );

      const response: NormalizeAlertQueuedResponse = {
        jobId: String(job.id),
        queueName: QUEUE_NAMES.ALERT_NORMALIZATION,
        jobName: job.name,
        alertId,
        force,
        status: 'queued',
      };

      return createSuccessResponse('Alert normalization job queued successfully.', response);
    } catch (error) {
      console.error(`[jobs] failed to queue normalization job for alertId=${alertId}`, error);
      throw error;
    }
  }

  async enqueuePlaybookRecommendation(
    normalizedAlertId: string,
    query: GenerateRecommendationQueryDto,
  ) {
    try {
      await this.normalizedAlertsService.findNormalizedAlertDataByIdOrThrow(normalizedAlertId);

      const topK = query.topK ?? 3;
      const force = query.force === true;
      const requestedAt = new Date().toISOString();
      const jobId = force
        ? `${buildRecommendPlaybooksJobId(normalizedAlertId)}__${Date.now()}`
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
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
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
    } catch (error) {
      console.error(
        `[jobs] failed to queue recommendation job for normalizedAlertId=${normalizedAlertId}`,
        error,
      );
      throw error;
    }
  }

  async enqueueRecommendationExplanation(
    recommendationId: string,
    query: GenerateExplanationQueryDto,
  ) {
    try {
      await this.recommendationsService.findRecommendationDataByIdOrThrow(recommendationId);

      const force = query.force === true;
      const requestedAt = new Date().toISOString();
      const jobId = force
        ? `${buildGenerateExplanationJobId(recommendationId)}__${Date.now()}`
        : buildGenerateExplanationJobId(recommendationId);
      const jobData: GenerateExplanationJobData = {
        recommendationId,
        force,
        requestedAt,
      };
      const existingJob = force ? null : await this.explanationQueue.getJob(jobId);
      const job =
        existingJob ??
        (await this.explanationQueue.add(GENERATE_EXPLANATION_JOB_NAME, jobData, {
          jobId,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        }));

      console.log(
        `[jobs] queued explanation job for recommendationId=${recommendationId} jobId=${String(job.id)}`,
      );

      const response: GenerateExplanationQueuedResponse = {
        jobId: String(job.id),
        queueName: QUEUE_NAMES.EXPLANATION,
        jobName: job.name,
        recommendationId,
        force,
        status: 'queued',
      };

      return createSuccessResponse(
        'Recommendation explanation job queued successfully.',
        response,
      );
    } catch (error) {
      console.error(
        `[jobs] failed to queue explanation job for recommendationId=${recommendationId}`,
        error,
      );
      throw error;
    }
  }

  async enqueueWorkflowStart(executionId: string) {
    try {
      await this.workflowsService.findWorkflowExecutionDataByIdOrThrow(executionId);

      const requestedAt = new Date().toISOString();
      const jobId = buildStartWorkflowJobId(executionId);
      const jobData: StartWorkflowJobData = {
        executionId,
        requestedAt,
      };
      const existingJob = await this.workflowExecutionQueue.getJob(jobId);
      const job =
        existingJob ??
        (await this.workflowExecutionQueue.add(START_WORKFLOW_JOB_NAME, jobData, {
          jobId,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        }));

      console.log(
        `[jobs] queued workflow start job for executionId=${executionId} jobId=${String(job.id)}`,
      );

      const response: StartWorkflowQueuedResponse = {
        jobId: String(job.id),
        queueName: QUEUE_NAMES.WORKFLOW_EXECUTION,
        jobName: job.name,
        executionId,
        status: 'queued',
      };

      return createSuccessResponse('Workflow start job queued successfully.', response);
    } catch (error) {
      console.error(
        `[jobs] failed to queue workflow start job for executionId=${executionId}`,
        error,
      );
      throw error;
    }
  }

  async enqueueReportGeneration(executionId: string) {
    try {
      await this.workflowsService.findWorkflowExecutionDataByIdOrThrow(executionId);

      const requestedAt = new Date().toISOString();
      const jobId = buildGenerateReportJobId(executionId);
      const jobData: GenerateReportJobData = {
        executionId,
        requestedAt,
      };
      const existingJob = await this.reportGenerationQueue.getJob(jobId);
      const job =
        existingJob ??
        (await this.reportGenerationQueue.add(GENERATE_REPORT_JOB_NAME, jobData, {
          jobId,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        }));

      const response: GenerateReportQueuedResponse = {
        jobId: String(job.id),
        queueName: QUEUE_NAMES.REPORT_GENERATION,
        jobName: job.name,
        executionId,
        status: 'queued',
      };

      return createSuccessResponse('Report generation job queued successfully.', response);
    } catch (error) {
      console.error(
        `[jobs] failed to queue report generation job for executionId=${executionId}`,
        error,
      );
      throw error;
    }
  }

  async findAlertNormalizationJob(jobId: string) {
    const job = await this.getAlertNormalizationJobOrThrow(jobId);

    return createSuccessResponse(
      'Alert normalization job status retrieved.',
      await this.mapJobStatus(job),
    );
  }

  async findQueueJob(queueName: string, jobId: string) {
    const queue = this.getQueueByName(queueName);
    const job = await queue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Job '${jobId}' was not found in queue '${queueName}'.`);
    }

    return createSuccessResponse(
      'Queue job status retrieved.',
      await this.mapGenericJobStatus(queueName, job),
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
    await Promise.all([
      this.alertNormalizationQueue.close(),
      this.recommendationQueue.close(),
      this.explanationQueue.close(),
      this.workflowExecutionQueue.close(),
      this.reportGenerationQueue.close(),
    ]);
  }

  private getQueueByName(queueName: string) {
    const queues = {
      [QUEUE_NAMES.ALERT_NORMALIZATION]: this.alertNormalizationQueue,
      [QUEUE_NAMES.RECOMMENDATION]: this.recommendationQueue,
      [QUEUE_NAMES.EXPLANATION]: this.explanationQueue,
      [QUEUE_NAMES.WORKFLOW_EXECUTION]: this.workflowExecutionQueue,
      [QUEUE_NAMES.REPORT_GENERATION]: this.reportGenerationQueue,
    };
    const queue = queues[queueName as keyof typeof queues];

    if (!queue) {
      throw new NotFoundException(`Queue '${queueName}' is not registered.`);
    }

    return queue;
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

  private async mapGenericJobStatus(
    queueName: string,
    job: Job,
  ): Promise<QueueJobStatusSnapshot> {
    return {
      jobId: String(job.id),
      queueName,
      name: job.name,
      state: await job.getState(),
      progress: job.progress,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason || undefined,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn || undefined,
      finishedOn: job.finishedOn || undefined,
    };
  }
}
