# SOARisk

## Project Orientation

SOARisk is a **SOAR-based SOC automation platform** for the thesis topic:

**Research and Development of an Automated Security Incident Orchestration and Response Solution for SOC Based on Open-Source SOAR**

This project starts **after security alerts already exist**.

- It is **not** a SIEM.
- It is **not** an IDS.
- PCAP is reserved for later demo/test alert generation only.
- The current implemented core flow is `RawAlert -> NormalizedAlert`.
- Phase 2B adds real worker-backed normalization through BullMQ.
- The MVP flow now includes Top-3 playbook recommendation, explanation, analyst approval, simulated workflow execution, incident tracking, report generation, dashboard, and evaluation.

## Scope Guardrails

- No real malware execution.
- No autonomous blocking or quarantine.
- No real firewall action yet.
- Sensitive actions must require analyst approval.
- PCAP parsing is not implemented yet.

## Tech Stack

- Turborepo + pnpm monorepo
- NestJS API
- Next.js frontend
- BullMQ worker
- MongoDB Atlas
- Redis
- Mongoose
- TypeScript + ESLint + Prettier
- Docker Compose

## Repository Structure

```text
SOARisk/
  apps/
    api/
    web/
    worker/
  packages/
    shared/
    config/
  .env.example
  .gitignore
  .dockerignore
  docker-compose.yml
  package.json
  pnpm-lock.yaml
  pnpm-workspace.yaml
  turbo.json
  tsconfig.json
  README.md
```

## Environment Setup

Create this file at the project root:

`d:\SOC\SOARisk\.env`

Example:

```env
MONGODB_URI=<your-mongodb-atlas-uri>
MONGODB_DB_NAME=soc_soar
REDIS_HOST=redis
REDIS_PORT=6379
API_PORT=3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NODE_ENV=development
```

Notes:

- Keep the real MongoDB Atlas URI only in `.env`.
- Never commit database credentials or passwords.
- In MongoDB Atlas Network Access, whitelist your current IP address.
- For Docker Compose, use root `.env`.
- For Docker Compose, `REDIS_HOST` should be `redis`.
- For local non-Docker development, `REDIS_HOST` should usually be `localhost`.

## Run With Docker Desktop

1. Open Docker Desktop.
2. Make sure MongoDB Atlas Network Access allows your current IP.
3. Create the root `.env` file.
4. Run:

```bash
docker compose up --build
```

5. Open:

- Frontend: `http://localhost:3000`
- API health: `http://localhost:3001/health`

## Useful Commands

```bash
corepack pnpm install
corepack pnpm dev
corepack pnpm dev:web
corepack pnpm dev:api
corepack pnpm dev:worker
corepack pnpm clean
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
docker compose config
```

## Demo-ready Additions

See `docs/demo-guide.md` for the current end-to-end demo flow, worker queue demo, evaluation metrics, report export, and smoke test.

See `docs/defense-notes.md` for thesis defense notes covering SOAR scope, SIEM/IDS distinction, PCAP scope, recommendation logic, explanation, approval, evaluation metrics, limitations, and future work.

Key URLs:

- One-click demo wizard: `http://localhost:3000/demo`
- Evaluation metrics: `http://localhost:3000/evaluation`
- Dashboard summary API: `http://localhost:3001/dashboard/summary`
- Evaluation summary API: `http://localhost:3001/evaluation/summary`

Smoke test:

```powershell
corepack pnpm smoke:test
```

Useful test commands:

```powershell
curl.exe -X POST "http://localhost:3001/alerts/mock/port-scan"
curl.exe "http://localhost:3001/alerts?limit=20&page=1"
curl.exe -X POST "http://localhost:3001/normalized-alerts/from-raw/<alertId>"
curl.exe -X POST "http://localhost:3001/jobs/normalize-alert/<alertId>"
curl.exe "http://localhost:3001/jobs/normalize-alert/<jobId>"
curl.exe "http://localhost:3001/normalized-alerts?limit=20&page=1"
```

PowerShell note:

- Use `curl.exe` instead of `curl` because PowerShell aliases `curl` to `Invoke-WebRequest`.

## Current Implemented Flow

