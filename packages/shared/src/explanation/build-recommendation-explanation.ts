import {
  ExplanationRiskLevel,
  ExplanationSectionType,
  ExplanationStatus,
  PlaybookStepRisk,
} from '../enums';
import type {
  ExplanationSection,
  NormalizedAlert,
  Playbook,
  PlaybookExplanation,
  PlaybookRecommendationItem,
  PlaybookRecommendationResult,
  RecommendationExplanationDraft,
} from '../types';
import {
  buildApprovalNotes,
  buildMatchedFieldStatements,
  buildPlaybookLimitations,
  buildScoreBreakdownExplanation,
  getApprovalSectionSeverity,
  getDefaultAnalystGuidance,
  getDefaultLimitations,
  getLimitationsSectionSeverity,
  getMissingFieldsSectionSeverity,
} from './explanation-rules';

type BuildRecommendationExplanationInput = {
  recommendation: PlaybookRecommendationResult;
  normalizedAlert: NormalizedAlert;
  selectedPlaybook?: Playbook;
  candidatePlaybooks?: Playbook[];
};

export function buildRecommendationExplanation(
  input: BuildRecommendationExplanationInput,
): RecommendationExplanationDraft {
  const { recommendation, normalizedAlert } = input;
  const topPlaybook = recommendation.topPlaybooks[0];

  if (!topPlaybook) {
    throw new Error('Recommendation explanation requires at least one ranked playbook.');
  }

  const playbookLookup = new Map(
    (input.candidatePlaybooks ?? []).map((playbook) => [playbook.playbookId, playbook]),
  );
  const selectedPlaybook =
    input.selectedPlaybook ??
    (recommendation.selectedPlaybookId
      ? playbookLookup.get(recommendation.selectedPlaybookId)
      : undefined);
  const topPlaybookDefinition = playbookLookup.get(topPlaybook.playbookId);
  const analystGuidance = buildAnalystGuidance(normalizedAlert, topPlaybook, recommendation);
  const limitations = buildExplanationLimitations(topPlaybook, recommendation);
  const playbookExplanations = recommendation.topPlaybooks.map((item) =>
    buildPlaybookExplanation(item, recommendation, playbookLookup.get(item.playbookId)),
  );
  const summary = buildSummary(
    recommendation,
    topPlaybook,
    selectedPlaybook,
    topPlaybookDefinition,
    normalizedAlert,
  );
  const sections = buildSections(
    normalizedAlert,
    topPlaybook,
    topPlaybookDefinition,
    summary,
    limitations,
    analystGuidance,
  );

  return {
    recommendationId: recommendation.recommendationId,
    normalizedAlertId: recommendation.normalizedAlertId,
    alertId: recommendation.alertId,
    ...(recommendation.selectedPlaybookId
      ? { selectedPlaybookId: recommendation.selectedPlaybookId }
      : {}),
    topPlaybookId: topPlaybook.playbookId,
    status: ExplanationStatus.GENERATED,
    summary,
    sections,
    playbookExplanations,
    limitations,
    analystGuidance,
  };
}

function buildSummary(
  recommendation: PlaybookRecommendationResult,
  topPlaybook: PlaybookRecommendationItem,
  selectedPlaybook: Playbook | undefined,
  topPlaybookDefinition: Playbook | undefined,
  normalizedAlert: NormalizedAlert,
) {
  const summaryParts = [
    `The highest ranked playbook is ${topPlaybook.playbookId} ${topPlaybook.name} because the normalized alert type matches ${normalizedAlert.alertType}, required fields are ${topPlaybook.missingFields.length === 0 ? 'available' : 'partially available'}, and severity is ${topPlaybook.scoreBreakdown.severityScore > 0 ? 'within' : 'outside'} the playbook scope.`,
  ];

  const contextScore =
    topPlaybook.scoreBreakdown.indicatorContextScore ??
    topPlaybook.scoreBreakdown.conditionScore ??
    0;

  if (contextScore > 0) {
    summaryParts.push(
      `The recommendation also benefits from playbook-condition coverage and an asset-context score of ${topPlaybook.scoreBreakdown.assetContextScore}.`,
    );
  }

  if (
    recommendation.selectedPlaybookId &&
    recommendation.selectedPlaybookId !== topPlaybook.playbookId &&
    selectedPlaybook
  ) {
    summaryParts.push(
      `The current recommendation record reflects analyst selection of ${selectedPlaybook.playbookId} ${selectedPlaybook.name}, so the top-ranked playbook is not the currently selected option.`,
    );
  } else if (recommendation.selectedPlaybookId === topPlaybook.playbookId) {
    summaryParts.push(
      'The highest-ranked playbook is also the currently selected option in the recommendation record.',
    );
  }

  if (topPlaybookDefinition?.approvalRequired) {
    summaryParts.push(
      'Sensitive response steps remain mock-only and require analyst approval before any future orchestration phase.',
    );
  }

  return summaryParts.join(' ');
}

