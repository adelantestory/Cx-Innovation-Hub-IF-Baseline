// =============================================================================
// E2E: Drag-and-Drop — move a card between columns
// =============================================================================
// Requirement: "You'll be able to drag and drop cards back and forth between
// different columns."
//
// Requirement: "you should be able to change the current status of the task
// between the different columns in the Kanban work board."
//
// @hello-pangea/dnd uses data-rfd-* attributes (not data-rbd-* from the old
// react-beautiful-dnd). We use keyboard-based drag (Space + Arrow keys) because
// the mouse sensor depends on requestAnimationFrame timing that is unreliable
// in headless CI environments.
// =============================================================================

import { test, expect } from './base';
import type { Page, Locator } from '@playwright/test';

/** Wait for one animation frame to be painted in the page context. */
async function waitForFrame(page: Page) {
  await page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => r())));
}

/**
 * Drag a card element into a target column.
 * Uses keyboard-based drag (Space to lift, Arrow keys to move, Space to drop)
 * because @hello-pangea/dnd's mouse sensor relies on requestAnimationFrame
 * timing that behaves inconsistently in headless CI environments.
 */
async function dragCardToColumn(page: Page, card: Locator, targetColumnId: string) {
  // Determine which column the card is currently in
  const colOrder = ['todo', 'in_progress', 'in_review', 'done'];
  const cardText = (await card.innerText()).split('\n')[0].trim();
  let srcIdx = -1;
  for (let i = 0; i < colOrder.length; i++) {
    const col = page.locator(`[data-rfd-droppable-id="${colOrder[i]}"]`);
    if (await col.getByText(cardText).count() > 0) {
      srcIdx = i;
      break;
    }
  }
  if (srcIdx === -1) throw new Error(`Card "${cardText}" not found in any column`);

  const tgtIdx = colOrder.indexOf(targetColumnId);
  if (tgtIdx === -1) throw new Error(`Unknown column "${targetColumnId}"`);

  const steps = tgtIdx - srcIdx;
  const key = steps > 0 ? 'ArrowRight' : 'ArrowLeft';
  const absSteps = Math.abs(steps);

  // Focus the card's drag handle and lift with Space
  await card.focus();
  await waitForFrame(page);
  await page.keyboard.press('Space');

  // Wait for the drag to activate (placeholder appears)
  await page.waitForSelector('[data-rfd-placeholder-context-id]', { timeout: 2000 });

  // Move across columns with arrow keys
  for (let i = 0; i < absSteps; i++) {
    await page.keyboard.press(key);
    await waitForFrame(page);
  }

  // Drop with Space
  await page.keyboard.press('Space');

  // Wait for the drop animation and state update
  await page.waitForTimeout(1000);
}

test.describe('Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Website Redesign').first().click();
    await expect(page.locator('[data-rfd-droppable-id="todo"]')).toBeVisible();
  });

  test('move a card to the next column', { tag: ['@uat', '@prod-safe'] }, async ({ page }) => {
    // Pick the first card in the first non-empty column and drag it one column right
    const columns = ['todo', 'in_progress', 'in_review'] as const;
    const nextColumn: Record<string, string> = {
      todo: 'in_progress',
      in_progress: 'in_review',
      in_review: 'done',
    };

    let sourceCol = '';
    let card: Locator | null = null;
    let cardText = '';

    for (const col of columns) {
      const colLocator = page.locator(`[data-rfd-droppable-id="${col}"]`);
      const cards = colLocator.locator('[data-rfd-draggable-id]');
      const count = await cards.count();
      if (count > 0) {
        sourceCol = col;
        card = cards.first();
        cardText = await card.innerText();
        cardText = cardText.split('\n')[0].trim(); // first line is the title
        break;
      }
    }

    expect(card, 'No draggable card found on the board').not.toBeNull();
    const targetCol = nextColumn[sourceCol];

    await dragCardToColumn(page, card!, targetCol);

    const targetColumn = page.locator(`[data-rfd-droppable-id="${targetCol}"]`);
    await expect(targetColumn.getByText(cardText)).toBeVisible({ timeout: 10000 });
  });

  test('move a card backward to the previous column', { tag: ['@uat', '@prod-safe'] }, async ({ page }) => {
    // Pick the first card from a column that can move left
    const columns = ['done', 'in_review', 'in_progress'] as const;
    const prevColumn: Record<string, string> = {
      done: 'in_review',
      in_review: 'in_progress',
      in_progress: 'todo',
    };

    let sourceCol = '';
    let card: Locator | null = null;
    let cardText = '';

    for (const col of columns) {
      const colLocator = page.locator(`[data-rfd-droppable-id="${col}"]`);
      const cards = colLocator.locator('[data-rfd-draggable-id]');
      const count = await cards.count();
      if (count > 0) {
        sourceCol = col;
        card = cards.first();
        cardText = await card.innerText();
        cardText = cardText.split('\n')[0].trim();
        break;
      }
    }

    expect(card, 'No draggable card found on the board').not.toBeNull();
    const targetCol = prevColumn[sourceCol];

    await dragCardToColumn(page, card!, targetCol);

    const targetColumn = page.locator(`[data-rfd-droppable-id="${targetCol}"]`);
    await expect(targetColumn.getByText(cardText)).toBeVisible({ timeout: 10000 });
  });

  test('card remains in the board after drag (no data loss)', { tag: ['@uat', '@prod-safe'] }, async ({ page }) => {
    // Count all cards before drag
    const allCards = page.locator('[data-rfd-draggable-id]');
    const countBefore = await allCards.count();
    expect(countBefore).toBeGreaterThan(0);

    // Grab the first card from any column and drag it right
    const card = allCards.first();
    const cardText = (await card.innerText()).split('\n')[0].trim();

    // Find which column it's in, then pick the next one
    const colOrder = ['todo', 'in_progress', 'in_review', 'done'];
    let srcIdx = -1;
    for (let i = 0; i < colOrder.length; i++) {
      const col = page.locator(`[data-rfd-droppable-id="${colOrder[i]}"]`);
      if (await col.getByText(cardText).count() > 0) {
        srcIdx = i;
        break;
      }
    }
    const tgtIdx = srcIdx < colOrder.length - 1 ? srcIdx + 1 : srcIdx - 1;

    await dragCardToColumn(page, card, colOrder[tgtIdx]);

    // Same number of cards should still be on the board
    const countAfter = await allCards.count();
    expect(countAfter).toBe(countBefore);
  });
});
