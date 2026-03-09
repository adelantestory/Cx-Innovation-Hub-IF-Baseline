# Azure Config Sync Skill

## Purpose

Validates, updates, and maintains the `concept/AZURE_CONFIG.json` file to ensure it remains the single source of truth for all Azure resource configurations across the project.

## When to Use

- **After any infrastructure deployment** — Sync deployed resource details back to config
- **Before application deployment** — Validate required resources exist in config
- **When agents request resource details** — Provide consistent lookups
- **During architecture changes** — Update config to reflect new/removed resources
- **Pre-handoff validation** — Ensure config matches actual Azure state

## Triggers

- `cloud-architect` completes infrastructure design
- `deploy.sh` script executes (should auto-update config)
- Any agent queries for resource endpoints, names, or IDs
- Manual request to validate or sync configuration

---

## Schema Reference

### Required Root Structure

```json
{
  "project": {
    "name": "string (required)",
    "customer": "string (required)",
    "environment": "dev|stg|prd (required)",
    "createdDate": "YYYY-MM-DD (required)",
    "lastModified": "YYYY-MM-DD (auto-updated)"
  },
  "subscription": {
    "id": "GUID (required)",
    "name": "string (required)",
    "tenantId": "GUID (required)",
    "resourceProviders": ["array of registered providers"]
  },
  "tags": {
    "required": ["Environment", "Stage", "Purpose"],
    "optional": []
  },
  "stages": {}
}
```

### Stage Structure

```json
{
  "stages": {
    "stage[N]": {
      "name": "string (required)",
      "description": "string (required)",
      "resourceGroups": {
        "group[N]": {
          "name": "rg-{uid}-{purpose} (required)",
          "location": "string (required)",
          "tags": {
            "Environment": "Dev|Stg|Prd",
            "Stage": "Stage [N]",
            "Purpose": "string"
          }
        }
      },
      "managedIdentities": {
        "[identityKey]": {
          "name": "string (required)",
          "id": "full resource ID (required)",
          "clientId": "GUID",
          "principalId": "GUID (required for RBAC)"
        }
      },
      "resources": {
        "[resourceKey]": {
          "name": "string (required)",
          "id": "full resource ID (required)",
          "resourceGroup": "string (required)",
          "...additionalProperties": "as needed"
        }
      }
    }
  }
}
```

### Resource Key Naming Convention

| Azure Service | Resource Key | Required Properties |
|---------------|--------------|---------------------|
| Key Vault | `keyVault` | name, id, resourceGroup, vaultUri |
| App Insights | `appInsights` | name, id, resourceGroup, instrumentationKey, connectionString |
| Log Analytics | `logAnalytics` | name, id, resourceGroup, workspaceId |
| Storage Account | `storageAccount` | name, id, resourceGroup, primaryEndpoints |
| Azure SQL | `azureSql` | name, id, resourceGroup, serverFqdn, databaseName |
| Cosmos DB | `cosmosDb` | name, id, resourceGroup, endpoint, databaseName |
| Redis Cache | `redisCache` | name, id, resourceGroup, hostName, port |
| Service Bus | `serviceBus` | name, id, resourceGroup, endpoint |
| Container Registry | `containerRegistry` | name, id, resourceGroup, loginServer |
| Container App Env | `containerAppEnv` | name, id, resourceGroup |
| Container App | `containerApp` | name, id, resourceGroup, url, fqdn |
| Azure Functions | `functions` | name, id, resourceGroup, defaultHostName |
| Web App | `webApp` | name, id, resourceGroup, defaultHostName |
| API Management | `apiManagement` | name, id, resourceGroup, gatewayUrl |
| Azure OpenAI | `azureOpenAI` | name, id, resourceGroup, endpoint, deployments[] |
| User Managed Identity | (in managedIdentities) | name, id, clientId, principalId |

---

## Procedures

### 1. Validate Configuration

Run validation checks on `concept/AZURE_CONFIG.json`:

```bash
# Check file exists
if [ ! -f "concept/AZURE_CONFIG.json" ]; then
  echo "ERROR: concept/AZURE_CONFIG.json not found"
  exit 1
fi

# Validate JSON syntax
jq empty concept/AZURE_CONFIG.json 2>/dev/null
if [ $? -ne 0 ]; then
  echo "ERROR: Invalid JSON syntax"
  exit 1
fi

# Check required root properties
jq -e '.project.name and .project.customer and .project.environment' concept/AZURE_CONFIG.json > /dev/null
jq -e '.subscription.id and .subscription.tenantId' concept/AZURE_CONFIG.json > /dev/null

# Check stages exist
STAGE_COUNT=$(jq '.stages | keys | length' concept/AZURE_CONFIG.json)
if [ "$STAGE_COUNT" -eq 0 ]; then
  echo "WARNING: No stages defined"
fi

echo "Validation passed"
```