- Raw alert ingestion through the API
- Deterministic alert normalization into a SOAR-ready schema
- Worker-backed normalization through BullMQ and MongoDB Atlas
- Structured playbook dataset with validation-ready metadata
- Shared types across API, worker, and web
- Frontend alert and normalized alert pages connected to live API data
- Redis queue processing for normalization and future background phases

## Phase 2B: Worker-backed Normalization

Purpose:

- Move alert normalization into a real BullMQ worker path while keeping the deterministic logic explainable and shared between the API and worker.

Queue and job contract:

- Queue name: `alert-normalization-queue`
- Job name: `normalize-alert`
- Shared normalization logic: `packages/shared/src/normalization/`
- Shared job contract: `packages/shared/src/jobs.ts`

Endpoints:

- `POST /normalized-alerts/from-raw/:alertId`
- `POST /jobs/normalize-alert/:alertId`
- `GET /jobs/normalize-alert/:jobId`
- `GET /jobs/normalize-alert/by-alert/:alertId`
- `GET /normalized-alerts`

Sync vs async normalization:

- `POST /normalized-alerts/from-raw/:alertId` runs synchronous normalization inside the API for direct testing and development.
- `POST /jobs/normalize-alert/:alertId` only enqueues the job; the BullMQ worker reads the raw alert from MongoDB, applies shared deterministic rules, and writes the normalized alert back to MongoDB.

Manual Phase 2B test commands for PowerShell:

1. Start the project:

```powershell
docker compose up --build
```

2. Create a raw alert:

```powershell
curl.exe -X POST "http://localhost:3001/alerts/mock/port-scan"
```

3. List raw alerts:

```powershell
curl.exe "http://localhost:3001/alerts?limit=20&page=1"
```

4. Queue worker normalization:

```powershell
curl.exe -X POST "http://localhost:3001/jobs/normalize-alert/<alertId>"
```

5. Check job status:

```powershell
curl.exe "http://localhost:3001/jobs/normalize-alert/<jobId>"
```

6. List normalized alerts:

```powershell
curl.exe "http://localhost:3001/normalized-alerts?limit=20&page=1"
```

## Phase 5: Structured Playbook Dataset

Purpose:

- Define a thesis-ready, machine-readable set of mock-only response playbooks that later phases can use for recommendation scoring, explanation, analyst approval, orchestration, incident tracking, and reporting.

Seed playbooks:

- `PB-001` Generic Alert Triage
- `PB-002` Internal Lateral Movement Scan
- `PB-003` Exposed Service Scan Validation
- `PB-004` Vulnerability Scan Follow-up
- `PB-005` Basic SQL Injection Triage
- `PB-010` DGA-like DNS Query Investigation
- `PB-027` Malware Beaconing With C2 Indicators
- `PB-030` Data Exfiltration With C2 Context

The active dataset is the 30-playbook structured v2 dataset from:

```text
SOARisk_Enhancement_Docs_Pack/playbooks.v2.seed.json
```

The old PB-001 to PB-010 demo-only seed array is no longer active. The seed script loads the enhancement pack at runtime and preserves structured fields such as alert types, severity affinity, required fields, MITRE ATT&CK mappings, asset criticality affinity, automation suitability, approval risk, workflow steps, scoring hints, expected outputs, and quality controls.

Validation and summary:

- Validation endpoint: `GET /playbooks/validate`
- Summary endpoint: `GET /playbooks/summary`

Safety guardrails:

- Playbooks are response procedure templates, not detection rules.
- Containment-like steps remain recommendation or request actions only.
- Sensitive actions require approval metadata and remain mock-only.
- No real blocking, quarantine, deletion, isolation, or account disablement is executed in this phase.

Manual Phase 5 commands for PowerShell:

Seed dataset:

```powershell
curl.exe -X POST "http://localhost:3001/playbooks/seed"
```

Reset seed dataset:

```powershell
curl.exe -X POST "http://localhost:3001/playbooks/seed/reset"
```

Validate dataset:

```powershell
curl.exe "http://localhost:3001/playbooks/validate"
```

List playbooks:

```powershell
curl.exe "http://localhost:3001/playbooks?limit=20&page=1"
```

