#!/bin/bash
# =============================================================================
# deploy.sh — Taskify Azure Infrastructure
# =============================================================================
# Manual deployment script. Everything here should become Bicep/Terraform IaC.
#
# This script creates:
#   - Resource Group
#   - Log Analytics + App Insights
#   - Key Vault (RBAC mode)
#   - User-Managed Identity with KV Secrets User role
#   - PostgreSQL Flexible Server (password stored in Key Vault)
#   - Container Apps Environment (linked to Log Analytics)
#   - Container App for the API (Managed Identity reads KV secret)
#   - Static Web App for the React frontend
#
# Prerequisites: az login, appropriate subscription/RG permissions
# =============================================================================
set -e

RESOURCE_GROUP="rg-taskify-${ENVIRONMENT:-prod}"
LOCATION="${LOCATION:-eastus}"
SUFFIX="$(openssl rand -hex 4)"

LOG_WORKSPACE="log-taskify-${SUFFIX}"
APP_INSIGHTS="appi-taskify-${SUFFIX}"
KEY_VAULT="kv-taskify-${SUFFIX}"
MANAGED_ID="id-taskify-${SUFFIX}"
DB_SERVER="psql-taskify-${SUFFIX}"
CAE="cae-taskify-${SUFFIX}"
API_APP="ca-taskify-api-${SUFFIX}"
STATIC_APP="stapp-taskify-${SUFFIX}"

DB_ADMIN="taskifyadmin"
DB_NAME="taskify"
API_IMAGE="${ACR_NAME:-taskifyregistry}.azurecr.io/taskify-api:${IMAGE_TAG:-latest}"

echo "=== [1/8] Resource Group ==="
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" \
  --tags Environment="${ENVIRONMENT:-prod}" Project=Taskify ManagedBy=Manual

echo "=== [2/8] Log Analytics + App Insights ==="
az monitor log-analytics workspace create \
  --workspace-name "$LOG_WORKSPACE" --resource-group "$RESOURCE_GROUP" --location "$LOCATION"

LOG_ID=$(az monitor log-analytics workspace show \
  -n "$LOG_WORKSPACE" -g "$RESOURCE_GROUP" --query customerId -o tsv)

az monitor app-insights component create \
  --app "$APP_INSIGHTS" --location "$LOCATION" \
  --resource-group "$RESOURCE_GROUP" --workspace "$LOG_WORKSPACE"

echo "=== [3/8] Key Vault (RBAC) ==="
az keyvault create --name "$KEY_VAULT" --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" --enable-rbac-authorization true

KV_ID=$(az keyvault show --name "$KEY_VAULT" --query id -o tsv)

echo "=== [4/8] Managed Identity ==="
az identity create --name "$MANAGED_ID" --resource-group "$RESOURCE_GROUP"

MI_CLIENT_ID=$(az identity show -n "$MANAGED_ID" -g "$RESOURCE_GROUP" --query clientId -o tsv)
MI_PRINCIPAL=$(az identity show -n "$MANAGED_ID" -g "$RESOURCE_GROUP" --query principalId -o tsv)
MI_ID=$(az identity show -n "$MANAGED_ID" -g "$RESOURCE_GROUP" --query id -o tsv)

# Grant Managed Identity read access to Key Vault secrets
az role assignment create --assignee "$MI_PRINCIPAL" \
  --role "Key Vault Secrets User" --scope "$KV_ID"

echo "=== [5/8] PostgreSQL Flexible Server ==="
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '=+/' | head -c 32)
az postgres flexible-server create \
  --name "$DB_SERVER" --resource-group "$RESOURCE_GROUP" --location "$LOCATION" \
  --admin-user "$DB_ADMIN" --admin-password "$DB_PASSWORD" \
  --sku-name Standard_B1ms --tier Burstable --storage-size 32 --version 16 \
  --high-availability Disabled

# Store connection string in Key Vault (not in env vars)
CONN_STR="postgresql://${DB_ADMIN}:${DB_PASSWORD}@${DB_SERVER}.postgres.database.azure.com/${DB_NAME}?sslmode=require"
az keyvault secret set --vault-name "$KEY_VAULT" \
  --name "db-connection-string" --value "$CONN_STR"
SECRET_URI=$(az keyvault secret show --vault-name "$KEY_VAULT" \
  --name "db-connection-string" --query id -o tsv)

echo "=== [6/8] Container Apps Environment ==="
az containerapp env create --name "$CAE" --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" --logs-workspace-id "$LOG_ID"

echo "=== [7/8] API Container App ==="
az containerapp create \
  --name "$API_APP" --resource-group "$RESOURCE_GROUP" --environment "$CAE" \
  --image "$API_IMAGE" \
  --user-assigned "$MI_ID" \
  --secrets "db-conn=keyvaultref:${SECRET_URI},identityref:${MI_CLIENT_ID}" \
  --env-vars "DATABASE_URL=secretref:db-conn" "NODE_ENV=production" \
    "CORS_ORIGIN=https://${STATIC_APP}.azurestaticapps.net" \
  --ingress external --target-port 3000 \
  --min-replicas 1 --max-replicas 5 \
  --cpu 0.5 --memory 1Gi

echo "=== [8/8] Static Web App ==="
az staticwebapp create --name "$STATIC_APP" --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" --sku Free

echo ""
echo "=== Deployment Complete ==="
echo "Outputs:"
echo "  API:    https://${API_APP}.<region>.azurecontainerapps.io"
echo "  Web:    https://${STATIC_APP}.azurestaticapps.net"
echo "  DB:     ${DB_SERVER}.postgres.database.azure.com"
echo ""
echo "Next: Upload static build to SWA, run SQL migrations via psql"
