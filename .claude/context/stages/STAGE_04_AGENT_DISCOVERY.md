# Stage 4: Agent Discovery

**Phase:** 2 - Prototyping  
**Duration:** Part of 2-4 days (shared with Stages 5-9)  
**Primary Agents:** `project-manager`, `business-analyst`, `cloud-architect`, `spec-kit-expert`

## Overview

This stage is highly iterative with in-depth discussion between agents and human. Agents examine all documents and ask very specific questions to identify all gaps within the project.

## Process

1. **Document Examination**
   - `project-manager`, `business-analyst`, `cloud-architect` examine all documents in `artifacts/`
   - Include the formal SOW document from Stage 3
   - Review any additional context provided

2. **Deep Questioning**
   - Engage human with specific questions about:
     - Technical requirements
     - Functional requirements
     - Business requirements
   - Questions can range across all domains
   - **No question is considered irrelevant**
   - Team **MUST** identify all gaps

3. **Domain Expert Engagement**
   - Based on discovered content, engage service agents for domain-specific questions
   - Each service agent asks questions within their expertise

4. **Specification Capture**
   - `project-manager` and `business-analyst` coordinate with `spec-kit-expert`
   - `spec-kit-expert` captures all specifications per Spec Kit guidelines
   - Store in `concept/.specify/` folder

## Agent Responsibilities

| Agent | Responsibility |
|-------|----------------|
| `project-manager` | Coordinates discovery, ensures completeness |
| `business-analyst` | Deep requirements analysis, identifies gaps |
| `cloud-architect` | Technical feasibility, service identification |
| `spec-kit-expert` | Captures specifications in Spec Kit format |
| Service agents | Domain-specific questions and validation |

## Spec Kit Documentation

The `spec-kit-expert` will create/update:

| File | Purpose |
|------|---------|
| `concept/.specify/specify.md` | Detailed specifications |
| `concept/.specify/plan.md` | Implementation plan |
| `concept/.specify/tasks.md` | Task breakdown |

Note: `constitution.md` is pre-populated and should not be modified.

## Key Principles

- **Ask everything** — No question is irrelevant
- **Identify all gaps** — Better to ask now than discover later
- **Document meticulously** — Spec Kit captures all requirements
- **Engage experts** — Service agents have domain knowledge
- **Be thorough** — This prevents issues in later stages

## Deliverables

| Deliverable | Location | Owner |
|-------------|----------|-------|
| Clear understanding | _(Agent knowledge)_ | All agents |
| Specifications | `concept/.specify/` | `spec-kit-expert` |

## Exit Criteria

- [ ] All artifacts thoroughly examined
- [ ] All gaps identified and documented
- [ ] Technical requirements clear
- [ ] Functional requirements clear
- [ ] Business requirements clear
- [ ] Service agents consulted for their domains
- [ ] Spec Kit documentation complete
- [ ] Agents possess clear understanding of what is being built

## Next Stage

Proceed to **Stage 5: Design Architecture** when discovery is complete.
