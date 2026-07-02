---
name: playwright-mcp-testing
description: "Create and inspect Playwright end-to-end tests for the Taskify app using the MCP-driven workflow. Use when: demonstrating browser automation, visual exploration, or richer step-by-step test authoring with MCP context."
---

# Playwright MCP Testing

## When to Use

- You want to demonstrate a richer, interactive browser-driven workflow for generating tests.
- You want to inspect UI state, capture selectors, and iterate quickly through the app in the browser.
- You want a contrast point for showing the difference between MCP-assisted authoring and CLI execution.

## Repo Layout

- Place generated specs under concept/tests/e2e/tests/
- Keep the shared config in concept/tests/e2e/playwright.config.ts
- Use the same app stack and seeded data as the CLI workflow

## Rules

- Favor the same stable selectors and deterministic assertions as the CLI path.
- Keep the test files in the shared tests folder so both demo flows use the same suite.
- When the app is already running in Docker, run with PLAYWRIGHT_SKIP_WEBSERVER=1.

## Demo Flow

1. Explore the UI interactively and identify the behavior to automate.
2. Generate or refine the Playwright spec under concept/tests/e2e/tests/.
3. Run the spec with the Playwright CLI to verify it end to end.
4. Compare the authoring experience and token cost versus the CLI workflow.

## Commands

```bash
cd concept/tests/e2e
$env:PLAYWRIGHT_SKIP_WEBSERVER='1'
npx playwright test tests/<spec>.spec.ts
```
