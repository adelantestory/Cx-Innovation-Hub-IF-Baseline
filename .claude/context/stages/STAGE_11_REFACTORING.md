# Stage 11: Refactoring & Improvement

**Phase:** 4 - Improve  
**Duration:** 1-2 days  
**Primary Agents:** `project-manager`, `business-analyst`, `cloud-architect`, all service agents

## Overview

Human engages agents to improve the solution based on customer feedback. Agents must understand changes, assess impact, and implement improvements.

## Process

1. **Feedback Review**
   - `project-manager`, `business-analyst`, `cloud-architect` review all customer feedback
   - Engage human in conversation to understand changes
   - Construct implementation plan

2. **Impact Assessment**
   - Agents **MUST** communicate to human:
     - Level of impact on underlying system
     - Breadth of changes required
     - Risk factors
     - Time requirements

3. **Scope Validation**
   - Validate changes are within SOW scope
   - Out-of-scope items → Document for Phase 2
   - In-scope items → Proceed with implementation

4. **Implementation**
   - Assign work to appropriate agents
   - Execute changes across all affected components

5. **Documentation Update**
   - All changes reflected in documentation
   - Spec Kit updated with new/modified requirements

## Required Actions

When changes are identified, the following **MUST** occur:

| Action | Owner |
|--------|-------|
| Update applicable documentation | `document-writer` |
| Append requirements to Spec Kit | `spec-kit-expert` |
| Update deployment scripts (if needed) | `cloud-architect` |
| Update Terraform modules (if needed) | `[service]-terraform` |
| Update Bicep modules (if needed) | `[service]-bicep` |
| Update application code (if needed) | `[service]-developer` |
| Update database scripts (if needed) | `[database]-developer` |

## Agent Responsibilities

| Agent | Responsibility |
|-------|----------------|
| `project-manager` | Coordinate changes, validate scope |
| `business-analyst` | Analyze feedback, assess requirements |
| `cloud-architect` | Assess technical impact, assign work |
| `spec-kit-expert` | Append requirements to Spec Kit |
| `document-writer` | Update all documentation |
| Service agents | Implement assigned changes |

## Change Categories

| Category | Typical Impact | Agents Involved |
|----------|---------------|-----------------|
| Bug fix | Low | Developer |
| Configuration | Low-Medium | Architect, Terraform/Bicep |
| New feature | Medium-High | All four service agents |
| Architecture change | High | Cloud architect, all agents |

## Scope Creep Warning

**CRITICAL:** If changes expand beyond SOW:
1. `project-manager` flags to human
2. Human decides whether to:
   - Negotiate with customer
   - Document for Phase 2
   - Proceed (with explicit approval)
3. **Do NOT implement out-of-scope changes without human approval**

## Deliverables

| Deliverable | Location | Owner |
|-------------|----------|-------|
| Updated Documentation | `concept/docs/` | `document-writer` |
| Updated Spec Kit | `concept/.specify/` | `spec-kit-expert` |
| Updated Scripts | `concept/infrastructure/` | `cloud-architect` / agents |
| Updated Applications | `concept/apps/` | Service developers |
| Updated IaC | `concept/infrastructure/terraform/` or `bicep/` | Service agents |

## Exit Criteria

- [ ] All in-scope feedback addressed
- [ ] Out-of-scope items documented for Phase 2
- [ ] Documentation updated
- [ ] Spec Kit updated
- [ ] All scripts/code/IaC updated
- [ ] Changes deployed and validated
- [ ] Ready for final deliverables

## Next Stage

Proceed to **Stage 12: Prepare Final Deliverables** when improvements are complete.
