# Task Breakdown: Taskify

## Legend
- **Status**: [ ] Not Started | [~] In Progress | [x] Complete
- **Priority**: P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low)

---

## Infrastructure Tasks

### INFRA-001: Create Resource Group
- **Status**: [ ]
- **Priority**: P0
- **Agent**: cloud-architect
- **Description**: Create resource group `rg-taskify-dev` in US West 3
- **Deliverable**: Bicep template for resource group

### INFRA-002: Deploy Log Analytics Workspace
- **Status**: [ ]
- **Priority**: P0
- **Agent**: log-analytics-bicep
- **Description**: Create Log Analytics workspace for Container Apps Environment monitoring
- **Deliverable**: `modules/log-analytics/main.bicep`
- **Depends On**: INFRA-001

### INFRA-003: Create User-Assigned Managed Identity
- **Status**: [ ]
- **Priority**: P0
- **Agent**: user-managed-identity-bicep
- **Description**: Create managed identity `id-taskify-api` for backend Container App
- **Deliverable**: `modules/managed-identity/main.bicep`
- **Depends On**: INFRA-001

### INFRA-004: Deploy Azure Key Vault
- **Status**: [ ]
- **Priority**: P0
- **Agent**: key-vault-bicep
- **Description**: Create Key Vault for storing PostgreSQL credentials. Assign Key Vault Secrets User role to managed identity.
- **Deliverable**: `modules/key-vault/main.bicep`
- **Depends On**: INFRA-001, INFRA-003

### INFRA-005: Deploy PostgreSQL Flexible Server
- **Status**: [ ]
- **Priority**: P0
- **Agent**: postgresql-bicep
- **Description**: Create PostgreSQL Flexible Server (Burstable B1ms, 32 GiB storage, version 16) with taskify database. Store admin password in Key Vault.
- **Deliverable**: `modules/postgresql/main.bicep`
- **Depends On**: INFRA-001, INFRA-004

### INFRA-006: Deploy Azure Container Registry
- **Status**: [ ]
- **Priority**: P0
- **Agent**: container-registry-bicep
- **Description**: Create Container Registry. Assign AcrPull role to managed identity.
- **Deliverable**: `modules/container-registry/main.bicep`
- **Depends On**: INFRA-001, INFRA-003

### INFRA-007: Deploy Container Apps Environment
- **Status**: [ ]
- **Priority**: P0
- **Agent**: container-apps-environment-bicep
- **Description**: Create Container Apps Environment linked to Log Analytics workspace
- **Deliverable**: `modules/container-apps-environment/main.bicep`
- **Depends On**: INFRA-001, INFRA-002

### INFRA-008: Create Deployment Orchestrator Script
- **Status**: [ ]
- **Priority**: P1
- **Agent**: cloud-architect
- **Description**: Create `deploy.sh` script that orchestrates multi-staged Bicep deployment and updates AZURE_CONFIG.json
- **Deliverable**: `concept/infrastructure/deploy.sh`
- **Depends On**: INFRA-002 through INFRA-007

---

## Database Tasks

### DB-001: Design Database Schema
- **Status**: [ ]
- **Priority**: P0
- **Agent**: postgresql-developer
- **Description**: Design tables (users, projects, tasks, comments) with indexes and constraints per specify.md data model
- **Deliverable**: `concept/sql/001_create_tables.sql`

### DB-002: Create Seed Data Script
- **Status**: [ ]
- **Priority**: P0
- **Agent**: postgresql-developer
- **Description**: Create seed data: 5 users, 3 projects, 12 tasks (4 per project across all columns), sample comments
- **Deliverable**: `concept/sql/005_seed_data.sql`
- **Depends On**: DB-001

### DB-003: Create Database Views (if needed)
- **Status**: [ ]
- **Priority**: P3
- **Agent**: postgresql-developer
- **Description**: Create views for common query patterns (e.g., tasks with user details)
- **Deliverable**: `concept/sql/002_create_views.sql`
- **Depends On**: DB-001

---

## Backend API Tasks

### API-001: Initialize Node.js Project
- **Status**: [ ]
- **Priority**: P0
- **Agent**: node-developer
- **Description**: Create Express.js project with package.json, project structure, and core dependencies (express, cors, pg, dotenv)
- **Deliverable**: `concept/apps/api/package.json`, `concept/apps/api/src/index.js`

### API-002: Implement Database Connection Service
- **Status**: [ ]
- **Priority**: P0
- **Agent**: node-developer
- **Description**: Create PostgreSQL connection pool using `pg` library with configuration from environment variables
- **Deliverable**: `concept/apps/api/src/services/database.js`
- **Depends On**: API-001

