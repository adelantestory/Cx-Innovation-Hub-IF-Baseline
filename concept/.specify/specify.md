# Taskify — Structured Specification
# Source: artifacts/Taskify Product Description.txt
# This file is the authoritative spec for Copilot to scaffold from.

## Application Type
Kanban-style team productivity platform (functional prototype, no auth)

## Tech Stack
| Layer       | Technology                              |
|-------------|----------------------------------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind   |
| Backend     | Node.js 20, Express 4, CommonJS        |
| Database    | PostgreSQL 16                           |
| DnD         | @hello-pangea/dnd                       |
| Local Dev   | Docker Compose (see docker-compose.yml) |

## Conventions (from CLAUDE.md)
- API uses PG env vars: PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT
- CORS allows X-User-Id header (used for comment authorship — no JWT)
- SQL scripts in concept/sql/ named NNN_description.sql (run in order)
- Both apps have Dockerfile.dev and Dockerfile already — do not replace them
- Follow existing package.json scripts exactly

## Users (Predefined — no login, no password)
| ID | Name          | Role            | avatar_color |
|----|---------------|-----------------|--------------|
| 1  | Sarah Chen    | Product Manager | #6366f1      |
| 2  | Alex Rivera   | Engineer        | #10b981      |
| 3  | Jordan Kim    | Engineer        | #f59e0b      |
| 4  | Taylor Morgan | Engineer        | #ef4444      |
| 5  | Casey Davis   | Engineer        | #8b5cf6      |

## Projects (3 predefined)
1. Mobile App Redesign
2. API Performance Initiative
3. Platform Security Audit

## Task Status Values (internal DB values)
- todo
- in_progress
- in_review
- done

## Kanban Display Columns (in order)
| Display Label | DB status value |
|---------------|-----------------|
| To Do         | todo            |
| In Progress   | in_progress     |
| In Review     | in_review       |
| Done          | done            |

## User Flow
1. Launch → UserSelect screen: list of 5 users, click to "log in" (no password)
2. Click user → ProjectList view (stored in App state, not URL)
3. Click project → Kanban Board (4 columns)
4. Click task card → TaskDetail modal (comments, assign, status change)

## Task Card Features
- Assigned-to-currentUser cards: visually highlighted (different bg color)
- Drag-and-drop between columns changes status + position
- Position is an integer; ordering within a column

## Comment Rules
- Unlimited comments per task
- X-User-Id request header identifies the commenter
- Edit own comments only
- Delete own comments only (cascade deletes children)
- Comments can be threaded (parent_comment_id)

## Required API Endpoints
| Method | Path                              | Notes                          |
|--------|-----------------------------------|--------------------------------|
| GET    | /api/users                        | List all users                 |
| GET    | /api/projects                     | List all projects              |
| GET    | /api/projects/:id/tasks           | Tasks with assigned user JOIN  |
| POST   | /api/projects/:id/tasks           | { title, description?, assigned_user_id? } |
| PUT    | /api/tasks/:id                    | { title, description }         |
| PATCH  | /api/tasks/:id/status             | { status, position }           |
| PATCH  | /api/tasks/:id/assign             | { assigned_user_id }           |
| DELETE | /api/tasks/:id                    | Cascade deletes comments       |
| GET    | /api/tasks/:id/comments           | With author JOIN               |
| POST   | /api/tasks/:id/comments           | X-User-Id header required      |
| PUT    | /api/comments/:id                 | Author only (check X-User-Id)  |
| DELETE | /api/comments/:id                 | Author only (check X-User-Id)  |

## Database Schema
```sql
users       (id UUID PK, name TEXT, role TEXT, avatar_color TEXT, created_at)
projects    (id UUID PK, name TEXT, description TEXT, created_at)
tasks       (id UUID PK, project_id UUID FK, title TEXT, description TEXT,
             status TEXT, position INT, assigned_user_id UUID FK nullable,
             created_at, updated_at)
comments    (id UUID PK, task_id UUID FK, user_id UUID FK,
             parent_comment_id UUID FK nullable, content TEXT,
             created_at, updated_at)
```

## Seed Data Required
- 5 users (see Users table — use fixed UUIDs so seeds are repeatable)
- 3 projects
- 8-10 sample tasks spread across projects and columns
- 5-8 sample comments across tasks

## Copilot Prompt to Use
```
Read CLAUDE.md and concept/.specify/specify.md.
Scaffold the complete Taskify application:
- concept/apps/api/src/ — Node.js/Express API (match existing package.json and Dockerfiles)
- concept/apps/web/src/ — React/Vite/TypeScript frontend (match existing tsconfig/vite/tailwind)
- concept/sql/ — 001_create_tables.sql and 005_seed_data.sql
Follow every convention in CLAUDE.md exactly. This is a functional prototype.
```
