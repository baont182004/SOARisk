# Report-Ready Methodology Section: SOARisk Playbook Recommendation

## Research contribution

SOARisk is designed as a SOAR-oriented post-alert response prototype. The project does not attempt to replace IDS, SIEM, or packet-analysis tools. Instead, it focuses on the operational gap after a security alert has been generated: alert normalization, playbook recommendation, analyst approval, simulated workflow execution, incident tracking, and reporting.

The main contribution of the enhanced version is the construction of a structured playbook dataset and an explainable recommendation model. Each playbook includes incident category, required fields, severity affinity, asset criticality affinity, MITRE ATT&CK mapping, approval risk, automation suitability, workflow steps, and quality controls. This enables the system to recommend not only by alert type but also by context and execution feasibility.

## Recommendation model

The proposed recommendation model uses transparent weighted scoring. It considers alert type, MITRE ATT&CK mapping, severity, required-field coverage, asset criticality, indicator context, alert confidence, source reliability, automation suitability, and historical performance. Penalties are applied for missing critical fields, unsafe automation risk, high approval risk, benign signals, and conflicting context.

This design was selected because SOAR decisions require traceability and analyst trust. A deterministic scoring model is easier to validate and defend than a black-box machine learning model when only a demo-scale dataset is available.

## Evaluation design

The evaluation dataset contains 75 normalized alert cases across port scan, SQL injection, suspicious DNS query, brute force, phishing, malware, and data exfiltration scenarios. Each case defines the expected Top-1 playbook, acceptable Top-3 playbooks, rationale, difficulty level, and baseline trap. The system is evaluated by Top-1 accuracy, Top-3 accuracy, mean reciprocal rank, confusion pairs, and ambiguity rate.

A baseline model selects playbooks using only alert type. The proposed model adds severity, field coverage, MITRE mapping, asset context, confidence, source reliability, automation suitability, approval risk, and historical performance. This comparison demonstrates whether the enhanced scoring model provides measurable value beyond simple rule-based mapping.

## Expected interpretation

If the proposed model improves Top-1 and Top-3 accuracy over the alert-type baseline, the result supports the claim that contextual playbook scoring is useful for SOAR decision support. Mismatch cases are not treated as failures only; they are analyzed to identify missing fields, ambiguous signals, weak playbook definitions, or unrealistic evaluation records. This supports iterative improvement of the playbook dataset.
