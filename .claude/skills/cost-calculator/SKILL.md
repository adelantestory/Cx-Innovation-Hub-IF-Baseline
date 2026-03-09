# Cost Calculator Skill

## Purpose

Generates Azure cost estimates based on the solution architecture, resource configurations in `concept/AZURE_CONFIG.json`, and usage projections. Produces the `deliverables/COST_ESTIMATE.md` document with POC, Pilot, and Production scenarios.

## When to Use

- **After architecture design** — Estimate costs for proposed solution
- **During SOW development** — Provide cost context for customer
- **Before deployment** — Validate budget alignment
- **When architecture changes** — Update estimates
- **Final delivery** — Include in AS_BUILT documentation

## Triggers

- `cloud-architect` completes architecture design
- `cost-analyst` agent is invoked
- Customer requests cost information
- Architecture modifications occur
- Pre-handoff deliverables preparation

---

## Azure Pricing Sources

### Primary: Azure Retail Prices API

The Azure Retail Prices REST API is **public, free, and requires no authentication**. Always use this for current pricing.

**Base URL:** `https://prices.azure.com/api/retail/prices`

**Query Parameters:**
| Parameter | Description | Example |
|-----------|-------------|---------|
| `$filter` | OData filter expression | `serviceName eq 'Virtual Machines'` |
| `currencyCode` | Currency (default USD) | `USD`, `EUR`, `GBP` |
| `$skip` | Pagination offset | `100` |

### Secondary: Web Search

For pricing not available via API (e.g., Azure OpenAI token pricing, new services), use web search:

- **Azure Pricing Calculator:** https://azure.microsoft.com/en-us/pricing/calculator/
- **Service-specific pricing pages:** https://azure.microsoft.com/en-us/pricing/details/{service}/
- **Azure OpenAI pricing:** https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/

---

## Pricing API Query Patterns

### Query by Service Name

```bash
# Get all prices for a service
curl "https://prices.azure.com/api/retail/prices?\$filter=serviceName%20eq%20'Azure%20App%20Service'"

# Get prices for specific SKU
curl "https://prices.azure.com/api/retail/prices?\$filter=serviceName%20eq%20'Azure%20Cosmos%20DB'%20and%20skuName%20eq%20'Serverless'"

# Get prices for specific region
curl "https://prices.azure.com/api/retail/prices?\$filter=serviceName%20eq%20'Storage'%20and%20armRegionName%20eq%20'eastus'"
```

### Common Service Name Values

| Azure Service | API serviceName Value |
|---------------|----------------------|
| App Service | `Azure App Service` |
| Azure Functions | `Functions` |
| Container Apps | `Azure Container Apps` |
| Container Registry | `Container Registry` |
| Azure SQL | `SQL Database` |
| Cosmos DB | `Azure Cosmos DB` |
| Storage | `Storage` |
| Redis Cache | `Azure Cache for Redis` |
| Service Bus | `Service Bus` |
| Key Vault | `Key Vault` |
| Log Analytics | `Log Analytics` |
| Application Insights | `Application Insights` |
| API Management | `API Management` |
| Cognitive Services | `Cognitive Services` |

### Parse API Response

```bash
# Response structure
{
  "Items": [
    {
      "currencyCode": "USD",
      "tierMinimumUnits": 0.0,
      "retailPrice": 0.10,
      "unitPrice": 0.10,
      "armRegionName": "eastus",
      "location": "US East",
      "productName": "Standard SSD Managed Disks",
      "skuName": "E10 LRS",
      "serviceName": "Storage",
      "serviceFamily": "Storage",
      "unitOfMeasure": "1/Month",
      "type": "Consumption",
      "isPrimaryMeterRegion": true,
      "armSkuName": "Standard_E10_LRS"
    }
  ],
  "NextPageLink": "https://prices.azure.com/api/retail/prices?$skip=100"
}

# Extract with jq
curl -s "https://prices.azure.com/api/retail/prices?\$filter=serviceName%20eq%20'SQL%20Database'" | \
  jq '.Items[] | {sku: .skuName, price: .retailPrice, unit: .unitOfMeasure, region: .armRegionName}'
```

### Pricing Lookup Procedure

