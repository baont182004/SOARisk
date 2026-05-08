import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  AlertSource,
  AlertType,
  NormalizedAlertStatus,
  Severity,
  WorkflowExecutionStatus,
  baselineRecommendPlaybooks,
  scorePlaybooksForNormalizedAlert,
  type NormalizedAlert,
  type Playbook,
} from '@soc-soar/shared';
import type { Model } from 'mongoose';

import { RawAlert } from '../alerts/raw-alert.schema';
import { createSuccessResponse } from '../common/api-response.util';
import { readEnhancementPackJson } from '../common/enhancement-data.util';
import { Incident } from '../incidents/incident.schema';
import { NormalizedAlert as NormalizedAlertDocument } from '../normalized-alerts/normalized-alert.schema';
import { PlaybooksService } from '../playbooks/playbooks.service';
import { WorkflowExecution } from '../workflows/workflow-execution.schema';

type EvaluationCaseSeed = {
  caseId: string;
  alertType: string;
  severity: string;
  normalizedAlert: Record<string, unknown>;
  expectedTop1: string;
  acceptableTop3: string[];
  rationale: string;
  difficulty?: string;
  baselineTrap?: string;
};

type EvaluationCaseFile = {
  metadata: {
    project: string;
    createdAt: string;
    purpose: string;
  };
  evaluationCases: EvaluationCaseSeed[];
};

type ModelEvaluationResult = {
  model: 'baseline' | 'proposed';
  evaluatedCount: number;
  top1Hits: number;
  top3Hits: number;
  top1Accuracy: number;
  top3Accuracy: number;
  meanReciprocalRank: number;
  averageScoreCorrectTop1: number;
  averageScoreIncorrectTop1: number;
  mismatchCases: Array<{
    caseId: string;
    alertType: string;
    expectedTop1: string;
    actualTop1: string | null;
    actualTop3: string[];
    acceptableTop3: string[];
    rationale: string;
    difficulty?: string;
    top1Score?: number;
  }>;
  byAlertType: Record<
    string,
    {
      evaluatedCount: number;
      top1Accuracy: number;
      top3Accuracy: number;
      top1Hits: number;
      top3Hits: number;
    }
  >;
  mismatchSummaryByAlertType: Record<string, number>;
  confusionPairs: Record<string, number>;
};

@Injectable()
export class EvaluationService {
  constructor(
    @InjectModel(RawAlert.name)
    private readonly rawAlertModel: Model<RawAlert>,
    @InjectModel(NormalizedAlertDocument.name)
    private readonly normalizedAlertModel: Model<NormalizedAlertDocument>,
    @InjectModel(WorkflowExecution.name)
    private readonly workflowExecutionModel: Model<WorkflowExecution>,
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<Incident>,
    private readonly playbooksService: PlaybooksService,
  ) {}

