# Copilot Instructions — Azure Innovation Factory Starter Kit

## What This Repo Is

This is a **starter kit** for Microsoft Innovation Factory engagements — time-boxed (max 10-day) Azure POC projects. It provides a multi-agent orchestration framework, document templates, and a sample application ("Taskify") that demonstrates the architecture. Everything under `concept/` is the deployable solution; everything else is scaffolding, templates, and agent definitions.

**All deliverables are functional prototypes, not production systems.**

## Architecture Overview

### Agent-Driven Development

This repo is designed for AI-assisted development using ~80 specialized agents (defined in `.claude/agents/`). Each Azure service has four agent roles: architect, developer, terraform, and bicep. Support agents handle cross-cutting concerns (project management, documentation, cost analysis, QA).

The agent orchestration follows a strict 12-stage process (Strategy → Prototyping → Validate → Improve → Evaluate → Hand Off), with stage definitions in `.claude/context/stages/STAGE_XX_*.md`.

### Sample Application: Taskify

A Kanban board app with three services running as Docker containers:

- **API** (`concept/apps/api/`): Node.js + Express REST API (CommonJS, not ESM)
- **Web** (`concept/apps/web/`): React 18 + TypeScript + Vite + Tailwind CSS frontend
- **Database**: PostgreSQL 16 (Azure PostgreSQL Flexible Server in prod, Docker locally)

API routes are mounted under `/api/` with resources: `/api/users`, `/api/projects`, `/api/tasks`, `/api/comments`. The API identifies users via `X-User-Id` header (no auth middleware — prototype pattern).

### Infrastructure

- **IaC**: Bicep templates in `concept/infrastructure/bicep/` with modular stages (`stage1-foundation.bicep` through `stage4-application.bicep`) and reusable modules in `modules/`
- **Terraform**: Alternative IaC option in `concept/infrastructure/terraform/` (if present)
- **CI/CD**: Two GitHub Actions workflows — `deploy-infrastructure.yml` (Bicep) and `deploy-terraform.yml` — both use OIDC federated credentials
- **Azure services**: Container Apps, Container Registry, PostgreSQL Flexible Server, Key Vault, Log Analytics, App Insights, User-Assigned Managed Identity

### Key Configuration

- `concept/AZURE_CONFIG.json` — Central resource configuration (owned by `cloud-architect` agent, gitignored)
- `concept/.specify/` — Spec Kit documentation (constitution, specs, plan, tasks)
- `.claude/context/SHARED_CONSTRAINTS.md` — Mandatory Azure environment constraints

## Build & Run Commands

### Local Development (Docker)

```bash
cd concept
docker compose up --build       # Start all services (db, api, web)
docker compose down -v          # Stop and reset database
```

Services: API on `localhost:3000`, Web on `localhost:5173`, PostgreSQL on `localhost:5432`.

### API (Node.js)

```bash
cd concept/apps/api
npm install
npm run dev                     # Nodemon dev server (port 3000)
npm start                       # Production start
```

### Web (React/Vite)

```bash
cd concept/apps/web
npm install
npm run dev                     # Vite dev server (port 5173)
npm run build                   # TypeScript check + Vite build
```

### E2E Tests (Playwright)

```bash
cd concept/apps/web
npx playwright install          # One-time browser setup
npx playwright test             # Run all E2E tests
npx playwright test tests/kanbanBoard.spec.ts  # Run single test file
npx playwright test --ui        # Interactive test runner
```

### Infrastructure Validation

```bash
az bicep build --file concept/infrastructure/bicep/main.bicep  # Lint Bicep
```

## Critical Constraints

### Azure Environment (Non-Negotiable)

- **Managed Identity only** — No connection strings, access keys, SAS tokens, or SQL auth
- **Authentication pattern**: `Service → Managed Identity → RBAC Role Assignment → Resource`
- **Private endpoints required** for all data/backend services (SQL, Cosmos, Storage, Key Vault, etc.)
- **No direct Azure command execution by AI agents** — commands must be documented for human execution
- **Compliance tags required** on all resources: `Environment`, `Stage`, `Purpose`

### Code Conventions

- API uses CommonJS (`require()`), not ES modules
- Web app uses ESM (`import`) with TypeScript
- Database credentials are fetched from Azure Key Vault in production, environment variables locally (controlled by `AZURE_KEY_VAULT_URL` being set or empty)
- SQL DDL scripts in `concept/sql/` are numbered sequentially (`001_`, `002_`, etc.) and auto-run on Docker init
- The `concept/` folder must be deployable from a fresh clone — no customer-identifying information allowed (except in `AZURE_CONFIG.json`)

### Document Templates

All project documents must be generated from templates in `.claude/templates/`. Copy the template, then fill in content — never create documents from scratch.