View one playbook:

```powershell
curl.exe "http://localhost:3001/playbooks/PB-002"
```

## Phase 6A: Playbook Recommendation Scoring

Purpose:

- Score active playbooks deterministically against one normalized alert, rank the top candidates, store the recommendation result, and expose the score breakdown for analyst review.

Official scoring model:

- Source: `SOARisk_Enhancement_Docs_Pack/scoring_model.v1.json`
- Model ID: `SOARISK-RS-V2`
- Formula: `score = 100 * sum(weight_i * component_i) - 100 * sum(penalty_j)`, clamped to `[0,100]`

Weighted criteria:

- alert type match
- MITRE technique/tactic match
- severity match
- required field coverage
- asset criticality match
- indicator context from playbook scoring hints
- alert confidence
- source reliability
- automation suitability
- neutral historical performance placeholder

Penalties:

- missing critical field
- unsafe automation risk
- high or critical approval risk with weak evidence
- known benign signal
- conflicting MITRE context

Each Top-3 recommendation returns the playbook ID/name, final score, rank, matched criteria, missing criteria, score breakdown, approval risk, automation suitability, MITRE mapping, and a human-readable explanation.

Endpoints:

- `POST /recommendations/from-normalized/:normalizedAlertId`
- `GET /recommendations`
- `GET /recommendations/:recommendationId`
- `POST /recommendations/:recommendationId/select/:playbookId`
- `POST /jobs/recommend-playbooks/:normalizedAlertId`

Manual Phase 6A commands for PowerShell:

Create raw alert:

```powershell
curl.exe -X POST "http://localhost:3001/alerts/mock/port-scan"
```

List raw alerts:

```powershell
curl.exe "http://localhost:3001/alerts?limit=20&page=1"
```

Normalize alert:

```powershell
curl.exe -X POST "http://localhost:3001/normalized-alerts/from-raw/<alertId>"
```

List normalized alerts:

```powershell
curl.exe "http://localhost:3001/normalized-alerts?limit=20&page=1"
```

Seed playbooks:

```powershell
curl.exe -X POST "http://localhost:3001/playbooks/seed"
```

Generate recommendation:

```powershell
curl.exe -X POST "http://localhost:3001/recommendations/from-normalized/<normalizedAlertId>"
```

List recommendations:

```powershell
curl.exe "http://localhost:3001/recommendations?limit=20&page=1"
```

View recommendation:

```powershell
curl.exe "http://localhost:3001/recommendations/<recommendationId>"
```

Select playbook:

```powershell
curl.exe -X POST "http://localhost:3001/recommendations/<recommendationId>/select/<playbookId>"
```

PowerShell note:

- Use `curl.exe` instead of `curl`.

## Evaluation Dataset and Baseline Comparison

The evaluation module now uses the official enhancement dataset:

```text
SOARisk_Enhancement_Docs_Pack/evaluation_cases.v1.json
```

It compares two recommendation strategies:

- Baseline: ranks mainly by alert type match.
- Proposed: ranks with the SOARISK-RS-V2 weighted scoring model.

Returned metrics include Top-1 accuracy, Top-3 accuracy, mean reciprocal rank, mismatch cases, mismatch summary by alert type, confusion pairs, average score for correct vs incorrect Top-1 predictions, workflow success rate, average workflow execution time, manual step reduction, incidents by status, alerts by type/severity, and playbook usage count.

```powershell
curl.exe "http://localhost:3001/evaluation/summary"
```

The frontend view is available at:

```text
http://localhost:3000/evaluation
```

## Phase 7A: Recommendation Explanation Engine

Purpose:

- Generate deterministic, analyst-readable explanation records from a recommendation result and its related normalized alert.
- Keep explanation generation fully rule-based and thesis-friendly with no AI or LLM calls.

Key properties:

- Deterministic explanation output from stored recommendation scores and playbook metadata
- Structured explanation sections for summary, score breakdown, matched conditions, missing fields, approval notes, limitations, and analyst guidance
- Decision-support only: no workflow execution, no incident creation, and no operational response action

Endpoints:

