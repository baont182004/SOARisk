import {
  EXPLANATION_DEFAULT_ANALYST_GUIDANCE,
  EXPLANATION_DEFAULT_LIMITATIONS,
} from '../constants';
import {
  ApprovalPolicy,
  AutomationLevel,
  ExplanationRiskLevel,
  PlaybookActionType,
  PlaybookStepRisk,
  Severity,
} from '../enums';
import type {
  NormalizedAlert,
  Playbook,
  PlaybookRecommendationItem,
  RecommendationScoreBreakdown,
} from '../types';

export const EXPLANATION_SECTION_ORDER = [
  'summary',
  'score_breakdown',
  'matched_conditions',
  'missing_fields',
  'approval_required',
  'limitations',
  'analyst_guidance',
] as const;

export function getDefaultLimitations() {
  return Array.from(EXPLANATION_DEFAULT_LIMITATIONS) as string[];
}

export function getDefaultAnalystGuidance() {
  return Array.from(EXPLANATION_DEFAULT_ANALYST_GUIDANCE) as string[];
}

export function buildScoreBreakdownExplanation(
  recommendation: PlaybookRecommendationItem,
): string[] {
  const { scoreBreakdown } = recommendation;

  return [
    formatScoreLine(
      'Alert type score',
      scoreBreakdown.alertTypeScore,
      getAlertTypeScoreReason(recommendation),
    ),
    formatScoreLine(
      'Required fields score',
      scoreBreakdown.requiredFieldsScore,
      recommendation.missingFields.length === 0
        ? 'all required fields used by the playbook are present in the normalized alert'
        : `the normalized alert is missing ${recommendation.missingFields.length} required field(s): ${recommendation.missingFields.join(', ')}`,
    ),
    formatScoreLine(
      'Severity score',
      scoreBreakdown.severityScore,
      scoreBreakdown.severityScore > 0
        ? 'alert severity is within the playbook scope'
        : 'alert severity is outside the playbook scope',
    ),
    formatScoreLine(
      'Asset context score',
      scoreBreakdown.assetContextScore,
      getAssetContextReason(scoreBreakdown.assetContextScore),
    ),
    formatScoreLine(
      'Indicator context score',
      scoreBreakdown.indicatorContextScore ?? scoreBreakdown.conditionScore ?? 0,
      getConditionScoreReason(scoreBreakdown.indicatorContextScore ?? scoreBreakdown.conditionScore ?? 0),
    ),
    formatScoreLine(
      'Automation suitability score',
      scoreBreakdown.automationScore,
      getAutomationReason(recommendation.automationLevel),
    ),
  ];
}

export function buildMatchedFieldStatements(
  normalizedAlert: NormalizedAlert,
  recommendation: PlaybookRecommendationItem,
) {
  const statements = [
    `Normalized alert type is ${normalizedAlert.alertType}, which aligns with ${recommendation.playbookId}.`,
    `Alert severity is ${normalizedAlert.severity}.`,
  ];

  if (normalizedAlert.sourceIp) {
    statements.push(`Source IP is available as ${normalizedAlert.sourceIp}.`);
  }

  if (normalizedAlert.targetIp) {
    statements.push(`Target IP is available as ${normalizedAlert.targetIp}.`);
  }

  if (normalizedAlert.protocol) {
    statements.push(`Observed protocol is ${normalizedAlert.protocol}.`);
  }

  const assetLabels = collectAssetLabels(normalizedAlert);

  if (assetLabels.length > 0) {
    statements.push(`Observed asset context includes ${assetLabels.join(', ')}.`);
  }

  return statements;
}

export function buildApprovalNotes(playbook: Playbook | undefined, approvalRequired: boolean) {
  if (!playbook) {
    return approvalRequired
      ? [
          'This playbook is flagged as requiring analyst approval before sensitive mock-only response steps are considered.',
        ]
      : [
          'This playbook is not currently flagged for sensitive action approval in the structured dataset.',
        ];
  }

  const sensitiveActions = playbook.actions.filter(
    (action) =>
      action.approvalRequired ||
      action.risk === PlaybookStepRisk.SENSITIVE ||
      action.type === PlaybookActionType.CONTAINMENT,
  );

  if (sensitiveActions.length === 0) {
    return [
      'This playbook does not require sensitive action approval in its current structured definition.',
    ];
  }

  return sensitiveActions.map((action) => {
    const mode = action.mockOnly ? 'mock-only' : 'documented';
    return `Step ${action.step} ${action.action} is ${mode}, marked ${action.risk}, and requires analyst approval before any future orchestration phase.`;
  });
}

