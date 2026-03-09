#!/usr/bin/env bash
# =============================================================================
# Taskify - Multi-Stage Deployment Script
# =============================================================================
# Orchestrates staged deployment of Azure infrastructure via Bicep templates
# and updates concept/AZURE_CONFIG.json with resource outputs.
#
# Usage:
#   ./concept/infrastructure/deploy.sh -u <uid> -e <env> -l <location> -s <stage|all>
#
# Parameters:
#   -u, --uid           Unique identifier for resource naming (e.g., "abc12")
#   -e, --environment   Environment: dev, stg, prd
#   -l, --location      Azure region (e.g., westus3, eastus)
#   -s, --stage         Stage to deploy: 1, 2, 3, 4, or "all"
#   -h, --help          Show this help message
#
# Prerequisites:
#   - Azure CLI (az) installed and authenticated (az login)
#   - jq installed for JSON processing
#   - Docker installed (for Stage 4 image builds)
#   - Bicep CLI (bundled with Azure CLI 2.20+)
#
# Stages:
#   1 - Foundation:     Resource Group, Log Analytics, Managed Identity, Key Vault
#   2 - Data:           PostgreSQL Flexible Server, Key Vault secret population
#   3 - Containers:     Container Registry, Container Apps Environment
#   4 - Application:    Build/push images, deploy Backend + Frontend Container Apps
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CONCEPT_DIR="${PROJECT_ROOT}/concept"
CONFIG_FILE="${CONCEPT_DIR}/AZURE_CONFIG.json"
BICEP_DIR="${SCRIPT_DIR}/bicep"

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------
usage() {
  cat <<EOF
Taskify - Multi-Stage Deployment Script

Usage:
  $(basename "$0") -u <uid> -e <env> -l <location> -s <stage|all>

Required Parameters:
  -u, --uid           Unique identifier for resource naming (e.g., "abc12")
  -e, --environment   Environment: dev, stg, prd
  -l, --location      Azure region (e.g., westus3, eastus)
  -s, --stage         Stage to deploy: 1, 2, 3, 4, or "all"

Optional Parameters:
  -h, --help          Show this help message

Examples:
  # Deploy all stages
  $(basename "$0") -u myapp -e dev -l westus3 -s all

  # Deploy only Stage 1 (Foundation)
  $(basename "$0") -u myapp -e dev -l westus3 -s 1

  # Deploy only Stage 4 (Application)
  $(basename "$0") -u myapp -e dev -l westus3 -s 4
EOF
  exit 0
}

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
log_info()  { echo "[INFO]  $(date '+%H:%M:%S') $*"; }
log_warn()  { echo "[WARN]  $(date '+%H:%M:%S') $*" >&2; }
log_error() { echo "[ERROR] $(date '+%H:%M:%S') $*" >&2; }
log_step()  { echo ""; echo "========================================"; echo "  $*"; echo "========================================"; }

# ---------------------------------------------------------------------------
# Argument Parsing
# ---------------------------------------------------------------------------
UID_VALUE=""
ENVIRONMENT=""
LOCATION=""
STAGE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -u|--uid)         UID_VALUE="$2"; shift 2 ;;
    -e|--environment) ENVIRONMENT="$2"; shift 2 ;;
    -l|--location)    LOCATION="$2"; shift 2 ;;
    -s|--stage)       STAGE="$2"; shift 2 ;;
    -h|--help)        usage ;;
    *) log_error "Unknown argument: $1"; usage ;;
  esac
done

# Validate required parameters
if [[ -z "$UID_VALUE" || -z "$ENVIRONMENT" || -z "$LOCATION" || -z "$STAGE" ]]; then
  log_error "Missing required parameters."
  usage
fi

if [[ ! "$ENVIRONMENT" =~ ^(dev|stg|prd)$ ]]; then
  log_error "Environment must be one of: dev, stg, prd"
  exit 1
fi

if [[ ! "$STAGE" =~ ^(1|2|3|4|all)$ ]]; then
  log_error "Stage must be one of: 1, 2, 3, 4, all"
  exit 1
fi

