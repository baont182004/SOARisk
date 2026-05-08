# SOARisk Demo Guide

## Project Overview

SOARisk is a SOAR-based SOC automation prototype for demonstrating the response workflow after a security alert already exists. The platform receives or generates demo alerts, normalizes them into a SOAR-ready schema, recommends Top-3 response playbooks, explains the recommendation, executes a simulated analyst-gated workflow, tracks the incident, generates a report, and exposes dashboard/evaluation metrics.

Core flow:

```text
PCAP demo / alert input
-> raw alert
-> normalized alert
-> Top-3 playbook recommendation
-> recommendation explanation
-> analyst approval
-> workflow execution
-> incident tracking
-> report generation
-> dashboard and evaluation
```

## SOAR Scope

The project focuses on orchestration and response:

- alert normalization
- structured response playbook dataset
- deterministic playbook recommendation
- recommendation explanation
- analyst approval for sensitive actions
- workflow orchestration
- incident tracking
- report generation
- evaluation metrics for demo and report defense

## Why This Is Not SIEM Or IDS

SOARisk does not collect enterprise-wide logs, correlate events across many sources, or replace SIEM search and detection. It also does not implement packet inspection, signatures, anomaly detection, or IDS-grade PCAP analysis.

PCAP is used only as a controlled demo input. The PCAP demo module emits synthetic raw alerts so the SOAR workflow can be demonstrated repeatedly.

## Tech Stack

- Turborepo + pnpm monorepo
- NestJS API
- Next.js frontend
- BullMQ worker queues
- Redis
- MongoDB Atlas / MongoDB
- Mongoose
- TypeScript
- Docker Compose

## Run With Docker

Create `.env` from `.env.example`, then run:

```powershell
docker compose up --build
```

Open:

- Frontend: `http://localhost:3000`
- API health: `http://localhost:3001/health`

Docker Desktop must be running. If Docker reports `dockerDesktopLinuxEngine` missing, start Docker Desktop first.

## Seed Playbooks

```powershell
curl.exe -X POST "http://localhost:3001/playbooks/seed/reset"
```

The seed endpoint loads the active 30-playbook structured dataset from:

```text
SOARisk_Enhancement_Docs_Pack/playbooks.v2.seed.json
```

This replaces the earlier small PB-001 to PB-010 demo-only seed. Each playbook preserves SOAR research fields including MITRE ATT&CK mapping, required fields, asset criticality affinity, scoring hints, automation suitability, approval risk, simulated workflow steps, and expected outputs.

## Run Demo Wizard

Open:

```text
http://localhost:3000/demo
```

Suggested scenarios:

1. Port scan
2. SQL injection

Steps:

1. Select scenario.
2. Click `Run SOAR Demo`.
3. Review completed steps.
4. If the workflow is waiting for approval, click `Approve and Continue`.
5. Open linked recommendation, explanation, workflow, incidents, reports, dashboard, and evaluation pages.

The wizard shows each step as `completed`, `waiting approval`, or `failed`.

## Curl Demo Script

```powershell
curl.exe -X POST "http://localhost:3001/playbooks/seed/reset"
curl.exe -X POST "http://localhost:3001/pcap-demo/generate-alert/port-scan"
curl.exe -X POST "http://localhost:3001/normalized-alerts/from-raw/<alertId>?force=true"
curl.exe -X POST "http://localhost:3001/recommendations/from-normalized/<normalizedAlertId>?force=true&topK=3"
curl.exe -X POST "http://localhost:3001/recommendations/<recommendationId>/select/PB-002"
curl.exe -X POST "http://localhost:3001/explanations/from-recommendation/<recommendationId>?force=true"
curl.exe -X POST "http://localhost:3001/workflows/from-recommendation/<recommendationId>?force=true&autoStart=true"
curl.exe "http://localhost:3001/approvals?executionId=<executionId>&status=pending"
curl.exe -X POST "http://localhost:3001/approvals/<approvalId>/approve" -H "Content-Type: application/json" -d "{\"decidedBy\":\"analyst-1\",\"decisionReason\":\"Approved simulated response continuation.\"}"
curl.exe "http://localhost:3001/incidents"
curl.exe "http://localhost:3001/reports"
curl.exe "http://localhost:3001/dashboard/summary"
curl.exe "http://localhost:3001/evaluation/summary"
```

