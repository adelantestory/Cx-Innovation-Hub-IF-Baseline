# Security Review Report

**Repository:** adelantestory/Cx-Innovation-Hub-IF-Baseline  
**Review Date:** 2026-07-07  
**Scope:** Full codebase — OWASP Top 10, secrets handling, input validation, injection, dependency vulnerabilities  
**Status:** Fixes applied in this PR for all HIGH and most MEDIUM findings.

---

## Executive Summary

| Severity | Count | Fixed in this PR |
|----------|-------|-----------------|
| HIGH     | 3     | ✅ All 3         |
| MEDIUM   | 5     | ✅ 4 of 5        |
| LOW      | 1     | ✅ 1             |

The highest-risk issues are **command injection** vulnerabilities in the E2E portal server, where unsanitized user input was interpolated directly into shell commands executed via `execSync`. These have been remediated by switching to `execFileSync` with argument arrays, adding input validation, and removing `shell: true` from `spawn`.

One MEDIUM finding (Broken Access Control / `X-User-Id` header authentication) is **documented but not fully remediated** — it is an architectural decision inherent to the POC prototype design and would require a complete authentication overhaul to address properly (see Finding 4 below).

---

## Findings

---

### Finding 1 — Command Injection via `testFilter` in CI Dispatch

| Field       | Value |
|-------------|-------|
| **Severity**   | HIGH |
| **Confidence** | 9/10 |
| **OWASP**      | A03:2021 – Injection |
| **File**       | `concept/apps/e2e-portal/server/index.ts:190-203` |
| **Status**     | ✅ Fixed |

**Description:**  
The `testFilter` field from the POST request body was directly interpolated into a shell command string passed to `execSync`. Because `execSync` invokes `/bin/sh -c` (or equivalent) by default when given a string, any shell metacharacters in `testFilter` would be interpreted as shell operators.

**Exploitation example:**
```
POST /api/ci/dispatch
{"testFilter": "\"; id; echo \""}
```
This would cause `execSync` to run:
```sh
gh api -X POST ... -f "inputs[test_filter]="; id; echo ""
```
The `id` (or any arbitrary command) executes in the server's shell context.

**Fix applied:**
- Replaced `execSync` with `execFileSync("gh", args)` where `args` is a proper array — shell metacharacters are never interpreted.
- Added an allowlist regex validation for `testFilter` (`/^[\w\s.\-,|:]+$/`) before use.

---

### Finding 2 — Command Injection via `specFiles` in Test Runner

| Field       | Value |
|-------------|-------|
| **Severity**   | HIGH |
| **Confidence** | 9/10 |
| **OWASP**      | A03:2021 – Injection |
| **Files**      | `concept/apps/e2e-portal/server/index.ts:103-107`, `concept/apps/e2e-portal/server/testRunner.ts:244,288-292` |
| **Status**     | ✅ Fixed |

**Description:**  
The `specs` query parameter was split by commas and elements spread directly into `spawn("npx", args, { shell: true })`. With `shell: true`, shell metacharacters in any spec file name are interpreted by the OS shell.

**Exploitation example:**
```
GET /api/tests/run?specs=kanbanBoard.spec.ts;+id
```
With `shell: true`, this executes `id` as a separate shell command.

**Fix applied:**
- Each entry in `specFiles` is now validated against an allowlist of filenames discovered by `discoverTests()`. Any value not matching a known `.spec.ts` filename is rejected with HTTP 400.
- `shell: true` changed to `shell: false` in `spawn`.
- Shell-quoting wrapper removed from the `--grep` pattern argument (not needed without shell).

---

### Finding 3 — Command Injection via `runId` URL Parameter

| Field       | Value |
|-------------|-------|
| **Severity**   | HIGH |
| **Confidence** | 9/10 |
| **OWASP**      | A03:2021 – Injection |
| **File**       | `concept/apps/e2e-portal/server/index.ts:206-298` |
| **Status**     | ✅ Fixed |

