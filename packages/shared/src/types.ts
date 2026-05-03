import type {
  AlertType,
  ApprovalStatus,
  AutomationLevel,
  IncidentStatus,
  PcapFileStatus,
  PcapJobStatus,
  Severity,
  WorkflowExecutionStatus,
} from './enums';

export interface ApiCollectionMeta {
  count: number;
}

export interface ApiResponse<TData, TMeta = undefined> {
  success: true;
  message: string;
  data: TData;
  meta?: TMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: string;
  statusCode: number;
  path: string;
  timestamp: string;
  details?: unknown;
}

export interface AssetContext {
  assetId?: string;
  hostname?: string;
  ipAddress?: string;
  owner?: string;
  environment?: string;
  criticality?: Severity;
  tags?: string[];
}

export interface RawAlert {
  alertId: string;
  source: string;
  alertType: AlertType;
  title: string;
  severity: Severity;
  payload: Record<string, unknown>;
  sourceIp?: string;
  targetIp?: string;
  createdAt: string;
}

export interface NormalizedAlert {
  alertId: string;
  source: string;
  alertType: AlertType;
  title: string;
  severity: Severity;
  confidence: number;
  sourceIp?: string;
  targetIp?: string;
  sourcePort?: number;
  targetPort?: number;
  protocol?: string;
  dnsQuery?: string;
  httpUri?: string;
  evidence: Record<string, unknown>[];
  assetContext: AssetContext[];
  rawAlertId?: string;
  createdAt: string;
}

export interface PlaybookAction {
  step: number;
  action: string;
  type: string;
  description: string;
  approvalRequired: boolean;
  mockOnly: boolean;
}

export interface Playbook {
  playbookId: string;
  name: string;
  description: string;
  incidentCategory: string;
  supportedAlertTypes: AlertType[];
  requiredFields: string[];
  severityRange: Severity[];
  assetContext: string[];
  actions: PlaybookAction[];
  approvalRequired: boolean;
  automationLevel: AutomationLevel;
  references: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationCandidate {
  playbookId: string;
  score: number;
  approvalStatus: ApprovalStatus;
}

export interface Recommendation {
  recommendationId: string;
  normalizedAlertId: string;
  topPlaybooks: RecommendationCandidate[];
  selectedPlaybookId?: string;
  scoreBreakdown: Record<string, number>;
  explanationSummary: string;
  createdAt: string;
}

export interface RecommendationExplanation {
  explanationId: string;
  recommendationId: string;
  summary: string;
  createdAt: string;
}

export interface IncidentTimelineEntry {
  timestamp: string;
  message: string;
  status: IncidentStatus;
}

export interface Incident {
  incidentId: string;
  title: string;
  status: IncidentStatus;
  severity: Severity;
  normalizedAlertId: string;
  selectedPlaybookId?: string;
  recommendationId?: string;
  timeline: IncidentTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  executionId: string;
  incidentId: string;
  playbookId: string;
  status: WorkflowExecutionStatus;
  currentStep: number;
  startedAt?: string;
  finishedAt?: string;
}

export interface ExecutionLog {
  executionId: string;
  step: number;
  action: string;
  status: WorkflowExecutionStatus;
  message: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface Report {
  reportId: string;
  incidentId: string;
  alertSummary: string;
  playbookSummary: string;
  recommendationSummary: string;
  executionSummary: string;
  finalStatus: IncidentStatus;
  createdAt: string;
}

export interface PcapFile {
  fileId: string;
  filename: string;
  originalName: string;
  size: number;
  status: PcapFileStatus;
  uploadedAt: string;
}

export interface PcapJob {
  jobId: string;
  fileId: string;
  status: PcapJobStatus;
  message: string;
  createdAt: string;
  completedAt?: string;
}

export interface QueueDescriptor {
  name: string;
  purpose: string;
}

export interface JobCatalog {
  mode: 'placeholder';
  defaultAutomationLevel: AutomationLevel;
}
