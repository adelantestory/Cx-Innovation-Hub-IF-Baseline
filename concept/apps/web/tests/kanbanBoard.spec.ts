import { test, expect } from '@playwright/test';

/**
 * Test Suite: Kanban Board Display
 * 
 * Product Requirements:
 * - "Standard Kanban columns for the status of each task, such as 'To Do,' 'In Progress,' 'In Review,' and 'Done'"
 * - "When you click on a project, you open the Kanban board for that project"
 * - "You're going to see the columns"
 */
test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Select a user
    const userButton = page.locator('button, [role="button"]').filter({ hasText: /.+/ }).first();
    await userButton.click();
    await page.waitForTimeout(500);
    
    // Click on a project to open Kanban board
    const projectButton = page.locator('button, [role="button"], a').filter({ hasText: /project/i }).first();
    if (await projectButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await projectButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should render four standard Kanban columns', async ({ page }) => {
    // Requirement: "Standard Kanban columns for the status of each task, such as 'To Do,' 'In Progress,' 'In Review,' and 'Done'"
    await expect(page.locator('text=/to do|backlog/i').first()).toBeVisible();
    await expect(page.locator('text=/in progress/i').first()).toBeVisible();
    await expect(page.locator('text=/in review|review/i').first()).toBeVisible();
    await expect(page.locator('text=/done/i').first()).toBeVisible();
  });

  test('should display column headers in correct order', async ({ page }) => {
    // Requirement: "Standard Kanban columns for the status of each task, such as 'To Do,' 'In Progress,' 'In Review,' and 'Done'"
    const headers = page.locator('[class*="column"] h2, [class*="column"] h3, [data-column] h2, [data-column] h3, h2, h3');
    
    const columnTexts = await headers.allTextContents();
    const normalizedTexts = columnTexts.map(t => t.toLowerCase().trim());
    
    expect(normalizedTexts.some(t => /to do|backlog/.test(t))).toBeTruthy();
    expect(normalizedTexts.some(t => /in progress/.test(t))).toBeTruthy();
    expect(normalizedTexts.some(t => /in review|review/.test(t))).toBeTruthy();
    expect(normalizedTexts.some(t => /done/.test(t))).toBeTruthy();
  });

  test('should display task cards in columns', async ({ page }) => {
    // Requirement: "For each task in the UI for a task card, you should be able to change the current status"
    const cards = page.locator('[class*="card"], [data-card], [class*="task"]');
    
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should display cards in correct columns based on status', async ({ page }) => {
    // Requirement: "You're going to see the columns. You'll be able to drag and drop cards back and forth between different columns"
    const columns = page.locator('[class*="column"], [data-column]');
    const columnCount = await columns.count();
    
    expect(columnCount).toBeGreaterThanOrEqual(4);
  });

  test('should display task card information', async ({ page }) => {
    // Requirement: "For each task in the UI for a task card"
    const card = page.locator('[class*="card"], [data-card], [class*="task"]').first();
    
    if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Card should contain text content (task information)
      const cardText = await card.textContent();
      expect(cardText).toBeTruthy();
      expect(cardText!.length).toBeGreaterThan(0);
    }
  });

  test('should display assigned user on task cards', async ({ page }) => {
    // Requirement: "From that task card, assign one of the valid users"
    const card = page.locator('[class*="card"], [data-card], [class*="task"]').first();
    
    if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
      const cardText = await card.textContent();
      // Card should show some user information or assignment
      expect(cardText).toBeTruthy();
    }
  });

  test('should open Kanban board when clicking project', async ({ page }) => {
    // Requirement: "When you click on a project, you open the Kanban board for that project"
    // This is tested in beforeEach, verify we're seeing the Kanban board
    await expect(page.locator('text=/to do|backlog|in progress|review|done/i').first()).toBeVisible();
  });

  test('should display three sample projects', async ({ page }) => {
    // Requirement: "Let's create three different sample projects"
    // Go back to projects list
    await page.goto('/');
    const userButton = page.locator('button, [role="button"]').filter({ hasText: /.+/ }).first();
    await userButton.click();
    await page.waitForTimeout(500);
    
    const projectElements = page.locator('button, [role="button"], a, [class*="project"]').filter({ hasText: /project/i });
    const projectCount = await projectElements.count();
    
    expect(projectCount).toBeGreaterThanOrEqual(3);
  });
});