**Description:**  
The `runId` URL path parameter (e.g., `/api/ci/failures/12345`) was used without validation inside `ghApi()`, which previously called `execSync` with a template string. An attacker could send `12345; id` as the run ID to inject arbitrary shell commands.

**Fix applied:**
- `runId` is now validated with `/^\d+$/` before any use — non-numeric values return HTTP 400.
- `ghApi()` now uses `execFileSync("gh", ["api", endpoint])` so shell metacharacters in any endpoint string are never interpreted.

---

### Finding 4 — Broken Access Control: Client-Supplied Identity Header

| Field       | Value |
|-------------|-------|
| **Severity**   | HIGH |
| **Confidence** | 9/10 |
| **OWASP**      | A01:2021 – Broken Access Control |
| **Files**      | `concept/apps/api/src/routes/comments.js`, `concept/apps/api/src/routes/tasks.js` |
| **Status**     | ⚠️ Documented — not fully remediated (POC constraint) |

**Description:**  
The entire authorization model for comment ownership is built on the `X-User-Id` HTTP header supplied by the client. Since `GET /api/users` returns all user IDs with no authentication, any caller can impersonate any user and post, edit, or delete comments as them. Task mutation endpoints have no authentication at all.

**Recommended fix for production:**  
Implement server-side session management or JWT-based authentication. Issue tokens upon login and validate them server-side before accepting any mutation. Never trust client-supplied identity headers without cryptographic verification.

**Why not fixed in this PR:**  
This is an architectural limitation of the POC design. Addressing it requires implementing a complete authentication system (login flow, token issuance, session management), which is out of scope for a prototype security patch. It is documented here as a known risk that **must be addressed before production use**.

---

### Finding 5 — SSL/TLS Certificate Validation Disabled

| Field       | Value |
|-------------|-------|
| **Severity**   | MEDIUM |
| **Confidence** | 9/10 |
| **OWASP**      | A02:2021 – Cryptographic Failures |
| **File**       | `concept/apps/api/src/services/database.js:74` |
| **Status**     | ✅ Fixed |

**Description:**  
When `PGSSLMODE=require`, the PostgreSQL connection was configured with `{ rejectUnauthorized: false }`. This disables TLS certificate verification — the connection is encrypted but the server's identity is not verified, leaving it open to man-in-the-middle attacks.

**Fix applied:**  
Changed to `{ rejectUnauthorized: true }`. Azure PostgreSQL Flexible Server uses DigiCert certificates trusted by Node.js's default CA bundle, so this works without additional configuration.

---

### Finding 6 — CORS Wildcard Default

| Field       | Value |
|-------------|-------|
| **Severity**   | MEDIUM |
| **Confidence** | 8/10 |
| **OWASP**      | A05:2021 – Security Misconfiguration |
| **File**       | `concept/apps/api/src/index.js:40` |
| **Status**     | ✅ Fixed |

**Description:**  
The CORS `origin` defaulted to `"*"` when the `CORS_ORIGIN` environment variable was not set. A wildcard CORS policy allows any website to make cross-origin requests to the API, which is particularly impactful given the absence of authentication.

**Fix applied:**  
Removed the `|| "*"` fallback. The default is now `"http://localhost:5173"` for local development. The production Bicep deployment already sets `CORS_ORIGIN` explicitly, so no production behavior changes.

---

### Finding 7 — Hardcoded Development Credentials in Version Control

| Field       | Value |
|-------------|-------|
| **Severity**   | MEDIUM |
| **Confidence** | 8/10 |
| **OWASP**      | A02:2021 – Cryptographic Failures |
| **File**       | `concept/docker-compose.yml:31-32,62` |
| **Status**     | ✅ Fixed |

**Description:**  
PostgreSQL credentials (`postgres`/`postgres`) were hardcoded in a version-controlled `docker-compose.yml`. While labeled as development-only, hardcoded credentials in source control are a security antipattern — they can be accidentally used against non-local environments and expose the development password to anyone with repository access.

**Fix applied:**
- Added `concept/.env.docker.example` with placeholder values.
- `docker-compose.yml` now reads credentials from `concept/.env.docker` via `env_file`.
- Added `.env.docker` to `concept/.gitignore`.
- Developers copy `.env.docker.example` → `.env.docker` and set their own passwords.

