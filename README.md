# SOC SOAR Platform Foundation

Initial monorepo foundation for the thesis:

**Research and Development of an Automated Security Incident Orchestration and Response Solution for SOC Based on Open-Source SOAR**

Vietnamese thesis topic:

**Nghiên cứu và xây dựng giải pháp tự động hoá điều phối và ứng phó sự cố an ninh mạng trong SOC dựa trên SOAR mã nguồn mở**

## What This System Is

This repository initializes a **SOAR-based SOC automation platform**.

The system starts **after security alerts are generated** by upstream systems and focuses on:

- alert normalization
- structured playbook dataset management
- playbook recommendation
- recommendation explanation
- analyst approval
- workflow orchestration
- incident tracking
- response report generation

Target workflow:

`Security Alert -> Alert Normalization -> Playbook Recommendation -> Recommendation Explanation -> Analyst Approval -> Workflow Execution -> Incident Tracking -> Report Generation`

## What This System Is Not

This repository is intentionally **not**:

- a SIEM
- an IDS
- a deep packet inspection platform
- a full PCAP analysis console
- a malware execution or sandboxing environment
- a fully autonomous response platform

## Scope Guardrails

- Not SIEM: correlation-heavy monitoring and enterprise log analytics are outside the current scope.
- Not IDS: upstream detection is assumed to already exist before this platform begins.
- Not full PCAP analyzer: PCAP remains limited to controlled demo/test alert generation.
- No real malware execution: no detonation, sandboxing, or live malware handling is implemented.
- No fully autonomous response: sensitive actions remain mock-only until analyst approval is designed.
- Analyst approval required: future containment, blocking, quarantine, or similar response actions must remain gated by analyst approval.

## Architecture Overview

The repository uses a pnpm/Turborepo monorepo with the following layers:

- `apps/web`: Next.js frontend dashboard shell
- `apps/api`: NestJS backend API with modular SOAR resources
- `apps/worker`: BullMQ worker runtime for placeholder background jobs
- `packages/shared`: shared TypeScript enums, interfaces, API response types, and SOAR constants
- `packages/config`: shared TypeScript and ESLint configuration

Current backend persistence uses:

- MongoDB with Mongoose schemas
- explicit collection names
- TypeScript-friendly `camelCase` document fields
- business identifiers such as `alertId`, `playbookId`, `incidentId`, and `executionId`

## Monorepo Structure

```text
soc-soar-platform/
  apps/
    api/
    web/
    worker/
  packages/
    config/
    shared/
  docker-compose.yml
  .env.example
  package.json
  pnpm-workspace.yaml
  turbo.json
  README.md
```

## Technology Stack

- Monorepo: Turborepo + pnpm
- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: NestJS + TypeScript
- Database: MongoDB local / MongoDB Atlas compatible
- ODM: Mongoose
- Queue: BullMQ + Redis
- Workers: separate worker runtime for placeholder jobs
- Quality: ESLint, Prettier, strict TypeScript
- Deployment foundation: Docker Compose

## Environment Variables

Copy `.env.example` to `.env` for local development.

```env
MONGODB_URI=mongodb://localhost:27017/soc_soar_platform
REDIS_HOST=localhost
REDIS_PORT=6379
API_PORT=3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NODE_ENV=development
```

Notes:

- Local development uses `localhost` values from `.env`.
- Docker Compose injects container-specific MongoDB and Redis hostnames internally.
- `MONGODB_URI` can later be replaced with a MongoDB Atlas connection string without changing application code.

## Install

Install dependencies with Corepack-managed pnpm:

```bash
corepack pnpm install
```

## Development Commands

Run the full monorepo:

```bash
corepack pnpm dev
```

Run focused app stacks:

```bash
corepack pnpm dev:web
corepack pnpm dev:api
corepack pnpm dev:worker
```

Validation commands:

```bash
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
docker compose config
```

