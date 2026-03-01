# Taskify - Development Guide

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Structure](#2-repository-structure)
3. [Local Development with Docker Compose](#3-local-development-with-docker-compose)
4. [Running Without Docker](#4-running-without-docker)
5. [Backend API Development](#5-backend-api-development)
6. [Frontend Development](#6-frontend-development)
7. [Database Development](#7-database-development)
8. [Azure Deployment](#8-azure-deployment)
9. [Debugging Tips](#9-debugging-tips)
10. [Common Issues](#10-common-issues)

---

## 1. Prerequisites

### Required Software

| Tool | Version | Purpose | Install |
|------|---------|---------|---------|
| Docker Desktop | 4.x+ | Runs all services locally via containers | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) |
| Node.js | 20 LTS | JavaScript runtime (for running outside Docker) | [nodejs.org](https://nodejs.org/) |
| npm | 10.x+ | Package manager (bundled with Node.js) | Included with Node.js |
| Git | 2.x+ | Version control | [git-scm.com](https://git-scm.com/) |

### Optional but Recommended

| Tool | Purpose | Install |
|------|---------|---------|
| Azure CLI | Azure resource management and deployment | `winget install Microsoft.AzureCLI` (Windows) / `brew install azure-cli` (macOS) |
| psql | PostgreSQL command-line client for direct DB access | Included with PostgreSQL or `brew install libpq` (macOS) |
| pgAdmin | GUI database management tool | [pgadmin.org](https://www.pgadmin.org/) |
| jq | JSON processor for querying AZURE_CONFIG.json | `choco install jq` (Windows) / `brew install jq` (macOS) |

### Verify Prerequisites

```bash
# Verify Docker is running
docker --version
docker compose version

# Verify Node.js (optional, for running outside Docker)
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x

# Verify Git
git --version
```

---

## 2. Repository Structure

```
concept/
  docker-compose.yml           # Local development orchestration
  AZURE_CONFIG.json            # Azure resource configuration (gitignored)
  apps/
    api/                       # Backend API (Node.js + Express)
      Dockerfile               # Production Dockerfile (multi-stage, node:20-alpine)
      Dockerfile.dev           # Development Dockerfile (nodemon hot reload)
      package.json
      src/
        index.js               # Express server entry point
        routes/                # API route handlers
        services/              # Database connection, Key Vault client
        middleware/            # Error handling, CORS
    web/                       # Frontend (React + TypeScript + Vite)
      Dockerfile               # Production Dockerfile (multi-stage: build + Nginx)
      Dockerfile.dev           # Development Dockerfile (Vite dev server)
      package.json
      vite.config.ts
      tailwind.config.js
      nginx.conf               # Production Nginx configuration
      src/
        App.tsx                # Root component
        api/                   # API client and types
        components/            # React components
  sql/                         # Database scripts
    001_create_tables.sql      # Schema: tables, constraints, indexes
    005_seed_data.sql          # Seed: users, projects, tasks, comments
  infrastructure/              # Infrastructure-as-Code
    deploy.sh                  # Multi-staged deployment orchestrator
    bicep/                     # Bicep templates
  docs/                        # Documentation
    ARCHITECTURE.md
    CONFIGURATION.md
    DEPLOYMENT.md
    DEVELOPMENT.md             # This file
```

---

## 3. Local Development with Docker Compose

Docker Compose is the recommended way to run Taskify locally. It provides a fully self-contained environment with PostgreSQL, the backend API, and the frontend dev server -- no Azure services required.

### Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd concept/

# 2. Start all services
docker compose up

# 3. Open the application
#    Frontend:  http://localhost:5173
#    API:       http://localhost:3000
#    DB:        localhost:5432 (user: postgres, password: postgres)
```

On first startup, Docker Compose will:
1. Pull the `postgres:16-alpine` image
2. Build the backend API image from `apps/api/Dockerfile.dev`
3. Build the frontend image from `apps/web/Dockerfile.dev`
4. Start PostgreSQL and run the SQL scripts in `sql/` to create tables and seed data
5. Start the backend API (waits for PostgreSQL health check to pass)
6. Start the frontend Vite dev server

### Common Docker Compose Commands

```bash
# Start all services (foreground -- logs visible in terminal)
docker compose up

# Start all services (background)
docker compose up -d

# Rebuild images after Dockerfile or dependency changes
docker compose up --build

# Stop all services (preserves database data)
docker compose down

# Stop all services and delete database volume (full reset)
docker compose down -v

# View logs for a specific service
docker compose logs api
docker compose logs web
docker compose logs db

# Follow logs in real-time
docker compose logs -f api

# Restart a single service
docker compose restart api

# Execute a command in a running container
docker exec -it taskify-api sh
docker exec -it taskify-db psql -U postgres -d taskify
```

### How Hot Reload Works

**Backend (nodemon)**: The `apps/api/src/` directory is bind-mounted into the API container. Nodemon watches for changes to `.js` and `.json` files and automatically restarts the Express server. You will see restart messages in the Docker Compose output.

**Frontend (Vite HMR)**: The `apps/web/src/` directory and configuration files are bind-mounted into the web container. Vite's Hot Module Replacement (HMR) pushes updates to the browser instantly without a full page reload. Component state is preserved during most edits.

**Database**: Changes to SQL files in `sql/` are NOT automatically applied. The PostgreSQL Docker image only executes init scripts when the data volume is first created. To apply schema changes, reset the database volume:

```bash
docker compose down -v
docker compose up
```

### Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | Application UI (Vite dev server) |
| Backend API | http://localhost:3000 | REST API |
| Health Check | http://localhost:3000/api/health | Verify API is running |
| PostgreSQL | localhost:5432 | Direct database access |

---

## 4. Running Without Docker

If you prefer to run services directly on your host machine (e.g., for IDE debugging), you can run each component independently.

### Start PostgreSQL

Option A: Use Docker for the database only:

```bash
cd concept/
docker compose up db
```

Option B: Use a local PostgreSQL 16 installation and create the database manually:

```bash
createdb taskify
psql -d taskify -f sql/001_create_tables.sql
psql -d taskify -f sql/005_seed_data.sql
```

### Start the Backend API

```bash
cd concept/apps/api/

# Install dependencies
npm install

# Set environment variables
export NODE_ENV=development
export PORT=3000
export PGHOST=localhost
export PGUSER=postgres
export PGPASSWORD=postgres
export PGDATABASE=taskify
export PGPORT=5432
export PGSSLMODE=disable
export AZURE_KEY_VAULT_URL=""
export CORS_ORIGIN=http://localhost:5173

# Start the server
npm run dev    # Uses nodemon
# or
node src/index.js    # Without auto-restart
```

### Start the Frontend

```bash
cd concept/apps/web/

# Install dependencies
npm install

# Set environment variable
export VITE_API_URL=http://localhost:3000

# Start Vite dev server
npm run dev
```

The frontend will be available at http://localhost:5173.

---

## 5. Backend API Development

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 LTS | Runtime |
| Express.js | 4.x | HTTP framework |
| pg (node-postgres) | 8.x | PostgreSQL client |
| cors | Latest | CORS middleware |
| @azure/identity | Latest | Managed Identity auth (Azure only) |
| @azure/keyvault-secrets | Latest | Key Vault access (Azure only) |

### Project Structure

```
apps/api/
  package.json
  Dockerfile             # Production (multi-stage)
  Dockerfile.dev         # Development (nodemon)
  src/
    index.js             # Entry point: server startup, Key Vault init
    routes/
      users.js           # GET /api/users, GET /api/users/:id
      projects.js        # GET/POST /api/projects, GET /api/projects/:id
      tasks.js           # CRUD + status + assign endpoints
      comments.js        # CRUD with ownership checks
    services/
      database.js        # pg Pool creation and connection management
    middleware/
      errorHandler.js    # Global error handling
```

### Database Connection Pattern

The backend detects whether it is running locally or on Azure by checking the `AZURE_KEY_VAULT_URL` environment variable:

```
if AZURE_KEY_VAULT_URL is empty or unset:
    --> Use PGHOST, PGUSER, PGPASSWORD from environment variables (local mode)

if AZURE_KEY_VAULT_URL is set:
    --> Use @azure/identity + @azure/keyvault-secrets to retrieve credentials
    --> Construct pg Pool from Key Vault secrets
```

This dual-mode pattern allows the same application code to run in both environments.

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/users | List all users |
| GET | /api/users/:id | Get single user |
| GET | /api/projects | List all projects |
| GET | /api/projects/:id | Get project with tasks |
| POST | /api/projects | Create project |
| GET | /api/projects/:projectId/tasks | List tasks for project |
| POST | /api/projects/:projectId/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| PATCH | /api/tasks/:id/status | Change task status |
| PATCH | /api/tasks/:id/assign | Assign/unassign user |
| DELETE | /api/tasks/:id | Delete task |
| GET | /api/tasks/:taskId/comments | List comments (threaded) |
| POST | /api/tasks/:taskId/comments | Add comment |
| PUT | /api/comments/:id | Edit comment (author only) |
| DELETE | /api/comments/:id | Delete comment (author only) |

### Testing the API

```bash
# Health check
curl http://localhost:3000/api/health

# List users
curl http://localhost:3000/api/users

# List projects
curl http://localhost:3000/api/projects

# Get tasks for a project
curl http://localhost:3000/api/projects/b1111111-1111-1111-1111-111111111111/tasks

# Create a task
curl -X POST http://localhost:3000/api/projects/b1111111-1111-1111-1111-111111111111/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test task", "description": "A test task"}'

# Move a task to in_progress
curl -X PATCH http://localhost:3000/api/tasks/<task-id>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress", "position": 0}'

# Add a comment (requires X-User-Id header)
curl -X POST http://localhost:3000/api/tasks/<task-id>/comments \
  -H "Content-Type: application/json" \
  -H "X-User-Id: a1111111-1111-1111-1111-111111111111" \
  -d '{"content": "This is a test comment"}'
```

---

## 6. Frontend Development

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18+ | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5+ | Build tool and dev server |
| Tailwind CSS | 3.x | Utility-first CSS |
| @hello-pangea/dnd | Latest | Drag-and-drop for Kanban board |

### Project Structure

```
apps/web/
  package.json
  Dockerfile               # Production (multi-stage: build + Nginx)
  Dockerfile.dev           # Development (Vite dev server)
  nginx.conf               # Production Nginx config
  vite.config.ts           # Vite configuration
  tailwind.config.js       # Tailwind CSS configuration
  tsconfig.json            # TypeScript config
  postcss.config.js        # PostCSS config (required by Tailwind)
  index.html               # HTML entry point
  public/                  # Static assets
  src/
    App.tsx                # Root component with routing
    main.tsx               # React DOM mount point
    api/
      client.ts            # API client functions
      types.ts             # TypeScript interfaces
    components/
      layout/
        Header.tsx         # App header with Switch User
      users/
        UserSelect.tsx     # Landing screen with 5 user cards
      projects/
        ProjectList.tsx    # Project listing
      kanban/
        Board.tsx          # Kanban board with 4 columns
        Column.tsx         # Individual column
        Card.tsx           # Task card
        TaskDetail.tsx     # Task detail modal
      comments/
        CommentList.tsx    # Threaded comment display
        CommentForm.tsx    # Comment input form
```

### Environment Variables

Vite only exposes environment variables prefixed with `VITE_` to client-side code:

| Variable | Purpose | Local Value |
|----------|---------|-------------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000` |

Access in code:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || '';
```

### Vite Dev Server Proxy

When running without Docker, `vite.config.ts` includes a proxy configuration that forwards `/api` requests to the local backend:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
```

When running with Docker Compose, the frontend calls the API directly via `VITE_API_URL=http://localhost:3000` (no proxy needed since they are on different ports).

---

## 7. Database Development

### Schema

The database schema is defined in `concept/sql/001_create_tables.sql` and includes four tables:

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Predefined team members (5 users) | id, name, role, avatar_color |
| `projects` | Kanban project boards | id, name, description |
| `tasks` | Task cards within projects | id, project_id, title, status, position, assigned_user_id |
| `comments` | Threaded comments on tasks | id, task_id, user_id, parent_comment_id, content |

### Seed Data

Seed data in `concept/sql/005_seed_data.sql` provides:

| Entity | Count | Details |
|--------|-------|---------|
| Users | 5 | 1 Product Manager (Sarah Chen), 4 Engineers |
| Projects | 3 | Website Redesign, Mobile App MVP, API Integration |
| Tasks | 12 | 4 per project, one in each Kanban column |
| Comments | 7 | Sample threaded discussion on selected tasks |

### Accessing the Database Locally

```bash
# Via Docker exec (preferred when running with Docker Compose)
docker exec -it taskify-db psql -U postgres -d taskify

# Via psql on host (requires psql installed)
psql -h localhost -U postgres -d taskify
# Password: postgres

# Useful queries
SELECT name, role FROM users;
SELECT name FROM projects;
SELECT t.title, t.status, u.name AS assignee
  FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id;
SELECT c.content, u.name AS author
  FROM comments c JOIN users u ON c.user_id = u.id;
```

### Modifying the Schema

1. Edit the SQL files in `concept/sql/`
2. Reset the database volume: `docker compose down -v`
3. Restart: `docker compose up`

For incremental changes during development, you can execute SQL directly:

```bash
docker exec -it taskify-db psql -U postgres -d taskify -c "ALTER TABLE tasks ADD COLUMN priority TEXT;"
```

---

## 8. Azure Deployment

For Azure deployment instructions, see:

- **DEPLOYMENT.md** -- Full deployment runbook with step-by-step commands
- **CONFIGURATION.md** -- Service configurations and environment variables

### Key Differences from Local

| Aspect | Local | Azure |
|--------|-------|-------|
| Database credentials | Env vars (`postgres/postgres`) | Key Vault secrets via Managed Identity |
| SSL | Disabled (`PGSSLMODE=disable`) | Required (`PGSSLMODE=require`) |
| Frontend serving | Vite dev server (port 5173) | Nginx static serving (port 80) |
| Backend restart | nodemon hot reload | Container App cold start |
| Container images | Built locally by Docker Compose | Built and pushed to Azure Container Registry |
| API URL | `http://localhost:3000` | `https://ca-{uid}-taskify-api.<region>.azurecontainerapps.io` |

---

## 9. Debugging Tips

### Backend API

**View logs in Docker Compose:**

```bash
# Follow API logs in real-time
docker compose logs -f api

# View last 50 lines
docker compose logs --tail 50 api
```

**Attach a debugger (running outside Docker):**

```bash
cd concept/apps/api/
node --inspect src/index.js
```

Then attach VS Code or Chrome DevTools to `localhost:9229`.

**Test a single endpoint:**

```bash
# Use curl with verbose output
curl -v http://localhost:3000/api/health

# Pretty-print JSON responses
curl -s http://localhost:3000/api/users | jq '.'
```

### Frontend

**View logs in Docker Compose:**

```bash
docker compose logs -f web
```

**Browser DevTools:**
- Open Chrome DevTools (F12)
- Check the Console tab for runtime errors
- Check the Network tab to inspect API requests/responses
- React DevTools extension shows component tree and state

### Database

**Check if tables exist:**

```bash
docker exec -it taskify-db psql -U postgres -d taskify -c "\dt"
```

**Check row counts:**

```bash
docker exec -it taskify-db psql -U postgres -d taskify -c "
  SELECT 'users' AS t, COUNT(*) FROM users
  UNION ALL SELECT 'projects', COUNT(*) FROM projects
  UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
  UNION ALL SELECT 'comments', COUNT(*) FROM comments;
"
```

**View a table's structure:**

```bash
docker exec -it taskify-db psql -U postgres -d taskify -c "\d tasks"
```

---

## 10. Common Issues

| Issue | Cause | Resolution |
|-------|-------|------------|
| `Cannot connect to the Docker daemon` | Docker Desktop is not running | Start Docker Desktop |
| `port 5432 already in use` | A PostgreSQL instance is running on the host | Stop it: `brew services stop postgresql` (macOS) or change the port in `docker-compose.yml` |
| `port 3000 already in use` | Another process on port 3000 | Find and stop it: `lsof -i :3000` (macOS/Linux) or `netstat -ano \| findstr :3000` (Windows) |
| `port 5173 already in use` | Another Vite server is running | Stop it or change the port in `docker-compose.yml` |
| API returns `ECONNREFUSED` to DB | API started before DB was ready | This should not happen (Docker Compose health check); try `docker compose down && docker compose up` |
| Database has no data | Volume already existed from a previous run without seed data | Run `docker compose down -v && docker compose up` |
| Frontend changes not appearing | Vite HMR websocket disconnected | Refresh the browser; check that port 5173 is not blocked |
| `npm install` fails inside container | Network issue or stale cache | Run `docker compose build --no-cache` |
| Windows: file changes not detected | Docker Desktop file sharing not enabled for project path | Enable file sharing in Docker Desktop Settings > Resources > File sharing |
| `FATAL: role "postgres" does not exist` | Using a non-Docker PostgreSQL without the default role | Create the role: `createuser -s postgres` |

---

*Last updated: 2026-02-12*
