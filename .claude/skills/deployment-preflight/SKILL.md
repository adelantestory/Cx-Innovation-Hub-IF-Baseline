# Deployment Preflight Skill

## Purpose

Validates all prerequisites before executing each deployment stage. Prevents failed deployments by checking resource provider registration, quota availability, naming conflicts, regional availability, and configuration completeness. Saves time and reduces frustration during the deployment phase.

## When to Use

- **Before any `deploy.sh` execution** — Run full preflight check
- **Before deploying a specific stage** — Run stage-specific checks
- **After infrastructure changes** — Validate new requirements
- **When deployment fails** — Diagnose common issues
- **New Azure subscription** — Verify subscription readiness

## Triggers

- `cloud-architect` prepares for deployment (Stage 8)
- Human is about to run `deploy.sh`
- Deployment failure occurs
- New stage added to architecture
- Subscription or region changes

---

## Preflight Check Categories

| Category | What It Checks | Failure Impact |
|----------|----------------|----------------|
| **Authentication** | Azure CLI login, subscription access | Deployment won't start |
| **Resource Providers** | Required providers registered | Resources fail to create |
| **Quotas** | vCPU, storage, service limits | Deployment errors mid-way |
| **Naming** | Naming conflicts, conventions | Duplicate name errors |
| **Regional Availability** | Service availability in region | Resources unavailable |
| **Soft-Deleted Resources** | Key Vault, Cognitive Services | Name conflicts |
| **Configuration** | AZURE_CONFIG.json completeness | Script errors |
| **Dependencies** | Required tools installed | Script failures |

---

## Preflight Procedures

### 1. Authentication Check

```bash
#!/bin/bash
echo "=== Authentication Check ==="

# Check Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not installed"
    echo "   Install: brew install azure-cli (macOS) or https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi
echo "✅ Azure CLI installed"

# Check logged in
ACCOUNT=$(az account show 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Azure"
    echo "   Run: az login"
    exit 1
fi
echo "✅ Logged in to Azure"

# Check subscription
CURRENT_SUB=$(echo $ACCOUNT | jq -r '.id')
EXPECTED_SUB=$(jq -r '.subscription.id' concept/AZURE_CONFIG.json 2>/dev/null)

if [ -n "$EXPECTED_SUB" ] && [ "$CURRENT_SUB" != "$EXPECTED_SUB" ]; then
    echo "⚠️  Current subscription ($CURRENT_SUB) differs from config ($EXPECTED_SUB)"
    echo "   Run: az account set --subscription $EXPECTED_SUB"
else
    echo "✅ Subscription: $(echo $ACCOUNT | jq -r '.name')"
fi
```

### 2. Resource Provider Check

```bash
#!/bin/bash
echo "=== Resource Provider Check ==="

# Common providers needed for Innovation Factory projects
REQUIRED_PROVIDERS=(
    "Microsoft.Web"
    "Microsoft.Storage"
    "Microsoft.Sql"
    "Microsoft.DocumentDB"
    "Microsoft.Cache"
    "Microsoft.ServiceBus"
    "Microsoft.KeyVault"
    "Microsoft.Insights"
    "Microsoft.OperationalInsights"
    "Microsoft.ContainerRegistry"
    "Microsoft.App"
    "Microsoft.ManagedIdentity"
    "Microsoft.CognitiveServices"
    "Microsoft.ApiManagement"
)

# Get providers from AZURE_CONFIG.json if available
if [ -f "concept/AZURE_CONFIG.json" ]; then
    CONFIG_PROVIDERS=$(jq -r '.subscription.resourceProviders[]?' concept/AZURE_CONFIG.json 2>/dev/null)
    if [ -n "$CONFIG_PROVIDERS" ]; then
        REQUIRED_PROVIDERS=($CONFIG_PROVIDERS)
    fi
fi

FAILED=0
for provider in "${REQUIRED_PROVIDERS[@]}"; do
    STATE=$(az provider show --namespace $provider --query "registrationState" -o tsv 2>/dev/null)
    if [ "$STATE" == "Registered" ]; then
        echo "✅ $provider: Registered"
    elif [ "$STATE" == "Registering" ]; then
        echo "⏳ $provider: Registering (wait and retry)"
    else
        echo "❌ $provider: Not registered"
        echo "   Run: az provider register --namespace $provider"
        FAILED=1
    fi
done

if [ $FAILED -eq 1 ]; then
    echo ""
    echo "Register all missing providers:"
    echo "az provider register --namespace Microsoft.Web"
    echo "# ... repeat for each missing provider"
fi
```

