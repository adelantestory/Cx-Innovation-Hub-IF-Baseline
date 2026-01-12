# Template Populator Skill

## Purpose

Automates the population of deliverable templates (SOW, AS_BUILT, POST_MORTEM, etc.) by extracting information from project context, discovery artifacts, and AZURE_CONFIG.json. Ensures consistency across all deliverables and reduces manual effort.

## When to Use

- **SOW Development (Stage 2)** — Populate SCOPE_OF_WORK.md from discovery
- **Final Delivery (Stage 12)** — Generate AS_BUILT.md from implemented solution
- **Post-Engagement** — Create POST_MORTEM.md from project learnings
- **Any deliverable creation** — Use templates from `.claude/templates/`

## Triggers

- `document-writer` agent begins deliverable creation
- `project-manager` requests deliverable generation
- Stage transitions requiring documentation
- Customer requests specific documentation

---

## Template Inventory

| Template | Location | Output Location | Primary Sources |
|----------|----------|-----------------|-----------------|
| SCOPE_OF_WORK.md | `.claude/templates/SCOPE_OF_WORK.md` | `deliverables/SCOPE_OF_WORK.md` | Discovery artifacts, requirements |
| AS_BUILT.md | `.claude/templates/AS_BUILT.md` | `deliverables/AS_BUILT.md` | AZURE_CONFIG.json, architecture docs |
| POST_MORTEM.md | `.claude/templates/POST_MORTEM.md` | `deliverables/POST_MORTEM.md` | Project notes, issues encountered |
| COST_ESTIMATE.md | `.claude/templates/COST_ESTIMATE.md` | `deliverables/COST_ESTIMATE.md` | AZURE_CONFIG.json, pricing data |
| ARCHITECTURE.md | `.claude/templates/ARCHITECTURE.md` | `concept/docs/ARCHITECTURE.md` | Design decisions, AZURE_CONFIG.json |
| CONFIGURATION.md | `.claude/templates/CONFIGURATION.md` | `concept/docs/CONFIGURATION.md` | AZURE_CONFIG.json, app settings |
| DEPLOYMENT.md | `.claude/templates/DEPLOYMENT.md` | `concept/docs/DEPLOYMENT.md` | Infrastructure code, deploy.sh |
| DEVELOPMENT.md | `.claude/templates/DEVELOPMENT.md` | `concept/docs/DEVELOPMENT.md` | App code, setup procedures |

---

## Data Source Mapping

### From AZURE_CONFIG.json

```bash
# Project Information
PROJECT_NAME=$(jq -r '.project.name' concept/AZURE_CONFIG.json)
CUSTOMER=$(jq -r '.project.customer' concept/AZURE_CONFIG.json)
ENVIRONMENT=$(jq -r '.project.environment' concept/AZURE_CONFIG.json)
CREATED_DATE=$(jq -r '.project.createdDate' concept/AZURE_CONFIG.json)

# Subscription
SUBSCRIPTION_ID=$(jq -r '.subscription.id' concept/AZURE_CONFIG.json)
SUBSCRIPTION_NAME=$(jq -r '.subscription.name' concept/AZURE_CONFIG.json)
TENANT_ID=$(jq -r '.subscription.tenantId' concept/AZURE_CONFIG.json)

# Resources (iterate stages)
STAGES=$(jq -r '.stages | keys[]' concept/AZURE_CONFIG.json)
for stage in $STAGES; do
  RESOURCES=$(jq -r ".stages.$stage.resources | keys[]" concept/AZURE_CONFIG.json)
  echo "Stage: $stage - Resources: $RESOURCES"
done
```

### From Discovery Artifacts

```bash
# If DISCOVERY_SUMMARY.md exists
if [ -f "artifacts/DISCOVERY_SUMMARY.md" ]; then
  # Extract sections using grep/sed
  BUSINESS_CONTEXT=$(sed -n '/## Business Context/,/## /p' artifacts/DISCOVERY_SUMMARY.md | head -n -1)
  REQUIREMENTS=$(sed -n '/## Functional Requirements/,/## /p' artifacts/DISCOVERY_SUMMARY.md | head -n -1)
fi
```

### From Architecture Documentation

```bash
# If ARCHITECTURE.md exists
if [ -f "concept/docs/ARCHITECTURE.md" ]; then
  # Extract technology stack table
  TECH_STACK=$(sed -n '/## Technology Stack/,/## /p' concept/docs/ARCHITECTURE.md | head -n -1)
fi
```

---

## Population Procedures

