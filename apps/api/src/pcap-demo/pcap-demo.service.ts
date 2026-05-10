import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  AlertSource,
  PcapFileStatus,
  PcapJobStatus,
  RAW_ALERT_MOCK_SCENARIOS,
} from '@soc-soar/shared';
import type { Model } from 'mongoose';

import { AlertsService } from '../alerts/alerts.service';
import {
  RAW_ALERT_MOCK_PAYLOADS,
  type RawAlertMockScenario,
} from '../alerts/raw-alert-mock.factory';
import { AnalystReviewService } from '../analyst-review/analyst-review.service';
import { ApprovalRequest } from '../approvals/approval-request.schema';
import { createPaginationMeta, createSuccessResponse } from '../common/api-response.util';
import { createMockPcapFile } from '../common/mock-data';
import { PaginationQueryDto } from '../common/pagination-query.dto';
import { generateIdentifier } from '../common/query.util';
import { ExplanationsService } from '../explanations/explanations.service';
import { RecommendationExplanation } from '../explanations/explanation.schema';
import { Incident } from '../incidents/incident.schema';
import { NormalizedAlert } from '../normalized-alerts/normalized-alert.schema';
import { NormalizedAlertsService } from '../normalized-alerts/normalized-alerts.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { Recommendation } from '../recommendations/recommendation.schema';
import { Report } from '../reports/report.schema';
import { WorkflowExecution } from '../workflows/workflow-execution.schema';
import { PcapFile } from './pcap-file.schema';
import { PcapJob, type PcapJobDocument } from './pcap-job.schema';

type UploadedPcap = {
  originalname: string;
  size: number;
  buffer?: Buffer;
};

@Injectable()
export class PcapDemoService {
  constructor(
    @InjectModel(PcapFile.name)
    private readonly pcapFileModel: Model<PcapFile>,
    @InjectModel(PcapJob.name)
    private readonly pcapJobModel: Model<PcapJob>,
    @InjectModel(ApprovalRequest.name)
    private readonly approvalRequestModel: Model<ApprovalRequest>,
    @InjectModel(WorkflowExecution.name)
    private readonly workflowExecutionModel: Model<WorkflowExecution>,
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<Incident>,
    @InjectModel(Report.name)
    private readonly reportModel: Model<Report>,
    @InjectModel(NormalizedAlert.name)
    private readonly normalizedAlertModel: Model<NormalizedAlert>,
    @InjectModel(Recommendation.name)
    private readonly recommendationModel: Model<Recommendation>,
    @InjectModel(RecommendationExplanation.name)
    private readonly explanationModel: Model<RecommendationExplanation>,
    private readonly alertsService: AlertsService,
    private readonly normalizedAlertsService: NormalizedAlertsService,
    private readonly recommendationsService: RecommendationsService,
    private readonly explanationsService: ExplanationsService,
    private readonly analystReviewService: AnalystReviewService,
  ) {}

  async uploadPcap(file: UploadedPcap | undefined) {
    if (!file) {
      throw new BadRequestException('A .pcap or .pcapng file is required.');
    }

    this.assertSupportedFile(file.originalname);

    const pcapFile = await this.pcapFileModel.create({
      fileId: generateIdentifier('PCAP'),
      filename: `${Date.now()}-${file.originalname}`,
      originalName: file.originalname,
      size: file.size,
      status: PcapFileStatus.UPLOADED,
      uploadedAt: new Date(),
    });
    const job = await this.createJob(pcapFile.fileId, 'PCAP uploaded and queued for processing.');

    await this.recordJobEvent(job, PcapJobStatus.UPLOADED, 'PCAP file uploaded.');
    await this.processJobDocument(job, {
      originalName: pcapFile.originalName,
      size: pcapFile.size,
      sampleScenario: this.inferScenarioFromFilename(pcapFile.originalName),
    });

    return createSuccessResponse('PCAP uploaded and processed through analyst review.', {
      file: pcapFile.toObject(),
      job: job.toObject(),
      pipeline: await this.buildPipeline(job.jobId),
    });
  }

