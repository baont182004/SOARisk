import { Injectable } from '@nestjs/common';
import {
  AlertType,
  NormalizedAlertStatus,
  Severity,
  type AlertEvidence,
  type AssetContext,
  type NormalizationResult,
  type RawAlert,
} from '@soc-soar/shared';

const ALERT_TYPE_KEYWORDS: Array<{
  alertType: AlertType;
  keywords: string[];
}> = [
  { alertType: AlertType.PORT_SCAN, keywords: ['scan', 'nmap', 'port'] },
  { alertType: AlertType.ICMP_FLOOD, keywords: ['icmp', 'ping flood'] },
  {
    alertType: AlertType.WEB_SQL_INJECTION,
    keywords: ['sql', 'union select', 'sqli'],
  },
  { alertType: AlertType.WEB_XSS, keywords: ['xss', 'script'] },
  {
    alertType: AlertType.SUSPICIOUS_DNS_QUERY,
    keywords: ['dns', 'domain'],
  },
  { alertType: AlertType.BOTNET_C2, keywords: ['c2', 'botnet'] },
  { alertType: AlertType.MALWARE_TRAFFIC, keywords: ['malware'] },
];

const DEFAULT_SEVERITY_BY_ALERT_TYPE: Record<AlertType, Severity> = {
  [AlertType.PORT_SCAN]: Severity.MEDIUM,
  [AlertType.ICMP_FLOOD]: Severity.HIGH,
  [AlertType.DOS_ATTEMPT]: Severity.HIGH,
  [AlertType.WEB_SQL_INJECTION]: Severity.HIGH,
  [AlertType.WEB_XSS]: Severity.MEDIUM,
  [AlertType.SUSPICIOUS_DNS_QUERY]: Severity.MEDIUM,
  [AlertType.MALWARE_TRAFFIC]: Severity.HIGH,
  [AlertType.BOTNET_C2]: Severity.HIGH,
  [AlertType.BRUTE_FORCE]: Severity.MEDIUM,
  [AlertType.PHISHING]: Severity.MEDIUM,
  [AlertType.MALWARE_HASH]: Severity.HIGH,
  [AlertType.DATA_EXFILTRATION]: Severity.HIGH,
  [AlertType.GENERIC]: Severity.LOW,
};

@Injectable()
export class NormalizationService {
  normalize(rawAlert: RawAlert): NormalizationResult {
    const evidence: AlertEvidence[] = [];
    const notes: string[] = [];

    const inferenceContext = this.buildInferenceContext(rawAlert);
    const inferredKeyword = this.findMatchedKeyword(inferenceContext);
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

    this.addFieldEvidence(evidence, 'sourceIp', rawAlert.sourceIp, 'Source IP captured from raw alert.');
    this.addFieldEvidence(evidence, 'targetIp', rawAlert.targetIp, 'Target IP captured from raw alert.');
    this.addFieldEvidence(
      evidence,
      'sourcePort',
      rawAlert.sourcePort,
      'Source port captured from raw alert.',
    );
    this.addFieldEvidence(
      evidence,
      'targetPort',
      rawAlert.targetPort,
      'Target port captured from raw alert.',
    );
    this.addFieldEvidence(evidence, 'protocol', rawAlert.protocol, 'Protocol captured from raw alert.');
    this.addFieldEvidence(evidence, 'dnsQuery', rawAlert.dnsQuery, 'DNS query captured from raw alert.');
    this.addFieldEvidence(evidence, 'httpUri', rawAlert.httpUri, 'HTTP URI captured from raw alert.');
    this.addFieldEvidence(evidence, 'username', rawAlert.username, 'Username captured from raw alert.');
    this.addFieldEvidence(evidence, 'hostname', rawAlert.hostname, 'Hostname captured from raw alert.');

    if (!rawAlert.targetIp) {
      notes.push('Missing targetIp; recommendation quality may be reduced.');
    }

    if (!rawAlert.assetId && !rawAlert.hostname) {
      notes.push('Missing asset context; future playbook matching may have less context.');
    }

    const assetContext = this.buildAssetContext(rawAlert);

    return {
      normalizedAlert: {
        alertId: rawAlert.alertId,
        source: rawAlert.source,
        alertType,
        title: rawAlert.title,
        severity,
        confidence,
        assetContext,
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

  private buildInferenceContext(rawAlert: RawAlert) {
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

  private findMatchedKeyword(context: string) {
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

  private addFieldEvidence(
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

  private buildAssetContext(rawAlert: RawAlert): AssetContext[] {
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
}
