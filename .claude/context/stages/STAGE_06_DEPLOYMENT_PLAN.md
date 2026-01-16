# Stage 6: Create Deployment Plan

**Phase:** 2 - Prototyping  
**Duration:** Part of 2-4 days (shared with Stages 4-5, 7-9)  
**Primary Agents:** `cloud-architect`, `document-writer`, service architects

## Overview

The `cloud-architect` engages all agent experts to craft the detailed configuration document. The guide must be meticulous and comprehensive, describing the full configuration and implementation of all required Azure services.

## Process

1. **Configuration Analysis**
   - `cloud-architect` reviews architecture document
   - Identifies all configuration requirements
   - Engages service architects for service-specific configuration

2. **Configuration Document**
   - `cloud-architect` engages `document-writer`
   - Copy `.claude/templates/CONFIGURATION.md` to `concept/docs/CONFIGURATION.md`
   - Document all configuration details

3. **Service-Specific Configuration**
   - Each service architect provides:
     - Environment variables
     - App settings
     - Connection configurations (Managed Identity patterns)
     - SKU recommendations
     - Scaling parameters

## Configuration Document Contents

The `concept/docs/CONFIGURATION.md` must include:

- AZURE_CONFIG.json structure and usage
- Environment-specific settings (dev/stg/prd)
- Required tags
- Service configurations:
  - App settings
  - Environment variables
  - Managed Identity patterns
  - RBAC requirements
- Networking configuration
- Security configuration
- Monitoring configuration

## Agent Responsibilities

| Agent | Responsibility |
|-------|----------------|
| `cloud-architect` | Coordination, overall configuration strategy |
| Service architects | Service-specific configuration details |
| `document-writer` | Configuration document creation |

## Key Principles

- **Be meticulous** — Every configuration detail matters
- **No secrets in config** — Use Key Vault references
- **Managed Identity patterns** — Document `__credential=managedidentity` usage
- **Environment-aware** — Document differences between dev/stg/prd
- **Complete coverage** — All services must be covered

## Deliverables

| Deliverable | Location | Owner |
|-------------|----------|-------|
| Configuration Guide | `concept/docs/CONFIGURATION.md` | `document-writer` |

## Exit Criteria

- [ ] All services have configuration documented
- [ ] Environment variables listed
- [ ] App settings defined
- [ ] Managed Identity patterns documented
- [ ] RBAC requirements specified
- [ ] Tags requirements documented
- [ ] `concept/docs/CONFIGURATION.md` complete

## Next Stage

Proceed to **Stage 7: Build Infrastructure & Applications** when configuration guide is complete.
