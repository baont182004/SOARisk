# SOARisk

## Project Orientation

SOARisk is a **SOAR-based SOC automation platform** for the thesis topic:

**Research and Development of an Automated Security Incident Orchestration and Response Solution for SOC Based on Open-Source SOAR**

This project starts **after security alerts already exist**.

- It is **not** a SIEM.
- It is **not** an IDS.
- PCAP is reserved for later demo/test alert generation only.
- The current implemented core flow is `RawAlert -> NormalizedAlert`.
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

```bash
curl -X POST http://localhost:3001/alerts/mock/port-scan
curl "http://localhost:3001/alerts?limit=20&page=1"
curl -X POST http://localhost:3001/normalized-alerts/from-raw/<alertId>
curl "http://localhost:3001/normalized-alerts?limit=20&page=1"
```

## Current Implemented Flow

- Raw alert ingestion through the API
- Deterministic alert normalization into a SOAR-ready schema
- Shared types across API, worker, and web
- Frontend alert and normalized alert pages connected to live API data
- Redis queue foundation for later background processing

## Next Development Steps

- Playbook recommendation
- Recommendation explanation
- Analyst approval flow
- Workflow execution
- Incident tracking
- Report generation