```bash
#!/bin/bash
# get_azure_price.sh - Lookup current Azure pricing

SERVICE="$1"
SKU="$2"
REGION="${3:-eastus}"

# URL encode the filter
FILTER="serviceName eq '$SERVICE'"
if [ -n "$SKU" ]; then
  FILTER="$FILTER and contains(skuName, '$SKU')"
fi
FILTER="$FILTER and armRegionName eq '$REGION'"

ENCODED_FILTER=$(echo "$FILTER" | jq -sRr @uri)

# Query API
RESULT=$(curl -s "https://prices.azure.com/api/retail/prices?\$filter=$ENCODED_FILTER")

# Display results
echo "$RESULT" | jq -r '.Items[] | "\(.skuName): $\(.retailPrice) per \(.unitOfMeasure)"' | head -20
```

---

## Web Search for Specialized Pricing

For services not well-covered by the Retail Prices API, search the web:

### Azure OpenAI Pricing

Search query: `"Azure OpenAI pricing" GPT-4o tokens site:azure.microsoft.com`

Key pricing page: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/

Extract:
- Input token price per 1M tokens
- Output token price per 1M tokens
- PTU (Provisioned Throughput Unit) monthly cost

### Container Apps Pricing

Search query: `"Azure Container Apps pricing" consumption site:azure.microsoft.com`

Key pricing page: https://azure.microsoft.com/en-us/pricing/details/container-apps/

Extract:
- vCPU per second cost
- Memory per GiB-second cost
- Request cost

### Reserved Instance Pricing

Search query: `"Azure reserved instances" {service} 1-year 3-year savings`

---

## Cost Estimation Procedures

### 1. Extract Resources from AZURE_CONFIG.json

```bash
# List all resources and their types
jq -r '
  .stages[] | 
  .resources | 
  to_entries[] | 
  "\(.key): \(.value.name // "TBD")"
' concept/AZURE_CONFIG.json

# Get SKUs where available
jq -r '
  .stages[] | 
  .resources | 
  to_entries[] | 
  select(.value.sku != null) |
  "\(.key): \(.value.sku)"
' concept/AZURE_CONFIG.json

# Get region for pricing
REGION=$(jq -r '.stages.stage1.resourceGroups.group1.location // "eastus"' concept/AZURE_CONFIG.json)
```

### 2. Lookup Current Prices via API

```bash
#!/bin/bash
# lookup_project_costs.sh - Get current prices for all project resources

REGION=$(jq -r '.stages.stage1.resourceGroups.group1.location // "eastus"' concept/AZURE_CONFIG.json)

# Map resource types to API service names
declare -A SERVICE_MAP=(
    ["keyVault"]="Key Vault"
    ["storageAccount"]="Storage"
    ["azureSql"]="SQL Database"
    ["cosmosDb"]="Azure Cosmos DB"
    ["redisCache"]="Azure Cache for Redis"
    ["serviceBus"]="Service Bus"
    ["containerRegistry"]="Container Registry"
    ["containerApp"]="Azure Container Apps"
    ["functions"]="Functions"
    ["webApp"]="Azure App Service"
    ["appInsights"]="Application Insights"
    ["logAnalytics"]="Log Analytics"
    ["apiManagement"]="API Management"
)

# For each resource in config, lookup current pricing
for resource in $(jq -r '.stages[].resources | keys[]' concept/AZURE_CONFIG.json | sort -u); do
    SERVICE_NAME="${SERVICE_MAP[$resource]}"
    SKU=$(jq -r ".stages[].resources.$resource.sku // empty" concept/AZURE_CONFIG.json | head -1)
    
    if [ -n "$SERVICE_NAME" ]; then
        echo "=== $resource ($SERVICE_NAME) ==="
        
        FILTER="serviceName eq '$SERVICE_NAME' and armRegionName eq '$REGION'"
        if [ -n "$SKU" ]; then
            FILTER="$FILTER and contains(skuName, '$SKU')"
        fi
        
        ENCODED=$(echo "$FILTER" | jq -sRr @uri)
        curl -s "https://prices.azure.com/api/retail/prices?\$filter=$ENCODED" | \
            jq -r '.Items[:5][] | "  \(.skuName): $\(.retailPrice) per \(.unitOfMeasure)"'
        echo ""
    fi
done
```

### 3. Calculate Per-Service Costs

For each service, calculate based on current API prices:

```markdown
## Service: [SERVICE_NAME]

### Current Pricing (from Azure Retail Prices API)
- Query Date: [DATE]
- Region: [REGION]
- SKU: [SKU]
- Base Price: $[PRICE] per [UNIT]

### Configuration
- SKU: [From AZURE_CONFIG.json or architecture doc]
- Region: [Location affects pricing]
- Quantity: [Number of instances]

### Usage Assumptions
| Scenario | Metric | Value |
|----------|--------|-------|
| POC | [e.g., requests/day] | [value] |
| Pilot | [e.g., requests/day] | [value] |
| Production | [e.g., requests/day] | [value] |

### Cost Calculation
| Scenario | Base Cost | Usage Cost | Total |
|----------|-----------|------------|-------|
| POC | $[base] | $[usage] | $[total] |
| Pilot | $[base] | $[usage] | $[total] |
| Production | $[base] | $[usage] | $[total] |
```