- `POST /explanations/from-recommendation/:recommendationId`
- `GET /explanations`
- `GET /explanations/:explanationId`
- `GET /explanations/by-recommendation/:recommendationId`
- `POST /jobs/generate-explanation/:recommendationId`

Manual Phase 7A commands for PowerShell:

Generate recommendation first:

```powershell
curl.exe -X POST "http://localhost:3001/recommendations/from-normalized/<normalizedAlertId>"
```

Generate explanation:

```powershell
curl.exe -X POST "http://localhost:3001/explanations/from-recommendation/<recommendationId>"
```

List explanations:

```powershell
curl.exe "http://localhost:3001/explanations?limit=20&page=1"
```

View explanation:

```powershell
curl.exe "http://localhost:3001/explanations/<explanationId>"
```

Find by recommendation:

```powershell
curl.exe "http://localhost:3001/explanations/by-recommendation/<recommendationId>"
```

PowerShell note:

- Use `curl.exe` instead of `curl`.

## Phase 8A: Analyst Approval and Workflow Execution Skeleton

Purpose:

- Create a controlled, traceable SOAR workflow skeleton from a selected recommendation and selected playbook.
- Convert playbook actions into executable workflow steps while keeping every step mock-only.

Workflow behavior:

- `POST /workflows/from-recommendation/:recommendationId` creates a workflow from the selected playbook attached to a selected recommendation.
- `POST /workflows/:executionId/start` starts or continues sequential mock execution.
- Safe steps run automatically with mock-only results.
- Sensitive containment or approval-required steps pause the workflow and create an approval request.
- Analyst approval continues the mock workflow only. No real external security action is executed.
- Analyst rejection cancels the workflow and preserves the execution trail.

Safety guardrails:

- No real firewall, EDR, SIEM, isolation, quarantine, disablement, deletion, or notification delivery is performed.
- Direct dangerous action names remain forbidden and fail the workflow if encountered.
- Every sensitive step result explicitly states that only a mock request was recorded.

Endpoints:

- `GET /workflows`
- `GET /workflows/:executionId`
- `POST /workflows/from-recommendation/:recommendationId`
- `POST /workflows/:executionId/start`
- `POST /workflows/:executionId/cancel`
- `GET /workflows/:executionId/logs`
- `GET /approvals`
- `GET /approvals/:approvalId`
- `POST /approvals/:approvalId/approve`
- `POST /approvals/:approvalId/reject`
- `POST /jobs/start-workflow/:executionId`

Manual Phase 8A test sequence for PowerShell:

1. Seed playbooks:

```powershell
curl.exe -X POST "http://localhost:3001/playbooks/seed"
```

2. Create a mock port scan alert:

```powershell
curl.exe -X POST "http://localhost:3001/alerts/mock/port-scan"
```

3. Normalize the raw alert:

```powershell
curl.exe -X POST "http://localhost:3001/normalized-alerts/from-raw/<alertId>"
```

4. Generate a recommendation:

```powershell
curl.exe -X POST "http://localhost:3001/recommendations/from-normalized/<normalizedAlertId>"
```

5. Select `PB-002`:

```powershell
curl.exe -X POST "http://localhost:3001/recommendations/<recommendationId>/select/PB-002"
```

6. Optionally generate an explanation:

```powershell
curl.exe -X POST "http://localhost:3001/explanations/from-recommendation/<recommendationId>"
```

7. Create a workflow:

```powershell
curl.exe -X POST "http://localhost:3001/workflows/from-recommendation/<recommendationId>"
```

8. Start the workflow:

```powershell
curl.exe -X POST "http://localhost:3001/workflows/<executionId>/start"
```

9. Inspect pending approval requests:

```powershell
curl.exe "http://localhost:3001/approvals?executionId=<executionId>"
```

10. Approve the pending mock request:

```powershell
curl.exe -X POST "http://localhost:3001/approvals/<approvalId>/approve"
```

11. Inspect workflow logs:

```powershell
curl.exe "http://localhost:3001/workflows/<executionId>/logs"
```

PowerShell note:

- Use `curl.exe` instead of `curl`.

## Next Development Steps

- Incident tracking and timeline integration
- Report generation