### 3. Quota Check

```bash
#!/bin/bash
echo "=== Quota Check ==="

LOCATION=$(jq -r '.stages.stage1.resourceGroups.group1.location // "eastus"' concept/AZURE_CONFIG.json 2>/dev/null)
LOCATION=${LOCATION:-"eastus"}

echo "Checking quotas in region: $LOCATION"

# Check VM/Compute quotas (relevant for App Service, Container Apps)
echo ""
echo "Compute Quotas:"
az vm list-usage --location $LOCATION --query "[?contains(name.value, 'cores')].{Name:name.localizedValue, Current:currentValue, Limit:limit}" -o table 2>/dev/null | head -10

# Check Storage Account limit
echo ""
echo "Storage Account Quota:"
STORAGE_COUNT=$(az storage account list --query "length([?location=='$LOCATION'])" -o tsv 2>/dev/null)
echo "Current storage accounts in $LOCATION: $STORAGE_COUNT (limit: 250)"

# Check Cognitive Services availability
echo ""
echo "Cognitive Services Availability:"
az cognitiveservices account list-skus --location $LOCATION --query "[?kind=='OpenAI'].{Kind:kind, SKU:name}" -o table 2>/dev/null | head -5
if [ $? -ne 0 ]; then
    echo "⚠️  Azure OpenAI may not be available in $LOCATION"
fi
```

### 4. Naming Conflict Check

```bash
#!/bin/bash
echo "=== Naming Conflict Check ==="

# Get UID from config or parameter
UID_NAME=$(jq -r '.project.name // "myapp"' concept/AZURE_CONFIG.json 2>/dev/null | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

# Check globally unique names
echo ""
echo "Checking globally unique resource names..."

# Storage Account (must be globally unique, 3-24 chars, lowercase alphanumeric only)
STORAGE_NAME="st${UID_NAME}data" | tr -d '-' | cut -c1-24
STORAGE_AVAILABLE=$(az storage account check-name --name $STORAGE_NAME --query "nameAvailable" -o tsv 2>/dev/null)
if [ "$STORAGE_AVAILABLE" == "true" ]; then
    echo "✅ Storage account name available: $STORAGE_NAME"
else
    echo "❌ Storage account name taken: $STORAGE_NAME"
    REASON=$(az storage account check-name --name $STORAGE_NAME --query "reason" -o tsv 2>/dev/null)
    echo "   Reason: $REASON"
fi

# Key Vault (must be globally unique)
KV_NAME="kv-${UID_NAME}"
# Note: There's no direct CLI command to check Key Vault name availability
# We check if it exists or is soft-deleted
KV_EXISTS=$(az keyvault show --name $KV_NAME 2>/dev/null)
if [ -z "$KV_EXISTS" ]; then
    KV_DELETED=$(az keyvault list-deleted --query "[?name=='$KV_NAME']" -o tsv 2>/dev/null)
    if [ -n "$KV_DELETED" ]; then
        echo "❌ Key Vault is soft-deleted: $KV_NAME"
        echo "   Run: az keyvault purge --name $KV_NAME"
    else
        echo "✅ Key Vault name available: $KV_NAME"
    fi
else
    echo "⚠️  Key Vault already exists: $KV_NAME"
fi

# Container Registry (must be globally unique, alphanumeric only)
ACR_NAME="acr${UID_NAME}" | tr -d '-'
ACR_AVAILABLE=$(az acr check-name --name $ACR_NAME --query "nameAvailable" -o tsv 2>/dev/null)
if [ "$ACR_AVAILABLE" == "true" ]; then
    echo "✅ Container Registry name available: $ACR_NAME"
else
    echo "❌ Container Registry name taken: $ACR_NAME"
fi

# Cognitive Services / Azure OpenAI (check for soft-deleted)
echo ""
echo "Checking for soft-deleted Cognitive Services..."
az cognitiveservices account list-deleted -o table 2>/dev/null | grep -i "$UID_NAME" && echo "⚠️  Found soft-deleted Cognitive Services with matching name"
```

### 5. Regional Availability Check

