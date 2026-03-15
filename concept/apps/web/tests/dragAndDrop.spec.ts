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
// react-beautiful-dnd). We use Playwright's mouse API for the drag.
// =============================================================================

import { test, expect } from './base';
import type { Page, Locator } from '@playwright/test';

/** Drag a card element into a target column using Playwright's mouse API. */
async function dragCardToColumn(page: Page, card: Locator, targetColumnId: string) {
  const srcBox = await card.boundingBox();
  if (!srcBox) throw new Error('Card not visible');

  const target = page.locator(`[data-rfd-droppable-id="${targetColumnId}"]`);
  await expect(target).toBeVisible();
  const tgtBox = await target.boundingBox();
  if (!tgtBox) throw new Error(`Column "${targetColumnId}" not visible`);

  const srcX = srcBox.x + srcBox.width / 2;
  const srcY = srcBox.y + srcBox.height / 2;
  const tgtX = tgtBox.x + tgtBox.width / 2;
  const tgtY = tgtBox.y + tgtBox.height / 2;

  // Position mouse on the card and press
  await page.mouse.move(srcX, srcY);
  await page.mouse.down();

  // Allow the drag sensor to register the mousedown (requestAnimationFrame)
  await page.waitForTimeout(150);

  // Move past the 5px slop threshold to start the drag
  await page.mouse.move(srcX + 10, srcY);

  // Allow the sensor to transition from "pending" to "dragging"
  await page.waitForTimeout(150);

  // Move to the target column in visible steps (each step is a separate
  // Playwright call so slowMo creates a paced, observable drag)
  const moveSteps = 5;
  for (let i = 1; i <= moveSteps; i++) {
    const x = srcX + (tgtX - srcX) * i / moveSteps;
    const y = srcY + (tgtY - srcY) * i / moveSteps;
    await page.mouse.move(x, y);
  }

  // Let the drop zone register before releasing
  await page.waitForTimeout(150);

  // Release to drop
  await page.mouse.up();

  // Wait for the app to process the drop
  await page.waitForTimeout(500);
}

test.describe('Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Website Redesign').first().click();
    await expect(page.locator('[data-rfd-droppable-id="todo"]')).toBeVisible();
  });

  test('move a card to the next column', async ({ page }) => {
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
    await expect(targetColumn.getByText(cardText)).toBeVisible();
  });

  test('move a card backward to the previous column', async ({ page }) => {
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
    await expect(targetColumn.getByText(cardText)).toBeVisible();
  });

  test('card remains in the board after drag (no data loss)', async ({ page }) => {
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
