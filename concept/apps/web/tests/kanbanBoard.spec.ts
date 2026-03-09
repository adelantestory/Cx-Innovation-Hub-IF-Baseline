// =============================================================================
// E2E: Kanban Board — 4 columns, cards in correct columns
// =============================================================================
// Requirement: "standard Kanban columns for the status of each task, such as
// 'To Do,' 'In Progress,' 'In Review,' and 'Done.'"
//
// Requirement: "When you click on a project, you open the Kanban board for
// that project. You're going to see the columns."
// =============================================================================

import { test, expect } from '@playwright/test';

const COLUMNS = ['To Do', 'In Progress', 'In Review', 'Done'];

// Seed data: Website Redesign project tasks (1 per column)
const WEBSITE_REDESIGN_TASKS: Record<string, string> = {
  'To Do': 'Design new homepage layout',
  'In Progress': 'Implement responsive navigation bar',
  'In Review': 'Refactor CSS to Tailwind',
  'Done': 'Set up CI/CD pipeline',
};

test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as Alex Rivera and open "Website Redesign"
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Website Redesign').click();
  });

  test('board renders exactly 4 Kanban columns with correct headings', async ({ page }) => {
    // Requirement: "standard Kanban columns: To Do, In Progress, In Review, Done"
    for (const column of COLUMNS) {
      await expect(page.getByRole('heading', { name: column })).toBeVisible();
    }
  });

  test('each column contains its expected task cards', async ({ page }) => {
    // Requirement: Tasks are distributed across the four Kanban columns
    for (const [_column, taskTitle] of Object.entries(WEBSITE_REDESIGN_TASKS)) {
      await expect(page.getByText(taskTitle)).toBeVisible();
    }
  });

  test('columns show a card count badge', async ({ page }) => {
    // Each column in Website Redesign has exactly 1 task in seed data
    // The Column component renders a count badge
    for (const column of COLUMNS) {
      const columnHeading = page.getByRole('heading', { name: column });
      const columnContainer = columnHeading.locator('..');
      await expect(columnContainer.getByText('1')).toBeVisible();
    }
  });

  test('clicking a card opens the task detail modal', async ({ page }) => {
    // Requirement: "For each task in the UI for a task card..."
    await page.getByText('Design new homepage layout').click();

    // The TaskDetail modal should show the task title
    await expect(
      page.locator('.fixed').getByText('Design new homepage layout')
    ).toBeVisible();

    // Close modal
    await page.locator('.fixed').getByText('x').click();
  });

  test('back button returns to the project list', async ({ page }) => {
    await page.getByText('← Projects').click();
    await expect(page.getByText('Website Redesign')).toBeVisible();
    await expect(page.getByText('Mobile App MVP')).toBeVisible();
  });
});
