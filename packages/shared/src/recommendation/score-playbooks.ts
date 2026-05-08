import {
  AlertType,
  AutomationLevel,
  PlaybookStatus,
  Severity,
} from '../enums';
import type {
  NormalizedAlert,
  Playbook,
  PlaybookRecommendationItem,
  RecommendationCriterionBreakdown,
} from '../types';

type ScorePlaybooksOptions = {
  topK?: number;
};

type ComponentResult = {
  score: number;
  evidence: string;
};

type RankedRecommendation = PlaybookRecommendationItem & {
  requiredFieldCoverage: number;
  exactAlertTypeMatch: boolean;
  approvalRiskScore: number;
};

const DEFAULT_TOP_K = 3;

export const SCORING_MODEL = {
  modelId: 'SOARISK-RS-V2',
  modelName: 'SOARisk Explainable Weighted Playbook Recommendation',
  version: '1.0.0',
  weights: {
    alertTypeMatch: 0.25,
    mitreTechniqueMatch: 0.15,
    severityMatch: 0.13,
    requiredFieldCoverage: 0.12,
    assetCriticalityMatch: 0.1,
    indicatorContextMatch: 0.08,
    alertConfidence: 0.07,
    sourceReliability: 0.04,
    automationSuitability: 0.04,
    historicalPerformance: 0.02,
  },
  penalties: {
    missingCriticalField: 0.06,
    unsafeAutomationRisk: 0.05,
    approvalRiskHigh: 0.03,
    approvalRiskCritical: 0.06,
    knownBenignSignal: 0.08,
    conflictingMitreContext: 0.07,
  },
  thresholds: {
    highConfidence: 78,
    mediumConfidence: 62,
    lowConfidence: 0,
    ambiguousTopGap: 5,
    minimumRecommendableScore: 45,
  },
} as const;

export function scorePlaybooksForNormalizedAlert(
  normalizedAlert: NormalizedAlert,
  playbooks: Playbook[],
  options: ScorePlaybooksOptions = {},
) {
  const topK = options.topK ?? DEFAULT_TOP_K;
  const candidatePlaybooks = playbooks.filter(
    (playbook) => playbook.status === PlaybookStatus.ACTIVE,
  );
  const ranked = candidatePlaybooks
    .map((playbook) => scorePlaybook(normalizedAlert, playbook))
    .sort(compareRecommendations)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  const aboveThreshold = ranked.filter(
    (item) => item.totalScore >= SCORING_MODEL.thresholds.minimumRecommendableScore,
  );
  const recommended = aboveThreshold.length >= topK ? aboveThreshold : ranked;

  return {
    topPlaybooks: recommended.slice(0, topK).map(stripRankingMeta),
    evaluatedPlaybookCount: candidatePlaybooks.length,
    scoringModel: {
      modelId: SCORING_MODEL.modelId,
      version: SCORING_MODEL.version,
    },
  };
}

