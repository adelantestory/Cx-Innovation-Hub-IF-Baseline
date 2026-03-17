// =============================================================================
// E2E: Comments — add, edit own, cannot edit/delete others
// =============================================================================
// Requirement: "You should be able to leave an unlimited number of comments
// for a particular card."
//
// Requirement: "You can edit any comments that you make, but you can't edit
// comments that other people made."
//
// Requirement: "You can delete any comments that you made, but you can't
// delete comments anybody else made."
// =============================================================================

import { test, expect } from './base';

test.describe('Comments', () => {
  test('add a new comment to a task', { tag: ['@smoke','@prod-safe'] }, async ({ page }) => {
    // Requirement: "leave an unlimited number of comments for a particular card"
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Website Redesign').first().click();

    // Open task detail modal
    await page.getByText('Design new homepage layout').first().click();

    // Wait for the comments section to load
    await expect(page.getByText('Comments').first()).toBeVisible();

    // Type a comment with unique text to avoid conflicts from prior runs
    const uniqueComment = `Test comment from Alex ${Date.now()}`;
    const commentInput = page.getByPlaceholder('Add a comment...');
    await commentInput.fill(uniqueComment);
    await page.getByRole('button', { name: 'Send' }).first().click();

    // Verify the comment appears
    await expect(page.getByText(uniqueComment)).toBeVisible();
    await expect(page.getByText('Alex Rivera').last()).toBeVisible();
  });

  test('edit own comment', { tag: ['@prod-safe'] }, async ({ page }) => {
    // Requirement: "You can edit any comments that you make"
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Website Redesign').first().click();

    // Open task detail modal
    await page.getByText('Design new homepage layout').first().click();
    await expect(page.getByText('Comments').first()).toBeVisible();

    // Add a fresh comment to edit (avoids dependency on seed data from prior runs)
    const originalText = `Comment to edit ${Date.now()}`;
    const commentInput = page.getByPlaceholder('Add a comment...');
    await commentInput.fill(originalText);
    await page.getByRole('button', { name: 'Send' }).first().click();
    await expect(page.getByText(originalText)).toBeVisible();

    // Click Edit button next to the new comment
    const commentBlock = page.getByText(originalText).locator('..').locator('..');
    await commentBlock.getByRole('button', { name: 'Edit', exact: true }).click();

    // The edit input receives autoFocus; clear it, type updated text, press Enter
    const editInput = page.locator('input:focus');
    await editInput.clear();
    const updatedText = `Updated comment ${Date.now()}`;
    await editInput.fill(updatedText);
    await editInput.press('Enter');

    // Verify the updated comment text
    await expect(page.getByText(updatedText)).toBeVisible();
  });

  test('cannot edit or delete comments made by other users', { tag: ['@prod-safe'] }, async ({ page }) => {
    // Requirement: "you can't edit comments that other people made"
    // Requirement: "you can't delete comments anybody else made"
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Website Redesign').first().click();

    // Open "Design new homepage layout" — has comments by Sarah Chen (PM)
    // and Jordan Kim, neither of which are Alex Rivera
    await page.getByText('Design new homepage layout').first().click();
    await expect(page.getByText('Comments').first()).toBeVisible();

    // Sarah Chen's comment: "Let us prioritize the hero section..."
    const sarahComment = page.getByText('Let us prioritize the hero section');
    await expect(sarahComment).toBeVisible();

    // The comment block for Sarah's comment should NOT have Edit/Delete buttons
    // visible to Alex Rivera
    const sarahCommentBlock = sarahComment.locator('..').locator('..');
    await expect(sarahCommentBlock.getByRole('button', { name: 'Edit', exact: true })).toHaveCount(0);
    await expect(sarahCommentBlock.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0);
  });

  test('own comment shows Edit and Delete buttons', { tag: ['@prod-safe'] }, async ({ page }) => {
    // Requirement: "You can edit any comments that you make" +
    //              "You can delete any comments that you made"
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Website Redesign').first().click();

    // "Design new homepage layout" has a comment by Alex:
    // "Should we consider A/B testing the layout?"
    await page.getByText('Design new homepage layout').first().click();
    await expect(page.getByText('Comments').first()).toBeVisible();

    const alexComment = page.getByText('Should we consider A/B testing');
    await expect(alexComment).toBeVisible();

    const alexCommentBlock = alexComment.locator('..').locator('..');
    await expect(alexCommentBlock.getByRole('button', { name: 'Edit', exact: true })).toBeVisible();
    await expect(alexCommentBlock.getByRole('button', { name: 'Delete', exact: true })).toBeVisible();
  });

  test('delete own comment removes it from the list', { tag: ['@prod-safe'] }, async ({ page }) => {
    // Requirement: "You can delete any comments that you made"
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Website Redesign').first().click();

    // Add a fresh comment to delete
    await page.getByText('Design new homepage layout').first().click();
    await expect(page.getByText('Comments').first()).toBeVisible();

    // Add a fresh comment to delete (unique text avoids conflicts from prior runs)
    const uniqueComment = `Comment to delete ${Date.now()}`;
    const commentInput = page.getByPlaceholder('Add a comment...');
    await commentInput.fill(uniqueComment);
    await page.getByRole('button', { name: 'Send' }).first().click();
    await expect(page.getByText(uniqueComment)).toBeVisible();

    // Delete it
    const commentBlock = page.getByText(uniqueComment).locator('..').locator('..');
    page.on('dialog', (dialog) => dialog.accept()); // confirm deletion
    await commentBlock.getByRole('button', { name: 'Delete', exact: true }).click();

    // Verify it's gone
    await expect(page.getByText(uniqueComment)).toHaveCount(0);
  });
});
