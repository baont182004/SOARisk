export enum AlertType {
  PORT_SCAN = 'port_scan',
  ICMP_FLOOD = 'icmp_flood',
  DOS_ATTEMPT = 'dos_attempt',
  WEB_SQL_INJECTION = 'web_sql_injection',
  WEB_XSS = 'web_xss',
  SUSPICIOUS_DNS_QUERY = 'suspicious_dns_query',
  MALWARE_TRAFFIC = 'malware_traffic',
  BOTNET_C2 = 'botnet_c2',
  BRUTE_FORCE = 'brute_force',
  PHISHING = 'phishing',
  MALWARE_HASH = 'malware_hash',
  DATA_EXFILTRATION = 'data_exfiltration',
  GENERIC = 'generic',
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertSource {
  MANUAL = 'manual',
  PCAP_DEMO = 'pcap_demo',
  WAZUH = 'wazuh',
  SURICATA = 'suricata',
  ZEEK = 'zeek',
  MOCK = 'mock',
}

export enum NormalizedAlertStatus {
  NORMALIZED = 'normalized',
  FAILED = 'failed',
  PENDING = 'pending',
}

export enum IncidentStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  RESPONDING = 'responding',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum AutomationLevel {
  MANUAL = 'manual',
  SEMI_AUTOMATED = 'semi_automated',
  AUTOMATED = 'automated',
}

export enum IncidentCategory {
  GENERIC = 'generic',
  RECONNAISSANCE = 'reconnaissance',
  DENIAL_OF_SERVICE = 'denial_of_service',
  WEB_ATTACK = 'web_attack',
  SUSPICIOUS_DNS = 'suspicious_dns',
  MALWARE = 'malware',
  BRUTE_FORCE = 'brute_force',
  PHISHING = 'phishing',
  SUSPICIOUS_FILE = 'suspicious_file',
  DATA_EXFILTRATION = 'data_exfiltration',
}

export enum PlaybookActionType {
  CASE_MANAGEMENT = 'case_management',
  ENRICHMENT = 'enrichment',
  ASSET_CONTEXT = 'asset_context',
  INVESTIGATION = 'investigation',
  CONTAINMENT = 'containment',
  NOTIFICATION = 'notification',
  APPROVAL = 'approval',
  REPORTING = 'reporting',
  DOCUMENTATION = 'documentation',
}

export enum PlaybookStepRisk {
  SAFE = 'safe',
  REVIEW_REQUIRED = 'review_required',
  SENSITIVE = 'sensitive',
}

export enum PlaybookStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
}

export enum ApprovalPolicy {
  NONE = 'none',
  REQUIRED_FOR_SENSITIVE_ACTIONS = 'required_for_sensitive_actions',
  REQUIRED_FOR_ALL_ACTIONS = 'required_for_all_actions',
}

export enum ApprovalStatus {
  NOT_REQUIRED = 'not_required',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum RecommendationStatus {
  GENERATED = 'generated',
  SELECTED = 'selected',
  EXPIRED = 'expired',
}

export enum WorkflowExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  WAITING_APPROVAL = 'waiting_approval',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PcapFileStatus {
  UPLOADED = 'uploaded',
  QUEUED = 'queued',
  PROCESSED = 'processed',
}

export enum PcapJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
