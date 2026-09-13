# Taskify — Basic Linting & Security Audit

Date: 2026-09-13
Scope: `concept/apps/api` (Express.js/Node) and `concept/apps/web` (React/Vite/TypeScript)

This report captures the results of basic linting and a lightweight security
review of the Taskify prototype. Findings are ordered by severity. As this is
an Innovation Factory functional prototype, mitigations are documented
(advisory) rather than implemented.

---

## 1. Linting Results

### 1.1 API (`concept/apps/api`)
No ESLint configuration is present. Ran `node --check` on every JS source file
as a basic syntax lint:

```
OK: src/index.js
OK: src/routes/comments.js
OK: src/routes/projects.js
OK: src/routes/tasks.js
OK: src/routes/users.js
OK: src/services/database.js
OK: src/middleware/errorHandler.js
```

Result: 0 syntax errors.

### 1.2 Web (`concept/apps/web`)
The project's `build` script runs `tsc -b` as its linter. Ran
`npx tsc --noEmit -p tsconfig.app.json`:

```
src/api/client.ts(11,30): error TS2339: Property 'env' does not exist on type 'ImportMeta'.
```

Result: 1 TypeScript error.

- **File:** `concept/apps/web/src/api/client.ts:11`
- **Cause:** `import.meta.env` is a Vite-specific extension that requires the
  Vite client type reference (`/// <reference types="vite/client" />` in a
  `vite-env.d.ts`, or `"types": ["vite/client"]` in tsconfig). No such file/entry
  exists in the project.
- **Impact:** `npm run build` fails on a clean check-out. This blocks CI and
  container image builds for the web tier.

---

## 2. Dependency Vulnerabilities (`npm audit`)

### 2.1 API — 8 vulnerabilities (1 low, 4 moderate, 3 high)

| Package | Severity | Advisory | Notes |
|---|---|---|---|
| `brace-expansion` (3.0.0 – 5.0.8) | **high** | GHSA-f886-m6hf-6m8v, GHSA-jxxr-4gwj-5jf2, GHSA-3jxr-9vmj-r5cp, GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895 | Multiple ReDoS / memory-exhaustion issues |
| `path-to-regexp` (<0.1.13) | **high** | GHSA-37ch-88jc-xwx2 | ReDoS via multiple route parameters. Pulled in by Express 4.21.0 transitively |
| `picomatch` (<=2.3.1) | **high** | GHSA-3v7f-55p6-f55p, GHSA-c2c7-rcm5-vvqj | Method injection + ReDoS |
| `qs` (2.2.5 – 6.15.3) | moderate | GHSA-q8mj-m7cp-5q26, GHSA-x5fp-wj9c-mxmx, GHSA-4mjr-xmp4-gh2g | Multiple DoS vectors |
| `uuid` (<11.1.1) | moderate | GHSA-w5hq-g745-h8pq | Missing buffer bounds check in v3/v5/v6 |
| `@azure/msal-node` (<=5.1.4) | moderate | via `uuid` | Transitive of `@azure/identity` |
| `@azure/identity` (direct) | moderate | via `@azure/msal-node` | Direct dependency — bump required |
| `body-parser` (<1.20.6) | low | GHSA-v422-hmwv-36x6 | DoS when invalid limit silently disables size enforcement |

All resolvable via `npm audit fix` (no breaking major bumps required).

### 2.2 Web — 8 vulnerabilities (2 low, 1 moderate, 5 high)

| Package | Severity | Advisory | Notes |
|---|---|---|---|
| `vite` (<=6.4.2) | **high** | GHSA-4w7w-66w2-5vf9, GHSA-p9ff-h696-f583, GHSA-v6wh-96g9-6wx3, GHSA-fx2h-pf6j-xcff | Path traversal in optimized deps `.map`, arbitrary file read via dev-server WebSocket, `server.fs.deny` bypass, NTLMv2 hash disclosure via `launch-editor` |
| `postcss` (<=8.5.22) | **high** | GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849 | XSS via `</style>` in Stringify, arbitrary file read via `sourceMappingURL` |
| `brace-expansion` | **high** | (same advisories as API) | ReDoS / memory exhaustion |
| `picomatch` | **high** | (same advisories as API) | Method injection + ReDoS |
| `postcss-selector-parser` (6.1.0 – 6.1.2) | moderate | GHSA-w9m9-85wc-3x92 | DoS via uncontrolled AST recursion |
| Two additional low-severity findings | low | — | Reported by `npm audit` |

All resolvable via `npm audit fix`. Some Vite advisories primarily affect the
dev server (not the built container), but should still be patched because the
`Dockerfile.dev` runs `vite` inside a running container.

---

## 3. Code-Level Security Findings

### 3.1 [Critical] No authentication / trivial identity spoofing
- **Files:** `concept/apps/api/src/routes/comments.js:53`, `:96`, `:153`;
  `concept/apps/web/src/api/client.ts:138,150,160`
- **Issue:** Comment ownership is enforced solely by the client-supplied
  `X-User-Id` HTTP header. Any client can send an arbitrary UUID and edit or
  delete any user's comments (IDOR). There is no authentication middleware,
  session, or token verification anywhere in the API.
- **Impact:** Full impersonation of any user for create/edit/delete of comments,
  and — because tasks and projects have no auth at all — anonymous
  read/write/delete of every project and task in the database.
