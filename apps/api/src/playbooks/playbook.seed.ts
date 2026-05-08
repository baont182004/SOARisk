import {
  ApprovalPolicy,
  AutomationLevel,
  IncidentCategory,
  PlaybookActionType,
  PlaybookStatus,
  PlaybookStepRisk,
  type Playbook as SharedPlaybook,
  type PlaybookAction,
  type PlaybookCondition,
  type PlaybookReference,
} from '@soc-soar/shared';

import { readEnhancementPackJson } from '../common/enhancement-data.util';

type SeedPlaybook = Omit<SharedPlaybook, 'createdAt' | 'updatedAt'>;

type StructuredPlaybookSeed = {
  id: string;
  version: string;
  status: string;
  name: string;
  category: string;
  description: string;
  alertTypes: string[];
  severityAffinity: string[];
  requiredFields: string[];
  optionalFields: string[];
  mitreTechniques?: Array<{ id: string; name: string; tactic: string }>;
  incidentPhaseFocus?: string[];
  assetCriticalityAffinity?: string[];
  sourceReliabilityMin?: number;
  automationSuitability?: number;
  approvalRisk?: 'low' | 'medium' | 'high' | 'critical';
  safeAutomationActions?: string[];
  manualApprovalRequiredActions?: string[];
  estimatedManualSteps?: number;
  expectedOutcome?: string;
  scoringHints?: { positiveSignals: string[]; negativeSignals: string[] };
  workflowSteps: Array<{
    id: string;
    order: number;
    phase: string;
    type: 'automated' | 'manual' | 'decision';
    title: string;
    actionKey: string;
    requiresApproval: boolean;
    inputs: string | string[];
    outputs: string | string[];
    successCriteria: string;
  }>;
  qualityControls?: string[];
};

type PlaybookSeedFile = {
  playbooks: StructuredPlaybookSeed[];
};

const DEFAULT_REFERENCES: PlaybookReference[] = [
  {
    name: 'SOARisk Structured Playbook Dataset v2',
    type: 'internal_design',
    note: 'Dataset imported from the enhancement pack as the active structured playbook source.',
  },
  {
    name: 'Mock Action Guardrail',
    type: 'guideline',
    note: 'Every response action remains simulated; disruptive actions require analyst approval.',
  },
];

export function loadPlaybookSeedData(): SeedPlaybook[] {
  const parsed = readEnhancementPackJson<PlaybookSeedFile>('playbooks.v2.seed.json');

  return parsed.playbooks.map(mapStructuredPlaybook);
}

export function getPlaybookSeedIds() {
  return loadPlaybookSeedData().map((playbook) => playbook.playbookId);
}

function mapStructuredPlaybook(playbook: StructuredPlaybookSeed): SeedPlaybook {
  const approvalRequired =
    playbook.approvalRisk === 'high' ||
    playbook.approvalRisk === 'critical' ||
    playbook.workflowSteps.some((step) => step.requiresApproval);

  return {
    playbookId: playbook.id,
    name: playbook.name,
    description: playbook.description,
    incidentCategory: mapIncidentCategory(playbook.category),
    supportedAlertTypes: playbook.alertTypes as SeedPlaybook['supportedAlertTypes'],
    requiredFields: playbook.requiredFields,
    optionalFields: playbook.optionalFields,
    severityRange: playbook.severityAffinity as SeedPlaybook['severityRange'],
    assetContext: playbook.assetCriticalityAffinity ?? [],
    mitreTechniques: playbook.mitreTechniques ?? [],
    incidentPhaseFocus: playbook.incidentPhaseFocus ?? [],
    assetCriticalityAffinity:
      (playbook.assetCriticalityAffinity as SeedPlaybook['assetCriticalityAffinity']) ?? [],
    safeAutomationActions: playbook.safeAutomationActions ?? [],
    manualApprovalRequiredActions: playbook.manualApprovalRequiredActions ?? [],
    scoringHints: playbook.scoringHints ?? { positiveSignals: [], negativeSignals: [] },
    qualityControls: playbook.qualityControls ?? [],
    conditions: buildConditions(playbook),
    actions: playbook.workflowSteps.map(mapWorkflowStep),
    approvalRequired,
    approvalPolicy:
      approvalRequired
        ? ApprovalPolicy.REQUIRED_FOR_SENSITIVE_ACTIONS
        : ApprovalPolicy.NONE,
    automationLevel: mapAutomationLevel(playbook.automationSuitability ?? 0.5),
    status: mapPlaybookStatus(playbook.status),
    references: DEFAULT_REFERENCES,
    version: playbook.version,
    tags: [
      'seed-v2',
      playbook.category,
      ...playbook.alertTypes,
      ...(playbook.scoringHints?.positiveSignals ?? []),
    ],
    ...(playbook.sourceReliabilityMin !== undefined
      ? { sourceReliabilityMin: playbook.sourceReliabilityMin }
      : {}),
    ...(playbook.automationSuitability !== undefined
      ? { automationSuitability: playbook.automationSuitability }
      : {}),
    ...(playbook.approvalRisk !== undefined ? { approvalRisk: playbook.approvalRisk } : {}),
    ...(playbook.estimatedManualSteps !== undefined
      ? { estimatedManualSteps: playbook.estimatedManualSteps }
      : {}),
    ...(playbook.expectedOutcome !== undefined ? { expectedOutcome: playbook.expectedOutcome } : {}),
  };
}

