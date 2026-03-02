# Demo Branch: Security & Code Quality
## Seeded Vulnerabilities

### 1. SQL Injection — OWASP A03:2021 (Critical)
**Location:** `concept/apps/api/src/routes/tasks.js`, GET `/api/tasks/search`
```javascript
// VULNERABLE
`SELECT * FROM tasks WHERE title ILIKE '%${q}%'`
// Attack: ?q='; DROP TABLE tasks; --
```

### 2. Missing Input Validation — OWASP A04:2021 (High)
**Location:** POST `/api/projects/:id/tasks`
`assigned_user_id` is not validated against the users table.
Any arbitrary UUID is accepted — could reference non-existent users.

### 3. Broken Access Control — OWASP A01:2021 (High)
**Location:** PATCH `/api/tasks/:id/assign`
No authorization check — any user can reassign any task to anyone.
Should require the requester to be the current assignee or a PM.

## Demo Flow

### Step 1 — Copilot Security Review Prompt
```
Review concept/apps/api/src/routes/tasks.js for security vulnerabilities.

For each vulnerability found:
- Name the OWASP category
- Show the vulnerable code
- Explain the specific attack vector
- Provide the exact fix

Then apply all fixes.
```

### Step 2 — GitHub Advanced Security (CodeQL Autofix)
1. Push this branch: `git push origin demo/security-quality`
2. Go to the repo Security tab → Code Scanning
3. Wait for CodeQL scan (or show a pre-run scan)
4. Open the SQL Injection alert — show Copilot Autofix suggestion
5. Click "Commit suggestion" — generates a PR with the fix

## What Copilot Should Fix
1. Replace `%${q}%` interpolation with parameterized `ILIKE $1`
2. Add a SELECT EXISTS check that assigned_user_id is in users table before INSERT
3. Add X-User-Id check in assign route: verify requester is current assignee or PM role

## Reset
```bash
git checkout main && git branch -D demo/security-quality
bash setup-demo-branches.sh --only security-quality
```
