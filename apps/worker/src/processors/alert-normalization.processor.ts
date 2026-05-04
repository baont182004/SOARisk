import {
  QUEUE_NAMES,
  NORMALIZE_ALERT_JOB_NAME,
  normalizeRawAlert,
  type NormalizedAlertDraft,
  type NormalizeAlertJobData,
  type NormalizeAlertJobResult,
  type RawAlert as SharedRawAlert,
} from '@soc-soar/shared';
import { Worker } from 'bullmq';

import { NormalizedAlertModel } from '../models/normalized-alert.model';
import { RawAlertModel, type RawAlertRecord } from '../models/raw-alert.model';
import { queueConnection } from '../queues';

export function createAlertNormalizationWorker() {
  console.log('[worker] started alert-normalization processor.');

  return new Worker<
    NormalizeAlertJobData,
    NormalizeAlertJobResult,
    typeof NORMALIZE_ALERT_JOB_NAME
  >(
    QUEUE_NAMES.ALERT_NORMALIZATION,
    async (job) => {
      const { alertId, force } = job.data;

      console.log(
        `[alert-normalization-queue] received normalize-alert job ${job.id} for alertId=${alertId ?? 'unknown'}`,
      );

      try {
        if (!alertId) {
          throw new Error('normalize-alert job requires an alertId.');
        }

        const rawAlertDocument = await RawAlertModel.findOne({ alertId }).exec();

        if (!rawAlertDocument) {
          throw new Error(`Raw alert '${alertId}' was not found.`);
        }

        const existingNormalizedAlert = await NormalizedAlertModel.findOne({ alertId })
          .sort({ createdAt: -1 })
          .exec();

        if (existingNormalizedAlert && force !== true) {
          console.log(
            `[alert-normalization-queue] skipped duplicate normalization for alertId=${alertId}.`,
          );

          return {
            status: 'skipped',
            reason: 'Normalized alert already exists.',
            alertId,
            normalizedAlertId: existingNormalizedAlert.normalizedAlertId,
          };
        }

        const normalizationResult = normalizeRawAlert(
          mapRawAlertForNormalization(rawAlertDocument.toObject()),
        );
        const normalizedPayload = mapNormalizedAlertForPersistence(
          normalizationResult.normalizedAlert,
        );

        if (existingNormalizedAlert) {
          existingNormalizedAlert.set({
            normalizedAlertId: existingNormalizedAlert.normalizedAlertId,
            ...normalizedPayload,
          });
          await existingNormalizedAlert.save();

          console.log(
            `[alert-normalization-queue] updated normalized alert ${existingNormalizedAlert.normalizedAlertId} for alertId=${alertId}.`,
          );

          return {
            status: 'normalized',
            alertId,
            normalizedAlertId: existingNormalizedAlert.normalizedAlertId,
            created: false,
          };
        }

        const createdNormalizedAlert = await NormalizedAlertModel.create({
          normalizedAlertId: generateNormalizedAlertId(),
          ...normalizedPayload,
        });

        console.log(
          `[alert-normalization-queue] created normalized alert ${createdNormalizedAlert.normalizedAlertId} for alertId=${alertId}.`,
        );

        return {
          status: 'normalized',
          alertId,
          normalizedAlertId: createdNormalizedAlert.normalizedAlertId,
          created: true,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown normalization error.';
        console.error(
          `[alert-normalization-queue] failed normalization job ${job.id} for alertId=${alertId ?? 'unknown'}: ${message}`,
        );
        throw error;
      }
    },
    { connection: queueConnection },
  );
}

function mapRawAlertForNormalization(rawAlert: RawAlertRecord): SharedRawAlert {
  return {
    alertId: rawAlert.alertId,
    source: rawAlert.source,
    title: rawAlert.title,
    tags: rawAlert.tags ?? [],
    createdAt: rawAlert.createdAt.toISOString(),
    updatedAt: rawAlert.updatedAt.toISOString(),
    ...(rawAlert.sourceAlertId ? { sourceAlertId: rawAlert.sourceAlertId } : {}),
    ...(rawAlert.description ? { description: rawAlert.description } : {}),
    ...(rawAlert.alertType ? { alertType: rawAlert.alertType } : {}),
    ...(rawAlert.severity ? { severity: rawAlert.severity } : {}),
    ...(rawAlert.confidence !== undefined ? { confidence: rawAlert.confidence } : {}),
    ...(rawAlert.observedAt ? { observedAt: rawAlert.observedAt.toISOString() } : {}),
    ...(rawAlert.sourceIp ? { sourceIp: rawAlert.sourceIp } : {}),
    ...(rawAlert.targetIp ? { targetIp: rawAlert.targetIp } : {}),
    ...(rawAlert.sourcePort !== undefined ? { sourcePort: rawAlert.sourcePort } : {}),
    ...(rawAlert.targetPort !== undefined ? { targetPort: rawAlert.targetPort } : {}),
    ...(rawAlert.protocol ? { protocol: rawAlert.protocol } : {}),
    ...(rawAlert.dnsQuery ? { dnsQuery: rawAlert.dnsQuery } : {}),
    ...(rawAlert.httpUri ? { httpUri: rawAlert.httpUri } : {}),
    ...(rawAlert.username ? { username: rawAlert.username } : {}),
    ...(rawAlert.hostname ? { hostname: rawAlert.hostname } : {}),
    ...(rawAlert.assetId ? { assetId: rawAlert.assetId } : {}),
    ...(rawAlert.rawPayload ? { rawPayload: rawAlert.rawPayload } : {}),
  };
}

function mapNormalizedAlertForPersistence(normalizedAlert: NormalizedAlertDraft) {
  return {
    alertId: normalizedAlert.alertId,
    source: normalizedAlert.source,
    alertType: normalizedAlert.alertType,
    title: normalizedAlert.title,
    description: normalizedAlert.description,
    severity: normalizedAlert.severity,
    confidence: normalizedAlert.confidence,
    observedAt: normalizedAlert.observedAt ? new Date(normalizedAlert.observedAt) : undefined,
    sourceIp: normalizedAlert.sourceIp,
    targetIp: normalizedAlert.targetIp,
    sourcePort: normalizedAlert.sourcePort,
    targetPort: normalizedAlert.targetPort,
    protocol: normalizedAlert.protocol,
    dnsQuery: normalizedAlert.dnsQuery,
    httpUri: normalizedAlert.httpUri,
    username: normalizedAlert.username,
    hostname: normalizedAlert.hostname,
    assetId: normalizedAlert.assetId,
    assetContext: normalizedAlert.assetContext,
    evidence: normalizedAlert.evidence,
    normalizationStatus: normalizedAlert.normalizationStatus,
    normalizationNotes: normalizedAlert.normalizationNotes,
  };
}

function generateNormalizedAlertId() {
  return `NAL-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}
