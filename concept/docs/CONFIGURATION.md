# Taskify - Configuration Guide

## Table of Contents

1. [Configuration Overview](#1-configuration-overview)
2. [AZURE_CONFIG.json Structure](#2-azure_configjson-structure)
3. [Environment Variables](#3-environment-variables)
4. [Azure Service Configurations](#4-azure-service-configurations)
5. [Application Configurations](#5-application-configurations)
6. [Security Configuration](#6-security-configuration)
7. [Networking Configuration](#7-networking-configuration)
8. [Monitoring Configuration](#8-monitoring-configuration)
9. [Configuration by Environment](#9-configuration-by-environment)
10. [Local Development Setup](#10-local-development-setup)

---

## 1. Configuration Overview

### Configuration Sources

| Source | Location | Purpose |
|--------|----------|---------|
| AZURE_CONFIG.json | `concept/AZURE_CONFIG.json` | Central configuration for all Azure resources (owned by `cloud-architect`) |
| Bicep Parameters | `concept/infrastructure/bicep/*.bicepparam` | IaC deployment parameters |
| Deployment Script | `concept/infrastructure/deploy.sh` | Orchestrates staged deployments and updates AZURE_CONFIG.json |
| Key Vault | `kv-{uid}-taskify-dev` | Secrets: PostgreSQL host, username, and admin password |
| Container App Env Vars | Set via Bicep at deployment time | Runtime configuration for backend and frontend containers |

### Configuration Hierarchy

```
Environment Variables (highest priority)
    |
    v
Container App Settings (set via Bicep/deploy.sh)
    |
    v
Key Vault Secrets (retrieved at runtime via Managed Identity)
    |
    v
AZURE_CONFIG.json Values (referenced by deploy.sh)
    |
    v
Default Values in Application Code (lowest priority)
```

### Required Tags

All Azure resources must include the following tags. These are enforced by the deployment scripts and Bicep templates.

| Tag | Description | Example Value |
|-----|-------------|---------------|
| `Environment` | Deployment environment | `dev` |
| `Stage` | Deployment stage that created the resource | `foundation`, `data`, `container-infrastructure`, `application` |
| `Purpose` | Human-readable purpose | `Taskify POC` |

Optional tags (recommended but not enforced):

| Tag | Description | Example Value |
|-----|-------------|---------------|
| `CostCenter` | Cost allocation code | (customer-specific) |
| `Owner` | Responsible team or individual | (customer-specific) |

### Naming Convention

All resources follow the pattern: `{prefix}-{uid}-{purpose}-{environment}`

| Segment | Description | Example |
|---------|-------------|---------|
| `{prefix}` | Azure resource type abbreviation | `rg`, `kv`, `psql`, `ca`, `cae`, `log`, `id`, `cr` |
| `{uid}` | Unique identifier assigned at deployment time | (4-6 alphanumeric characters) |
| `{purpose}` | Functional name | `taskify`, `taskify-api`, `taskify-web` |
| `{environment}` | Environment suffix | `dev` |

**Exception**: Azure Container Registry does not support hyphens. Its pattern is `cr{uid}taskifydev`.

---

## 2. AZURE_CONFIG.json Structure

The `concept/AZURE_CONFIG.json` file is the central configuration maintained by the deployment script (`deploy.sh`) and the `cloud-architect`. All agents and deployment scripts reference this file for resource details.

### Schema Overview

```json
{
  "project": {
    "name": "Taskify",
    "customer": "CDM",
    "environment": "dev",
    "createdDate": "2026-02-12",
    "lastModified": "2026-02-12"
  },
  "subscription": {
    "id": "<populated-at-deploy-time>",
    "name": "<populated-at-deploy-time>",
    "tenantId": "<populated-at-deploy-time>",
    "resourceProviders": [
      "Microsoft.DBforPostgreSQL",
      "Microsoft.App",
      "Microsoft.ContainerRegistry",
      "Microsoft.KeyVault",
      "Microsoft.ManagedIdentity",
      "Microsoft.OperationalInsights",
      "Microsoft.Resources"
    ]
  },
  "tags": {
    "required": ["Environment", "Stage", "Purpose"],
    "optional": ["CostCenter", "Owner"]
  },
  "stages": {
    "stage1": { "...": "Foundation resources" },
    "stage2": { "...": "Data resources" },
    "stage3": { "...": "Container infrastructure" },
    "stage4": { "...": "Application deployment" }
  }
}
```

### Stage Structure

Each stage contains resource groups, managed identities, and resources. The deployment script updates resource `id` and other output values after each stage completes.

```json
{
  "stages": {
    "stageN": {
      "name": "Stage Name",
      "description": "Stage description",
      "resourceGroups": {
        "group1": {
          "name": "rg-{uid}-taskify-dev",
          "location": "westus3",
          "tags": { "Environment": "dev", "Stage": "foundation", "Purpose": "Taskify POC" }
        }
      },
      "managedIdentities": {
        "identityName": {
          "name": "id-{uid}-taskify-api",
          "resourceGroup": "rg-{uid}-taskify-dev",
          "purpose": "Description of identity purpose"
        }
      },
      "resources": {
        "resourceType": {
          "name": "resource-name",
          "id": "<populated-after-deployment>",
          "resourceGroup": "rg-{uid}-taskify-dev",
          "sku": "...",
          "configuration": { "...": "..." }
        }
      }
    }
  }
}
```

### Querying Configuration

Use `jq` to query values from `concept/AZURE_CONFIG.json`:

```bash
# Get the unique resource group name
jq -r '.stages.stage1.resourceGroups.group1.name' concept/AZURE_CONFIG.json

# Get Key Vault name
jq -r '.stages.stage1.resources.keyVault.name' concept/AZURE_CONFIG.json

# Get managed identity name
jq -r '.stages.stage1.managedIdentities.apiIdentity.name' concept/AZURE_CONFIG.json

# Get PostgreSQL server name
jq -r '.stages.stage2.resources.postgresql.name' concept/AZURE_CONFIG.json

# Get Container Registry name
jq -r '.stages.stage3.resources.containerRegistry.name' concept/AZURE_CONFIG.json

# Get backend Container App name
jq -r '.stages.stage4.resources.containerAppApi.name' concept/AZURE_CONFIG.json

# Get all environment variables for the API container
jq -r '.stages.stage4.resources.containerAppApi.configuration.envVars' concept/AZURE_CONFIG.json
```

### How deploy.sh Uses AZURE_CONFIG.json

The deployment script reads resource names and configuration from `AZURE_CONFIG.json` to construct deployment parameters. After each stage completes, the script writes back Azure resource IDs and computed values (such as FQDNs and endpoints) into the file. This ensures subsequent stages can reference outputs from earlier stages.

```
deploy.sh reads AZURE_CONFIG.json
    |
    v
Constructs Bicep parameters from config values
    |
    v
Executes az deployment group create
    |
    v
Captures deployment outputs (resource IDs, FQDNs, etc.)
    |
    v
Writes outputs back to AZURE_CONFIG.json
    |
    v
Next stage reads updated AZURE_CONFIG.json
```

---

## 3. Environment Variables

### Backend Container App (ca-{uid}-taskify-api)

#### Required Environment Variables

| Variable | Description | Example Value | Source |
|----------|-------------|---------------|--------|
| `NODE_ENV` | Node.js runtime environment | `production` | Set in Bicep template |
| `PORT` | HTTP port the Express server listens on | `3000` | Set in Bicep template |
| `AZURE_KEY_VAULT_URL` | Key Vault URI for secret retrieval | `https://kv-{uid}-taskify-dev.vault.azure.net` | Set in Bicep template (from Stage 1 output) |
| `PGDATABASE` | PostgreSQL database name | `taskify` | Set in Bicep template |
| `PGPORT` | PostgreSQL server port | `5432` | Set in Bicep template |
| `PGSSLMODE` | PostgreSQL SSL connection mode | `require` | Set in Bicep template |

#### Runtime-Resolved Configuration (from Key Vault)

These values are NOT set as environment variables. The application retrieves them from Key Vault at startup using the User-Assigned Managed Identity.

| Key Vault Secret Name | Description | Used As |
|-----------------------|-------------|---------|
| `postgresql-connection-host` | PostgreSQL server FQDN (e.g., `psql-{uid}-taskify-dev.postgres.database.azure.com`) | `PGHOST` in pg connection pool |
| `postgresql-admin-username` | PostgreSQL admin username (e.g., `taskifyadmin`) | `PGUSER` in pg connection pool |
| `postgresql-admin-password` | PostgreSQL admin password (randomly generated at deploy time) | `PGPASSWORD` in pg connection pool |

#### Not Used (Intentionally Absent)

| Variable | Reason for Absence |
|----------|-------------------|
| `PGHOST` | Retrieved from Key Vault at runtime, not stored as env var |
| `PGUSER` | Retrieved from Key Vault at runtime, not stored as env var |
| `PGPASSWORD` | Retrieved from Key Vault at runtime, not stored as env var |
| `AZURE_CLIENT_ID` | Provided implicitly by the User-Assigned Managed Identity assignment on the Container App |
| `CONNECTION_STRING` | Prohibited by Microsoft internal policy; use Key Vault pattern instead |

### Frontend Container App (ca-{uid}-taskify-web)

#### Build-Time Environment Variables

| Variable | Description | Example Value | Source |
|----------|-------------|---------------|--------|
| `VITE_API_URL` | Backend API base URL (baked into the static build) | `https://ca-{uid}-taskify-api.<region>.azurecontainerapps.io` | Set at Docker build time or via Nginx env substitution |

**Important**: Because the frontend is a static SPA served by Nginx, `VITE_API_URL` must be available at build time. Vite inlines environment variables prefixed with `VITE_` during the build step. In production, the Nginx container may use `envsubst` at startup to inject the API URL into a runtime configuration file.

#### Nginx Configuration Variables

The Nginx container does not use environment variables directly in most configurations. The `nginx.conf` is baked into the Docker image and configured for:

- Serving static files from `/usr/share/nginx/html`
- SPA fallback routing (all paths serve `index.html`)
- Listening on port 80

---

## 4. Azure Service Configurations

### 4.1 Log Analytics Workspace

**Resource Details:**
```bash
jq -r '.stages.stage1.resources.logAnalytics' concept/AZURE_CONFIG.json
```

- Resource Name Pattern: `log-{uid}-taskify-dev`
- SKU: `PerGB2018`
- Location: `westus3`

**Configuration:**

| Setting | Value | Description |
|---------|-------|-------------|
| SKU | `PerGB2018` | Pay-as-you-go pricing tier |
| Retention | `30` days | Duration logs are retained before automatic deletion |
| Daily Quota | `-1` (unlimited) | No daily ingestion cap for POC |

**Purpose**: Receives diagnostic logs and metrics from the Container Apps Environment. All container stdout/stderr output flows here automatically.

---

### 4.2 User-Assigned Managed Identity

**Resource Details:**
```bash
jq -r '.stages.stage1.managedIdentities.apiIdentity' concept/AZURE_CONFIG.json
```

- Resource Name Pattern: `id-{uid}-taskify-api`
- Location: `westus3`

**Configuration:**

| Setting | Value | Description |
|---------|-------|-------------|
| Type | User-Assigned | Explicitly created and managed; preferred over system-assigned per Microsoft internal policy |
| Assigned To | Backend Container App (`ca-{uid}-taskify-api`) | Enables the API to authenticate to Azure services |

**RBAC Role Assignments:**

| Target Resource | Role | Purpose |
|-----------------|------|---------|
| Key Vault (`kv-{uid}-taskify-dev`) | `Key Vault Secrets User` | Read secrets (PostgreSQL host, username, password) |
| Container Registry (`cr{uid}taskifydev`) | `AcrPull` | Pull container images for both frontend and backend |

**Identity Flow:**

```
Container App starts
    |
    v
Azure injects Managed Identity credentials (IDENTITY_ENDPOINT, IDENTITY_HEADER)
    |
    v
Application uses @azure/identity SDK (ManagedIdentityCredential)
    |
    v
SDK requests token from Azure AD for target resource (Key Vault, ACR)
    |
    v
Token returned; used for authenticated API calls
```

**SDK Usage in Backend API:**

```javascript
const { ManagedIdentityCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

// Create credential using the user-assigned managed identity
const credential = new ManagedIdentityCredential(clientId);

// Use credential to access Key Vault
const secretClient = new SecretClient(keyVaultUrl, credential);
```

The `clientId` of the managed identity is passed to `ManagedIdentityCredential` to disambiguate when multiple identities are assigned. For this POC, only one identity is assigned, but explicit specification is best practice.

---

### 4.3 Azure Key Vault

**Resource Details:**
```bash
jq -r '.stages.stage1.resources.keyVault' concept/AZURE_CONFIG.json
```

- Resource Name Pattern: `kv-{uid}-taskify-dev`
- SKU: `standard`
- Location: `westus3`

**Configuration:**

| Setting | Value | Description |
|---------|-------|-------------|
| SKU | `standard` | Standard tier; sufficient for POC secret storage |
| RBAC Authorization | `true` | Uses Azure RBAC for access control (not access policies) |
| Soft Delete | `true` | Deleted secrets are recoverable |
| Soft Delete Retention | `7` days | Minimum retention for soft-deleted items |
| Public Network Access | `Enabled` | Required for POC; production would use private endpoints |
| Purge Protection | `false` | Disabled for POC to allow cleanup; production would enable |

**Secrets:**

| Secret Name | Description | Set By | Read By |
|-------------|-------------|--------|---------|
| `postgresql-admin-password` | PostgreSQL admin password (randomly generated 32-char string) | `deploy.sh` during Stage 2 | Backend API at startup |
| `postgresql-connection-host` | PostgreSQL server FQDN | `deploy.sh` during Stage 2 | Backend API at startup |
| `postgresql-admin-username` | PostgreSQL admin username (`taskifyadmin`) | `deploy.sh` during Stage 2 | Backend API at startup |

**RBAC Configuration:**

| Principal | Principal Type | Role | Scope |
|-----------|---------------|------|-------|
| `id-{uid}-taskify-api` (Managed Identity) | ServicePrincipal | `Key Vault Secrets User` | Key Vault resource |
| Deploying user (human) | User | `Key Vault Administrator` | Key Vault resource (temporary, for secret population during deployment) |

**Access Pattern (No Connection Strings):**

```
API Container App
    |-- uses ManagedIdentityCredential (@azure/identity)
    |-- authenticates to Azure AD
    |-- receives access token scoped to Key Vault
    |-- calls SecretClient.getSecret("postgresql-admin-password")
    |-- calls SecretClient.getSecret("postgresql-connection-host")
    |-- calls SecretClient.getSecret("postgresql-admin-username")
    |-- constructs pg Pool configuration from retrieved values
```

---

### 4.4 Azure Database for PostgreSQL Flexible Server

**Resource Details:**
```bash
jq -r '.stages.stage2.resources.postgresql' concept/AZURE_CONFIG.json
```

- Resource Name Pattern: `psql-{uid}-taskify-dev`
- SKU: `Standard_B1ms` (Burstable tier)
- Location: `westus3`

**Server Configuration:**

| Setting | Value | Description |
|---------|-------|-------------|
| SKU Name | `Standard_B1ms` | 1 vCore, 2 GiB RAM; cost-effective for POC |
| SKU Tier | `Burstable` | Variable performance; suitable for intermittent workloads |
| PostgreSQL Version | `16` | Latest LTS version |
| Storage Size | `32` GiB | Minimum storage allocation |
| Backup Retention | `7` days | Point-in-time restore window |
| Geo-Redundant Backup | `Disabled` | Not required for POC |
| High Availability | `Disabled` | Not required for POC |
| Public Network Access | `Enabled` | Required for POC; production would use private endpoints |
| SSL Enforcement | `Enabled` | All connections must use SSL/TLS |
| Admin Username | `taskifyadmin` | Stored in Key Vault as `postgresql-admin-username` |
| Admin Password | (randomly generated) | Stored in Key Vault as `postgresql-admin-password` |

**Database Configuration:**

| Setting | Value | Description |
|---------|-------|-------------|
| Database Name | `taskify` | Application database |
| Encoding | `UTF8` | Default PostgreSQL encoding |
| Extensions | `pgcrypto` (for `gen_random_uuid()`) | UUID generation |

**Firewall Rules:**

| Rule Name | Start IP | End IP | Description |
|-----------|----------|--------|-------------|
| `AllowAllAzureServicesAndResourcesWithinAzureIps` | `0.0.0.0` | `0.0.0.0` | Allows connections from Azure services (including Container Apps) |

**Connection Parameters (assembled at runtime from Key Vault secrets):**

| Parameter | Value Source | Description |
|-----------|-------------|-------------|
| `PGHOST` | Key Vault secret `postgresql-connection-host` | Server FQDN |
| `PGUSER` | Key Vault secret `postgresql-admin-username` | Admin username |
| `PGPASSWORD` | Key Vault secret `postgresql-admin-password` | Admin password |
| `PGDATABASE` | Container App env var `PGDATABASE` | Database name (`taskify`) |
| `PGPORT` | Container App env var `PGPORT` | Port (`5432`) |
| `PGSSLMODE` | Container App env var `PGSSLMODE` | SSL mode (`require`) |

**PostgreSQL Server Parameters (non-default):**

No custom server parameters are configured for this POC. All server parameters use PostgreSQL 16 defaults.

**Production Recommendations (documented, not implemented):**
- Upgrade to General Purpose tier (D2s_v3 or higher)
- Enable geo-redundant backup
- Enable high availability with zone redundancy
- Use private endpoint instead of public access
- Enable PgBouncer for connection pooling
- Configure custom server parameters (e.g., `max_connections`, `work_mem`)

---

### 4.5 Azure Container Registry

**Resource Details:**
```bash
jq -r '.stages.stage3.resources.containerRegistry' concept/AZURE_CONFIG.json
```

- Resource Name Pattern: `cr{uid}taskifydev` (no hyphens; Azure Container Registry naming restriction)
- SKU: `Basic`
- Location: `westus3`

**Configuration:**

| Setting | Value | Description |
|---------|-------|-------------|
| SKU | `Basic` | Sufficient for POC; 10 GiB storage |
| Admin User | `Disabled` | Admin credentials are not used; Managed Identity provides access |
| Public Network Access | `Enabled` | Required for image push from local development and pull from Container Apps |
| Anonymous Pull | `Disabled` | All pulls require authentication |

**RBAC Configuration:**

| Principal | Role | Purpose |
|-----------|------|---------|
| `id-{uid}-taskify-api` (Managed Identity) | `AcrPull` | Pull images for both Container Apps |
| Deploying user (human) | `AcrPush` | Push images during deployment (temporary) |

**Container Images:**

| Image Name | Tag | Source | Deployed To |
|------------|-----|--------|-------------|
| `taskify-api` | `latest` | `concept/apps/api/Dockerfile` | Backend Container App |
| `taskify-web` | `latest` | `concept/apps/web/Dockerfile` | Frontend Container App |

**Image Push Commands (executed by human during deployment):**

```bash
REGISTRY=$(jq -r '.stages.stage3.resources.containerRegistry.name' concept/AZURE_CONFIG.json)

# Login to ACR
az acr login --name $REGISTRY

# Build and push backend
docker build -t $REGISTRY.azurecr.io/taskify-api:latest ./concept/apps/api/
docker push $REGISTRY.azurecr.io/taskify-api:latest

# Build and push frontend
docker build -t $REGISTRY.azurecr.io/taskify-web:latest ./concept/apps/web/
docker push $REGISTRY.azurecr.io/taskify-web:latest
```

---

### 4.6 Container Apps Environment

**Resource Details:**
```bash
jq -r '.stages.stage3.resources.containerAppsEnvironment' concept/AZURE_CONFIG.json
```

- Resource Name Pattern: `cae-{uid}-taskify-dev`
- Plan: Consumption (serverless)
- Location: `westus3`

**Configuration:**

| Setting | Value | Description |
|---------|-------|-------------|
| Plan | Consumption | Serverless; pay per request/execution |
| Zone Redundancy | `false` | Not required for POC |
| Internal Only | `false` | Container Apps are externally accessible |
| Log Analytics Workspace | `log-{uid}-taskify-dev` | All container logs and metrics are sent here |
| VNet Integration | None | No VNet for POC; production would use VNet integration |

**Log Analytics Integration:**

The Container Apps Environment requires the Log Analytics workspace ID and shared key for diagnostics integration. These are read from the Stage 1 deployment outputs and passed as parameters to the Stage 3 Bicep template.

```bash
LOG_ANALYTICS_ID=$(jq -r '.stages.stage1.resources.logAnalytics.id' concept/AZURE_CONFIG.json)
```

---

### 4.7 Backend Container App (API)

**Resource Details:**
```bash
jq -r '.stages.stage4.resources.containerAppApi' concept/AZURE_CONFIG.json
```

- Resource Name Pattern: `ca-{uid}-taskify-api`
- Location: `westus3`

**Container Configuration:**

| Setting | Value | Description |
|---------|-------|-------------|
| Image | `cr{uid}taskifydev.azurecr.io/taskify-api:latest` | Docker image from ACR |
| Target Port | `3000` | Port the Express.js server listens on |
| Transport | `auto` | HTTP/1.1 or HTTP/2, auto-negotiated |
| CPU | `0.25` vCPU | Minimum allocation for POC |
| Memory | `0.5Gi` | Minimum allocation for POC |

**Ingress Configuration:**

| Setting | Value | Description |
|---------|-------|-------------|
| External Ingress | `true` | Accessible from the public internet via HTTPS |
| Target Port | `3000` | Maps to the Express.js server port |
| Allow Insecure | `false` | HTTPS only (default Container Apps behavior) |
| CORS | Configured in application code | Set in Express middleware to allow frontend origin |

**Scaling Configuration:**

| Parameter | Value | Description |
|-----------|-------|-------------|
| Min Replicas | `0` | Scale to zero when idle (cost savings for POC) |
| Max Replicas | `1` | Single replica sufficient for POC |
| Scale Rule | HTTP | Scale based on incoming HTTP requests |
| Concurrent Requests | Default (10) | Number of concurrent requests to trigger scale-up |

**Identity Assignment:**

| Setting | Value |
|---------|-------|
| Identity Type | User-Assigned |
| Identity Resource | `id-{uid}-taskify-api` |
| Identity Resource ID | Populated from Stage 1 deployment output |

**Environment Variables:**

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Enables production optimizations in Express.js |
| `PORT` | `3000` | HTTP listen port |
| `AZURE_KEY_VAULT_URL` | `https://kv-{uid}-taskify-dev.vault.azure.net` | Key Vault URI for secret retrieval |
| `PGDATABASE` | `taskify` | PostgreSQL database name |
| `PGPORT` | `5432` | PostgreSQL port |
| `PGSSLMODE` | `require` | Enforce SSL for PostgreSQL connections |

---

### 4.8 Frontend Container App (Web)

**Resource Details:**
```bash
jq -r '.stages.stage4.resources.containerAppWeb' concept/AZURE_CONFIG.json
```

- Resource Name Pattern: `ca-{uid}-taskify-web`
- Location: `westus3`

**Container Configuration:**

| Setting | Value | Description |
|---------|-------|-------------|
| Image | `cr{uid}taskifydev.azurecr.io/taskify-web:latest` | Docker image from ACR |
| Target Port | `80` | Port Nginx listens on |
| Transport | `auto` | HTTP/1.1 or HTTP/2, auto-negotiated |
| CPU | `0.25` vCPU | Minimum allocation for POC |
| Memory | `0.5Gi` | Minimum allocation for POC |

**Ingress Configuration:**

| Setting | Value | Description |
|---------|-------|-------------|
| External Ingress | `true` | Accessible from the public internet via HTTPS |
| Target Port | `80` | Maps to the Nginx server port |
| Allow Insecure | `false` | HTTPS only |

**Scaling Configuration:**

| Parameter | Value | Description |
|-----------|-------|-------------|
| Min Replicas | `0` | Scale to zero when idle |
| Max Replicas | `1` | Single replica sufficient for POC |
| Scale Rule | HTTP | Scale based on incoming HTTP requests |

**Identity Assignment:**

None. The frontend Container App does not require Azure identity. It serves only static files and does not communicate with Azure services directly. The browser makes API calls directly to the backend Container App.

**Environment Variables:**

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://ca-{uid}-taskify-api.<region>.azurecontainerapps.io` | Backend API base URL; baked into the React build at Docker build time |

**Note on VITE_API_URL**: This value is only available after the backend Container App has been deployed and its FQDN is known. The deployment sequence must deploy the backend first, capture its FQDN, then build and deploy the frontend with that URL.

---

## 5. Application Configurations

### 5.1 Backend API (Node.js + Express)

**Location:** `concept/apps/api/`

**Runtime:** Node.js 20 LTS, Express 4.x

**NPM Dependencies:**

| Package | Purpose |
|---------|---------|
| `express` | HTTP server framework |
| `pg` | PostgreSQL client library |
| `cors` | CORS middleware |
| `@azure/identity` | Azure Managed Identity authentication |
| `@azure/keyvault-secrets` | Azure Key Vault secret retrieval |

**Application Startup Sequence:**

```
1. Load environment variables (NODE_ENV, PORT, AZURE_KEY_VAULT_URL, PGDATABASE, PGPORT, PGSSLMODE)
2. Create ManagedIdentityCredential using @azure/identity
3. Create SecretClient for Key Vault using the credential
4. Retrieve PostgreSQL secrets from Key Vault:
   - postgresql-connection-host -> PGHOST
   - postgresql-admin-username -> PGUSER
   - postgresql-admin-password -> PGPASSWORD
5. Create pg Pool with retrieved credentials + env var config
6. Register Express routes and middleware
7. Start HTTP server on PORT
```

**CORS Configuration:**

```javascript
// Allow requests from the frontend Container App origin
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',  // In production, set to specific frontend URL
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-User-Id']
};
```

**PostgreSQL Connection Pool Configuration:**

```javascript
const pool = new Pool({
  host: kvHost,           // From Key Vault: postgresql-connection-host
  user: kvUsername,        // From Key Vault: postgresql-admin-username
  password: kvPassword,    // From Key Vault: postgresql-admin-password
  database: process.env.PGDATABASE,   // From env var: 'taskify'
  port: parseInt(process.env.PGPORT), // From env var: 5432
  ssl: { rejectUnauthorized: false }  // Required for Azure PostgreSQL SSL
});
```

**Health Check Endpoint:**

```
GET /api/health
Response: { "status": "ok", "database": "connected" | "disconnected" }
```

---

### 5.2 Frontend Application (React + TypeScript + Vite)

**Location:** `concept/apps/web/`

**Runtime:** React 18+, TypeScript, Vite 5+, served by Nginx (Alpine)

**NPM Dependencies:**

| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | UI framework |
| `@hello-pangea/dnd` | Drag-and-drop for Kanban board |
| `tailwindcss` | Utility-first CSS framework |
| `vite` | Build tooling and dev server |

**Build Configuration (vite.config.ts):**

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,         // Local development port
    proxy: {
      '/api': 'http://localhost:3000'  // Proxy API calls in development
    }
  }
});
```

**API Client Configuration:**

```typescript
// The API URL is injected at build time via VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// All API calls include the active user's ID for ownership checks
const headers = {
  'Content-Type': 'application/json',
  'X-User-Id': activeUserId
};
```

**Nginx Configuration (nginx.conf):**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback: serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Dockerfile Strategy:**

```dockerfile
# Stage 1: Build the React application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Important**: `VITE_API_URL` is passed as a Docker build argument (`--build-arg VITE_API_URL=...`) and is baked into the static JavaScript bundle at build time. It cannot be changed at runtime without rebuilding the image.

---

## 6. Security Configuration

### 6.1 Key Vault Access Pattern

**Access Model**: Azure RBAC (not access policies)

All access to Key Vault is controlled via Azure RBAC role assignments. The Key Vault is configured with `enableRbacAuthorization: true`, which disables the legacy access policy model.

**Role Assignment Summary:**

| Principal | Type | Role | Scope | Purpose |
|-----------|------|------|-------|---------|
| `id-{uid}-taskify-api` | Managed Identity | `Key Vault Secrets User` | Key Vault resource | Read PostgreSQL credentials at application startup |
| Deploying user | User | `Key Vault Administrator` | Key Vault resource | Populate secrets during deployment (temporary) |

### 6.2 Managed Identity Strategy

**Single Identity Design**: One user-assigned managed identity (`id-{uid}-taskify-api`) serves all service-to-service authentication needs for the backend API. This is sufficient for the POC scope.

| Authentication Target | Method | Role |
|----------------------|--------|------|
| Key Vault | `@azure/identity` ManagedIdentityCredential | Key Vault Secrets User |
| Container Registry | Implicit (Container Apps runtime handles ACR pull) | AcrPull |

**What the Identity Does NOT Access:**
- PostgreSQL directly (uses username/password from Key Vault instead)
- Frontend Container App (no identity needed)
- Log Analytics (diagnostics flow through Container Apps Environment, not the app)

### 6.3 Secret Management

**Secret Lifecycle:**

```
1. deploy.sh generates a random 32-character password
2. deploy.sh creates the PostgreSQL server with this password
3. deploy.sh stores the password, host FQDN, and username in Key Vault
4. Backend Container App reads secrets from Key Vault at startup
5. Backend uses retrieved values to connect to PostgreSQL
```

**No Secrets in:**
- Environment variables (only the Key Vault URL is in env vars; actual secrets are not)
- Application source code
- Bicep templates (password is generated and stored in deploy.sh, not hardcoded)
- AZURE_CONFIG.json (secret values are never written here)
- Git repository

### 6.4 RBAC Summary

Complete list of RBAC role assignments required for the Taskify deployment:

| # | Principal | Resource | Role | Assigned In |
|---|-----------|----------|------|-------------|
| 1 | `id-{uid}-taskify-api` | `kv-{uid}-taskify-dev` | Key Vault Secrets User | Stage 1 (Bicep) |
| 2 | `id-{uid}-taskify-api` | `cr{uid}taskifydev` | AcrPull | Stage 3 (Bicep) |
| 3 | Deploying user | `kv-{uid}-taskify-dev` | Key Vault Administrator | Stage 1 (deploy.sh / manual) |
| 4 | Deploying user | `cr{uid}taskifydev` | AcrPush | Stage 3 (deploy.sh / manual) |
| 5 | Deploying user | `rg-{uid}-taskify-dev` | Contributor | Pre-requisite (subscription-level) |

### 6.5 Transport Security

| Connection | Protocol | Enforcement |
|------------|----------|-------------|
| Browser to Frontend Container App | HTTPS (TLS 1.2+) | Enforced by Container Apps ingress |
| Browser to Backend Container App | HTTPS (TLS 1.2+) | Enforced by Container Apps ingress |
| Backend to PostgreSQL | SSL (TLS 1.2+) | Enforced by `PGSSLMODE=require` and PostgreSQL server config |
| Backend to Key Vault | HTTPS (TLS 1.2+) | Enforced by Azure SDK |
| Container Apps to ACR | HTTPS (TLS 1.2+) | Enforced by Azure platform |

---

## 7. Networking Configuration

### POC Network Architecture

Taskify uses a simplified network architecture appropriate for a proof-of-concept. There is no VNet, no private endpoints, and no NSGs. All services communicate over public endpoints with Azure-managed TLS encryption.

**Network Topology:**

```
Internet
    |
    +-- HTTPS --> Frontend Container App (port 80 internal, 443 external)
    |
    +-- HTTPS --> Backend Container App (port 3000 internal, 443 external)
                      |
                      +-- SSL (port 5432) --> PostgreSQL Flexible Server
                      |
                      +-- HTTPS --> Key Vault (vault.azure.net)
                      |
                      +-- HTTPS --> ACR (azurecr.io) [image pull at startup]
```

### Service Access Configuration

| Service | Public Access | Restriction |
|---------|-------------|-------------|
| Frontend Container App | Public (external ingress) | None (anonymous access, no auth) |
| Backend Container App | Public (external ingress) | CORS limits origins; X-User-Id header for user context |
| PostgreSQL Flexible Server | Public | Azure Services firewall rule only (`0.0.0.0` - `0.0.0.0`) |
| Key Vault | Public | RBAC restricts access to authorized identities only |
| Container Registry | Public | RBAC restricts push/pull to authorized identities only |

### Firewall Rules

| Resource | Rule | Source | Effect |
|----------|------|--------|--------|
| PostgreSQL | `AllowAllAzureServicesAndResourcesWithinAzureIps` | `0.0.0.0/0` (Azure IPs) | Allows Container Apps to connect |

### Production Networking Recommendations (Documented, Not Implemented)

For production readiness, the following changes would be required:

| Component | POC Configuration | Production Recommendation |
|-----------|------------------|---------------------------|
| VNet | None | Create VNet with dedicated subnets for Container Apps, PostgreSQL, and private endpoints |
| Container Apps | Public ingress | VNet-integrated Container Apps Environment with internal ingress behind Application Gateway or Azure Front Door |
| PostgreSQL | Public with Azure Services firewall | Private endpoint in VNet; disable public access |
| Key Vault | Public | Private endpoint in VNet; disable public access |
| Container Registry | Public | Private endpoint in VNet; disable public access |
| DNS | Default Azure DNS | Private DNS zones for private endpoint resolution |
| NSGs | None | Network Security Groups on all subnets with least-privilege rules |

---

## 8. Monitoring Configuration

### Log Analytics Workspace

**Resource:**
```bash
jq -r '.stages.stage1.resources.logAnalytics' concept/AZURE_CONFIG.json
```

| Setting | Value |
|---------|-------|
| Name | `log-{uid}-taskify-dev` |
| SKU | `PerGB2018` |
| Retention | `30` days |
| Daily Quota | Unlimited |

### Container Apps Diagnostics

The Container Apps Environment automatically sends the following to Log Analytics:

| Log Category | Description | Table in Log Analytics |
|--------------|-------------|----------------------|
| Container App Console Logs | stdout/stderr from containers | `ContainerAppConsoleLogs_CL` |
| Container App System Logs | Platform events (scaling, restarts, errors) | `ContainerAppSystemLogs_CL` |

### Useful KQL Queries

```kql
// View recent API container logs
ContainerAppConsoleLogs_CL
| where ContainerAppName_s == "ca-{uid}-taskify-api"
| order by TimeGenerated desc
| take 100

// View container startup events
ContainerAppSystemLogs_CL
| where ContainerAppName_s has "taskify"
| where Reason_s in ("Started", "Pulled", "Created", "Killing")
| order by TimeGenerated desc

// Check for errors in the API
ContainerAppConsoleLogs_CL
| where ContainerAppName_s == "ca-{uid}-taskify-api"
| where Log_s has "error" or Log_s has "Error"
| order by TimeGenerated desc

// Monitor scaling events
ContainerAppSystemLogs_CL
| where Reason_s == "ScalingReplica"
| order by TimeGenerated desc
```

### Application-Level Logging

The backend API logs to stdout/stderr, which Container Apps captures and forwards to Log Analytics automatically. No additional logging configuration is required for the POC.

| Log Source | Destination | Method |
|------------|-------------|--------|
| Express.js console.log/console.error | Container stdout/stderr | Automatic |
| Container stdout/stderr | Log Analytics | Container Apps Environment integration |

### Alerts (Not Configured for POC)

No alerts are configured for this POC. For production, the following alerts would be recommended:

| Alert | Condition | Action |
|-------|-----------|--------|
| API Container Restart | Container restart count > 3 in 5 minutes | Email notification |
| Database Connection Failure | Error logs containing "ECONNREFUSED" or "connection timeout" | Email notification |
| High Response Time | P95 latency > 5 seconds | Email notification |
| Scale-to-Zero Recovery | Time from 0 to 1 replica > 30 seconds | Monitor only |

---

## 9. Configuration by Environment

### Development (dev) - Current POC

```bash
# Deployment command
./concept/infrastructure/deploy.sh -u <uid> -e dev -l westus3

# Core Settings
ENVIRONMENT=dev
LOCATION=westus3

# Compute Scaling (minimal for cost savings)
CONTAINER_APP_MIN_REPLICAS=0
CONTAINER_APP_MAX_REPLICAS=1
CONTAINER_APP_CPU=0.25
CONTAINER_APP_MEMORY=0.5Gi

# Database
POSTGRESQL_SKU=Standard_B1ms
POSTGRESQL_TIER=Burstable
POSTGRESQL_STORAGE_GB=32
POSTGRESQL_BACKUP_RETENTION_DAYS=7
POSTGRESQL_HA=Disabled
POSTGRESQL_GEO_BACKUP=Disabled

# Security
KEY_VAULT_SKU=standard
KEY_VAULT_SOFT_DELETE_DAYS=7
KEY_VAULT_PUBLIC_ACCESS=Enabled

# Monitoring
LOG_ANALYTICS_RETENTION_DAYS=30

# Registry
CONTAINER_REGISTRY_SKU=Basic
```

### Staging (stg) - Not Implemented for POC

```bash
# Deployment command
./concept/infrastructure/deploy.sh -u <uid> -e stg -l westus3

# Changes from dev:
CONTAINER_APP_MIN_REPLICAS=1    # Avoid cold starts during testing
CONTAINER_APP_MAX_REPLICAS=3    # Allow limited scaling
POSTGRESQL_BACKUP_RETENTION_DAYS=14
LOG_ANALYTICS_RETENTION_DAYS=60
```

### Production (prd) - Not Implemented for POC

```bash
# Deployment command
./concept/infrastructure/deploy.sh -u <uid> -e prd -l westus3

# Changes from dev:
CONTAINER_APP_MIN_REPLICAS=2       # Always-on for availability
CONTAINER_APP_MAX_REPLICAS=10      # Handle production load
CONTAINER_APP_CPU=0.5              # More compute resources
CONTAINER_APP_MEMORY=1.0Gi         # More memory

POSTGRESQL_SKU=Standard_D2s_v3     # General Purpose tier
POSTGRESQL_TIER=GeneralPurpose
POSTGRESQL_STORAGE_GB=128
POSTGRESQL_BACKUP_RETENTION_DAYS=35
POSTGRESQL_HA=ZoneRedundant
POSTGRESQL_GEO_BACKUP=Enabled

KEY_VAULT_SOFT_DELETE_DAYS=90
KEY_VAULT_PUBLIC_ACCESS=Disabled   # Private endpoint only
KEY_VAULT_PURGE_PROTECTION=true

LOG_ANALYTICS_RETENTION_DAYS=90

CONTAINER_REGISTRY_SKU=Standard    # More storage, webhooks
```

### Environment Comparison

| Configuration | Dev (POC) | Staging | Production |
|---------------|-----------|---------|------------|
| Container App Min Replicas | 0 | 1 | 2 |
| Container App Max Replicas | 1 | 3 | 10 |
| Container App CPU | 0.25 vCPU | 0.25 vCPU | 0.5 vCPU |
| Container App Memory | 0.5 GiB | 0.5 GiB | 1.0 GiB |
| PostgreSQL SKU | B1ms (Burstable) | B1ms (Burstable) | D2s_v3 (General Purpose) |
| PostgreSQL Storage | 32 GiB | 32 GiB | 128 GiB |
| PostgreSQL HA | Disabled | Disabled | Zone Redundant |
| PostgreSQL Geo-Backup | Disabled | Disabled | Enabled |
| Key Vault Public Access | Enabled | Enabled | Disabled (Private Endpoint) |
| Key Vault Purge Protection | Disabled | Disabled | Enabled |
| Log Retention | 30 days | 60 days | 90 days |
| Container Registry SKU | Basic | Basic | Standard |
| VNet Integration | None | None | Full (Private Endpoints) |
| Alerts | None | Basic | Comprehensive |

---

## 10. Local Development Setup

### Overview

Taskify includes a Docker Compose configuration for fully local development without any Azure dependencies. The local environment replaces Azure services with local containers:

| Azure Service | Local Replacement |
|---------------|-------------------|
| Azure Database for PostgreSQL Flexible Server | PostgreSQL 16 Docker container |
| Azure Key Vault (secret retrieval) | Direct environment variables in `docker-compose.yml` |
| Azure Container Apps (API) | Node.js container with nodemon hot reload |
| Azure Container Apps (Web) | Vite dev server container with HMR |
| Azure Container Registry | Not needed (local images built by Docker Compose) |
| User-Assigned Managed Identity | Not needed (no Azure auth required locally) |
| Log Analytics | Console output (stdout/stderr) |

### Docker Compose Services

| Service | Container Name | Port | Description |
|---------|---------------|------|-------------|
| `db` | taskify-db | 5432 | PostgreSQL 16 with automatic schema and seed data |
| `api` | taskify-api | 3000 | Express.js API with nodemon hot reload |
| `web` | taskify-web | 5173 | Vite dev server with HMR |

### Running Locally

```bash
# Start all services (first run will build images and initialize database)
cd concept/
docker compose up

# Start with image rebuild (after Dockerfile changes)
docker compose up --build

# Start in background
docker compose up -d

# Stop all services (data is preserved in Docker volume)
docker compose down

# Stop and reset database (destroys all data, re-runs init scripts on next start)
docker compose down -v
```

### Environment Variable Differences: Local vs. Azure

#### Backend API

| Variable | Local (docker-compose.yml) | Azure (Container App) | Notes |
|----------|---------------------------|----------------------|-------|
| `NODE_ENV` | `development` | `production` | Affects Express.js behavior |
| `PORT` | `3000` | `3000` | Same in both environments |
| `PGHOST` | `db` (Docker service name) | Retrieved from Key Vault | Local uses Docker DNS |
| `PGUSER` | `postgres` | Retrieved from Key Vault | Local uses default superuser |
| `PGPASSWORD` | `postgres` | Retrieved from Key Vault | Local uses simple password |
| `PGDATABASE` | `taskify` | `taskify` | Same in both environments |
| `PGPORT` | `5432` | `5432` | Same in both environments |
| `PGSSLMODE` | `disable` | `require` | SSL not needed for local container |
| `AZURE_KEY_VAULT_URL` | `""` (empty) | `https://kv-{uid}-taskify-dev.vault.azure.net` | Empty string triggers local mode |
| `CORS_ORIGIN` | `http://localhost:5173` | Frontend Container App URL | Allows Vite dev server |

**Local mode detection**: When `AZURE_KEY_VAULT_URL` is empty, the backend API skips Key Vault credential retrieval and reads PostgreSQL credentials directly from the `PGHOST`, `PGUSER`, and `PGPASSWORD` environment variables.

#### Frontend

| Variable | Local (docker-compose.yml) | Azure (Container App) | Notes |
|----------|---------------------------|----------------------|-------|
| `VITE_API_URL` | `http://localhost:3000` | `https://ca-{uid}-taskify-api.<region>.azurecontainerapps.io` | Points to local API container |

### Database Initialization and Seeding

On first startup, the PostgreSQL container automatically executes all `.sql` files in the `concept/sql/` directory (mounted to `/docker-entrypoint-initdb.d/`). Files are executed in alphabetical order:

1. `001_create_tables.sql` -- Creates tables, constraints, and indexes
2. `005_seed_data.sql` -- Inserts 5 users, 3 projects, 12 tasks, and sample comments

**Database persistence**: Data is stored in the `pgdata` Docker volume. Stopping containers with `docker compose down` preserves data. To reset the database to its initial state, use `docker compose down -v` to destroy the volume, then `docker compose up` to re-create and re-seed.

**Re-seeding without volume reset**: Connect to the running database and execute scripts manually:

```bash
# Connect to the running PostgreSQL container
docker exec -it taskify-db psql -U postgres -d taskify

# Or execute a specific SQL file
docker exec -i taskify-db psql -U postgres -d taskify < sql/005_seed_data.sql
```

### Port Mappings and URLs

| Service | Local URL | Purpose |
|---------|-----------|---------|
| Frontend (Vite) | http://localhost:5173 | Main application entry point |
| Backend API | http://localhost:3000 | REST API (can be called directly for testing) |
| API Health Check | http://localhost:3000/api/health | Verify backend is running |
| PostgreSQL | localhost:5432 | Direct database access (for psql, pgAdmin, etc.) |

### Connecting to the Local Database

```bash
# Using psql (if installed on host)
psql -h localhost -U postgres -d taskify

# Using Docker exec
docker exec -it taskify-db psql -U postgres -d taskify

# Quick verification queries
docker exec -it taskify-db psql -U postgres -d taskify -c "SELECT name, role FROM users;"
docker exec -it taskify-db psql -U postgres -d taskify -c "SELECT name FROM projects;"
docker exec -it taskify-db psql -U postgres -d taskify -c "SELECT title, status FROM tasks;"
```

### Hot Reload Behavior

| Component | Mechanism | Watched Files | Restart Required? |
|-----------|-----------|--------------|-------------------|
| Backend API | nodemon | `src/**/*.js`, `src/**/*.json` | No -- nodemon restarts Express automatically |
| Frontend | Vite HMR | `src/**/*` | No -- browser updates instantly |
| Database schema | Manual | `sql/*.sql` | Yes -- `docker compose down -v && docker compose up` |

### Troubleshooting Local Development

| Issue | Cause | Resolution |
|-------|-------|------------|
| `port 5432 already in use` | Another PostgreSQL instance is running on the host | Stop the host PostgreSQL service or change the port mapping in `docker-compose.yml` |
| `port 3000 already in use` | Another process is using port 3000 | Stop the process or change the API port mapping |
| Database is empty after `docker compose up` | Init scripts only run on first volume creation | Run `docker compose down -v` then `docker compose up` |
| API cannot connect to database | API started before database was healthy | The `depends_on` with health check should prevent this; run `docker compose down && docker compose up` |
| Frontend shows connection errors | API container is not running or still starting | Wait for API to finish starting; check `docker compose logs api` |
| Changes not reflected in browser | Volume mount issue on Windows | Ensure Docker Desktop has file sharing enabled for the project directory |

---

## Configuration Validation

### Pre-Deployment Checklist

- [ ] `concept/AZURE_CONFIG.json` has correct project name and environment
- [ ] Subscription ID and tenant ID are populated (or will be by deploy.sh)
- [ ] All required resource providers are registered (see subscription.resourceProviders)
- [ ] Deploying user has `Contributor` role on the subscription or resource group
- [ ] Deploying user has `Key Vault Administrator` role (or it will be assigned by deploy.sh)
- [ ] `{uid}` value has been chosen and is globally unique
- [ ] Required tags (Environment, Stage, Purpose) are defined in AZURE_CONFIG.json
- [ ] Docker is installed and running locally (for image builds)
- [ ] Azure CLI is installed and authenticated (`az login`)
- [ ] `jq` is installed (for AZURE_CONFIG.json manipulation)

### Post-Deployment Validation

```bash
# Verify AZURE_CONFIG.json was updated with resource IDs
jq '.stages | to_entries[] | {stage: .key, resources: (.value.resources | keys)}' concept/AZURE_CONFIG.json

# Verify managed identity role assignments
MI_PRINCIPAL=$(jq -r '.stages.stage1.managedIdentities.apiIdentity.principalId' concept/AZURE_CONFIG.json)
az role assignment list --assignee $MI_PRINCIPAL --output table

# Verify Key Vault secrets exist (names only, not values)
KV_NAME=$(jq -r '.stages.stage1.resources.keyVault.name' concept/AZURE_CONFIG.json)
az keyvault secret list --vault-name $KV_NAME --query "[].name" --output table

# Verify PostgreSQL connectivity (from Azure Cloud Shell or allowed IP)
PSQL_HOST=$(az keyvault secret show --vault-name $KV_NAME --name postgresql-connection-host --query value -o tsv)
PSQL_USER=$(az keyvault secret show --vault-name $KV_NAME --name postgresql-admin-username --query value -o tsv)
psql "host=$PSQL_HOST dbname=taskify user=$PSQL_USER sslmode=require" -c "SELECT 1;"

# Verify Container Apps are running
RG=$(jq -r '.stages.stage1.resourceGroups.group1.name' concept/AZURE_CONFIG.json)
az containerapp list --resource-group $RG --output table

# Verify backend API health check
API_FQDN=$(az containerapp show --name $(jq -r '.stages.stage4.resources.containerAppApi.name' concept/AZURE_CONFIG.json) --resource-group $RG --query "properties.configuration.ingress.fqdn" -o tsv)
curl -s https://$API_FQDN/api/health
```

---

*Last updated: 2026-02-12*
