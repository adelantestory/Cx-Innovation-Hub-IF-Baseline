# Security Review

Reviewed the Taskify API and web application for common web-application issues, with emphasis on OWASP Top 10 risks such as broken access control, input validation, security misconfiguration, and dependency hygiene.

## Executive Summary

The prototype app is now harder to abuse. The highest-impact improvements were:
- enforcing server-side validation for comment ownership and task assignment,
- adding basic security headers and a tighter CORS policy,
- validating request bodies and IDs before they reach the database, and
- upgrading the API dependency stack to remove known vulnerable packages.

## Findings and Remediation

### 1. Broken access control / IDOR
- Area: `concept/apps/api/src/routes/comments.js`
- Risk: the API previously trusted the `X-User-Id` header as the source of truth for comment ownership, which allowed an attacker to impersonate another user.
- Fix implemented: comment create/edit/delete routes now require a valid, existing user ID and enforce ownership checks against that server-validated identity.

### 2. Input validation
- Area: `concept/apps/api/src/routes/projects.js`, `concept/apps/api/src/routes/tasks.js`, `concept/apps/api/src/routes/comments.js`
- Risk: project, task, and comment payloads lacked consistent validation for empty values, overly long strings, and malformed IDs.
- Fix implemented: added shared validation helpers to trim input, enforce length limits, and reject malformed UUIDs.

### 3. Security misconfiguration
- Area: `concept/apps/api/src/index.js`, `concept/apps/web/index.html`
- Risk: the API used a permissive CORS default and did not add basic browser security headers; the web app also lacked a CSP.
- Fix implemented: CORS now defaults to the local Vite origin, security headers are added on API responses, request bodies are limited to 100 KB, and the web app now serves a basic CSP.

### 4. Dependency vulnerabilities
- Area: `concept/apps/api/package.json`
- Risk: the API dependency tree included vulnerable Express routing packages and Azure identity transitive dependencies.
- Fix implemented: upgraded the API to Express 5.0.1 and Azure Identity 4.13.1, which removes the known vulnerable package versions.

### 5. XSS / injection resistance
- Area: `concept/apps/web/src` and `concept/apps/web/index.html`
- Risk: the UI uses React, which escapes content by default; however, the app did not define a CSP to reduce the impact of future injected scripts.
- Fix implemented: added a strict CSP in the web app shell so browser-based XSS is harder to exploit.

## Notes on Other OWASP Areas
- SQL injection: no evidence of injection issues; the API uses parameterized PostgreSQL queries.
- CSRF: the current API is not using cookie-based authentication, so CSRF is not a primary risk for the prototype.
- Privilege escalation: the previous comment workflow made impersonation possible; that path has been closed.
- Insecure deserialization: not present in the current code path.
- Secrets management: no hard-coded secrets were found in the reviewed application code; environment variables and managed identity remain the intended secret-handling model.

## Recommended Next Steps
1. Replace the header-based user identity with real authentication (for example, signed session cookies or bearer tokens).
2. Add role-based authorization for projects, tasks, and comments once authentication is in place.
3. Restrict CORS further in production to a specific allow-list rather than a single local-development default.
