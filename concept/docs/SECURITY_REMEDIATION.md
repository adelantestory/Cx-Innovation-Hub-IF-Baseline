# Taskify — Security Vulnerability Review & Remediation

> **Status:** Remediated  
> **Review Date:** 2026-05-01  
> **Scope:** Full codebase audit — API, frontend, infrastructure, Docker configuration

---

## Executive Summary

A full security review of the Taskify prototype identified **8 vulnerabilities** across the API, frontend, and Docker configuration. All findings were remediated in this PR. The highest-risk issues were:

1. SSL certificate validation disabled (MITM risk to database in Azure)
2. CORS wildcard origin default (cross-origin API access risk)
3. Missing security HTTP headers (clickjacking, MIME sniffing)
4. No input length limits (potential DoS via large payloads)
5. UUID route parameters not validated (database error information disclosure)

The `X-User-Id` authorization model is an **architectural limitation** of the prototype (noted separately below) — it cannot be fixed without introducing a real authentication system.

---

## Findings & Remediations

### 🔴 Critical — SSL Certificate Validation Disabled

| | |
|---|---|
| **OWASP** | A02:2021 — Cryptographic Failures |
| **File** | `concept/apps/api/src/services/database.js` |
| **Severity** | Critical |

**Vulnerability:**
```javascript
// BEFORE — disables TLS certificate verification
ssl: sslMode === "require" ? { rejectUnauthorized: false } : false,
```

Disabling `rejectUnauthorized` means the Node.js pg client accepts any TLS certificate — including forged ones — when connecting to PostgreSQL. An attacker who can intercept network traffic between the API and database could perform a man-in-the-middle (MITM) attack and read or modify all database traffic, including credentials and task data.

**Remediation:**
```javascript
// AFTER — validates the server's TLS certificate
ssl: sslMode === "require" ? { rejectUnauthorized: true } : false,
```

Azure Database for PostgreSQL Flexible Server presents a certificate signed by a well-known CA, so standard certificate validation works correctly in production.

---

### 🔴 High — CORS Wildcard Origin Default

| | |
|---|---|
| **OWASP** | A05:2021 — Security Misconfiguration |
| **File** | `concept/apps/api/src/index.js` |
| **Severity** | High |

**Vulnerability:**
```javascript
// BEFORE — any website can call this API
origin: process.env.CORS_ORIGIN || "*",
```

With `origin: "*"`, any webpage on the internet can make cross-origin requests to the API. This is particularly dangerous if users have authenticated sessions in a browser context.

**Remediation:**
```javascript
// AFTER — defaults to localhost for dev, production must set CORS_ORIGIN
const corsOrigin = process.env.CORS_ORIGIN || (IS_PRODUCTION ? undefined : "http://localhost:5173");
```

- **Local development:** defaults to `http://localhost:5173` (the Vite dev server)
- **Production:** requires `CORS_ORIGIN` environment variable to be set to the frontend domain  
- **Missing in production:** logs a warning and CORS blocks browser requests (fail-safe default)

**Action required:** Set `CORS_ORIGIN` in the Azure Container App environment to the Static Web App URL.

---

### 🟠 High — Missing Security HTTP Headers (API)

| | |
|---|---|
| **OWASP** | A05:2021 — Security Misconfiguration |
| **File** | `concept/apps/api/src/index.js` |
| **Severity** | High |

**Vulnerability:** The API returned no security-related HTTP headers.

**Remediation:** Added the following headers via middleware:

```javascript
res.setHeader("X-Content-Type-Options", "nosniff");      // Prevents MIME sniffing
res.setHeader("X-Frame-Options", "DENY");                // Prevents clickjacking
res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
```

---

### 🟠 High — Missing Security HTTP Headers (Frontend / Nginx)

| | |
|---|---|
| **OWASP** | A05:2021 — Security Misconfiguration |
| **File** | `concept/apps/web/nginx.conf` |
| **Severity** | High |

