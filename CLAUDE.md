# Azure Innovation Factory Implementation Team

## Overview

This project uses a team of specialized AI agents to architect, develop, and deploy Azure solutions within Microsoft's locked-down internal Azure subscription environment. All agents understand the constraints of Microsoft internal Azure environments, including mandatory managed identity usage, restricted access patterns, and compliance requirements.

**CRITICAL: AGENTS MUST BE USED AT ALL TIMES. NO EXCEPTIONS.**

## Context
**CRITICAL: All agents MUST read the `.claude/context/INNOVATION_FACTORY.md` to understand the goals and procedures of the Innovation Factory program.**

**CRITICAL: The Spec Kit constitution (`.specify/memory/constitution.md`) establishes non-negotiable principles for all technical decisions and must be followed throughout the engagement.**

Agents must be familiar with the Innovation Factory in order to build in alignment with its priorities and principles. Doing so will prevent scope creep, eliminate unnecessary code bloat, and ensure that a solid, functioning POC is constructed that meets the customer's requirements.

## Critical Constraints

### Microsoft Internal Azure Environment Restrictions
- **NO connection strings** - All services must use Managed Identity authentication
- **NO access keys** - Use RBAC and identity-based access control
- **Resource providers may need explicit registration** - Coordinate with subscription-expert
- **Strict networking requirements** - Private endpoints preferred, public access restricted
- **Compliance tagging required** - All resources must have appropriate tags
- **Naming conventions enforced** - Follow Microsoft internal naming standards

### Customer Technology Alignment
- **Use the customer's preferred technology stack** — do not impose alternatives
- If customer has no preference, recommend based on simplicity and Microsoft best practices
- Document rationale for any technology choices in ARCHITECTURE.md

## Service Constraints
Each service architect will maintain a set of constraints for the environment. All service agents must review constraints with their respective service architect before recommending and/or implementing a solution.

### Execution Policy
**CRITICAL: No agent may execute Azure CLI, PowerShell, Terraform, or Bicep commands directly.**

When Claude Code is started, the user must first be asked which process stage the project is currently on. Then, the agents must immediately learn and be aware of the requirements and deliverables of each stage as detailed below. 

Additionally, any agent may call any other agent, however, only one instance of a specific agent may execute at a time to ensure there is no duplication or conflict in instructions.

All commands that need to be executed against Azure must be:
1. Documented clearly in the appropriate output
2. Provided to the user for manual execution
3. Include any prerequisites or sequence requirements
4. Any configuration changes must be reflected in the documentation, including updating scripts (SSL, terraform, bicep, etc.)

## Escalation Procedures

When an agent encounters a blocker:
1. Document the blocker and attempted solutions
2. Escalate to `cloud-architect` for technical blockers
3. Escalate to `project-manager` for scope/requirement blockers
4. If unresolved after 10 minutes of investigation, expand search to web
5. If unresolved after 30 minutes of investigation, flag to human
6. Do NOT proceed with workarounds without human approval

## Troubleshooting Policy

**ALL troubleshooting flows through `qa-engineer`.** When a user reports:
- Errors or failures
- Unexpected behavior
- Bugs or issues
- "Why isn't this working?"

Immediately delegate to `qa-engineer`. Do NOT attempt to diagnose directly. `qa-engineer` owns the full diagnostic lifecycle: gathering evidence, analyzing logs, identifying root causes, and coordinating fixes with specialized agents.

## Project Structure

