// =============================================================================
// E2E: Comments — Add, Edit Own, Cannot Edit/Delete Others
// =============================================================================
// Requirements (Taskify Product Description):
//   "You should be able to leave an unlimited number of comments for a
//    particular card."
//
//   "You can edit any comments that you make, but you can't edit comments
//    that other people made."
//
//   "You can delete any comments that you made, but you can't delete
//    comments anybody else made."
// =============================================================================

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Because the database persists across test runs, every comment must use a
// unique string so locators never match stale data from previous runs.
// ---------------------------------------------------------------------------
let uid: string;

test.beforeEach(() => {
  uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
});

/**
 * Helper: select a user, open a project, and click a task card to open
 * the detail modal where comments live.
 */
async function openTaskDetail(
  page: import('@playwright/test').Page,
  userName: string,
  taskTitle: string
) {
  await page.goto('/');
  await page.getByText(userName).click();
  await page.getByText('Website Redesign').click();
  await expect(page.getByText('To Do')).toBeVisible();
  await page.getByText(taskTitle).click();
  // Wait for the modal's comment section to load
  await expect(page.getByText('Comments')).toBeVisible();
}

test.describe('Comments', () => {
  test('add a new comment to a task', async ({ page }) => {
    // Spec: "leave an unlimited number of comments for a particular card"
    await openTaskDetail(page, 'Sarah Chen', 'Design new homepage layout');

    const commentText = `E2E-add-${uid}`;
    const modal = page.locator('.fixed.inset-0');
    const commentInput = modal.getByPlaceholder('Add a comment...');
    const sendButton = modal.getByRole('button', { name: 'Send' });

    // Post a comment
    await commentInput.fill(commentText);
    await sendButton.click();

    // Verify the comment appears in the list
    await expect(modal.getByText(commentText)).toBeVisible();
    // Verify the author is shown next to the comment
    const postedComment = modal.locator('.min-w-0').filter({ hasText: commentText });
    await expect(postedComment.locator('.font-semibold').filter({ hasText: 'Sarah Chen' })).toBeVisible();
  });

  test('add multiple comments (unlimited)', async ({ page }) => {
    // Spec: "leave an unlimited number of comments"
    await openTaskDetail(page, 'Sarah Chen', 'Design new homepage layout');

    const modal = page.locator('.fixed.inset-0');
    const commentInput = modal.getByPlaceholder('Add a comment...');
    const sendButton = modal.getByRole('button', { name: 'Send' });

    const c1 = `First-${uid}`, c2 = `Second-${uid}`, c3 = `Third-${uid}`;

    await commentInput.fill(c1);
    await sendButton.click();
    await expect(modal.getByText(c1)).toBeVisible();

    await commentInput.fill(c2);
    await sendButton.click();
    await expect(modal.getByText(c2)).toBeVisible();

    await commentInput.fill(c3);
    await sendButton.click();
    await expect(modal.getByText(c3)).toBeVisible();
  });

  test('edit own comment', async ({ page }) => {
    // Spec: "You can edit any comments that you make"
    await openTaskDetail(page, 'Sarah Chen', 'Design new homepage layout');

    const modal = page.locator('.fixed.inset-0');
    const originalText = `Edit-me-${uid}`;
    const editedText = `Edited-${uid}`;

    // Add a comment first
    const commentInput = modal.getByPlaceholder('Add a comment...');
    await commentInput.fill(originalText);
    await modal.getByRole('button', { name: 'Send' }).click();
    await expect(modal.getByText(originalText)).toBeVisible();

    // Click "Edit" scoped to this specific comment
    const commentBlock = modal.locator('.min-w-0').filter({ hasText: originalText });
    await commentBlock.getByText('Edit', { exact: true }).click();

    // Once editing, the original text is in an <input> value (not DOM text),
    // so re-locate the editing block by the presence of an input + Save button.
    const editingBlock = modal.locator('.min-w-0').filter({
      has: page.locator('input[type="text"]'),
    });
    const editInput = editingBlock.locator('input[type="text"]');
    await editInput.fill(editedText);
    await editingBlock.getByText('Save').click();

    // Verify the updated text
    await expect(modal.getByText(editedText)).toBeVisible();
    const updatedComment = modal.locator('.min-w-0').filter({ hasText: editedText });
    await expect(updatedComment.getByText('(edited)')).toBeVisible();
  });

  test('delete own comment', async ({ page }) => {
    // Spec: "You can delete any comments that you made"
    await openTaskDetail(page, 'Sarah Chen', 'Design new homepage layout');

    const modal = page.locator('.fixed.inset-0');
    const commentText = `Delete-me-${uid}`;

    // Add a comment
    const commentInput = modal.getByPlaceholder('Add a comment...');
    await commentInput.fill(commentText);
    await modal.getByRole('button', { name: 'Send' }).click();
    await expect(modal.getByText(commentText)).toBeVisible();

    // Click Delete scoped to this specific comment
    const commentBlock = modal.locator('.min-w-0').filter({ hasText: commentText });
    await commentBlock.getByText('Delete', { exact: true }).click();

    // Comment should disappear
    await expect(modal.getByText(commentText)).toHaveCount(0);
  });

  test('cannot edit or delete comments made by another user', async ({ page }) => {
    // Spec: "you can't edit comments that other people made"
    // Spec: "you can't delete comments anybody else made"
    //
    // Strategy: Sarah Chen adds a comment, then we switch users and verify
    // that Alex Rivera cannot see Edit/Delete on Sarah's comment.

    const commentText = `Ownership-${uid}`;

    // Step 1 — Sarah creates a comment
    await openTaskDetail(page, 'Sarah Chen', 'Design new homepage layout');
    const modal = page.locator('.fixed.inset-0');
    const commentInput = modal.getByPlaceholder('Add a comment...');
    await commentInput.fill(commentText);
    await modal.getByRole('button', { name: 'Send' }).click();
    await expect(modal.getByText(commentText)).toBeVisible();

    // Close the task detail modal
    await modal.locator('button').filter({ hasText: 'x' }).click();
    await expect(modal).toBeHidden();

    // Navigate home → switch user → re-open same task
    await page.getByText('Switch User').click();
    await page.getByText('Alex Rivera').click();
    await page.getByText('Website Redesign').click();
    await expect(page.getByText('To Do')).toBeVisible();
    await page.getByText('Design new homepage layout').click();
    await expect(page.getByText('Comments')).toBeVisible();

    // Step 2 — Alex sees Sarah's comment but NOT Edit/Delete controls on it
    const modal2 = page.locator('.fixed.inset-0');
    const sarahComment = modal2.locator('.min-w-0').filter({ hasText: commentText });
    await expect(sarahComment).toBeVisible();

    // Edit and Delete buttons should NOT be rendered for another user's comment
    await expect(sarahComment.getByText('Edit', { exact: true })).toHaveCount(0);
    await expect(sarahComment.getByText('Delete', { exact: true })).toHaveCount(0);
  });

  test('own comment shows Edit and Delete buttons', async ({ page }) => {
    // Spec: "You can edit any comments that you make" /
    //        "You can delete any comments that you made"
    //
    // The Edit and Delete controls must be visible for the author's own comment.
    await openTaskDetail(page, 'Sarah Chen', 'Design new homepage layout');

    const modal = page.locator('.fixed.inset-0');
    const commentText = `OwnButtons-${uid}`;

    // Post a comment as Sarah Chen
    const commentInput = modal.getByPlaceholder('Add a comment...');
    await commentInput.fill(commentText);
    await modal.getByRole('button', { name: 'Send' }).click();
    await expect(modal.getByText(commentText)).toBeVisible();

    // Scope to this specific comment block
    const commentBlock = modal.locator('.min-w-0').filter({ hasText: commentText });

    // Both Edit and Delete buttons must be rendered for the comment author
    await expect(commentBlock.getByText('Edit', { exact: true })).toBeVisible();
    await expect(commentBlock.getByText('Delete', { exact: true })).toBeVisible();

    // Cleanup: delete the comment to avoid polluting future runs
    await commentBlock.getByText('Delete', { exact: true }).click();
    await expect(modal.getByText(commentText)).toHaveCount(0);
  });
});