export function baselineRecommendPlaybooks(
  normalizedAlert: NormalizedAlert,
  playbooks: Playbook[],
  options: ScorePlaybooksOptions = {},
) {
  const topK = options.topK ?? DEFAULT_TOP_K;

  return playbooks
    .filter((playbook) => playbook.status === PlaybookStatus.ACTIVE)
    .map((playbook) => ({
      playbookId: playbook.playbookId,
      score: getAlertTypeComponent(normalizedAlert, playbook).score,
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.playbookId.localeCompare(right.playbookId);
    })
    .slice(0, topK)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}

function scorePlaybook(normalizedAlert: NormalizedAlert, playbook: Playbook): RankedRecommendation {
  const alertType = getAlertTypeComponent(normalizedAlert, playbook);
  const mitre = getMitreComponent(normalizedAlert, playbook);
  const severity = getSeverityComponent(normalizedAlert, playbook);
  const required = getRequiredFieldComponent(normalizedAlert, playbook);
  const assetCriticality = getAssetCriticalityComponent(normalizedAlert, playbook);
  const indicator = getIndicatorContextComponent(normalizedAlert, playbook);
  const confidence = getAlertConfidenceComponent(normalizedAlert);
  const sourceReliability = getSourceReliabilityComponent(normalizedAlert, playbook);
  const automation = getAutomationComponent(playbook);
  const historical = {
    score: 0.5,
    evidence: 'Default neutral historical performance because no analyst feedback dataset is stored yet.',
  };
  const penalties = getPenaltyComponents(normalizedAlert, playbook, required, mitre);
  const criteria = {
    alertTypeMatch: alertType,
    mitreTechniqueMatch: mitre,
    severityMatch: severity,
    requiredFieldCoverage: required,
    assetCriticalityMatch: assetCriticality,
    indicatorContextMatch: indicator,
    alertConfidence: confidence,
    sourceReliability,
    automationSuitability: automation,
    historicalPerformance: historical,
  };
  const weightedScore = Object.entries(criteria).reduce((sum, [criterion, value]) => {
    const weight = SCORING_MODEL.weights[criterion as keyof typeof SCORING_MODEL.weights];
    return sum + weight * value.score;
  }, 0);
  const penaltyTotal = penalties.reduce((sum, item) => sum + item.value, 0);
  const totalScore = roundScore(clamp(100 * weightedScore - 100 * penaltyTotal, 0, 100));
  const criteriaBreakdown = buildCriteriaBreakdown(criteria);
  const missingFields = getMissingRequiredFields(normalizedAlert, playbook.requiredFields);
  const matchedCriteria = criteriaBreakdown
    .filter((item) => item.componentScore >= 0.7)
    .map((item) => item.criterion);
  const missingCriteria = [
    ...criteriaBreakdown.filter((item) => item.componentScore < 0.5).map((item) => item.criterion),
    ...penalties.map((item) => item.criterion),
  ];
  const matchedReasons = criteriaBreakdown
    .filter((item) => item.componentScore >= 0.5)
    .map((item) => item.evidence);
  const explanation = buildExplanation(normalizedAlert, playbook, criteriaBreakdown, penalties);

  return {
    playbookId: playbook.playbookId,
    name: playbook.name,
    incidentCategory: playbook.incidentCategory,
    totalScore,
    finalScore: totalScore,
    confidenceBand: getConfidenceBand(totalScore),
    rank: 0,
    matchedReasons,
    missingFields,
    missingCriteria,
    matchedCriteria,
    explanation,
    criteriaBreakdown,
    scoreBreakdown: {
      alertTypeScore: roundScore(alertType.score * SCORING_MODEL.weights.alertTypeMatch * 100),
      mitreTechniqueScore: roundScore(
        mitre.score * SCORING_MODEL.weights.mitreTechniqueMatch * 100,
      ),
      requiredFieldsScore: roundScore(
        required.score * SCORING_MODEL.weights.requiredFieldCoverage * 100,
      ),
      severityScore: roundScore(severity.score * SCORING_MODEL.weights.severityMatch * 100),
      assetContextScore: roundScore(
        assetCriticality.score * SCORING_MODEL.weights.assetCriticalityMatch * 100,
      ),
      conditionScore: roundScore(indicator.score * SCORING_MODEL.weights.indicatorContextMatch * 100),
      indicatorContextScore: roundScore(
        indicator.score * SCORING_MODEL.weights.indicatorContextMatch * 100,
      ),
      alertConfidenceScore: roundScore(
        confidence.score * SCORING_MODEL.weights.alertConfidence * 100,
      ),
      sourceReliabilityScore: roundScore(
        sourceReliability.score * SCORING_MODEL.weights.sourceReliability * 100,
      ),
      automationScore: roundScore(
        automation.score * SCORING_MODEL.weights.automationSuitability * 100,
      ),
      historicalPerformanceScore: roundScore(
        historical.score * SCORING_MODEL.weights.historicalPerformance * 100,
      ),
      penaltyScore: roundScore(penaltyTotal * 100),
      totalScore,
    },
    approvalRequired: playbook.approvalRequired,
    automationLevel: playbook.automationLevel,
    requiredFieldCoverage: required.score,
    exactAlertTypeMatch: alertType.score === 1,
    approvalRiskScore: getApprovalRiskScore(playbook.approvalRisk),
    ...(playbook.approvalRisk !== undefined ? { approvalRisk: playbook.approvalRisk } : {}),
    ...(playbook.automationSuitability !== undefined
      ? { automationSuitability: playbook.automationSuitability }
      : {}),
    ...(playbook.mitreTechniques !== undefined ? { mitreTechniques: playbook.mitreTechniques } : {}),
  };
}

function getAlertTypeComponent(normalizedAlert: NormalizedAlert, playbook: Playbook): ComponentResult {
  if (playbook.supportedAlertTypes.includes(normalizedAlert.alertType)) {
    return {
      score: 1,
      evidence: `Alert type matched ${normalizedAlert.alertType}.`,
    };
  }

  if (getRelatedAlertTypes(normalizedAlert.alertType).some((type) => playbook.supportedAlertTypes.includes(type))) {
    return {
      score: 0.35,
      evidence: `Alert type ${normalizedAlert.alertType} is related to playbook category ${playbook.supportedAlertTypes.join(', ')}.`,
    };
  }

  return {
    score: 0,
    evidence: `Alert type ${normalizedAlert.alertType} did not match this playbook.`,
  };
}

function getMitreComponent(normalizedAlert: NormalizedAlert, playbook: Playbook): ComponentResult {
  const alertTechniques = getMitreTechniqueIds(normalizedAlert);
  const playbookTechniques = new Set((playbook.mitreTechniques ?? []).map((item) => item.id));

  if (alertTechniques.length === 0) {
    return {
      score: 0.5,
      evidence: 'Alert has no MITRE mapping, so a neutral MITRE score was applied.',
    };
  }

  if (alertTechniques.some((technique) => playbookTechniques.has(technique))) {
    return {
      score: 1,
      evidence: `MITRE technique matched ${alertTechniques.join(', ')}.`,
    };
  }

  const alertTactics = getMitreTactics(normalizedAlert);
  const playbookTactics = new Set((playbook.mitreTechniques ?? []).map((item) => item.tactic.toLowerCase()));

  if (alertTactics.some((tactic) => Array.from(playbookTactics).some((item) => item.includes(tactic)))) {
    return {
      score: 0.7,
      evidence: `MITRE tactic context partially matched ${alertTactics.join(', ')}.`,
    };
  }

  return {
    score: 0,
    evidence: 'MITRE context did not match this playbook.',
  };
}

function getSeverityComponent(normalizedAlert: NormalizedAlert, playbook: Playbook): ComponentResult {
  const severity = normalizedAlert.severity;

  if (playbook.severityRange.includes(severity)) {
    return {
      score: 1,
      evidence: `Severity ${severity} is within playbook affinity.`,
    };
  }

  if (playbook.severityRange.some((item) => isAdjacentSeverity(severity, item))) {
    return {
      score: 0.7,
      evidence: `Severity ${severity} is adjacent to playbook affinity.`,
    };
  }

  return {
    score: 0.3,
    evidence: `Severity ${severity} is outside playbook affinity.`,
  };
}

function getRequiredFieldComponent(normalizedAlert: NormalizedAlert, playbook: Playbook): ComponentResult {
  if (playbook.requiredFields.length === 0) {
    return {
      score: 1,
      evidence: 'Playbook has no required fields.',
    };
  }

  const missing = getMissingRequiredFields(normalizedAlert, playbook.requiredFields);
  const matched = playbook.requiredFields.length - missing.length;

  return {
    score: roundRatio(matched, playbook.requiredFields.length),
    evidence: `Required field coverage ${matched}/${playbook.requiredFields.length}.`,
  };
}

function getAssetCriticalityComponent(normalizedAlert: NormalizedAlert, playbook: Playbook): ComponentResult {
  const alertCriticality = getSeverityField(normalizedAlert, 'targetAssetCriticality') ?? getAssetCriticality(normalizedAlert);
  const affinity = playbook.assetCriticalityAffinity ?? [];

  if (!alertCriticality) {
    return {
      score: 0.4,
      evidence: 'Asset criticality is missing, so a conservative score was applied.',
    };
  }

  if (affinity.includes(alertCriticality)) {
    return {
      score: 1,
      evidence: `Asset criticality ${alertCriticality} matched playbook affinity.`,
    };
  }

  if (affinity.some((item) => isAdjacentSeverity(alertCriticality, item))) {
    return {
      score: 0.7,
      evidence: `Asset criticality ${alertCriticality} is adjacent to playbook affinity.`,
    };
  }

  return {
    score: 0.2,
    evidence: `Asset criticality ${alertCriticality} did not match playbook affinity.`,
  };
}

function getIndicatorContextComponent(normalizedAlert: NormalizedAlert, playbook: Playbook): ComponentResult {
  const positiveSignals = playbook.scoringHints?.positiveSignals ?? [];
  const negativeSignals = playbook.scoringHints?.negativeSignals ?? [];
  const positives = positiveSignals.filter((signal) => matchesSignal(normalizedAlert, signal));
  const negatives = negativeSignals.filter((signal) => matchesSignal(normalizedAlert, signal));

  if (positiveSignals.length === 0 && negativeSignals.length === 0) {
    return {
      score: 0.5,
      evidence: 'No scoring hints were defined for indicator context.',
    };
  }

  const positiveScore = positiveSignals.length === 0 ? 0.5 : positives.length / positiveSignals.length;
  const negativePressure = negativeSignals.length === 0 ? 0 : negatives.length / negativeSignals.length;

  return {
    score: clamp(0.4 + positiveScore * 0.6 - negativePressure * 0.5, 0, 1),
    evidence:
      positives.length > 0
        ? `Indicator signals matched: ${positives.join(', ')}.`
        : 'No strong playbook-specific indicator signal matched.',
  };
}

function getAlertConfidenceComponent(normalizedAlert: NormalizedAlert): ComponentResult {
  const confidence = getNumberField(normalizedAlert, 'confidence') ?? 0.5;
  const normalized = confidence > 1 ? confidence / 100 : confidence;

  return {
    score: clamp(normalized, 0, 1),
    evidence: `Alert confidence ${roundScore(clamp(normalized, 0, 1))}.`,
  };
}

function getSourceReliabilityComponent(normalizedAlert: NormalizedAlert, playbook: Playbook): ComponentResult {
  const reliability = getNumberField(normalizedAlert, 'sourceReliability') ?? 0.6;
  const min = playbook.sourceReliabilityMin ?? 0.5;

  return {
    score: reliability >= min ? 1 : clamp(reliability / min, 0, 1),
    evidence: `Source reliability ${roundScore(reliability)} compared with playbook minimum ${min}.`,
  };
}

function getAutomationComponent(playbook: Playbook): ComponentResult {
  const base = playbook.automationSuitability ?? getDefaultAutomationSuitability(playbook.automationLevel);
  const riskAdjustment =
    playbook.approvalRisk === 'critical' ? 0.25 : playbook.approvalRisk === 'high' ? 0.15 : 0;

  return {
    score: clamp(base - riskAdjustment, 0, 1),
    evidence: `Automation suitability ${base} with approval risk ${playbook.approvalRisk ?? 'unspecified'}.`,
  };
}

function getPenaltyComponents(
  normalizedAlert: NormalizedAlert,
  playbook: Playbook,
  required: ComponentResult,
  mitre: ComponentResult,
) {
  const penalties: Array<{ criterion: string; value: number; evidence: string }> = [];
  const missingFields = getMissingRequiredFields(normalizedAlert, playbook.requiredFields);

  if (missingFields.length > 0) {
    penalties.push({
      criterion: 'missingCriticalField',
      value: SCORING_MODEL.penalties.missingCriticalField,
      evidence: `Missing required fields: ${missingFields.join(', ')}.`,
    });
  }

  if ((playbook.approvalRisk === 'high' || playbook.approvalRisk === 'critical') && required.score < 0.8) {
    penalties.push({
      criterion: 'unsafeAutomationRisk',
      value: SCORING_MODEL.penalties.unsafeAutomationRisk,
      evidence: 'High-risk playbook has incomplete execution context.',
    });
  }

  if (playbook.approvalRisk === 'high' && getAlertConfidenceComponent(normalizedAlert).score < 0.75) {
    penalties.push({
      criterion: 'approvalRiskHigh',
      value: SCORING_MODEL.penalties.approvalRiskHigh,
      evidence: 'High approval risk with less-than-strong confidence.',
    });
  }

  if (playbook.approvalRisk === 'critical' && getAlertConfidenceComponent(normalizedAlert).score < 0.85) {
    penalties.push({
      criterion: 'approvalRiskCritical',
      value: SCORING_MODEL.penalties.approvalRiskCritical,
      evidence: 'Critical approval risk requires stronger alert confidence.',
    });
  }

  if ((playbook.scoringHints?.negativeSignals ?? []).some((signal) => matchesSignal(normalizedAlert, signal))) {
    penalties.push({
      criterion: 'knownBenignSignal',
      value: SCORING_MODEL.penalties.knownBenignSignal,
      evidence: 'Known benign or suppressing signal matched this playbook.',
    });
  }

  if (getMitreTechniqueIds(normalizedAlert).length > 0 && mitre.score === 0) {
    penalties.push({
      criterion: 'conflictingMitreContext',
      value: SCORING_MODEL.penalties.conflictingMitreContext,
      evidence: 'Alert MITRE context conflicts with playbook mapping.',
    });
  }

  return penalties;
}

function buildCriteriaBreakdown(criteria: Record<string, ComponentResult>): RecommendationCriterionBreakdown[] {
  return Object.entries(criteria).map(([criterion, value]) => {
    const weight = SCORING_MODEL.weights[criterion as keyof typeof SCORING_MODEL.weights];

    return {
      criterion,
      weight,
      componentScore: roundScore(value.score),
      weightedContribution: roundScore(weight * value.score * 100),
      evidence: value.evidence,
    };
  });
}

function buildExplanation(
  normalizedAlert: NormalizedAlert,
  playbook: Playbook,
  breakdown: RecommendationCriterionBreakdown[],
  penalties: Array<{ criterion: string; value: number; evidence: string }>,
) {
  const positives = breakdown
    .filter((item) => item.componentScore >= 0.7)
    .slice(0, 4)
    .map((item) => item.evidence);
  const negatives = [
    ...breakdown.filter((item) => item.componentScore < 0.5).slice(0, 2).map((item) => item.evidence),
    ...penalties.slice(0, 2).map((item) => item.evidence),
  ];

  return [
    `Recommended because ${positives.length > 0 ? positives.join(' ') : `it is a candidate for ${normalizedAlert.alertType}`}`,
    `The playbook '${playbook.name}' has approval risk ${playbook.approvalRisk ?? 'unspecified'} and automation suitability ${playbook.automationSuitability ?? 'n/a'}.`,
    negatives.length > 0 ? `Downgraded by: ${negatives.join(' ')}` : 'No major downgrade signal was detected.',
  ].join(' ');
}

function getMissingRequiredFields(normalizedAlert: NormalizedAlert, requiredFields: string[]) {
  return requiredFields.filter((field) => !hasAlertFieldValue(normalizedAlert, field));
}

function hasAlertFieldValue(normalizedAlert: NormalizedAlert, field: string) {
  const value = getAlertFieldValue(normalizedAlert, field);

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null && value !== '';
}

function getAlertFieldValue(normalizedAlert: NormalizedAlert, field: string): unknown {
  const direct = (normalizedAlert as unknown as Record<string, unknown>)[field];

  if (direct !== undefined) {
    return direct;
  }

  const contextValue = normalizedAlert.additionalContext?.[field];

  if (contextValue !== undefined) {
    return contextValue;
  }

  const aliases: Record<string, string[]> = {
    destinationIp: ['targetIp'],
    destinationPorts: ['targetPort'],
    destinationPort: ['targetPort'],
    url: ['httpUri'],
    domain: ['dnsQuery'],
    hostId: ['hostname', 'assetId'],
    targetUser: ['username'],
    targetAssetCriticality: ['assetContext.0.criticality'],
  };

  for (const alias of aliases[field] ?? []) {
    if (alias === 'assetContext.0.criticality') {
      const criticality = normalizedAlert.assetContext[0]?.criticality;

      if (criticality) {
        return criticality;
      }

      continue;
    }

    const aliasValue = (normalizedAlert as unknown as Record<string, unknown>)[alias];

    if (aliasValue !== undefined) {
      return field === 'destinationPorts' && !Array.isArray(aliasValue) ? [aliasValue] : aliasValue;
    }
  }

  const evidence = normalizedAlert.evidence.find((item) => item.key === field);

  return evidence?.value;
}

function getNumberField(normalizedAlert: NormalizedAlert, field: string) {
  const value = getAlertFieldValue(normalizedAlert, field);

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }

  return undefined;
}