# ---------------------------------------------------------------------------
# Prerequisite Checks
# ---------------------------------------------------------------------------
log_info "Checking prerequisites..."

command -v az >/dev/null 2>&1 || { log_error "Azure CLI (az) is not installed."; exit 1; }
command -v jq >/dev/null 2>&1 || { log_error "jq is not installed."; exit 1; }

# Verify Azure CLI is authenticated
SUBSCRIPTION_ID=$(az account show --query "id" -o tsv 2>/dev/null) || {
  log_error "Not logged into Azure CLI. Run 'az login' first."
  exit 1
}
SUBSCRIPTION_NAME=$(az account show --query "name" -o tsv)
TENANT_ID=$(az account show --query "tenantId" -o tsv)

log_info "Subscription: ${SUBSCRIPTION_NAME} (${SUBSCRIPTION_ID})"
log_info "Tenant:       ${TENANT_ID}"
log_info "UID:          ${UID_VALUE}"
log_info "Environment:  ${ENVIRONMENT}"
log_info "Location:     ${LOCATION}"
log_info "Stage:        ${STAGE}"

# ---------------------------------------------------------------------------
# Resource Names (derived from parameters)
# ---------------------------------------------------------------------------
RG_NAME="rg-${UID_VALUE}-taskify-${ENVIRONMENT}"

# ---------------------------------------------------------------------------
# Config Helpers
# ---------------------------------------------------------------------------

# Update AZURE_CONFIG.json with subscription info
update_config_subscription() {
  local tmp
  tmp=$(mktemp)
  jq --arg id "$SUBSCRIPTION_ID" \
     --arg name "$SUBSCRIPTION_NAME" \
     --arg tenant "$TENANT_ID" \
     --arg modified "$(date '+%Y-%m-%d')" \
     '.subscription.id = $id |
      .subscription.name = $name |
      .subscription.tenantId = $tenant |
      .project.lastModified = $modified' \
     "$CONFIG_FILE" > "$tmp" && mv "$tmp" "$CONFIG_FILE"
}

# Update a specific JSON path in AZURE_CONFIG.json
update_config() {
  local path="$1"
  local value="$2"
  local tmp
  tmp=$(mktemp)
  jq --arg val "$value" "${path} = \$val" "$CONFIG_FILE" > "$tmp" && mv "$tmp" "$CONFIG_FILE"
}

# Replace {uid} placeholders in config with actual UID value
resolve_config_placeholders() {
  local tmp
  tmp=$(mktemp)
  sed "s/{uid}/${UID_VALUE}/g" "$CONFIG_FILE" > "$tmp" && mv "$tmp" "$CONFIG_FILE"
}

