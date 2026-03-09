# Stage 2: Scope of Work Generation

**Phase:** 1 - Strategy Briefing / A Day in the Life  
**Duration:** Part of 1 day (shared with Stages 1, 3)  
**Primary Agents:** `project-manager`, `business-analyst`, `cloud-architect`

## Overview

Human interacts with agents to craft a scope of work based on discovery materials. This process is iterative but should take no more than an hour to complete.

## Process

1. **Artifact Review**
   - Agents examine all artifacts in `artifacts/` folder
   - Understand what customer is seeking to implement

2. **Engagement with Human**
   - Remain high-level to flush out major gaps in understanding
   - Questions should only clarify desired outcomes (not technical implementation)
   - Technical implementation details are not important at this stage

3. **Information Gathering**
   - Objectives
   - Scope (in and out of scope)
   - Deliverables
   - Responsibilities (Microsoft and customer)
   - Assumptions
   - Dependencies
   - Success criteria

4. **Executive Summary**
   - `business-analyst` crafts executive summary based on findings

5. **Document Creation**
   - Agents communicate findings to `document-writer`
   - `document-writer` copies `.claude/templates/SCOPE_OF_WORK.md` to `deliverables/SCOPE_OF_WORK.md`
   - `document-writer` populates all sections

## Agent Responsibilities

| Agent | Responsibility |
|-------|----------------|
| `project-manager` | Coordinates SOW development, ensures completeness |
| `business-analyst` | Analyzes requirements, crafts executive summary |
| `cloud-architect` | Validates technical feasibility at high level |
| `document-writer` | Captures findings in SOW document |
| Service agents | Consulted as needed for service-specific questions |

## Key Principles

- **Stay high-level** — This is about scope, not implementation
- **Ask clarifying questions** — But only to understand outcomes
- **Don't over-engineer** — Technical details come later
- **Identify gaps** — Flag unclear requirements for Stage 4

## Deliverables

| Deliverable | Location | Owner |
|-------------|----------|-------|
| Scope of Work | `deliverables/SCOPE_OF_WORK.md` | `document-writer` |

## Exit Criteria

- [ ] All artifacts reviewed
- [ ] Objectives clearly defined
- [ ] In-scope and out-of-scope items identified
- [ ] Deliverables listed
- [ ] Responsibilities assigned
- [ ] Assumptions documented
- [ ] Dependencies identified
- [ ] Success criteria established
- [ ] Executive summary written
- [ ] `deliverables/SCOPE_OF_WORK.md` complete

## Next Stage

Proceed to **Stage 3: Customer Sign-Off and Approval** when SOW is complete.
