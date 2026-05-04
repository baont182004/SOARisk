import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { ApprovalRequest as SharedApprovalRequest } from '@soc-soar/shared';
import type { Model } from 'mongoose';

import {
  createPaginationMeta,
  createSuccessResponse,
} from '../common/api-response.util';
import { ApprovalDecisionDto } from './dto/approval-decision.dto';
import { QueryApprovalsDto } from './dto/query-approvals.dto';
import { ApprovalRequest } from './approval-request.schema';
import { WorkflowsService } from '../workflows/workflows.service';

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
export class ApprovalsService {
  constructor(
    @InjectModel(ApprovalRequest.name)
    private readonly approvalRequestModel: Model<ApprovalRequest>,
    private readonly workflowsService: WorkflowsService,
  ) {}

  async findAll(query: QueryApprovalsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter = {
      ...(query.executionId ? { executionId: query.executionId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.approvalRequestModel
        .find(filter)
        .sort({ requestedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.approvalRequestModel.countDocuments(filter).exec(),
    ]);

    return createSuccessResponse(
      'Approval requests retrieved.',
      items.map((item) =>
        this.mapApprovalRequestForResponse(item as PersistedApprovalRequest),
      ),
      createPaginationMeta({
        count: items.length,
        page,
        limit,
        total,
      }),
    );
  }

  async findOne(approvalId: string) {
    const item = await this.approvalRequestModel.findOne({ approvalId }).lean().exec();

    if (!item) {
      throw new NotFoundException(`Approval request '${approvalId}' was not found.`);
    }

    return createSuccessResponse(
      'Approval request retrieved.',
      this.mapApprovalRequestForResponse(item as PersistedApprovalRequest),
    );
  }

  async approve(approvalId: string, decision: ApprovalDecisionDto) {
    const result = await this.workflowsService.approvePendingRequest(approvalId, decision);

    return createSuccessResponse(
      'Approval recorded. Mock workflow continued with no real external security action.',
      result,
    );
  }

  async reject(approvalId: string, decision: ApprovalDecisionDto) {
    const result = await this.workflowsService.rejectPendingRequest(approvalId, decision);

    return createSuccessResponse(
      'Approval rejected. Workflow cancelled with no real external security action.',
      result,
    );
  }

  private mapApprovalRequestForResponse(
    approvalRequest: PersistedApprovalRequest,
  ): SharedApprovalRequest {
    const { createdAt, updatedAt, requestedAt, decidedAt, ...rest } = approvalRequest;

    return {
      ...rest,
      requestedAt: requestedAt.toISOString(),
      ...(decidedAt ? { decidedAt: decidedAt.toISOString() } : {}),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };
  }
}
