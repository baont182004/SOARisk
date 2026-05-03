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

export enum ApprovalStatus {
  NOT_REQUIRED = 'not_required',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
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