```bash
/
├── CLAUDE.md                    # This file
├── artifacts/                   # Reference documentation and images that have been provided by the customer
├── deliverables/                # Client-facing deliverables
│   ├── AS_BUILT.md              # As-built document describing the final solution and its architecture
│   ├── COST_ESTIMATE.md         # Cost analysis
│   ├── POST_MORTEM.md           # Project retrospective
│   ├── SCOPE_OF_WORK.md         # Scope of work documents
│   └── FINAL_DELIVERY.pptx      # Final presentation
├── concept/                     # Client-facing deliverables (this folder and its contents will be under git)
│   ├── .specify/                # Spec kit files
│   ├── AZURE_CONFIG.json        # Central configuration (updated and referenced by each 'deploy.sh' script)
│   ├── README.md                # Public repository README (created in Stage 12)
│   ├── docs/                    # Implementation documentation
│   │   ├── ARCHITECTURE.md      # Architecture document
│   │   ├── CONFIGURATION.md     # Service configuration guide
│   │   ├── DEPLOYMENT.md        # Deployment runbooks
│   │   └── DEVELOPMENT.md       # Development guide
│   ├── apps/                    # Application source code
│   ├── infrastructure/          # Infrastructure 
│   │   ├── deploy.sh            # Multi-staged deployment script for infrastructure
│   │   ├── terraform/           # Terraform modules
│   │   └── bicep/               # Bicep templates
│   └── sql/                     # SQL DDL scripts
│       ├── 001_create_tables.sql        # DDL script for creating tables
│       ├── 002_create_views.sql         # DDL script for creating views
│       ├── 003_create_sprocs.sql        # DDL script for creating stored procedures
│       ├── 004_create_udfs.sql          # DDL script for user-defined functions
│       └── 005_seed_data.sql            # DDL script for seeding tables with data
└── .claude/                     # Claude's configuration
    ├── agents/                  # Agent definitions
    ├── context/                 # Context for the Innovation Factory program
    │   └── INNOVATION_FACTORY.md        # Full description of the Innovation Factory program
    ├── skills/                  # Skill definitions
    └── templates/               # Templates used by agents and skills to produce specific deliverables
```

## Project Documentation
All standard project documentation **MUST** use the templates provided. Where the instructions below reference the project documentation, Claude must _copy_ the template to the project folder and provide the content as instructed.

| Project Document | Template Path |
| --- | --- |
| .specify/memory/constitution.md | _(Pre-populated - do not modify)_ |
| .claude/context/PROJECT_AGENT_MANIFEST.yaml | .claude/templates/PROJECT_AGENT_MANIFEST.yaml |
| concept/README.md | .claude/templates/README.md |
| deliverables/AS_BUILT.md | .claude/templates/AS_BUILT.md |
| deliverables/COST_ESTIMATE.md | .claude/templates/COST_ESTIMATE.md |
| deliverables/POST_MORTEM.md | .claude/templates/POST_MORTEM.md |
| deliverables/SCOPE_OF_WORK.md | .claude/templates/SCOPE_OF_WORK.md |
| concept/AZURE_CONFIG.json | .claude/templates/AZURE_CONFIG.json |
| concept/docs/ARCHITECTURE.md | .claude/templates/ARCHITECTURE.md |
| concept/docs/CONFIGURATION.md | .claude/templates/CONFIGURATION.md |
| concept/docs/DEPLOYMENT.md | .claude/templates/DEPLOYMENT.md |
| concept/docs/DEVELOPMENT.md | .claude/templates/DEVELOPMENT.md |

## Time Constraint
**CRITICAL: Innovation Factory engagements are limited to a MAXIMUM of 10 days.**

- Do not over-engineer solutions
- Prioritize working functionality over perfection
- If a feature cannot be completed within the time constraint, recommend descoping rather than extending
- Agents should flag time concerns to `project-manager` immediately

## Prototype Mindset
**REMINDER: All Innovation Factory deliverables are FUNCTIONAL PROTOTYPES, not production-ready solutions.**

- Implement the minimum viable solution that demonstrates the concept
- Document shortcuts and their production implications rather than implementing production-grade features
- Security hardening is advisory (documented) not implemented
- Production-grade error handling, logging, and monitoring are out of scope unless explicitly required

## Scope Management
**CRITICAL: Scope creep is the most common cause of failed POCs.**

- Any request that expands beyond the approved SOW must be flagged to `project-manager`
- `project-manager` must inform the human before any scope expansion work begins
- New requirements discovered during implementation should be documented for "Phase 2" rather than implemented
- When in doubt, ask: "Is this required to demonstrate the core value proposition?"

## Version Control

- All code in `concept/` folder is under git version control
- Human will be responsible for **manually** committing and pushing code
- With the exception of the `AZURE_CONFIG.json`, do not store customer name, secrets, connection strings, or sensitive configuration
- At no point should **ANYTHING** in the `concept/` folder contain information that identifies the customer or private trade information. This includes documentation (in the `concept/docs/` folder) and Spec Kit documentation. The only exception to this rule is the `AZURE_CONFIG.json`, which will be ignored on check-in.
- The `concept/` folder should be deployable from a fresh clone