  async uploadPlaceholder() {
    const filePayload = createMockPcapFile();
    const pcapFile = await this.pcapFileModel.create({
      ...filePayload,
      originalName: 'sample-port-scan.pcap',
      filename: `sample-port-scan-${Date.now()}.pcap`,
      status: PcapFileStatus.UPLOADED,
    });
    const job = await this.createJob(pcapFile.fileId, 'Sample PCAP queued for processing.');

    await this.recordJobEvent(job, PcapJobStatus.UPLOADED, 'Sample PCAP selected.');
    await this.processJobDocument(job, {
      originalName: pcapFile.originalName,
      size: pcapFile.size,
      sampleScenario: 'port-scan',
    });

    return createSuccessResponse('Sample PCAP processed through analyst review.', {
      file: pcapFile.toObject(),
      job: job.toObject(),
      pipeline: await this.buildPipeline(job.jobId),
    });
  }

  async findJobs(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const [items, total] = await Promise.all([
      this.pcapJobModel
        .find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.pcapJobModel.countDocuments().exec(),
    ]);

    return createSuccessResponse(
      'PCAP intake jobs retrieved.',
      items,
      createPaginationMeta({
        count: items.length,
        page,
        limit,
        total,
      }),
    );
  }

  async findJob(jobId: string) {
    const job = await this.findJobDocumentOrThrow(jobId);

    return createSuccessResponse('PCAP job retrieved.', job.toObject());
  }

  async processJob(jobId: string) {
    const job = await this.findJobDocumentOrThrow(jobId);

    if (job.status === PcapJobStatus.READY_FOR_REVIEW || job.status === PcapJobStatus.COMPLETED) {
      return createSuccessResponse('PCAP job already processed.', {
        job: job.toObject(),
        pipeline: await this.buildPipeline(job.jobId),
      });
    }

    const file = await this.pcapFileModel.findOne({ fileId: job.fileId }).lean().exec();

    if (!file) {
      throw new NotFoundException(`PCAP file '${job.fileId}' was not found.`);
    }

    await this.processJobDocument(job, {
      originalName: file.originalName,
      size: file.size,
      sampleScenario: this.inferScenarioFromFilename(file.originalName),
    });

    return createSuccessResponse('PCAP job processed.', {
      job: job.toObject(),
      pipeline: await this.buildPipeline(job.jobId),
    });
  }

  async getPipeline(jobId: string) {
    return createSuccessResponse('PCAP pipeline retrieved.', await this.buildPipeline(jobId));
  }

  async generateScenarioAlert(scenario: RawAlertMockScenario) {
    return this.processSampleScenario(scenario);
  }

  async processSampleScenario(scenario: RawAlertMockScenario) {
    if (!RAW_ALERT_MOCK_PAYLOADS[scenario]) {
      throw new BadRequestException(
        `Unsupported PCAP sample '${scenario}'. Supported samples: ${RAW_ALERT_MOCK_SCENARIOS.join(', ')}`,
      );
    }

    const file = await this.pcapFileModel.create({
      ...createMockPcapFile(),
      fileId: generateIdentifier('PCAP'),
      filename: `${scenario}-${Date.now()}.pcap`,
      originalName: `${scenario}.pcap`,
      status: PcapFileStatus.UPLOADED,
    });
    const job = await this.createJob(file.fileId, `Sample PCAP '${scenario}' queued.`);

    await this.recordJobEvent(job, PcapJobStatus.UPLOADED, `Sample PCAP '${scenario}' selected.`);
    await this.processJobDocument(job, {
      originalName: file.originalName,
      size: file.size,
      sampleScenario: scenario,
    });

    const pipeline = await this.buildPipeline(job.jobId);

    if (!pipeline.rawAlert) {
      throw new BadRequestException('Sample PCAP did not generate a raw alert.');
    }

    return createSuccessResponse('Sample PCAP processed through analyst review.', {
      scenario,
      supportedScenarios: RAW_ALERT_MOCK_SCENARIOS,
      file: file.toObject(),
      job: job.toObject(),
      rawAlert: pipeline.rawAlert,
      pipeline,
    });
  }

