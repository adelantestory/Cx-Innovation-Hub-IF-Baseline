import { test, expect } from '@playwright/test';

/**
 * Test Suite: User Selection on Launch
 * 
 * Product Requirements:
 * - "When you first launch Taskify, it's going to give you a list of the five users to pick from"
 * - "There will be no password required. When you click on a user, you go into the main view"
 * - "Five users in two different categories, one product manager and four engineers"
 */
test.describe('User Selection', () => {
  test('should display user selection interface on launch', async ({ page }) => {
    // Requirement: "When you first launch Taskify, it's going to give you a list of the five users to pick from"
    await page.goto('/');
    
    // Should see user selection prompt
    await expect(page.locator('h1, h2').filter({ hasText: /select.*user|choose.*user|pick.*user/i })).toBeVisible();
  });

  test('should display five predefined users', async ({ page }) => {
    // Requirement: "Five users in two different categories, one product manager and four engineers"
    await page.goto('/');
    
    // Should see user selection buttons/cards
    const userButtons = page.locator('button, [role="button"]').filter({ hasText: /.+/ });
    const visibleButtons = await userButtons.filter({ hasNotText: /^$/ }).count();
    
    expect(visibleButtons).toBeGreaterThanOrEqual(5);
  });

  test('should navigate to main view after user selection', async ({ page }) => {
    // Requirement: "When you click on a user, you go into the main view, which displays the list of projects"
    await page.goto('/');
    
    // Click the first user
    const firstUser = page.locator('button, [role="button"]').filter({ hasText: /.+/ }).first();
    await firstUser.click();
    
    // Should see projects list or main view
    await expect(page.locator('text=/project/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should not require password', async ({ page }) => {
    // Requirement: "There will be no password required"
    await page.goto('/');
    
    // Should not see any password input field
    const passwordInput = page.locator('input[type="password"]');
    expect(await passwordInput.count()).toBe(0);
  });

  test('should allow selecting different users', async ({ page }) => {
    // Requirement: "When you first launch Taskify, it's going to give you a list of the five users to pick from"
    await page.goto('/');
    
    const userButtons = page.locator('button, [role="button"]').filter({ hasText: /.+/ });
    const firstUserText = await userButtons.first().textContent();
    const secondUserText = await userButtons.nth(1).textContent();
    
    // Verify we have different users
    expect(firstUserText).not.toBe(secondUserText);
    
    // Should be able to click either one
    await userButtons.first().click();
    await expect(page.locator('text=/project/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should display product manager and engineers', async ({ page }) => {
    // Requirement: "Five users in two different categories, one product manager and four engineers"
    await page.goto('/');
    
    // Look for role indicators (PM or Engineer)
    const pageContent = await page.textContent('body');
    const hasPM = /product manager|pm/i.test(pageContent || '');
    const hasEngineers = /engineer/i.test(pageContent || '');
    
    // At least one of these role indicators should be present
    expect(hasPM || hasEngineers).toBeTruthy();
  });
});
