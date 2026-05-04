import {
  AutomationLevel,
  PlaybookStatus,
  PlaybookStepRisk,
} from '../enums';
import { RECOMMENDATION_SCORE_WEIGHTS } from '../constants';

export const PLAYBOOK_RECOMMENDATION_DEFAULT_TOP_K = 3;

export const AUTOMATION_SUITABILITY_SCORES: Record<AutomationLevel, number> = {
  [AutomationLevel.SEMI_AUTOMATED]: 5,
  [AutomationLevel.MANUAL]: 3,
  [AutomationLevel.AUTOMATED]: 2,
};

export const RECOMMENDABLE_PLAYBOOK_STATUSES = [PlaybookStatus.ACTIVE] as const;

export const PARTIAL_ASSET_CONTEXT_SCORE = 5;
export const UNAVAILABLE_ASSET_CONTEXT_SCORE = 3;
export const NO_CONDITIONS_SCORE = 5;

export const SENSITIVE_ACTION_RISK = PlaybookStepRisk.SENSITIVE;

export { RECOMMENDATION_SCORE_WEIGHTS };
