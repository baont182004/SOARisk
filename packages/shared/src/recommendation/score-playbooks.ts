import { AlertType, AutomationLevel, PlaybookStatus } from '../enums';
import type {
  NormalizedAlert,
  Playbook,
  PlaybookCondition,
  PlaybookRecommendationItem,
  RecommendationScoreBreakdown,
} from '../types';
import {
  AUTOMATION_SUITABILITY_SCORES,
  NO_CONDITIONS_SCORE,
  PARTIAL_ASSET_CONTEXT_SCORE,
  PLAYBOOK_RECOMMENDATION_DEFAULT_TOP_K,
  RECOMMENDATION_SCORE_WEIGHTS,
  SENSITIVE_ACTION_RISK,
  UNAVAILABLE_ASSET_CONTEXT_SCORE,
} from './recommendation-rules';

type ScorePlaybooksOptions = {
  topK?: number;
};

type RankedRecommendation = PlaybookRecommendationItem & {
  exactAlertTypeMatch: boolean;
  genericAlertTypeMatch: boolean;
  sensitiveActionCount: number;
};

export function scorePlaybooksForNormalizedAlert(
  normalizedAlert: NormalizedAlert,
  playbooks: Playbook[],
  options: ScorePlaybooksOptions = {},
) {
  const topK = options.topK ?? PLAYBOOK_RECOMMENDATION_DEFAULT_TOP_K;
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

  return {
    topPlaybooks: ranked.slice(0, topK).map(stripRankingMeta),
    evaluatedPlaybookCount: candidatePlaybooks.length,
  };
}

function scorePlaybook(normalizedAlert: NormalizedAlert, playbook: Playbook): RankedRecommendation {
  const matchedReasons: string[] = [];
  const missingFields = getMissingRequiredFields(normalizedAlert, playbook.requiredFields);
  const exactAlertTypeMatch = playbook.supportedAlertTypes.includes(normalizedAlert.alertType);
  const genericAlertTypeMatch = playbook.supportedAlertTypes.includes(AlertType.GENERIC);

  const alertTypeScore = exactAlertTypeMatch
    ? RECOMMENDATION_SCORE_WEIGHTS.alertType
    : genericAlertTypeMatch
      ? 10
      : 0;

  if (exactAlertTypeMatch) {
    matchedReasons.push(`Exact alert type match for ${normalizedAlert.alertType}.`);
  } else if (genericAlertTypeMatch) {
    matchedReasons.push('Generic fallback playbook available for this alert type.');
  }

  const requiredFieldsScore =
    playbook.requiredFields.length === 0
      ? RECOMMENDATION_SCORE_WEIGHTS.requiredFields
      : roundScore(
          ((playbook.requiredFields.length - missingFields.length) / playbook.requiredFields.length) *
            RECOMMENDATION_SCORE_WEIGHTS.requiredFields,
        );

  matchedReasons.push(
    playbook.requiredFields.length === 0
      ? 'No required fields were defined for this playbook.'
      : `Matched ${playbook.requiredFields.length - missingFields.length}/${playbook.requiredFields.length} required fields.`,
  );

  const severityScore = playbook.severityRange.includes(normalizedAlert.severity)
    ? RECOMMENDATION_SCORE_WEIGHTS.severity
    : 0;

  if (severityScore > 0) {
    matchedReasons.push(`Severity ${normalizedAlert.severity} is within the playbook range.`);
  }

  const assetContextAssessment = scoreAssetContext(normalizedAlert, playbook);
  matchedReasons.push(assetContextAssessment.reason);

  const conditionAssessment = scoreConditions(normalizedAlert, playbook.conditions);
  matchedReasons.push(conditionAssessment.reason);

  const automationScore = AUTOMATION_SUITABILITY_SCORES[playbook.automationLevel];
  matchedReasons.push(getAutomationReason(playbook.automationLevel));

  const scoreBreakdown: RecommendationScoreBreakdown = {
    alertTypeScore,
    requiredFieldsScore,
    severityScore,
    assetContextScore: assetContextAssessment.score,
    conditionScore: conditionAssessment.score,
    automationScore,
    totalScore: roundScore(
      alertTypeScore +
        requiredFieldsScore +
        severityScore +
        assetContextAssessment.score +
        conditionAssessment.score +
        automationScore,
    ),
  };

  return {
    playbookId: playbook.playbookId,
    name: playbook.name,
    incidentCategory: playbook.incidentCategory,
    totalScore: scoreBreakdown.totalScore,
    rank: 0,
    matchedReasons,
    missingFields,
    scoreBreakdown,
    approvalRequired: playbook.approvalRequired,
    automationLevel: playbook.automationLevel,
    exactAlertTypeMatch,
    genericAlertTypeMatch,
    sensitiveActionCount: playbook.actions.filter((action) => action.risk === SENSITIVE_ACTION_RISK)
      .length,
  };
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
  return normalizedAlert[field as keyof NormalizedAlert];
}

