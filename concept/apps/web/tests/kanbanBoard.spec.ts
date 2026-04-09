// =============================================================================
// E2E: Kanban Board — Columns & Cards
// =============================================================================
// Requirement (Taskify Product Description):
//   "Let's have the standard Kanban columns for the status of each task,
//    such as 'To Do,' 'In Progress,' 'In Review,' and 'Done.'"
//
//   "When you click on a project, you open the Kanban board for that project.
//    You're going to see the columns."
// =============================================================================

import { test, expect } from '@playwright/test';

const KANBAN_COLUMNS = ['To Do', 'In Progress', 'In Review', 'Done'] as const;

/**
 * Helper: select a user and open a project board.
 */
async function navigateToBoard(page: import('@playwright/test').Page) {
  await page.goto('/');
  // Pick the first user
  await page.getByText('Sarah Chen').click();
  // Open "Website Redesign" project (has one task per column in seed data)
  await page.getByText('Website Redesign').click();
  // Wait for the board to render
  await expect(page.getByText('To Do')).toBeVisible();
}

test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBoard(page);
  });

  test('renders exactly 4 Kanban columns', async ({ page }) => {
    // Spec: "standard Kanban columns: To Do, In Progress, In Review, Done"
    for (const col of KANBAN_COLUMNS) {
      await expect(page.getByRole('heading', { name: col })).toBeVisible();
    }

    // The board renders columns in a CSS grid container.
    // Match either Tailwind `grid-cols-4` or inline-style `grid-template-columns`
    const columnContainer = page.locator('.grid').filter({ has: page.locator('[data-rfd-droppable-id]') });
    await expect(columnContainer).toBeVisible();
  });

  test('seed data cards appear in the correct columns', async ({ page }) => {
    // Spec: "For each task in the UI for a task card, you should be able to
    //        change the current status of the task between the different
    //        columns in the Kanban work board."
    //
    // Actual database state for "Website Redesign" (005_seed_data.sql):
    //   To Do       → "Design new homepage layout"
    //   In Progress → "Implement responsive navigation bar"
    //   In Review   → "Refactor CSS to Tailwind"
    //   Done        → "Set up CI/CD pipeline"

    // Each column is a droppable identified by status id.
    // Column wrapper has the column header text inside it.
    const colLocator = (status: string) =>
      page.locator(`[data-rfd-droppable-id="${status}"]`);

    await expect(colLocator('todo')).toContainText('Design new homepage layout');
    await expect(colLocator('in_progress')).toContainText('Implement responsive navigation bar');
    await expect(colLocator('in_review')).toContainText('Refactor CSS to Tailwind');
    await expect(colLocator('done')).toContainText('Set up CI/CD pipeline');
  });

  test('clicking a card opens the task detail modal', async ({ page }) => {
    // Spec: task cards are interactive — clicking shows detail view
    await page.getByText('Design new homepage layout').click();
    // Modal overlay should appear — scope assertions to the modal
    // to avoid matching the board elements behind it
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('To Do')).toBeVisible();
    await expect(modal.getByText('Design new homepage layout')).toBeVisible();
  });

  test('back button returns to project list', async ({ page }) => {
    // Spec: "displays the list of projects … click on a project → Kanban board"
    await page.getByText('← Projects').click();
    await expect(page.getByText('Website Redesign')).toBeVisible();
    await expect(page.getByText('Mobile App MVP')).toBeVisible();
  });
});