### 1. SCOPE_OF_WORK.md

**Sources Required:**
- `artifacts/DISCOVERY_SUMMARY.md` or raw artifacts
- Customer name and project details
- Requirements list

**Field Mapping:**

| Template Field | Source | Extraction Method |
|----------------|--------|-------------------|
| `[CUSTOMER_NAME]` | AZURE_CONFIG.json | `.project.customer` |
| `[PROJECT_TITLE]` | AZURE_CONFIG.json | `.project.name` |
| `[DATE]` | Current date | `date +%Y-%m-%d` |
| `[EXECUTIVE_SUMMARY]` | Discovery summary | Business Context section |
| `[OBJECTIVES]` | Discovery artifacts | Success metrics |
| `[IN_SCOPE]` | Requirements | Prioritized FR list |
| `[OUT_OF_SCOPE]` | Discovery | Explicit exclusions |
| `[DELIVERABLES]` | Standard + custom | Based on architecture |
| `[TIMELINE]` | Standard 6-phase | Innovation Factory pipeline |
| `[ASSUMPTIONS]` | Discovery | Technical/organizational |

**Procedure:**

```bash
# Copy template
cp .claude/templates/SCOPE_OF_WORK.md deliverables/SCOPE_OF_WORK.md

# Replace placeholders
sed -i "s/\[CUSTOMER_NAME\]/$CUSTOMER/g" deliverables/SCOPE_OF_WORK.md
sed -i "s/\[PROJECT_TITLE\]/$PROJECT_NAME/g" deliverables/SCOPE_OF_WORK.md
sed -i "s/\[DATE\]/$(date +%Y-%m-%d)/g" deliverables/SCOPE_OF_WORK.md

# Manual sections require agent interpretation
# - Executive Summary
# - Objectives
# - Scope items
# - Assumptions
```

---

### 2. AS_BUILT.md

**Sources Required:**
- `concept/AZURE_CONFIG.json`
- `concept/docs/ARCHITECTURE.md`
- `concept/docs/CONFIGURATION.md`
- Deployed resource details

**Field Mapping:**

| Template Field | Source | Extraction Method |
|----------------|--------|-------------------|
| `[PROJECT_NAME]` | AZURE_CONFIG.json | `.project.name` |
| `[ARCHITECTURE_DIAGRAM]` | ARCHITECTURE.md | Mermaid diagrams |
| `[RESOURCE_TABLE]` | AZURE_CONFIG.json | Iterate all resources |
| `[CONFIGURATION_SUMMARY]` | CONFIGURATION.md | Key settings |
| `[DEPLOYMENT_STAGES]` | AZURE_CONFIG.json | `.stages` |
| `[SECURITY_SETTINGS]` | CONFIGURATION.md | Security section |
| `[KNOWN_ISSUES]` | Project notes | Issues encountered |
| `[FUTURE_RECOMMENDATIONS]` | Analysis | Production readiness |

**Resource Table Generation:**

```bash
echo "| Resource | Type | SKU | Resource Group | Purpose |"
echo "|----------|------|-----|----------------|---------|"

jq -r '
  .stages | to_entries[] | 
  .key as $stage |
  .value.resources | to_entries[] |
  "| \(.value.name // "TBD") | \(.key) | \(.value.sku // "N/A") | \(.value.resourceGroup // "TBD") | Stage: \($stage) |"
' concept/AZURE_CONFIG.json
```

---

### 3. POST_MORTEM.md

**Sources Required:**
- Original SOW
- Final AS_BUILT
- Project notes/issues
- Customer feedback

**Field Mapping:**

| Template Field | Source | Extraction Method |
|----------------|--------|-------------------|
| `[PROJECT_NAME]` | AZURE_CONFIG.json | `.project.name` |
| `[ORIGINAL_SCOPE]` | SCOPE_OF_WORK.md | In-scope section |
| `[DELIVERED_SCOPE]` | AS_BUILT.md | What was built |
| `[GAPS]` | Comparison | SOW vs AS_BUILT diff |
| `[CHALLENGES]` | Project notes | Issues encountered |
| `[LESSONS_LEARNED]` | Team reflection | What worked/didn't |
| `[RECOMMENDATIONS]` | Analysis | For future engagements |

---

### 4. ARCHITECTURE.md

**Sources Required:**
- `concept/AZURE_CONFIG.json`
- Design decisions
- `concept/infrastructure/` code

**Auto-Generated Sections:**

