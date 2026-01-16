# Stage 7: Build Infrastructure & Applications

**Phase:** 2 - Prototyping  
**Duration:** Part of 2-4 days (shared with Stages 4-6, 8-9)  
**Primary Agents:** `cloud-architect`, service agents (all four types), `document-writer`

## Overview

Based on architecture and configuration documents, the `cloud-architect` engages agents to construct Terraform/Bicep modules and application code. This is the most intensive building stage.

---

## Part A: Infrastructure

### IaC Requirements

- Terraform modules: `concept/infrastructure/terraform/`
- Bicep modules: `concept/infrastructure/bicep/`
- **DRY and SOLID principles** — No mono-module design
- Modular, reusable components

### Staged Deployment

The `cloud-architect` **MUST** plan a **STAGED** deployment process:
- Services deployed together by domain, layer, or purpose
- Each stage can be redeployed independently
- Typical stages:
  - Stage 1: Foundation (Key Vault, Log Analytics, App Insights, Managed Identity)
  - Stage 2: Data (SQL, Cosmos, Redis, Storage)
  - Stage 3: Messaging (Service Bus, Event Grid)
  - Stage 4: Compute (Functions, Web Apps, Container Apps)
  - Stage 5: AI (Azure OpenAI, Cognitive Services)

### Deployment Script

The `cloud-architect` creates `concept/infrastructure/deploy.sh` with parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `-l, --location` | Azure region | `eastus`, `northeurope` |
| `-u, --uid` | Unique root identifier | `my-app` |
| `-e, --environment` | Environment | `dev`, `stg`, `prd` |
| `-s, --stage` | Stage number | `1`, `2`, `all` |

### AZURE_CONFIG.json Integration

**CRITICAL:** The deployment script must:
- Reference `concept/AZURE_CONFIG.json` for all stages
- Update the file upon each deployment with resource details
- Use `jq` for querying values

### Resource Labeling

**CRITICAL:** All resources must include tags:
- `Environment` (Dev/Stg/Prd)
- `Stage` (Stage 1, Stage 2, etc.)
- `Purpose` (Foundation, Data, Compute, etc.)

---

## Part B: Applications

### Code Requirements

- **DRY and SOLID principles** — No monolithic code
- **Single-responsibility** — Each method/function does one thing
- **Simplicity, readability, maintainability** — HIGH priority
- **Independent solutions** — Each app in `concept/apps/`
- **Deployable individually** — Except containerized workloads

### Application Structure

```
concept/apps/
├── api/                    # API application
├── functions/              # Azure Functions
├── web/                    # Web frontend
└── workers/                # Background workers
```

### Staged App Deployment

Apps deployed together by domain, layer, or purpose — similar to infrastructure.

---

## Part C: Database Scripts

If relational database required, engage appropriate database agent:

```
concept/sql/
├── 001_create_tables.sql
├── 002_create_views.sql
├── 003_create_sprocs.sql
├── 004_create_udfs.sql
└── 005_seed_data.sql
```

Adapt structure for other databases (postgres, mysql, mongo, databricks).

---

## Part D: Documentation

Upon completion, `cloud-architect` engages `document-writer` to create:

1. **Deployment Guide** (`concept/docs/DEPLOYMENT.md`)
   - Step-by-step deployment instructions
   - Infrastructure deployment
   - Application deployment
   - Manual steps required
   - Dependency order

2. **Development Guide** (`concept/docs/DEVELOPMENT.md`)
   - Local development setup
   - Build instructions
   - Testing procedures
   - Critical notes from agents

---

## Change Management

**CRITICAL:** If deployment process or configuration changes, `cloud-architect` must inform:

| Role | Update Required |
|------|-----------------|
| `document-writer` | Deployment/development guides |
| `[service]-terraform` | Terraform modules |
| `[service]-bicep` | Bicep modules |
| `[service]-developer` | Source code |
| `[database]-developer` | Database scripts |

**All documentation, scripts, and source code must remain up-to-date AT ALL TIMES.**

---

## Agent Responsibilities

| Agent | Responsibility |
|-------|----------------|
| `cloud-architect` | Overall coordination, deploy.sh, AZURE_CONFIG.json |
| `[service]-architect` | Service configuration design |
| `[service]-developer` | Application code |
| `[service]-terraform` | Terraform modules |
| `[service]-bicep` | Bicep modules |
| `[database]-developer` | DDL scripts |
| `document-writer` | DEPLOYMENT.md, DEVELOPMENT.md |

---

## Deliverables

| Deliverable | Location | Owner |
|-------------|----------|-------|
| Deployment Guide | `concept/docs/DEPLOYMENT.md` | `document-writer` |
| Development Guide | `concept/docs/DEVELOPMENT.md` | `document-writer` |
| Deployment Script | `concept/infrastructure/deploy.sh` | `cloud-architect` |
| Terraform Modules | `concept/infrastructure/terraform/` | `[service]-terraform` |
| Bicep Modules | `concept/infrastructure/bicep/` | `[service]-bicep` |
| Applications | `concept/apps/` | `[service]-developer` |
| DDL Scripts (if needed) | `concept/sql/` | `[database]-developer` |

---

## Exit Criteria

- [ ] All Terraform modules created
- [ ] All Bicep modules created
- [ ] Deployment script functional with all parameters
- [ ] AZURE_CONFIG.json integration complete
- [ ] All applications built
- [ ] All applications follow DRY/SOLID principles
- [ ] DDL scripts created (if applicable)
- [ ] `concept/docs/DEPLOYMENT.md` complete
- [ ] `concept/docs/DEVELOPMENT.md` complete
- [ ] All documentation current

## Next Stage

Proceed to **Stage 8: Deploy Infrastructure** when all components are built.