export function buildPlaybookLimitations(
  recommendation: PlaybookRecommendationItem,
  playbook: Playbook | undefined,
) {
  const limitations: string[] = [];

  if (recommendation.missingFields.length > 0) {
    limitations.push(
      `Recommendation quality is reduced because these required fields are missing: ${recommendation.missingFields.join(', ')}.`,
    );
  }

  if (recommendation.scoreBreakdown.alertTypeScore < 35) {
    limitations.push(
      'This playbook did not receive a full exact alert-type match and should be treated as broader decision support.',
    );
  }

  if (recommendation.scoreBreakdown.assetContextScore <= 3) {
    limitations.push(
      'Asset context contributed limited evidence, so environment-specific response choices still require analyst review.',
    );
  }

  if (
    playbook &&
    playbook.approvalPolicy === ApprovalPolicy.REQUIRED_FOR_ALL_ACTIONS &&
    !limitations.includes(
      'All structured actions in this playbook are approval-gated, so no operational step should proceed without analyst review.',
    )
  ) {
    limitations.push(
      'All structured actions in this playbook are approval-gated, so no operational step should proceed without analyst review.',
    );
  }

  if (limitations.length === 0) {
    limitations.push(
      'This playbook aligns well with the current normalized alert, but analyst review is still required before operational action.',
    );
  }

  return limitations;
}

export function getApprovalSectionSeverity(
  playbook: Playbook | undefined,
  approvalRequired: boolean,
) {
  if (!playbook) {
    return approvalRequired ? ExplanationRiskLevel.HIGH : ExplanationRiskLevel.LOW;
  }

  return playbook.actions.some((action) => action.risk === PlaybookStepRisk.SENSITIVE)
    ? ExplanationRiskLevel.HIGH
    : approvalRequired
      ? ExplanationRiskLevel.MEDIUM
      : ExplanationRiskLevel.LOW;
}

export function getMissingFieldsSectionSeverity(missingFields: string[]) {
  return missingFields.length > 0 ? ExplanationRiskLevel.MEDIUM : ExplanationRiskLevel.LOW;
}

export function getLimitationsSectionSeverity(normalizedAlert: NormalizedAlert) {
  return normalizedAlert.severity === Severity.CRITICAL || normalizedAlert.severity === Severity.HIGH
    ? ExplanationRiskLevel.HIGH
    : ExplanationRiskLevel.MEDIUM;
}

function formatScoreLine(label: string, score: number, reason: string) {
  return `${label}: ${score}. This score was assigned because ${reason}.`;
}

function getAlertTypeScoreReason(recommendation: PlaybookRecommendationItem) {
  if (recommendation.scoreBreakdown.alertTypeScore >= 35) {
    return 'the playbook directly supports the observed alert type';
  }

  if (recommendation.scoreBreakdown.alertTypeScore >= 10) {
    return 'the playbook is a generic fallback instead of an exact alert-type match';
  }

  return 'the playbook does not directly support the observed alert type';
}

function getAssetContextReason(score: RecommendationScoreBreakdown['assetContextScore']) {
  if (score >= 10) {
    return 'the inferred asset context aligns with the playbook scope';
  }

  if (score >= 5) {
    return 'the inferred asset context only partially aligns with the playbook scope';
  }

  if (score >= 3) {
    return 'asset context was limited, so a neutral context score was applied';
  }

  return 'asset context did not materially align with the playbook scope';
}

function getConditionScoreReason(score: number) {
  if (score >= 15) {
    return 'all defined playbook conditions matched the normalized alert';
  }

  if (score > 5) {
    return 'some playbook conditions matched the normalized alert';
  }

  if (score === 5) {
    return 'the playbook has no additional conditions, so a neutral score was applied';
  }

  return 'the playbook conditions did not materially match the normalized alert';
}

function getAutomationReason(automationLevel: AutomationLevel) {
  switch (automationLevel) {
    case AutomationLevel.SEMI_AUTOMATED:
      return 'semi-automated playbooks are preferred in this thesis prototype for controlled analyst oversight';
    case AutomationLevel.MANUAL:
      return 'manual playbooks remain suitable when a human-led investigation path is appropriate';
    case AutomationLevel.AUTOMATED:
      return 'fully automated playbooks are scored more conservatively to avoid overstating operational autonomy';
    default:
      return 'automation suitability follows deterministic defaults';
  }
}

function collectAssetLabels(normalizedAlert: NormalizedAlert) {
  const labels = new Set<string>();

  for (const entry of normalizedAlert.assetContext) {
    if (entry.environment) {
      labels.add(entry.environment);
    }

    if (entry.owner) {
      labels.add(entry.owner);
    }

    for (const tag of entry.tags ?? []) {
      labels.add(tag);
    }
  }

  if (normalizedAlert.hostname) {
    labels.add(normalizedAlert.hostname);
  }

  if (normalizedAlert.assetId) {
    labels.add(normalizedAlert.assetId);
  }

  return [...labels];
}
