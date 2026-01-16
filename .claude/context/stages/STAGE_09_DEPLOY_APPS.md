# Stage 9: Deploy Application Components

**Phase:** 2 - Prototyping  
**Duration:** Part of 2-4 days (shared with Stages 4-8)  
**Primary Actor:** Human  
**Supporting Agents:** `cloud-architect`, service developers

## Overview

Human uses the deployment and development guides to deploy each application component. Agents adjust applications as issues arise.

## Process

1. **Human Executes Deployment**
   - Human follows `concept/docs/DEPLOYMENT.md` for application deployment
   - Human references `concept/docs/DEVELOPMENT.md` for build steps
   - Deploy applications in staged order

2. **Validation**
   - Verify applications deployed with correct configuration
   - Verify compliance with Microsoft security policies
   - Test basic functionality

3. **Issue Resolution**
   - If issues arise (bug, misconfiguration, incompatibility):
     - Human engages `cloud-architect`
     - `cloud-architect` assigns appropriate agent to fix
     - `cloud-architect` communicates documentation changes to `document-writer`

4. **Database Scripts**
   - If applicable, execute DDL scripts in order:
     - `001_create_tables.sql`
     - `002_create_views.sql`
     - `003_create_sprocs.sql`
     - `004_create_udfs.sql`
     - `005_seed_data.sql`

## Deployment Verification

For each application, verify:
- [ ] Application deployed successfully
- [ ] Configuration applied correctly
- [ ] Managed Identity authentication working
- [ ] Connections to dependent services functional
- [ ] Basic health checks passing

## Issue Types and Response

| Issue Type | Responsible Agent |
|------------|-------------------|
| Code bug | `[service]-developer` |
| Configuration | `[service]-architect` |
| Infrastructure | `[service]-terraform` or `[service]-bicep` |
| Database | `[database]-developer` |
| Documentation | `document-writer` |

## Agent Responsibilities

| Agent | Responsibility |
|-------|----------------|
| `cloud-architect` | Coordinate fixes, assign work |
| `[service]-developer` | Fix application code issues |
| `[service]-architect` | Fix configuration issues |
| `document-writer` | Update guides with changes |

## Deliverables

| Deliverable | Location | Owner |
|-------------|----------|-------|
| Deployed Applications | Azure | Human |
| Updated Source Code | `concept/apps/` | Service developers |
| Updated Documentation | `concept/docs/` | `document-writer` |

## Exit Criteria

- [ ] All applications deployed
- [ ] All applications functional
- [ ] Database scripts executed (if applicable)
- [ ] Managed Identity authentication working
- [ ] Documentation updated with any changes
- [ ] Ready for customer testing

## Next Stage

Proceed to **Stage 10: Testing & Validation** when applications are deployed.