function scoreAssetContext(normalizedAlert: NormalizedAlert, playbook: Playbook) {
  const alertLabels = inferAlertAssetContextLabels(normalizedAlert);
  const playbookLabels = playbook.assetContext.map(canonicalizeContextLabel).filter(Boolean);

  if (alertLabels.size === 0) {
    return {
      score: UNAVAILABLE_ASSET_CONTEXT_SCORE,
      reason: 'Asset context was limited, so a neutral context score was applied.',
    };
  }

  if (playbookLabels.some((label) => alertLabels.has(label))) {
    return {
      score: RECOMMENDATION_SCORE_WEIGHTS.assetContext,
      reason: 'Playbook asset context aligns with inferred alert asset labels.',
    };
  }

  const alertTokens = new Set(Array.from(alertLabels).flatMap((label) => label.split('_')));

  if (
    playbookLabels.some((label) =>
      label
        .split('_')
        .some((token) => token.length > 2 && alertTokens.has(token)),
    )
  ) {
    return {
      score: PARTIAL_ASSET_CONTEXT_SCORE,
      reason: 'Playbook asset context partially aligns with inferred alert asset labels.',
    };
  }

  return {
    score: 0,
    reason: 'Playbook asset context did not align with inferred alert asset labels.',
  };
}

function inferAlertAssetContextLabels(normalizedAlert: NormalizedAlert) {
  const labels = new Set<string>();
  const textFragments = new Set<string>();

  const addText = (value: string | undefined) => {
    if (value) {
      textFragments.add(value);
    }
  };

  addText(normalizedAlert.hostname);
  addText(normalizedAlert.assetId);
  addText(normalizedAlert.protocol);
  addText(normalizedAlert.httpUri);
  addText(normalizedAlert.dnsQuery);
  addText(normalizedAlert.username);

  for (const entry of normalizedAlert.assetContext) {
    addText(entry.assetId);
    addText(entry.hostname);
    addText(entry.environment);
    addText(entry.owner);

    for (const tag of entry.tags ?? []) {
      addText(tag);
      labels.add(canonicalizeContextLabel(tag));
    }
  }

  if (normalizedAlert.username) {
    labels.add('identity');
    labels.add('user');
  }

  if (normalizedAlert.dnsQuery || normalizedAlert.protocol === 'dns') {
    labels.add('dns_resolver');
  }

  if (normalizedAlert.httpUri || normalizedAlert.protocol === 'http') {
    labels.add('web_application');
  }

  if (normalizedAlert.sourceIp && !normalizedAlert.targetIp && !normalizedAlert.httpUri) {
    labels.add('endpoint');
  }

  for (const fragment of textFragments) {
    const canonical = canonicalizeContextLabel(fragment);

    if (!canonical) {
      continue;
    }

    labels.add(canonical);

    const tokens = canonical.split('_');

    if (tokens.includes('endpoint') || tokens.includes('workstation') || tokens.includes('desktop')) {
      labels.add('endpoint');
      labels.add('user_device');
    }

    if (tokens.includes('app') || tokens.includes('web')) {
      labels.add('web_application');
    }

    if (tokens.includes('edge') || tokens.includes('gateway') || tokens.includes('firewall')) {
      labels.add('network_edge');
      labels.add('internet_facing');
    }

    if (tokens.includes('jump') || tokens.includes('server') || tokens.includes('host')) {
      labels.add('server');
    }

    if (tokens.includes('dns')) {
      labels.add('dns_resolver');
    }

    if (tokens.includes('email') || tokens.includes('mail')) {
      labels.add('mailbox');
    }
  }

  if (normalizedAlert.hostname && !labels.has('endpoint') && !labels.has('web_application')) {
    labels.add('server');
  }

  return labels;
}

