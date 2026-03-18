# Azure Innovation Factory - Copilot Starter Kit

This starter kit provides Copilot guidance, custom agents, and sample solution assets for implementing Azure solutions through Microsoft's Innovation Factory program. Engagements are **limited to 10 days** and deliver **functional prototypes**, not production systems.

## Quick Start

1. Copy the contents to your project root
2. Open the repository in GitHub Copilot-enabled tooling
3. When prompted, indicate the current process stage (1-12)
4. Read `.github/copilot-instructions.md` for repository-specific guidance

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
├── concept/                            # Solution code (under git)
│   ├── AZURE_CONFIG.json               # Central configuration
│   ├── docs/                           # Technical documentation
│   ├── apps/                           # Application source code
│   ├── infrastructure/                 # Terraform/Bicep modules
│   └── sql/                            # Database scripts
└── .github/
    ├── copilot-instructions.md         # Repository-specific Copilot guidance
    ├── agents/                         # Custom Copilot agent definitions
    └── workflows/                      # CI/CD workflows
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

Use the checked-in docs under `concept/docs/` and `deliverables/` as the current repository guidance surface. Do not assume a `.claude/templates/` directory exists unless it is added later.

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

## Custom Agents

The following custom Copilot agents are defined in `.github/agents/`:

| Agent | File | Purpose |
|-------|------|---------|
| `api-unit-test-engineer` | `api-unit-test-engineer.md` | Jest + supertest unit tests for the Express API |
| `web-unit-test-engineer` | `web-unit-test-engineer.md` | Vitest + React Testing Library unit tests for the React web app |

Both agents support two operational modes: **TDD Greenfield** (test-first for new code) and **Retrofit** (adding tests to existing untested code). See each agent file for full testing patterns and conventions.

## Critical Files

| File | Purpose |
|------|---------|
| `.github/copilot-instructions.md` | Repository-specific Copilot guidance |
| `.github/agents/*.md` | Custom Copilot agent definitions |
| `concept/AZURE_CONFIG.json` | Resource configuration |

---

**See `.github/copilot-instructions.md` for current repository instructions.**