## Required Process
**CRITICAL:** In order to ensure consistency across all _Innovation Factory_ engagements, the following process **MUST** be followed. There are **NO EXCEPTIONS**.

**IMPORTANT:** Agents are **NOT** allowed to move forward to the next stage until given permission to do so.

When working on a specific stage, read the detailed procedures from `.claude/context/stages/STAGE_XX_[NAME].md` as listed in the following table.

There are two generic parties referenced in the procedures:
- Human: a live person, usually required for interaction or providing additional context
- Agent: an agent that is responsible for carrying out a function. Note that a specific agent may or may not be referenced. If a specific agent is not mentioned, the most appropriate agent must be selected to perform the task according to the **Agent Delegation Rules** in the following section.

| Phase | Stage | File | Summary |
|-------|-------|------|---------|
| 1: Strategy (1 day) | 1 | STAGE_01_DISCOVERY.md | Human gathers artifacts from customer |
| | 2 | STAGE_02_SOW.md | Generate scope of work |
| | 3 | STAGE_03_APPROVAL.md | Customer sign-off (human-only) |
| 2: Prototyping (2-4 days) | 4 | STAGE_04_AGENT_DISCOVERY.md | Deep requirements analysis |
| | 5 | STAGE_05_ARCHITECTURE.md | Design and document architecture |
| | 6 | STAGE_06_DEPLOYMENT_PLAN.md | Create configuration guide |
| | 7 | STAGE_07_BUILD.md | Build IaC and applications |
| | 8 | STAGE_08_DEPLOY_INFRA.md | Deploy infrastructure |
| | 9 | STAGE_09_DEPLOY_APPS.md | Deploy applications |
| 3: Validate (1-2 days) | 10 | STAGE_10_TESTING.md | Customer validation |
| 4: Improve (1-2 days) | 11 | STAGE_11_REFACTORING.md | Implement feedback |
| 5: Evaluate (1 day) | 12 | STAGE_12_FINAL_DELIVERY.md | AS_BUILT, POST_MORTEM, handoff |
| 6: Hand Off (ongoing) | — | _(Human-managed)_ | CSM/Partner handoff |

## Agent Delegation Rules

### Mandatory Agent Usage
**EVERY interaction MUST be handled by the appropriate agent.** There is no "default" mode.

### Agent Selection Priority
1. If the request clearly maps to a specific service + role, delegate to that agent
2. **User reports issue, error, bug, or problem → `qa-engineer`**
3. If the request is about project scope, requirements, or client communication, delegate to `project-manager`
4. If the request spans multiple services, delegate to `cloud-architect` for coordination
5. If the request is about discovery or requirements analysis, delegate to `business-analyst`
6. If the request is about documentation (specs or technical docs), delegate to `documentation-manager`
7. If the request is about costs, delegate to `cost-analyst`
8. If the request is about subscription-level configuration, delegate to `subscription-expert`
9. If the request is about creating agents or managing the manifest, delegate to `agent-manager`
10. **If no appropriate agent can be determined, `project-manager` MUST ask the user who to assign the work to**

### Service Agent Coordination Pattern
For any Azure service implementation, the four service agents work together:
1. **architect** - Designs configuration, security, networking, and identity requirements
2. **developer** - Writes application code to interact with the service
3. **terraform** - Creates Terraform modules for deployment
4. **bicep** - Creates Bicep templates for deployment

### AZURE_CONFIG.json
The `cloud-architect` orchestrates cross-service coordination and is the responsible owner of the `concept/AZURE_CONFIG.json` file. The `concept/AZURE_CONFIG.json` is automatically generated and updated by the various steps of the assorted deployment scripts. Additionally, those same deployment scripts will reference values from previous steps to perform configurations of subsequent steps. The `cloud-architect` maintains any manual updates `concept/AZURE_CONFIG.json`.

## Available Agents

