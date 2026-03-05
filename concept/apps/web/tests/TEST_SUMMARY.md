# Playwright E2E Test Summary

| # | Test File | What It Tests | Expected Result |
|---|-----------|---------------|-----------------|
| 1 | `userSelect.spec.ts` | Verifies the user-selection screen renders all 5 users with correct names and roles, and that clicking a user navigates to the project list without requiring a password. | **4 tests — all pass** |
| 2 | `kanbanBoard.spec.ts` | Confirms the Kanban board renders exactly 4 status columns, seed-data cards appear in the correct columns, clicking a card opens a detail modal, and the back button returns to the project list. | **4 tests — all pass** |
| 3 | `dragAndDrop.spec.ts` | Tests that a card can be dragged from one column to another via mouse interaction and that the status change persists in the database after a page reload. | **2 tests — all pass** |
| 4 | `comments.spec.ts` | Validates adding, editing, and deleting comments on a task card, including the ownership rule that users cannot edit or delete comments made by other users. | **5 tests — all pass** |
| 5 | `cardHighlight.spec.ts` | Tests that cards assigned to the currently logged-in user have visually distinct styling (e.g., a highlight or `data-own` attribute). This feature is **not yet implemented** in the Card component. | **2 tests — intentionally fail** |