# ---------------------------------------------------------------------------
# Stage 1: Foundation
# ---------------------------------------------------------------------------
deploy_stage1() {
  log_step "Stage 1: Foundation"

  # Create Resource Group
  log_info "Creating resource group: ${RG_NAME}"
  az group create \
    --name "$RG_NAME" \
    --location "$LOCATION" \
    --tags Environment="$ENVIRONMENT" Stage=foundation Purpose="Taskify POC" \
    --output none

  # Deploy Bicep template
  log_info "Deploying Stage 1 Bicep template..."
  local output
  output=$(az deployment group create \
    --resource-group "$RG_NAME" \
    --template-file "${BICEP_DIR}/stage1-foundation.bicep" \
    --parameters uid="$UID_VALUE" location="$LOCATION" environment="$ENVIRONMENT" \
    --query "properties.outputs" \
    --output json)

  # Extract outputs
  local log_id log_name log_customer_id
  local mi_id mi_name mi_client_id mi_principal_id
  local kv_id kv_name kv_uri

  log_id=$(echo "$output" | jq -r '.logAnalyticsId.value')
  log_name=$(echo "$output" | jq -r '.logAnalyticsName.value')
  log_customer_id=$(echo "$output" | jq -r '.logAnalyticsCustomerId.value')

  mi_id=$(echo "$output" | jq -r '.managedIdentityId.value')
  mi_name=$(echo "$output" | jq -r '.managedIdentityName.value')
  mi_client_id=$(echo "$output" | jq -r '.managedIdentityClientId.value')
  mi_principal_id=$(echo "$output" | jq -r '.managedIdentityPrincipalId.value')

  kv_id=$(echo "$output" | jq -r '.keyVaultId.value')
  kv_name=$(echo "$output" | jq -r '.keyVaultName.value')
  kv_uri=$(echo "$output" | jq -r '.keyVaultUri.value')

  # Update AZURE_CONFIG.json
  log_info "Updating AZURE_CONFIG.json with Stage 1 outputs..."
  local tmp
  tmp=$(mktemp)
  jq --arg rg_name "$RG_NAME" \
     --arg rg_location "$LOCATION" \
     --arg log_id "$log_id" \
     --arg log_name "$log_name" \
     --arg log_customer_id "$log_customer_id" \
     --arg mi_id "$mi_id" \
     --arg mi_name "$mi_name" \
     --arg mi_client_id "$mi_client_id" \
     --arg mi_principal_id "$mi_principal_id" \
     --arg kv_id "$kv_id" \
     --arg kv_name "$kv_name" \
     --arg kv_uri "$kv_uri" \
     '
     .stages.stage1.resourceGroups.group1.name = $rg_name |
     .stages.stage1.resourceGroups.group1.location = $rg_location |
     .stages.stage1.resources.logAnalytics.id = $log_id |
     .stages.stage1.resources.logAnalytics.name = $log_name |
     .stages.stage1.resources.logAnalytics.customerId = $log_customer_id |
     .stages.stage1.managedIdentities.apiIdentity.name = $mi_name |
     .stages.stage1.managedIdentities.apiIdentity.id = $mi_id |
     .stages.stage1.managedIdentities.apiIdentity.clientId = $mi_client_id |
     .stages.stage1.managedIdentities.apiIdentity.principalId = $mi_principal_id |
     .stages.stage1.resources.keyVault.id = $kv_id |
     .stages.stage1.resources.keyVault.name = $kv_name |
     .stages.stage1.resources.keyVault.uri = $kv_uri
     ' "$CONFIG_FILE" > "$tmp" && mv "$tmp" "$CONFIG_FILE"

  log_info "Stage 1 complete."
  log_info "  Log Analytics:     ${log_name}"
  log_info "  Managed Identity:  ${mi_name} (${mi_client_id})"
  log_info "  Key Vault:         ${kv_name} (${kv_uri})"
}