  async linkReviewExecution(input: {
    reviewId: string;
    approvalId?: string;
    executionId?: string;
  }) {
    const job = await this.pcapJobModel.findOne({ reviewId: input.reviewId }).exec();

    if (!job) {
      return;
    }

    if (input.approvalId) {
      job.approvalId = input.approvalId;
    }

    if (input.executionId) {
      job.executionId = input.executionId;
    }

    await this.recordJobEvent(job, PcapJobStatus.READY_FOR_REVIEW, 'Analyst review moved to approval gate.');
  }

  private async processJobDocument(
    job: PcapJobDocument,
    input: {
      originalName: string;
      size: number;
      sampleScenario?: RawAlertMockScenario;
    },
  ) {
    await this.recordJobEvent(job, PcapJobStatus.QUEUED, 'PCAP job created.');
    await this.recordJobEvent(job, PcapJobStatus.PARSING, 'Parsing PCAP and extracting alert features.');

    const parsedAlert = this.parsePcapToAlert(input);
    const rawAlert = await this.alertsService.createRawAlertDocument({
      ...parsedAlert,
      source: AlertSource.PCAP_DEMO,
      sourceAlertId: `PCAP-${job.jobId}`,
      tags: [...(parsedAlert.tags ?? []), 'pcap-intake', job.jobId],
      rawPayload: {
        ...(parsedAlert.rawPayload ?? {}),
        pcapJobId: job.jobId,
        pcapFileId: job.fileId,
        pcapOriginalName: input.originalName,
        parser: 'controlled-pcap-parser',
      },
    });

    job.rawAlertId = rawAlert.alertId;
    await this.recordJobEvent(job, PcapJobStatus.ALERT_GENERATED, `Raw alert ${rawAlert.alertId} generated.`);

    const normalized = await this.normalizedAlertsService.normalizeFromRaw(rawAlert.alertId, {
      force: true,
    });
    job.normalizedAlertId = normalized.data.normalizedAlertId;
    await this.recordJobEvent(
      job,
      PcapJobStatus.NORMALIZED,
      `Alert normalized as ${normalized.data.normalizedAlertId}.`,
    );

    await this.recordJobEvent(job, PcapJobStatus.RUNNING, 'Context matching and playbook scoring started.');
    const recommendation = await this.recommendationsService.generateFromNormalized(
      normalized.data.normalizedAlertId,
      { force: true, topK: 3 },
    );
    const selectedPlaybookId = recommendation.data.topPlaybooks[0]?.playbookId;

    if (!selectedPlaybookId) {
      throw new BadRequestException('Recommendation did not produce any playbook candidate.');
    }

    await this.recommendationsService.selectPlaybook(
      recommendation.data.recommendationId,
      selectedPlaybookId,
    );
    job.recommendationId = recommendation.data.recommendationId;
    job.selectedPlaybookId = selectedPlaybookId;
    await this.recordJobEvent(
      job,
      PcapJobStatus.RECOMMENDED,
      `Top-3 recommendation generated. Selected ${selectedPlaybookId} for review.`,
    );

    const explanation = await this.explanationsService.generateFromRecommendation(
      recommendation.data.recommendationId,
      { force: true },
    );
    job.explanationId = explanation.data.explanationId;

    const review = await this.analystReviewService.createForRecommendation({
      recommendationId: recommendation.data.recommendationId,
      pcapJobId: job.jobId,
      selectedPlaybookId,
    });
    job.reviewId = review.reviewId;
    job.completedAt = new Date();
    await this.recordJobEvent(
      job,
      PcapJobStatus.READY_FOR_REVIEW,
      `Analyst Review ${review.reviewId} is ready.`,
    );
  }

  private parsePcapToAlert(input: {
    originalName: string;
    size: number;
    sampleScenario?: RawAlertMockScenario;
  }) {
    const scenario = input.sampleScenario ?? this.inferScenarioFromFilename(input.originalName);
    const payload = RAW_ALERT_MOCK_PAYLOADS[scenario] ?? RAW_ALERT_MOCK_PAYLOADS['port-scan'];
    const sizeSignal = input.size > 5_000_000 ? 'large capture' : 'focused capture';

    return {
      ...payload,
      title: `${payload.title} from ${input.originalName}`,
      description: `${payload.description ?? payload.title}. PCAP parser extracted a ${sizeSignal} signal and mapped it to ${scenario}.`,
      observedAt: new Date().toISOString(),
      rawPayload: {
        ...(payload.rawPayload ?? {}),
        originalName: input.originalName,
        fileSize: input.size,
        inferredScenario: scenario,
      },
    };
  }

