#!/bin/bash
# deploy.sh — Manual deployment script (no IaC)
# SECURITY ISSUE: hardcoded admin password
# SECURITY ISSUE: connection string exposed as container env var
# No Managed Identity, no Key Vault, no repeatability guarantees

RESOURCE_GROUP="rg-taskify-prod"
LOCATION="eastus"
DB_SERVER="taskify-db"
DB_ADMIN="taskifyadmin"
DB_PASSWORD="Taskify@2024!"  # HARDCODED — rotate immediately after deploy

echo "Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

echo "Creating PostgreSQL server..."
az postgres flexible-server create \
  --name $DB_SERVER --resource-group $RESOURCE_GROUP \
  --location $LOCATION --admin-user $DB_ADMIN \
  --admin-password "$DB_PASSWORD" \
  --sku-name Standard_B1ms --tier Burstable

echo "Creating Container App..."
az containerapp create \
  --name taskify-api --resource-group $RESOURCE_GROUP \
  --environment taskify-env \
  --image taskifyregistry.azurecr.io/taskify-api:latest \
  --env-vars \
    "PGHOST=${DB_SERVER}.postgres.database.azure.com" \
    "PGUSER=${DB_ADMIN}" \
    "PGPASSWORD=${DB_PASSWORD}" \
    "PGDATABASE=taskify" \
  --ingress external --target-port 3000

echo "Done. Note: no monitoring, no IaC. Repeat manually for staging/prod."