function getSeverityField(normalizedAlert: NormalizedAlert, field: string) {
  const value = getAlertFieldValue(normalizedAlert, field);

  return isSeverity(value) ? value : undefined;
}

function getAssetCriticality(normalizedAlert: NormalizedAlert) {
  return normalizedAlert.assetContext.find((item) => item.criticality)?.criticality;
}

function getMitreTechniqueIds(normalizedAlert: NormalizedAlert) {
  const value = getAlertFieldValue(normalizedAlert, 'mitreTechniques');

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (item && typeof item === 'object' && 'id' in item) {
        return String((item as { id: unknown }).id);
      }

      return undefined;
    })
    .filter((item): item is string => Boolean(item));
}

function getMitreTactics(normalizedAlert: NormalizedAlert) {
  const value = getAlertFieldValue(normalizedAlert, 'mitreTechniques');

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (item && typeof item === 'object' && 'tactic' in item) {
        return String((item as { tactic: unknown }).tactic).toLowerCase();
      }

      return undefined;
    })
    .filter((item): item is string => Boolean(item));
}

function matchesSignal(normalizedAlert: NormalizedAlert, signal: string) {
  const text = JSON.stringify(normalizedAlert).toLowerCase();

  if (text.includes(signal.toLowerCase())) {
    return true;
  }

  switch (signal) {
    case 'high_unique_ports':
    case 'admin_ports':
      return getArrayLength(normalizedAlert, 'destinationPorts') >= 4;
    case 'single_port':
      return getArrayLength(normalizedAlert, 'destinationPorts') <= 1;
    case 'external_source':
      return !isPrivateIp(String(getAlertFieldValue(normalizedAlert, 'sourceIp') ?? ''));
    case 'internal_source':
      return isPrivateIp(String(getAlertFieldValue(normalizedAlert, 'sourceIp') ?? ''));
    case 'many_internal_targets':
      return (getNumberField(normalizedAlert, 'uniqueTargetCount') ?? 0) >= 5;
    case 'critical_asset':
    case 'sensitive_asset':
      return ['high', 'critical'].includes(String(getAlertFieldValue(normalizedAlert, 'targetAssetCriticality')));
    case 'public_asset':
    case 'exposed_service':
    case 'known_exposed_service':
      return Boolean(getAlertFieldValue(normalizedAlert, 'service')) || Boolean(getAlertFieldValue(normalizedAlert, 'url'));
    case 'scanner_signature':
    case 'repeated_probe':
    case 'known_scanner':
    case 'known_internal_scanner':
    case 'known_patch_scanner':
    case 'approved_vulnerability_scanner':
      return (getNumberField(normalizedAlert, 'eventCount') ?? 0) >= 20;
    case 'sqli_payload':
    case 'login_bypass_payload':
      return /union|select|sleep|or 1=1|'1'='1/i.test(String(getAlertFieldValue(normalizedAlert, 'payloadSnippet') ?? getAlertFieldValue(normalizedAlert, 'url') ?? ''));
    case 'auth_endpoint':
      return /auth|login|reset/i.test(String(getAlertFieldValue(normalizedAlert, 'endpointRole') ?? getAlertFieldValue(normalizedAlert, 'url') ?? ''));
    case 'db_error':
      return getAlertFieldValue(normalizedAlert, 'dbErrorIndicator') === true || getNumberField(normalizedAlert, 'statusCode') === 500;
    case 'large_response':
      return (getNumberField(normalizedAlert, 'responseSize') ?? 0) > 100000;
    case 'waf_alert':
      return getAlertFieldValue(normalizedAlert, 'wafAction') !== undefined;
    case 'blocked_by_waf_only':
      return String(getAlertFieldValue(normalizedAlert, 'wafAction') ?? '').toLowerCase() === 'blocked' && getAlertFieldValue(normalizedAlert, 'webshellIndicator') !== true;
    case 'only_403_responses':
    case '4xx_response':
      return String(getAlertFieldValue(normalizedAlert, 'statusCode') ?? '').startsWith('4');
    case '200_after_payload':
      return getNumberField(normalizedAlert, 'statusCode') === 200 && /union|select|sleep|or 1=1|'1'='1/i.test(String(getAlertFieldValue(normalizedAlert, 'payloadSnippet') ?? ''));
    case 'static_test_payload':
      return /test|demo/i.test(String(getAlertFieldValue(normalizedAlert, 'payloadSnippet') ?? getAlertFieldValue(normalizedAlert, 'url') ?? ''));
    case 'webshell_indicator':
    case 'unexpected_file_write':
    case 'web_process_shell':
      return getAlertFieldValue(normalizedAlert, 'webshellIndicator') === true;
    case 'repeated_waf_block':
    case 'same_source_many_urls':
      return String(getAlertFieldValue(normalizedAlert, 'wafAction') ?? '').toLowerCase() === 'blocked' || (getNumberField(normalizedAlert, 'eventCount') ?? 0) >= 80;
    case 'dga_domain':
    case 'high_entropy_domain':
      return (getNumberField(normalizedAlert, 'entropyScore') ?? 0) >= 0.65;
    case 'many_nxdomain':
      return (getNumberField(normalizedAlert, 'nxdomainCount') ?? 0) >= 20 || (getNumberField(normalizedAlert, 'queryCount') ?? 0) >= 1000;
    case 'domain_age_low':
      return (getNumberField(normalizedAlert, 'domainAgeDays') ?? Number.POSITIVE_INFINITY) <= 30;
    case 'rare_domain':
      return (getNumberField(normalizedAlert, 'domainAgeDays') ?? Number.POSITIVE_INFINITY) <= 90 || String(getAlertFieldValue(normalizedAlert, 'threatIntelVerdict') ?? '').toLowerCase() === 'unknown';
    case 'dns_tunnel':
    case 'long_query':
    case 'long_dns_queries':
      return (getNumberField(normalizedAlert, 'avgQueryLength') ?? 0) >= 100 || (getNumberField(normalizedAlert, 'queryCount') ?? 0) >= 1000;
    case 'malicious_domain':
    case 'c2_domain':
    case 'threat_intel_malicious':
    case 'c2_tag':
      return ['malicious', 'suspicious'].includes(String(getAlertFieldValue(normalizedAlert, 'threatIntelVerdict') ?? '').toLowerCase());
    case 'external_lookup':
      return Boolean(getAlertFieldValue(normalizedAlert, 'domain'));
    case 'known_dns_security_tool':
    case 'dns_filter_test':
      return /security|filter|dns/i.test(String(getAlertFieldValue(normalizedAlert, 'sourceAssetRole') ?? getAlertFieldValue(normalizedAlert, 'domain') ?? ''));
    case 'cdn_or_tracking_domain':
    case 'known_business_vendor':
    case 'known_vendor_thread':
      return /cdn|track|vendor|business/i.test(String(getAlertFieldValue(normalizedAlert, 'domain') ?? getAlertFieldValue(normalizedAlert, 'senderDomain') ?? ''));
    case 'user_typo_pattern':
      return /typo|mistyped/i.test(String(getAlertFieldValue(normalizedAlert, 'domain') ?? ''));
    case 'many_failures':
    case 'single_user_many_failures':
    case 'multiple_attempts':
      return (getNumberField(normalizedAlert, 'failedLoginCount') ?? getNumberField(normalizedAlert, 'eventCount') ?? 0) >= 20;
    case 'password_spray':
    case 'many_users_same_source':
    case 'wide_auth_attempts':
      return (getNumberField(normalizedAlert, 'uniqueUserCount') ?? 0) >= 10;
    case 'low_per_user_failures':
      return (getNumberField(normalizedAlert, 'uniqueUserCount') ?? 0) >= 10 && (getNumberField(normalizedAlert, 'failedLoginCount') ?? 0) / Math.max(1, getNumberField(normalizedAlert, 'uniqueUserCount') ?? 1) <= 20;
    case 'privileged_account':
    case 'privileged_user':
      return getAlertFieldValue(normalizedAlert, 'isPrivileged') === true;
    case 'privileged_server':
      return ['high', 'critical'].includes(String(getAlertFieldValue(normalizedAlert, 'targetAssetCriticality')));
    case 'admin_service':
      return /rdp|ssh|ldap|winrm/i.test(String(getAlertFieldValue(normalizedAlert, 'authService') ?? getAlertFieldValue(normalizedAlert, 'service') ?? ''));
    case 'success_after_failures':
      return getAlertFieldValue(normalizedAlert, 'successAfterFailure') === true;
    case 'new_geo':
      return Boolean(getAlertFieldValue(normalizedAlert, 'loginGeo'));
    case 'rdp_or_ssh':
      return /rdp|ssh/i.test(String(getAlertFieldValue(normalizedAlert, 'authService') ?? getAlertFieldValue(normalizedAlert, 'service') ?? getAlertFieldValue(normalizedAlert, 'destinationPort') ?? ''));
    case 'same_source':
    case 'short_time_window':
      return (getNumberField(normalizedAlert, 'eventCount') ?? 0) >= 20;
    case 'no_success':
      return getAlertFieldValue(normalizedAlert, 'successAfterFailure') !== true;
    case 'expected_travel_or_vpn':
    case 'load_test_or_sso_migration':
    case 'break_glass_test':
      return /vpn|sso|test|break/i.test(String(getAlertFieldValue(normalizedAlert, 'loginGeo') ?? getAlertFieldValue(normalizedAlert, 'sourceAssetRole') ?? ''));
    case 'user_reported':
      return getAlertFieldValue(normalizedAlert, 'userReported') === true || Boolean(getAlertFieldValue(normalizedAlert, 'reportingUser'));
    case 'suspicious_sender':
    case 'display_name_mismatch':
    case 'executive_impersonation':
      return /spoof|mismatch|executive|ceo|suspicious/i.test(String(getAlertFieldValue(normalizedAlert, 'sender') ?? getAlertFieldValue(normalizedAlert, 'senderDomain') ?? getAlertFieldValue(normalizedAlert, 'subject') ?? ''));
    case 'clicked':
      return getAlertFieldValue(normalizedAlert, 'clicked') === true || getAlertFieldValue(normalizedAlert, 'urlClicked') === true;
    case 'credential_submitted':
    case 'login_after_click':
      return getAlertFieldValue(normalizedAlert, 'credentialSubmitted') === true || getAlertFieldValue(normalizedAlert, 'loginAfterClick') === true;
    case 'login_like_url':
      return /login|signin|auth|account/i.test(String(getAlertFieldValue(normalizedAlert, 'url') ?? getAlertFieldValue(normalizedAlert, 'domain') ?? ''));
    case 'attachment_malware':
    case 'malicious_attachment':
    case 'macro_or_script':
    case 'sandbox_malicious':
      return String(getAlertFieldValue(normalizedAlert, 'sandboxVerdict') ?? '').toLowerCase() === 'malicious';
    case 'financial_request':
    case 'payment_keyword':
      return getAlertFieldValue(normalizedAlert, 'financialKeyword') === true;
    case 'similar_messages':
      return (getNumberField(normalizedAlert, 'recipientCount') ?? getNumberField(normalizedAlert, 'eventCount') ?? 0) >= 10;
    case 'internal_newsletter':
    case 'awareness_test':
    case 'security_awareness_simulation':
      return /newsletter|awareness|training/i.test(String(getAlertFieldValue(normalizedAlert, 'subject') ?? getAlertFieldValue(normalizedAlert, 'sender') ?? ''));
    case 'edr_detection':
      return Boolean(getAlertFieldValue(normalizedAlert, 'edrAction') ?? getAlertFieldValue(normalizedAlert, 'malwareName'));
    case 'known_bad_hash':
      return Boolean(getAlertFieldValue(normalizedAlert, 'fileHash'));
    case 'quarantine_failed':
      return /fail/i.test(String(getAlertFieldValue(normalizedAlert, 'edrAction') ?? ''));
    case 'encoded_command':
      return /encoded|powershell|cmd|base64/i.test(String(getAlertFieldValue(normalizedAlert, 'commandLine') ?? ''));
    case 'office_parent_process':
      return /winword|excel|powerpnt|outlook/i.test(String(getAlertFieldValue(normalizedAlert, 'parentProcess') ?? ''));
    case 'suspicious_child_process':
      return /cmd|powershell|wscript|cscript|rundll/i.test(String(getAlertFieldValue(normalizedAlert, 'processName') ?? getAlertFieldValue(normalizedAlert, 'commandLine') ?? ''));
    case 'admin_script_signed':
      return getAlertFieldValue(normalizedAlert, 'signedScript') === true;
    case 'pua_low_risk':
    case 'clean_sandbox_high_confidence':
    case 'stale_ioc_low_confidence':
      return /pua|clean|stale/i.test(String(getAlertFieldValue(normalizedAlert, 'malwareName') ?? getAlertFieldValue(normalizedAlert, 'sandboxVerdict') ?? ''));
    case 'malware_plus_c2':
    case 'beaconing':
    case 'beacon_pattern':
    case 'repeated_beacon':
    case 'regular_intervals':
      return Boolean(getAlertFieldValue(normalizedAlert, 'domain')) && ['malicious', 'suspicious'].includes(String(getAlertFieldValue(normalizedAlert, 'threatIntelVerdict') ?? '').toLowerCase());
    case 'high_file_change_rate':
    case 'ransom_note':
    case 'shadow_copy_delete':
      return (getNumberField(normalizedAlert, 'fileChangeRate') ?? 0) > 1000 || getAlertFieldValue(normalizedAlert, 'ransomNoteIndicator') === true;
    case 'large_bytes_out':
    case 'high_bytes_out':
    case 'rare_destination':
      return (getNumberField(normalizedAlert, 'bytesOut') ?? 0) > 100000000;
    case 'c2_plus_bytes_out':
      return Boolean(getAlertFieldValue(normalizedAlert, 'domain')) && (getNumberField(normalizedAlert, 'bytesOut') ?? 0) > 100000000;
    default:
      return signal
        .split('_')
        .filter((token) => token.length > 2)
        .some((token) => text.includes(token));
  }
}

