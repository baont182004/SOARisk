# SOARisk Defense Notes

## What SOAR Means In This Project

SOAR means Security Orchestration, Automation, and Response. In SOARisk, this means coordinating the response process after a security alert exists: normalize the alert, recommend a response playbook, explain the recommendation, require analyst approval for sensitive actions, execute a simulated workflow, track the incident, and generate a final report.

## SIEM vs SOAR

SIEM focuses on log collection, event correlation, alerting, search, and detection visibility. SOAR focuses on what happens after an alert is raised: response coordination, playbook execution, approval, case tracking, and reporting.

SOARisk is not a SIEM because it does not ingest broad log streams, build detection rules, or perform correlation across enterprise telemetry. It consumes or generates demo alerts and then performs response workflow automation.

## Why PCAP Is Only Demo Input

PCAP is used to create repeatable demonstration alerts. The scientific focus is not packet inspection. A full IDS or packet analyzer would require protocol parsing, signature/rule logic, detection tuning, and traffic analysis UI, which are outside the project scope.

The PCAP demo module exists to support evaluation and presentation. It produces controlled raw alerts such as port scan, SQL injection, XSS, suspicious DNS, and botnet/C2 scenarios.

## What Alert Normalization Solves

Security tools produce alerts with different field names, formats, and levels of completeness. Alert normalization converts these inputs into one SOAR-ready schema with alert type, severity, confidence, source/target observables, asset context, evidence, and normalization notes.

This makes playbook recommendation and workflow execution consistent even when the original alert source differs.

## Playbook Recommendation Logic

Recommendation is deterministic and score-based. The engine ranks active playbooks using:

- alert type match
- MITRE ATT&CK technique or tactic match
- severity compatibility
- required field completeness
- asset criticality match
- indicator context from playbook scoring hints
- alert confidence
- source reliability
- automation suitability
- approval and safety penalties

The official model is `SOARISK-RS-V2`, aligned with `SOARisk_Enhancement_Docs_Pack/scoring_model.v1.json`. It uses a transparent weighted formula rather than opaque AI:

```text
score = 100 * sum(weight_i * component_i) - 100 * sum(penalty_j)
```

The result is a Top-3 ranked list. This is easy to explain in a report because each score component, matched criterion, missing criterion, MITRE mapping, approval risk, and automation suitability value is visible.

## Explanation Engine

The explanation engine translates the recommendation result into analyst-readable reasoning. It explains why a playbook ranked highly, which fields matched, what fields are missing, what approval risks exist, and what limitations remain.

It does not use an LLM. It is deterministic and report-friendly.

## Why Analyst Approval Is Required

Some response actions are sensitive, such as containment, host isolation, firewall blocking, domain blocking, or account protection requests. Even though SOAR can automate repeated steps, real SOC operations should keep human control over high-impact actions.

SOARisk models this with approval gates. Sensitive steps pause until an analyst approves or rejects the simulated response action.

## How Workflow Orchestration Reduces Manual Work

Without SOAR, an analyst may manually create a case, gather observables, check asset context, select a playbook, document steps, ask for approval, update incident status, and write a report.

SOARisk automates the safe repeated steps and keeps only sensitive decisions as analyst approval steps. The evaluation module estimates manual step reduction by comparing total workflow steps with remaining approval-required steps.

## Evaluation Metrics

The evaluation summary uses the official 75-case dataset from `SOARisk_Enhancement_Docs_Pack/evaluation_cases.v1.json`.

It compares:

- Baseline model: mostly alert-type matching.
- Proposed model: SOARISK-RS-V2 weighted scoring.

Metrics:

- Top-1 accuracy: expected playbook is ranked first.
- Top-3 accuracy: expected playbook appears in the Top-3 recommendation list.
- Mean reciprocal rank: rewards expected playbooks appearing near the top.
- Mismatch cases: cases where the expected Top-1 differs from the actual Top-1.
- Confusion pairs: expected playbook vs actual Top-1 pairs.
- Mismatch summary by alert type: where the model needs more tuning.
- Workflow success rate: completed workflows divided by terminal workflows.
- Average workflow execution time: average duration from workflow start to finish.
- Manual step reduction: total workflow steps minus approval-required manual steps.
- Incidents by status: grouped incident records.
- Alerts by type/severity: grouped normalized alerts.
- Playbook usage count: grouped workflow playbook IDs.

## Current Limitations

- Dataset is structured for thesis/demo evaluation, not a production-scale labeled SOC corpus.
- PCAP module does not perform real packet analysis.
- Response actions are simulated and do not call firewall, EDR, IAM, or email systems.
- No authentication, RBAC, or analyst identity management beyond demo input.
- Report export supports Markdown and HTML, not PDF.
- Worker jobs reuse API endpoints to preserve one source of business logic.

## Future Work

- Add a larger labeled evaluation dataset.
- Integrate with real alert sources such as Wazuh, Suricata, or Zeek.
- Add authenticated analyst accounts and role-based approval.
- Add real case-management integration such as TheHive.
- Add optional responders through controlled integrations, still gated by approval.
- Add PDF export and signed audit reports.
- Improve worker job persistence with a dedicated job audit collection.
