# Playwright E2E Test Summary

| # | Test File | What It Tests | Expected Result |
|---|-----------|---------------|-----------------|
| 1 | `userSelect.spec.ts` | Verifies the user-selection screen renders all 5 users with correct names and roles, and that clicking a user navigates to the project list without requiring a password. | **4 tests — all pass** |
| 2 | `kanbanBoard.spec.ts` | Confirms the Kanban board renders exactly 4 status columns, seed-data cards appear in the correct columns, clicking a card opens a detail modal, and the back button returns to the project list. | **4 tests — all pass** |
| 3 | `dragAndDrop.spec.ts` | Tests that a card can be dragged from one column to another (forward and backward) via keyboard interaction and that the status change persists in the database after a page reload. | **3 tests — all pass** |
| 4 | `comments.spec.ts` | Validates adding, editing, and deleting comments on a task card, including the ownership rule that users cannot edit or delete comments made by other users, and that Edit/Delete buttons appear for the author's own comments. | **6 tests — all pass** |
| 5 | `cardHighlight.spec.ts` | Tests that cards assigned to the currently logged-in user have visually distinct styling, that switching users changes which cards are highlighted, and that unassigned cards never receive highlight styling. | **3 tests — 2 intentionally fail (feature not yet implemented); unassigned-card test passes** |
| 6 | `projectList.spec.ts` | Verifies that exactly 3 sample projects are displayed, each with the correct name and description, and that clicking a project navigates to its Kanban board. | **3 tests — all pass** |
| 7 | `taskAssignment.spec.ts` | Validates assigning a user to an unassigned task, unassigning a user, reassigning from one user to another, and confirming that assignments persist after navigating away and back. | **4 tests — all pass** |
| 8 | `navigation.spec.ts` | Covers every main navigation path: full forward/round-trip flow, header logo behaviour, new project flow, new task flow, task detail editing, task assignment change, task deletion, and multi-project navigation. | **11 tests — all pass** |
| 9 | `formValidation.spec.ts` | Edge-case tests for the three creation forms (New Task, New Project, Comment). Verifies that blank and whitespace-only inputs are rejected without creating phantom records, that Escape cancels the New Task form, and that a valid comment can be submitted and deleted. | **8 tests — all pass** |
