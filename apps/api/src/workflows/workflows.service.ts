import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ApprovalPolicy,
  ApprovalStatus,
  ExecutionLogLevel,
  FORBIDDEN_PLAYBOOK_ACTION_NAMES,
  PlaybookActionType,
  PlaybookStepRisk,
  RecommendationStatus,
  WorkflowExecutionStatus,
  WorkflowStepStatus,
  type ApprovalRequest as SharedApprovalRequest,
  type ExecutionLog as SharedExecutionLog,
  type Playbook,
  type WorkflowExecution as SharedWorkflowExecution,
  type WorkflowStep as SharedWorkflowStep,
} from '@soc-soar/shared';
import type { Model } from 'mongoose';

import { ApprovalDecisionDto } from '../approvals/dto/approval-decision.dto';
import { ApprovalRequest } from '../approvals/approval-request.schema';
import { createPaginationMeta, createSuccessResponse } from '../common/api-response.util';
import { generateIdentifier } from '../common/query.util';
import { IncidentsService } from '../incidents/incidents.service';
import { NormalizedAlertsService } from '../normalized-alerts/normalized-alerts.service';
import { PlaybooksService } from '../playbooks/playbooks.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { ReportsService } from '../reports/reports.service';
import { CreateWorkflowQueryDto } from './dto/create-workflow-query.dto';
import { QueryWorkflowsDto } from './dto/query-workflows.dto';
import { ExecutionLog } from './execution-log.schema';
import { WorkflowExecution, type WorkflowExecutionDocument } from './workflow-execution.schema';

type PersistedWorkflowStep = Omit<SharedWorkflowStep, 'startedAt' | 'finishedAt'> & {
  startedAt?: Date;
  finishedAt?: Date;
};

type PersistedWorkflowExecution = Omit<
  SharedWorkflowExecution,
  'steps' | 'startedAt' | 'finishedAt' | 'createdAt' | 'updatedAt'