- **Advisory mitigation:** Add an auth layer (Entra ID / MSAL) and derive the
  user id server-side from a validated token, not from a client header.

### 3.2 [High] TLS certificate validation disabled for PostgreSQL
- **File:** `concept/apps/api/src/services/database.js:74`
- **Issue:** `ssl: sslMode === "require" ? { rejectUnauthorized: false } : false`.
  When SSL is enabled the driver is told to accept any certificate, which
  defeats the point of TLS (susceptible to MITM against the database
  connection).
- **Advisory mitigation:** Set `rejectUnauthorized: true` and provide the
  server's CA (e.g. the Azure Database for PostgreSQL root cert) via
  `ca:` in the ssl options.

### 3.3 [High] Permissive CORS default (`*`)
- **File:** `concept/apps/api/src/index.js:40`
- **Issue:** `origin: process.env.CORS_ORIGIN || "*"`. Combined with §3.1 (no
  auth, header-based identity), any origin can call the API from a browser
  and act as any user. Even after §3.1 is fixed, a wildcard origin plus a
  custom `X-User-Id` header is not compatible with credentialed CORS.
- **Advisory mitigation:** Require an explicit allow-list of origins in every
  environment; do not permit `*` as a fallback.

### 3.4 [Medium] No request-body size limit
- **File:** `concept/apps/api/src/index.js:44`
- **Issue:** `express.json()` is called with no `limit` option, so it defaults
  to 100 KB per Express but relies on `body-parser`'s handling; combined with
  the `body-parser` DoS advisory (§2.1), this is worth pinning explicitly
  (e.g. `express.json({ limit: "100kb" })`).

### 3.5 [Medium] No rate limiting / abuse controls
- **Files:** `concept/apps/api/src/index.js`, all routes.
- **Issue:** No rate limiting, no slow-loris protection, no `helmet` middleware.
  Combined with unauthenticated write endpoints (§3.1) this makes the API a
  trivial target for spam / storage exhaustion.
- **Advisory mitigation:** Add `express-rate-limit` and `helmet` for the
  prototype hardening pass.

### 3.6 [Medium] Missing security response headers on the web tier
- **File:** `concept/apps/web/nginx.conf`
- **Issue:** The nginx config sets no `Content-Security-Policy`,
  `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, or
  `Strict-Transport-Security` headers.
- **Advisory mitigation:** Add a baseline set of security headers; particularly
  a CSP that restricts script sources.

### 3.7 [Low] Error handler may leak stack traces in logs
- **File:** `concept/apps/api/src/middleware/errorHandler.js:18`
- **Issue:** Stack traces are logged for any 500 error. That's fine for a
  prototype, but in production these should not be emitted to shared log sinks
  without redaction. The JSON response itself only returns `message`, which is
  fine.

### 3.8 [Informational] `SELECT 1` health check exposes DB state
- **File:** `concept/apps/api/src/index.js:49`
- **Issue:** `/api/health` is public and reveals whether the database is
  reachable. Low risk, but consider gating detailed status behind an
  authenticated `/readyz` endpoint if this is exposed to the public internet.

### 3.9 [Informational] User-supplied `assigned_user_id` / `parent_comment_id` not validated
- **Files:** `concept/apps/api/src/routes/tasks.js:53,69,179,185`;
  `concept/apps/api/src/routes/comments.js:58,67`
- **Issue:** These IDs are inserted directly and rely on Postgres FK errors to
  reject bad values. SQL injection is not possible (parameterized queries are
  used consistently — good), but callers receive a raw 500 with the Postgres
  error message rather than a friendly 400.

### 3.10 [Positive observations]
- All SQL queries use parameterized (`$1`, `$2`, …) placeholders — no string
  concatenation of user input into SQL. No SQL injection was identified.
- Secrets are retrieved from Azure Key Vault via Managed Identity in Azure
  mode (`services/database.js`), in line with the Innovation Factory
  constraint of no connection strings / no access keys.
- The web client does not `dangerouslySetInnerHTML` any user content, so no
  obvious stored-XSS sinks were introduced by the app code (subject to CSP
  hardening per §3.6).

---

## 4. Reproduction Commands

```bash
# API
cd concept/apps/api
npm install
npm audit
for f in src/index.js src/routes/*.js src/services/*.js src/middleware/*.js; do
  node --check "$f" && echo "OK: $f"
done

# Web
cd ../web
npm install
npm audit
npx tsc --noEmit -p tsconfig.app.json
```

---

## 5. Recommended Next Steps (advisory, not implemented)

1. Run `npm audit fix` in both `concept/apps/api` and `concept/apps/web` and
   verify the lockfiles.
2. Add a `vite-env.d.ts` (or `"types": ["vite/client"]` to `tsconfig.app.json`)
   to fix the `import.meta.env` TS error.
3. Replace the `X-User-Id` header with a real auth token; validate it in
   middleware and set `req.user` server-side.
4. Set `rejectUnauthorized: true` for the pg pool and supply the DB CA.
5. Replace the CORS `*` fallback with an env-driven allow-list.
6. Add `helmet`, `express-rate-limit`, and an explicit JSON body limit.
7. Add security response headers in `nginx.conf`.
