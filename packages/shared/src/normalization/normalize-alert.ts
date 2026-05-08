import { AlertType, NormalizedAlertStatus } from '../enums';
import type {
  AlertEvidence,
  AssetContext,
  NormalizationResult,
  RawAlert,
} from '../types';
import {
  ALERT_TYPE_KEYWORDS,
  DEFAULT_SEVERITY_BY_ALERT_TYPE,
} from './normalization-rules';

export function normalizeRawAlert(rawAlert: RawAlert): NormalizationResult {
  const evidence: AlertEvidence[] = [];
  const notes: string[] = [];

  const inferenceContext = buildInferenceContext(rawAlert);
  const inferredKeyword = findMatchedKeyword(inferenceContext);
  const alertType = rawAlert.alertType ?? inferredKeyword?.alertType ?? AlertType.GENERIC;
  const alertTypeWasInferred = rawAlert.alertType === undefined;

  if (rawAlert.alertType) {
    notes.push('Alert type provided by source.');
  } else if (inferredKeyword) {
    notes.push(`Alert type inferred from title or payload keyword: ${inferredKeyword.keyword}.`);
    evidence.push({
      key: 'matchedKeyword',
      value: inferredKeyword.keyword,
      sourceField: 'title/rawPayload',
      description: `Keyword matched deterministic normalization rule for ${inferredKeyword.alertType}.`,
    });
  } else {
    notes.push('Alert type was not provided and no keyword rule matched; fallback generic applied.');
  }

  const severity = rawAlert.severity ?? DEFAULT_SEVERITY_BY_ALERT_TYPE[alertType];
  const severityWasInferred = rawAlert.severity === undefined;

  if (rawAlert.severity) {
    notes.push('Severity provided by source.');
  } else {
    notes.push('Severity inferred from alert type.');
  }

  let confidence = rawAlert.confidence;
  const confidenceWasInferred = confidence === undefined;

  if (confidence === undefined) {
    confidence = alertType === AlertType.GENERIC ? 40 : rawAlert.alertType ? 80 : 60;
    notes.push('Confidence assigned from deterministic normalization defaults.');
  } else {
    notes.push('Confidence provided by source.');
  }

  addFieldEvidence(evidence, 'sourceIp', rawAlert.sourceIp, 'Source IP captured from raw alert.');
  addFieldEvidence(evidence, 'targetIp', rawAlert.targetIp, 'Target IP captured from raw alert.');
  addFieldEvidence(
    evidence,
    'sourcePort',
    rawAlert.sourcePort,
    'Source port captured from raw alert.',
  );
  addFieldEvidence(
    evidence,
    'targetPort',
    rawAlert.targetPort,
    'Target port captured from raw alert.',
  );
  addFieldEvidence(evidence, 'protocol', rawAlert.protocol, 'Protocol captured from raw alert.');
  addFieldEvidence(evidence, 'dnsQuery', rawAlert.dnsQuery, 'DNS query captured from raw alert.');
  addFieldEvidence(evidence, 'httpUri', rawAlert.httpUri, 'HTTP URI captured from raw alert.');
  addFieldEvidence(evidence, 'username', rawAlert.username, 'Username captured from raw alert.');
  addFieldEvidence(evidence, 'hostname', rawAlert.hostname, 'Hostname captured from raw alert.');

  if (!rawAlert.targetIp) {
    notes.push('Missing targetIp; recommendation quality may be reduced.');
  }

  if (!rawAlert.assetId && !rawAlert.hostname) {
    notes.push('Missing asset context; future playbook matching may have less context.');
  }

  const assetContext = buildAssetContext(rawAlert);
  const additionalContext = buildAdditionalContext(rawAlert, assetContext);

  return {
    normalizedAlert: {
      alertId: rawAlert.alertId,
      source: rawAlert.source,
      alertType,
      title: rawAlert.title,
      severity,
      confidence,
      assetContext,
      additionalContext,
      evidence,
      normalizationStatus: NormalizedAlertStatus.NORMALIZED,
      normalizationNotes: notes,
      ...(rawAlert.description ? { description: rawAlert.description } : {}),
      ...(rawAlert.observedAt ? { observedAt: rawAlert.observedAt } : {}),
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
    },
    alertTypeWasInferred,
    severityWasInferred,
    confidenceWasInferred,
    notes,
    evidence,
  };
}