## Smoke Test

With API, Redis, worker, and MongoDB running:

```powershell
corepack pnpm smoke:test
```

Optional:

```powershell
$env:API_BASE_URL="http://localhost:3001"; corepack pnpm smoke:test
```

The smoke test verifies seed playbooks, port scan alert generation, normalization, Top-3 recommendation, playbook selection, explanation, workflow start, approval, incident creation, report creation, dashboard summary, evaluation summary, and Markdown report export.

## Async Worker Queue Demo

The sync flow remains the primary stable demo path. Worker queues demonstrate asynchronous extensibility.

```powershell
curl.exe -X POST "http://localhost:3001/jobs/recommend-playbooks/<normalizedAlertId>?force=true&topK=3"
curl.exe -X POST "http://localhost:3001/jobs/generate-explanation/<recommendationId>?force=true"
curl.exe -X POST "http://localhost:3001/jobs/start-workflow/<executionId>"
curl.exe -X POST "http://localhost:3001/jobs/generate-report/<executionId>"
curl.exe "http://localhost:3001/jobs/recommendation-queue/<jobId>"
```

Worker jobs call stable API endpoints internally through `API_BASE_URL`.

## Evaluation Metrics

API:

```powershell
curl.exe "http://localhost:3001/evaluation/summary"
```

Frontend:

```text
http://localhost:3000/evaluation
```

Metrics shown:

- baseline vs proposed recommendation comparison
- recommendation Top-1 accuracy
- recommendation Top-3 accuracy
- mean reciprocal rank
- mismatch cases and confusion pairs
- workflow success rate
- average workflow execution time
- manual step reduction
- incidents by status
- alerts by type
- alerts by severity
- playbook usage count

Datasets:

- Playbooks: `SOARisk_Enhancement_Docs_Pack/playbooks.v2.seed.json`
- Scoring model: `SOARisk_Enhancement_Docs_Pack/scoring_model.v1.json`
- Evaluation cases: `SOARisk_Enhancement_Docs_Pack/evaluation_cases.v1.json`

The baseline model ranks mainly by alert type. The proposed model uses SOARISK-RS-V2 weighted scoring across alert type, MITRE mapping, severity, required fields, asset criticality, indicator context, confidence, source reliability, automation suitability, and penalties for missing/unsafe context.

## Report Export

Frontend:

```text
http://localhost:3000/reports
```

API:

```powershell
curl.exe "http://localhost:3001/reports/<reportId>/export/markdown"
curl.exe "http://localhost:3001/reports/<reportId>/export/html"
```

The report export includes incident information, alert summary, normalized alert fields, selected playbook, recommendation explanation, workflow logs, approval decision, final incident status, and generated timestamp.

## Suggested Presentation Script

1. Open dashboard and explain the SOAR pipeline.
2. Open playbooks and show structured response dataset.
3. Open Demo Wizard and run `port-scan`.
4. Explain normalized alert fields.
5. Show Top-3 recommendation and selected playbook.
6. Show explanation sections and score breakdown.
7. Start or continue workflow and approve the sensitive simulated response step.
8. Open incident detail and show timeline updates.
9. Open report and export Markdown/HTML.
10. Open evaluation page and explain accuracy/success/manual-reduction metrics.
11. State scope clearly: not SIEM, not IDS, PCAP is demo input only.

## Known Limitations

- Evaluation uses the 75-case enhancement dataset for academic demo/reporting, not a production-scale labeled SOC corpus.
- Worker jobs reuse stable API endpoints instead of duplicating business logic inside the worker.
- Report export supports Markdown and HTML; PDF is not implemented.
- Approval is demo analyst input; no authentication or RBAC is implemented.
- PCAP demo does not parse packets or detect attacks.
- Response actions are simulated; no firewall, EDR, identity, or email system is changed.
