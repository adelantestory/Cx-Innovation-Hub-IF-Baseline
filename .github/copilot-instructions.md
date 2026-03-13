# Copilot Instructions — Taskify Innovation Factory Repository

## What This Repo Is

This repository is an Innovation Factory starter repo that also contains a concrete sample solution under `concept/`: **Taskify**, a prototype Kanban application.

Treat the repo as two things at once:

- `concept/` is the actual deployable solution and application code.
- The rest of the repo provides guidance, workflows, and custom Copilot agent definitions that support work on that solution.

All deliverables in this repo should be treated as **functional prototypes**, not production systems.

## Guidance Surface That Actually Exists

When working in this repository, prefer these sources of truth:

- `README.md` for top-level repository orientation
- `.github/copilot-instructions.md` for Copilot-specific repo guidance
- `.github/agents/*.md` for the custom testing agents currently defined in the repo
- `concept/.specify/memory/constitution.md` for project principles that apply to the sample solution
- `concept/docs/*.md` for architecture, configuration, deployment, and development guidance

Do **not** assume a `.claude/` directory, `.claude/agents/`, `.claude/skills/`, `.claude/templates/`, or `.claude/context/stages/` exists in this repository unless those files are added later.

## Current Custom Agents In This Repo

The custom agent definitions currently present are:

- `.github/agents/api-unit-test-engineer.md`
- `.github/agents/web-unit-test-engineer.md`

There is **no repo-local skills directory** today. Do not reference repo-specific skills unless they are added to the repository.

## Solution Overview

Taskify is a simple two-tier web application with a PostgreSQL database.

- **API**: `concept/apps/api/`
  - Node.js + Express
  - CommonJS modules (`require`, `module.exports`)
  - REST endpoints under `/api`
- **Web**: `concept/apps/web/`
  - React 18 + TypeScript + Vite
  - Tailwind CSS
- **Database**: `concept/sql/`
  - PostgreSQL schema and seed scripts

Key routes and behaviors:

- API resources live under `/api/users`, `/api/projects`, `/api/tasks`, and `/api/comments`
- Health endpoint: `/api/health`
- The prototype uses `X-User-Id` to identify the active user
- There is **no authentication layer** in the sample app
- There are **no AI services, queues, or background workers** in the sample app

## Local Development

The primary local workflow uses Docker Compose from `concept/`.

```bash
cd concept
docker compose up --build
docker compose down
docker compose down -v
```

Local service URLs:

- Web UI: `http://localhost:5173`
- API: `http://localhost:3000`
- API health: `http://localhost:3000/api/health`
- PostgreSQL: `localhost:5432`

The local stack is defined in `concept/docker-compose.yml` and starts:

- `db` using `postgres:16-alpine`
- `api` using `concept/apps/api/Dockerfile.dev`
- `web` using `concept/apps/web/Dockerfile.dev`

### Running Without Docker

Alternative local workflows are also supported:

- API from `concept/apps/api`
  - `npm install`
  - `npm run dev`
  - `npm test`
- Web from `concept/apps/web`
  - `npm install`
  - `npm run dev`
  - `npm run build`
  - `npm test`
  - `npm run test:e2e`

Use `concept/docs/DEVELOPMENT.md` as the source of truth for local setup details and environment variables.

## Infrastructure Reality

The infrastructure implementation currently present in the repo is **Bicep-first**.

- Bicep lives under `concept/infrastructure/bicep/`
- The staged templates are:
  - `stage1-foundation.bicep`
  - `stage2-data.bicep`
  - `stage3-containers.bicep`
  - `stage4-application.bicep`
- Reusable modules live under `concept/infrastructure/bicep/modules/`
- Deployment orchestration currently lives in `concept/infrastructure/deploy.sh`

Do **not** assume a complete Terraform implementation exists unless you verify files under `concept/infrastructure/terraform/`.

Do **not** assume a `concept/infrastructure/bicep/main.bicep` file exists unless you verify it in the repo.

## Azure and Prototype Constraints

This repo follows Innovation Factory prototype guidance, but the sample solution intentionally makes some POC tradeoffs. Keep both ideas in mind:

- Prefer simple, demonstrable solutions over production hardening
- Document production implications rather than over-engineering the prototype
- Preserve the current Taskify architecture unless the task explicitly changes it

Important current-state details:

- In Azure, the API retrieves database credentials from Key Vault at runtime
- In local development, the API uses environment variables when `AZURE_KEY_VAULT_URL` is empty
- Public browser access is intentional for the prototype experience

When writing or editing guidance, distinguish clearly between:

- **current implementation behavior**
- **recommended production hardening**

Do not present production-only constraints as if they already describe the current Taskify implementation.

## Code Conventions

Follow the conventions already used by the application:

- API code uses **CommonJS**, not ESM
- Web code uses **TypeScript + ESM**
- Reuse existing project structure and naming before introducing new folders or abstractions
- Keep SQL scripts in `concept/sql/` numerically ordered
- Update docs when behavior or setup instructions change

## Testing Conventions

Use the existing test stacks:

- API unit tests: Jest in `concept/apps/api/src/__tests__/`
- Web unit tests: Vitest + React Testing Library in `concept/apps/web/src/**/*.{test,spec}.{ts,tsx}`
- Web end-to-end tests: Playwright in `concept/apps/web/tests/`

When the task is primarily API unit testing, prefer the `api-unit-test-engineer` custom agent.

When the task is primarily frontend unit testing, prefer the `web-unit-test-engineer` custom agent.

## Documentation Expectations

Prefer updating existing docs over inventing new ones. The most relevant docs for this repo are:

- `concept/docs/ARCHITECTURE.md`
- `concept/docs/CONFIGURATION.md`
- `concept/docs/DEPLOYMENT.md`
- `concept/docs/DEVELOPMENT.md`

If you update instructions or workflows, make sure they stay aligned with the real repository contents and actual Taskify implementation.
