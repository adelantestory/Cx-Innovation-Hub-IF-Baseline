# Managed Identity Mapper Skill

## Purpose

Tracks, validates, and documents all Managed Identity to Azure Resource role assignments. Ensures the "no connection strings or access keys" constraint is enforced by maintaining a complete map of RBAC assignments required for service-to-service authentication.

## When to Use

- **After adding a new Azure service** — Determine required RBAC assignments
- **When designing service communication** — Map which identities need access to which resources
- **Before deployment** — Generate RBAC assignment commands
- **During troubleshooting** — Verify identity has required permissions
- **Pre-handoff validation** — Ensure all assignments are documented

## Triggers

- `cloud-architect` adds a new service to the architecture
- `[service]-architect` defines service dependencies
- Application code references an Azure resource
- Authentication/authorization errors occur
- Documentation generation for AS_BUILT.md

---

## RBAC Reference Matrix

### Common Azure Services and Required Roles

| Service Being Accessed | Role for Read | Role for Read/Write | Role for Full Control |
|------------------------|---------------|---------------------|----------------------|
| **Blob Storage** | Storage Blob Data Reader | Storage Blob Data Contributor | Storage Blob Data Owner |
| **Queue Storage** | Storage Queue Data Reader | Storage Queue Data Contributor | Storage Queue Data Contributor |
| **Table Storage** | Storage Table Data Reader | Storage Table Data Contributor | Storage Table Data Contributor |
| **Key Vault (Secrets)** | Key Vault Secrets User | Key Vault Secrets Officer | Key Vault Administrator |
| **Key Vault (Keys)** | Key Vault Crypto User | Key Vault Crypto Officer | Key Vault Administrator |
| **Key Vault (Certs)** | Key Vault Certificates Officer | Key Vault Certificates Officer | Key Vault Administrator |
| **Cosmos DB** | Cosmos DB Account Reader | Cosmos DB Data Contributor | Cosmos DB Account Contributor |
| **Azure SQL** | N/A (use DB roles) | N/A (use DB roles) | SQL DB Contributor |
| **Service Bus** | Azure Service Bus Data Receiver | Azure Service Bus Data Sender | Azure Service Bus Data Owner |
| **Azure OpenAI** | Cognitive Services User | Cognitive Services User | Cognitive Services Contributor |
| **App Configuration** | App Configuration Data Reader | App Configuration Data Owner | App Configuration Data Owner |
| **Event Hubs** | Azure Event Hubs Data Receiver | Azure Event Hubs Data Sender | Azure Event Hubs Data Owner |
| **Container Registry** | AcrPull | AcrPush | AcrPush + AcrDelete |

### Azure SQL Database Roles (via T-SQL, not ARM RBAC)

```sql
-- Read-only access
CREATE USER [<managed-identity-name>] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [<managed-identity-name>];

-- Read/Write access
CREATE USER [<managed-identity-name>] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [<managed-identity-name>];
ALTER ROLE db_datawriter ADD MEMBER [<managed-identity-name>];

-- Execute stored procedures
GRANT EXECUTE TO [<managed-identity-name>];
```

---

## Identity Assignment Tracking

### Assignment Record Schema

Track all assignments in `concept/AZURE_CONFIG.json` under each stage:

```json
{
  "stages": {
    "stage[N]": {
      "managedIdentities": {
        "[identityKey]": {
          "name": "id-myapp-api",
          "id": "/subscriptions/.../resourceGroups/.../providers/Microsoft.ManagedIdentity/userAssignedIdentities/id-myapp-api",
          "clientId": "00000000-0000-0000-0000-000000000000",
          "principalId": "00000000-0000-0000-0000-000000000000",
          "assignedTo": ["containerApp", "functions"],
          "roleAssignments": [
            {
              "resource": "storageAccount",
              "resourceId": "/subscriptions/.../resourceGroups/.../providers/Microsoft.Storage/storageAccounts/stmyapp",
              "role": "Storage Blob Data Contributor",
              "roleDefinitionId": "ba92f5b4-2d11-453d-a403-e96b0029c9fe",
              "scope": "resource",
              "purpose": "Read/write blob containers for document processing"
            },
            {
              "resource": "keyVault",
              "resourceId": "/subscriptions/.../resourceGroups/.../providers/Microsoft.KeyVault/vaults/kv-myapp",
              "role": "Key Vault Secrets User",
              "roleDefinitionId": "4633458b-17de-408a-b874-0445c86b69e6",
              "scope": "resource",
              "purpose": "Read secrets for application configuration"
            }
          ]
        }
      }
    }
  }
}
```