```bash
# Generate Azure Services table from AZURE_CONFIG.json
echo "## Azure Services"
echo ""
echo "| Service | Name | SKU | Location | Stage |"
echo "|---------|------|-----|----------|-------|"

jq -r '
  .stages | to_entries[] |
  .key as $stage |
  .value.resourceGroups[].location as $location |
  .value.resources | to_entries[] |
  "| \(.key) | \(.value.name) | \(.value.sku // "N/A") | \($location) | \($stage) |"
' concept/AZURE_CONFIG.json
```

---

### 5. CONFIGURATION.md

**Sources Required:**
- `concept/AZURE_CONFIG.json`
- `concept/apps/*/` configuration files
- `concept/infrastructure/` variables

**Auto-Generated Sections:**

```bash
# Generate AZURE_CONFIG.json reference
echo "## AZURE_CONFIG.json Summary"
echo ""
echo "### Project"
jq '.project' concept/AZURE_CONFIG.json
echo ""
echo "### Stages"
jq -r '.stages | keys[]' concept/AZURE_CONFIG.json | while read stage; do
  echo "#### $stage"
  jq ".stages.$stage.name, .stages.$stage.description" concept/AZURE_CONFIG.json
done
```

---

### 6. DEPLOYMENT.md

**Sources Required:**
- `concept/infrastructure/deploy.sh` parameters
- `concept/AZURE_CONFIG.json` stages
- `concept/sql/` scripts

**Auto-Generated Sections:**

```bash
# Generate deployment stages table
echo "## Deployment Stages"
echo ""
echo "| Stage | Name | Resources |"
echo "|-------|------|-----------|"

jq -r '
  .stages | to_entries[] |
  "| \(.key) | \(.value.name) | \(.value.resources | keys | join(", ")) |"
' concept/AZURE_CONFIG.json

# Generate SQL scripts list
echo "## Database Scripts"
echo ""
ls -1 concept/sql/*.sql 2>/dev/null | while read script; do
  echo "- \`$script\`"
done
```

---

## Placeholder Reference

### Standard Placeholders

| Placeholder | Description | Source |
|-------------|-------------|--------|
| `[PROJECT_NAME]` | Project name | AZURE_CONFIG.json |
| `[CUSTOMER_NAME]` | Customer name | AZURE_CONFIG.json |
| `[DATE]` | Current date | Generated |
| `[ENVIRONMENT]` | dev/stg/prd | AZURE_CONFIG.json |
| `[LOCATION]` | Azure region | AZURE_CONFIG.json |
| `[SUBSCRIPTION_ID]` | Azure subscription | AZURE_CONFIG.json |
| `[UID]` | Unique identifier | AZURE_CONFIG.json |

### Section Placeholders

| Placeholder | Description | Requires |
|-------------|-------------|----------|
| `[EXECUTIVE_SUMMARY]` | 2-3 paragraph overview | Agent interpretation |
| `[OBJECTIVES]` | Bulleted list | Discovery analysis |
| `[IN_SCOPE]` | Deliverables list | Requirements |
| `[OUT_OF_SCOPE]` | Exclusions | Discovery |
| `[ASSUMPTIONS]` | Technical/org assumptions | Discovery |
| `[ARCHITECTURE_DIAGRAM]` | Mermaid diagram | Design |
| `[RESOURCE_TABLE]` | Generated table | AZURE_CONFIG.json |

---

## Validation

After populating a template:

```bash
# Check for remaining placeholders
grep -n "\[.*\]" deliverables/*.md | grep -v "http" | grep -v "^#"

# Verify all sections have content
for section in "Executive Summary" "Objectives" "Scope" "Deliverables"; do
  if ! grep -q "$section" deliverables/SCOPE_OF_WORK.md; then
    echo "WARNING: Missing section: $section"
  fi
done
```

---

## Integration with Agents

| Agent | Role |
|-------|------|
| `document-writer` | Primary user of this skill; populates templates |
| `business-analyst` | Provides discovery content for SOW |
| `cloud-architect` | Provides architecture content |
| `project-manager` | Reviews populated templates |
| `cost-analyst` | Provides cost data for estimates |

---

## Quality Checklist

Before finalizing any deliverable:

- [ ] All `[PLACEHOLDER]` values replaced
- [ ] Customer name consistent throughout
- [ ] Dates are current
- [ ] Resource tables match AZURE_CONFIG.json
- [ ] Diagrams render correctly
- [ ] No internal/technical jargon inappropriate for audience
- [ ] Links and references are valid
- [ ] Document follows template structure
- [ ] Reviewed by appropriate agent/role