Default local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`

## Docker Commands

Build and start all services:

```bash
docker compose up --build
```

Stop services:

```bash
docker compose down
```

Services included:

- MongoDB
- Redis
- API
- Worker
- Web

## Backend Modules

- `health`
- `alerts`
- `normalized-alerts`
- `playbooks`
- `recommendations`
- `explanations`
- `workflows`
- `incidents`
- `reports`
- `assets`
- `pcap-demo`
- `jobs`

## MongoDB Collections

- `raw_alerts`
- `normalized_alerts`
- `playbooks`
- `recommendations`
- `incidents`
- `workflow_executions`
- `execution_logs`
- `reports`
- `assets`
- `pcap_files`
- `pcap_jobs`

## Current API Surface

- `GET /health`
- `GET /alerts`
- `POST /alerts/mock`
- `GET /normalized-alerts`
- `GET /normalized-alerts/:id`
- `GET /playbooks`
- `GET /playbooks/:id`
- `POST /playbooks/seed`
- `GET /recommendations`
- `POST /recommendations/mock`
- `GET /explanations`
- `GET /incidents`
- `GET /incidents/:id`
- `POST /incidents/mock`
- `GET /workflows`
- `POST /workflows/mock-start`
- `GET /reports`
- `POST /reports/mock`
- `GET /assets`
- `POST /pcap-demo/upload-placeholder`
- `GET /pcap-demo/jobs`
- `GET /jobs`

Placeholder API responses are standardized as:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": {}
}
```

## Worker Queues

- `pcap-demo-queue`
- `alert-normalization-queue`
- `recommendation-queue`
- `workflow-execution-queue`
- `report-generation-queue`

All processors currently:

- connect to Redis via environment variables
- log placeholder execution
- avoid real security enforcement logic
- avoid real blocking, quarantine, or containment actions

## Frontend Routes

- `/`
- `/alerts`
- `/alerts/[id]`
- `/playbooks`
- `/playbooks/[id]`
- `/recommendations`
- `/incidents`
- `/incidents/[id]`
- `/workflows`
- `/reports`
- `/pcap-demo`

The dashboard shell currently focuses on:

- explaining each phase in the SOAR workflow
- reserving layout for later data binding
- reinforcing scope guardrails
- keeping PCAP framed as demo/test input only

## Seed Playbooks

The initial seed dataset contains:

- `PB-001 Generic Alert Triage`
- `PB-002 Port Scan Investigation`
- `PB-003 ICMP Flood / DoS Response`
- `PB-004 Web Attack Response`
- `PB-005 Suspicious DNS Investigation`
- `PB-006 Malware / C2 Traffic Investigation`
- `PB-007 Brute Force Login Investigation`
- `PB-008 Phishing Alert Triage`

Each seed playbook includes:

- `playbookId`
- `name`
- `description`
- `incidentCategory`
- `supportedAlertTypes`
- `requiredFields`
- `severityRange`
- `assetContext`
- `actions`
- `approvalRequired`
- `automationLevel`
- `references`

## Current Status

This repository currently provides:

- validated monorepo wiring between web, api, worker, shared, and config packages
- strict TypeScript-friendly shared contracts
- consistent placeholder API response envelopes
- cleaned backend schemas with explicit collections and stable business identifiers
- placeholder worker queues ready for future implementation
- a frontend shell that clearly presents SOAR workflow intent
- Docker Compose suitable for local MongoDB and Redis development

What is still intentionally missing:

- real alert ingestion
- real normalization logic
- real playbook matching or scoring
- real explanation generation
- analyst approval workflow state transitions
- real orchestration or containment actions
- report generation logic beyond placeholders

## Next Phases

Recommended next implementation steps:

1. Add API-to-worker job production for normalization, recommendation, workflow, and report pipelines.
2. Design normalized alert ingestion flow from raw alerts into recommendation-ready records.
3. Expand the structured playbook dataset and validation rules.
4. Implement recommendation scoring and explanation breakdowns.
5. Add analyst approval state transitions before workflow execution.
6. Introduce incident timeline updates tied to recommendation and workflow events.
7. Connect frontend pages to live API data and empty/loading states.
8. Add guarded mock action execution history before considering any real integrations.
#   S O A R i s k  
 