> & {
  steps: PersistedWorkflowStep[];
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

type PersistedExecutionLog = Omit<SharedExecutionLog, 'createdAt'> & {
  createdAt: Date;
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
export class WorkflowsService {
  constructor(
    @InjectModel(WorkflowExecution.name)
    private readonly workflowExecutionModel: Model<WorkflowExecution>,
    @InjectModel(ExecutionLog.name)
    private readonly executionLogModel: Model<ExecutionLog>,
    @InjectModel(ApprovalRequest.name)
    private readonly approvalRequestModel: Model<ApprovalRequest>,
    private readonly recommendationsService: RecommendationsService,
    private readonly playbooksService: PlaybooksService,
    private readonly normalizedAlertsService: NormalizedAlertsService,
    private readonly incidentsService: IncidentsService,
    private readonly reportsService: ReportsService,
  ) {}

  async findAll(query: QueryWorkflowsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const filter = {
      ...(query.recommendationId ? { recommendationId: query.recommendationId } : {}),
      ...(query.playbookId ? { playbookId: query.playbookId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.workflowExecutionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.workflowExecutionModel.countDocuments(filter).exec(),
    ]);

    return createSuccessResponse(
      'Workflow executions retrieved.',
      items.map((item) => this.mapWorkflowExecutionForResponse(item as PersistedWorkflowExecution)),
      createPaginationMeta({
        count: items.length,
        page,
        limit,
        total,
      }),
    );
  }

  async findOne(executionId: string) {
    const item = await this.findWorkflowExecutionDataByIdOrThrow(executionId);

    return createSuccessResponse('Workflow execution retrieved.', item);
  }

  async createFromRecommendation(recommendationId: string, query: CreateWorkflowQueryDto) {
    const force = query.force === true;
    const autoStart = query.autoStart === true;
    const existing = await this.workflowExecutionModel
      .findOne({ recommendationId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (existing && !force) {
      if (autoStart) {
        return this.start(
          existing.executionId,
          'Existing workflow execution resumed from selected recommendation.',
        );
      }

      return createSuccessResponse(
        'Existing workflow execution returned. Pass force=true to create a new workflow instance from this recommendation.',
        this.mapWorkflowExecutionForResponse(existing as PersistedWorkflowExecution),
      );
    }

    const recommendation =
      await this.recommendationsService.findRecommendationDataByIdOrThrow(recommendationId);

    if (recommendation.status !== RecommendationStatus.SELECTED) {
      throw new BadRequestException(
        `Recommendation '${recommendationId}' must be in selected status before a workflow can be created.`,
      );
    }

    if (!recommendation.selectedPlaybookId) {
      throw new BadRequestException(
        `Recommendation '${recommendationId}' does not have a selectedPlaybookId.`,
      );
    }

    const playbook = await this.playbooksService.findPlaybookDataByIdOrThrow(
      recommendation.selectedPlaybookId,
    );
    const created = await this.workflowExecutionModel.create({
      executionId: generateIdentifier('WF'),
      recommendationId: recommendation.recommendationId,
      normalizedAlertId: recommendation.normalizedAlertId,
      alertId: recommendation.alertId,
      playbookId: playbook.playbookId,
      status: WorkflowExecutionStatus.PENDING,
      currentStep: playbook.actions[0]?.step ?? 1,
      steps: playbook.actions.map((action) =>
        this.mapPlaybookActionToWorkflowStep(action, playbook),
      ),
    });

    await this.createExecutionLog({
      executionId: created.executionId,
      level: ExecutionLogLevel.INFO,
      message: `Workflow execution was created from recommendation ${recommendationId} and selected playbook ${playbook.playbookId}.`,
    });

    const createdWorkflow = this.mapWorkflowExecutionForResponse(
      created.toObject() as PersistedWorkflowExecution,
    );
    const normalizedAlert =
      await this.normalizedAlertsService.findNormalizedAlertDataByIdOrThrow(
        recommendation.normalizedAlertId,
      );
    await this.incidentsService.createOrUpdateFromWorkflow({
      workflow: createdWorkflow,
      normalizedAlert,
      recommendation,
      message: `Incident tracking opened from selected recommendation ${recommendationId}.`,
    });

    if (autoStart) {
      return this.start(
        created.executionId,
        'Workflow execution created and started from the selected recommendation.',
      );
    }

    return createSuccessResponse(
      'Workflow execution created from selected recommendation. Execution has not started yet.',
      this.mapWorkflowExecutionForResponse(created.toObject() as PersistedWorkflowExecution),
    );
  }

  async start(executionId: string, successMessage?: string) {
    const execution = await this.findWorkflowExecutionDocumentByIdOrThrow(executionId);
    const pendingApproval = await this.approvalRequestModel
      .findOne({
        executionId,
        status: ApprovalStatus.PENDING,
      })
      .lean()
      .exec();

    if (execution.status === WorkflowExecutionStatus.SUCCESS) {
      throw new ConflictException(`Workflow '${executionId}' has already completed successfully.`);
    }

    if (execution.status === WorkflowExecutionStatus.CANCELLED) {
      throw new ConflictException(`Workflow '${executionId}' has already been cancelled.`);
    }

    if (execution.status === WorkflowExecutionStatus.FAILED) {
      throw new ConflictException(`Workflow '${executionId}' has already failed.`);
    }

    if (pendingApproval) {
      execution.status = WorkflowExecutionStatus.WAITING_APPROVAL;
      await execution.save();

      return createSuccessResponse(
        'Workflow execution is waiting for analyst approval before it can continue.',
        this.mapWorkflowExecutionForResponse(execution.toObject() as PersistedWorkflowExecution),
      );
    }

    await this.createExecutionLog({
      executionId: execution.executionId,
      level: ExecutionLogLevel.INFO,
      message:
        execution.startedAt === undefined
          ? 'Workflow execution started.'
          : 'Workflow execution resumed.',
    });

    const updatedExecution = await this.runWorkflowExecution(execution);

    return createSuccessResponse(
      successMessage ?? this.buildWorkflowProgressMessage(updatedExecution.status),
      this.mapWorkflowExecutionForResponse(
        updatedExecution.toObject() as PersistedWorkflowExecution,
      ),
    );
  }

  async cancel(executionId: string) {
    const execution = await this.findWorkflowExecutionDocumentByIdOrThrow(executionId);

    if (
      execution.status === WorkflowExecutionStatus.SUCCESS ||
      execution.status === WorkflowExecutionStatus.FAILED ||
      execution.status === WorkflowExecutionStatus.CANCELLED
    ) {
      throw new ConflictException(
        `Workflow '${executionId}' is already in terminal status '${execution.status}'.`,
      );
    }

    execution.status = WorkflowExecutionStatus.CANCELLED;
    execution.finishedAt = new Date();
    await execution.save();

    const cancellationTime = new Date();
    await this.approvalRequestModel
      .updateMany(
        { executionId, status: ApprovalStatus.PENDING },
        {
          $set: {
            status: ApprovalStatus.REJECTED,
            decidedAt: cancellationTime,
            decidedBy: 'system',
            decisionReason: 'Workflow cancelled before approval decision.',
          },
        },
      )
      .exec();

    await this.createExecutionLog({
      executionId,
      level: ExecutionLogLevel.WARNING,
      message: 'Workflow execution was cancelled by operator request.',
    });
    await this.syncIncidentAndReport(execution);

    return createSuccessResponse(
      'Workflow execution cancelled.',
      this.mapWorkflowExecutionForResponse(execution.toObject() as PersistedWorkflowExecution),
    );
  }

  async findLogs(executionId: string) {
    await this.findWorkflowExecutionDocumentByIdOrThrow(executionId);

    const logs = await this.executionLogModel
      .find({ executionId })
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    return createSuccessResponse(
      'Workflow execution logs retrieved.',
      logs.map((log) => this.mapExecutionLogForResponse(log as PersistedExecutionLog)),
      { count: logs.length },
    );
  }

  async approvePendingRequest(approvalId: string, decision: ApprovalDecisionDto) {
    const approvalRequest = await this.findApprovalRequestDocumentByIdOrThrow(approvalId);

    if (approvalRequest.status !== ApprovalStatus.PENDING) {
      throw new ConflictException(
        `Approval request '${approvalId}' is already '${approvalRequest.status}'.`,
      );
    }

    const execution = await this.findWorkflowExecutionDocumentByIdOrThrow(
      approvalRequest.executionId,
    );
    const step = this.findWorkflowStepOrThrow(execution, approvalRequest.step);

    approvalRequest.status = ApprovalStatus.APPROVED;
    approvalRequest.decidedAt = new Date();
    if (decision.decidedBy) {
      approvalRequest.decidedBy = decision.decidedBy;
    }
    if (decision.decisionReason) {
      approvalRequest.decisionReason = decision.decisionReason;
    }
    await approvalRequest.save();

    step.approvalStatus = ApprovalStatus.APPROVED;
    step.status = WorkflowStepStatus.APPROVED;
    step.finishedAt = new Date();
    step.result = 'Analyst approval recorded. Workflow execution may continue.';
    execution.status = WorkflowExecutionStatus.APPROVED;
    execution.currentStep = step.step;
    if (!execution.startedAt) {
      execution.startedAt = new Date();
    }
    await execution.save();

    await this.createExecutionLog({
      executionId: execution.executionId,
      step: step.step,
      action: step.action,
      level: ExecutionLogLevel.INFO,
      message: `Analyst approval recorded for step ${step.step} ${step.action}. Response workflow will continue.`,
    });

    const updatedExecution = await this.runWorkflowExecution(execution);

    return {
      approvalRequest: this.mapApprovalRequestForResponse(
        approvalRequest.toObject() as PersistedApprovalRequest,
      ),
      workflowExecution: this.mapWorkflowExecutionForResponse(
        updatedExecution.toObject() as PersistedWorkflowExecution,
      ),
    };
  }

  async rejectPendingRequest(approvalId: string, decision: ApprovalDecisionDto) {
    const approvalRequest = await this.findApprovalRequestDocumentByIdOrThrow(approvalId);

    if (approvalRequest.status !== ApprovalStatus.PENDING) {
      throw new ConflictException(
        `Approval request '${approvalId}' is already '${approvalRequest.status}'.`,
      );
    }

    const execution = await this.findWorkflowExecutionDocumentByIdOrThrow(
      approvalRequest.executionId,
    );
    const step = this.findWorkflowStepOrThrow(execution, approvalRequest.step);

    approvalRequest.status = ApprovalStatus.REJECTED;
    approvalRequest.decidedAt = new Date();
    if (decision.decidedBy) {
      approvalRequest.decidedBy = decision.decidedBy;
    }
    if (decision.decisionReason) {
      approvalRequest.decisionReason = decision.decisionReason;
    }
    await approvalRequest.save();

    step.approvalStatus = ApprovalStatus.REJECTED;
    step.status = WorkflowStepStatus.REJECTED;
    step.finishedAt = new Date();
    step.result = 'Approval request rejected by analyst. Workflow execution stopped.';
    execution.status = WorkflowExecutionStatus.CANCELLED;
    execution.currentStep = step.step;
    execution.finishedAt = new Date();
    if (!execution.startedAt) {
      execution.startedAt = new Date();
    }
    await execution.save();

    await this.createExecutionLog({
      executionId: execution.executionId,
      step: step.step,
      action: step.action,
      level: ExecutionLogLevel.WARNING,
      message: `Analyst rejected step ${step.step} ${step.action}. Workflow execution was cancelled with no real external action.`,
    });
    await this.syncIncidentAndReport(execution);

    return {
      approvalRequest: this.mapApprovalRequestForResponse(
        approvalRequest.toObject() as PersistedApprovalRequest,
      ),
      workflowExecution: this.mapWorkflowExecutionForResponse(
        execution.toObject() as PersistedWorkflowExecution,
      ),
    };
  }

  async findWorkflowExecutionDataByIdOrThrow(executionId: string) {
    const execution = await this.workflowExecutionModel.findOne({ executionId }).lean().exec();

    if (!execution) {
      throw new NotFoundException(`Workflow execution '${executionId}' was not found.`);
    }

    return this.mapWorkflowExecutionForResponse(execution as PersistedWorkflowExecution);
  }

  async findWorkflowExecutionDocumentByIdOrThrow(executionId: string) {
    const execution = await this.workflowExecutionModel.findOne({ executionId }).exec();

    if (!execution) {
      throw new NotFoundException(`Workflow execution '${executionId}' was not found.`);
    }

    return execution;
  }

  mockStart() {
    return createSuccessResponse(
      'Legacy workflow start endpoint is deprecated. Use POST /workflows/from-recommendation/:recommendationId and POST /workflows/:executionId/start instead.',
      {
        deprecated: true,
        recommendedCreateEndpoint: '/workflows/from-recommendation/:recommendationId',
        recommendedStartEndpoint: '/workflows/:executionId/start',
      },
    );
  }

  private async runWorkflowExecution(execution: WorkflowExecutionDocument) {
    if (!execution.startedAt) {
      execution.startedAt = new Date();
    }

    for (const [index, step] of execution.steps.entries()) {
      const nextStep = execution.steps[index + 1];

      if (
        step.status === WorkflowStepStatus.SUCCESS ||
        step.status === WorkflowStepStatus.SKIPPED ||
        step.status === WorkflowStepStatus.APPROVED
      ) {
        execution.currentStep = nextStep?.step ?? step.step;
        continue;
      }

      if (step.status === WorkflowStepStatus.REJECTED) {
        execution.status = WorkflowExecutionStatus.CANCELLED;
        execution.finishedAt = execution.finishedAt ?? new Date();
        await execution.save();
        await this.syncIncidentAndReport(execution);
        return execution;
      }

      if (step.status === WorkflowStepStatus.FAILED) {
        execution.status = WorkflowExecutionStatus.FAILED;
        execution.finishedAt = execution.finishedAt ?? new Date();
        await execution.save();
        await this.syncIncidentAndReport(execution);
        return execution;
      }

      execution.currentStep = step.step;

      if (this.isForbiddenAction(step.action)) {
        await this.failWorkflowStep(
          execution,
          step,
          `Forbidden direct action '${step.action}' cannot be executed in the SOAR prototype.`,
        );
        return execution;
      }

      if (step.approvalRequired) {
        step.status = WorkflowStepStatus.WAITING_APPROVAL;
        step.approvalStatus = ApprovalStatus.PENDING;
        execution.status = WorkflowExecutionStatus.WAITING_APPROVAL;
        await execution.save();

        await this.ensureApprovalRequest(execution, step.step, step.action, step.risk);
        await this.createExecutionLog({
          executionId: execution.executionId,
          step: step.step,
          action: step.action,
          level: ExecutionLogLevel.WARNING,
          message: `Workflow paused for analyst approval at step ${step.step} ${step.action}.`,
        });
        await this.syncIncidentAndReport(execution);

        return execution;
      }

      execution.status = WorkflowExecutionStatus.RUNNING;
      step.status = WorkflowStepStatus.RUNNING;
      step.startedAt = step.startedAt ?? new Date();
      await execution.save();

      await this.createExecutionLog({
        executionId: execution.executionId,
        step: step.step,
        action: step.action,
        level: ExecutionLogLevel.INFO,
        message: `Started step ${step.step} ${step.action}.`,
      });

      step.status = WorkflowStepStatus.SUCCESS;
      step.finishedAt = new Date();
      step.result = this.buildMockStepResult(step.action);
      execution.currentStep = nextStep?.step ?? step.step;
      await execution.save();

      await this.createExecutionLog({
        executionId: execution.executionId,
        step: step.step,
        action: step.action,
        level: ExecutionLogLevel.INFO,
        message: `Completed step ${step.step} ${step.action}: ${step.result}`,
      });
    }

    execution.status = WorkflowExecutionStatus.SUCCESS;
    execution.finishedAt = new Date();
    execution.currentStep = execution.steps.at(-1)?.step ?? execution.currentStep;
    await execution.save();

    await this.createExecutionLog({
      executionId: execution.executionId,
      level: ExecutionLogLevel.INFO,
      message: 'Workflow execution completed successfully.',
    });
    await this.syncIncidentAndReport(execution);

    return execution;
  }

  private async syncIncidentAndReport(execution: WorkflowExecutionDocument) {
    const workflow = this.mapWorkflowExecutionForResponse(
      execution.toObject() as PersistedWorkflowExecution,
    );
    const [recommendation, normalizedAlert] = await Promise.all([
      this.recommendationsService.findRecommendationDataByIdOrThrow(workflow.recommendationId),
      this.normalizedAlertsService.findNormalizedAlertDataByIdOrThrow(workflow.normalizedAlertId),
    ]);
    const incident = await this.incidentsService.createOrUpdateFromWorkflow({
      workflow,
      normalizedAlert,
      recommendation,
    });

    if (
      workflow.status === WorkflowExecutionStatus.SUCCESS ||
      workflow.status === WorkflowExecutionStatus.CANCELLED ||
      workflow.status === WorkflowExecutionStatus.FAILED
    ) {
      await this.reportsService.generateFromWorkflow({
        incident,
        workflow,
        normalizedAlert,
        recommendation,
      });
    }
  }

  private mapPlaybookActionToWorkflowStep(action: Playbook['actions'][number], playbook: Playbook) {
    const approvalRequired = this.requiresApproval(action, playbook);

    return {
      step: action.step,
      action: action.action,
      type: action.type,
      description: action.description,
      approvalRequired,
      approvalStatus: approvalRequired ? ApprovalStatus.PENDING : ApprovalStatus.NOT_REQUIRED,
      risk: action.risk,
      mockOnly: action.mockOnly,
      status: WorkflowStepStatus.PENDING,
    };
  }

  private requiresApproval(action: Playbook['actions'][number], playbook: Playbook) {
    if (playbook.approvalPolicy === ApprovalPolicy.REQUIRED_FOR_ALL_ACTIONS) {
      return true;
    }

    return (
      action.approvalRequired ||
      action.type === PlaybookActionType.CONTAINMENT ||
      action.risk === PlaybookStepRisk.SENSITIVE
    );
  }

  private isForbiddenAction(action: string) {
    return FORBIDDEN_PLAYBOOK_ACTION_NAMES.includes(
      action as (typeof FORBIDDEN_PLAYBOOK_ACTION_NAMES)[number],
    );
  }

  private async ensureApprovalRequest(
    execution: WorkflowExecutionDocument,
    step: number,
    action: string,
    risk: SharedWorkflowStep['risk'],
  ) {
    const existing = await this.approvalRequestModel
      .findOne({ executionId: execution.executionId, step })
      .exec();

    if (existing) {
      return existing;
    }

    return this.approvalRequestModel.create({
      approvalId: generateIdentifier('APR'),
      executionId: execution.executionId,
      step,
      action,
      risk,
      status: ApprovalStatus.PENDING,
      requestedAt: new Date(),
    });
  }

  private async failWorkflowStep(
    execution: WorkflowExecutionDocument,
    step: WorkflowExecutionDocument['steps'][number],
    reason: string,
  ) {
    step.status = WorkflowStepStatus.FAILED;
    step.finishedAt = new Date();
    step.result = reason;
    execution.status = WorkflowExecutionStatus.FAILED;
    execution.finishedAt = new Date();
    await execution.save();

    await this.createExecutionLog({
      executionId: execution.executionId,
      step: step.step,
      action: step.action,
      level: ExecutionLogLevel.ERROR,
      message: reason,
    });
    await this.syncIncidentAndReport(execution);
  }

  private async createExecutionLog(input: {
    executionId: string;
    step?: number;
    action?: string;
    level: ExecutionLogLevel;
    message: string;
  }) {
    await this.executionLogModel.create({
      logId: generateIdentifier('LOG'),
      executionId: input.executionId,
      ...(input.step !== undefined ? { step: input.step } : {}),
      ...(input.action ? { action: input.action } : {}),
      level: input.level,
      message: input.message,
    });
  }

  private findWorkflowStepOrThrow(execution: WorkflowExecutionDocument, stepNumber: number) {
    const step = execution.steps.find((entry) => entry.step === stepNumber);

    if (!step) {
      throw new NotFoundException(
        `Workflow execution '${execution.executionId}' does not contain step ${stepNumber}.`,
      );
    }

    return step;
  }

  private async findApprovalRequestDocumentByIdOrThrow(approvalId: string) {
    const approvalRequest = await this.approvalRequestModel.findOne({ approvalId }).exec();

    if (!approvalRequest) {
      throw new NotFoundException(`Approval request '${approvalId}' was not found.`);
    }

    return approvalRequest;
  }

  private buildMockStepResult(action: string) {
    if (action === 'create_incident') {
      return 'Incident anchor created.';
    }

    if (action.startsWith('enrich_')) {
      return `Enrichment completed for ${this.humanizeActionSuffix(action.slice('enrich_'.length))}.`;
    }

    if (action.startsWith('check_')) {
      return `${this.humanizeActionSuffix(action.slice('check_'.length))} check completed.`;
    }

    if (action.startsWith('identify_')) {
      return `Identification completed for ${this.humanizeActionSuffix(action.slice('identify_'.length))}.`;
    }

    if (action.startsWith('review_')) {
      return `Evidence review completed for ${this.humanizeActionSuffix(action.slice('review_'.length))}.`;
    }

    if (action.startsWith('investigate_')) {
      return `Investigation completed for ${this.humanizeActionSuffix(action.slice('investigate_'.length))}.`;
    }

    if (action.startsWith('recommend_')) {
      return `Recommendation recorded for ${this.humanizeActionSuffix(action.slice('recommend_'.length))}.`;
    }

    if (action.startsWith('mock_notify_')) {
      return `Notification drafted for ${this.humanizeActionSuffix(action.slice('mock_notify_'.length))}.`;
    }

    if (action === 'generate_response_summary') {
      return 'Response summary generated.';
    }

    return 'Workflow step completed.';
  }

  private humanizeActionSuffix(value: string) {
    return value.replace(/_/g, ' ');
  }

  private buildWorkflowProgressMessage(status: WorkflowExecutionStatus) {
    switch (status) {
      case WorkflowExecutionStatus.WAITING_APPROVAL:
        return 'Workflow execution paused pending analyst approval.';
      case WorkflowExecutionStatus.SUCCESS:
        return 'Workflow execution completed successfully.';
      case WorkflowExecutionStatus.CANCELLED:
        return 'Workflow execution cancelled.';
      case WorkflowExecutionStatus.FAILED:
        return 'Workflow execution failed.';
      default:
        return 'Workflow execution updated.';
    }
  }

  private mapWorkflowExecutionForResponse(
    execution: PersistedWorkflowExecution,
  ): SharedWorkflowExecution {
    const { createdAt, updatedAt, startedAt, finishedAt, steps, ...rest } = execution;

    return {
      ...rest,
      steps: steps.map((step) => this.mapWorkflowStepForResponse(step)),
      ...(startedAt ? { startedAt: startedAt.toISOString() } : {}),
      ...(finishedAt ? { finishedAt: finishedAt.toISOString() } : {}),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };
  }

  private mapWorkflowStepForResponse(step: PersistedWorkflowStep): SharedWorkflowStep {
    const { startedAt, finishedAt, ...rest } = step;

    return {
      ...rest,
      ...(startedAt ? { startedAt: startedAt.toISOString() } : {}),
      ...(finishedAt ? { finishedAt: finishedAt.toISOString() } : {}),
    };
  }

  private mapExecutionLogForResponse(log: PersistedExecutionLog): SharedExecutionLog {
    const { createdAt, ...rest } = log;

    return {
      ...rest,
      createdAt: createdAt.toISOString(),
    };
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
