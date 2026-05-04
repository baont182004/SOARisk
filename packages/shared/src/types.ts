import type {
  AlertType,
  AlertSource,
  ApprovalPolicy,
  ApprovalStatus,
  AutomationLevel,
  ExecutionLogLevel,
  IncidentStatus,
  IncidentCategory,
  ExplanationRiskLevel,
  ExplanationSectionType,
  ExplanationStatus,
  NormalizedAlertStatus,
  PcapFileStatus,
  PcapJobStatus,
  PlaybookActionType,
  PlaybookStatus,
  PlaybookStepRisk,
  RecommendationStatus,
  Severity,
  WorkflowExecutionStatus,
  WorkflowStepStatus,
} from './enums';

export interface ApiCollectionMeta {
  count: number;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
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

export interface AlertEvidence {
  key: string;
  value: string;
  sourceField: string;
  description: string;
}

export interface RawAlert {
  alertId: string;
  source: AlertSource;
  sourceAlertId?: string;
  title: string;
  description?: string;
  alertType?: AlertType;
  severity?: Severity;
  confidence?: number;
  observedAt?: string;
  sourceIp?: string;
  targetIp?: string;
  sourcePort?: number;
  targetPort?: number;
  protocol?: string;
  dnsQuery?: string;
  httpUri?: string;
  username?: string;
  hostname?: string;
  assetId?: string;
  rawPayload?: Record<string, unknown>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NormalizedAlert {
  normalizedAlertId: string;
  alertId: string;
  source: AlertSource;
  alertType: AlertType;
  title: string;
  description?: string;
  severity: Severity;
  confidence: number;
  observedAt?: string;
  sourceIp?: string;
  targetIp?: string;
  sourcePort?: number;
  targetPort?: number;
  protocol?: string;
  dnsQuery?: string;
  httpUri?: string;
  username?: string;
  hostname?: string;
  assetId?: string;
  assetContext: AssetContext[];
  evidence: AlertEvidence[];
  normalizationStatus: NormalizedAlertStatus;
  normalizationNotes: string[];
  createdAt: string;
  updatedAt: string;
}

export type NormalizedAlertDraft = Omit<
  NormalizedAlert,
  'normalizedAlertId' | 'createdAt' | 'updatedAt'
>;

export interface NormalizationResult {
  normalizedAlert: NormalizedAlertDraft;
  alertTypeWasInferred: boolean;
  severityWasInferred: boolean;
  confidenceWasInferred: boolean;
  notes: string[];
  evidence: AlertEvidence[];
}

export type PlaybookConditionOperator = 'equals' | 'includes' | 'exists' | 'in' | 'gte' | 'lte';

export type PlaybookReferenceType =
  | 'standard'
  | 'guideline'
  | 'tool_reference'
  | 'internal_design';

export interface PlaybookAction {
  step: number;
  action: string;
  type: PlaybookActionType;
  description: string;
  requiredFields: string[];
  produces: string[];
  approvalRequired: boolean;
  risk: PlaybookStepRisk;
  mockOnly: boolean;
}

export interface PlaybookCondition {
  field: string;
  operator: PlaybookConditionOperator;
  value?: string | string[] | number;
  weightHint?: number;
  description: string;
}

export interface PlaybookReference {
  name: string;
  type: PlaybookReferenceType;
  note: string;
}

export interface Playbook {
  playbookId: string;
  name: string;
  description: string;
  incidentCategory: IncidentCategory;
  supportedAlertTypes: AlertType[];
  requiredFields: string[];
  optionalFields: string[];
  severityRange: Severity[];
  assetContext: string[];
  conditions: PlaybookCondition[];
  actions: PlaybookAction[];
  approvalRequired: boolean;
  approvalPolicy: ApprovalPolicy;
  automationLevel: AutomationLevel;
  status: PlaybookStatus;
  references: PlaybookReference[];
  version: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PlaybookValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalPlaybooks: number;
    activePlaybooks: number;
    supportedAlertTypes: string[];
    missingCoreAlertTypes: string[];
  };
}

export interface PlaybookDatasetSummary {
  totalPlaybooks: number;
  activePlaybooks: number;
  byIncidentCategory: Record<string, number>;
  byAlertType: Record<string, number>;
  byAutomationLevel: Record<string, number>;
  approvalRequiredCount: number;
  sensitiveActionCount: number;
  mockOnlyActionCount: number;
}

export interface RecommendationScoreBreakdown {
  alertTypeScore: number;
  requiredFieldsScore: number;
  severityScore: number;
  assetContextScore: number;
  conditionScore: number;
  automationScore: number;
  totalScore: number;
}

export interface PlaybookRecommendationItem {
  playbookId: string;
  name: string;
  incidentCategory: IncidentCategory;
  totalScore: number;
  rank: number;
  matchedReasons: string[];
  missingFields: string[];
  scoreBreakdown: RecommendationScoreBreakdown;
  approvalRequired: boolean;
  automationLevel: AutomationLevel;
}

export interface PlaybookRecommendationResult {
  recommendationId: string;
  normalizedAlertId: string;
  alertId: string;
  alertType: AlertType;
  severity: Severity;
  status: RecommendationStatus;
  topPlaybooks: PlaybookRecommendationItem[];
  evaluatedPlaybookCount: number;
  selectedPlaybookId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Recommendation = PlaybookRecommendationResult;

export type PlaybookExplanationDecision = 'recommended' | 'alternative' | 'not_selected';

export interface ExplanationSection {
  type: ExplanationSectionType;
  title: string;
  content: string;
  evidenceRefs?: string[];
  severity?: ExplanationRiskLevel;
}

export interface PlaybookExplanation {
  playbookId: string;
  rank: number;
  totalScore: number;
  decision: PlaybookExplanationDecision;
  summary: string;
  scoreExplanation: string[];
  matchedReasons: string[];
  missingFields: string[];
  approvalNotes: string[];
  limitations: string[];
}

export interface RecommendationExplanation {
  explanationId: string;
  recommendationId: string;
  normalizedAlertId: string;
  alertId: string;
  selectedPlaybookId?: string;
  topPlaybookId: string;
  status: ExplanationStatus;
  summary: string;
  sections: ExplanationSection[];
  playbookExplanations: PlaybookExplanation[];
  limitations: string[];
  analystGuidance: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type RecommendationExplanationDraft = Omit<
  RecommendationExplanation,
  'explanationId' | 'createdAt' | 'updatedAt'
>;

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
  recommendationId: string;
  normalizedAlertId: string;
  alertId: string;
  playbookId: string;
  status: WorkflowExecutionStatus;
  currentStep: number;
  steps: WorkflowStep[];
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowStep {
  step: number;
  action: string;
  type: string;
  description: string;
  approvalRequired: boolean;
  approvalStatus: ApprovalStatus;
  risk: string;
  mockOnly: boolean;
  status: WorkflowStepStatus;
  startedAt?: string;
  finishedAt?: string;
  result?: string;
}

export interface ExecutionLog {
  logId: string;
  executionId: string;
  step?: number;
  action?: string;
  level: ExecutionLogLevel;
  message: string;
  createdAt?: string;
}

export interface ApprovalRequest {
  approvalId: string;
  executionId: string;
  step: number;
  action: string;
  risk: string;
  status: ApprovalStatus;
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionReason?: string;
  createdAt?: string;
  updatedAt?: string;
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
  mode: 'placeholder' | 'worker_backed_normalization';
  defaultAutomationLevel: AutomationLevel;
}
