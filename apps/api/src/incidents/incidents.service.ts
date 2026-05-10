import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  IncidentStatus,
  WorkflowExecutionStatus,
  type Incident as SharedIncident,
  type NormalizedAlert,
  type Recommendation,
  type WorkflowExecution,
} from '@soc-soar/shared';
import type { Model } from 'mongoose';

import { createPaginationMeta, createSuccessResponse } from '../common/api-response.util';
import { createMockIncident } from '../common/mock-data';
import { PaginationQueryDto } from '../common/pagination-query.dto';
import { buildFlexibleIdQuery } from '../common/query.util';
import { Incident } from './incident.schema';

type PersistedIncident = Omit<SharedIncident, 'createdAt' | 'updatedAt' | 'timeline'> & {
  timeline: Array<{
    timestamp: Date;
    message: string;
    status: IncidentStatus;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<Incident>,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const [items, total] = await Promise.all([
      this.incidentModel
        .find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.incidentModel.countDocuments().exec(),
    ]);

    return createSuccessResponse(
      'Incidents retrieved. These records track analyst-driven SOAR response activity.',
      items.map((item) => this.mapIncidentForResponse(item as PersistedIncident)),
      createPaginationMeta({
        count: items.length,
        page,
        limit,
        total,
      }),
    );
  }

  async findOne(id: string) {
    const item = await this.incidentModel
      .findOne(buildFlexibleIdQuery(id, 'incidentId'))
      .lean()
      .exec();

    if (!item) {
      throw new NotFoundException(`Incident '${id}' was not found.`);
    }

    return createSuccessResponse(
      'Incident retrieved.',
      this.mapIncidentForResponse(item as PersistedIncident),
    );
  }

  async createMock() {
    const created = await this.incidentModel.create(createMockIncident());

    return createSuccessResponse(
      'Incident created for analyst workflow testing.',
      this.mapIncidentForResponse(created.toObject() as PersistedIncident),
    );
  }

  async createOrUpdateFromWorkflow(input: {
    workflow: WorkflowExecution;
    normalizedAlert: NormalizedAlert;
    recommendation: Recommendation;
    message?: string;
  }) {
    const status = this.mapWorkflowStatusToIncidentStatus(input.workflow.status);
    const message =
      input.message ?? this.buildTimelineMessage(input.workflow.status, input.workflow.executionId);
    const existing = await this.incidentModel
      .findOne({ recommendationId: input.recommendation.recommendationId })
      .exec();

    if (existing) {
      existing.status = status;
      existing.executionId = input.workflow.executionId;
      existing.selectedPlaybookId =
        input.recommendation.selectedPlaybookId ?? input.workflow.playbookId;
      existing.timeline.push({
        timestamp: new Date(),
        message,
        status,
      });
      await existing.save();

      return this.mapIncidentForResponse(existing.toObject() as PersistedIncident);
    }

    const created = await this.incidentModel.create({
      incidentId: this.generateIncidentId(),
      title: this.buildIncidentTitle(input.normalizedAlert),
      status,
      severity: input.normalizedAlert.severity,
      normalizedAlertId: input.normalizedAlert.normalizedAlertId,
      alertId: input.normalizedAlert.alertId,
      selectedPlaybookId: input.recommendation.selectedPlaybookId ?? input.workflow.playbookId,
      recommendationId: input.recommendation.recommendationId,
      executionId: input.workflow.executionId,
      timeline: [
        {
          timestamp: new Date(),
          message,
          status,
        },
      ],
    });

    return this.mapIncidentForResponse(created.toObject() as PersistedIncident);
  }

  async findByWorkflowExecutionId(executionId: string) {
    const item = await this.incidentModel.findOne({ executionId }).lean().exec();

    if (!item) {
      throw new NotFoundException(
        `No incident is linked to workflow execution '${executionId}'.`,
      );
    }

    return this.mapIncidentForResponse(item as PersistedIncident);
  }

  private mapWorkflowStatusToIncidentStatus(status: WorkflowExecutionStatus) {
    switch (status) {
      case WorkflowExecutionStatus.PENDING:
        return IncidentStatus.NEW;
      case WorkflowExecutionStatus.WAITING_APPROVAL:
      case WorkflowExecutionStatus.APPROVED:
      case WorkflowExecutionStatus.RUNNING:
        return IncidentStatus.RESPONDING;
      case WorkflowExecutionStatus.SUCCESS:
        return IncidentStatus.RESOLVED;
      case WorkflowExecutionStatus.CANCELLED:
      case WorkflowExecutionStatus.REJECTED:
        return IncidentStatus.CLOSED;
      case WorkflowExecutionStatus.FAILED:
      default:
        return IncidentStatus.IN_PROGRESS;
    }
  }

  private buildIncidentTitle(normalizedAlert: NormalizedAlert) {
    const target = normalizedAlert.targetIp ?? normalizedAlert.hostname ?? normalizedAlert.assetId;
    return target
      ? `${normalizedAlert.title} (${target})`
      : normalizedAlert.title;
  }

  private buildTimelineMessage(status: WorkflowExecutionStatus, executionId: string) {
    switch (status) {
      case WorkflowExecutionStatus.PENDING:
        return `Incident created from workflow ${executionId}.`;
      case WorkflowExecutionStatus.WAITING_APPROVAL:
        return `Workflow ${executionId} is waiting for analyst approval.`;
      case WorkflowExecutionStatus.SUCCESS:
        return `Workflow ${executionId} completed; incident marked resolved for operational reporting.`;
      case WorkflowExecutionStatus.CANCELLED:
        return `Workflow ${executionId} was cancelled; incident tracking closed.`;
      case WorkflowExecutionStatus.FAILED:
        return `Workflow ${executionId} failed; analyst follow-up is required.`;
      default:
        return `Workflow ${executionId} updated to ${status}.`;
    }
  }

  private mapIncidentForResponse(incident: PersistedIncident): SharedIncident {
    const { createdAt, updatedAt, timeline, ...rest } = incident;

    return {
      ...rest,
      timeline: timeline.map((entry) => ({
        ...entry,
        timestamp: this.toIsoString(entry.timestamp),
      })),
      createdAt: this.toIsoString(createdAt),
      updatedAt: this.toIsoString(updatedAt),
    };
  }

  private toIsoString(value: Date | string | undefined) {
    if (!value) {
      return new Date().toISOString();
    }

    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  private generateIncidentId() {
    return `INC-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
  }
}