### 4. Azure OpenAI Cost Estimation

**First, get current pricing via web search:**

Search: `"Azure OpenAI pricing" GPT-4o site:azure.microsoft.com`

Or fetch the pricing page: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/

```bash
# After obtaining current prices from web search, calculate:
OPERATIONS_PER_DAY=1000
AVG_INPUT_TOKENS=2000
AVG_OUTPUT_TOKENS=500
DAYS_PER_MONTH=30

# Get current prices from search (example values - ALWAYS verify current prices)
INPUT_PRICE_PER_1M=5.00    # Replace with current price
OUTPUT_PRICE_PER_1M=15.00  # Replace with current price

# Calculate monthly cost
INPUT_COST=$(echo "scale=2; $OPERATIONS_PER_DAY * $AVG_INPUT_TOKENS * $DAYS_PER_MONTH * $INPUT_PRICE_PER_1M / 1000000" | bc)
OUTPUT_COST=$(echo "scale=2; $OPERATIONS_PER_DAY * $AVG_OUTPUT_TOKENS * $DAYS_PER_MONTH * $OUTPUT_PRICE_PER_1M / 1000000" | bc)
TOTAL_OPENAI=$(echo "scale=2; $INPUT_COST + $OUTPUT_COST" | bc)

echo "Monthly Azure OpenAI Cost: \$$TOTAL_OPENAI"
```

### 5. Storage Cost Estimation

```bash
# Get current storage pricing
REGION="eastus"
curl -s "https://prices.azure.com/api/retail/prices?\$filter=serviceName%20eq%20'Storage'%20and%20armRegionName%20eq%20'$REGION'%20and%20contains(skuName,%20'Hot%20LRS')" | \
    jq '.Items[] | select(.productName | contains("Blob")) | {sku: .skuName, price: .retailPrice, unit: .unitOfMeasure}'

# Calculate with current price
INITIAL_GB=10
MONTHLY_GROWTH_GB=5
MONTHS=12
COST_PER_GB=0.02  # Replace with value from API

TOTAL_GB=$(echo "scale=0; $INITIAL_GB + ($MONTHLY_GROWTH_GB * $MONTHS / 2)" | bc)
STORAGE_COST=$(echo "scale=2; $TOTAL_GB * $COST_PER_GB" | bc)

echo "Average Monthly Storage Cost: \$$STORAGE_COST"
```

### 6. Generate Cost Summary Table

```markdown
## Monthly Cost Summary

| Service | POC | Pilot | Production |
|---------|-----|-------|------------|
| Compute | $X | $X | $X |
| Data Storage | $X | $X | $X |
| Messaging | $X | $X | $X |
| AI Services | $X | $X | $X |
| Monitoring | $X | $X | $X |
| Security | $X | $X | $X |
| **Total** | **$X** | **$X** | **$X** |
```

---

## Cost Optimization Recommendations

### Standard Recommendations

```markdown
## Cost Optimization Opportunities

### Immediate Savings
1. **Right-size compute resources**
   - Start with minimum SKUs for POC
   - Scale based on actual usage metrics
   - Use consumption-based services where possible

2. **Optimize AI costs**
   - Use GPT-4o-mini for simple tasks
   - Implement response caching
   - Batch similar requests

3. **Storage tiering**
   - Use Cool/Archive for infrequent access
   - Implement lifecycle policies
   - Enable compression where applicable

### Production Optimizations
1. **Reserved capacity**
   - 1-year reserved: ~20% savings
   - 3-year reserved: ~30% savings
   - Applies to: Cosmos DB, SQL, VMs

2. **Azure Hybrid Benefit**
   - Use existing Windows Server licenses
   - Use existing SQL Server licenses
   - Up to 40% savings

3. **Dev/Test pricing**
   - Use dev/test subscriptions for non-production
   - Up to 55% discount on VMs
```

---

## Output Template

Generate `deliverables/COST_ESTIMATE.md`:

