# Demo Branch: Spec-Driven Agentic Coding
## The Gap
`concept/apps/api/src/` and `concept/apps/web/src/` are intentionally empty.
`concept/sql/` has no SQL files.
The spec, CLAUDE.md, Dockerfiles, and all config files exist.

## What Copilot Does
Reads the spec in `concept/.specify/specify.md` + `CLAUDE.md` and scaffolds:
- Full Express API with all 12 endpoints
- Full React frontend with user select → project list → kanban → task detail
- PostgreSQL schema + seed data

## Copilot Prompt (paste into Agent mode)
```
Read CLAUDE.md and concept/.specify/specify.md.
Scaffold the complete Taskify application:
- concept/apps/api/src/ — Node.js/Express API
- concept/apps/web/src/ — React/Vite/TypeScript frontend
- concept/sql/ — 001_create_tables.sql and 005_seed_data.sql
Follow every convention in CLAUDE.md exactly.
```

## Cascade Spec Change Prompt
```
The spec has been updated: tasks now have a priority field (High, Medium, Low, default Medium).
Update the SQL migration, API endpoints, and the task Card component.
Maintain all existing patterns.
```

## Reset
```bash
git checkout main && git branch -D demo/playwright-testing
bash setup-demo-branches.sh --only playwright-testing
```