### API-003: Implement Users API
- **Status**: [ ]
- **Priority**: P0
- **Agent**: node-developer
- **Description**: GET /api/users, GET /api/users/:id
- **Deliverable**: `concept/apps/api/src/routes/users.js`
- **Depends On**: API-002

### API-004: Implement Projects API
- **Status**: [ ]
- **Priority**: P0
- **Agent**: node-developer
- **Description**: GET /api/projects, GET /api/projects/:id, POST /api/projects
- **Deliverable**: `concept/apps/api/src/routes/projects.js`
- **Depends On**: API-002

### API-005: Implement Tasks API
- **Status**: [ ]
- **Priority**: P0
- **Agent**: node-developer
- **Description**: Full CRUD + status change + assignment endpoints for tasks
- **Deliverable**: `concept/apps/api/src/routes/tasks.js`
- **Depends On**: API-002

### API-006: Implement Comments API
- **Status**: [ ]
- **Priority**: P0
- **Agent**: node-developer
- **Description**: CRUD endpoints with threaded replies and ownership-based edit/delete permissions
- **Deliverable**: `concept/apps/api/src/routes/comments.js`
- **Depends On**: API-002

### API-007: Implement Error Handling Middleware
- **Status**: [ ]
- **Priority**: P1
- **Agent**: node-developer
- **Description**: Global error handler for PostgreSQL errors, validation errors, and 404s
- **Deliverable**: `concept/apps/api/src/middleware/errorHandler.js`
- **Depends On**: API-001

### API-008: Create Backend Dockerfile
- **Status**: [ ]
- **Priority**: P0
- **Agent**: node-developer
- **Description**: Multi-stage Dockerfile for Node.js API
- **Deliverable**: `concept/apps/api/Dockerfile`
- **Depends On**: API-001

---

## Frontend Tasks

### WEB-001: Initialize React Project
- **Status**: [ ]
- **Priority**: P0
- **Agent**: react-developer
- **Description**: Create Vite + React + TypeScript project with Tailwind CSS configuration
- **Deliverable**: `concept/apps/web/package.json`, `concept/apps/web/vite.config.ts`, `concept/apps/web/tailwind.config.js`

### WEB-002: Implement API Client
- **Status**: [ ]
- **Priority**: P0
- **Agent**: react-developer
- **Description**: Create typed API client module for all backend endpoints
- **Deliverable**: `concept/apps/web/src/api/client.ts`, `concept/apps/web/src/api/types.ts`
- **Depends On**: WEB-001

### WEB-003: Implement User Selection Screen
- **Status**: [ ]
- **Priority**: P0
- **Agent**: react-developer
- **Description**: Landing page with 5 user avatars, click to select active user
- **Deliverable**: `concept/apps/web/src/components/users/UserSelect.tsx`
- **Depends On**: WEB-001, WEB-002

### WEB-004: Implement Project List View
- **Status**: [ ]
- **Priority**: P0
- **Agent**: react-developer
- **Description**: Project listing with cards, click to open Kanban board, create new project button
- **Deliverable**: `concept/apps/web/src/components/projects/ProjectList.tsx`
- **Depends On**: WEB-002

### WEB-005: Implement Kanban Board
- **Status**: [ ]
- **Priority**: P0
- **Agent**: react-developer
- **Description**: 4-column Kanban board with @hello-pangea/dnd drag-and-drop. Cards highlight blue for active user.
- **Deliverable**: `concept/apps/web/src/components/kanban/Board.tsx`, `Column.tsx`, `Card.tsx`
- **Depends On**: WEB-002

### WEB-006: Implement Task Detail Modal
- **Status**: [ ]
- **Priority**: P0
- **Agent**: react-developer
- **Description**: Modal showing task title, description, status, assigned user with edit/delete/assign functionality
- **Deliverable**: `concept/apps/web/src/components/kanban/TaskDetail.tsx`
- **Depends On**: WEB-005

### WEB-007: Implement Comment Thread Component
- **Status**: [ ]
- **Priority**: P0
- **Agent**: react-developer
- **Description**: Threaded comment display with add/edit/delete per ownership rules. Timestamps displayed.
- **Deliverable**: `concept/apps/web/src/components/comments/CommentList.tsx`, `CommentForm.tsx`
- **Depends On**: WEB-002

### WEB-008: Implement App Layout and Routing
- **Status**: [ ]
- **Priority**: P1
- **Agent**: react-developer
- **Description**: Header with app name and Switch User button, navigation between views
- **Deliverable**: `concept/apps/web/src/App.tsx`, `concept/apps/web/src/components/layout/Header.tsx`
- **Depends On**: WEB-001

