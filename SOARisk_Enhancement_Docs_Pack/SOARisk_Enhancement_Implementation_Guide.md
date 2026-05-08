# SOARisk Enhancement Documentation: Structured Playbook Dataset, Recommendation Scoring Model, Evaluation Dataset

Version: 1.0  
Date: 2026-05-08  
Target: Codex implementation into SOARisk repository  
Scope: Improve the research value of the existing SOARisk MVP without expanding into IDS/SIEM/packet-analysis scope.

## 1. Executive decision

SOARisk should not expand into full IDS, packet inspection, or SIEM replacement. The project value should be strengthened at the post-alert response layer: normalized alert -> explainable Top-3 playbook recommendation -> analyst approval -> simulated workflow execution -> incident tracking -> report/export/evaluation.

The current MVP is already demo-ready. The missing research depth is concentrated in three components:

1. Structured Playbook Dataset.
2. Recommendation Scoring Model.
3. Evaluation Dataset and metrics.

The proposed enhancement is intentionally deterministic and explainable. This is a better fit for a university defense than adding opaque AI or a heavy ML pipeline without enough real SOC data.

## 2. Design principles

### 2.1 Defensive and bounded scope

The playbooks are response workflows, not attack guides. PCAP remains a demo input. The application should consume normalized alerts and recommend response actions; it should not claim to perform full intrusion detection.

### 2.2 Explainability over complexity

Every recommendation must show why a playbook scored highly and why alternatives scored lower. The UI and report should expose:

- matched alert type;
- severity match;
- required-field coverage;
- MITRE ATT&CK mapping;
- asset criticality match;
- source reliability;
- alert confidence;
- automation suitability;
- approval risk;
- missing fields and penalties.

### 2.3 Playbook as structured data

Each playbook should be a structured object with metadata, match criteria, workflow steps, safety constraints, and scoring hints. This follows the direction of standardized security playbooks such as CISA-style incident response playbooks and CACAO-style machine-processable playbooks, but keeps SOARisk light enough for MVP implementation.

## 3. Deliverables in this pack

- `playbooks.v2.seed.json`: 30 structured playbooks.
- `scoring_model.v1.json`: scoring weights, penalties, thresholds, tie-breakers and explanation fields.
- `evaluation_cases.v1.json`: 75 evaluation cases with expected Top-1 and acceptable Top-3.
- `SOARisk_Codex_Implementation_Prompt.md`: copy-paste prompt for Codex.
- `SOARisk_Report_Methodology_Section.md`: report-ready methodology/evaluation text.
- `SOARisk_Playbook_Recommendation_Evaluation_Guide.docx`: formatted documentation.

## 4. Structured Playbook Dataset

### 4.1 Target schema

```ts
export type ApprovalRisk = 'low' | 'medium' | 'high' | 'critical';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type WorkflowStepType = 'automated' | 'manual' | 'decision';

export interface StructuredPlaybook {
  id: string;
  version: string;
  status: 'active' | 'draft' | 'deprecated';
  name: string;
  category: string;
  description: string;
  alertTypes: string[];
  severityAffinity: Severity[];
  requiredFields: string[];
  optionalFields: string[];
  mitreTechniques: Array<{ id: string; name: string; tactic: string }>;
  incidentPhaseFocus: string[];
  assetCriticalityAffinity: Severity[];
  sourceReliabilityMin: number;
  automationSuitability: number;
  approvalRisk: ApprovalRisk;
  safeAutomationActions: string[];
  manualApprovalRequiredActions: string[];
  estimatedManualSteps: number;
  expectedOutcome: string;
  scoringHints: { positiveSignals: string[]; negativeSignals: string[] };
  workflowSteps: WorkflowStep[];
  qualityControls: string[];
}
```

### 4.2 Playbook coverage