  private inferScenarioFromFilename(filename: string): RawAlertMockScenario {
    const lower = filename.toLowerCase();

    if (lower.includes('sql')) {
      return 'sql-injection';
    }

    if (lower.includes('xss')) {
      return 'xss';
    }

    if (lower.includes('dns')) {
      return 'suspicious-dns';
    }

    if (lower.includes('botnet') || lower.includes('c2')) {
      return 'botnet-c2';
    }

    if (lower.includes('icmp') || lower.includes('flood') || lower.includes('dos')) {
      return 'icmp-flood';
    }

    return 'port-scan';
  }

  private assertSupportedFile(filename: string) {
    const lower = filename.toLowerCase();

    if (!lower.endsWith('.pcap') && !lower.endsWith('.pcapng')) {
      throw new BadRequestException('Only .pcap and .pcapng files are supported.');
    }
  }

  private async createJob(fileId: string, message: string) {
    return this.pcapJobModel.create({
      jobId: generateIdentifier('PCAPJOB'),
      fileId,
      status: PcapJobStatus.UPLOADED,
      message,
      pipelineEvents: [],
      createdAt: new Date(),
    });
  }

  private async recordJobEvent(job: PcapJobDocument, status: PcapJobStatus, message: string) {
    job.status = status;
    job.message = message;
    job.pipelineEvents.push({
      timestamp: new Date(),
      status,
      message,
    });
    await job.save();
  }

  private async findJobDocumentOrThrow(jobId: string) {
    const job = await this.pcapJobModel.findOne({ jobId }).exec();

    if (!job) {
      throw new NotFoundException(`PCAP job '${jobId}' was not found.`);
    }

    return job;
  }

  private async buildPipeline(jobId: string) {
    const job = await this.pcapJobModel.findOne({ jobId }).lean().exec();

    if (!job) {
      throw new NotFoundException(`PCAP job '${jobId}' was not found.`);
    }

    const [file, rawAlert, normalizedAlert, recommendation, explanation, review] = await Promise.all([
      this.pcapFileModel.findOne({ fileId: job.fileId }).lean().exec(),
      job.rawAlertId
        ? this.alertsService.findRawAlertDocumentByAlertIdOrThrow(job.rawAlertId).then((item) => item.toObject())
        : null,
      job.normalizedAlertId
        ? this.normalizedAlertModel.findOne({ normalizedAlertId: job.normalizedAlertId }).lean().exec()
        : null,
      job.recommendationId
        ? this.recommendationModel.findOne({ recommendationId: job.recommendationId }).lean().exec()
        : null,
      job.explanationId
        ? this.explanationModel.findOne({ explanationId: job.explanationId }).lean().exec()
        : null,
      job.reviewId ? this.analystReviewService.findReviewByIdOrThrow(job.reviewId).catch(() => null) : null,
    ]);
    const reviewExecutionId =
      review && 'executionId' in review ? (review.executionId as string | undefined) : undefined;
    const reviewApprovalId =
      review && 'approvalId' in review ? (review.approvalId as string | undefined) : undefined;
    const executionId = job.executionId ?? reviewExecutionId;
    const approvalId = job.approvalId ?? reviewApprovalId;
    const [approval, workflow] = await Promise.all([
      approvalId
        ? this.approvalRequestModel.findOne({ approvalId }).lean().exec()
        : executionId
          ? this.approvalRequestModel.findOne({ executionId }).sort({ requestedAt: 1 }).lean().exec()
          : null,
      executionId ? this.workflowExecutionModel.findOne({ executionId }).lean().exec() : null,
    ]);
    const [incident, report] = await Promise.all([
      executionId ? this.incidentModel.findOne({ executionId }).lean().exec() : null,
      executionId ? this.reportModel.findOne({ executionId }).lean().exec() : null,
    ]);

    return {
      file,
      job,
      rawAlert,
      normalizedAlert,
      recommendation,
      explanation,
      review,
      approval,
      workflow,
      incident,
      report,
    };
  }
}