### WEB-009: Create Frontend Dockerfile
- **Status**: [ ]
- **Priority**: P0
- **Agent**: react-developer
- **Description**: Multi-stage Dockerfile (Node build + Nginx serve) with nginx.conf for SPA routing
- **Deliverable**: `concept/apps/web/Dockerfile`, `concept/apps/web/nginx.conf`
- **Depends On**: WEB-001

---

## Deployment Tasks

### DEPLOY-001: Deploy Backend Container App
- **Status**: [ ]
- **Priority**: P0
- **Agent**: container-app-bicep
- **Description**: Create Container App for API with managed identity, environment variables for PostgreSQL and Key Vault
- **Deliverable**: Bicep template in `modules/container-app/main.bicep` (parameterized for reuse)
- **Depends On**: INFRA-006, INFRA-007, API-008

### DEPLOY-002: Deploy Frontend Container App
- **Status**: [ ]
- **Priority**: P0
- **Agent**: container-app-bicep
- **Description**: Create Container App for frontend with API URL environment variable
- **Deliverable**: Reuse `modules/container-app/main.bicep` with frontend parameters
- **Depends On**: INFRA-006, INFRA-007, WEB-009

### DEPLOY-003: Execute Database Schema Scripts
- **Status**: [ ]
- **Priority**: P0
- **Agent**: postgresql-developer
- **Description**: Execute DDL scripts against PostgreSQL to create tables and seed data
- **Deliverable**: Commands documented in DEPLOYMENT.md for manual execution
- **Depends On**: INFRA-005, DB-001, DB-002

### DEPLOY-004: Build and Push Docker Images
- **Status**: [ ]
- **Priority**: P0
- **Agent**: cloud-architect
- **Description**: Document commands to build and push frontend and backend images to ACR
- **Deliverable**: Commands documented in DEPLOYMENT.md
- **Depends On**: API-008, WEB-009, INFRA-006

---

## Documentation Tasks

### DOC-001: Create ARCHITECTURE.md
- **Status**: [ ]
- **Priority**: P1
- **Agent**: documentation-manager
- **Description**: System architecture, component diagram, data flow, security architecture
- **Deliverable**: `concept/docs/ARCHITECTURE.md`

### DOC-002: Create DEPLOYMENT.md
- **Status**: [ ]
- **Priority**: P1
- **Agent**: documentation-manager
- **Description**: Step-by-step deployment runbook with all commands for manual execution
- **Deliverable**: `concept/docs/DEPLOYMENT.md`

### DOC-003: Create CONFIGURATION.md
- **Status**: [ ]
- **Priority**: P1
- **Agent**: documentation-manager
- **Description**: All service configurations, environment variables, RBAC assignments
- **Deliverable**: `concept/docs/CONFIGURATION.md`

### DOC-004: Create DEVELOPMENT.md
- **Status**: [ ]
- **Priority**: P1
- **Agent**: documentation-manager
- **Description**: Local development setup for frontend and backend, prerequisites
- **Deliverable**: `concept/docs/DEVELOPMENT.md`

---

## Task Summary

| Category | Total | P0 | P1 | P2 | P3 |
|----------|-------|----|----|----|----|
| Infrastructure | 8 | 7 | 1 | 0 | 0 |
| Database | 3 | 2 | 0 | 0 | 1 |
| Backend API | 8 | 7 | 1 | 0 | 0 |
| Frontend | 9 | 7 | 2 | 0 | 0 |
| Deployment | 4 | 4 | 0 | 0 | 0 |
| Documentation | 4 | 0 | 4 | 0 | 0 |
| **Total** | **36** | **27** | **8** | **0** | **1** |

---

## Performance Testing Tasks

### PERF-001: Create Locust Test Suite
- **Status**: [ ]
- **Priority**: P0
- **Agent**: python-developer
- **Description**: Create Python Locust load tests with 4 weighted scenarios (Browse Projects, Kanban Board Flow, Comment Activity, Health Check) targeting all 13 API endpoints
- **Deliverable**: `concept/tests/performance/locustfile.py`, `requirements.txt`, `README.md`

### PERF-002: Create App Insights Bicep Module
- **Status**: [ ]
- **Priority**: P0
- **Agent**: app-insights-bicep
- **Description**: Create Application Insights Bicep module linked to existing Log Analytics Workspace
- **Deliverable**: `concept/infrastructure/bicep/modules/app-insights.bicep`

### PERF-003: Create Azure Load Testing Bicep Module
- **Status**: [ ]
- **Priority**: P0
- **Agent**: cloud-architect
- **Description**: Create Azure Load Testing Bicep module for cloud-scale performance testing
- **Deliverable**: `concept/infrastructure/bicep/modules/load-testing.bicep`