### Support Agents (Always Available)
| Agent | Responsibility |
|-------|---------------|
| `project-manager` | Scope, requirements, coordination, deliverables |
| `business-analyst` | Discovery analysis, requirements, gap identification |
| `cloud-architect` | Azure cross-service coordination, AZURE_CONFIG.json |
| `subscription-expert` | Subscription configuration, resource providers |
| `documentation-manager` | All documentation: Spec Kit (.specify/) and technical docs (concept/docs/) |
| `cost-analyst` | Cost estimation in deliverables/ |
| `qa-engineer` | Troubleshooting, log analysis, issue diagnosis, bug resolution |
| `agent-manager` | Creates service agents and manages PROJECT_AGENT_MANIFEST.yaml |

### Project Agents (Defined in Manifest)
**CRITICAL: Refer to `.claude/context/PROJECT_AGENT_MANIFEST.yaml` for project-specific agent assignments.**

The Project Agent Manifest defines:
- **Applications** and their primary developer agents
- **Azure Services** used and their agent teams (architect, developer, terraform, bicep)
- **Dependencies** between applications and services
- **Engagement Rules** for when to involve which agents

**Manifest Maintenance:**
| Event | Responsible Agent | Action |
|-------|------------------|--------|
| Initial creation | `cloud-architect` | Create during Stage 5 (Architecture) |
| New app/service added | `cloud-architect` | Update during Stage 7 (Build) |
| Architecture changes | `cloud-architect` | Update during Stage 11 (Refactoring) |
| Dependencies change | `cloud-architect` | Update immediately when discovered |

When working on code or infrastructure:
1. **Read the manifest** to identify the primary agent for the component
2. **Check consumed services** to identify related agents that should be engaged
3. **Follow engagement rules** to ensure proper coordination across agents

Each Azure service has four agent roles:
- **architect** - Designs configuration, security, networking, and identity requirements
- **developer** - Writes application code to interact with the service
- **terraform** - Creates Terraform modules for deployment
- **bicep** - Creates Bicep templates for deployment

## AZURE_CONFIG.json Schema

The `cloud-architect` owns this file and, alongside the deployment scripts, maintains it with all project configuration. Copy from `.claude/templates/AZURE_CONFIG.json` to `concept/`. Resources require `name`, `id`, `resourceGroup` at minimum; add SKU, configuration as needed.

```json
{
  "project": { "name": "", "customer": "", "environment": "dev", "createdDate": "", "lastModified": "" },
  "subscription": { "id": "", "name": "", "tenantId": "", "resourceProviders": [] },
  "tags": { "required": ["Environment", "Stage", "Purpose"], "optional": [] },
  "stages": {
    "stage1": {
      "name": "Foundation",
      "description": "Foundational components",
      "resourceGroups": {
        "group1": { "name": "rg-{uid}-foundation", "location": "eastus", "tags": {} }
      },
      "managedIdentities": {},
      "resources": {
        "keyVault": { "name": "", "id": "", "resourceGroup": "" },
        "appInsights": { "name": "", "id": "", "resourceGroup": "" },
        "logAnalytics": { "name": "", "id": "", "resourceGroup": "" }
      }
    },
    "stage2": {
      "name": "Data",
      "description": "Database components",
      "resourceGroups": { "group1": { "name": "rg-{uid}-data", "location": "eastus", "tags": {} } },
      "managedIdentities": {},
      "resources": { "azureSql": {}, "cosmosDb": {}, "redisCache": {} }
    }
  }
}
```

## Spec Kit Integration

The `documentation-manager` maintains GitHub Spec Kit documentation:
- `constitution.md` - Project principles and constraints
- `specify.md` - Detailed specifications
- `plan.md` - Implementation plan
- `tasks.md` - Task breakdown
- `implement.md` - Implementation tracking

The `project-manager` coordinates with `documentation-manager` to ensure documentation stays current.

## Workflow Examples

### New Service Implementation
```
User: "Add Cosmos DB to the solution"
1. project-manager acknowledges and coordinates
2. cloud-architect designs integration with existing services
3. cosmos-db-architect defines configuration and security
4. cosmos-db-developer writes data access code
5. cosmos-db-terraform OR cosmos-db-bicep creates IaC
6. documentation-manager captures documentation
7. cost-analyst updates cost estimates
```

### Deployment Preparation
```
User: "Prepare deployment for staging"
1. cloud-architect validates AZURE_CONFIG.json
2. subscription-expert confirms resource providers
3. terraform/bicep agents generate deployment scripts
4. documentation-manager updates deployment runbook
5. human manually executes changes
```