function buildConditions(playbook: StructuredPlaybookSeed): PlaybookCondition[] {
  return [
    {
      field: 'alertType',
      operator: 'in',
      value: playbook.alertTypes,
      weightHint: 100,
      description: `Matches alert type in ${playbook.alertTypes.join(', ')}.`,
    },
    {
      field: 'severity',
      operator: 'in',
      value: playbook.severityAffinity,
      weightHint: 70,
      description: `Severity should align with ${playbook.severityAffinity.join(', ')}.`,
    },
  ];
}

function mapWorkflowStep(step: StructuredPlaybookSeed['workflowSteps'][number]): PlaybookAction {
  return {
    step: step.order,
    action: step.actionKey,
    type: mapStepType(step.type, step.phase, step.actionKey),
    description: `${step.title}. ${step.successCriteria}`,
    phase: step.phase,
    title: step.title,
    actionKey: step.actionKey,
    inputs: formatFieldList(step.inputs),
    outputs: formatFieldList(step.outputs),
    successCriteria: step.successCriteria,
    requiredFields: splitFieldList(step.inputs),
    produces: splitFieldList(step.outputs),
    approvalRequired: step.requiresApproval,
    risk: step.requiresApproval ? PlaybookStepRisk.SENSITIVE : PlaybookStepRisk.SAFE,
    mockOnly: true,
  };
}

function mapStepType(
  type: StructuredPlaybookSeed['workflowSteps'][number]['type'],
  phase: string,
  actionKey: string,
) {
  if (type === 'decision') {
    return PlaybookActionType.APPROVAL;
  }

  if (phase.includes('containment')) {
    return PlaybookActionType.CONTAINMENT;
  }

  if (actionKey.includes('enrich')) {
    return PlaybookActionType.ENRICHMENT;
  }

  if (actionKey.includes('metrics') || actionKey.includes('report')) {
    return PlaybookActionType.REPORTING;
  }

  if (type === 'manual') {
    return PlaybookActionType.INVESTIGATION;
  }

  return PlaybookActionType.CASE_MANAGEMENT;
}

function mapIncidentCategory(category: string) {
  const supported = Object.values(IncidentCategory);

  if (supported.includes(category as IncidentCategory)) {
    return category as IncidentCategory;
  }

  return IncidentCategory.GENERIC;
}

function mapAutomationLevel(score: number) {
  if (score >= 0.75) {
    return AutomationLevel.AUTOMATED;
  }

  if (score >= 0.4) {
    return AutomationLevel.SEMI_AUTOMATED;
  }

  return AutomationLevel.MANUAL;
}

function mapPlaybookStatus(status: string) {
  const supported = Object.values(PlaybookStatus);

  if (supported.includes(status as PlaybookStatus)) {
    return status as PlaybookStatus;
  }

  return PlaybookStatus.DRAFT;
}

function splitFieldList(value: string | string[]) {
  if (Array.isArray(value)) {
    return value;
  }

  return value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatFieldList(value: string | string[]) {
  return Array.isArray(value) ? value.join(', ') : value;
}
