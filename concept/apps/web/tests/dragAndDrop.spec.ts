// =============================================================================
// E2E: Drag-and-Drop — move a card between columns
// =============================================================================
// Requirement: "You'll be able to drag and drop cards back and forth between
// different columns."
//
// Requirement: "you should be able to change the current status of the task
// between the different columns in the Kanban work board."
//
// Note: @hello-pangea/dnd supports keyboard-based drag via Space + Arrow keys.
// We use the keyboard approach because it is more reliable in Playwright than
// simulating mouse-based drag gestures.
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as Alex Rivera and open "Website Redesign"
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Website Redesign').click();
  });

  test('move a card from "To Do" to "In Progress" using keyboard drag', async ({ page }) => {
    // Requirement: "drag and drop cards back and forth between different columns"
    const card = page.getByText('Design new homepage layout');
    await expect(card).toBeVisible();

    // Focus the card and initiate keyboard drag
    await card.focus();
    await page.keyboard.press('Space');    // lift
    await page.keyboard.press('ArrowRight'); // move to next column
    await page.keyboard.press('Space');    // drop

    // After moving, the card should now be in the "In Progress" column
    // Verify by checking the card is no longer under the "To Do" droppable
    const inProgressColumn = page.locator('[data-rbd-droppable-id="in_progress"]');
    await expect(inProgressColumn.getByText('Design new homepage layout')).toBeVisible();
  });

  test('move a card from "In Progress" to "In Review"', async ({ page }) => {
    // Requirement: "change the current status of the task between the different columns"
    const card = page.getByText('Implement responsive navigation bar');
    await expect(card).toBeVisible();

    await card.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');

    const inReviewColumn = page.locator('[data-rbd-droppable-id="in_review"]');
    await expect(inReviewColumn.getByText('Implement responsive navigation bar')).toBeVisible();
  });

  test('move a card backward from "Done" to "In Review"', async ({ page }) => {
    // Requirement: "drag and drop cards back and forth" — "back" implies reverse direction
    const card = page.getByText('Set up CI/CD pipeline');
    await expect(card).toBeVisible();

    await card.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Space');

    const inReviewColumn = page.locator('[data-rbd-droppable-id="in_review"]');
    await expect(inReviewColumn.getByText('Set up CI/CD pipeline')).toBeVisible();
  });

  test('card remains in the board after drag (no data loss)', async ({ page }) => {
    // Move a card and verify all 4 task cards are still present
    const card = page.getByText('Design new homepage layout');
    await card.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');

    // All four tasks should still be visible on the board
    await expect(page.getByText('Design new homepage layout')).toBeVisible();
    await expect(page.getByText('Implement responsive navigation bar')).toBeVisible();
    await expect(page.getByText('Refactor CSS to Tailwind')).toBeVisible();
    await expect(page.getByText('Set up CI/CD pipeline')).toBeVisible();
  });
});
