// =============================================================================
// E2E: Form Validation — Edge Cases for Input Forms
// =============================================================================
// Covers inline form guard rails that prevent empty or whitespace-only
// submissions across the three creation flows in the application:
//
//   1. New Task form      — "Task title…" input
//   2. New Project form   — "Project name" input
//   3. Comment form       — "Add a comment..." input
//
// These tests do NOT correspond to a single product requirement but protect
// against regressions in the UX contract: blank input → no API call and no
// phantom item appearing in the UI.
// =============================================================================

import { test, expect } from './base';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginAs(page: import('@playwright/test').Page, userName: string) {
  await page.goto('/');
  await page.getByRole('button').filter({ hasText: userName }).click();
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
}

async function openProject(
  page: import('@playwright/test').Page,
  projectName: string
) {
  await page.getByRole('button').filter({ hasText: projectName }).click();
  await expect(page.getByRole('heading', { name: 'To Do' })).toBeVisible();
}

// ---------------------------------------------------------------------------
// New Task form
// ---------------------------------------------------------------------------

test.describe('New Task Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'Alex Rivera');
    await openProject(page, 'Website Redesign');
    await page.getByRole('button', { name: '+ New Task' }).click();
    await expect(page.getByPlaceholder('Task title…')).toBeVisible();
  });

  test('empty task title cannot be submitted', async ({ page }) => {
    // Leave the input blank and click Add — no new card should appear
    const initialCardCount = await page
      .locator('[data-rfd-droppable-id="todo"] [data-rfd-draggable-id]')
      .count();

    await page.getByRole('button', { name: 'Add' }).click();

    // The form should still be visible (not submitted)
    await expect(page.getByPlaceholder('Task title…')).toBeVisible();

    // Card count in To Do must not have changed
    const afterCardCount = await page
      .locator('[data-rfd-droppable-id="todo"] [data-rfd-draggable-id]')
      .count();
    expect(afterCardCount).toBe(initialCardCount);
  });

  test('whitespace-only task title cannot be submitted', async ({ page }) => {
    // Fill with only spaces — still treated as blank
    const initialCardCount = await page
      .locator('[data-rfd-droppable-id="todo"] [data-rfd-draggable-id]')
      .count();

    await page.getByPlaceholder('Task title…').fill('   ');
    await page.getByRole('button', { name: 'Add' }).click();

    // Form remains open; no extra card created
    await expect(page.getByPlaceholder('Task title…')).toBeVisible();

    const afterCardCount = await page
      .locator('[data-rfd-droppable-id="todo"] [data-rfd-draggable-id]')
      .count();
    expect(afterCardCount).toBe(initialCardCount);
  });

  test('cancel new task form with Escape key', async ({ page }) => {
    await page.getByPlaceholder('Task title…').fill('Should not be saved');
    await page.keyboard.press('Escape');

    // Form input should no longer be visible
    await expect(page.getByPlaceholder('Task title…')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// New Project form
// ---------------------------------------------------------------------------

test.describe('New Project Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'Alex Rivera');
    await page.getByRole('button', { name: 'New Project' }).click();
    await expect(page.getByPlaceholder('Project name')).toBeVisible();
  });

  test('empty project name cannot be submitted', async ({ page }) => {
    // Record how many projects are shown
    const initialCount = await page
      .locator('.grid button')
      .count();

    // Leave project name blank and click Create Project
    await page.getByRole('button', { name: 'Create Project' }).click();

    // Form should still be open
    await expect(page.getByPlaceholder('Project name')).toBeVisible();

    // Project list count unchanged
    const afterCount = await page.locator('.grid button').count();
    expect(afterCount).toBe(initialCount);
  });

  test('whitespace-only project name cannot be submitted', async ({ page }) => {
    const initialCount = await page.locator('.grid button').count();

    await page.getByPlaceholder('Project name').fill('   ');
    await page.getByRole('button', { name: 'Create Project' }).click();

    await expect(page.getByPlaceholder('Project name')).toBeVisible();

    const afterCount = await page.locator('.grid button').count();
    expect(afterCount).toBe(initialCount);
  });
});

// ---------------------------------------------------------------------------
// Comment form
// ---------------------------------------------------------------------------

test.describe('Comment Form Validation', () => {
  let uid: string;

  test.beforeEach(async ({ page }) => {
    uid = Date.now().toString(36);
    await loginAs(page, 'Alex Rivera');
    await openProject(page, 'Website Redesign');
    await page.getByText('Design new homepage layout').click();
    await expect(page.getByText('Comments')).toBeVisible();
  });

  test('empty comment cannot be submitted', async ({ page }) => {
    const modal = page.locator('.fixed.inset-0');
    const sendButton = modal.getByRole('button', { name: 'Send' });

    // Count current comments so we can verify no new one appears
    const initialCommentCount = await modal.locator('.min-w-0').count();

    // Click Send with no text entered
    await sendButton.click();

    // Comment count must not have increased
    const afterCommentCount = await modal.locator('.min-w-0').count();
    expect(afterCommentCount).toBe(initialCommentCount);
  });

  test('whitespace-only comment cannot be submitted', async ({ page }) => {
    const modal = page.locator('.fixed.inset-0');
    const commentInput = modal.getByPlaceholder('Add a comment...');
    const sendButton = modal.getByRole('button', { name: 'Send' });

    const initialCommentCount = await modal.locator('.min-w-0').count();

    await commentInput.fill('   ');
    await sendButton.click();

    const afterCommentCount = await modal.locator('.min-w-0').count();
    expect(afterCommentCount).toBe(initialCommentCount);
  });

  test('valid comment is submitted and appears in the list', async ({ page }) => {
    // Positive control: a non-blank comment IS saved and shown
    const modal = page.locator('.fixed.inset-0');
    const commentText = `ValidComment-${uid}`;

    await modal.getByPlaceholder('Add a comment...').fill(commentText);
    await modal.getByRole('button', { name: 'Send' }).click();

    await expect(modal.getByText(commentText)).toBeVisible();

    // Cleanup
    const commentBlock = modal.locator('.min-w-0').filter({ hasText: commentText });
    await commentBlock.getByText('Delete', { exact: true }).click();
    await expect(modal.getByText(commentText)).toHaveCount(0);
  });
});
