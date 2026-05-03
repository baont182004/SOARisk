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
  WORKFLOW_EXECUTION: 'workflow-execution-queue',
  REPORT_GENERATION: 'report-generation-queue',
} as const;

export const SEED_PLAYBOOK_IDS = [
  'PB-001',
  'PB-002',
  'PB-003',
  'PB-004',
  'PB-005',
  'PB-006',
  'PB-007',
  'PB-008',
] as const;
