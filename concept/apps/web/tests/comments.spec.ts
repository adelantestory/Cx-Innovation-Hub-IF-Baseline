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

import { test, expect } from '@playwright/test';

test.describe('Comments', () => {
  test('add a new comment to a task', async ({ page }) => {
    // Requirement: "leave an unlimited number of comments for a particular card"
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Website Redesign').click();

    // Open task detail modal
    await page.getByText('Design new homepage layout').click();

    // Wait for the comments section to load
    await expect(page.getByText('Comments')).toBeVisible();

    // Type a comment and submit
    const commentInput = page.getByPlaceholder('Add a comment...');
    await commentInput.fill('This is a test comment from Alex');
    await page.getByRole('button', { name: 'Send' }).click();

    // Verify the comment appears
    await expect(page.getByText('This is a test comment from Alex')).toBeVisible();
    await expect(page.getByText('Alex Rivera').last()).toBeVisible();
  });

  test('edit own comment', async ({ page }) => {
    // Requirement: "You can edit any comments that you make"
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Website Redesign').click();

    // Open task detail — "Implement responsive navigation bar" has a comment
    // by Alex Rivera in the seed data
    await page.getByText('Implement responsive navigation bar').click();
    await expect(page.getByText('Comments')).toBeVisible();

    // Alex's seed comment: "I am about halfway done with this..."
    const alexComment = page.getByText('I am about halfway done with this');
    await expect(alexComment).toBeVisible();

    // Click Edit button next to Alex's own comment
    const commentBlock = alexComment.locator('..').locator('..');
    await commentBlock.getByText('Edit').click();

    // Edit the comment inline
    const editInput = commentBlock.locator('input[type="text"]');
    await editInput.clear();
    await editInput.fill('Updated comment by Alex');
    await commentBlock.getByText('Save').click();

    // Verify the updated comment text
    await expect(page.getByText('Updated comment by Alex')).toBeVisible();
  });

  test('cannot edit or delete comments made by other users', async ({ page }) => {
    // Requirement: "you can't edit comments that other people made"
    // Requirement: "you can't delete comments anybody else made"
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Website Redesign').click();

    // Open "Design new homepage layout" — has comments by Sarah Chen (PM)
    // and Jordan Kim, neither of which are Alex Rivera
    await page.getByText('Design new homepage layout').click();
    await expect(page.getByText('Comments')).toBeVisible();

    // Sarah Chen's comment: "Let us prioritize the hero section..."
    const sarahComment = page.getByText('Let us prioritize the hero section');
    await expect(sarahComment).toBeVisible();

    // The comment block for Sarah's comment should NOT have Edit/Delete buttons
    // visible to Alex Rivera
    const sarahCommentBlock = sarahComment.locator('..').locator('..');
    await expect(sarahCommentBlock.getByText('Edit')).toHaveCount(0);
    await expect(sarahCommentBlock.getByText('Delete')).toHaveCount(0);
  });

  test('own comment shows Edit and Delete buttons', async ({ page }) => {
    // Requirement: "You can edit any comments that you make" +
    //              "You can delete any comments that you made"
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Website Redesign').click();

    // "Design new homepage layout" has a comment by Alex:
    // "Should we consider A/B testing the layout?"
    await page.getByText('Design new homepage layout').click();
    await expect(page.getByText('Comments')).toBeVisible();

    const alexComment = page.getByText('Should we consider A/B testing');
    await expect(alexComment).toBeVisible();

    const alexCommentBlock = alexComment.locator('..').locator('..');
    await expect(alexCommentBlock.getByText('Edit')).toBeVisible();
    await expect(alexCommentBlock.getByText('Delete')).toBeVisible();
  });

  test('delete own comment removes it from the list', async ({ page }) => {
    // Requirement: "You can delete any comments that you made"
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Website Redesign').click();

    // Add a fresh comment to delete
    await page.getByText('Design new homepage layout').click();
    await expect(page.getByText('Comments')).toBeVisible();

    const commentInput = page.getByPlaceholder('Add a comment...');
    await commentInput.fill('Temporary comment to delete');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('Temporary comment to delete')).toBeVisible();

    // Delete it
    const commentBlock = page.getByText('Temporary comment to delete').locator('..').locator('..');
    page.on('dialog', (dialog) => dialog.accept()); // confirm deletion
    await commentBlock.getByText('Delete').click();

    // Verify it's gone
    await expect(page.getByText('Temporary comment to delete')).toHaveCount(0);
  });
});
