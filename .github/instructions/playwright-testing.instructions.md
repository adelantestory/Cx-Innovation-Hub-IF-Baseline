---
description: "Use when working with Playwright tests in the web application. Covers test execution, UI debugging, screenshot capture and review, and frontend verification for the Taskify web application."
applyTo: "concept/apps/web/tests/**"
---

# Playwright Testing - Taskify Web Application

This instruction applies to all Playwright tests in the Taskify web application frontend.

## Overview

You are testing the **Taskify web application** frontend using Playwright. Your goals are:
- Verify frontend functionality and UI behavior
- Debug UI issues and interactions
- Capture and review screenshots for visual regression testing

## Workflow

### 1. Start the Web Server

Before running tests, ensure the development server is running:

```bash
cd concept/apps/web
npm install
npm run dev
```

The server typically starts on `http://localhost:5173` (or similar port shown in terminal).

### 2. Run Playwright Tests

Execute tests from the `concept/apps/web/tests` directory:

```bash
# Run all tests
npm run test

# Run a specific test file
npx playwright test cardHighlight.spec.ts

# Run in headed mode (see browser) for debugging
npx playwright test --headed

# Run with UI mode (interactive test explorer)
npx playwright test --ui

# Debug a specific test
npx playwright test cardHighlight.spec.ts --debug
```

### 3. Review Test Results

After running tests:

```bash
# View the HTML report
npx playwright show-report
```

This opens an interactive report showing:
- Pass/fail status for each test
- Screenshots at each step
- Video recordings (if configured)
- Error traces and logs

### 4. Capture Screenshots

Screenshots are automatically captured during test runs. To manually capture screenshots in tests:

```typescript
// In your test
await page.screenshot({ path: 'screenshot.png' });

// Capture specific element
await page.locator('selector').screenshot({ path: 'element.png' });
```

Screenshots are saved to `concept/apps/web/test-results/` by default.

### 5. Debug UI Issues

When tests fail or you need to debug UI behavior:

```bash
# Start debug mode - opens inspector
npx playwright test --debug

# Or run in headed mode to see browser
npx playwright test --headed

# Check test metadata for debugging context
cat test-metadata.json
```

In debug mode:
- Step through each action
- Inspect page state
- View selector highlights
- Check console logs

## Key Test Files

- **cardHighlight.spec.ts** - Card styling and visual distinction tests
- **dragAndDrop.spec.ts** - Drag-and-drop task interactions
- **kanbanBoard.spec.ts** - Kanban board layout and behavior
- **projectList.spec.ts** - Project listing and filtering
- **taskAssignment.spec.ts** - Task assignment UI
- **userSelect.spec.ts** - User selection component

## Screenshot Review

1. After running tests, screenshots are organized in `test-results/` by test name
2. Review screenshots for:
   - Visual alignment and styling
   - Color contrast and readability
   - Component state changes
   - Responsive layout at different breakpoints
3. Compare with baseline screenshots to identify regressions
4. Update baselines if visual changes are intentional

## Common Commands

```bash
# Run and generate detailed report
npx playwright test --reporter=html

# Run specific browser
npx playwright test --project=chromium

# Run with specific viewport size
npx playwright test --project="Chrome (1280x720)"

# Collect coverage (if enabled)
npx playwright test --coverage
```

## Debugging Tips

- Use `page.pause()` in tests to freeze browser at that point
- Add `console.log()` or `page.evaluate()` to inspect page state
- Check `page.url()` to verify navigation
- Use `page.waitForSelector()` to wait for specific elements
- Enable trace recording for detailed step information

## Configuration

Test configuration is in `playwright.config.ts`:
- Base URL: Configured for local development
- Timeout: Test timeout and navigation timeout settings
- Screenshots: Automatic on failure, manual capture available
- Video: Recording configuration for failed tests

See `playwright.config.ts` for full configuration options.

---

## README

### What is This?

This instruction guide provides workflows for testing the **Taskify web application** using Playwright. It covers:
- Setting up and running the development server
- Executing Playwright tests in various modes (headed, UI, debug)
- Capturing and reviewing test screenshots
- Debugging UI issues and test failures
- Reviewing test reports and results

### When to Use This

Use these instructions when:
- Writing or modifying Playwright tests for Taskify
- Debugging failing tests or UI issues
- Capturing screenshots for visual regression testing
- Setting up test environments
- Reviewing test results and reports

### Key Files & Directories

- **Tests location:** `concept/apps/web/tests/`
- **Config file:** `concept/apps/web/playwright.config.ts`
- **Reports:** `concept/apps/web/test-results/` and `concept/apps/web/playwright-report/`
- **Dev server:** `http://localhost:5173`

### Quick Start

```bash
# Terminal 1: Start development server
cd concept/apps/web
npm run dev

# Terminal 2: Run tests
cd concept/apps/web
npm run test              # Run all tests
npx playwright test --ui # Interactive UI mode
npx playwright test --debug # Debug mode with inspector
```

### Best Practices

- Always start the dev server before running tests
- Use `--headed` mode for visual debugging
- Use `--debug` mode with Playwright Inspector for step-by-step execution
- Review screenshots in the HTML report for visual regression detection
- Keep test selectors stable and avoid brittle selectors
- Use `page.pause()` to freeze tests at specific points for inspection