function getArrayLength(normalizedAlert: NormalizedAlert, field: string) {
  const value = getAlertFieldValue(normalizedAlert, field);

  if (Array.isArray(value)) {
    return value.length;
  }

  return value === undefined ? 0 : 1;
}

function getRelatedAlertTypes(alertType: AlertType) {
  switch (alertType) {
    case AlertType.BOTNET_C2:
    case AlertType.MALWARE_TRAFFIC:
    case AlertType.MALWARE_HASH:
      return [AlertType.MALWARE];
    case AlertType.WEB_XSS:
      return [AlertType.WEB_SQL_INJECTION];
    case AlertType.ICMP_FLOOD:
    case AlertType.DOS_ATTEMPT:
      return [AlertType.PORT_SCAN];
    default:
      return [];
  }
}

function getDefaultAutomationSuitability(automationLevel: AutomationLevel) {
  switch (automationLevel) {
    case AutomationLevel.AUTOMATED:
      return 0.8;
    case AutomationLevel.SEMI_AUTOMATED:
      return 0.6;
    case AutomationLevel.MANUAL:
      return 0.35;
    default:
      return 0.5;
  }
}

function compareRecommendations(left: RankedRecommendation, right: RankedRecommendation) {
  if (right.totalScore !== left.totalScore) {
    return right.totalScore - left.totalScore;
  }

  if (right.requiredFieldCoverage !== left.requiredFieldCoverage) {
    return right.requiredFieldCoverage - left.requiredFieldCoverage;
  }

  if (left.approvalRiskScore !== right.approvalRiskScore) {
    return left.approvalRiskScore - right.approvalRiskScore;
  }

  return left.playbookId.localeCompare(right.playbookId);
}

