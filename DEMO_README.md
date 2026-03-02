# Demo Branch: IaC Generation — Bash to Bicep to Terraform
## Starting State
- Full working TypeScript app
- `concept/infrastructure/deploy.sh` — well-structured manual bash script
- `concept/infrastructure/bicep/` — partial stage files exist
- **No `main.bicep`** composing all resources
- **No `terraform/`** directory

## Copilot Prompt — Part 1: Generate Bicep from deploy.sh
```
Read concept/infrastructure/deploy.sh. This is our current manual deployment
script. Generate concept/infrastructure/bicep/main.bicep that replaces it
with proper Azure Bicep:

Resources (in dependency order):
1. Log Analytics Workspace
2. Application Insights (linked to Log Analytics)
3. Key Vault (RBAC-enabled, NOT vault access policies)
4. User-Managed Identity + Key Vault Secrets User role assignment
5. PostgreSQL Flexible Server (password generated via uniqueString, stored in KV)
6. Container Apps Environment (linked to Log Analytics)
7. Container App for the API (Managed Identity reads DB secret from KV)
8. Static Web App for the React frontend

Requirements:
- Use Managed Identity everywhere — zero hardcoded passwords
- Add @description decorators on all params
- Use @allowed where appropriate (sku, tier)
- All resources tagged: Environment, Project, ManagedBy=Bicep
- Follow patterns in existing stage*.bicep files (naming, param style)
- Use modules for complex resources if it improves readability
- Output: apiUrl, webUrl, keyVaultName, dbServerName
```

## Copilot Prompt — Part 2: Convert to Terraform
```
Convert concept/infrastructure/bicep/main.bicep to Terraform HCL.
Create:
  concept/infrastructure/terraform/
    main.tf       — resource definitions
    variables.tf  — parameterized inputs with descriptions and defaults
    outputs.tf    — apiUrl, webUrl, keyVaultName, dbServerName
    providers.tf  — azurerm + azuread providers, required_providers block

Requirements:
- azurerm provider (latest stable, use ~> 3.0 constraint)
- Use for_each for role assignments where there are multiple
- for_each or count for any repeated resource patterns
- random_password resource for DB password (not random_string)
- All variables must have type and description
- Match the same resource configuration from the Bicep
```

## What to Show
1. Open deploy.sh — show the manual bash: "this is what 90% of customers have"
2. Run Part 1 prompt — Copilot reads deploy.sh, generates main.bicep
3. Walk through: Managed Identity pattern, KV reference, no hardcoded secrets
4. Run Part 2 prompt — one prompt converts to Terraform
5. Show: same infra, two IaC languages, both production-quality

## Reset
```bash
git checkout main && git branch -D demo/iac-generation
bash setup-demo-branches.sh --only iac-generation
```
