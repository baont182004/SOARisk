import {
  CORE_PLAYBOOK_ALERT_TYPES,
  FORBIDDEN_PLAYBOOK_ACTION_NAMES,
} from '../constants';
import {
  PlaybookActionType,
  PlaybookStatus,
  PlaybookStepRisk,
} from '../enums';
import type {
  Playbook,
  PlaybookDatasetSummary,
  PlaybookValidationResult,
} from '../types';

export function validatePlaybookDataset(playbooks: Playbook[]): PlaybookValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();
  const supportedAlertTypes = new Set<string>();

  for (const playbook of playbooks) {
    if (seenIds.has(playbook.playbookId)) {
      duplicateIds.add(playbook.playbookId);
    }

    seenIds.add(playbook.playbookId);
  }

  for (const duplicateId of duplicateIds) {
    errors.push(`Duplicate playbookId detected: ${duplicateId}.`);
  }

  const activePlaybooks = playbooks.filter((playbook) => playbook.status === PlaybookStatus.ACTIVE);

  if (activePlaybooks.length < 8) {
    errors.push(
      `At least 8 active playbooks are required. Found ${activePlaybooks.length} active playbooks.`,
    );
  }

  for (const playbook of playbooks) {
    if (!playbook.playbookId) {
      errors.push('A playbook is missing playbookId.');
    }

    if (!playbook.name) {
      errors.push(`Playbook '${playbook.playbookId || 'unknown'}' is missing name.`);
    }

    if (!Array.isArray(playbook.supportedAlertTypes) || playbook.supportedAlertTypes.length === 0) {
      errors.push(`Playbook '${playbook.playbookId}' must define supportedAlertTypes.`);
    } else {
      for (const alertType of playbook.supportedAlertTypes) {
        supportedAlertTypes.add(alertType);
      }
    }

    if (!Array.isArray(playbook.requiredFields)) {
      errors.push(`Playbook '${playbook.playbookId}' must define requiredFields as an array.`);
    }

    if (!Array.isArray(playbook.severityRange) || playbook.severityRange.length === 0) {
      errors.push(`Playbook '${playbook.playbookId}' must define a non-empty severityRange.`);
    }

    if (!Array.isArray(playbook.actions) || playbook.actions.length < 3) {
      errors.push(`Playbook '${playbook.playbookId}' must define at least 3 actions.`);
    }

    if (!Array.isArray(playbook.references) || playbook.references.length === 0) {
      errors.push(`Playbook '${playbook.playbookId}' must define at least one reference.`);
    }

    if (!Object.values(PlaybookStatus).includes(playbook.status)) {
      errors.push(`Playbook '${playbook.playbookId}' has invalid status '${String(playbook.status)}'.`);
    }

    if (!Array.isArray(playbook.conditions) || playbook.conditions.length === 0) {
      warnings.push(`Playbook '${playbook.playbookId}' has no matching conditions defined.`);
    }

    if (!Array.isArray(playbook.optionalFields) || playbook.optionalFields.length === 0) {
      warnings.push(`Playbook '${playbook.playbookId}' has no optionalFields defined.`);
    }

    if (!Array.isArray(playbook.tags) || playbook.tags.length === 0) {
      warnings.push(`Playbook '${playbook.playbookId}' has no tags defined.`);
    }

    const actions = Array.isArray(playbook.actions) ? playbook.actions : [];

    actions.forEach((action, index) => {
      const expectedStep = index + 1;

      if (action.step !== expectedStep) {
        errors.push(
          `Playbook '${playbook.playbookId}' has non-sequential action steps. Expected ${expectedStep}, found ${action.step}.`,
        );
      }

      if (FORBIDDEN_PLAYBOOK_ACTION_NAMES.includes(action.action as (typeof FORBIDDEN_PLAYBOOK_ACTION_NAMES)[number])) {
        errors.push(
          `Playbook '${playbook.playbookId}' uses forbidden direct action name '${action.action}'.`,
        );
      }

      const isContainmentAction = action.type === PlaybookActionType.CONTAINMENT;
      const isSensitiveAction = action.risk === PlaybookStepRisk.SENSITIVE;

      if (isContainmentAction && !action.approvalRequired) {
        errors.push(
          `Playbook '${playbook.playbookId}' containment action '${action.action}' must require approval.`,
        );
      }

      if (isSensitiveAction && !action.approvalRequired) {
        errors.push(
          `Playbook '${playbook.playbookId}' sensitive action '${action.action}' must require approval.`,
        );
      }

      if ((isContainmentAction || isSensitiveAction) && !action.mockOnly) {
        errors.push(
          `Playbook '${playbook.playbookId}' action '${action.action}' must remain mockOnly when containment or sensitive.`,
        );
      }
    });
  }

  const missingCoreAlertTypes = CORE_PLAYBOOK_ALERT_TYPES.filter(
    (alertType) => !supportedAlertTypes.has(alertType),
  );

  if (missingCoreAlertTypes.length > 0) {
    errors.push(
      `Core alert type coverage is incomplete: ${missingCoreAlertTypes.join(', ')}.`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalPlaybooks: playbooks.length,
      activePlaybooks: activePlaybooks.length,
      supportedAlertTypes: Array.from(supportedAlertTypes).sort(),
      missingCoreAlertTypes: [...missingCoreAlertTypes],
    },
  };
}

export function summarizePlaybookDataset(playbooks: Playbook[]): PlaybookDatasetSummary {
  const byIncidentCategory: Record<string, number> = {};
  const byAlertType: Record<string, number> = {};
  const byAutomationLevel: Record<string, number> = {};

  let approvalRequiredCount = 0;
  let sensitiveActionCount = 0;
  let mockOnlyActionCount = 0;

  for (const playbook of playbooks) {
    byIncidentCategory[playbook.incidentCategory] =
      (byIncidentCategory[playbook.incidentCategory] ?? 0) + 1;
    byAutomationLevel[playbook.automationLevel] =
      (byAutomationLevel[playbook.automationLevel] ?? 0) + 1;

    if (playbook.approvalRequired) {
      approvalRequiredCount += 1;
    }

    for (const alertType of playbook.supportedAlertTypes) {
      byAlertType[alertType] = (byAlertType[alertType] ?? 0) + 1;
    }

    for (const action of playbook.actions) {
      if (action.risk === PlaybookStepRisk.SENSITIVE) {
        sensitiveActionCount += 1;
      }

      if (action.mockOnly) {
        mockOnlyActionCount += 1;
      }
    }
  }

  return {
    totalPlaybooks: playbooks.length,
    activePlaybooks: playbooks.filter((playbook) => playbook.status === PlaybookStatus.ACTIVE).length,
    byIncidentCategory,
    byAlertType,
    byAutomationLevel,
    approvalRequiredCount,
    sensitiveActionCount,
    mockOnlyActionCount,
  };
}