function buildAdditionalContext(rawAlert: RawAlert, assetContext: AssetContext[]) {
  const rawPayload = rawAlert.rawPayload ?? {};
  const targetCriticality = assetContext.find((entry) => entry.criticality)?.criticality;
  const destinationPorts =
    Array.isArray(rawPayload.ports) && rawPayload.ports.length > 0
      ? rawPayload.ports
      : rawAlert.targetPort !== undefined
        ? [rawAlert.targetPort]
        : undefined;

  return {
    ...rawPayload,
    ...(rawAlert.sourceIp ? { sourceIp: rawAlert.sourceIp } : {}),
    ...(rawAlert.targetIp
      ? {
          targetIp: rawAlert.targetIp,
          destinationIp: rawAlert.targetIp,
        }
      : {}),
    ...(destinationPorts ? { destinationPorts } : {}),
    ...(rawAlert.targetPort !== undefined ? { destinationPort: rawAlert.targetPort } : {}),
    ...(rawAlert.httpUri
      ? {
          httpUri: rawAlert.httpUri,
          url: rawAlert.httpUri,
        }
      : {}),
    ...(rawAlert.dnsQuery
      ? {
          dnsQuery: rawAlert.dnsQuery,
          domain: rawAlert.dnsQuery,
        }
      : {}),
    ...(rawAlert.username
      ? {
          username: rawAlert.username,
          targetUser: rawAlert.username,
        }
      : {}),
    ...(rawAlert.hostname
      ? {
          hostname: rawAlert.hostname,
          hostId: rawAlert.hostname,
        }
      : {}),
    ...(targetCriticality ? { targetAssetCriticality: targetCriticality } : {}),
    confidence: normalizeConfidence(rawAlert.confidence),
    sourceReliability: inferSourceReliability(rawAlert.source),
    timeWindow: typeof rawPayload.timeWindow === 'string' ? rawPayload.timeWindow : '15m',
    tags: rawAlert.tags,
  };
}

function normalizeConfidence(confidence: number | undefined) {
  if (confidence === undefined) {
    return 0.6;
  }

  return confidence > 1 ? Number((confidence / 100).toFixed(4)) : confidence;
}

function inferSourceReliability(source: RawAlert['source']) {
  switch (source) {
    case 'wazuh':
    case 'suricata':
    case 'zeek':
      return 0.82;
    case 'manual':
      return 0.7;
    case 'pcap_demo':
    case 'mock':
      return 0.66;
    default:
      return 0.6;
  }
}

function buildInferenceContext(rawAlert: RawAlert) {
  return [
    rawAlert.title,
    rawAlert.description,
    rawAlert.dnsQuery,
    rawAlert.httpUri,
    JSON.stringify(rawAlert.rawPayload ?? {}),
  ]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLowerCase();
}

function findMatchedKeyword(context: string) {
  for (const rule of ALERT_TYPE_KEYWORDS) {
    for (const keyword of rule.keywords) {
      if (context.includes(keyword)) {
        return {
          alertType: rule.alertType,
          keyword,
        };
      }
    }
  }

  return undefined;
}

function addFieldEvidence(
  evidence: AlertEvidence[],
  key: string,
  value: string | number | undefined,
  description: string,
) {
  if (value === undefined) {
    return;
  }

  evidence.push({
    key,
    value: String(value),
    sourceField: key,
    description,
  });
}

function buildAssetContext(rawAlert: RawAlert): AssetContext[] {
  if (!rawAlert.assetId && !rawAlert.hostname && !rawAlert.targetIp && rawAlert.tags.length === 0) {
    return [];
  }

  return [
    {
      tags: rawAlert.tags,
      ...(rawAlert.assetId ? { assetId: rawAlert.assetId } : {}),
      ...(rawAlert.hostname ? { hostname: rawAlert.hostname } : {}),
      ...(rawAlert.targetIp ? { ipAddress: rawAlert.targetIp } : {}),
    },
  ];
}
