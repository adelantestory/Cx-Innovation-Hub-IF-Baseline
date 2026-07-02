---
name: playwright-cli-testing
description: "Use the Playwright CLI and Playwright test runner to explore, author, and validate browser flows for the Taskify app in a token-efficient way."
---

# Playwright CLI Testing

## When to Use

- You want to inspect or drive the Taskify UI in a real browser session.
- You want to turn a manual flow into a deterministic Playwright spec under concept/tests/e2e/tests.
- You want a lightweight workflow that works well in local development and GitHub Actions.

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
2. Open the app in a browser session and inspect the page.
3. Capture the interaction as a focused Playwright spec.
4. Run the spec and refine selectors or waits until it is stable.

## Common Commands

```bash
# list discovered tests
npx playwright test --list

# run a single spec
npx playwright test tests/userSelect.spec.ts

# run a single browser project
npx playwright test --project=chromium

# generate a new test from a browser session
npx playwright codegen http://localhost:3000
```

## Demo Flow

- Begin with a user journey such as selecting a user, viewing the board, or adding a comment.
- Use the browser to capture the exact steps.
- Convert the flow into a spec with concise selectors and stable waits.
- Re-run the spec from the CLI and explain the output.

## Tips

- Prefer deterministic selectors such as data-testid or accessible roles.
- Keep waits short and explicit.
- Reuse the running Docker stack in CI by setting PLAYWRIGHT_SKIP_WEBSERVER=1.
- Keep each spec focused on one behavior at a time.

> Brought to you by microsoft/playwright-cli
