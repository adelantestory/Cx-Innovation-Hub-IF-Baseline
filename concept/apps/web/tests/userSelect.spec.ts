// =============================================================================
// E2E: User Selection on Launch
// =============================================================================
// Requirement: "When you first launch Taskify, it's going to give you a list
// of the five users to pick from. There will be no password required. When you
// click on a user, you go into the main view, which displays the list of
// projects."
// =============================================================================

import { test, expect } from './base';

const EXPECTED_USERS = [
  { name: 'Sarah Chen', role: 'product manager' },
  { name: 'Alex Rivera', role: 'engineer' },
  { name: 'Jordan Kim', role: 'engineer' },
  { name: 'Morgan Lee', role: 'engineer' },
  { name: 'Taylor Patel', role: 'engineer' },
];

test.describe('User Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays Taskify heading and five user cards on launch', { tag: ['@smoke','@dev', '@qa', '@uat', '@prod-safe'] }, async ({ page }) => {
    // Requirement: "give you a list of the five users to pick from"
    await expect(page.getByRole('heading', { name: 'Taskify' })).toBeVisible();
    await expect(page.getByText('Select your user to get started')).toBeVisible();

    for (const user of EXPECTED_USERS) {
      const card = page.getByRole('button').filter({ hasText: user.name });
      await expect(card).toBeVisible();
      await expect(card.getByText(user.role)).toBeVisible();
    }
  });

  test('each user card shows an avatar with the first letter of the name', { tag: ['@dev', '@qa', '@uat', '@prod-safe'] }, async ({ page }) => {
    for (const user of EXPECTED_USERS) {
      const initial = user.name.charAt(0);
      const card = page.getByRole('button').filter({ hasText: user.name });
      await expect(card.getByText(initial, { exact: true })).toBeVisible();
    }
  });

  test('clicking a user navigates to the project list', { tag: ['@dev', '@qa', '@uat', '@prod-safe'] }, async ({ page }) => {
    // Requirement: "When you click on a user, you go into the main view,
    // which displays the list of projects."
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();

    // Should see the header with the user name and the project list
    await expect(page.getByText('Alex Rivera')).toBeVisible();
    await expect(page.getByText('Switch User')).toBeVisible();
  });

  test('no password prompt is shown', { tag: ['@dev', '@qa', '@uat', '@prod-safe'] }, async ({ page }) => {
    // Requirement: "There will be no password required."
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
  });

  test('Switch User returns to the user selection screen', { tag: ['@dev', '@qa', '@uat', '@prod-safe'] }, async ({ page }) => {
    // Select a user first
    await page.getByRole('button').filter({ hasText: 'Sarah Chen' }).click();
    await expect(page.getByText('Switch User')).toBeVisible();

    // Click Switch User
    await page.getByText('Switch User').click();

    // Should be back on the user selection screen
    await expect(page.getByRole('heading', { name: 'Taskify' })).toBeVisible();
    await expect(page.getByText('Select your user to get started')).toBeVisible();
  });
});