| ID | Category | Name | Severity affinity | Approval risk | Automation suitability |
|---|---|---|---|---|---:|
| PB-001 | port_scan | External Port Scan Investigation | low, medium | low | 0.75 |
| PB-002 | port_scan | Internal Lateral Movement Scan | medium, high | medium | 0.55 |
| PB-003 | port_scan | Critical Asset Reconnaissance | medium, high, critical | medium | 0.5 |
| PB-004 | port_scan | Vulnerability Scan Against Exposed Service | medium, high | medium | 0.6 |
| PB-005 | web_sql_injection | Basic SQLi Triage | low, medium | low | 0.8 |
| PB-006 | web_sql_injection | SQLi Against Authentication Endpoint | medium, high | medium | 0.65 |
| PB-007 | web_sql_injection | SQLi With Possible Data Access | high, critical | high | 0.35 |
| PB-008 | web_sql_injection | SQLi Followed By Webshell Indicator | high, critical | critical | 0.25 |
| PB-009 | web_sql_injection | WAF Event Correlation and IP Blocking | medium, high | medium | 0.85 |
| PB-010 | suspicious_dns_query | DGA Domain Investigation | medium, high | medium | 0.7 |
| PB-011 | suspicious_dns_query | Newly Registered Domain Lookup | low, medium, high | low | 0.8 |
| PB-012 | suspicious_dns_query | DNS Tunneling Suspicion | high, critical | high | 0.3 |
| PB-013 | suspicious_dns_query | C2 Domain Communication | high, critical | high | 0.45 |
| PB-014 | suspicious_dns_query | High-Risk DNS on Critical Asset | medium, high, critical | high | 0.4 |
| PB-015 | brute_force | Single Account Brute Force | low, medium, high | low | 0.8 |
| PB-016 | brute_force | Password Spraying | medium, high | medium | 0.65 |
| PB-017 | brute_force | Privileged Account Attack | high, critical | high | 0.45 |
| PB-018 | brute_force | Successful Login After Failures | high, critical | high | 0.35 |
| PB-019 | brute_force | Remote Service Brute Force | medium, high | medium | 0.55 |
| PB-020 | phishing | Mailbox Triage | low, medium | low | 0.85 |
| PB-021 | phishing | Credential Harvesting Link | medium, high | medium | 0.55 |
| PB-022 | phishing | Attachment Malware Suspicion | medium, high, critical | high | 0.45 |
| PB-023 | phishing | Business Email Compromise Triage | medium, high | medium | 0.6 |
| PB-024 | phishing | Phishing With Successful Click/Login | high, critical | high | 0.3 |
| PB-025 | malware | Endpoint Malware Triage | medium, high | medium | 0.65 |
| PB-026 | malware | Suspicious Process or Script Execution | medium, high | medium | 0.5 |
| PB-027 | malware | Malware With C2 Indicator | high, critical | high | 0.35 |
| PB-028 | malware | Ransomware Early Indicator | high, critical | critical | 0.2 |
| PB-029 | data_exfiltration | Large Outbound Transfer Investigation | medium, high, critical | high | 0.45 |
| PB-030 | data_exfiltration | Exfiltration Over C2 or DNS Channel | high, critical | critical | 0.25 |

### 4.3 Playbook quality rules

A playbook is high quality only when it has:

- a narrow incident scenario;
- explicit required fields;
- MITRE mapping where possible;
- clear approval risk;
- separation between safe automation and approval-required actions;
- repeatable workflow steps;
- scoring hints for positive and negative signals;
- expected outcome and quality controls.

## 5. Recommendation Scoring Model

### 5.1 Final formula

```text
score = 100 * sum(weight_i * component_i) - 100 * sum(penalty_j)
score = clamp(score, 0, 100)
```

### 5.2 Weights

| Criterion | Weight | Purpose |
|---|---:|---|
| Alert type match | 0.25 | Keeps recommendation anchored to normalized alert type. |
| MITRE technique match | 0.15 | Rewards threat-informed mapping. |
| Severity match | 0.13 | Separates generic from high-risk playbooks. |
| Required field coverage | 0.12 | Prevents recommending playbooks that cannot be executed. |
| Asset criticality match | 0.10 | Prioritizes critical business assets. |
| Indicator context match | 0.08 | Uses specific signals such as clicked, webshell indicator, domain age, success after failures. |
| Alert confidence | 0.07 | Reduces weak/noisy alerts. |
| Source reliability | 0.04 | Rewards reliable sources such as EDR/WAF over weak demo signals. |
| Automation suitability | 0.04 | Favors safe repeatable workflows. |
| Historical performance | 0.02 | Optional demo feedback from analyst approvals. |

### 5.3 Penalties

| Penalty | Value | Trigger |
|---|---:|---|
| Missing critical field | 0.06 | Required field needed for safe execution is absent. |
| Unsafe automation risk | 0.05 | Proposed action is disruptive and context is incomplete. |
| High approval risk | 0.03 | Playbook has high risk and no strong evidence. |
| Critical approval risk | 0.06 | Playbook is critical-risk and confidence is not high enough. |
| Known benign signal | 0.08 | Known scanner, awareness simulation, approved admin script, backup window, etc. |
| Conflicting MITRE context | 0.07 | Alert MITRE mapping contradicts playbook focus. |

### 5.4 Pseudocode

```ts
export function recommendPlaybooks(alert: NormalizedAlert, playbooks: StructuredPlaybook[], k = 3) {
  const scored = playbooks.map(playbook => {
    const breakdown = computeBreakdown(alert, playbook);
    const penalty = computePenalty(alert, playbook, breakdown);
    const raw = Object.values(breakdown).reduce((s, c) => s + c.weight * c.value, 0);
    const score = Math.max(0, Math.min(100, 100 * raw - 100 * penalty.total));
    return { playbook, score, breakdown, penalty, explanation: explain(alert, playbook, breakdown, penalty) };
  });

  return scored
    .filter(x => x.score >= SCORING.thresholds.minimumRecommendableScore)
    .sort(compareByScoreThenTieBreakers)
    .slice(0, k);
}
```

### 5.5 Explanation output

Each recommendation should return:

