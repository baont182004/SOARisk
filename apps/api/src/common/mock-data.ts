import {
  AlertType,
  ApprovalStatus,
  AutomationLevel,
  type JobCatalog,
  type RecommendationExplanation,
  IncidentStatus,
  PcapFileStatus,
  PcapJobStatus,
  Severity,
  WorkflowExecutionStatus,
} from '@soc-soar/shared';

import { generateIdentifier } from './query.util';

type MockRecommendationExplanation = Omit<RecommendationExplanation, 'createdAt'> & {
  createdAt: Date;
};

export function createMockRawAlert() {
  return {
    alertId: generateIdentifier('RAW'),
    source: 'suricata-demo',
    alertType: AlertType.PORT_SCAN,
    title: 'Demo security alert received from upstream detector',
    severity: Severity.MEDIUM,
    payload: {
      message: 'This is placeholder raw alert data for future normalization.',
      detector: 'demo-pipeline',
    },
    sourceIp: '10.0.10.15',
    targetIp: '10.0.20.10',
    createdAt: new Date(),
  };
}

export function createMockNormalizedAlert() {
  return {
    alertId: generateIdentifier('NAL'),
    source: 'normalization-pipeline',
    alertType: AlertType.PORT_SCAN,
    title: 'Normalized port scan alert',
    severity: Severity.MEDIUM,
    confidence: 0.84,
    sourceIp: '10.0.10.15',
    targetIp: '10.0.20.10',
    sourcePort: 45123,
    targetPort: 22,
    protocol: 'tcp',
    evidence: [
      {
        kind: 'connection_summary',
        attempts: 24,
      },
    ],
    assetContext: [
      {
        assetId: 'AST-DEMO-001',
        hostname: 'soc-lab-gateway',
        ipAddress: '10.0.20.10',
        environment: 'lab',
        criticality: Severity.HIGH,
        tags: ['demo', 'gateway'],
      },
    ],
    rawAlertId: generateIdentifier('RAW'),
    createdAt: new Date(),
  };
}

export function createMockRecommendation() {
  return {
    recommendationId: generateIdentifier('REC'),
    normalizedAlertId: generateIdentifier('NAL'),
    topPlaybooks: [
      {
        playbookId: 'PB-002',
        score: 0.93,
        approvalStatus: ApprovalStatus.PENDING,
      },
      {
        playbookId: 'PB-001',
        score: 0.78,
        approvalStatus: ApprovalStatus.NOT_REQUIRED,
      },
    ],
    selectedPlaybookId: 'PB-002',
    scoreBreakdown: {
      alertTypeMatch: 0.5,
      severityMatch: 0.2,
      fieldCoverage: 0.13,
      assetContextMatch: 0.1,
    },
    explanationSummary:
      'PB-002 is recommended because the alert pattern resembles a port scan and includes the required network indicators.',
    createdAt: new Date(),
  };
}

export function createMockIncident() {
  return {
    incidentId: generateIdentifier('INC'),
    title: 'Demo SOC incident for analyst workflow testing',
    status: IncidentStatus.NEW,
    severity: Severity.MEDIUM,
    normalizedAlertId: generateIdentifier('NAL'),
    selectedPlaybookId: 'PB-001',
    recommendationId: generateIdentifier('REC'),
    timeline: [
      {
        timestamp: new Date(),
        message: 'Incident created from normalized alert.',
        status: IncidentStatus.NEW,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createMockWorkflowExecution() {
  return {
    executionId: generateIdentifier('WF'),
    incidentId: generateIdentifier('INC'),
    playbookId: 'PB-001',
    status: WorkflowExecutionStatus.PENDING,
    currentStep: 1,
    startedAt: new Date(),
  };
}

export function createMockExecutionLog(executionId: string) {
  return {
    executionId,
    step: 1,
    action: 'collect-context',
    status: WorkflowExecutionStatus.PENDING,
    message: 'Placeholder execution log created. Real orchestration will be added later.',
    startedAt: new Date(),
  };
}

export function createMockReport() {
  return {
    reportId: generateIdentifier('RPT'),
    incidentId: generateIdentifier('INC'),
    alertSummary: 'Placeholder alert summary generated from a normalized demo alert.',
    playbookSummary: 'Placeholder playbook summary for analyst review.',
    recommendationSummary: 'Placeholder recommendation rationale for future explanation engine.',
    executionSummary: 'Workflow execution is mock-only in this initialization phase.',
    finalStatus: IncidentStatus.NEW,
    createdAt: new Date(),
  };
}

export function createMockPcapFile() {
  return {
    fileId: generateIdentifier('PCAPF'),
    filename: `demo-${Date.now()}.pcap`,
    originalName: 'demo-upload.pcap',
    size: 1024 * 256,
    status: PcapFileStatus.UPLOADED,
    uploadedAt: new Date(),
  };
}

export function createMockPcapJob(fileId: string) {
  return {
    jobId: generateIdentifier('PCAPJ'),
    fileId,
    status: PcapJobStatus.PENDING,
    message:
      'Placeholder PCAP demo job created. PCAP is only used for test/demo alert generation, not full IDS analysis.',
    createdAt: new Date(),
  };
}

export function createMockAsset() {
  return {
    assetId: generateIdentifier('AST'),
    hostname: 'soc-lab-app-01',
    ipAddress: '10.0.30.25',
    owner: 'blue-team',
    environment: 'lab',
    criticality: Severity.HIGH,
    tags: ['demo', 'web'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createMockExplanation(): MockRecommendationExplanation {
  return {
    explanationId: generateIdentifier('EXP'),
    recommendationId: generateIdentifier('REC'),
    summary:
      'Explanation placeholders will later describe why a playbook was chosen and what evidence supported the match.',
    createdAt: new Date(),
  };
}

export function createMockJobCatalog(): JobCatalog {
  return {
    mode: 'placeholder',
    defaultAutomationLevel: AutomationLevel.SEMI_AUTOMATED,
  };
}