### PERF-004: Create Performance Infrastructure Stage
- **Status**: [ ]
- **Priority**: P0
- **Agent**: cloud-architect
- **Description**: Create stage5-performance.bicep composing App Insights and Load Testing modules
- **Deliverable**: `concept/infrastructure/bicep/stage5-performance.bicep`
- **Depends On**: PERF-002, PERF-003

### PERF-005: Create Performance Test Generator Skill
- **Status**: [ ]
- **Priority**: P1
- **Agent**: cloud-architect
- **Description**: Create Copilot skill for generating Locust tests for new API endpoints
- **Deliverable**: `.claude/skills/performance-test-generator/SKILL.md`
- **Depends On**: PERF-001

### PERF-006: Create Performance Baseline Analyzer Skill
- **Status**: [ ]
- **Priority**: P1
- **Agent**: cloud-architect
- **Description**: Create Copilot skill for analyzing Locust results against performance thresholds
- **Deliverable**: `.claude/skills/performance-baseline-analyzer/SKILL.md`
- **Depends On**: PERF-001

### PERF-007: Create Pre-Commit Performance Hook
- **Status**: [ ]
- **Priority**: P1
- **Agent**: cloud-architect
- **Description**: Create Copilot hook that warns when API routes are modified without corresponding Locust test coverage
- **Deliverable**: `.github/hooks/pre-commit-perf-check.md`
- **Depends On**: PERF-001

### PERF-008: Create PR Performance Gate Hook
- **Status**: [ ]
- **Priority**: P1
- **Agent**: cloud-architect
- **Description**: Create Copilot hook that verifies performance tests pass on PRs touching API code
- **Deliverable**: `.github/hooks/pr-perf-gate.md`
- **Depends On**: PERF-001, PERF-007

### PERF-009: Create Performance Testing Pipeline
- **Status**: [ ]
- **Priority**: P0
- **Agent**: cloud-architect
- **Description**: Create GitHub Actions workflow with 3 jobs: local Locust verification, deploy to perf environment, Azure Load Testing execution
- **Deliverable**: `.github/workflows/performance-testing.yml`
- **Depends On**: PERF-001, PERF-004

### PERF-010: Create Agentic Workflow for Dynamic Analysis
- **Status**: [ ]
- **Priority**: P1
- **Agent**: cloud-architect
- **Description**: Create GitHub Agentic Workflow (gh-aw) that analyzes performance results post-pipeline and creates regression issues
- **Deliverable**: `.github/workflows/perf-analysis.md`
- **Depends On**: PERF-009

---

## Deployment Validation

| ID | Task | Priority | Status | Dependencies | Owner |
|----|------|----------|--------|--------------|-------|
| DEPLOY-001 | Update deploy-infrastructure.yml with _V2 secrets | P0 | Not Started | — | cloud-architect |
| DEPLOY-002 | Update deploy-terraform.yml with _V2 secrets | P0 | Not Started | — | cloud-architect |
| DEPLOY-003 | Create main.bicep composition wrapper | P0 | Not Started | — | cloud-architect |
| DEPLOY-004 | Add OIDC federated credential for environment:dev | P0 | Not Started | — | cloud-architect |
| DEPLOY-005 | Create GitHub secrets/variables with _V2 suffix | P0 | Not Started | DEPLOY-004 | cloud-architect |
| DEPLOY-006 | Deploy infrastructure via workflow_dispatch | P0 | Not Started | DEPLOY-001, DEPLOY-002, DEPLOY-003, DEPLOY-005 | cloud-architect |
| DEPLOY-007 | Build and push Docker images to ACR | P0 | Not Started | DEPLOY-006 | cloud-architect |
| DEPLOY-008 | Run live performance tests against deployed app | P0 | Not Started | DEPLOY-007 | qa-engineer |
| DEPLOY-009 | Verify App Insights telemetry | P1 | Not Started | DEPLOY-008 | qa-engineer |

---

## Updated Task Summary

| Category | Total | P0 | P1 | P2 | P3 |
|----------|-------|----|----|----|----|
| Infrastructure | 8 | 7 | 1 | 0 | 0 |
| Database | 3 | 2 | 0 | 0 | 1 |
| Backend API | 8 | 7 | 1 | 0 | 0 |
| Frontend | 9 | 7 | 2 | 0 | 0 |
| Deployment | 4 | 4 | 0 | 0 | 0 |
| Documentation | 4 | 0 | 4 | 0 | 0 |
| Performance Testing | 10 | 5 | 5 | 0 | 0 |
| Deployment Validation | 9 | 8 | 1 | 0 | 0 |
| **Total** | **55** | **40** | **14** | **0** | **1** |