```json
{
  "playbookId": "PB-006",
  "rank": 1,
  "score": 86.4,
  "confidenceBand": "high",
  "explanation": "Recommended because alert type matched web_sql_injection, endpointRole=auth matched authentication endpoint, severity matched high, and all required fields were present. Downgraded slightly because the action may require analyst approval before blocking the source IP.",
  "scoreBreakdown": [
    { "criterion": "alertTypeMatch", "weight": 0.25, "componentScore": 1.0, "evidence": "alertType=web_sql_injection" }
  ],
  "missingRequiredFields": [],
  "approvalRisk": "medium",
  "automationSuitability": 0.65
}
```

## 6. Evaluation Dataset

### 6.1 Evaluation case schema

```ts
export interface EvaluationCase {
  caseId: string;
  alertType: string;
  severity: Severity;
  normalizedAlert: Record<string, unknown>;
  expectedTop1: string;
  acceptableTop3: string[];
  rationale: string;
  difficulty: 'standard' | 'near_neighbor' | 'hard';
  baselineTrap: string;
}
```

### 6.2 Required metrics

- Top-1 Accuracy: expectedTop1 equals ranked[0].playbookId.
- Top-3 Accuracy: acceptableTop3 intersects returned Top-3.
- Mean Reciprocal Rank: 1 / rank of expectedTop1, or 0 if absent.
- Confusion pairs: expectedTop1 vs actualTop1 count.
- Missing-field failure rate: cases where wrong recommendation was caused by poor field coverage.
- Ambiguity rate: cases where Top-1 and Top-2 gap is below 5 points.

### 6.3 Baseline comparison

The baseline should be intentionally simple:

```ts
baselineScore(playbook, alert) = playbook.alertTypes.includes(alert.alertType) ? 1 : 0;
```

The proposed model should then be compared against it. The report should not fabricate results before running the evaluator, but it can present the expected hypothesis:

- Baseline should perform well on broad category but fail on near-neighbor playbooks.
- Proposed scoring should improve Top-1 accuracy in risk-specific cases such as SQLi against auth endpoint, password spraying vs single-account brute force, DNS tunneling vs normal suspicious DNS, and phishing click/login vs mailbox triage.

## 7. Integration plan for Codex

### 7.1 Suggested files

```text
backend/src/playbooks/playbook.types.ts
backend/src/playbooks/playbook.seed.v2.ts
backend/src/recommendation/scoring-config.ts
backend/src/recommendation/scoring.service.ts
backend/src/recommendation/explanation.service.ts
backend/src/evaluation/evaluation-cases.seed.ts
backend/src/evaluation/evaluation.service.ts
backend/src/evaluation/baseline.service.ts
backend/src/evaluation/evaluation.controller.ts
frontend/src/features/recommendation/ScoreBreakdownCard.tsx
frontend/src/features/evaluation/EvaluationDashboard.tsx
docs/recommendation-methodology.md
```

### 7.2 Backend tasks

1. Add or update playbook schema.
2. Seed 30 playbooks.
3. Implement weighted scoring service.
4. Return Top-3 with full score breakdown.
5. Add baseline recommender.
6. Add evaluation runner using 75 evaluation cases.
7. Store evaluation results for dashboard/report.
8. Add tests for Top-1/Top-3 metrics and scoring edge cases.

### 7.3 Frontend tasks

1. Show Top-3 recommendation cards.
2. Display score, confidence band, approval risk and automation suitability.
3. Show expandable score breakdown table.
4. Show missing fields and why score was reduced.
5. Add evaluation dashboard: baseline vs proposed, Top-1, Top-3, mismatch cases.

## 8. Acceptance criteria

The enhancement is complete when:

- at least 30 structured playbooks are seeded;
- every playbook has required fields, MITRE mapping, approval risk and workflow steps;
- every recommendation returns Top-3 with score breakdown;
- baseline and proposed scoring can both run against the same evaluation dataset;
- evaluation dataset has at least 75 cases;
- dashboard/report shows Top-1, Top-3 and confusion/mismatch examples;
- analyst approval is enforced for high/critical-risk actions;
- no UI text claims that PCAP analysis is a real IDS.

## 9. Report positioning

SOARisk should be positioned as a SOAR-oriented post-alert decision-support prototype. Its contribution is not building a new detector. Its contribution is designing a structured response layer that maps normalized alerts to explainable playbook recommendations and measures recommendation quality with an evaluation dataset.

## 10. References

- NIST (2025). SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management: A CSF 2.0 Community Profile.
- CISA (2024). Federal Government Cybersecurity Incident and Vulnerability Response Playbooks.
- MITRE ATT&CK (2026). Enterprise ATT&CK v19 and technique pages including T1595, T1190, T1110, T1110.003, T1566, T1566.002, T1505.003 and T1041.
- OASIS CACAO (2023). CACAO Security Playbooks Version 2.0.
- Open Cybersecurity Alliance (2025). CACAO Roaster v1.3.0 release notes.
