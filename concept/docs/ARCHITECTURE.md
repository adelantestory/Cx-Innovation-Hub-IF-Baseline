# Taskify - Architecture

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Workflow Pipeline](#2-workflow-pipeline)
3. [Request Lifecycle](#3-request-lifecycle)
4. [Azure Services Infrastructure](#4-azure-services-infrastructure)
5. [Data Storage Architecture](#5-data-storage-architecture)
6. [Service Dependencies](#6-service-dependencies)
7. [Scaling & Autoscaling](#7-scaling--autoscaling)
8. [Error Handling & Retry Logic](#8-error-handling--retry-logic)

---

## 1. High-Level Architecture

Taskify is a two-tier web application consisting of a React single-page application (frontend) and a Node.js/Express REST API (backend), both deployed as separate Azure Container Apps. The backend communicates with Azure Database for PostgreSQL Flexible Server for all data persistence. Database credentials are stored in Azure Key Vault and retrieved at runtime by the backend using a User-Assigned Managed Identity.

The architecture prioritizes simplicity and rapid deployment in alignment with the Innovation Factory prototype mindset. There is no authentication layer, no message queue, and no AI services -- the application is a straightforward CRUD application with a drag-and-drop Kanban UI.

```mermaid
flowchart TB
    subgraph Clients["Client Layer"]
        BROWSER["Web Browser<br/>Desktop (1024px+ viewport)"]
    end

    subgraph ContainerApps["Azure Container Apps Environment"]
        WEB["Frontend Container App<br/>React + Vite + Nginx<br/>(ca-taskify-web)"]
        API["Backend Container App<br/>Node.js + Express<br/>(ca-taskify-api)"]
    end

    subgraph Data["Data Layer"]
        PG[("PostgreSQL Flexible Server<br/>Burstable B1ms<br/>(psql-taskify-dev)")]
    end

    subgraph Security["Security & Identity"]
        KV["Azure Key Vault<br/>(kv-taskify-dev)"]
        MI["User-Assigned<br/>Managed Identity<br/>(id-taskify-api)"]
    end

    subgraph Registry["Container Registry"]
        ACR["Azure Container Registry<br/>Basic SKU<br/>(cr-taskify-dev)"]
    end

    subgraph Monitoring["Observability"]
        LOG["Log Analytics Workspace<br/>(log-taskify-dev)"]
    end

    BROWSER -->|HTTPS| WEB
    WEB -->|Serves static assets| BROWSER
    BROWSER -->|HTTPS /api/*| API
    API -->|SSL / Port 5432| PG
    API -.->|"Managed Identity<br/>Key Vault Secrets User"| KV
    MI -.->|"Assigned to"| API
    MI -.->|"AcrPull"| ACR
    ACR -.->|"Image Pull"| WEB
    ACR -.->|"Image Pull"| API
    ContainerApps -.->|"Logs & Metrics"| LOG
```

### Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hosting platform | Azure Container Apps | Serverless containers with built-in scaling, HTTPS ingress, and managed identity support. Simpler than AKS for a POC with two containers. |
| Frontend serving | Nginx in Container App | Static SPA assets served via Nginx. Decoupled from backend for independent scaling and deployment. |
| Database | PostgreSQL Flexible Server (Burstable B1ms) | Customer-specified technology. Burstable tier is cost-effective for POC workloads with intermittent usage. |
| Credential management | Key Vault + Managed Identity | Microsoft internal Azure constraint: no connection strings or access keys allowed. Managed identity provides keyless authentication to Key Vault. |
| IaC tooling | Bicep | Customer preference. Native Azure tooling with strong type safety and module support. |
| Drag-and-drop library | @hello-pangea/dnd | Well-maintained fork of react-beautiful-dnd with active community support and TypeScript types. |
| API architecture | RESTful Express.js | Simple, well-understood pattern. No GraphQL or tRPC needed for this scope. JavaScript per customer preference. |
| Container Registry SKU | Basic | Sufficient for POC. No geo-replication or advanced features needed. |
| Single resource group | One RG for all resources | Simplifies management for a POC. All resources share the same lifecycle. |
| Public ingress | Enabled for both Container Apps | POC requires browser access. Production would use private endpoints and a gateway. |

---

## 2. Workflow Pipeline

Taskify follows a standard request-response web application pattern. There are no background processing pipelines, message queues, or asynchronous workflows. All operations are synchronous REST API calls.

```mermaid
flowchart LR
    START([User Action])

    subgraph Frontend["Frontend (React SPA)"]
        UI["1. UI Event<br/>(click, drag, form submit)"]
        STATE["2. Update Local State<br/>(optimistic UI)"]
        FETCH["3. API Call<br/>(fetch / axios)"]
    end

    subgraph Backend["Backend (Express API)"]
        ROUTE["4. Route Handler<br/>(validate request)"]
        QUERY["5. Database Query<br/>(pg Pool)"]
    end

    subgraph Database["PostgreSQL"]
        PERSIST["6. Persist Data<br/>(INSERT/UPDATE/DELETE)"]
    end

    RESPONSE([Response to UI])

    START --> UI
    UI --> STATE
    STATE --> FETCH
    FETCH --> ROUTE
    ROUTE --> QUERY
    QUERY --> PERSIST
    PERSIST -->|Rows affected| QUERY
    QUERY -->|JSON result| ROUTE
    ROUTE -->|HTTP response| FETCH
    FETCH -->|Update state| RESPONSE

    style RESPONSE fill:#c8e6c9
```

### Step Details

| Step | Purpose | Technology | Key Outputs |
|------|---------|------------|-------------|
| 1. UI Event | Capture user interaction (drag card, click button, submit form) | React event handlers, @hello-pangea/dnd | Event payload |
| 2. Update Local State | Optimistic update for responsive UI (e.g., move card immediately) | React useState/useReducer | Updated UI |
| 3. API Call | Send HTTP request to backend | fetch API with JSON body | HTTP request |
| 4. Route Handler | Validate request, extract parameters, apply business rules | Express.js router, middleware | Validated input |
| 5. Database Query | Execute parameterized SQL query | pg library Pool.query() | Query result |
| 6. Persist Data | Write or read data from PostgreSQL | PostgreSQL 16 | Committed transaction |

---

## 3. Request Lifecycle

### Task Status Change (Drag-and-Drop)

This is the most complex interaction in the application -- when a user drags a task card from one Kanban column to another.

```mermaid
sequenceDiagram
    participant B as Browser
    participant W as Frontend (React)
    participant A as Backend API
    participant KV as Key Vault
    participant DB as PostgreSQL

    Note over A,KV: On startup only
    A->>KV: Get secrets (Managed Identity auth)
    KV-->>A: PostgreSQL host, username, password

    B->>W: Drag card to new column
    W->>W: Optimistic UI update (move card locally)
    W->>A: PATCH /api/tasks/:id/status {status, position}

    A->>A: Validate status enum (todo, in_progress, in_review, done)
    A->>DB: UPDATE tasks SET status=$1, position=$2 WHERE id=$3
    DB-->>A: 1 row updated
    A-->>W: 200 OK {updated task}
    W->>W: Confirm state (or rollback on error)
    W-->>B: Render updated board
```

### Comment Creation

```mermaid
sequenceDiagram
    participant B as Browser
    participant W as Frontend (React)
    participant A as Backend API
    participant DB as PostgreSQL

    B->>W: Type comment, click Submit
    W->>A: POST /api/tasks/:taskId/comments<br/>{content, parentCommentId?}<br/>Header: X-User-Id
    A->>A: Validate content not empty
    A->>DB: INSERT INTO comments (task_id, user_id, content, parent_comment_id)
    DB-->>A: New comment row with id, created_at
    A->>DB: SELECT joined with users for author name
    DB-->>A: Comment with author details
    A-->>W: 201 Created {comment with author}
    W->>W: Append comment to thread
    W-->>B: Render updated comments
```

### Comment Edit/Delete (Ownership Check)

```mermaid
sequenceDiagram
    participant B as Browser
    participant W as Frontend (React)
    participant A as Backend API
    participant DB as PostgreSQL

    B->>W: Click Edit/Delete on comment
    W->>A: PUT or DELETE /api/comments/:id<br/>Header: X-User-Id

    A->>DB: SELECT user_id FROM comments WHERE id=$1
    DB-->>A: Comment owner user_id

    alt X-User-Id matches comment owner
        A->>DB: UPDATE or DELETE comment
        DB-->>A: Success
        A-->>W: 200 OK
        W-->>B: Updated/removed comment
    else X-User-Id does NOT match
        A-->>W: 403 Forbidden
        W-->>B: Show error message
    end
```

---

## 4. Azure Services Infrastructure

```mermaid
flowchart TB
    subgraph RG["Resource Group: rg-taskify-dev (US West 3)"]
        subgraph Compute["Container Apps"]
            CAE["Container Apps Environment<br/>(cae-taskify-dev)"]
            CA_WEB["Container App: Web<br/>0.25 vCPU / 0.5 GiB<br/>Min: 0, Max: 1"]
            CA_API["Container App: API<br/>0.25 vCPU / 0.5 GiB<br/>Min: 0, Max: 1"]
        end

        subgraph Registry["Container Registry"]
            ACR["Container Registry<br/>(cr-taskify-dev)<br/>Basic SKU"]
        end

        subgraph DataStores["Data Stores"]
            PSQL["PostgreSQL Flexible Server<br/>(psql-taskify-dev)<br/>Burstable B1ms<br/>32 GiB Storage<br/>Version 16"]
        end

        subgraph Monitoring["Monitoring"]
            LOG["Log Analytics Workspace<br/>(log-taskify-dev)<br/>30-day retention"]
        end

        subgraph Security["Security & Identity"]
            KV["Key Vault<br/>(kv-taskify-dev)<br/>Standard SKU"]
            MI["User-Assigned Managed Identity<br/>(id-taskify-api)"]
        end
    end

    CAE --- CA_WEB
    CAE --- CA_API
    CA_API -.->|"User-Assigned MI"| MI
    MI -.->|"Key Vault Secrets User"| KV
    MI -.->|"AcrPull"| ACR
    CA_API -->|"SSL"| PSQL
    CAE -.->|"Diagnostics"| LOG
```

### Resource Summary

| Resource Type | Resource Name | SKU/Tier | Configuration |
|---------------|---------------|----------|---------------|
| Resource Group | rg-{uid}-taskify-dev | N/A | Location: US West 3 |
| Log Analytics Workspace | log-{uid}-taskify-dev | PerGB2018 | 30-day retention |
| User-Assigned Managed Identity | id-{uid}-taskify-api | N/A | Assigned to API Container App |
| Key Vault | kv-{uid}-taskify-dev | Standard | RBAC authorization, soft delete (7 days) |
| PostgreSQL Flexible Server | psql-{uid}-taskify-dev | Burstable B1ms | v16, 32 GiB storage, SSL enforced |
| Container Registry | cr{uid}taskifydev | Basic | Admin user disabled, managed identity pull |
| Container Apps Environment | cae-{uid}-taskify-dev | Consumption | Zone redundancy disabled |
| Container App (API) | ca-{uid}-taskify-api | Consumption | 0.25 vCPU, 0.5 GiB, port 3000, external ingress |
| Container App (Web) | ca-{uid}-taskify-web | Consumption | 0.25 vCPU, 0.5 GiB, port 80, external ingress |

**Note**: `{uid}` is a unique identifier assigned at deployment time to ensure globally unique resource names.

---

## 5. Data Storage Architecture

### PostgreSQL Schema

```mermaid
erDiagram
    users {
        uuid id PK
        text name
        text role
        text avatar_color
        timestamptz created_at
    }

    projects {
        uuid id PK
        text name
        text description
        timestamptz created_at
        timestamptz updated_at
    }

    tasks {
        uuid id PK
        uuid project_id FK
        text title
        text description
        text status
        integer position
        uuid assigned_user_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    comments {
        uuid id PK
        uuid task_id FK
        uuid user_id FK
        uuid parent_comment_id FK
        text content
        timestamptz created_at
        timestamptz updated_at
    }

    users ||--o{ tasks : "assigned to"
    users ||--o{ comments : "authored"
    projects ||--o{ tasks : "contains"
    tasks ||--o{ comments : "has"
    comments ||--o{ comments : "replies to"
```

### Table Details

**users** - Five predefined team members (1 Product Manager, 4 Engineers). No dynamic user creation.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, gen_random_uuid() | Unique identifier |
| name | TEXT | NOT NULL | Display name |
| role | TEXT | NOT NULL | product_manager or engineer |
| avatar_color | TEXT | NOT NULL | Hex color for avatar display |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record timestamp |

**projects** - Kanban project boards. Three pre-seeded, with ability to create new ones.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, gen_random_uuid() | Unique identifier |
| name | TEXT | NOT NULL | Project name |
| description | TEXT | NULLABLE | Project description |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last modification |

**tasks** - Kanban task cards within projects. Status determines column placement.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, gen_random_uuid() | Unique identifier |
| project_id | UUID | FK -> projects(id) ON DELETE CASCADE | Parent project |
| title | TEXT | NOT NULL | Task title |
| description | TEXT | NULLABLE | Task details |
| status | TEXT | NOT NULL, DEFAULT 'todo' | Kanban column (todo, in_progress, in_review, done) |
| position | INTEGER | NOT NULL, DEFAULT 0 | Order within column |
| assigned_user_id | UUID | FK -> users(id) ON DELETE SET NULL | Assigned team member |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last modification |

**comments** - Threaded comments on task cards with ownership-based permissions.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, gen_random_uuid() | Unique identifier |
| task_id | UUID | FK -> tasks(id) ON DELETE CASCADE | Parent task |
| user_id | UUID | FK -> users(id) ON DELETE CASCADE | Comment author |
| parent_comment_id | UUID | FK -> comments(id) ON DELETE CASCADE | Reply threading (nullable) |
| content | TEXT | NOT NULL | Comment text |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last modification |

### Indexes

| Index Name | Table | Column(s) | Purpose |
|------------|-------|-----------|---------|
| idx_tasks_project_id | tasks | project_id | Fast lookup of tasks by project |
| idx_tasks_assigned_user_id | tasks | assigned_user_id | Fast lookup of user's tasks |
| idx_tasks_status | tasks | status | Fast filtering by Kanban column |
| idx_comments_task_id | comments | task_id | Fast lookup of comments by task |
| idx_comments_user_id | comments | user_id | Fast lookup of comments by author |
| idx_comments_parent_comment_id | comments | parent_comment_id | Fast threading of replies |

### Seed Data

| Entity | Count | Distribution |
|--------|-------|-------------|
| Users | 5 | 1 Product Manager, 4 Engineers |
| Projects | 3 | Website Redesign, Mobile App MVP, API Integration |
| Tasks | 12 | 4 per project, distributed across all 4 Kanban columns |
| Comments | Sample | A few comments per task to demonstrate threading |

---

## 6. Service Dependencies

```mermaid
flowchart TB
    subgraph External["External"]
        BROWSER["Web Browser"]
    end

    subgraph ContainerApps["Container Apps Environment"]
        WEB["Frontend Container App<br/>(React + Nginx)"]
        API["Backend Container App<br/>(Node.js + Express)"]
    end

    subgraph Azure["Azure Platform Services"]
        KV["Key Vault"]
        ACR["Container Registry"]
        LOG["Log Analytics"]
        MI["Managed Identity"]
    end

    subgraph Data["Data"]
        PG["PostgreSQL<br/>Flexible Server"]
    end

    BROWSER -->|"HTTPS (static assets)"| WEB
    BROWSER -->|"HTTPS (API calls)"| API

    API -->|"Read/Write (SQL over SSL)"| PG
    API -.->|"Read secrets (Managed Identity)"| KV
    MI -.->|"Key Vault Secrets User"| KV
    MI -.->|"AcrPull"| ACR
    MI -.->|"Assigned to"| API
    ACR -.->|"Image pull"| WEB
    ACR -.->|"Image pull"| API
    LOG -.->|"Receives logs from"| API
    LOG -.->|"Receives logs from"| WEB
```

### Dependency Matrix

| Service | Depends On | Depended By |
|---------|------------|-------------|
| Resource Group | Subscription | All resources |
| Log Analytics Workspace | Resource Group | Container Apps Environment |
| User-Assigned Managed Identity | Resource Group | Key Vault (RBAC), Container Registry (RBAC), API Container App |
| Key Vault | Resource Group, Managed Identity (RBAC) | API Container App (secret retrieval) |
| PostgreSQL Flexible Server | Resource Group, Key Vault (stores password) | API Container App |
| Container Registry | Resource Group, Managed Identity (RBAC) | Both Container Apps (image source) |
| Container Apps Environment | Resource Group, Log Analytics | Both Container Apps |
| Container App (API) | Environment, Registry, Managed Identity, Key Vault, PostgreSQL | Frontend (API calls from browser) |
| Container App (Web) | Environment, Registry | Browser (serves static SPA) |

### Deployment Order

Resources must be deployed in the following order due to dependencies:

1. Resource Group
2. Log Analytics Workspace, User-Assigned Managed Identity (parallel)
3. Key Vault (needs Managed Identity for RBAC)
4. PostgreSQL Flexible Server (needs Key Vault for password storage)
5. Container Registry (needs Managed Identity for RBAC), Container Apps Environment (needs Log Analytics) (parallel)
6. Backend Container App (needs Environment, Registry, Identity, Key Vault, PostgreSQL)
7. Frontend Container App (needs Environment, Registry, and Backend FQDN for API URL)

---

## 7. Scaling & Autoscaling

As a POC, Taskify uses minimal scaling configuration. All Container Apps are configured to scale to zero when idle, which minimizes cost during development and testing.

```mermaid
flowchart TB
    subgraph WebApp["Frontend Container App (HTTP Scaling)"]
        WEB_SCALE["Scale: 0 to 1 replicas<br/>Trigger: HTTP requests<br/>CPU: 0.25 vCPU / Memory: 0.5 GiB"]
    end

    subgraph ApiApp["Backend Container App (HTTP Scaling)"]
        API_SCALE["Scale: 0 to 1 replicas<br/>Trigger: HTTP requests<br/>CPU: 0.25 vCPU / Memory: 0.5 GiB"]
    end

    subgraph Database["PostgreSQL Flexible Server (Fixed)"]
        DB_SCALE["Fixed: Burstable B1ms<br/>1 vCore / 2 GiB RAM<br/>32 GiB Storage<br/>No auto-scale"]
    end

    REQUEST["Incoming HTTP Request"] --> WebApp
    WebApp --> ApiApp
    ApiApp --> Database
```

### Scaling Configuration

| Component | Min | Max | Trigger | Cold Start Time |
|-----------|-----|-----|---------|-----------------|
| Frontend Container App | 0 | 1 | HTTP requests | ~5-10 seconds (Nginx is lightweight) |
| Backend Container App | 0 | 1 | HTTP requests | ~10-15 seconds (Node.js startup + Key Vault secret fetch) |
| PostgreSQL Flexible Server | N/A (always on) | N/A | N/A | N/A |

### Production Scaling Considerations (Out of Scope)

For production readiness, the following changes would be recommended:

- **Increase max replicas** to 3-5 for both Container Apps to handle concurrent users
- **Set min replicas to 1** for the API to avoid cold start latency
- **Upgrade PostgreSQL** to General Purpose tier for consistent performance
- **Add connection pooling** (e.g., PgBouncer) for database connection management at scale
- **Enable zone redundancy** on Container Apps Environment for high availability

---

## 8. Error Handling & Retry Logic

As a prototype, Taskify implements basic error handling sufficient to demonstrate functionality and provide useful feedback to users. Production-grade error handling patterns are documented as recommendations.

```mermaid
flowchart TB
    subgraph APIRequest["API Request Handling"]
        REQ["Incoming Request"]
        VALIDATE["Validate Input"]
        PROCESS["Execute Business Logic"]
        RESPOND["Send Response"]

        REQ --> VALIDATE
        VALIDATE -->|Valid| PROCESS
        VALIDATE -->|Invalid| ERR_400["400 Bad Request"]
        PROCESS -->|Success| RESPOND
        PROCESS -->|DB Error| ERR_500["500 Internal Server Error"]
        PROCESS -->|Not Found| ERR_404["404 Not Found"]
        PROCESS -->|Forbidden| ERR_403["403 Forbidden"]
    end

    subgraph ErrorMiddleware["Express Error Middleware"]
        HANDLER["Global Error Handler"]
        LOG_ERR["Log to console/stdout"]
    end

    ERR_400 --> HANDLER
    ERR_404 --> HANDLER
    ERR_403 --> HANDLER
    ERR_500 --> HANDLER
    HANDLER --> LOG_ERR

    style RESPOND fill:#c8e6c9
    style ERR_400 fill:#ffccbc
    style ERR_404 fill:#ffccbc
    style ERR_403 fill:#ffccbc
    style ERR_500 fill:#ffccbc
```

### Error Codes

| HTTP Status | Description | Scenario | Retryable |
|-------------|-------------|----------|-----------|
| 400 | Bad Request | Missing required fields, invalid status enum, empty comment content | No (client must fix input) |
| 403 | Forbidden | User attempting to edit/delete another user's comment | No (ownership violation) |
| 404 | Not Found | Task, project, comment, or user ID does not exist | No (resource does not exist) |
| 500 | Internal Server Error | PostgreSQL connection failure, unexpected runtime error | Yes (transient failures) |

### Frontend Error Handling

| Scenario | Behavior |
|----------|----------|
| API unreachable | Display error banner with retry option |
| 400/403/404 response | Display contextual error message to user |
| 500 response | Display generic error with retry option |
| Drag-and-drop fails (API error) | Revert card to original column (optimistic UI rollback) |
| Network timeout | Display connection error, prompt retry |

### Production Recommendations (Out of Scope)

- **Structured logging**: Use a logging library (e.g., winston or pino) with JSON output for Log Analytics ingestion
- **Correlation IDs**: Add request correlation headers for end-to-end tracing
- **Circuit breaker**: Implement circuit breaker pattern for PostgreSQL connection failures
- **Health checks**: Liveness and readiness probes on the Container Apps
- **Application Insights**: Integrate with Azure Application Insights for distributed tracing

---

## Technology Stack Summary

| Layer | Technology | Version/SKU |
|-------|------------|-------------|
| **Frontend** | React + TypeScript + Vite | React 18+, Vite 5+ |
| **UI Styling** | Tailwind CSS | 3.x |
| **Drag-and-Drop** | @hello-pangea/dnd | Latest |
| **Backend** | Node.js + Express.js (JavaScript) | Node 20 LTS, Express 4.x |
| **Database Client** | pg (node-postgres) | 8.x |
| **Database** | Azure Database for PostgreSQL Flexible Server | v16, Burstable B1ms |
| **Secret Management** | Azure Key Vault | Standard |
| **Identity** | User-Assigned Managed Identity + @azure/identity SDK | Latest |
| **Key Vault SDK** | @azure/keyvault-secrets | Latest |
| **Container Hosting** | Azure Container Apps | Consumption plan |
| **Container Registry** | Azure Container Registry | Basic |
| **Monitoring** | Azure Log Analytics | PerGB2018 |
| **IaC** | Bicep | Latest |
| **Web Server (Frontend)** | Nginx | Alpine-based |

---

## Security Architecture

### Identity and Access Management

All service-to-service authentication uses Azure Managed Identity. No connection strings or access keys are stored in application code or environment variables.

| Source | Target | Auth Method | Role/Permission |
|--------|--------|-------------|-----------------|
| API Container App | Key Vault | User-Assigned Managed Identity | Key Vault Secrets User |
| API Container App | PostgreSQL | Username/Password from Key Vault | PostgreSQL admin (stored as secrets) |
| Container Apps | Container Registry | User-Assigned Managed Identity | AcrPull |
| Browser | Frontend Container App | HTTPS (public) | Anonymous (no auth) |
| Browser | Backend Container App | HTTPS (public) | Anonymous (X-User-Id header for user context) |

### Secret Flow

```mermaid
flowchart LR
    DEPLOY["Deployment Script"] -->|"Generates random password"| KV["Key Vault"]
    DEPLOY -->|"Sets admin password"| PSQL["PostgreSQL"]
    KV -->|"Stores: host, username, password"| SECRETS["Key Vault Secrets"]

    API["API Container App"] -->|"1. Managed Identity token"| ENTRA["Entra ID"]
    ENTRA -->|"2. Access token"| API
    API -->|"3. Get secrets"| KV
    KV -->|"4. host, username, password"| API
    API -->|"5. Connect with credentials"| PSQL
```

### Network Security (POC Configuration)

| Aspect | POC Setting | Production Recommendation |
|--------|-------------|---------------------------|
| Container Apps ingress | Public (external) | Private with Application Gateway or Front Door |
| PostgreSQL access | Public with Azure Services firewall rule | Private endpoint in VNet |
| Key Vault access | Public | Private endpoint in VNet |
| Container Registry access | Public | Private endpoint in VNet |
| CORS | Frontend origin only | Strict origin allowlist |
| TLS | Enforced (HTTPS for web, SSL for PostgreSQL) | Same, with custom domain certificates |

---

*Last updated: 2026-02-12*
