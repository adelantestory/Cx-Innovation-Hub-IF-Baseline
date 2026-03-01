# Taskify - Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Staged Deployment Architecture](#staged-deployment-architecture)
4. [Deployment Script](#deployment-script)
5. [Step-by-Step Deployment](#step-by-step-deployment)
6. [Post-Deployment Steps](#post-deployment-steps)
7. [Application Deployment](#application-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Cleanup](#cleanup)

---

## Overview

This guide covers deploying Taskify to Azure. The solution uses the following components:

- **Azure Database for PostgreSQL Flexible Server** - Relational data storage
- **Azure Key Vault** - Secrets management (PostgreSQL credentials)
- **Azure Container Registry** - Docker image storage
- **Azure Container Apps Environment** - Serverless container hosting platform
- **Azure Container Apps** - Backend API and frontend web application containers
- **User-Assigned Managed Identity** - Keyless authentication for service-to-service access
- **Log Analytics Workspace** - Container diagnostics and log collection

All infrastructure is defined as Bicep templates and deployed via a multi-stage shell script.

---

## Prerequisites

### Required Tools

| Tool | Version | Purpose | Install |
|------|---------|---------|---------|
| Azure CLI | 2.20+ | Azure resource management (includes Bicep) | [Install Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli) |
| Docker | 4.x+ | Container image builds | [Docker Desktop](https://www.docker.com/products/docker-desktop) |
| jq | 1.6+ | JSON processing for AZURE_CONFIG.json | `brew install jq` (macOS) / `choco install jq` (Windows) / `sudo apt install jq` (Linux) |
| Bash | 4.x+ | Deployment script execution | Included on macOS/Linux; use Git Bash or WSL on Windows |
| psql | 16+ | PostgreSQL CLI for running DDL scripts | `brew install libpq` (macOS) / Included with PostgreSQL |

### Verify Prerequisites

```bash
az --version           # Azure CLI 2.20+
docker --version       # Docker 20+
jq --version           # jq 1.6+
bash --version         # Bash 4+
psql --version         # psql 16+ (optional but recommended)
```

### Azure Subscription

- Active Azure subscription with **Contributor** access
- Registered resource providers (the deployment script does not register these automatically):

```bash
# Register required resource providers
az provider register --namespace Microsoft.DBforPostgreSQL
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.KeyVault
az provider register --namespace Microsoft.ManagedIdentity
az provider register --namespace Microsoft.OperationalInsights
az provider register --namespace Microsoft.Resources

# Verify registration status
az provider show --namespace Microsoft.App --query "registrationState" -o tsv
az provider show --namespace Microsoft.DBforPostgreSQL --query "registrationState" -o tsv
az provider show --namespace Microsoft.ContainerRegistry --query "registrationState" -o tsv
az provider show --namespace Microsoft.KeyVault --query "registrationState" -o tsv
```

### Choose a Unique Identifier (UID)

All resource names are derived from a unique identifier (`uid`). Choose a short (4-8 character) alphanumeric string that is globally unique. This UID is embedded in all resource names (e.g., `rg-myapp-taskify-dev`, `kv-myapp-taskify-dev`).

**Important**: Azure Key Vault and Container Registry names must be globally unique. If deployment fails with a name conflict, choose a different UID.

---

## Staged Deployment Architecture

Infrastructure is deployed in 4 stages for isolation, debuggability, and incremental verification:

| Stage | Name | Resources | Dependencies |
|-------|------|-----------|-------------|
| 1 | Foundation | Resource Group, Log Analytics, Managed Identity, Key Vault | None |
| 2 | Data | PostgreSQL Flexible Server, Key Vault secrets | Stage 1 (Key Vault) |
| 3 | Container Infrastructure | Container Registry, Container Apps Environment | Stage 1 (Managed Identity, Log Analytics) |
| 4 | Application | Backend Container App, Frontend Container App | Stages 1-3 |

### Benefits

- **Isolation**: Failed stages can be redeployed without affecting others
- **Debugging**: Each stage can be verified independently before proceeding
- **Incremental**: Deploy and test one stage at a time
- **Rerunnable**: Individual stages can be redeployed (e.g., after config changes)

---

## Deployment Script

The deployment script (`concept/infrastructure/deploy.sh`) orchestrates all stages.

### Parameters

| Parameter | Flag | Description | Example |
|-----------|------|-------------|---------|
| UID | `-u, --uid` | Unique identifier for resource naming | `myapp` |
| Environment | `-e, --environment` | Target environment | `dev`, `stg`, `prd` |
| Location | `-l, --location` | Azure region | `westus3`, `eastus` |
| Stage | `-s, --stage` | Stage to deploy | `1`, `2`, `3`, `4`, `all` |

### Usage

```bash
# Make the script executable
chmod +x concept/infrastructure/deploy.sh

# Deploy all stages
./concept/infrastructure/deploy.sh -u myapp -e dev -l westus3 -s all

# Deploy a single stage
./concept/infrastructure/deploy.sh -u myapp -e dev -l westus3 -s 1
```

### What the Script Does

For each stage, the script:
1. Reads configuration from `concept/AZURE_CONFIG.json`
2. Executes the corresponding Bicep template via `az deployment group create`
3. Captures deployment outputs (resource IDs, FQDNs, etc.)
4. Writes outputs back to `concept/AZURE_CONFIG.json`
5. Performs post-deployment actions (e.g., storing secrets in Key Vault)

---

## Step-by-Step Deployment

### 1. Login to Azure

```bash
az login
az account set --subscription <subscription-id>
az account show
```

### 2. Deploy Stage 1: Foundation

```bash
./concept/infrastructure/deploy.sh -u <uid> -e dev -l westus3 -s 1
```

**Creates**:
- Resource Group: `rg-<uid>-taskify-dev`
- Log Analytics Workspace: `log-<uid>-taskify-dev`
- User-Assigned Managed Identity: `id-<uid>-taskify-api`
- Key Vault: `kv-<uid>-taskify-dev` (with RBAC role for managed identity)

**Verify**:
```bash
az group show --name rg-<uid>-taskify-dev --query name -o tsv
jq '.stages.stage1.resources.keyVault.uri' concept/AZURE_CONFIG.json
```

### 3. Deploy Stage 2: Data

```bash
./concept/infrastructure/deploy.sh -u <uid> -e dev -l westus3 -s 2
```

**Creates**:
- PostgreSQL Flexible Server: `psql-<uid>-taskify-dev`
- Database: `taskify`
- Firewall rule for Azure services
- Stores credentials in Key Vault (password, host FQDN, username)

**Verify**:
```bash
jq '.stages.stage2.resources.postgresql.fqdn' concept/AZURE_CONFIG.json
az keyvault secret list --vault-name kv-<uid>-taskify-dev --query "[].name" -o table
```

### 4. Deploy Database Schema (Manual Step)

After Stage 2, you must manually run the DDL scripts against PostgreSQL.

```bash
# Get PostgreSQL details from AZURE_CONFIG.json
PSQL_HOST=$(jq -r '.stages.stage2.resources.postgresql.fqdn' concept/AZURE_CONFIG.json)
KV_NAME=$(jq -r '.stages.stage1.resources.keyVault.name' concept/AZURE_CONFIG.json)

# Retrieve password from Key Vault
PSQL_PASS=$(az keyvault secret show --vault-name $KV_NAME --name postgresql-admin-password --query value -o tsv)

# Add your IP to PostgreSQL firewall
az postgres flexible-server firewall-rule create \
  --resource-group rg-<uid>-taskify-dev \
  --name psql-<uid>-taskify-dev \
  --rule-name AllowMyIP \
  --start-ip-address <YOUR_IP> \
  --end-ip-address <YOUR_IP>

# Run DDL scripts
export PGPASSWORD="$PSQL_PASS"
psql -h "$PSQL_HOST" -U taskifyadmin -d taskify -f concept/sql/001_create_tables.sql
psql -h "$PSQL_HOST" -U taskifyadmin -d taskify -f concept/sql/005_seed_data.sql
unset PGPASSWORD
```

**Verify**:
```bash
export PGPASSWORD="$PSQL_PASS"
psql -h "$PSQL_HOST" -U taskifyadmin -d taskify -c "SELECT COUNT(*) FROM users;"
# Expected: 5
unset PGPASSWORD
```

### 5. Deploy Stage 3: Container Infrastructure

```bash
./concept/infrastructure/deploy.sh -u <uid> -e dev -l westus3 -s 3
```

**Creates**:
- Container Registry: `cr<uid>taskifydev`
- Container Apps Environment: `cae-<uid>-taskify-dev`

**Verify**:
```bash
jq '.stages.stage3.resources.containerRegistry.loginServer' concept/AZURE_CONFIG.json
jq '.stages.stage3.resources.containerAppsEnvironment.name' concept/AZURE_CONFIG.json
```

### 6. Deploy Stage 4: Application

```bash
./concept/infrastructure/deploy.sh -u <uid> -e dev -l westus3 -s 4
```

**What happens**:
1. Logs into Container Registry
2. Builds and pushes the backend API Docker image
3. Builds and pushes the frontend Docker image (with placeholder API URL)
4. Deploys both Container Apps via Bicep
5. Captures the backend API FQDN
6. Rebuilds and pushes the frontend image with the correct API URL
7. Updates the frontend Container App with the new image

**Verify**:
```bash
# Get application URLs
API_URL=$(jq -r '.stages.stage4.resources.containerAppApi.url' concept/AZURE_CONFIG.json)
WEB_URL=$(jq -r '.stages.stage4.resources.containerAppWeb.url' concept/AZURE_CONFIG.json)

# Test API health
curl -s "$API_URL/api/health" | jq .
# Expected: {"status":"ok","database":"connected"}

# Open frontend in browser
echo "Frontend: $WEB_URL"
```

---

## Post-Deployment Steps

### Grant Key Vault Administrator to Deploying User (if needed)

If the deployment script cannot write secrets to Key Vault, you may need to grant yourself the Key Vault Administrator role:

```bash
KV_ID=$(jq -r '.stages.stage1.resources.keyVault.id' concept/AZURE_CONFIG.json)
USER_OBJECT_ID=$(az ad signed-in-user show --query id -o tsv)

az role assignment create \
  --assignee "$USER_OBJECT_ID" \
  --role "Key Vault Administrator" \
  --scope "$KV_ID"
```

### Verify Complete Deployment

```bash
# List all resources in the resource group
az resource list --resource-group rg-<uid>-taskify-dev --output table

# Check managed identity role assignments
MI_PRINCIPAL=$(jq -r '.stages.stage1.managedIdentities.apiIdentity.principalId' concept/AZURE_CONFIG.json)
az role assignment list --assignee "$MI_PRINCIPAL" --output table

# Check Container App status
az containerapp list --resource-group rg-<uid>-taskify-dev --query "[].{Name:name, Status:properties.runningStatus}" -o table
```

---

## Application Deployment

### Redeploying Application Code Only

If you make changes to the application code without infrastructure changes, you can rebuild and push images without rerunning the full deployment:

```bash
# Read registry from config
CR_NAME=$(jq -r '.stages.stage3.resources.containerRegistry.name' concept/AZURE_CONFIG.json)
CR_LOGIN=$(jq -r '.stages.stage3.resources.containerRegistry.loginServer' concept/AZURE_CONFIG.json)
API_URL=$(jq -r '.stages.stage4.resources.containerAppApi.url' concept/AZURE_CONFIG.json)
RG_NAME=$(jq -r '.stages.stage1.resourceGroups.group1.name' concept/AZURE_CONFIG.json)

# Login to registry
az acr login --name $CR_NAME

# Rebuild and push backend
docker build -t $CR_LOGIN/taskify-api:latest -f concept/apps/api/Dockerfile concept/apps/api/
docker push $CR_LOGIN/taskify-api:latest

# Update backend Container App
az containerapp update \
  --name $(jq -r '.stages.stage4.resources.containerAppApi.name' concept/AZURE_CONFIG.json) \
  --resource-group $RG_NAME \
  --image $CR_LOGIN/taskify-api:latest

# Rebuild and push frontend (with API URL baked in)
docker build -t $CR_LOGIN/taskify-web:latest \
  --build-arg VITE_API_URL=$API_URL \
  -f concept/apps/web/Dockerfile concept/apps/web/
docker push $CR_LOGIN/taskify-web:latest

# Update frontend Container App
az containerapp update \
  --name $(jq -r '.stages.stage4.resources.containerAppWeb.name' concept/AZURE_CONFIG.json) \
  --resource-group $RG_NAME \
  --image $CR_LOGIN/taskify-web:latest
```

---

## Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|---------|
| `Key Vault name already exists` | Key Vault with same name exists (possibly soft-deleted) | Purge: `az keyvault purge --name <name> --location <location>` |
| `Container Registry name already exists` | ACR name not globally unique | Choose a different UID |
| `RBAC permission denied on Key Vault` | Deploying user lacks Key Vault Administrator role | Grant role (see Post-Deployment steps above) |
| `PostgreSQL connection refused` | Client IP not in firewall rules | Add firewall rule (see Step 4) |
| `Container App shows 'Provisioning'` | Image pull in progress or cold start | Wait 1-2 minutes; check `az containerapp logs` |
| `502 Bad Gateway on Container App` | Application crashed or not started | Check logs: `az containerapp logs show --name <app> --resource-group <rg>` |
| `Key Vault secrets not accessible` | Managed Identity RBAC not propagated yet | Wait 2-5 minutes for RBAC propagation; retry |
| `openssl: command not found` | openssl not available in shell | Install openssl or use Git Bash on Windows |

### Viewing Container Logs

```bash
RG_NAME=$(jq -r '.stages.stage1.resourceGroups.group1.name' concept/AZURE_CONFIG.json)

# API logs
az containerapp logs show \
  --name $(jq -r '.stages.stage4.resources.containerAppApi.name' concept/AZURE_CONFIG.json) \
  --resource-group $RG_NAME \
  --follow

# Web logs
az containerapp logs show \
  --name $(jq -r '.stages.stage4.resources.containerAppWeb.name' concept/AZURE_CONFIG.json) \
  --resource-group $RG_NAME \
  --follow
```

### Purging Soft-Deleted Resources

```bash
# List and purge deleted Key Vaults
az keyvault list-deleted --query "[].{name:name, location:properties.location}" -o table
az keyvault purge --name <vault-name> --location <location>
```

### Regional Availability

If you encounter quota or availability errors:
- **PostgreSQL Flexible Server**: Available in most regions. Try `westus3`, `eastus`, `northeurope`.
- **Container Apps**: Available in most regions. Try `westus3`, `eastus`, `westeurope`.
- **Container Registry**: Available in all major regions.

---

## Cleanup

### Delete All Resources

```bash
RG_NAME=$(jq -r '.stages.stage1.resourceGroups.group1.name' concept/AZURE_CONFIG.json)
az group delete --name "$RG_NAME" --yes --no-wait
echo "Resource group $RG_NAME deletion initiated."
```

### Purge Soft-Deleted Key Vault (after resource group deletion)

```bash
KV_NAME=$(jq -r '.stages.stage1.resources.keyVault.name' concept/AZURE_CONFIG.json)
az keyvault purge --name "$KV_NAME" --location westus3
```

---

## Resource Sizing by Environment

| Resource | Dev (POC) | Staging | Production |
|----------|-----------|---------|------------|
| PostgreSQL | Standard_B1ms (Burstable) | Standard_B1ms (Burstable) | Standard_D2s_v3 (General Purpose) |
| PostgreSQL Storage | 32 GiB | 32 GiB | 128 GiB |
| Container App CPU | 0.25 vCPU | 0.25 vCPU | 0.5 vCPU |
| Container App Memory | 0.5 GiB | 0.5 GiB | 1.0 GiB |
| Container App Min Replicas | 0 | 1 | 2 |
| Container App Max Replicas | 1 | 3 | 10 |
| Container Registry SKU | Basic | Basic | Standard |
| Log Analytics Retention | 30 days | 60 days | 90 days |

---

## Security

- All resources use TLS 1.2+
- Key Vault uses RBAC authorization (not access policies)
- Managed Identity used for service-to-service authentication
- **No connection strings or access keys** in environment variables or source code
- PostgreSQL credentials stored in Key Vault and retrieved at runtime
- Container Registry admin user is disabled; pulls use Managed Identity

### Managed Identity Role Assignments

| Identity | Resource | Role |
|----------|----------|------|
| `id-{uid}-taskify-api` | Key Vault | Key Vault Secrets User |
| `id-{uid}-taskify-api` | Container Registry | AcrPull |

### Production Recommendations (Documented, Not Implemented)

1. Enable VNet integration for Container Apps Environment
2. Configure Private Endpoints for PostgreSQL, Key Vault, and Container Registry
3. Disable public network access on all data services
4. Enable Azure Defender for all services
5. Upgrade PostgreSQL to General Purpose tier with zone-redundant HA
6. Set Container App min replicas to 1+ to avoid cold starts
7. Add Application Insights for distributed tracing

---

*Last updated: 2026-02-12*
