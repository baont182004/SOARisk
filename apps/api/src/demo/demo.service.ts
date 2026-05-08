import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApprovalStatus, RAW_ALERT_MOCK_SCENARIOS } from '@soc-soar/shared';
import type { Model } from 'mongoose';

import type { RawAlertMockScenario } from '../alerts/raw-alert-mock.factory';
import { ApprovalRequest } from '../approvals/approval-request.schema';
import { createSuccessResponse } from '../common/api-response.util';
import { ExplanationsService } from '../explanations/explanations.service';
import { NormalizedAlertsService } from '../normalized-alerts/normalized-alerts.service';
import { PcapDemoService } from '../pcap-demo/pcap-demo.service';
import { PlaybooksService } from '../playbooks/playbooks.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { WorkflowsService } from '../workflows/workflows.service';

const EXPECTED_PLAYBOOK_BY_SCENARIO: Record<string, string> = {
  'port-scan': 'PB-002',
  'icmp-flood': 'PB-001',
  'sql-injection': 'PB-005',
  xss: 'PB-005',
  'suspicious-dns': 'PB-010',
  'botnet-c2': 'PB-027',
};

@Injectable()
export class DemoService {
  constructor(
    private readonly pcapDemoService: PcapDemoService,
    private readonly playbooksService: PlaybooksService,
    private readonly normalizedAlertsService: NormalizedAlertsService,
    private readonly recommendationsService: RecommendationsService,
    private readonly explanationsService: ExplanationsService,
    private readonly workflowsService: WorkflowsService,
    @InjectModel(ApprovalRequest.name)
    private readonly approvalRequestModel: Model<ApprovalRequest>,
  ) {}

  getScenarios() {
    return createSuccessResponse('Demo scenarios retrieved.', {
      scenarios: RAW_ALERT_MOCK_SCENARIOS.map((scenario) => ({
        scenario,
        expectedPlaybookId: EXPECTED_PLAYBOOK_BY_SCENARIO[scenario],
      })),
    });
  }

  async runScenario(scenario: RawAlertMockScenario) {
    const steps: Array<{
      key: string;
      label: string;
      status: 'completed' | 'waiting_approval' | 'failed';
      ref?: string;
      message?: string;
    }> = [];

    const markCompleted = (key: string, label: string, ref?: string, message?: string) => {
      steps.push({ key, label, status: 'completed', ...(ref ? { ref } : {}), ...(message ? { message } : {}) });
    };

    const seed = await this.playbooksService.seed();
    markCompleted('seed', 'Seed structured playbooks', undefined, seed.message);

    const pcap = await this.pcapDemoService.generateScenarioAlert(scenario);
    const alertId = pcap.data.rawAlert.alertId;
    markCompleted('alert', 'Generate demo raw alert', alertId);

    const normalized = await this.normalizedAlertsService.normalizeFromRaw(alertId, {
      force: true,
    });
    const normalizedAlertId = normalized.data.normalizedAlertId;
    markCompleted('normalize', 'Normalize alert', normalizedAlertId);

    const recommendation = await this.recommendationsService.generateFromNormalized(
      normalizedAlertId,
      {
        force: true,
        topK: 3,
      },
    );
    const recommendationId = recommendation.data.recommendationId;
    markCompleted('recommend', 'Recommend Top-3 playbooks', recommendationId);

    const expectedPlaybookId = EXPECTED_PLAYBOOK_BY_SCENARIO[scenario];
    const selectedPlaybookId =
      recommendation.data.topPlaybooks.find(
        (playbook) => playbook.playbookId === expectedPlaybookId,
      )?.playbookId ?? recommendation.data.topPlaybooks[0]?.playbookId;

    if (!selectedPlaybookId) {
      steps.push({
        key: 'select',
        label: 'Select playbook',
        status: 'failed',
        message: 'Recommendation did not return any playbook candidate.',
      });

      return createSuccessResponse('Demo scenario failed before workflow creation.', {
        scenario,
        steps,
      });
    }

    await this.recommendationsService.selectPlaybook(recommendationId, selectedPlaybookId);
    markCompleted('select', 'Select expected playbook', selectedPlaybookId);

    const explanation = await this.explanationsService.generateFromRecommendation(
      recommendationId,
      {
        force: true,
      },
    );
    markCompleted('explain', 'Generate recommendation explanation', explanation.data.explanationId);

    const workflow = await this.workflowsService.createFromRecommendation(recommendationId, {
      force: true,
      autoStart: true,
    });
    const executionId = workflow.data.executionId;
    const pendingApprovals = await this.approvalRequestModel
      .find({ executionId, status: ApprovalStatus.PENDING })
      .sort({ requestedAt: 1 })
      .lean()
      .exec();

    if (pendingApprovals.length > 0) {
      const pendingApproval = pendingApprovals[0] as { approvalId: string };

      steps.push({
        key: 'approval',
        label: 'Workflow paused for analyst approval',
        status: 'waiting_approval',
        ref: pendingApproval.approvalId,
        message: `Approve ${pendingApproval.approvalId} to continue workflow ${executionId}.`,
      });
    } else {
      markCompleted('workflow', 'Create and execute workflow', executionId);
    }

    return createSuccessResponse('SOAR demo scenario executed.', {
      scenario,
      alertId,
      normalizedAlertId,
      recommendationId,
      selectedPlaybookId,
      explanationId: explanation.data.explanationId,
      executionId,
      pendingApprovalId: pendingApprovals[0]?.approvalId,
      workflowStatus: workflow.data.status,
      steps,
    });
  }
}
