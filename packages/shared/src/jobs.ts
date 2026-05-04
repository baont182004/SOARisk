import { QUEUE_NAMES } from './constants';

export const NORMALIZE_ALERT_JOB_NAME = 'normalize-alert';
export const NORMALIZE_ALERT_QUEUE_NAME = QUEUE_NAMES.ALERT_NORMALIZATION;
export const RECOMMEND_PLAYBOOKS_JOB_NAME = 'recommend-playbooks';
export const RECOMMEND_PLAYBOOKS_QUEUE_NAME = QUEUE_NAMES.RECOMMENDATION;

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

export function buildNormalizeAlertJobId(alertId: string) {
  return `${NORMALIZE_ALERT_JOB_NAME}:${alertId}`;
}

export function buildRecommendPlaybooksJobId(normalizedAlertId: string) {
  return `${RECOMMEND_PLAYBOOKS_JOB_NAME}:${normalizedAlertId}`;
}