```bash
#!/bin/bash
echo "=== Regional Availability Check ==="

LOCATION=$(jq -r '.stages.stage1.resourceGroups.group1.location // "eastus"' concept/AZURE_CONFIG.json 2>/dev/null)
LOCATION=${LOCATION:-"eastus"}

echo "Checking service availability in: $LOCATION"

# Define services to check based on AZURE_CONFIG.json resources
declare -A SERVICE_MAP=(
    ["keyVault"]="Microsoft.KeyVault"
    ["storageAccount"]="Microsoft.Storage"
    ["azureSql"]="Microsoft.Sql"
    ["cosmosDb"]="Microsoft.DocumentDB"
    ["redisCache"]="Microsoft.Cache"
    ["serviceBus"]="Microsoft.ServiceBus"
    ["containerRegistry"]="Microsoft.ContainerRegistry"
    ["containerApp"]="Microsoft.App"
    ["functions"]="Microsoft.Web"
    ["webApp"]="Microsoft.Web"
    ["azureOpenAI"]="Microsoft.CognitiveServices"
    ["appInsights"]="Microsoft.Insights"
)

# Get resources from AZURE_CONFIG.json
RESOURCES=$(jq -r '.stages[].resources | keys[]' concept/AZURE_CONFIG.json 2>/dev/null | sort -u)

for resource in $RESOURCES; do
    NAMESPACE=${SERVICE_MAP[$resource]}
    if [ -n "$NAMESPACE" ]; then
        AVAILABLE=$(az provider show --namespace $NAMESPACE --query "resourceTypes[0].locations" -o tsv 2>/dev/null | grep -i "$LOCATION")
        if [ -n "$AVAILABLE" ]; then
            echo "✅ $resource ($NAMESPACE): Available in $LOCATION"
        else
            echo "❌ $resource ($NAMESPACE): May not be available in $LOCATION"
        fi
    fi
done

# Special check for Azure OpenAI regions
echo ""
echo "Azure OpenAI recommended regions: eastus, eastus2, westus, westus3, northcentralus, southcentralus, westeurope, swedencentral"
```

### 6. Soft-Deleted Resource Check

```bash
#!/bin/bash
echo "=== Soft-Deleted Resource Check ==="

# Key Vaults
echo ""
echo "Soft-deleted Key Vaults:"
az keyvault list-deleted --query "[].{Name:name, Location:properties.location, DeletedDate:properties.deletionDate}" -o table 2>/dev/null

# Cognitive Services
echo ""
echo "Soft-deleted Cognitive Services:"
az cognitiveservices account list-deleted -o table 2>/dev/null

# API Management (if used)
echo ""
echo "Soft-deleted API Management:"
az apim deletedservice list -o table 2>/dev/null

echo ""
echo "To purge soft-deleted resources:"
echo "  az keyvault purge --name <name> --location <location>"
echo "  az cognitiveservices account purge --name <name> --resource-group <rg> --location <location>"
```

### 7. Configuration Completeness Check

```bash
#!/bin/bash
echo "=== Configuration Check ==="

CONFIG_FILE="concept/AZURE_CONFIG.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ AZURE_CONFIG.json not found at $CONFIG_FILE"
    echo "   Copy from template: cp .claude/templates/AZURE_CONFIG.json concept/"
    exit 1
fi
echo "✅ AZURE_CONFIG.json exists"

# Validate JSON
jq empty $CONFIG_FILE 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ AZURE_CONFIG.json is not valid JSON"
    exit 1
fi
echo "✅ AZURE_CONFIG.json is valid JSON"

# Check required fields
REQUIRED_FIELDS=(
    ".project.name"
    ".project.customer"
    ".project.environment"
    ".subscription.id"
    ".subscription.tenantId"
)

for field in "${REQUIRED_FIELDS[@]}"; do
    VALUE=$(jq -r "$field" $CONFIG_FILE 2>/dev/null)
    if [ -z "$VALUE" ] || [ "$VALUE" == "null" ]; then
        echo "❌ Missing required field: $field"
    else
        echo "✅ $field: $VALUE"
    fi
done

# Check stages defined
STAGE_COUNT=$(jq '.stages | keys | length' $CONFIG_FILE 2>/dev/null)
if [ "$STAGE_COUNT" -eq 0 ] || [ -z "$STAGE_COUNT" ]; then
    echo "⚠️  No stages defined in AZURE_CONFIG.json"
else
    echo "✅ Stages defined: $STAGE_COUNT"
fi
```

### 8. Tool Dependencies Check