function buildSections(
  normalizedAlert: NormalizedAlert,
  topPlaybook: PlaybookRecommendationItem,
  topPlaybookDefinition: Playbook | undefined,
  summary: string,
  limitations: string[],
  analystGuidance: string[],
) {
  return [
    buildSection(
      ExplanationSectionType.SUMMARY,
      'Recommendation Summary',
      summary,
      ['alertType', 'severity', 'supportedAlertTypes'],
      ExplanationRiskLevel.LOW,
    ),
    buildSection(
      ExplanationSectionType.SCORE_BREAKDOWN,
      'Score Breakdown',
      buildScoreBreakdownExplanation(topPlaybook).join(' '),
      [
        'alertTypeScore',
        'requiredFieldsScore',
        'severityScore',
        'assetContextScore',
        'conditionScore',
        'automationScore',
      ],
      ExplanationRiskLevel.LOW,
    ),
    buildSection(
      ExplanationSectionType.MATCHED_CONDITIONS,
      'Matched Alert Fields',
      buildMatchedConditionsContent(normalizedAlert, topPlaybook),
      ['alertType', 'sourceIp', 'targetIp', 'protocol', 'severity', 'assetContext'],
      ExplanationRiskLevel.LOW,
    ),
    buildSection(
      ExplanationSectionType.MISSING_FIELDS,
      'Missing Required Fields',
      buildMissingFieldsContent(topPlaybook),
      topPlaybook.missingFields,
      getMissingFieldsSectionSeverity(topPlaybook.missingFields),
    ),
    buildSection(
      ExplanationSectionType.APPROVAL_REQUIRED,
      'Approval Notes',
      buildApprovalNotes(topPlaybookDefinition, topPlaybook.approvalRequired).join(' '),
      topPlaybookDefinition?.actions
        .filter(
          (action) =>
            action.approvalRequired || action.risk === PlaybookStepRisk.SENSITIVE,
        )
        .map((action) => action.action) ?? [],
      getApprovalSectionSeverity(topPlaybookDefinition, topPlaybook.approvalRequired),
    ),
    buildSection(
      ExplanationSectionType.LIMITATIONS,
      'Recommendation Limitations',
      limitations.join(' '),
      ['normalizedAlert', 'playbookMetadata'],
      getLimitationsSectionSeverity(normalizedAlert),
    ),
    buildSection(
      ExplanationSectionType.ANALYST_GUIDANCE,
      'Analyst Guidance',
      analystGuidance.join(' '),
      ['analystReview'],
      ExplanationRiskLevel.MEDIUM,
    ),
  ];
}

function buildMatchedConditionsContent(
  normalizedAlert: NormalizedAlert,
  topPlaybook: PlaybookRecommendationItem,
) {
  const statements = buildMatchedFieldStatements(normalizedAlert, topPlaybook);

  if (topPlaybook.matchedReasons.length > 0) {
    statements.push(...topPlaybook.matchedReasons);
  }

  return statements.join(' ');
}

function buildMissingFieldsContent(topPlaybook: PlaybookRecommendationItem) {
  if (topPlaybook.missingFields.length === 0) {
    return 'No required fields are missing for the top recommendation.';
  }

  return `Recommendation quality may be reduced because these fields are missing: ${topPlaybook.missingFields.join(', ')}.`;
}