function scoreConditions(normalizedAlert: NormalizedAlert, conditions: PlaybookCondition[]) {
  if (conditions.length === 0) {
    return {
      score: NO_CONDITIONS_SCORE,
      reason: 'No additional playbook conditions were defined; neutral condition score applied.',
    };
  }

  const matched = conditions.filter((condition) => evaluateCondition(normalizedAlert, condition));
  const score = roundScore((matched.length / conditions.length) * RECOMMENDATION_SCORE_WEIGHTS.conditions);
  const reason =
    matched.length === 0
      ? 'No playbook conditions matched the normalized alert.'
      : `Matched ${matched.length}/${conditions.length} playbook conditions.`;

  return {
    score,
    reason,
  };
}

function evaluateCondition(normalizedAlert: NormalizedAlert, condition: PlaybookCondition) {
  const value = getAlertFieldValue(normalizedAlert, condition.field);

  switch (condition.operator) {
    case 'exists':
      return value !== undefined && value !== null && value !== '';
    case 'equals':
      return value === condition.value;
    case 'includes':
      if (typeof value === 'string' && typeof condition.value === 'string') {
        return value.toLowerCase().includes(condition.value.toLowerCase());
      }

      if (Array.isArray(value)) {
        return value.some((item) => item === condition.value);
      }

      return false;
    case 'in':
      return Array.isArray(condition.value) ? condition.value.includes(value as never) : false;
    case 'gte':
      return typeof value === 'number' && typeof condition.value === 'number'
        ? value >= condition.value
        : false;
    case 'lte':
      return typeof value === 'number' && typeof condition.value === 'number'
        ? value <= condition.value
        : false;
    default:
      return false;
  }
}

function getAutomationReason(automationLevel: AutomationLevel) {
  switch (automationLevel) {
    case AutomationLevel.SEMI_AUTOMATED:
      return 'Semi-automated playbook preferred for controlled automation.';
    case AutomationLevel.MANUAL:
      return 'Manual playbook retained moderate suitability for analyst-controlled handling.';
    case AutomationLevel.AUTOMATED:
      return 'Fully automated playbook receives a lower preference in this thesis prototype.';
    default:
      return 'Automation suitability evaluated with deterministic defaults.';
  }
}

function canonicalizeContextLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .toLowerCase();
}

function compareRecommendations(left: RankedRecommendation, right: RankedRecommendation) {
  if (right.totalScore !== left.totalScore) {
    return right.totalScore - left.totalScore;
  }

  if (left.exactAlertTypeMatch !== right.exactAlertTypeMatch) {
    return left.exactAlertTypeMatch ? -1 : 1;
  }

  if (left.genericAlertTypeMatch !== right.genericAlertTypeMatch) {
    return left.genericAlertTypeMatch ? 1 : -1;
  }

  if (left.missingFields.length !== right.missingFields.length) {
    return left.missingFields.length - right.missingFields.length;
  }

  if (left.sensitiveActionCount !== right.sensitiveActionCount) {
    return left.sensitiveActionCount - right.sensitiveActionCount;
  }

  return left.playbookId.localeCompare(right.playbookId);
}

function stripRankingMeta(item: RankedRecommendation): PlaybookRecommendationItem {
  const { exactAlertTypeMatch, genericAlertTypeMatch, sensitiveActionCount, ...rest } = item;
  void exactAlertTypeMatch;
  void genericAlertTypeMatch;
  void sensitiveActionCount;

  return rest;
}

function roundScore(value: number) {
  return Number(value.toFixed(2));
}
