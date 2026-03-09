# Stage 12: Prepare Final Deliverables

**Phase:** 5 - Evaluate
**Duration:** 1 day
**Primary Agents:** `project-manager`, `cloud-architect`, `business-analyst`, `documentation-manager`

## Overview

At this final stage, agents produce the as-built and post-mortem documents as deliverables to the customer. These documents capture the final state and learnings from the POC.

## Process

1. **Document Review**
   - `project-manager`, `business-analyst`, `cloud-architect` examine document templates
   - Understand what content is required for each section

2. **Content Gathering**
   - Complete sections based on knowledge and feedback from other agents
   - Ask human for clarification on any gaps

3. **Document Creation**
   - `documentation-manager` copies README template to `concept/`
   - `documentation-manager` copies AS_BUILT and POST_MORTEM templates to `deliverables/`
   - `documentation-manager` populates all documents with appropriate content

## Documents to Produce

### README.md (Repository)

Copy `.claude/templates/README.md` to `concept/README.md`

Content:
- Project overview and features
- Architecture diagram and components
- Prerequisites and deployment steps
- Directory structure
- Security implementation
- Known limitations

This is the public-facing README that accompanies the code repository.

### AS_BUILT.md

Copy `.claude/templates/AS_BUILT.md` to `deliverables/AS_BUILT.md`

Content:
- Final state of application
- Supporting architecture
- All deployed components
- Configuration summary
- Known limitations
- Future recommendations

### POST_MORTEM.md

Copy `.claude/templates/POST_MORTEM.md` to `deliverables/POST_MORTEM.md`

Content:
- What was built
- Specific gaps and why they exist
- How to improve
- Lessons learned
- Recommendations for production

## Agent Responsibilities

| Agent | Responsibility |
|-------|----------------|
| `project-manager` | Coordinate, ensure completeness |
| `business-analyst` | Provide business context, requirements recap |
| `cloud-architect` | Provide technical details, architecture summary |
| `documentation-manager` | Create and populate all documents (README, AS_BUILT, POST_MORTEM) |
| All agents | Provide input for their domain |

## Pre-Handoff Checklist

Before handoff, verify:

- [ ] `concept/README.md` is complete with project overview and deployment steps
- [ ] `deliverables/AS_BUILT.md` is complete and accurate
- [ ] `deliverables/POST_MORTEM.md` is complete with all learnings captured
- [ ] All source code is in the repository
- [ ] `concept/docs/DEPLOYMENT.md` contains all steps needed to recreate the environment
- [ ] `concept/docs/DEVELOPMENT.md` contains any critical development notes (if needed)
- [ ] `concept/AZURE_CONFIG.json` reflects the final deployed state
- [ ] All known limitations are documented
- [ ] Customer can independently deploy from `concept/` folder

## Deliverables

| Deliverable | Location | Owner |
|-------------|----------|-------|
| Repository README | `concept/README.md` | `documentation-manager` |
| As-Built Document | `deliverables/AS_BUILT.md` | `documentation-manager` |
| Post-Mortem Document | `deliverables/POST_MORTEM.md` | `documentation-manager` |
| Final Presentation | `deliverables/FINAL_DELIVERY.pptx` | Human (optional) |

## Exit Criteria

- [ ] README.md complete
- [ ] AS_BUILT.md complete
- [ ] POST_MORTEM.md complete
- [ ] Pre-handoff checklist complete
- [ ] All deliverables ready for customer
- [ ] Ready for Phase 6: Hand Off

## Next Phase

Proceed to **Phase 6: Hand Off** when all deliverables are complete.

---

## Phase 6: Hand Off

The handoff phase is ongoing and managed by the human with Microsoft Customer Success and/or the customer's preferred partner.

**Agent Involvement:** Agents are not directly involved but may be engaged if questions arise during handoff.

**Handoff Recipients:**
- Microsoft Customer Success team
- Customer's preferred implementation partner
- Customer's internal IT team

**Materials to Hand Off:**
- All contents of `deliverables/` folder
- All contents of `concept/` folder (git repository)
- Access credentials (managed by human)
