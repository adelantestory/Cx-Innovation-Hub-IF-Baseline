# Demo Branch: Playwright — Spec to Tests
## The Gap
The full working Taskify app is here. `concept/apps/web/tests/` is empty.
`playwright.config.ts` is an incomplete stub.

## Copilot Prompt
```
Using the Taskify product description in artifacts/Taskify Product Description.txt
as the source of truth, write Playwright E2E tests in concept/apps/web/tests/.

Each test must quote the requirement it covers. Create these files:
- tests/userSelect.spec.ts  — user selection on launch
- tests/kanbanBoard.spec.ts — board renders 4 columns, cards appear in correct columns
- tests/dragAndDrop.spec.ts — move a card between columns
- tests/comments.spec.ts    — add a comment, edit own, cannot edit/delete others
- tests/cardHighlight.spec.ts — current user's cards have distinct styling

Also complete playwright.config.ts with:
- baseURL: http://localhost:5173
- webServer for both API (port 3000) and web (port 5173)
- chromium only for demo speed
- retries: 1
```

## Running After Copilot Generates Tests
```bash
cd concept/apps/web
npm install
npx playwright install chromium
# Start the app first: cd ../../.. && docker compose up -d
npx playwright test
npx playwright test --ui   # interactive mode
```

## Reset
```bash
git checkout main && git branch -D demo/playwright-testing
bash setup-demo-branches.sh --only playwright-testing
```
