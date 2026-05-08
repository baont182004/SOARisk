import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  WorkflowExecutionStatus,
  type ApprovalRequest as SharedApprovalRequest,
  type ExecutionLog as SharedExecutionLog,
  type Incident as SharedIncident,
  type NormalizedAlert,
  type Recommendation,
  type RecommendationExplanation,
  type Report as SharedReport,
  type WorkflowExecution,
} from '@soc-soar/shared';
import type { Model } from 'mongoose';

import { ApprovalRequest } from '../approvals/approval-request.schema';
import { createCollectionMeta, createSuccessResponse } from '../common/api-response.util';
import { createMockReport } from '../common/mock-data';
import { RecommendationExplanation as RecommendationExplanationSchemaClass } from '../explanations/explanation.schema';
import { Incident } from '../incidents/incident.schema';
import { NormalizedAlert as NormalizedAlertSchemaClass } from '../normalized-alerts/normalized-alert.schema';
import { Recommendation as RecommendationSchemaClass } from '../recommendations/recommendation.schema';
import { ExecutionLog } from '../workflows/execution-log.schema';
import { WorkflowExecution as WorkflowExecutionSchemaClass } from '../workflows/workflow-execution.schema';
import { Report } from './report.schema';

type PersistedReport = Omit<SharedReport, 'createdAt'> & {
  createdAt: Date;
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<Report>,
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<Incident>,
    @InjectModel(NormalizedAlertSchemaClass.name)
    private readonly normalizedAlertModel: Model<NormalizedAlertSchemaClass>,
    @InjectModel(RecommendationSchemaClass.name)
    private readonly recommendationModel: Model<RecommendationSchemaClass>,
    @InjectModel(RecommendationExplanationSchemaClass.name)
    private readonly explanationModel: Model<RecommendationExplanationSchemaClass>,
    @InjectModel(WorkflowExecutionSchemaClass.name)
    private readonly workflowExecutionModel: Model<WorkflowExecutionSchemaClass>,
    @InjectModel(ExecutionLog.name)
    private readonly executionLogModel: Model<ExecutionLog>,
    @InjectModel(ApprovalRequest.name)
    private readonly approvalRequestModel: Model<ApprovalRequest>,
  ) {}

  async findAll() {
    const items = await this.reportModel.find().sort({ createdAt: -1 }).lean().exec();

    return createSuccessResponse(
      'Reports retrieved. These summarize SOAR workflow outcomes for analyst review.',
      items.map((item) => this.mapReportForResponse(item as PersistedReport)),
      createCollectionMeta(items.length),
    );
  }

  async findOne(reportId: string) {
    const item = await this.reportModel.findOne({ reportId }).lean().exec();

    if (!item) {
      throw new NotFoundException(`Report '${reportId}' was not found.`);
    }

    return createSuccessResponse(
      'Report retrieved.',
      this.mapReportForResponse(item as PersistedReport),
    );
  }

  async createMock() {
    const created = await this.reportModel.create(createMockReport());

    return createSuccessResponse(
      'Mock report created. Real report generation will be added in a later phase.',
      this.mapReportForResponse(created.toObject() as PersistedReport),
    );
  }

  async generateFromWorkflow(input: {
    incident: SharedIncident;
    workflow: WorkflowExecution;
    normalizedAlert: NormalizedAlert;
    recommendation: Recommendation;
  }) {
    const existing = await this.reportModel
      .findOne({ executionId: input.workflow.executionId })
      .lean()
      .exec();

    if (existing) {
      return this.mapReportForResponse(existing as PersistedReport);
    }

    const created = await this.reportModel.create({
      reportId: this.generateReportId(),
      incidentId: input.incident.incidentId,
      executionId: input.workflow.executionId,
      alertSummary: this.buildAlertSummary(input.normalizedAlert),
      playbookSummary: this.buildPlaybookSummary(input.recommendation, input.workflow),
      recommendationSummary: this.buildRecommendationSummary(input.recommendation),
      executionSummary: this.buildExecutionSummary(input.workflow),
      finalStatus: input.incident.status,
    });

    return this.mapReportForResponse(created.toObject() as PersistedReport);
  }

  async generateFromWorkflowExecutionId(executionId: string) {
    const workflow = await this.workflowExecutionModel.findOne({ executionId }).lean().exec();

    if (!workflow) {
      throw new NotFoundException(`Workflow execution '${executionId}' was not found.`);
    }

    const [incident, normalizedAlert, recommendation] = await Promise.all([
      this.incidentModel.findOne({ executionId }).lean().exec(),
      this.normalizedAlertModel
        .findOne({ normalizedAlertId: workflow.normalizedAlertId })
        .lean()
        .exec(),
      this.recommendationModel
        .findOne({ recommendationId: workflow.recommendationId })
        .lean()
        .exec(),
    ]);

    if (!incident) {
      throw new NotFoundException(
        `No incident is linked to workflow execution '${executionId}'.`,
      );
    }

    if (!normalizedAlert) {
      throw new NotFoundException(
        `Normalized alert '${workflow.normalizedAlertId}' was not found.`,
      );
    }

    if (!recommendation) {
      throw new NotFoundException(
        `Recommendation '${workflow.recommendationId}' was not found.`,
      );
    }

    const report = await this.generateFromWorkflow({
      incident: this.mapIncidentDocument(incident),
      workflow: this.mapWorkflowDocument(workflow),
      normalizedAlert: this.mapNormalizedAlertDocument(normalizedAlert),
      recommendation: this.mapRecommendationDocument(recommendation),
    });

    return createSuccessResponse(
      'Report generated from workflow execution.',
      report,
    );
  }

  async exportReport(reportId: string, format: 'markdown' | 'html') {
    const report = await this.reportModel.findOne({ reportId }).lean().exec();

    if (!report) {
      throw new NotFoundException(`Report '${reportId}' was not found.`);
    }

    const exportContext = await this.buildExportContext(report as PersistedReport);
    const markdown = this.buildMarkdownExport(exportContext);
    const content = format === 'html' ? this.markdownToHtml(markdown) : markdown;

    return createSuccessResponse('Report export generated.', {
      reportId,
      format,
      filename: `${reportId}.${format === 'html' ? 'html' : 'md'}`,
      contentType: format === 'html' ? 'text/html' : 'text/markdown',
      content,
    });
  }

  private async buildExportContext(report: PersistedReport) {
    const [incident, workflow, normalizedAlert, recommendation] = await Promise.all([
      this.incidentModel.findOne({ incidentId: report.incidentId }).lean().exec(),
      report.executionId
        ? this.workflowExecutionModel.findOne({ executionId: report.executionId }).lean().exec()
        : null,
      this.incidentModel
        .findOne({ incidentId: report.incidentId })
        .lean()
        .then((item) =>
          item
            ? this.normalizedAlertModel
                .findOne({ normalizedAlertId: item.normalizedAlertId })
                .lean()
                .exec()
            : null,
        ),
      this.incidentModel
        .findOne({ incidentId: report.incidentId })
        .lean()
        .then((item) =>
          item?.recommendationId
            ? this.recommendationModel
                .findOne({ recommendationId: item.recommendationId })
                .lean()
                .exec()
            : null,
        ),
    ]);
    const [explanation, logs, approvals] = await Promise.all([
      recommendation
        ? this.explanationModel
            .findOne({ recommendationId: recommendation.recommendationId })
            .sort({ createdAt: -1 })
            .lean()
            .exec()
        : null,
      workflow
        ? this.executionLogModel
            .find({ executionId: workflow.executionId })
            .sort({ createdAt: 1 })
            .lean()
            .exec()
        : [],
      workflow
        ? this.approvalRequestModel
            .find({ executionId: workflow.executionId })
            .sort({ requestedAt: 1 })
            .lean()
            .exec()
        : [],
    ]);

    return {
      report: this.mapReportForResponse(report),
      incident: incident ? this.mapIncidentDocument(incident) : null,
      normalizedAlert: normalizedAlert ? this.mapNormalizedAlertDocument(normalizedAlert) : null,
      recommendation: recommendation ? this.mapRecommendationDocument(recommendation) : null,
      explanation: explanation ? (explanation as unknown as RecommendationExplanation) : null,
      workflow: workflow ? this.mapWorkflowDocument(workflow) : null,
      logs: logs as unknown as SharedExecutionLog[],
      approvals: approvals as unknown as SharedApprovalRequest[],
      generatedAt: new Date().toISOString(),
    };
  }

  private buildAlertSummary(normalizedAlert: NormalizedAlert) {
    const observables = [
      normalizedAlert.sourceIp ? `source ${normalizedAlert.sourceIp}` : undefined,
      normalizedAlert.targetIp ? `target ${normalizedAlert.targetIp}` : undefined,
      normalizedAlert.protocol ? `protocol ${normalizedAlert.protocol}` : undefined,
    ].filter(Boolean);

    return `${normalizedAlert.alertType} alert '${normalizedAlert.title}' normalized with severity ${normalizedAlert.severity} and confidence ${normalizedAlert.confidence}. ${observables.join(', ') || 'No network observable was available.'}`;
  }

  private buildPlaybookSummary(recommendation: Recommendation, workflow: WorkflowExecution) {
    const selected = recommendation.topPlaybooks.find(
      (playbook) => playbook.playbookId === workflow.playbookId,
    );

    return selected
      ? `${selected.playbookId} ${selected.name} was selected with score ${selected.totalScore} and automation level ${selected.automationLevel}.`
      : `${workflow.playbookId} was selected for workflow execution.`;
  }

  private buildRecommendationSummary(recommendation: Recommendation) {
    const top = recommendation.topPlaybooks
      .slice(0, 3)
      .map((playbook) => `${playbook.rank}. ${playbook.playbookId} (${playbook.totalScore})`)
      .join('; ');

    return `Top-${recommendation.topPlaybooks.length} recommendation generated for ${recommendation.alertType}. Candidates: ${top}. Selected playbook: ${recommendation.selectedPlaybookId ?? 'not selected'}.`;
  }

  private buildExecutionSummary(workflow: WorkflowExecution) {
    const completed = workflow.steps.filter((step) => step.status === 'success').length;
    const approvals = workflow.steps.filter((step) => step.approvalRequired).length;
    const terminalNote =
      workflow.status === WorkflowExecutionStatus.SUCCESS
        ? 'Workflow completed successfully.'
        : `Workflow ended with status ${workflow.status}.`;

    return `${terminalNote} ${completed}/${workflow.steps.length} steps completed. ${approvals} step(s) required analyst approval. All actions were mock-only.`;
  }

  private mapReportForResponse(report: PersistedReport): SharedReport {
    const { createdAt, ...rest } = report;

    return {
      ...rest,
      createdAt: this.toIsoString(createdAt),
    };
  }

  private toIsoString(value: Date | string | undefined) {
    if (!value) {
      return new Date().toISOString();
    }

    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  private buildMarkdownExport(context: Awaited<ReturnType<ReportsService['buildExportContext']>>) {
    const lines = [
      `# SOAR Incident Report ${context.report.reportId}`,
      '',
      `Generated at: ${context.generatedAt}`,
      '',
      '## Incident Information',
      `- Incident ID: ${context.incident?.incidentId ?? context.report.incidentId}`,
      `- Status: ${context.incident?.status ?? context.report.finalStatus}`,
      `- Severity: ${context.incident?.severity ?? 'n/a'}`,
      `- Selected Playbook: ${context.incident?.selectedPlaybookId ?? 'n/a'}`,
      `- Workflow Execution: ${context.workflow?.executionId ?? context.report.executionId ?? 'n/a'}`,
      '',
      '## Alert Summary',
      context.report.alertSummary,
      '',
      '## Normalized Alert',
      context.normalizedAlert
        ? [
            `- Normalized Alert ID: ${context.normalizedAlert.normalizedAlertId}`,
            `- Alert Type: ${context.normalizedAlert.alertType}`,
            `- Severity: ${context.normalizedAlert.severity}`,
            `- Confidence: ${context.normalizedAlert.confidence}`,
            `- Source IP: ${context.normalizedAlert.sourceIp ?? 'n/a'}`,
            `- Target IP: ${context.normalizedAlert.targetIp ?? 'n/a'}`,
            `- Protocol: ${context.normalizedAlert.protocol ?? 'n/a'}`,
          ].join('\n')
        : 'Normalized alert detail was not found.',
      '',
      '## Selected Playbook',
      context.report.playbookSummary,
      '',
      '## Recommendation Explanation',
      context.explanation?.summary ?? context.report.recommendationSummary,
      '',
      '## Workflow Execution Logs',
      context.logs.length > 0
        ? context.logs
            .map(
              (log) =>
                `- ${log.createdAt ? new Date(log.createdAt).toISOString() : 'n/a'} [${log.level}] ${log.step ? `step ${log.step} ` : ''}${log.message}`,
            )
            .join('\n')
        : 'No workflow execution logs were found.',
      '',
      '## Approval Decisions',
      context.approvals.length > 0
        ? context.approvals
            .map(
              (approval) =>
                `- Step ${approval.step} ${approval.action}: ${approval.status}${approval.decidedBy ? ` by ${approval.decidedBy}` : ''}${approval.decisionReason ? ` (${approval.decisionReason})` : ''}`,
            )
            .join('\n')
        : 'No approval request was recorded.',
      '',
      '## Final Incident Status',
      context.report.finalStatus,
      '',
      '## Scope Note',
      'This report summarizes a SOAR workflow demonstration. PCAP input, if used, only generated demo alerts and did not perform IDS-grade packet detection.',
      '',
    ];

    return lines.join('\n');
  }

  private markdownToHtml(markdown: string) {
    const htmlLines = markdown.split('\n').map((line) => {
      if (line.startsWith('# ')) {
        return `<h1>${this.escapeHtml(line.slice(2))}</h1>`;
      }

      if (line.startsWith('## ')) {
        return `<h2>${this.escapeHtml(line.slice(3))}</h2>`;
      }

      if (line.startsWith('- ')) {
        return `<li>${this.escapeHtml(line.slice(2))}</li>`;
      }

      if (line.trim() === '') {
        return '';
      }

      return `<p>${this.escapeHtml(line)}</p>`;
    });

    return `<!doctype html><html><head><meta charset="utf-8"><title>SOAR Report</title><style>body{font-family:Arial,sans-serif;max-width:920px;margin:32px auto;line-height:1.5;color:#0f172a}h1,h2{color:#115e59}li{margin:6px 0}</style></head><body>${htmlLines.join('\n')}</body></html>`;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private mapIncidentDocument(incident: Record<string, unknown>): SharedIncident {
    return {
      ...(incident as unknown as Omit<SharedIncident, 'createdAt' | 'updatedAt' | 'timeline'>),
      timeline: ((incident.timeline as Array<Record<string, unknown>> | undefined) ?? []).map(
        (entry) => ({
          ...(entry as { message: string; status: SharedIncident['status'] }),
          timestamp: new Date(entry.timestamp as string | Date).toISOString(),
        }),
      ),
      createdAt: new Date(incident.createdAt as string | Date).toISOString(),
      updatedAt: new Date(incident.updatedAt as string | Date).toISOString(),
    };
  }

  private mapWorkflowDocument(workflow: Record<string, unknown>): WorkflowExecution {
    return {
      ...(workflow as unknown as Omit<WorkflowExecution, 'createdAt' | 'updatedAt'>),
      createdAt: new Date(workflow.createdAt as string | Date).toISOString(),
      updatedAt: new Date(workflow.updatedAt as string | Date).toISOString(),
      ...(workflow.startedAt
        ? { startedAt: new Date(workflow.startedAt as string | Date).toISOString() }
        : {}),
      ...(workflow.finishedAt
        ? { finishedAt: new Date(workflow.finishedAt as string | Date).toISOString() }
        : {}),
    };
  }

  private mapNormalizedAlertDocument(alert: Record<string, unknown>): NormalizedAlert {
    return {
      ...(alert as unknown as Omit<NormalizedAlert, 'createdAt' | 'updatedAt'>),
      createdAt: new Date(alert.createdAt as string | Date).toISOString(),
      updatedAt: new Date(alert.updatedAt as string | Date).toISOString(),
      ...(alert.observedAt
        ? { observedAt: new Date(alert.observedAt as string | Date).toISOString() }
        : {}),
    };
  }

  private mapRecommendationDocument(recommendation: Record<string, unknown>): Recommendation {
    return {
      ...(recommendation as unknown as Omit<Recommendation, 'createdAt' | 'updatedAt'>),
      createdAt: new Date(recommendation.createdAt as string | Date).toISOString(),
      updatedAt: new Date(recommendation.updatedAt as string | Date).toISOString(),
    };
  }

  private generateReportId() {
    return `RPT-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
  }
}
