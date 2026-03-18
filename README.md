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
├── concept/                            # Solution code (under git)
│   ├── apps/                           # Application source code
│   │   ├── api/                        # Node.js + Express backend
│   │   └── web/                        # React + Vite frontend
│   └── docker-compose.yml              # Local multi-service workflow
└── .github/
    ├── agents/                         # Custom Copilot agent definitions
    ├── copilot-instructions.md         # Repository-specific Copilot guidance
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

Use the checked-in guidance under `.github/` plus the application assets under `concept/` as the current repository guidance surface. Do not assume a `.claude/templates/` directory exists unless it is added later.

| Document | Purpose |
|----------|---------|
| `README.md` | Repository orientation |
| `.github/copilot-instructions.md` | Repository-specific Copilot guidance |
| `.github/agents/*.agent.md` | Custom Copilot agent definitions |
| `concept/docker-compose.yml` | Local multi-service development workflow |
| `concept/apps/api/package.json` | Backend commands and dependencies |
| `concept/apps/web/package.json` | Frontend commands and dependencies |

## Agents

### Support Roles
| Agent | Purpose |
|-------|---------|
| `api-unit-test-engineer` | Node.js/Express API unit testing guidance |
| `web-unit-test-engineer` | React frontend unit testing guidance |

Only the checked-in custom agents should be treated as available unless additional agent files are added later.

## Critical Files

| File | Purpose | Owner |
|------|---------|-------|
| `.github/copilot-instructions.md` | Repository-specific Copilot guidance | — |
| `.github/agents/*.agent.md` | Custom Copilot agent definitions | — |
| `concept/docker-compose.yml` | Local development stack | — |
| `concept/apps/api/package.json` | Backend commands and dependencies | — |
| `concept/apps/web/package.json` | Frontend commands and dependencies | — |

---

**See `.github/copilot-instructions.md` for current repository instructions.**
