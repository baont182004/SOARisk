import { AlertType } from './enums';

export const SOAR_WORKFLOW_STEPS = [
  'Security Alert',
  'Alert Normalization',
  'Playbook Recommendation',
  'Recommendation Explanation',
  'Analyst Approval',
  'Workflow Execution',
  'Incident Tracking',
  'Report Generation',
] as const;

export const SOAR_FOCUS_AREAS = [
  'Alert normalization',
  'Structured playbook dataset',
  'Playbook recommendation',
  'Recommendation explanation',
  'Analyst approval',
  'Workflow orchestration',
  'Incident tracking',
  'Report generation',
] as const;

export const SOAR_SCOPE_GUARDRAILS = [
  {
    title: 'Not SIEM',
    description:
      'The platform begins after alerts already exist and does not aim to become a correlation-heavy SIEM.',
  },
  {
    title: 'Not IDS',
    description:
      'The platform does not implement a full detection engine or deep packet inspection workflow.',
  },
  {
    title: 'PCAP Is Demo Input Only',
    description:
      'PCAP files are reserved for controlled test/demo alert generation and are not a primary analysis surface.',
  },
  {
    title: 'No Autonomous Response',
    description:
      'Sensitive actions remain mock-only until analyst approval and guardrails are implemented in later phases.',
  },
] as const;

export const QUEUE_NAMES = {
  PCAP_DEMO: 'pcap-demo-queue',
  ALERT_NORMALIZATION: 'alert-normalization-queue',
  RECOMMENDATION: 'recommendation-queue',
  EXPLANATION: 'explanation-queue',
  WORKFLOW_EXECUTION: 'workflow-execution-queue',
  REPORT_GENERATION: 'report-generation-queue',
} as const;

export const RAW_ALERT_MOCK_SCENARIOS = [
  'port-scan',
  'icmp-flood',
  'sql-injection',
  'xss',
  'suspicious-dns',
  'botnet-c2',
] as const;

export const SEED_PLAYBOOK_IDS = [
  ...Array.from({ length: 30 }, (_, index) => `PB-${String(index + 1).padStart(3, '0')}`),
] as const;

export const CORE_PLAYBOOK_ALERT_TYPES = [
  AlertType.PORT_SCAN,
  AlertType.WEB_SQL_INJECTION,
  AlertType.SUSPICIOUS_DNS_QUERY,
  AlertType.BRUTE_FORCE,
  AlertType.PHISHING,
  AlertType.MALWARE,
  AlertType.DATA_EXFILTRATION,
] as const;

export const LEGACY_DEMO_ALERT_TYPES = [
  AlertType.ICMP_FLOOD,
  AlertType.WEB_XSS,
  AlertType.BOTNET_C2,
  AlertType.MALWARE_TRAFFIC,
  AlertType.MALWARE_HASH,
] as const;

export const FORBIDDEN_PLAYBOOK_ACTION_NAMES = [
  'block_ip',
  'quarantine_host',
  'delete_file',
  'disable_user',
  'kill_process',
  'execute_script_on_host',
] as const;

export const RECOMMENDATION_SCORE_WEIGHTS = {
  alertType: 25,
  mitreTechnique: 15,
  severity: 13,
  requiredFields: 12,
  assetContext: 10,
  indicatorContext: 8,
  alertConfidence: 7,
  sourceReliability: 4,
  automation: 4,
  historicalPerformance: 2,
} as const;

export const EXPLANATION_DEFAULT_LIMITATIONS = [
  'This recommendation is based on normalized alert fields and playbook metadata.',
  'It does not prove attacker intent.',
  'It does not execute response actions.',
  'Analyst review is required before operational action.',
] as const;

export const EXPLANATION_DEFAULT_ANALYST_GUIDANCE = [
  'Review source and target context before selecting a playbook.',
  'Confirm whether the affected asset is internet-facing or business-critical.',
  'Check whether similar alerts exist before approving containment requests.',
] as const;