```bash
#!/bin/bash
echo "=== Tool Dependencies Check ==="

# Required tools
TOOLS=(
    "az:Azure CLI"
    "jq:JSON processor"
    "git:Version control"
)

# Optional tools based on project
OPTIONAL_TOOLS=(
    "terraform:Terraform CLI"
    "docker:Docker"
    "sqlcmd:SQL Server CLI"
    "func:Azure Functions Core Tools"
)

echo "Required tools:"
for tool_entry in "${TOOLS[@]}"; do
    IFS=':' read -r tool name <<< "$tool_entry"
    if command -v $tool &> /dev/null; then
        VERSION=$($tool --version 2>/dev/null | head -1)
        echo "✅ $name: $VERSION"
    else
        echo "❌ $name not installed"
    fi
done

echo ""
echo "Optional tools (based on project needs):"
for tool_entry in "${OPTIONAL_TOOLS[@]}"; do
    IFS=':' read -r tool name <<< "$tool_entry"
    if command -v $tool &> /dev/null; then
        VERSION=$($tool --version 2>/dev/null | head -1)
        echo "✅ $name: $VERSION"
    else
        echo "⚪ $name not installed (may be needed)"
    fi
done
```

---

## Complete Preflight Script

```bash
#!/bin/bash
# preflight.sh - Run all preflight checks before deployment

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         DEPLOYMENT PREFLIGHT CHECK                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Track overall status
ERRORS=0
WARNINGS=0

run_check() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    "$@"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Run all checks
run_check check_authentication
run_check check_resource_providers
run_check check_naming_conflicts
run_check check_soft_deleted
run_check check_configuration
run_check check_tools

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    PREFLIGHT SUMMARY                       ║"
echo "╚════════════════════════════════════════════════════════════╝"

if [ $ERRORS -gt 0 ]; then
    echo "❌ FAILED: $ERRORS errors found. Fix before deploying."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo "⚠️  PASSED WITH WARNINGS: $WARNINGS warnings. Review before deploying."
    exit 0
else
    echo "✅ PASSED: All preflight checks successful. Ready to deploy!"
    exit 0
fi
```

---

## Stage-Specific Checks

### Before Stage 1 (Foundation)

```bash
# Foundation typically includes: Key Vault, Log Analytics, App Insights, Managed Identity
echo "Stage 1 Preflight: Foundation"
# - Check Key Vault soft-delete status
# - Check Log Analytics workspace quota
# - Verify Microsoft.KeyVault, Microsoft.OperationalInsights, Microsoft.Insights providers
```

### Before Stage 2 (Data)

```bash
# Data typically includes: Storage, SQL, Cosmos DB, Redis
echo "Stage 2 Preflight: Data"
# - Check storage account name availability
# - Check SQL DTU quota
# - Check Cosmos DB account limit
# - Verify data service providers
```

### Before Stage 3 (Messaging)

```bash
# Messaging typically includes: Service Bus, Event Grid
echo "Stage 3 Preflight: Messaging"
# - Check Service Bus namespace limit
# - Verify messaging providers
```

### Before Stage 4 (Compute)

```bash
# Compute typically includes: Functions, Web Apps, Container Apps
echo "Stage 4 Preflight: Compute"
# - Check App Service plan limits
# - Check Container Apps environment quota
# - Verify compute providers
```

### Before Stage 5 (AI/Cognitive)

```bash
# AI typically includes: Azure OpenAI, Cognitive Services
echo "Stage 5 Preflight: AI Services"
# - Check Azure OpenAI regional availability
# - Check for soft-deleted Cognitive Services
# - Verify model deployment quota
```

---

## Common Issues and Resolutions

| Issue | Detection | Resolution |
|-------|-----------|------------|
| Not logged in | `az account show` fails | `az login` |
| Wrong subscription | Subscription ID mismatch | `az account set --subscription <id>` |
| Provider not registered | Registration state != "Registered" | `az provider register --namespace <ns>` |
| Name taken | check-name returns false | Change UID or resource name |
| Soft-deleted conflict | Resource in deleted list | Purge or use different name |
| Regional unavailability | Service not in region list | Change region or use alternate service |
| Quota exceeded | Current >= Limit | Request quota increase or reduce scale |

---

## Integration with Agents

| Agent | Usage |
|-------|-------|
| `cloud-architect` | Runs preflight before finalizing architecture |
| `subscription-expert` | Diagnoses subscription-level issues |
| `[service]-terraform` | Validates providers before `terraform apply` |
| `[service]-bicep` | Validates providers before `az deployment` |

---

## Validation Checklist

Before running `deploy.sh`:

- [ ] Azure CLI logged in to correct subscription
- [ ] All required resource providers registered
- [ ] No naming conflicts detected
- [ ] No soft-deleted resources blocking names
- [ ] AZURE_CONFIG.json valid and complete
- [ ] Required tools installed
- [ ] Sufficient quota for planned resources
- [ ] Target region supports all required services