# ---------------------------------------------------------------------------
# Stage 2: Data
# ---------------------------------------------------------------------------
deploy_stage2() {
  log_step "Stage 2: Data"

  # Read Key Vault name from config (set in Stage 1)
  local kv_name
  kv_name=$(jq -r '.stages.stage1.resources.keyVault.name' "$CONFIG_FILE")
  if [[ -z "$kv_name" || "$kv_name" == "null" ]]; then
    log_error "Key Vault name not found in AZURE_CONFIG.json. Deploy Stage 1 first."
    exit 1
  fi

  # Generate random password for PostgreSQL admin
  local pg_password
  pg_password=$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9!@#%^&*' | head -c 32)

  local pg_username="taskifyadmin"

  # Deploy Bicep template
  log_info "Deploying Stage 2 Bicep template..."
  local output
  output=$(az deployment group create \
    --resource-group "$RG_NAME" \
    --template-file "${BICEP_DIR}/stage2-data.bicep" \
    --parameters uid="$UID_VALUE" location="$LOCATION" environment="$ENVIRONMENT" \
                 adminUsername="$pg_username" adminPassword="$pg_password" \
    --query "properties.outputs" \
    --output json)

  # Extract outputs
  local pg_id pg_name pg_fqdn pg_db_name
  pg_id=$(echo "$output" | jq -r '.postgresqlId.value')
  pg_name=$(echo "$output" | jq -r '.postgresqlName.value')
  pg_fqdn=$(echo "$output" | jq -r '.postgresqlFqdn.value')
  pg_db_name=$(echo "$output" | jq -r '.postgresqlDatabaseName.value')

  # Store secrets in Key Vault
  log_info "Storing PostgreSQL credentials in Key Vault (${kv_name})..."
  az keyvault secret set --vault-name "$kv_name" --name "postgresql-admin-password" --value "$pg_password" --output none
  az keyvault secret set --vault-name "$kv_name" --name "postgresql-connection-host" --value "$pg_fqdn" --output none
  az keyvault secret set --vault-name "$kv_name" --name "postgresql-admin-username" --value "$pg_username" --output none

  # Update AZURE_CONFIG.json
  log_info "Updating AZURE_CONFIG.json with Stage 2 outputs..."
  local tmp
  tmp=$(mktemp)
  jq --arg pg_id "$pg_id" \
     --arg pg_name "$pg_name" \
     --arg pg_fqdn "$pg_fqdn" \
     --arg pg_db_name "$pg_db_name" \
     '
     .stages.stage2.resources.postgresql.id = $pg_id |
     .stages.stage2.resources.postgresql.name = $pg_name |
     .stages.stage2.resources.postgresql.fqdn = $pg_fqdn |
     .stages.stage2.resources.postgresql.databaseName = $pg_db_name
     ' "$CONFIG_FILE" > "$tmp" && mv "$tmp" "$CONFIG_FILE"

  log_info "Stage 2 complete."
  log_info "  PostgreSQL: ${pg_name} (${pg_fqdn})"
  log_info "  Database:   ${pg_db_name}"
  log_info ""
  log_warn "MANUAL STEP REQUIRED: Run DDL scripts against PostgreSQL."
  log_warn "  1. Add your client IP to the PostgreSQL firewall:"
  log_warn "     az postgres flexible-server firewall-rule create \\"
  log_warn "       --resource-group ${RG_NAME} --name ${pg_name} \\"
  log_warn "       --rule-name AllowMyIP --start-ip-address <YOUR_IP> --end-ip-address <YOUR_IP>"
  log_warn "  2. Connect and run scripts:"
  log_warn "     export PGPASSWORD='<retrieve from Key Vault>'"
  log_warn "     psql -h ${pg_fqdn} -U ${pg_username} -d ${pg_db_name} -f concept/sql/001_create_tables.sql"
  log_warn "     psql -h ${pg_fqdn} -U ${pg_username} -d ${pg_db_name} -f concept/sql/005_seed_data.sql"
}

# ---------------------------------------------------------------------------
# Stage 3: Container Infrastructure
# ---------------------------------------------------------------------------
deploy_stage3() {
  log_step "Stage 3: Container Infrastructure"

  # Read values from config (set in Stage 1)
  local mi_principal_id log_customer_id
  mi_principal_id=$(jq -r '.stages.stage1.managedIdentities.apiIdentity.principalId' "$CONFIG_FILE")
  log_customer_id=$(jq -r '.stages.stage1.resources.logAnalytics.customerId' "$CONFIG_FILE")

  if [[ -z "$mi_principal_id" || "$mi_principal_id" == "null" ]]; then
    log_error "Managed Identity principal ID not found. Deploy Stage 1 first."
    exit 1
  fi

  # Retrieve Log Analytics shared key (not stored in config for security)
  local log_name log_shared_key
  log_name=$(jq -r '.stages.stage1.resources.logAnalytics.name' "$CONFIG_FILE")
  log_shared_key=$(az monitor log-analytics workspace get-shared-keys \
    --resource-group "$RG_NAME" \
    --workspace-name "$log_name" \
    --query "primarySharedKey" -o tsv)

  # Deploy Bicep template
  log_info "Deploying Stage 3 Bicep template..."
  local output
  output=$(az deployment group create \
    --resource-group "$RG_NAME" \
    --template-file "${BICEP_DIR}/stage3-containers.bicep" \
    --parameters uid="$UID_VALUE" location="$LOCATION" environment="$ENVIRONMENT" \
                 managedIdentityPrincipalId="$mi_principal_id" \
                 logAnalyticsCustomerId="$log_customer_id" \
                 logAnalyticsSharedKey="$log_shared_key" \
    --query "properties.outputs" \
    --output json)

  # Extract outputs
  local cr_id cr_name cr_login_server
  local cae_id cae_name cae_domain

  cr_id=$(echo "$output" | jq -r '.containerRegistryId.value')
  cr_name=$(echo "$output" | jq -r '.containerRegistryName.value')
  cr_login_server=$(echo "$output" | jq -r '.containerRegistryLoginServer.value')

  cae_id=$(echo "$output" | jq -r '.containerAppsEnvironmentId.value')
  cae_name=$(echo "$output" | jq -r '.containerAppsEnvironmentName.value')
  cae_domain=$(echo "$output" | jq -r '.containerAppsEnvironmentDefaultDomain.value')

  # Update AZURE_CONFIG.json
  log_info "Updating AZURE_CONFIG.json with Stage 3 outputs..."
  local tmp
  tmp=$(mktemp)
  jq --arg cr_id "$cr_id" \
     --arg cr_name "$cr_name" \
     --arg cr_login_server "$cr_login_server" \
     --arg cae_id "$cae_id" \
     --arg cae_name "$cae_name" \
     --arg cae_domain "$cae_domain" \
     '
     .stages.stage3.resources.containerRegistry.id = $cr_id |
     .stages.stage3.resources.containerRegistry.name = $cr_name |
     .stages.stage3.resources.containerRegistry.loginServer = $cr_login_server |
     .stages.stage3.resources.containerAppsEnvironment.id = $cae_id |
     .stages.stage3.resources.containerAppsEnvironment.name = $cae_name |
     .stages.stage3.resources.containerAppsEnvironment.defaultDomain = $cae_domain
     ' "$CONFIG_FILE" > "$tmp" && mv "$tmp" "$CONFIG_FILE"

  log_info "Stage 3 complete."
  log_info "  Container Registry:      ${cr_name} (${cr_login_server})"
  log_info "  Container Apps Env:      ${cae_name}"
}

