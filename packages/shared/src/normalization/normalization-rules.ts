import { AlertType, Severity } from '../enums';

export const ALERT_TYPE_KEYWORDS: Array<{
  alertType: AlertType;
  keywords: string[];
}> = [
  { alertType: AlertType.PORT_SCAN, keywords: ['scan', 'nmap', 'port'] },
  { alertType: AlertType.ICMP_FLOOD, keywords: ['icmp', 'ping flood'] },
  {
    alertType: AlertType.WEB_SQL_INJECTION,
    keywords: ['sql', 'union select', 'sqli'],
  },
  { alertType: AlertType.WEB_XSS, keywords: ['xss', 'script'] },
  {
    alertType: AlertType.SUSPICIOUS_DNS_QUERY,
    keywords: ['dns', 'domain'],
  },
  { alertType: AlertType.BOTNET_C2, keywords: ['c2', 'botnet'] },
  { alertType: AlertType.MALWARE, keywords: ['malware', 'ransomware'] },
  { alertType: AlertType.MALWARE_TRAFFIC, keywords: ['malware'] },
];

export const DEFAULT_SEVERITY_BY_ALERT_TYPE: Record<AlertType, Severity> = {
  [AlertType.PORT_SCAN]: Severity.MEDIUM,
  [AlertType.ICMP_FLOOD]: Severity.HIGH,
  [AlertType.DOS_ATTEMPT]: Severity.HIGH,
  [AlertType.WEB_SQL_INJECTION]: Severity.HIGH,
  [AlertType.WEB_XSS]: Severity.MEDIUM,
  [AlertType.SUSPICIOUS_DNS_QUERY]: Severity.MEDIUM,
  [AlertType.MALWARE_TRAFFIC]: Severity.HIGH,
  [AlertType.MALWARE]: Severity.HIGH,
  [AlertType.BOTNET_C2]: Severity.HIGH,
  [AlertType.BRUTE_FORCE]: Severity.MEDIUM,
  [AlertType.PHISHING]: Severity.MEDIUM,
  [AlertType.MALWARE_HASH]: Severity.HIGH,
  [AlertType.DATA_EXFILTRATION]: Severity.HIGH,
  [AlertType.GENERIC]: Severity.LOW,
};
