import { test, expect } from '@playwright/test';

/**
 * Test Suite: Drag and Drop Functionality
 * 
 * Product Requirements:
 * - "You should be able to change the current status of the task between the different columns in the Kanban work board"
 * - "You'll be able to drag and drop cards back and forth between different columns"
 */
test.describe('Drag and Drop', () => {
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

  test('should move card from To Do to In Progress', async ({ page }) => {
    // Requirement: "You should be able to change the current status of the task between the different columns in the Kanban work board"
    const todoColumn = page.locator('[data-column*="TODO"], [data-column*="BACKLOG"], [data-status*="TODO"], [data-status*="BACKLOG"]').first();
    const inProgressColumn = page.locator('[data-column*="PROGRESS"], [data-status*="PROGRESS"]').first();
    
    // Find a card in To Do column
    const card = todoColumn.locator('[class*="card"], [data-card], [class*="task"]').first();
    
    if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
      const cardText = await card.textContent();
      
      // Perform drag and drop
      await card.dragTo(inProgressColumn);
      await page.waitForTimeout(1000);
      
      // Verify card moved to In Progress column
      const cardInNewColumn = inProgressColumn.locator(`text=${cardText?.substring(0, 20)}`).first();
      await expect(cardInNewColumn).toBeVisible({ timeout: 5000 });
    }
  });

  test('should move card from In Progress to In Review', async ({ page }) => {
    // Requirement: "You'll be able to drag and drop cards back and forth between different columns"
    const inProgressColumn = page.locator('[data-column*="PROGRESS"], [data-status*="PROGRESS"]').first();
    const reviewColumn = page.locator('[data-column*="REVIEW"], [data-status*="REVIEW"]').first();
    
    let card = inProgressColumn.locator('[class*="card"], [data-card], [class*="task"]').first();
    
    // If no card in In Progress, move one there first
    if (!await card.isVisible({ timeout: 1000 }).catch(() => false)) {
      const todoColumn = page.locator('[data-column*="TODO"], [data-column*="BACKLOG"]').first();
      card = todoColumn.locator('[class*="card"], [data-card], [class*="task"]').first();
      await card.dragTo(inProgressColumn);
      await page.waitForTimeout(500);
      card = inProgressColumn.locator('[class*="card"], [data-card], [class*="task"]').first();
    }
    
    const cardText = await card.textContent();
    
    // Perform drag and drop
    await card.dragTo(reviewColumn);
    await page.waitForTimeout(1000);
    
    // Verify card moved to Review column
    const cardInNewColumn = reviewColumn.locator(`text=${cardText?.substring(0, 20)}`).first();
    await expect(cardInNewColumn).toBeVisible({ timeout: 5000 });
  });

  test('should move card from In Review to Done', async ({ page }) => {
    // Requirement: "You should be able to change the current status of the task between the different columns"
    const reviewColumn = page.locator('[data-column*="REVIEW"], [data-status*="REVIEW"]').first();
    const doneColumn = page.locator('[data-column*="DONE"], [data-status*="DONE"]').first();
    
    let card = reviewColumn.locator('[class*="card"], [data-card], [class*="task"]').first();
    
    // Ensure there's a card in Review
    if (!await card.isVisible({ timeout: 1000 }).catch(() => false)) {
      const todoColumn = page.locator('[data-column*="TODO"], [data-column*="BACKLOG"]').first();
      const inProgressColumn = page.locator('[data-column*="PROGRESS"]').first();
      
      card = todoColumn.locator('[class*="card"], [data-card], [class*="task"]').first();
      await card.dragTo(inProgressColumn);
      await page.waitForTimeout(300);
      
      card = inProgressColumn.locator('[class*="card"], [data-card], [class*="task"]').first();
      await card.dragTo(reviewColumn);
      await page.waitForTimeout(300);
      
      card = reviewColumn.locator('[class*="card"], [data-card], [class*="task"]').first();
    }
    
    const cardText = await card.textContent();
    
    // Perform drag and drop
    await card.dragTo(doneColumn);
    await page.waitForTimeout(1000);
    
    // Verify card moved to Done column
    const cardInNewColumn = doneColumn.locator(`text=${cardText?.substring(0, 20)}`).first();
    await expect(cardInNewColumn).toBeVisible({ timeout: 5000 });
  });

  test('should allow moving cards back and forth between columns', async ({ page }) => {
    // Requirement: "You'll be able to drag and drop cards back and forth between different columns"
    const inProgressColumn = page.locator('[data-column*="PROGRESS"], [data-status*="PROGRESS"]').first();
    const todoColumn = page.locator('[data-column*="TODO"], [data-column*="BACKLOG"]').first();
    
    // Move a card from To Do to In Progress
    let card = todoColumn.locator('[class*="card"], [data-card], [class*="task"]').first();
    
    if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
      await card.dragTo(inProgressColumn);
      await page.waitForTimeout(500);
      
      // Now move it back to To Do
      card = inProgressColumn.locator('[class*="card"], [data-card], [class*="task"]').first();
      const cardText = await card.textContent();
      
      await card.dragTo(todoColumn);
      await page.waitForTimeout(1000);
      
      // Verify card moved back to To Do
      const cardInTodo = todoColumn.locator(`text=${cardText?.substring(0, 20)}`).first();
      await expect(cardInTodo).toBeVisible({ timeout: 5000 });
    }
  });

  test('should persist card status after drag and drop', async ({ page }) => {
    // Requirement: "You should be able to change the current status of the task"
    const todoColumn = page.locator('[data-column*="TODO"], [data-column*="BACKLOG"]').first();
    const inProgressColumn = page.locator('[data-column*="PROGRESS"]').first();
    
    const card = todoColumn.locator('[class*="card"], [data-card], [class*="task"]').first();
    
    if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
      const cardText = await card.textContent();
      
      await card.dragTo(inProgressColumn);
      await page.waitForTimeout(1000);
      
      // Reload page to verify persistence
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Verify card is still in In Progress column
      const cardAfterReload = inProgressColumn.locator(`text=${cardText?.substring(0, 20)}`).first();
      await expect(cardAfterReload).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow dragging cards between any columns', async ({ page }) => {
    // Requirement: "You'll be able to drag and drop cards back and forth between different columns"
    const todoColumn = page.locator('[data-column*="TODO"], [data-column*="BACKLOG"]').first();
    const doneColumn = page.locator('[data-column*="DONE"]').first();
    
    // Try moving a card directly from To Do to Done
    const card = todoColumn.locator('[class*="card"], [data-card], [class*="task"]').first();
    
    if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
      const cardText = await card.textContent();
      
      await card.dragTo(doneColumn);
      await page.waitForTimeout(1000);
      
      // Verify card moved to Done column
      const cardInDone = doneColumn.locator(`text=${cardText?.substring(0, 20)}`).first();
      await expect(cardInDone).toBeVisible({ timeout: 5000 });
    }
  });
});