function stripRankingMeta(item: RankedRecommendation): PlaybookRecommendationItem {
  const { requiredFieldCoverage, exactAlertTypeMatch, approvalRiskScore, ...rest } = item;
  void requiredFieldCoverage;
  void exactAlertTypeMatch;
  void approvalRiskScore;

  return rest;
}

function getConfidenceBand(score: number) {
  if (score >= SCORING_MODEL.thresholds.highConfidence) {
    return 'high';
  }

  if (score >= SCORING_MODEL.thresholds.mediumConfidence) {
    return 'medium';
  }

  return 'low';
}

function getApprovalRiskScore(risk: Playbook['approvalRisk']) {
  switch (risk) {
    case 'low':
      return 1;
    case 'medium':
      return 2;
    case 'high':
      return 3;
    case 'critical':
      return 4;
    default:
      return 2;
  }
}

function isAdjacentSeverity(left: Severity, right: Severity) {
  return Math.abs(severityIndex(left) - severityIndex(right)) === 1;
}

function severityIndex(severity: Severity) {
  return [Severity.LOW, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL].indexOf(severity);
}

function isSeverity(value: unknown): value is Severity {
  return typeof value === 'string' && Object.values(Severity).includes(value as Severity);
}

function isPrivateIp(ip: string) {
  return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
}

function roundRatio(numerator: number, denominator: number) {
  if (denominator === 0) {
    return 0;
  }

  return roundScore(numerator / denominator);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundScore(value: number) {
  return Number(value.toFixed(4));
}
