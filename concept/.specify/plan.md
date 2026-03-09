# Implementation Plan: Taskify

## Overview

This plan outlines the implementation sequence for the Taskify team productivity platform. The plan is organized into deployment stages aligned with the AZURE_CONFIG.json structure and follows the Innovation Factory prototyping timeline.

---

## Stage 1: Foundation Infrastructure

**Duration**: 0.5 days
**Owner**: cloud-architect, coordinating with service architects

### Deliverables
1. Resource Group(s) in US West 3
2. Log Analytics Workspace
3. User-Assigned Managed Identity (for API container)
4. Azure Key Vault (for storing PostgreSQL credentials)
5. RBAC role assignments (Managed Identity -> Key Vault Secrets User)

### Azure Services
| Service | Agent | Purpose |
|---------|-------|---------|
| Resource Group | cloud-architect | Resource containment |
| Log Analytics | log-analytics-bicep | Monitoring and diagnostics |
| Managed Identity | user-managed-identity-bicep | API service identity |
| Key Vault | key-vault-bicep | PostgreSQL credential storage |

### Dependencies
- Azure subscription with resource provider registrations
- Naming convention established

---

## Stage 2: Data Layer

**Duration**: 0.5 days
**Owner**: postgresql-architect, postgresql-bicep, postgresql-developer

### Deliverables
1. Azure Database for PostgreSQL Flexible Server (Burstable B1ms)
2. Taskify database created on the server
3. SQL DDL scripts for schema (tables, indexes)
4. Seed data scripts (users, projects, tasks)
5. PostgreSQL admin password stored in Key Vault

### Azure Services
| Service | Agent | Purpose |
|---------|-------|---------|
| PostgreSQL Flexible Server | postgresql-bicep | Database hosting |
| Key Vault (update) | key-vault-bicep | Store admin credentials |

### Dependencies
- Stage 1 complete (Key Vault, Managed Identity)

---

## Stage 3: Container Infrastructure

**Duration**: 0.5 days
**Owner**: container-apps-environment-architect, container-registry-architect

### Deliverables
1. Azure Container Registry
2. Container Apps Environment (linked to Log Analytics)
3. RBAC role assignment (Managed Identity -> AcrPull on Container Registry)

### Azure Services
| Service | Agent | Purpose |
|---------|-------|---------|
| Container Registry | container-registry-bicep | Docker image storage |
| Container Apps Environment | container-apps-environment-bicep | Container hosting platform |

### Dependencies
- Stage 1 complete (Log Analytics, Managed Identity)

---

## Stage 4: Application Development

**Duration**: 1.5 - 2 days
**Owner**: node-developer, react-developer, postgresql-developer

### Deliverables

#### Backend API (node-developer)
1. Express.js REST API with all endpoints
2. PostgreSQL connection pool with Key Vault credential retrieval
3. Route handlers for users, projects, tasks, comments
4. Error handling middleware
5. CORS configuration
6. Health check endpoint
7. Dockerfile

#### Frontend Application (react-developer)
1. React + TypeScript + Vite application
2. User selection landing screen with avatars
3. Project list view with create project functionality
4. Kanban board with @hello-pangea/dnd drag-and-drop
5. Task card components with blue highlight for active user
6. Task detail view (modal) with edit/delete/assign
7. Threaded comment system with ownership-based edit/delete
8. API client module
9. Tailwind CSS styling
10. Dockerfile with Nginx
11. Nginx configuration for SPA routing

#### Database Scripts (postgresql-developer)
1. 001_create_tables.sql -- Users, Projects, Tasks, Comments tables
2. 002_create_views.sql -- (if needed)
3. 003_create_sprocs.sql -- (if needed)
4. 004_create_udfs.sql -- (if needed)
5. 005_seed_data.sql -- 5 users, 3 projects, 12 tasks, sample comments

### Dependencies
- Database schema finalized (Stage 2)
- API contract agreed between node-developer and react-developer

---

## Stage 5: Application Deployment

**Duration**: 0.5 days
**Owner**: container-app-bicep, cloud-architect

### Deliverables
1. Backend Container App deployed with environment variables
2. Frontend Container App deployed with API URL configuration
3. Database schema applied via SQL scripts
4. Seed data loaded
5. End-to-end connectivity verified

### Deployment Sequence
1. Build and push backend Docker image to ACR
2. Build and push frontend Docker image to ACR
3. Deploy backend Container App (with PostgreSQL connection env vars)
4. Deploy frontend Container App (with API URL env var)
5. Execute SQL DDL scripts against PostgreSQL
6. Execute seed data script
7. Verify application is accessible

### Dependencies
- Stage 3 complete (Container Registry, Container Apps Environment)
- Stage 4 complete (Application code and Dockerfiles)

---

## Stage 6: Documentation

**Duration**: 0.5 days (parallel with testing)
**Owner**: documentation-manager

### Deliverables
1. ARCHITECTURE.md -- System architecture and component relationships
2. DEPLOYMENT.md -- Step-by-step deployment runbook
3. CONFIGURATION.md -- Service configurations and environment variables
4. DEVELOPMENT.md -- Local development setup guide

### Dependencies
- All prior stages complete

---

## Infrastructure-as-Code Organization

```
concept/infrastructure/
  deploy.sh                      # Multi-staged deployment orchestrator
  bicep/
    main.bicep                   # Orchestrator template
    modules/
      resource-group/
        main.bicep
      log-analytics/
        main.bicep
      managed-identity/
        main.bicep
      key-vault/
        main.bicep
      postgresql/
        main.bicep
      container-registry/
        main.bicep
      container-apps-environment/
        main.bicep
      container-app/
        main.bicep               # Reusable for both frontend and backend
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| PostgreSQL Flexible Server provisioning time (15-20 min) | Deploy early in Stage 2 |
| Container Registry image push issues | Verify ACR connectivity before app deployment |
| PostgreSQL SSL connectivity from Container Apps | Test with SSL mode required; document troubleshooting |
| Key Vault access from Container App | Verify Managed Identity RBAC before app deployment |
| Drag-and-drop library compatibility | @hello-pangea/dnd is well-maintained fork of react-beautiful-dnd |
| Threaded comments complexity | Keep thread depth to 1 level (replies to top-level comments only) |

---

## Timeline Summary

| Day | Activities |
|-----|------------|
| Day 1 (Feb 13) | Stages 1-3: Foundation, Data Layer, Container Infrastructure |
| Day 2 (Feb 14) | Stage 4: Backend API development, Database scripts |
| Day 3 (Feb 15) | Stage 4: Frontend development, Integration |
| Day 4 (Feb 16-17) | Stage 5: Deployment, Stage 6: Documentation |
