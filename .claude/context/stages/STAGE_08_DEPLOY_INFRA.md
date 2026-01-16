# Stage 8: Deploy Infrastructure

**Phase:** 2 - Prototyping  
**Duration:** Part of 2-4 days (shared with Stages 4-7, 9)  
**Primary Actor:** Human  
**Supporting Agents:** `cloud-architect`, service agents

## Overview

Human uses the deployment script to deploy each stage of the infrastructure. Agents adjust configuration as issues arise.

## Process

1. **Human Executes Deployment**
   - Human runs `concept/infrastructure/deploy.sh` for each stage
   - Example: `./deploy.sh -l eastus -u my-app -e dev -s 1`

2. **Validation**
   - Verify services deployed with necessary resources
   - Verify compliance with Microsoft security policies

3. **Issue Resolution**
   - If issues arise, human engages `cloud-architect`
   - `cloud-architect` assigns appropriate agent to adjust configuration
   - `cloud-architect` communicates documentation changes to `document-writer`

4. **AZURE_CONFIG.json Update**
   - Deployment script auto-updates config
   - `cloud-architect` validates updates

## Deployment Verification

For each stage, verify:
- [ ] All resources created successfully
- [ ] Resources available in selected region
- [ ] Security policies satisfied
- [ ] Tags applied correctly
- [ ] Managed Identities created
- [ ] RBAC assignments complete

## Rollback Procedure

If deployment fails or causes issues:

1. **Document the failure** in detail
2. **Use `-stage` flag** to redeploy only the affected stage
3. **If rollback needed:**
   - Delete the resource group for that stage
   - Redeploy the stage
4. **Update AZURE_CONFIG.json** to reflect current state

## Region Considerations

If deployment fails due to:
- Resource unavailability in region
- Quota limitations
- Service restrictions

Then:
- Modify scripts for different region
- Update location parameter
- Re-run deployment

## Agent Responsibilities

| Agent | Responsibility |
|-------|----------------|
| `cloud-architect` | Coordinate fixes, update AZURE_CONFIG.json |
| `[service]-terraform` | Update Terraform modules if needed |
| `[service]-bicep` | Update Bicep modules if needed |
| `document-writer` | Update deployment guide with changes |
| `subscription-expert` | Resource provider issues |

## Deliverables

| Deliverable | Location | Owner |
|-------------|----------|-------|
| Deployed Infrastructure | Azure | Human |
| Updated Scripts | `concept/infrastructure/` | Service agents |
| Updated Documentation | `concept/docs/DEPLOYMENT.md` | `document-writer` |
| Updated Config | `concept/AZURE_CONFIG.json` | `cloud-architect` |

## Exit Criteria

- [ ] All infrastructure stages deployed
- [ ] All resources accessible
- [ ] AZURE_CONFIG.json reflects deployed state
- [ ] Documentation updated with any changes
- [ ] Ready for application deployment

## Next Stage

Proceed to **Stage 9: Deploy Application Components** when infrastructure is deployed.
