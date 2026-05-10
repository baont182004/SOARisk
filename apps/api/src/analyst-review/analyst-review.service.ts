import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApprovalStatus, type ApprovalRequest as SharedApprovalRequest } from '@soc-soar/shared';
import type { Model } from 'mongoose';

import { ApprovalRequest } from '../approvals/approval-request.schema';
import { createSuccessResponse } from '../common/api-response.util';
import { generateIdentifier } from '../common/query.util';
import { IncidentsService } from '../incidents/incidents.service';
import { NormalizedAlertsService } from '../normalized-alerts/normalized-alerts.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { AnalystReviewUpdateDto } from './dto/analyst-review-update.dto';
import { AnalystReview } from './analyst-review.schema';

type PersistedAnalystReview = Omit<AnalystReview, 'createdAt' | 'updatedAt' | 'auditLog'> & {
  createdAt: Date;
  updatedAt: Date;
  auditLog: Array<{
    timestamp: Date;
    actor: string;
    action: string;
    changes: Record<string, unknown>;
  }>;
};

type PersistedApprovalRequest = Omit<
  SharedApprovalRequest,
  'requestedAt' | 'decidedAt' | 'createdAt' | 'updatedAt'
> & {
  requestedAt: Date;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AnalystReviewService {
  constructor(
    @InjectModel(AnalystReview.name)
    private readonly analystReviewModel: Model<AnalystReview>,
    @InjectModel(ApprovalRequest.name)
    private readonly approvalRequestModel: Model<ApprovalRequest>,
    private readonly recommendationsService: RecommendationsService,
    private readonly normalizedAlertsService: NormalizedAlertsService,
    private readonly incidentsService: IncidentsService,
    private readonly workflowsService: WorkflowsService,
  ) {}

  async createForRecommendation(input: {
    recommendationId: string;
    pcapJobId?: string;
    selectedPlaybookId?: string;
    actor?: string;
  }) {
    const existing = await this.analystReviewModel
      .findOne({ recommendationId: input.recommendationId })
      .sort({ createdAt: -1 })
      .exec();

    if (existing) {
      return this.mapReviewForResponse(existing.toObject() as PersistedAnalystReview);
    }

    const recommendation = await this.recommendationsService.findRecommendationDataByIdOrThrow(
      input.recommendationId,
    );
    const selectedPlaybookId =
      input.selectedPlaybookId ??
      recommendation.selectedPlaybookId ??
      recommendation.topPlaybooks[0]?.playbookId;

    if (!selectedPlaybookId) {
      throw new BadRequestException('Recommendation does not contain a selectable playbook.');
    }

    const selected = recommendation.topPlaybooks.find(
      (playbook) => playbook.playbookId === selectedPlaybookId,
    );

    const created = await this.analystReviewModel.create({
      reviewId: generateIdentifier('REV'),
      recommendationId: recommendation.recommendationId,
      normalizedAlertId: recommendation.normalizedAlertId,
      alertId: recommendation.alertId,
      ...(input.pcapJobId ? { pcapJobId: input.pcapJobId } : {}),
      selectedPlaybookId,
      severity: recommendation.severity,
      confidence: undefined,
      assetContext: 'SOC analyst queue',
      recommendedAction:
        selected?.matchedReasons[0] ??
        selected?.explanation ??
        'Proceed with approval-gated response workflow.',
      analystNote: '',
      verdict: 'unknown',
      status: 'review',
      auditLog: [
        {
          timestamp: new Date(),
          actor: input.actor ?? 'system',
          action: 'review_created',
          changes: {
            selectedPlaybookId,
            recommendationId: recommendation.recommendationId,
          },
        },
      ],
    });

    return this.mapReviewForResponse(created.toObject() as PersistedAnalystReview);
  }

  async findByRecommendation(recommendationId: string) {
    const review = await this.findReviewByRecommendationOrThrow(recommendationId);

    return createSuccessResponse('Analyst review retrieved.', review);
  }

  async findById(reviewId: string) {
    const review = await this.findReviewByIdOrThrow(reviewId);

    return createSuccessResponse('Analyst review retrieved.', review);
  }

  async updateByRecommendation(recommendationId: string, dto: AnalystReviewUpdateDto) {
    const reviewDocument = await this.analystReviewModel.findOne({ recommendationId }).exec();

    if (!reviewDocument) {
      throw new NotFoundException(
        `Analyst review for recommendation '${recommendationId}' was not found.`,
      );
    }

    const changes: Record<string, unknown> = {};

    for (const field of [
      'severity',
      'confidence',
      'assetContext',
      'selectedPlaybookId',
      'recommendedAction',
      'analystNote',
      'verdict',
    ] as const) {
      if (dto[field] !== undefined) {
        reviewDocument[field] = dto[field] as never;
        changes[field] = dto[field];
      }
    }

    reviewDocument.status = 'review';
    reviewDocument.auditLog.push({
      timestamp: new Date(),
      actor: dto.actor ?? 'soc-analyst',
      action: 'review_updated',
      changes,
    });
    await reviewDocument.save();

    return createSuccessResponse(
      'Analyst review updated.',
      this.mapReviewForResponse(reviewDocument.toObject() as PersistedAnalystReview),
    );
  }

  async confirmByRecommendation(recommendationId: string, dto: AnalystReviewUpdateDto = {}) {
    if (Object.keys(dto).some((key) => key !== 'actor')) {
      await this.updateByRecommendation(recommendationId, dto);
    }

    const reviewDocument = await this.analystReviewModel.findOne({ recommendationId }).exec();

    if (!reviewDocument) {
      throw new NotFoundException(
        `Analyst review for recommendation '${recommendationId}' was not found.`,
      );
    }

    await this.recommendationsService.selectPlaybook(
      reviewDocument.recommendationId,
      reviewDocument.selectedPlaybookId,
    );
    const recommendation = await this.recommendationsService.findRecommendationDataByIdOrThrow(
      reviewDocument.recommendationId,
    );
    const workflowResponse = await this.workflowsService.createFromRecommendation(
      reviewDocument.recommendationId,
      { force: false, autoStart: true },
    );
    const workflowExecution = workflowResponse.data;
    const normalizedAlert = await this.normalizedAlertsService.findNormalizedAlertDataByIdOrThrow(
      workflowExecution.normalizedAlertId,
    );
    await this.incidentsService.createOrUpdateFromWorkflow({
      workflow: workflowExecution,
      normalizedAlert,
      recommendation,
      message:
        'PCAP uploaded, parsed, raw alert generated, normalized, scored, explained, and confirmed by Analyst Review.',
    });
    const approval = await this.approvalRequestModel
      .findOne({ executionId: workflowExecution.executionId, status: ApprovalStatus.PENDING })
      .sort({ requestedAt: 1 })
      .lean()
      .exec();

    reviewDocument.status = 'approval';
    reviewDocument.executionId = workflowExecution.executionId;
    if (approval) {
      reviewDocument.approvalId = approval.approvalId;
    }
    reviewDocument.auditLog.push({
      timestamp: new Date(),
      actor: dto.actor ?? 'soc-analyst',
      action: 'review_confirmed',
      changes: {
        executionId: workflowExecution.executionId,
        approvalId: approval?.approvalId,
        selectedPlaybookId: reviewDocument.selectedPlaybookId,
      },
    });
    await reviewDocument.save();

    return createSuccessResponse('Analyst review confirmed. Approval gate is ready.', {
      review: this.mapReviewForResponse(reviewDocument.toObject() as PersistedAnalystReview),
      workflowExecution,
      approvalRequest: approval
        ? this.mapApprovalForResponse(approval as PersistedApprovalRequest)
        : null,
    });
  }

  async approve(reviewId: string, input: { decidedBy?: string; decisionReason?: string }) {
    const reviewDocument = await this.analystReviewModel.findOne({ reviewId }).exec();

    if (!reviewDocument) {
      throw new NotFoundException(`Analyst review '${reviewId}' was not found.`);
    }

    const approvalId = reviewDocument.approvalId ?? (await this.findPendingApprovalId(reviewDocument));

    if (!approvalId) {
      throw new ConflictException('No pending approval request is linked to this review.');
    }

    const result = await this.workflowsService.approvePendingRequest(approvalId, {
      decidedBy: input.decidedBy ?? 'soc-analyst',
      decisionReason:
        input.decisionReason ?? reviewDocument.analystNote ?? 'Approved after analyst review.',
    });

    reviewDocument.status = 'approved';
    reviewDocument.approvalId = approvalId;
    reviewDocument.executionId = result.workflowExecution.executionId;
    reviewDocument.auditLog.push({
      timestamp: new Date(),
      actor: input.decidedBy ?? 'soc-analyst',
      action: 'approval_approved',
      changes: {
        approvalId,
        executionId: result.workflowExecution.executionId,
      },
    });
    await reviewDocument.save();

    return createSuccessResponse('Approval recorded. Workflow execution resumed.', {
      review: this.mapReviewForResponse(reviewDocument.toObject() as PersistedAnalystReview),
      ...result,
    });
  }

  async reject(reviewId: string, input: { decidedBy?: string; decisionReason?: string }) {
    const reviewDocument = await this.analystReviewModel.findOne({ reviewId }).exec();

    if (!reviewDocument) {
      throw new NotFoundException(`Analyst review '${reviewId}' was not found.`);
    }

    const approvalId = reviewDocument.approvalId ?? (await this.findPendingApprovalId(reviewDocument));

    if (!approvalId) {
      throw new ConflictException('No pending approval request is linked to this review.');
    }

    const result = await this.workflowsService.rejectPendingRequest(approvalId, {
      decidedBy: input.decidedBy ?? 'soc-analyst',
      decisionReason: input.decisionReason ?? 'Rejected after analyst review.',
    });

    reviewDocument.status = 'rejected';
    reviewDocument.approvalId = approvalId;
    reviewDocument.executionId = result.workflowExecution.executionId;
    reviewDocument.auditLog.push({
      timestamp: new Date(),
      actor: input.decidedBy ?? 'soc-analyst',
      action: 'approval_rejected',
      changes: {
        approvalId,
        executionId: result.workflowExecution.executionId,
      },
    });
    await reviewDocument.save();

    return createSuccessResponse('Approval rejected. Workflow execution stopped.', {
      review: this.mapReviewForResponse(reviewDocument.toObject() as PersistedAnalystReview),
      ...result,
    });
  }

  async requestChanges(reviewId: string, input: { actor?: string; reason?: string }) {
    const reviewDocument = await this.analystReviewModel.findOne({ reviewId }).exec();

    if (!reviewDocument) {
      throw new NotFoundException(`Analyst review '${reviewId}' was not found.`);
    }

    reviewDocument.status = 'changes_requested';
    reviewDocument.auditLog.push({
      timestamp: new Date(),
      actor: input.actor ?? 'soc-analyst',
      action: 'changes_requested',
      changes: { reason: input.reason ?? 'Review changes requested before approval.' },
    });
    await reviewDocument.save();

    return createSuccessResponse(
      'Changes requested. Analyst review reopened.',
      this.mapReviewForResponse(reviewDocument.toObject() as PersistedAnalystReview),
    );
  }

  async findReviewByRecommendationOrThrow(recommendationId: string) {
    const review = await this.analystReviewModel
      .findOne({ recommendationId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (!review) {
      throw new NotFoundException(
        `Analyst review for recommendation '${recommendationId}' was not found.`,
      );
    }

    return this.mapReviewForResponse(review as PersistedAnalystReview);
  }

  async findReviewByIdOrThrow(reviewId: string) {
    const review = await this.analystReviewModel.findOne({ reviewId }).lean().exec();

    if (!review) {
      throw new NotFoundException(`Analyst review '${reviewId}' was not found.`);
    }

    return this.mapReviewForResponse(review as PersistedAnalystReview);
  }

  private async findPendingApprovalId(review: AnalystReview) {
    if (!review.executionId) {
      return undefined;
    }

    const approval = await this.approvalRequestModel
      .findOne({ executionId: review.executionId, status: ApprovalStatus.PENDING })
      .sort({ requestedAt: 1 })
      .lean()
      .exec();

    return approval?.approvalId;
  }

  private mapReviewForResponse(review: PersistedAnalystReview) {
    const { createdAt, updatedAt, auditLog, ...rest } = review;

    return {
      ...rest,
      auditLog: auditLog.map((entry) => ({
        ...entry,
        timestamp: entry.timestamp.toISOString(),
      })),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };
  }

  private mapApprovalForResponse(approval: PersistedApprovalRequest): SharedApprovalRequest {
    const { requestedAt, decidedAt, createdAt, updatedAt, ...rest } = approval;

    return {
      ...rest,
      requestedAt: requestedAt.toISOString(),
      ...(decidedAt ? { decidedAt: decidedAt.toISOString() } : {}),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };
  }
}
