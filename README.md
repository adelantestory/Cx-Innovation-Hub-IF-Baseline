# Azure Innovation Factory - Starter Kit

This starter kit provides agents, templates, and context for implementing Azure solutions through Microsoft's Innovation Factory program. Engagements are **limited to 10 days** and deliver **functional prototypes**, not production systems.

## Quick Start

1. Copy the contents to your project root
2. Start the agent environment — agents load automatically
3. When prompted, indicate the current process stage (1-12)
4. Review the process and agent delegation rules in the project documentation

## Structure

```
.
├── artifacts/                          # Customer-provided discovery materials
├── deliverables/                       # Client-facing deliverables
│   ├── SCOPE_OF_WORK.md
│   ├── AS_BUILT.md
│   ├── POST_MORTEM.md
│   ├── COST_ESTIMATE.md
│   └── FINAL_DELIVERY.pptx
└── concept/                            # Solution code (under git)
    ├── .specify/                       # Spec Kit documentation
    │   └── memory/
    │       └── constitution.md         # Non-negotiable project principles
    ├── AZURE_CONFIG.json               # Central configuration
    ├── docs/                           # Technical documentation
    ├── apps/                           # Application source code
    ├── infrastructure/                 # Terraform/Bicep modules
    └── sql/                            # Database scripts
```

## Delivery Pipeline

| Phase | Stages | Duration |
|-------|--------|----------|
| 1. Strategy Briefing | 1-3: Discovery → SOW → Approval | 1 day |
| 2. Prototyping | 4-9: Design → Build → Deploy | 2-4 days |
| 3. Validate | 10: Customer testing | 1-2 days |
| 4. Improve | 11: Refinements | 1-2 days |
| 5. Evaluate | 12: Final deliverables | 1 day |
| 6. Hand Off | Ongoing with CSM/Partner | — |

## Key Constraints

- **10-Day Maximum** — Descope rather than extend
- **Prototype Mindset** — Document shortcuts, don't over-engineer
- **Managed Identity Only** — No connection strings or access keys
- **No Direct Execution** — Commands provided for manual execution
- **Customer Tech Stack** — Use their preferences, don't impose alternatives

## Templates

All deliverables use templates from `templates/`:

| Document | Purpose |
|----------|---------|
| `SCOPE_OF_WORK.md` | Engagement scope and success criteria |
| `AS_BUILT.md` | Final solution state and architecture |
| `POST_MORTEM.md` | Gap analysis and learnings |
| `COST_ESTIMATE.md` | Azure cost projections |
| `ARCHITECTURE.md` | Solution architecture |
| `CONFIGURATION.md` | Service configuration reference |
| `DEPLOYMENT.md` | Infrastructure deployment guide |
| `DEVELOPMENT.md` | Developer setup guide |
| `AZURE_CONFIG.json` | Central configuration schema |

## Agents

### Support Roles (7)
| Agent | Purpose |
|-------|---------|
| `project-manager` | Scope, coordination, deliverables |
| `business-analyst` | Discovery, requirements, gaps |
| `cloud-architect` | Architecture, AZURE_CONFIG.json |
| `subscription-expert` | Subscription config, resource providers |
| `spec-kit-expert` | GitHub Spec Kit documentation |
| `document-writer` | Technical documentation |
| `cost-analyst` | Cost estimation |

### Service Agents (64)
All service agents are trained on the limitations of the MCAPS environment and will seek to deploy infrastructure in alignment with internal policies.

Each of 16 Azure services has 4 agents: `-architect`, `-developer`, `-terraform`, `-bicep`

**Current Services:**
* API Management
* Application Insights
* Azure Functions
* Azure OpenAI
* Azure SQL
* Blob Storage
* Container Apps
* Container Apps Environment
* Container Registry
* Cosmos DB
* Key Vault
* Log Analytics
* Redis Cache
* Service Bus
* User-Managed Identity
* Web Apps

## Critical Files

| File | Purpose | Owner |
|------|---------|-------|
| `concept/.specify/memory/constitution.md` | Technical constraints | — |
| `concept/AZURE_CONFIG.json` | Resource configuration | `cloud-architect` |

---