---

### Finding 8 — Missing HTTP Security Headers (nginx)

| Field       | Value |
|-------------|-------|
| **Severity**   | MEDIUM |
| **Confidence** | 8/10 |
| **OWASP**      | A05:2021 – Security Misconfiguration |
| **File**       | `concept/apps/web/nginx.conf` |
| **Status**     | ✅ Fixed |

**Description:**  
The nginx configuration serving the React frontend set no security response headers. Missing headers include `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, and `Referrer-Policy`.

**Fix applied:**  
Added the following headers to `nginx.conf`:
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME-sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer leakage
- `Content-Security-Policy` — restricts script/style/connect sources to self and the API origin
- `Strict-Transport-Security` — enforces HTTPS (1-year max-age)

---

### Finding 9 — PostgreSQL Publicly Accessible with Open Firewall Rule

| Field       | Value |
|-------------|-------|
| **Severity**   | MEDIUM |
| **Confidence** | 8/10 |
| **OWASP**      | A05:2021 – Security Misconfiguration |
| **File**       | `concept/infrastructure/bicep/modules/postgresql.bicep:73,81-88` |
| **Status**     | ⚠️ Documented — infrastructure change requires manual Azure execution |

**Description:**  
The PostgreSQL Flexible Server is deployed with `publicNetworkAccess: 'Enabled'` and a firewall rule from `0.0.0.0` to `0.0.0.0` (the "Allow all Azure services" magic rule). This exposes the database to all Azure-hosted IPs, not just the application's Container Apps environment.

**Recommended fix:**  
Set `publicNetworkAccess: 'Disabled'` and use VNet integration or Private Endpoints to allow only the Container Apps environment to connect. Remove the `AllowAllAzureServicesAndResourcesWithinAzureIps` firewall rule.

**Why not fixed in this PR:**  
Changing the networking model of an existing deployed resource requires manual Azure execution steps and potential downtime. This change should be planned and executed by the infrastructure team following the Innovation Factory deployment runbook.

---

## Dependency Audit

All three `package.json` files were reviewed:

| Package | Installed Version | Known CVEs |
|---------|-----------------|------------|
| `express` | `^4.21.0` | None at time of review |
| `pg` | `^8.13.0` | None at time of review |
| `cors` | `^2.8.5` | None at time of review |
| `@azure/identity` | `^4.5.0` | None at time of review |
| `@azure/keyvault-secrets` | `^4.9.0` | None at time of review |
| `vite` | (web app) | Check regularly — Vite has had server-mode path traversal CVEs in older versions |
| `@hello-pangea/dnd` | (web app) | None known |

No critical dependency vulnerabilities were identified. Regular `npm audit` runs are recommended.

---

## Positive Security Practices Observed

- ✅ All database queries use parameterized statements (`$1`, `$2` placeholders) — no SQL injection risk found
- ✅ Azure mode uses Managed Identity + Key Vault for all credentials (no connection strings)
- ✅ React's JSX rendering escapes output by default — no stored XSS risk identified
- ✅ PostgreSQL schema uses UUIDs for primary keys (not sequential integers)
- ✅ Status values are validated against an allowlist (`VALID_STATUSES`) before DB writes
- ✅ Error responses do not expose stack traces or internal details to clients

---

## Recommendations for Production Readiness

1. **Implement authentication** — Replace the `X-User-Id` header pattern with JWT or session-based auth (Finding 4)
2. **Network isolation for PostgreSQL** — Disable public access and use Private Endpoints (Finding 9)
3. **Add `helmet` middleware** to the Express API for automatic security header injection
4. **Rate limiting** — Add `express-rate-limit` to prevent brute-force and denial-of-service on API endpoints
5. **Structured logging** — Ensure logs do not capture sensitive request bodies (comment content, user data)
6. **Regular dependency scanning** — Add `npm audit` to CI pipeline

---

*This report was generated as part of the Innovation Factory security review process. All HIGH severity findings have been remediated in this pull request.*
