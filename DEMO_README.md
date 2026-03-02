# Demo Branch: App Modernization with GitHub Copilot
## The Legacy Codebase

### Security — Critical
- `concept/apps/api/src/index.js` — SQL injection in multiple routes (string concatenation)
- `concept/apps/api/src/index.js` — No authorization on DELETE /api/comments/:id
- `concept/infrastructure/deploy.sh` — Hardcoded database password

### Architecture — High
- No TypeScript anywhere (.js, .jsx files)
- Class-based React components with direct state mutation
- No modular route structure (all routes in index.js)
- No error handling middleware
- Missing Content-Type header in fetch calls

### Infrastructure — High
- Manual deploy.sh with hardcoded credentials
- No Infrastructure as Code

## Demo Prompt Sequence

### Step 1 — Assessment
```
Assess this codebase for modernization. Review concept/apps/api/src/ and
concept/apps/web/src/. Produce a prioritized list of issues:
Critical (security), High (architecture), Medium (quality), Low (style).
```

### Step 2 — PR 1: Fix SQL Injection (Critical — 5 min)
```
Fix all SQL injection vulnerabilities in concept/apps/api/src/index.js.
Replace every string-concatenated SQL query with parameterized queries ($1, $2...).
Also add the ownership check missing from DELETE /api/comments/:id —
verify req.headers['x-user-id'] matches the comment's user_id before deleting.
Do not change any business logic, only fix the injection patterns.
```

### Step 3 — PR 2: Modularize + Error Handling (High — 5 min)
```
Refactor concept/apps/api/src/index.js:
- Extract each resource's routes into concept/apps/api/src/routes/{users,projects,tasks,comments}.js
- Add a centralized error handler middleware in concept/apps/api/src/middleware/errorHandler.js
- Add a GET /api/health endpoint
- Add request logging (use a simple console.log middleware)
Follow the structure documented in CLAUDE.md.
```

### Step 4 — PR 3: Modernize React (High — 5 min)
```
Migrate concept/apps/web/src/components from class components to functional
components with React hooks. Start with KanbanBoard.jsx:
- useState instead of this.state
- useEffect instead of componentDidMount
- useCallback for event handlers
- Fix the direct state mutation bug (create new array/object instead)
- Add missing Content-Type: application/json header to all fetch calls
Also restore TypeScript: rename .jsx → .tsx, add type definitions.
```

### Step 5 — PR 4: Replace deploy.sh with Bicep (High — 5 min)
```
Replace concept/infrastructure/deploy.sh with proper IaC.
Generate concept/infrastructure/bicep/main.bicep that:
- Deploys all Taskify resources (Container Apps, PostgreSQL, Key Vault)
- Uses Managed Identity — NO hardcoded passwords or connection strings
- Stores DB connection string in Key Vault, references it from Container App
- Follows patterns in the existing stage*.bicep files
```

## Reset
```bash
git checkout main && git branch -D demo/app-modernization
bash setup-demo-branches.sh --only app-modernization
```
