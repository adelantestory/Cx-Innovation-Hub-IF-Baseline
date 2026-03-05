// =============================================================================
// E2E: Drag-and-Drop — Move Cards Between Columns
// =============================================================================
// Requirement (Taskify Product Description):
//   "You will be able to drag and drop cards back and forth between different
//    columns."
//
//   "For each task in the UI for a task card, you should be able to change the
//    current status of the task between the different columns in the Kanban
//    work board."
// =============================================================================

import { test, expect } from '@playwright/test';

async function navigateToBoard(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByText('Sarah Chen').click();
  await page.getByText('Website Redesign').click();
  await expect(page.getByText('To Do')).toBeVisible();
}

test.describe('Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBoard(page);
  });

  test('move a card from "To Do" to "In Progress" via drag-and-drop', async ({
    page,
  }) => {
    // Spec: "drag and drop cards back and forth between different columns"
    //
    // We drag "Design new homepage layout" (seeded in To Do)
    // into the In Progress column.

    const card = page.getByText('Design new homepage layout');
    const sourceColumn = page.locator('[data-rfd-droppable-id="todo"]');
    const targetColumn = page.locator('[data-rfd-droppable-id="in_progress"]');

    // Confirm card is currently in the To Do column
    await expect(sourceColumn).toContainText('Design new homepage layout');

    // @hello-pangea/dnd uses keyboard-based drag as a reliable alternative
    // to pointer-based drag in Playwright.
    //
    // Steps:  Focus card → Space (lift) → ArrowRight (move to next column)
    //         → Space (drop)
    await card.focus();
    await page.keyboard.press('Space');        // lift
    await page.keyboard.press('ArrowRight');   // move one column right → In Progress
    await page.keyboard.press('Space');        // drop

    // Verify the card now lives in the In Progress column
    await expect(targetColumn).toContainText('Design new homepage layout');
  });

  test('card status is persisted after drag-and-drop (survives refresh)', async ({
    page,
  }) => {
    // Spec: "change the current status of the task between the different
    //        columns in the Kanban work board"
    // The API PATCH /api/tasks/:id/status persists the change.

    const card = page.getByText('Design new homepage layout');

    // Drag To Do → In Progress
    await card.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');

    // Wait for optimistic update AND network persist
    const targetColumn = page.locator('[data-rfd-droppable-id="in_progress"]');
    await expect(targetColumn).toContainText('Design new homepage layout');

    // Reload and re-navigate to confirm persistence
    await page.reload();
    await page.getByText('Website Redesign').click();
    await expect(page.getByText('To Do')).toBeVisible();
    await expect(targetColumn).toContainText('Design new homepage layout');
  });
});