  async getSummary() {
    const [
      workflows,
      incidentStatus,
      alertsByType,
      alertsBySeverity,
      playbookUsage,
      rawAlertCount,
      activePlaybooks,
    ] = await Promise.all([
      this.workflowExecutionModel.find().lean().exec(),
      this.incidentModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.normalizedAlertModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$alertType', count: { $sum: 1 } } },
      ]),
      this.normalizedAlertModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      this.workflowExecutionModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$playbookId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.rawAlertModel.countDocuments().exec(),
      this.playbooksService.findActivePlaybooksData(),
    ]);
    const evaluationDataset = readEnhancementPackJson<EvaluationCaseFile>('evaluation_cases.v1.json');
    const proposed = this.evaluateProposedModel(evaluationDataset.evaluationCases, activePlaybooks);
    const baseline = this.evaluateBaselineModel(evaluationDataset.evaluationCases, activePlaybooks);
    const terminalWorkflows = workflows.filter((workflow) =>
      [
        WorkflowExecutionStatus.SUCCESS,
        WorkflowExecutionStatus.FAILED,
        WorkflowExecutionStatus.CANCELLED,
      ].includes(workflow.status),
    );
    const successfulWorkflows = workflows.filter(
      (workflow) => workflow.status === WorkflowExecutionStatus.SUCCESS,
    );
    const executionDurations = terminalWorkflows
      .filter((workflow) => workflow.startedAt && workflow.finishedAt)
      .map(
        (workflow) =>
          new Date(workflow.finishedAt as Date).getTime() -
          new Date(workflow.startedAt as Date).getTime(),
      );
    const manualStepReduction = this.calculateManualStepReduction(workflows);

    return createSuccessResponse('Evaluation summary retrieved.', {
      recommendation: {
        evaluatedCount: proposed.evaluatedCount,
        top1Accuracy: proposed.top1Accuracy,
        top3Accuracy: proposed.top3Accuracy,
        expectedPlaybookByAlertType: this.buildExpectedTop1ByAlertType(
          evaluationDataset.evaluationCases,
        ),
        model: 'SOARISK-RS-V2',
      },
      baseline,
      proposed,
      workflow: {
        total: workflows.length,
        terminal: terminalWorkflows.length,
        successRate: this.ratio(successfulWorkflows.length, terminalWorkflows.length),
        averageExecutionTimeMs:
          executionDurations.length === 0
            ? 0
            : Math.round(
                executionDurations.reduce((sum, value) => sum + value, 0) /
                  executionDurations.length,
              ),
        manualStepReduction,
      },
      distribution: {
        rawAlertCount,
        incidentsByStatus: this.mapAggregation(incidentStatus),
        alertsByType: this.mapAggregation(alertsByType),
        alertsBySeverity: this.mapAggregation(alertsBySeverity),
        playbookUsageCount: this.mapAggregation(playbookUsage),
      },
      evaluationDataset: {
        source: 'SOARisk_Enhancement_Docs_Pack/evaluation_cases.v1.json',
        caseCount: evaluationDataset.evaluationCases.length,
        metadata: evaluationDataset.metadata,
      },
      demoDataset: evaluationDataset.evaluationCases.map((item) => ({
        caseId: item.caseId,
        alertType: item.alertType,
        expectedPlaybookId: item.expectedTop1,
        acceptableTop3: item.acceptableTop3,
        difficulty: item.difficulty,
      })),
      notes: [
        'Baseline ranks playbooks primarily by alertType match.',
        'Proposed metrics are computed with the weighted SOARISK-RS-V2 scoring model and the official evaluation_cases.v1 dataset.',
        'PCAP-generated alerts remain demo inputs only; evaluation measures post-alert SOAR recommendation quality.',
      ],
    });
  }

  private evaluateProposedModel(
    cases: EvaluationCaseSeed[],
    playbooks: Playbook[],
  ): ModelEvaluationResult {
    return this.evaluateCases('proposed', cases, (normalizedAlert) =>
      scorePlaybooksForNormalizedAlert(normalizedAlert, playbooks, { topK: 3 }).topPlaybooks.map(
        (item) => ({
          playbookId: item.playbookId,
          score: item.finalScore ?? item.totalScore,
        }),
      ),
    );
  }

  private evaluateBaselineModel(
    cases: EvaluationCaseSeed[],
    playbooks: Playbook[],
  ): ModelEvaluationResult {
    return this.evaluateCases('baseline', cases, (normalizedAlert) =>
      baselineRecommendPlaybooks(normalizedAlert, playbooks, { topK: 3 }),
    );
  }

  private evaluateCases(
    model: ModelEvaluationResult['model'],
    cases: EvaluationCaseSeed[],
    ranker: (normalizedAlert: NormalizedAlert) => Array<{ playbookId: string; score?: number }>,
  ): ModelEvaluationResult {
    const rows = cases.map((item) => {
      const normalizedAlert = this.mapEvaluationCaseToNormalizedAlert(item);
      const recommendations = ranker(normalizedAlert);
      const actualTop3 = recommendations.slice(0, 3).map((recommendation) => recommendation.playbookId);
      const actualTop1 = actualTop3[0] ?? null;
      const top1Hit = actualTop1 === item.expectedTop1;
      const top3Hit = actualTop3.some((playbookId) => item.acceptableTop3.includes(playbookId));
      const expectedRank = actualTop3.findIndex((playbookId) => playbookId === item.expectedTop1);

      return {
        item,
        actualTop1,
        actualTop3,
        top1Hit,
        top3Hit,
        reciprocalRank: expectedRank >= 0 ? 1 / (expectedRank + 1) : 0,
        top1Score: recommendations[0]?.score,
      };
    });
    const mismatchCases = rows
      .filter((row) => !row.top1Hit)
      .map((row) => ({
        caseId: row.item.caseId,
        alertType: row.item.alertType,
        expectedTop1: row.item.expectedTop1,
        actualTop1: row.actualTop1,
        actualTop3: row.actualTop3,
        acceptableTop3: row.item.acceptableTop3,
        rationale: row.item.rationale,
        ...(row.item.difficulty !== undefined ? { difficulty: row.item.difficulty } : {}),
        ...(row.top1Score !== undefined ? { top1Score: row.top1Score } : {}),
      }));
    const correctScores = rows
      .filter((row) => row.top1Hit && row.top1Score !== undefined)
      .map((row) => row.top1Score as number);
    const incorrectScores = rows
      .filter((row) => !row.top1Hit && row.top1Score !== undefined)
      .map((row) => row.top1Score as number);

    return {
      model,
      evaluatedCount: rows.length,
      top1Hits: rows.filter((row) => row.top1Hit).length,
      top3Hits: rows.filter((row) => row.top3Hit).length,
      top1Accuracy: this.ratio(rows.filter((row) => row.top1Hit).length, rows.length),
      top3Accuracy: this.ratio(rows.filter((row) => row.top3Hit).length, rows.length),
      meanReciprocalRank: this.average(rows.map((row) => row.reciprocalRank)),
      averageScoreCorrectTop1: this.average(correctScores),
      averageScoreIncorrectTop1: this.average(incorrectScores),
      mismatchCases,
      byAlertType: this.summarizeRowsByAlertType(rows),
      mismatchSummaryByAlertType: mismatchCases.reduce<Record<string, number>>((acc, item) => {
        acc[item.alertType] = (acc[item.alertType] ?? 0) + 1;
        return acc;
      }, {}),
      confusionPairs: mismatchCases.reduce<Record<string, number>>((acc, item) => {
        const key = `${item.expectedTop1}->${item.actualTop1 ?? 'none'}`;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    };
  }

  private mapEvaluationCaseToNormalizedAlert(item: EvaluationCaseSeed): NormalizedAlert {
    const normalizedAlert = item.normalizedAlert;
    const targetIp = this.getString(normalizedAlert.destinationIp) ?? this.getString(normalizedAlert.targetIp);
    const sourceIp = this.getString(normalizedAlert.sourceIp);
    const destinationPorts = normalizedAlert.destinationPorts;
    const firstDestinationPort = Array.isArray(destinationPorts)
      ? Number(destinationPorts[0])
      : Number(normalizedAlert.destinationPort);
    const criticality = this.mapSeverity(normalizedAlert.targetAssetCriticality) ?? Severity.MEDIUM;
    const protocol = this.getString(normalizedAlert.protocol);
    const dnsQuery = this.getString(normalizedAlert.domain);
    const httpUri = this.getString(normalizedAlert.url);
    const username = this.getString(normalizedAlert.targetUser);
    const hostname = this.getString(normalizedAlert.hostId);

    return {
      normalizedAlertId: item.caseId,
      alertId: item.caseId,
      source: AlertSource.MOCK,
      alertType: this.mapAlertType(item.alertType),
      title: `Evaluation case ${item.caseId}`,
      description: item.rationale,
      severity: this.mapSeverity(item.severity) ?? Severity.MEDIUM,
      confidence: this.getNumber(normalizedAlert.confidence) ?? 0.7,
      ...(sourceIp !== undefined ? { sourceIp } : {}),
      ...(targetIp !== undefined ? { targetIp } : {}),
      ...(Number.isFinite(firstDestinationPort) ? { targetPort: firstDestinationPort } : {}),
      ...(protocol !== undefined ? { protocol } : {}),
      ...(dnsQuery !== undefined ? { dnsQuery } : {}),
      ...(httpUri !== undefined ? { httpUri } : {}),
      ...(username !== undefined ? { username } : {}),
      ...(hostname !== undefined ? { hostname } : {}),
      assetContext: [
        {
          criticality,
          tags: [String(normalizedAlert.sourceAssetRole ?? 'evaluation')],
        },
      ],
      additionalContext: {
        ...normalizedAlert,
        alertType: item.alertType,
        severity: item.severity,
        expectedTop1: item.expectedTop1,
        acceptableTop3: item.acceptableTop3,
      },
      evidence: Object.entries(normalizedAlert).map(([key, value]) => ({
        key,
        value: Array.isArray(value) ? value.join(',') : String(value),
        sourceField: `evaluation.normalizedAlert.${key}`,
        description: `Evaluation case field ${key}.`,
      })),
      normalizationStatus: NormalizedAlertStatus.NORMALIZED,
      normalizationNotes: ['Evaluation dataset case from evaluation_cases.v1.json.'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private summarizeRowsByAlertType(
    rows: Array<{
      item: EvaluationCaseSeed;
      top1Hit: boolean;
      top3Hit: boolean;
    }>,
  ) {
    const grouped = rows.reduce<
      Record<string, { evaluatedCount: number; top1Hits: number; top3Hits: number }>
    >((acc, row) => {
      const entry = acc[row.item.alertType] ?? {
        evaluatedCount: 0,
        top1Hits: 0,
        top3Hits: 0,
      };
      entry.evaluatedCount += 1;
      entry.top1Hits += row.top1Hit ? 1 : 0;
      entry.top3Hits += row.top3Hit ? 1 : 0;
      acc[row.item.alertType] = entry;
      return acc;
    }, {});

    return Object.fromEntries(
      Object.entries(grouped).map(([alertType, item]) => [
        alertType,
        {
          ...item,
          top1Accuracy: this.ratio(item.top1Hits, item.evaluatedCount),
          top3Accuracy: this.ratio(item.top3Hits, item.evaluatedCount),
        },
      ]),
    );
  }

  private buildExpectedTop1ByAlertType(cases: EvaluationCaseSeed[]) {
    return cases.reduce<Record<string, string>>((acc, item) => {
      if (!acc[item.alertType]) {
        acc[item.alertType] = item.expectedTop1;
      }

      return acc;
    }, {});
  }

  private calculateManualStepReduction(workflows: WorkflowExecution[]) {
    const stepCounts = workflows.map((workflow) => ({
      baselineManualSteps: workflow.steps.length,
      remainingManualSteps: workflow.steps.filter((step) => step.approvalRequired).length,
    }));
    const baseline = stepCounts.reduce((sum, item) => sum + item.baselineManualSteps, 0);
    const remaining = stepCounts.reduce((sum, item) => sum + item.remainingManualSteps, 0);

    return {
      baselineManualSteps: baseline,
      remainingManualApprovalSteps: remaining,
      reducedSteps: Math.max(0, baseline - remaining),
      reductionRate: this.ratio(Math.max(0, baseline - remaining), baseline),
    };
  }

  private mapAlertType(value: string) {
    const supported = Object.values(AlertType);

    return supported.includes(value as AlertType) ? (value as AlertType) : AlertType.GENERIC;
  }

  private mapSeverity(value: unknown) {
    const normalized = String(value ?? '').toLowerCase();
    const supported = Object.values(Severity);

    return supported.includes(normalized as Severity) ? (normalized as Severity) : undefined;
  }

  private getString(value: unknown) {
    return typeof value === 'string' && value.trim() !== '' ? value : undefined;
  }

  private getNumber(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }

  private ratio(numerator: number, denominator: number) {
    if (denominator === 0) {
      return 0;
    }

    return Number((numerator / denominator).toFixed(4));
  }

  private average(values: number[]) {
    if (values.length === 0) {
      return 0;
    }

    return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(4));
  }

  private mapAggregation(rows: Array<{ _id: string; count: number }>) {
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {});
  }
}
