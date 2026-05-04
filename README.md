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
- Later phases will add Playbook Recommendation, Explanation, Analyst Approval, Workflow Execution, Incident Tracking, and Report Generation.

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
- `PB-002` Port Scan Investigation
- `PB-003` ICMP Flood / DoS Response
- `PB-004` Web SQL Injection Response
- `PB-005` Web XSS Response
- `PB-006` Suspicious DNS Investigation
- `PB-007` Malware / C2 Traffic Investigation
- `PB-008` Brute Force Login Investigation
- `PB-009` Phishing Alert Triage
- `PB-010` Data Exfiltration Investigation

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

Scoring components:

- Alert type match: 35 points
- Required fields completeness: 20 points
- Severity match: 15 points
- Asset context match: 10 points
- Condition match: 15 points
- Automation suitability: 5 points

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

## Next Development Steps

- Recommendation explanation engine
- Analyst approval flow
- Workflow execution
- Incident tracking
- Report generation