---

## Procedures

### 1. Identify Required Assignments

When a service needs to access another resource:

```bash
# Questions to answer:
# 1. What identity will the service use? (System-assigned or User-assigned MI)
# 2. What resource does it need to access?
# 3. What operations does it need? (read, write, delete, execute)
# 4. What is the minimum role that grants those permissions?

# Example: Container App needs to read blobs and write to queue
# Identity: id-myapp-processor (user-assigned)
# Resources: Storage Account (blobs + queues)
# Operations: Read blobs, write to queue
# Roles needed:
#   - Storage Blob Data Reader (on storage account)
#   - Storage Queue Data Contributor (on storage account)
```

### 2. Generate RBAC Assignment Commands

```bash
# Get identity principal ID from config
PRINCIPAL_ID=$(jq -r '.stages.stage1.managedIdentities.appIdentity.principalId' concept/AZURE_CONFIG.json)
SUBSCRIPTION_ID=$(jq -r '.subscription.id' concept/AZURE_CONFIG.json)

# Storage Blob Data Contributor
STORAGE_ID=$(jq -r '.stages.stage2.resources.storageAccount.id' concept/AZURE_CONFIG.json)
az role assignment create \
    --assignee $PRINCIPAL_ID \
    --role "Storage Blob Data Contributor" \
    --scope $STORAGE_ID

# Key Vault Secrets User
KV_ID=$(jq -r '.stages.stage1.resources.keyVault.id' concept/AZURE_CONFIG.json)
az role assignment create \
    --assignee $PRINCIPAL_ID \
    --role "Key Vault Secrets User" \
    --scope $KV_ID

# Cosmos DB Data Contributor (custom - use built-in ID)
COSMOS_ID=$(jq -r '.stages.stage2.resources.cosmosDb.id' concept/AZURE_CONFIG.json)
az role assignment create \
    --assignee $PRINCIPAL_ID \
    --role "00000000-0000-0000-0000-000000000002" \
    --scope $COSMOS_ID

# Azure OpenAI Cognitive Services User
OPENAI_ID=$(jq -r '.stages.stage3.resources.azureOpenAI.id' concept/AZURE_CONFIG.json)
az role assignment create \
    --assignee $PRINCIPAL_ID \
    --role "Cognitive Services User" \
    --scope $OPENAI_ID
```

### 3. Generate SQL Database Grants

```bash
# Get identity name and SQL details
IDENTITY_NAME=$(jq -r '.stages.stage1.managedIdentities.appIdentity.name' concept/AZURE_CONFIG.json)
SQL_SERVER=$(jq -r '.stages.stage2.resources.azureSql.serverFqdn' concept/AZURE_CONFIG.json)
SQL_DB=$(jq -r '.stages.stage2.resources.azureSql.databaseName' concept/AZURE_CONFIG.json)

# Generate SQL script
cat << EOF
-- Run this in Azure SQL Database: $SQL_DB
-- Server: $SQL_SERVER

-- Create user from managed identity
CREATE USER [$IDENTITY_NAME] FROM EXTERNAL PROVIDER;

-- Grant read access
ALTER ROLE db_datareader ADD MEMBER [$IDENTITY_NAME];

-- Grant write access
ALTER ROLE db_datawriter ADD MEMBER [$IDENTITY_NAME];

-- Grant execute on stored procedures (if needed)
GRANT EXECUTE TO [$IDENTITY_NAME];
EOF
```

### 4. Validate Existing Assignments

```bash
# Get all role assignments for an identity
PRINCIPAL_ID=$(jq -r '.stages.stage1.managedIdentities.appIdentity.principalId' concept/AZURE_CONFIG.json)

az role assignment list \
    --assignee $PRINCIPAL_ID \
    --all \
    --query "[].{Role:roleDefinitionName, Scope:scope}" \
    --output table
```