# ---------------------------------------------------------------------------
# Stage 4: Application Deployment
# ---------------------------------------------------------------------------
deploy_stage4() {
  log_step "Stage 4: Application Deployment"

  # Read values from config (set in previous stages)
  local mi_id mi_client_id kv_uri cae_id cr_login_server
  mi_id=$(jq -r '.stages.stage1.managedIdentities.apiIdentity.id' "$CONFIG_FILE")
  mi_client_id=$(jq -r '.stages.stage1.managedIdentities.apiIdentity.clientId' "$CONFIG_FILE")
  kv_uri=$(jq -r '.stages.stage1.resources.keyVault.uri' "$CONFIG_FILE")
  cae_id=$(jq -r '.stages.stage3.resources.containerAppsEnvironment.id' "$CONFIG_FILE")
  cr_login_server=$(jq -r '.stages.stage3.resources.containerRegistry.loginServer' "$CONFIG_FILE")
  local cr_name
  cr_name=$(jq -r '.stages.stage3.resources.containerRegistry.name' "$CONFIG_FILE")

  if [[ -z "$cae_id" || "$cae_id" == "null" ]]; then
    log_error "Container Apps Environment not found. Deploy Stage 3 first."
    exit 1
  fi

  # Build and push container images
  log_info "Logging into Container Registry (${cr_name})..."
  az acr login --name "$cr_name"

  log_info "Building and pushing backend API image..."
  docker build \
    -t "${cr_login_server}/taskify-api:latest" \
    -f "${CONCEPT_DIR}/apps/api/Dockerfile" \
    "${CONCEPT_DIR}/apps/api/"
  docker push "${cr_login_server}/taskify-api:latest"

  # Build frontend with a placeholder API URL (will be updated after API is deployed)
  log_info "Building and pushing frontend image (placeholder API URL)..."
  docker build \
    -t "${cr_login_server}/taskify-web:latest" \
    --build-arg VITE_API_URL="https://placeholder.azurecontainerapps.io" \
    -f "${CONCEPT_DIR}/apps/web/Dockerfile" \
    "${CONCEPT_DIR}/apps/web/"
  docker push "${cr_login_server}/taskify-web:latest"

  # Deploy Bicep template
  log_info "Deploying Stage 4 Bicep template..."
  local output
  output=$(az deployment group create \
    --resource-group "$RG_NAME" \
    --template-file "${BICEP_DIR}/stage4-application.bicep" \
    --parameters uid="$UID_VALUE" location="$LOCATION" environment="$ENVIRONMENT" \
                 environmentId="$cae_id" \
                 registryLoginServer="$cr_login_server" \
                 managedIdentityId="$mi_id" \
                 managedIdentityClientId="$mi_client_id" \
                 keyVaultUri="$kv_uri" \
    --query "properties.outputs" \
    --output json)

  # Extract outputs
  local api_id api_name api_fqdn api_url
  local web_id web_name web_fqdn web_url

  api_id=$(echo "$output" | jq -r '.containerAppApiId.value')
  api_name=$(echo "$output" | jq -r '.containerAppApiName.value')
  api_fqdn=$(echo "$output" | jq -r '.containerAppApiFqdn.value')
  api_url=$(echo "$output" | jq -r '.containerAppApiUrl.value')

  web_id=$(echo "$output" | jq -r '.containerAppWebId.value')
  web_name=$(echo "$output" | jq -r '.containerAppWebName.value')
  web_fqdn=$(echo "$output" | jq -r '.containerAppWebFqdn.value')
  web_url=$(echo "$output" | jq -r '.containerAppWebUrl.value')

  # Rebuild and push frontend with actual API URL
  log_info "Rebuilding frontend with actual API URL (${api_url})..."
  docker build \
    -t "${cr_login_server}/taskify-web:latest" \
    --build-arg VITE_API_URL="${api_url}" \
    -f "${CONCEPT_DIR}/apps/web/Dockerfile" \
    "${CONCEPT_DIR}/apps/web/"
  docker push "${cr_login_server}/taskify-web:latest"

  # Update frontend Container App to pick up new image
  log_info "Updating frontend Container App with new image..."
  az containerapp update \
    --name "$web_name" \
    --resource-group "$RG_NAME" \
    --image "${cr_login_server}/taskify-web:latest" \
    --output none

  # Update AZURE_CONFIG.json
  log_info "Updating AZURE_CONFIG.json with Stage 4 outputs..."
  local tmp
  tmp=$(mktemp)
  jq --arg api_id "$api_id" \
     --arg api_name "$api_name" \
     --arg api_fqdn "$api_fqdn" \
     --arg api_url "$api_url" \
     --arg web_id "$web_id" \
     --arg web_name "$web_name" \
     --arg web_fqdn "$web_fqdn" \
     --arg web_url "$web_url" \
     '
     .stages.stage4.resources.containerAppApi.id = $api_id |
     .stages.stage4.resources.containerAppApi.name = $api_name |
     .stages.stage4.resources.containerAppApi.fqdn = $api_fqdn |
     .stages.stage4.resources.containerAppApi.url = $api_url |
     .stages.stage4.resources.containerAppWeb.id = $web_id |
     .stages.stage4.resources.containerAppWeb.name = $web_name |
     .stages.stage4.resources.containerAppWeb.fqdn = $web_fqdn |
     .stages.stage4.resources.containerAppWeb.url = $web_url
     ' "$CONFIG_FILE" > "$tmp" && mv "$tmp" "$CONFIG_FILE"

  log_info "Stage 4 complete."
  log_info "  Backend API:  ${api_url}"
  log_info "  Frontend:     ${web_url}"
}

# ---------------------------------------------------------------------------
# Main Execution
# ---------------------------------------------------------------------------

# Update subscription info in config
update_config_subscription

# Resolve {uid} placeholders in AZURE_CONFIG.json
resolve_config_placeholders

# Execute requested stage(s)
case "$STAGE" in
  1)   deploy_stage1 ;;
  2)   deploy_stage2 ;;
  3)   deploy_stage3 ;;
  4)   deploy_stage4 ;;
  all)
    deploy_stage1
    deploy_stage2
    deploy_stage3
    deploy_stage4
    ;;
esac

log_step "Deployment Complete"
log_info "Configuration saved to: ${CONFIG_FILE}"
log_info "Review with: cat ${CONFIG_FILE} | jq ."