```markdown
# [PROJECT_NAME] - Azure Cost Estimate

## Executive Summary

This document provides cost estimates for the [PROJECT_NAME] Azure infrastructure across three usage scenarios: POC, Pilot, and Production.

**Key Findings:**
- POC monthly cost: $[AMOUNT] - $[AMOUNT]
- Pilot monthly cost: $[AMOUNT] - $[AMOUNT]  
- Production monthly cost: $[AMOUNT] - $[AMOUNT]
- Primary cost driver: [SERVICE]
- Recommended optimizations: [SUMMARY]

## Architecture Overview

Based on `concept/AZURE_CONFIG.json` and `concept/docs/ARCHITECTURE.md`:

| Stage | Resources | Purpose |
|-------|-----------|---------|
| Stage 1 | [Resources] | [Purpose] |
| Stage 2 | [Resources] | [Purpose] |
| Stage 3 | [Resources] | [Purpose] |

## Current Architecture SKUs

| Resource | SKU | Configuration |
|----------|-----|---------------|
| [Resource 1] | [SKU] | [Config details] |
| [Resource 2] | [SKU] | [Config details] |

## Cost Scenarios

### Scenario 1: POC (Low Usage)

**Assumptions:**
- [Usage assumption 1]
- [Usage assumption 2]
- [Usage assumption 3]

| Resource | Monthly Cost | Notes |
|----------|-------------|-------|
| [Resource 1] | $[Amount] | [Notes] |
| [Resource 2] | $[Amount] | [Notes] |
| **Total** | **$[Amount]** | |

### Scenario 2: Pilot (Medium Usage)

[Similar structure]

### Scenario 3: Production (High Usage)

[Similar structure]

## Cost Breakdown by Category

[Pie chart data or percentages]

## Cost Optimization Recommendations

### Immediate Savings
[List with estimated savings]

### Production Optimizations  
[List with estimated savings]

## Assumptions & Disclaimers

1. Prices retrieved from Azure Retail Prices API on [DATE]
2. Azure OpenAI pricing obtained from Azure pricing page on [DATE]
3. Actual costs may vary based on usage patterns
4. Reserved capacity discounts not included unless specified
5. Data transfer costs estimated; actual may vary
6. **Prices change frequently — verify before customer presentation**

---

*Generated: [DATE]*
*Pricing Source: Azure Retail Prices API (https://prices.azure.com)*
*Based on: concept/AZURE_CONFIG.json, concept/docs/ARCHITECTURE.md*
```

---

## Agent Instructions for Dynamic Pricing

When the `cost-analyst` agent generates cost estimates:

1. **Always query current prices** — Never use cached or memorized prices
2. **Use Azure Retail Prices API first** — It's authoritative and current
3. **Fall back to web search** — For Azure OpenAI, new services, or complex SKUs
4. **Document pricing date** — Include when prices were retrieved
5. **Provide price ranges** — Account for usage variability
6. **Verify before delivery** — Prices can change; re-check if estimate is >1 week old

### Web Search Queries for Pricing

| Service | Recommended Search Query |
|---------|-------------------------|
| Azure OpenAI | `"Azure OpenAI pricing" GPT-4o tokens site:azure.microsoft.com` |
| Container Apps | `"Azure Container Apps pricing" vCPU memory site:azure.microsoft.com` |
| Cosmos DB Serverless | `"Cosmos DB serverless pricing" RU site:azure.microsoft.com` |
| Reserved Instances | `"Azure reserved capacity" {service} savings site:azure.microsoft.com` |
| Free Tier Limits | `"Azure free tier" {service} limits site:azure.microsoft.com` |

### API Query for Bulk Pricing

```bash
# Get all prices for a region (paginated, may need multiple calls)
curl -s "https://prices.azure.com/api/retail/prices?\$filter=armRegionName%20eq%20'eastus'" | \
    jq '.Items | length'  # Check count

# Export to file for offline analysis
curl -s "https://prices.azure.com/api/retail/prices?\$filter=armRegionName%20eq%20'eastus'" > azure_prices_eastus.json
```

---

## Integration with Agents

| Agent | Interaction |
|-------|-------------|
| `cloud-architect` | Provides architecture inputs, reviews estimates |
| `cost-analyst` | Primary owner of cost estimation |
| `document-writer` | Formats and finalizes deliverable |
| `project-manager` | Reviews for customer presentation |

---

## Validation Checklist

- [ ] All resources in AZURE_CONFIG.json have cost estimates
- [ ] Three scenarios provided (POC, Pilot, Production)
- [ ] Assumptions clearly documented
- [ ] Cost optimization recommendations included
- [ ] Prices verified against Azure Pricing Calculator
- [ ] Region-specific pricing used
- [ ] Primary cost drivers identified
- [ ] Monthly and annual projections included