### 5. Document Assignments for AS_BUILT.md

Generate markdown table of all assignments:

```bash
echo "| Identity | Resource | Role | Purpose |"
echo "|----------|----------|------|---------|"

jq -r '
  .stages[] | 
  .managedIdentities | 
  to_entries[] | 
  .value as $mi |
  $mi.roleAssignments[]? |
  "| \($mi.name) | \(.resource) | \(.role) | \(.purpose) |"
' concept/AZURE_CONFIG.json
```

---

## Common Patterns

### Pattern 1: Web App/Function with Storage + Key Vault

```
Identity: System-assigned or User-assigned MI
Assignments:
  - Storage Account → Storage Blob Data Contributor
  - Storage Account → Storage Queue Data Contributor (if using queues)
  - Key Vault → Key Vault Secrets User
```

### Pattern 2: Container App with Cosmos DB + Service Bus

```
Identity: User-assigned MI (recommended for Container Apps)
Assignments:
  - Cosmos DB → Cosmos DB Data Contributor
  - Service Bus → Azure Service Bus Data Owner (or split Sender/Receiver)
  - Container Registry → AcrPull
```

### Pattern 3: Function with Azure OpenAI + Storage

```
Identity: System-assigned MI
Assignments:
  - Azure OpenAI → Cognitive Services User
  - Storage Account → Storage Blob Data Reader (for input)
  - Storage Account → Storage Blob Data Contributor (for output)
```

### Pattern 4: API with SQL Database + Redis

```
Identity: User-assigned MI
Assignments:
  - SQL Database → db_datareader + db_datawriter (via T-SQL)
  - Redis Cache → (Redis doesn't support MI yet - use Key Vault for connection string)
  - Key Vault → Key Vault Secrets User
```

---

## Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `AuthorizationFailed` | Missing role assignment | Add required RBAC role |
| `ForbiddenByRbac` | Role exists but wrong scope | Check scope (resource vs RG vs subscription) |
| `IdentityNotFound` | MI not assigned to compute resource | Assign MI to the service |
| `InvalidAuthenticationToken` | Using wrong identity | Verify MI client ID in app config |
| `PrincipalNotFound` | MI was deleted/recreated | Update principal ID, recreate assignments |

### Verify Identity is Assigned to Compute

```bash
# Container App
az containerapp identity show \
    --name $(jq -r '.stages.stage3.resources.containerApp.name' concept/AZURE_CONFIG.json) \
    --resource-group $(jq -r '.stages.stage3.resourceGroups.group1.name' concept/AZURE_CONFIG.json)

# Function App
az functionapp identity show \
    --name $(jq -r '.stages.stage4.resources.functions.name' concept/AZURE_CONFIG.json) \
    --resource-group $(jq -r '.stages.stage4.resourceGroups.group1.name' concept/AZURE_CONFIG.json)

# Web App
az webapp identity show \
    --name $(jq -r '.stages.stage4.resources.webApp.name' concept/AZURE_CONFIG.json) \
    --resource-group $(jq -r '.stages.stage4.resourceGroups.group1.name' concept/AZURE_CONFIG.json)
```

### Test Authentication from Compute

```bash
# Get access token using managed identity (from within the compute resource)
curl -H "Metadata: true" \
    "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://storage.azure.com/"
```

---

## Integration with Agents

| Agent | Responsibility |
|-------|----------------|
| `cloud-architect` | Designs identity strategy; updates AZURE_CONFIG.json with assignments |
| `[service]-architect` | Identifies required access for their service |
| `[service]-developer` | Uses DefaultAzureCredential in code; documents required roles |
| `[service]-terraform` | Implements `azurerm_role_assignment` resources |
| `[service]-bicep` | Implements role assignment modules |
| `document-writer` | Documents all assignments in AS_BUILT.md |

---

## Validation Checklist

- [ ] All services using Azure resources have an assigned managed identity
- [ ] All role assignments use principle of least privilege
- [ ] No connection strings or access keys in application configuration
- [ ] All assignments documented in AZURE_CONFIG.json
- [ ] SQL database users created for managed identities
- [ ] Role assignments tested with actual service calls