function buildAnalystGuidance(
  normalizedAlert: NormalizedAlert,
  topPlaybook: PlaybookRecommendationItem,
  recommendation: PlaybookRecommendationResult,
) {
  const guidance = getDefaultAnalystGuidance();

  if (topPlaybook.missingFields.length > 0) {
    guidance.push(
      `Validate the missing field set before relying on ${topPlaybook.playbookId} as the primary response template.`,
    );
  }

  if (normalizedAlert.severity === 'critical' || normalizedAlert.severity === 'high') {
    guidance.push(
      'Escalate analyst review priority because the normalized alert severity is high-impact.',
    );
  }

  if (
    recommendation.selectedPlaybookId &&
    recommendation.selectedPlaybookId !== topPlaybook.playbookId
  ) {
    guidance.push(
      'Document why the selected playbook differs from the highest-ranked recommendation for later thesis evaluation.',
    );
  }

  return uniqueStrings(guidance);
}

function buildExplanationLimitations(
  topPlaybook: PlaybookRecommendationItem,
  recommendation: PlaybookRecommendationResult,
) {
  const limitations = getDefaultLimitations();

  if (topPlaybook.missingFields.length > 0) {
    limitations.push(
      `The top recommendation is missing required fields: ${topPlaybook.missingFields.join(', ')}.`,
    );
  }

  if (recommendation.topPlaybooks.length > 1) {
    limitations.push(
      'Alternative playbooks may still be reasonable because ranking is based on deterministic metadata scoring rather than confirmed incident context.',
    );
  }

  return uniqueStrings(limitations);
}

function buildPlaybookExplanation(
  recommendationItem: PlaybookRecommendationItem,
  recommendation: PlaybookRecommendationResult,
  playbook: Playbook | undefined,
): PlaybookExplanation {
  const decision = getPlaybookDecision(recommendation, recommendationItem);
  const approvalNotes = buildApprovalNotes(playbook, recommendationItem.approvalRequired);
  const limitations = buildPlaybookLimitations(recommendationItem, playbook);

  return {
    playbookId: recommendationItem.playbookId,
    rank: recommendationItem.rank,
    totalScore: recommendationItem.totalScore,
    decision,
    summary: buildPlaybookSummary(recommendationItem, recommendation, decision),
    scoreExplanation: buildScoreBreakdownExplanation(recommendationItem),
    matchedReasons: recommendationItem.matchedReasons,
    missingFields: recommendationItem.missingFields,
    approvalNotes,
    limitations,
  };
}

function buildPlaybookSummary(
  item: PlaybookRecommendationItem,
  recommendation: PlaybookRecommendationResult,
  decision: PlaybookExplanation['decision'],
) {
  if (decision === 'recommended') {
    if (recommendation.selectedPlaybookId === item.playbookId) {
      return `This playbook is the currently selected recommendation after ranking ${item.rank} with a total score of ${item.totalScore}.`;
    }

    return `This playbook is the highest-ranked recommendation with a total score of ${item.totalScore}.`;
  }

  if (decision === 'alternative') {
    return `This playbook remains an alternative because it matched portions of the alert metadata but ranked below the top recommendation.`;
  }

  return `This playbook was evaluated but is not the currently selected option in the recommendation record.`;
}

function getPlaybookDecision(
  recommendation: PlaybookRecommendationResult,
  item: PlaybookRecommendationItem,
): PlaybookExplanation['decision'] {
  if (recommendation.selectedPlaybookId) {
    return recommendation.selectedPlaybookId === item.playbookId ? 'recommended' : 'not_selected';
  }

  return item.rank === 1 ? 'recommended' : 'alternative';
}

function buildSection(
  type: ExplanationSection['type'],
  title: string,
  content: string,
  evidenceRefs: string[],
  severity: ExplanationSection['severity'],
): ExplanationSection {
  return {
    type,
    title,
    content,
    ...(evidenceRefs.length > 0 ? { evidenceRefs } : {}),
    ...(severity ? { severity } : {}),
  };
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}
