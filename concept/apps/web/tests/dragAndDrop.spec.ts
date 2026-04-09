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

  test('move a card backward from "In Progress" to "To Do" via drag-and-drop', async ({
    page,
  }) => {
    // Spec: "drag and drop cards back and forth between different columns"
    //        "back and forth" — cards can also move left (backward).
    //
    // We drag "Implement responsive navigation bar" (seeded in In Progress)
    // back into the To Do column.

    const card = page.getByText('Implement responsive navigation bar');
    const sourceColumn = page.locator('[data-rfd-droppable-id="in_progress"]');
    const targetColumn = page.locator('[data-rfd-droppable-id="todo"]');

    // Confirm card is currently in the In Progress column
    await expect(sourceColumn).toContainText('Implement responsive navigation bar');

    // Keyboard drag: focus → Space (lift) → ArrowLeft (move one column left → To Do)
    //                → Space (drop)
    await card.focus();
    await page.keyboard.press('Space');        // lift
    await page.keyboard.press('ArrowLeft');    // move one column left → To Do
    await page.keyboard.press('Space');        // drop

    // Verify the card now lives in the To Do column
    await expect(targetColumn).toContainText('Implement responsive navigation bar');

    // Restore: move the card back to In Progress so other tests are unaffected
    await card.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await expect(sourceColumn).toContainText('Implement responsive navigation bar');
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
