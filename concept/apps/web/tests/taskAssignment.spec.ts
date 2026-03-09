// =============================================================================
// E2E: Task Assignment — assign and unassign users to task cards
// =============================================================================
// Requirement REQ-09: "Assign a user to a task card"
//
// Source: "From that task card, assign one of the valid users."
//
// Tests run serially because they mutate shared database state (assignments).
// Each test restores seed data in its cleanup phase.
// =============================================================================

import { test, expect } from './base';

test.describe('Task Assignment', () => {
  // Prevent parallel execution — tests share DB state for task assignments
  test.describe.configure({ mode: 'serial' });

  test('assign a user to an unassigned task card', { tag: ['@smoke', '@qa', '@uat', '@prod-safe'] }, async ({ page }) => {
    // Navigate to Mobile App MVP — "Create onboarding flow"
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Mobile App MVP').click();
    await expect(page.locator('[data-rfd-droppable-id="todo"]')).toBeVisible();

    // Open the task detail
    await page.getByText('Create onboarding flow').click();
    const modal = page.locator('.fixed');
    await expect(modal).toBeVisible();

    // Ensure the task starts unassigned (clean up from any prior failed run)
    const assignDropdown = modal.locator('select');
    const currentValue = await assignDropdown.inputValue();
    if (currentValue !== '') {
      await assignDropdown.selectOption({ label: 'Unassigned' });
      await page.waitForResponse(
        (response) => response.url().includes('/assign') && response.status() === 200
      );
    }
    await expect(assignDropdown).toHaveValue('');

    // Assign to Morgan Lee
    await assignDropdown.selectOption({ label: 'Morgan Lee' });

    // Wait for the API call to complete
    await page.waitForResponse(
      (response) => response.url().includes('/assign') && response.status() === 200
    );

    // Verify dropdown now reflects Morgan Lee
    await expect(assignDropdown).not.toHaveValue('');

    // Close modal and verify the card now shows Morgan Lee's name
    await modal.getByRole('button', { name: 'x', exact: true }).click();
    const card = page.getByText('Create onboarding flow').locator('..');
    await expect(card.getByText('Morgan Lee')).toBeVisible();

    // Restore: unassign for other tests
    await page.getByText('Create onboarding flow').click();
    await expect(modal).toBeVisible();
    await modal.locator('select').selectOption({ label: 'Unassigned' });
    await page.waitForResponse(
      (response) => response.url().includes('/assign') && response.status() === 200
    );
  });

  test('unassign a user from a task card', { tag: ['@qa', '@uat', '@prod-safe'] }, async ({ page }) => {
    // Use Website Redesign — "Design new homepage layout" is assigned to Jordan Kim
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Website Redesign').first().click();
    await expect(page.locator('[data-rfd-droppable-id="todo"]')).toBeVisible();

    // Open the assigned task
    await page.getByText('Design new homepage layout').first().click();
    const modal = page.locator('.fixed');
    await expect(modal).toBeVisible();

    // Verify it is currently assigned (dropdown is not empty)
    const assignDropdown = modal.locator('select');
    await expect(assignDropdown).not.toHaveValue('');

    // Unassign by selecting "Unassigned"
    await assignDropdown.selectOption({ label: 'Unassigned' });

    await page.waitForResponse(
      (response) => response.url().includes('/assign') && response.status() === 200
    );

    // Verify dropdown is now empty (unassigned)
    await expect(assignDropdown).toHaveValue('');

    // Close modal — card should no longer show Jordan Kim's name
    await modal.getByRole('button', { name: 'x', exact: true }).click();
    const card = page.getByText('Design new homepage layout').first().locator('..');
    await expect(card.getByText('Jordan Kim')).not.toBeVisible();

    // Restore: re-assign Jordan Kim for seed data consistency
    await page.getByText('Design new homepage layout').first().click();
    await expect(modal).toBeVisible();
    await modal.locator('select').selectOption({ label: 'Jordan Kim' });
    await page.waitForResponse(
      (response) => response.url().includes('/assign') && response.status() === 200
    );
  });

  test('reassign a task from one user to another', { tag: ['@qa', '@uat', '@prod-safe'] }, async ({ page }) => {
    // Use Website Redesign — "Implement responsive navigation bar" is assigned to Alex Rivera
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Website Redesign').first().click();
    await expect(page.locator('[data-rfd-droppable-id="in_progress"]')).toBeVisible();

    // Open Alex's assigned task
    await page.getByText('Implement responsive navigation bar').first().click();
    const modal = page.locator('.fixed');
    await expect(modal).toBeVisible();

    // Reassign to Sarah Chen
    const assignDropdown = modal.locator('select');
    await assignDropdown.selectOption({ label: 'Sarah Chen' });

    await page.waitForResponse(
      (response) => response.url().includes('/assign') && response.status() === 200
    );

    // Close modal and verify the card now shows Sarah Chen
    await modal.getByRole('button', { name: 'x', exact: true }).click();
    const card = page.getByText('Implement responsive navigation bar').first().locator('..');
    await expect(card.getByText('Sarah Chen')).toBeVisible();

    // Restore: re-assign Alex Rivera
    await page.getByText('Implement responsive navigation bar').first().click();
    await expect(modal).toBeVisible();
    await modal.locator('select').selectOption({ label: 'Alex Rivera' });
    await page.waitForResponse(
      (response) => response.url().includes('/assign') && response.status() === 200
    );
  });

  test('assignment persists after navigating away and back', { tag: ['@prod-safe'] }, async ({ page }) => {
    // Navigate to Mobile App MVP — "Create onboarding flow"
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Mobile App MVP').click();
    await expect(page.locator('[data-rfd-droppable-id="todo"]')).toBeVisible();

    // Ensure task starts unassigned
    await page.getByText('Create onboarding flow').click();
    const modal = page.locator('.fixed');
    await expect(modal).toBeVisible();

    const assignDropdown = modal.locator('select');
    const currentValue = await assignDropdown.inputValue();
    if (currentValue !== '') {
      await assignDropdown.selectOption({ label: 'Unassigned' });
      await page.waitForResponse(
        (response) => response.url().includes('/assign') && response.status() === 200
      );
    }

    // Assign to Alex Rivera (current user)
    await assignDropdown.selectOption({ label: 'Alex Rivera' });
    await page.waitForResponse(
      (response) => response.url().includes('/assign') && response.status() === 200
    );

    // Close modal, navigate away, then back to force a full board refetch
    await modal.getByRole('button', { name: 'x', exact: true }).click();
    await page.getByText('← Projects').click();
    await page.getByText('Mobile App MVP').click();
    await expect(page.locator('[data-rfd-droppable-id="todo"]')).toBeVisible();

    // Verify the card now shows "Alex Rivera" after full board refetch
    const card = page.getByText('Create onboarding flow').first().locator('..');
    await expect(card.getByText('Alex Rivera')).toBeVisible();

    // Restore: unassign the task
    await page.getByText('Create onboarding flow').click();
    await expect(modal).toBeVisible();
    await modal.locator('select').selectOption({ label: 'Unassigned' });
    await page.waitForResponse(
      (response) => response.url().includes('/assign') && response.status() === 200
    );
  });
});
