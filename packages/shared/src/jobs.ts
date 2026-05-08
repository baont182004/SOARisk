import { QUEUE_NAMES } from './constants';

export const NORMALIZE_ALERT_JOB_NAME = 'normalize-alert';
export const NORMALIZE_ALERT_QUEUE_NAME = QUEUE_NAMES.ALERT_NORMALIZATION;
export const RECOMMEND_PLAYBOOKS_JOB_NAME = 'recommend-playbooks';
export const RECOMMEND_PLAYBOOKS_QUEUE_NAME = QUEUE_NAMES.RECOMMENDATION;
export const GENERATE_EXPLANATION_JOB_NAME = 'generate-explanation';
export const GENERATE_EXPLANATION_QUEUE_NAME = QUEUE_NAMES.EXPLANATION;
export const START_WORKFLOW_JOB_NAME = 'start-workflow';
export const START_WORKFLOW_QUEUE_NAME = QUEUE_NAMES.WORKFLOW_EXECUTION;
export const GENERATE_REPORT_JOB_NAME = 'generate-report';
export const GENERATE_REPORT_QUEUE_NAME = QUEUE_NAMES.REPORT_GENERATION;

export interface NormalizeAlertJobData {
  alertId: string;
  force?: boolean;
  requestedBy?: string;
  requestedAt: string;
}

export interface NormalizeAlertQueuedResponse {
  jobId: string;
  queueName: typeof NORMALIZE_ALERT_QUEUE_NAME;
  jobName: typeof NORMALIZE_ALERT_JOB_NAME;
  alertId: string;
  force: boolean;
  status: 'queued';
}

export interface NormalizeAlertJobStatusSnapshot {
  jobId: string;
  queueName: typeof NORMALIZE_ALERT_QUEUE_NAME;
  name: string;
  state: string;
  progress: string | boolean | number | object;
  data: NormalizeAlertJobData;
  returnvalue: unknown;
  failedReason: string | undefined;
  timestamp: number;
  processedOn: number | undefined;
  finishedOn: number | undefined;
}

export interface NormalizeAlertJobNormalizedResult {
  status: 'normalized';
  alertId: string;
  normalizedAlertId: string;
  created: boolean;
}

export interface NormalizeAlertJobSkippedResult {
  status: 'skipped';
  reason: string;
  alertId: string;
  normalizedAlertId: string;
  created?: false;
}

export type NormalizeAlertJobResult =
  | NormalizeAlertJobNormalizedResult
  | NormalizeAlertJobSkippedResult;

export interface RecommendPlaybooksJobData {
  normalizedAlertId: string;
  topK?: number;
  force?: boolean;
  requestedAt: string;
}

export interface RecommendPlaybooksQueuedResponse {
  jobId: string;
  queueName: typeof RECOMMEND_PLAYBOOKS_QUEUE_NAME;
  jobName: typeof RECOMMEND_PLAYBOOKS_JOB_NAME;
  normalizedAlertId: string;
  topK: number;
  force: boolean;
  status: 'queued';
}

export interface GenerateExplanationJobData {
  recommendationId: string;
  force?: boolean;
  requestedAt: string;
}

export interface GenerateExplanationQueuedResponse {
  jobId: string;
  queueName: typeof GENERATE_EXPLANATION_QUEUE_NAME;
  jobName: typeof GENERATE_EXPLANATION_JOB_NAME;
  recommendationId: string;
  force: boolean;
  status: 'queued';
}

export interface StartWorkflowJobData {
  executionId: string;
  requestedAt: string;
}

export interface StartWorkflowQueuedResponse {
  jobId: string;
  queueName: typeof START_WORKFLOW_QUEUE_NAME;
  jobName: typeof START_WORKFLOW_JOB_NAME;
  executionId: string;
  status: 'queued';
}

export interface GenerateReportJobData {
  executionId: string;
  requestedAt: string;
}

export interface GenerateReportQueuedResponse {
  jobId: string;
  queueName: typeof GENERATE_REPORT_QUEUE_NAME;
  jobName: typeof GENERATE_REPORT_JOB_NAME;
  executionId: string;
  status: 'queued';
}

export interface QueueJobStatusSnapshot {
  jobId: string;
  queueName: string;
  name: string;
  state: string;
  progress: string | boolean | number | object;
  data: unknown;
  returnvalue: unknown;
  failedReason: string | undefined;
  attemptsMade: number;
  timestamp: number;
  processedOn: number | undefined;
  finishedOn: number | undefined;
}

export function buildNormalizeAlertJobId(alertId: string) {
  return `${NORMALIZE_ALERT_JOB_NAME}__${alertId}`;
}

export function buildRecommendPlaybooksJobId(normalizedAlertId: string) {
  return `${RECOMMEND_PLAYBOOKS_JOB_NAME}__${normalizedAlertId}`;
}

export function buildGenerateExplanationJobId(recommendationId: string) {
  return `${GENERATE_EXPLANATION_JOB_NAME}__${recommendationId}`;
}

export function buildStartWorkflowJobId(executionId: string) {
  return `${START_WORKFLOW_JOB_NAME}__${executionId}`;
}

export function buildGenerateReportJobId(executionId: string) {
  return `${GENERATE_REPORT_JOB_NAME}__${executionId}`;
}
