---
name: playwright-cli-testing
description: "Use the Playwright CLI Skill for common Playwright actions in this repo: inspect selectors, take screenshots, record interactions, and turn them into deterministic specs under concept/tests/e2e/tests."
---

# Playwright CLI Testing

## When to Use

- You want a token-efficient browser workflow that avoids large MCP payloads.
- You want to inspect or drive the Taskify UI in a real browser session.
- You want to turn a manual flow into a deterministic Playwright spec under concept/tests/e2e/tests.
- You want a workflow that works well in both local development and GitHub Actions.

## Quick Start

```bash
cd concept/tests/e2e
npm ci
npx playwright install --with-deps chromium
```

If the Docker stack is already running, reuse it:

```bash
$env:PLAYWRIGHT_SKIP_WEBSERVER='1'
npx playwright test --list
```

## Repo Layout

- Playwright specs live in concept/tests/e2e/tests
- Shared config is concept/tests/e2e/playwright.config.ts
- The app stack is started from concept/docker-compose.yml
- Use the existing Taskify seeded data and UI flows when authoring tests

## Core Workflow

1. Start or reuse the local stack.
2. Open the Taskify app in a browser session and inspect the UI.
3. Capture the interaction with lightweight CLI actions such as snapshot, click, type, and screenshot.
4. Convert the flow into a focused Playwright spec and refine selectors or waits until it is stable.

#

## CLI Patterns to Prefer

- Use snapshots and targeted interactions to inspect the page before writing assertions.
- Prefer deterministic selectors such as data-testid, accessible roles, and stable text.
- Keep waits short and explicit.
- Reuse the running Docker stack in CI by setting PLAYWRIGHT_SKIP_WEBSERVER=1.
- Keep each spec focused on one behavior at a time.

> Brought to you by microsoft/playwright-cli