**Vulnerability:** The Nginx configuration serving the React SPA had no security headers.

**Remediation:** Added headers including a Content Security Policy:

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), camera=(), microphone=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';" always;
```

**Note:** The CSP allows `'unsafe-inline'` for styles because Tailwind CSS injects inline styles. For production hardening, consider extracting to a stylesheet with a nonce.

---

### 🟠 High — No Request Body Size Limit

| | |
|---|---|
| **OWASP** | A04:2021 — Insecure Design |
| **File** | `concept/apps/api/src/index.js` |
| **Severity** | High |

**Vulnerability:**
```javascript
// BEFORE — no body size limit (Express default is 100kb, but undocumented)
app.use(express.json());
```

Without an explicit limit, very large JSON payloads can exhaust server memory.

**Remediation:**
```javascript
// AFTER — explicitly limits body to 64 KB
app.use(express.json({ limit: "64kb" }));
```

---

### 🟠 High — No Rate Limiting on API Endpoints

| | |
|---|---|
| **OWASP** | A04:2021 — Insecure Design |
| **File** | `concept/apps/api/src/index.js`, new `middleware/rateLimiter.js` |
| **Severity** | High |

**Vulnerability:** All API endpoints were unrestricted — any client could send unlimited requests, enabling brute-force and denial-of-service attacks.

**Remediation:** Added an in-memory sliding-window rate limiter (`middleware/rateLimiter.js`) applied globally to all `/api/*` endpoints:

```javascript
app.use("/api", createRateLimiter({ windowMs: 60_000, max: 200 }));
```

- 200 requests per minute per IP
- Returns `429 Too Many Requests` with `Retry-After` header when exceeded
- Exposes `X-RateLimit-Limit/Remaining/Reset` headers

**Production note:** This in-memory implementation is suitable for single-replica deployments. For multi-replica Azure Container Apps, replace with a Redis-backed rate limiter (e.g., `express-rate-limit` + `rate-limit-redis`).

---

### 🟡 Medium — Missing Input Length Validation

| | |
|---|---|
| **OWASP** | A04:2021 — Insecure Design |
| **Files** | `concept/apps/api/src/routes/tasks.js`, `projects.js`, `comments.js` |
| **Severity** | Medium |

**Vulnerability:** Text fields (task titles, descriptions, comment content, project names) had no maximum length enforcement at the API layer. A caller could insert multi-megabyte strings that the database would reject — but only after consuming server resources.

**Remediation:** Added a shared `checkLength()` helper in `middleware/validate.js` and applied it across all write endpoints:

| Field | Limit |
|-------|-------|
| Task title | 255 characters |
| Task/project description | 5,000 / 2,000 characters |
| Comment content | 10,000 characters |
| Project name | 255 characters |

---

### 🟡 Medium — UUID Route Parameters Not Validated

| | |
|---|---|
| **OWASP** | A04:2021 — Insecure Design |
| **Files** | All route files |
| **Severity** | Medium |

**Vulnerability:** Route parameters (`:id`, `:taskId`, `:projectId`) were passed directly to SQL queries without UUID format validation. Non-UUID values triggered PostgreSQL errors that leaked internal details:

```
invalid input syntax for type uuid: "not-a-uuid"
```

**Remediation:** Created `middleware/validate.js` with a `validateUuidParams()` Express middleware and applied it to all route handlers:

```javascript
router.get("/tasks/:id", validateUuidParams("id"), async (req, res, next) => { ... });
```

Invalid UUIDs now return a clean 400 response before reaching the database.

---

### 🟡 Medium — `assigned_user_id` Not Validated Against Users Table

| | |
|---|---|
| **OWASP** | A04:2021 — Insecure Design |
| **File** | `concept/apps/api/src/routes/tasks.js` |
| **Severity** | Medium |

**Vulnerability:** `POST /api/projects/:id/tasks` and `PATCH /api/tasks/:id/assign` accepted any UUID as `assigned_user_id` without checking that the user actually exists. This allowed "ghost" user assignments.

**Remediation:** Added an existence check before any INSERT/UPDATE:

```javascript
const { rows: userCheck } = await getPool().query(
  "SELECT id FROM users WHERE id = $1",
  [assigned_user_id]
);
if (userCheck.length === 0) {
  return next(createError(400, "assigned_user_id does not refer to a valid user"));
}
```

---

### 🟡 Medium — Error Messages May Leak Internal Details in Production

| | |
|---|---|
| **OWASP** | A05:2021 — Security Misconfiguration |
| **File** | `concept/apps/api/src/middleware/errorHandler.js` |
| **Severity** | Medium |

**Vulnerability:** Unexpected 500 errors returned raw `err.message` to clients, which could include database driver error messages, stack traces, or internal paths.

**Remediation:** In production (`NODE_ENV=production`), unexpected 500 errors now return a generic message while still logging full details server-side:

```javascript
const clientMessage = (status === 500 && IS_PRODUCTION && !err.status)
  ? "Internal Server Error"
  : message;
```

---

## Architectural Limitation — X-User-Id Spoofability

> ⚠️ **This is a known prototype limitation, not a bug in this PR.**

The entire authorization model uses `X-User-Id` as a plain HTTP header to identify users. Any client can set any value and impersonate another user. This is intentional for the prototype (no login required) but is **not suitable for production**.

**Production remediation path:**
1. Integrate an identity provider (Azure Active Directory B2C, or Microsoft Entra External ID)
2. Issue JWTs after authentication
3. Replace `req.headers["x-user-id"]` checks with JWT validation middleware
4. Remove `X-User-Id` from the CORS allowed headers

This work is tracked as a Phase 2 item and is out of scope for the current prototype.

---

## Hardcoded Docker Compose Credentials

**File:** `concept/docker-compose.yml`  
**Severity:** Informational (local development only)

The docker-compose file uses `postgres/postgres` as the local database password. This is intentional for local development convenience and acceptable because:
- The database port (5432) is only exposed to `localhost`
- The compose file is never used in production (Azure uses Key Vault credentials)

**Recommendation for the team:** Add a `.env.example` file and load credentials from `.env` to make the local/prod distinction clearer. Not implemented in this PR to keep scope minimal.

---

## Infrastructure (Azure) — Existing Protections

The following security controls are already correctly implemented in the infrastructure and were **not changed**:

| Control | Implementation |
|---------|---------------|
| No hardcoded secrets | `deploy.sh` generates a random 32-char password and stores it in Key Vault |
| Managed Identity auth | API retrieves DB credentials at runtime via `ManagedIdentityCredential` |
| RBAC authorization | Key Vault uses `Key Vault Secrets User` role — no access policies |
| Non-root container | API Dockerfile: `USER node` |
| SSL in production | `PGSSLMODE=require` set in Azure Container App environment |

---

## Files Changed

| File | Change |
|------|--------|
| `concept/apps/api/src/index.js` | Security headers, CORS hardening, explicit body size limit, rate limiting |
| `concept/apps/api/src/services/database.js` | Enable SSL certificate validation (`rejectUnauthorized: true`) |
| `concept/apps/api/src/middleware/errorHandler.js` | Sanitize 500 error messages in production |
| `concept/apps/api/src/middleware/validate.js` | **New** — UUID validation and input length helpers |
| `concept/apps/api/src/middleware/rateLimiter.js` | **New** — In-memory sliding-window rate limiter (200 req/min/IP) |
| `concept/apps/api/src/routes/tasks.js` | UUID validation, size limits, user existence check |
| `concept/apps/api/src/routes/comments.js` | UUID validation, X-User-Id format check, size limits |
| `concept/apps/api/src/routes/projects.js` | UUID validation, size limits |
| `concept/apps/api/src/routes/users.js` | UUID validation |
| `concept/apps/web/nginx.conf` | Security headers including Content-Security-Policy (connect-src allows `https:` for Azure cross-domain API calls) |
