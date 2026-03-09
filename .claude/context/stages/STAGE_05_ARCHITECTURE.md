# Stage 5: Design Architecture

**Phase:** 2 - Prototyping  
**Duration:** Part of 2-4 days (shared with Stages 4, 6-9)  
**Primary Agents:** `cloud-architect`, `document-writer`, `cost-analyst`, service architects

## Overview

Agents create and propose a comprehensive architecture for the solution. Human engages with agents to adjust the architecture to preferences. The architecture must satisfy all business requirements and function within Microsoft Azure tenant security constraints.

## Process

1. **Architecture Design**
   - `cloud-architect` coordinates with service architects
   - Create comprehensive architecture proposal
   - Ensure all business requirements are satisfied
   - Validate against security constraints

2. **Solution Comparison**
   - When comparable solutions exist, present to human with:
     - Pros and cons of each
     - Qualifying questions if needed
   - Human makes final decision

3. **Security Validation**
   - Any functionality not meeting security constraints **must be rejected**
   - No connection strings — Managed Identity only
   - No access keys — RBAC only

4. **Project Agent Manifest**
   - `cloud-architect` creates the Project Agent Manifest
   - Copy `.claude/templates/PROJECT_AGENT_MANIFEST.yaml` to `.claude/context/PROJECT_AGENT_MANIFEST.yaml`
   - Define all applications with their primary agents and consumed services
   - Define all Azure services with their agent teams
   - Map dependencies between applications and services
   - This manifest governs agent engagement for the remainder of the project

5. **Architecture Document**
   - `cloud-architect` engages `document-writer`
   - Copy `.claude/templates/ARCHITECTURE.md` to `concept/docs/ARCHITECTURE.md`
   - Document all components

6. **Cost Estimation**
   - `cost-analyst` creates cost estimate
   - Copy `.claude/templates/COST_ESTIMATE.md` to `deliverables/COST_ESTIMATE.md`
   - Three tiers: low, medium, high utilization

## Architecture Document Contents

The `concept/docs/ARCHITECTURE.md` must include:

- High-level architecture (Mermaid diagram)
- Workflow pipelines
- Application life cycles
- Azure services infrastructure
- Data storage architecture
- Service dependencies
- Scaling and disaster recovery
- Error handling and retry logic
- Interactivity between systems
- Rationale for solution choices

## Agent Responsibilities

| Agent | Responsibility |
|-------|----------------|
| `cloud-architect` | Overall architecture design, coordination, **Project Agent Manifest** |
| Service architects | Service-specific design decisions |
| `document-writer` | Architecture document creation |
| `cost-analyst` | Cost estimation |

## Key Principles

- **Prefer simplicity** — But don't sacrifice functionality
- **Present options** — When comparable solutions exist
- **Reject insecure** — No exceptions to security constraints
- **Document rationale** — Explain why solutions were chosen
- **Use Mermaid diagrams** — Visual representation of architecture

## Deliverables

| Deliverable | Location | Owner |
|-------------|----------|-------|
| Project Agent Manifest | `.claude/context/PROJECT_AGENT_MANIFEST.yaml` | `cloud-architect` |
| Architecture Document | `concept/docs/ARCHITECTURE.md` | `document-writer` |
| Cost Estimate | `deliverables/COST_ESTIMATE.md` | `cost-analyst` |

## Cost Estimate Requirements

The cost estimate must include for each tier (low/medium/high):
- Assumptions
- Limitations
- Concerns
- Improvement considerations
- Cost optimization opportunities

## Exit Criteria

- [ ] Architecture satisfies all business requirements
- [ ] Architecture complies with security constraints
- [ ] Human has approved architecture
- [ ] Mermaid diagram created
- [ ] All service dependencies documented
- [ ] `.claude/context/PROJECT_AGENT_MANIFEST.yaml` complete
- [ ] `concept/docs/ARCHITECTURE.md` complete
- [ ] `deliverables/COST_ESTIMATE.md` complete

## Next Stage

Proceed to **Stage 6: Create Deployment Plan** when architecture is approved.
