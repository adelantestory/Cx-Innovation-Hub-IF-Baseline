// =============================================================================
// E2E: User Selection on Launch
// =============================================================================
// Requirement (Taskify Product Description):
//   "When you first launch Taskify, it's going to give you a list of the five
//    users to pick from. There will be no password required. When you click on
//    a user, you go into the main view, which displays the list of projects."
// =============================================================================

import { test, expect } from '@playwright/test';

const EXPECTED_USERS = [
  { name: 'Sarah Chen', role: 'product manager' },
  { name: 'Alex Rivera', role: 'engineer' },
  { name: 'Jordan Kim', role: 'engineer' },
  { name: 'Morgan Lee', role: 'engineer' },
  { name: 'Taylor Patel', role: 'engineer' },
];

test.describe('User Selection Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays Taskify branding and selection prompt', async ({ page }) => {
    // Spec: "When you first launch Taskify"
    await expect(page.getByRole('heading', { name: 'Taskify' })).toBeVisible();
    await expect(page.getByText('Select your user to get started')).toBeVisible();
  });

  test('shows exactly 5 predefined users', async ({ page }) => {
    // Spec: "give you a list of the five users to pick from"
    // Spec: "five users in two different categories, one product manager
    //        and four engineers"
    for (const { name, role } of EXPECTED_USERS) {
      // Scope each check to the specific user button to avoid strict mode violations
      // (e.g., 'engineer' appears 4 times on the page)
      const userCard = page.locator('button').filter({ hasText: name });
      await expect(userCard).toBeVisible();
      await expect(userCard.getByText(role)).toBeVisible();
    }

    // Exactly 5 user buttons
    const userButtons = page.locator('button').filter({ has: page.locator('.rounded-full') });
    await expect(userButtons).toHaveCount(5);
  });

  test('clicking a user navigates to the project list', async ({ page }) => {
    // Spec: "When you click on a user, you go into the main view, which
    //        displays the list of projects."
    await page.getByText('Sarah Chen').click();

    // Should see the project list — verify at least the 3 sample projects
    await expect(page.getByText('Website Redesign')).toBeVisible();
    await expect(page.getByText('Mobile App MVP')).toBeVisible();
    await expect(page.getByText('API Integration')).toBeVisible();
  });

  test('no password or login form is shown', async ({ page }) => {
    // Spec: "There will be no login for this application" /
    //        "There will be no password required."
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expect(page.getByText(/log\s*in/i)).toHaveCount(0);
  });
});