### 2. Sync from Azure (Post-Deployment)

After running `deploy.sh`, verify resources match:

```bash
# For each resource in config, verify it exists in Azure
jq -r '.stages[].resources | to_entries[] | "\(.key) \(.value.id)"' concept/AZURE_CONFIG.json | while read key id; do
  if [ -n "$id" ] && [ "$id" != "null" ]; then
    az resource show --ids "$id" --query "name" -o tsv 2>/dev/null
    if [ $? -ne 0 ]; then
      echo "WARNING: Resource $key ($id) not found in Azure"
    fi
  fi
done
```

### 3. Add New Resource

When adding a resource to the config:

```bash
# Example: Add a new storage account to stage2
jq '.stages.stage2.resources.storageAccount = {
  "name": "stmyappstorage",
  "id": "/subscriptions/.../resourceGroups/.../providers/Microsoft.Storage/storageAccounts/stmyappstorage",
  "resourceGroup": "rg-myapp-data",
  "primaryEndpoints": {
    "blob": "https://stmyappstorage.blob.core.windows.net/",
    "queue": "https://stmyappstorage.queue.core.windows.net/",
    "table": "https://stmyappstorage.table.core.windows.net/"
  }
}' concept/AZURE_CONFIG.json > /tmp/config.json && mv /tmp/config.json concept/AZURE_CONFIG.json

# Update lastModified
jq '.project.lastModified = now | strftime("%Y-%m-%d")' concept/AZURE_CONFIG.json > /tmp/config.json && mv /tmp/config.json concept/AZURE_CONFIG.json
```

### 4. Query Resources

Standard queries for agents:

```bash
# Get resource by key
jq -r '.stages.stage1.resources.keyVault.name' concept/AZURE_CONFIG.json

# Get all resources in a stage
jq '.stages.stage2.resources | keys[]' concept/AZURE_CONFIG.json

# Get managed identity principal ID
jq -r '.stages.stage1.managedIdentities.appIdentity.principalId' concept/AZURE_CONFIG.json

# Get all resource groups
jq -r '.stages[].resourceGroups[].name' concept/AZURE_CONFIG.json

# Find resource by name pattern
jq -r '.stages[].resources | to_entries[] | select(.value.name | contains("sql")) | .value' concept/AZURE_CONFIG.json
```

### 5. Update Last Modified

Always update when making changes:

```bash
jq '.project.lastModified = (now | strftime("%Y-%m-%d"))' concept/AZURE_CONFIG.json > /tmp/config.json && mv /tmp/config.json concept/AZURE_CONFIG.json
```

---

## Validation Rules

| Rule | Check | Severity |
|------|-------|----------|
| JSON Valid | `jq empty` succeeds | ERROR |
| Project Name | `.project.name` exists and non-empty | ERROR |
| Subscription ID | `.subscription.id` is valid GUID | ERROR |
| Environment Value | `.project.environment` is dev/stg/prd | ERROR |
| Stage Names | Each stage has `.name` and `.description` | WARNING |
| Resource IDs | All `.id` fields are full ARM resource IDs | WARNING |
| Resource Groups | All resources have `.resourceGroup` | WARNING |
| Managed Identity PIDs | All MIs have `.principalId` for RBAC | WARNING |
| No Secrets | No connection strings, keys, or passwords | ERROR |

---

## Integration with Agents

| Agent | Uses Config For |
|-------|-----------------|
| `cloud-architect` | Owns and updates config; reads for architecture decisions |
| `[service]-architect` | Reads resource details for service design |
| `[service]-developer` | Reads endpoints, names for application code |
| `[service]-terraform` | Reads existing resources to avoid conflicts |
| `[service]-bicep` | Reads existing resources to avoid conflicts |
| `document-writer` | Reads for documentation generation |
| `cost-analyst` | Reads SKUs, configurations for cost estimates |

---

## Error Recovery

### Config File Missing

```bash
# Copy from template
cp .claude/templates/AZURE_CONFIG.json concept/AZURE_CONFIG.json
echo "Created new AZURE_CONFIG.json from template - populate with project details"
```

### Config Out of Sync

```bash
# List deployed resource groups
az group list --query "[?tags.Project=='${PROJECT_NAME}'].name" -o tsv

# Compare with config
jq -r '.stages[].resourceGroups[].name' concept/AZURE_CONFIG.json

# Manual reconciliation required
```

### Invalid JSON

```bash
# Find syntax error
python3 -c "import json; json.load(open('concept/AZURE_CONFIG.json'))"

# Or use jq with verbose error
jq '.' concept/AZURE_CONFIG.json
```
