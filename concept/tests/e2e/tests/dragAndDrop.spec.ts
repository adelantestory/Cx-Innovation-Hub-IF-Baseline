// =============================================================================
// E2E: Drag-and-Drop — Move Cards Between Columns
// =============================================================================
// Requirement (Taskify Product Description):
//   "You will be able to drag and drop cards back and forth between different
//    columns."
//
//   "For each task in the UI for a task card, you should be able to change the
//    current status of the task between the different columns in the Kanban
//    work board."
// =============================================================================

import { test, expect } from '@playwright/test';

function cardLocator(page: import('@playwright/test').Page, title: string) {
  return page
    .locator('[data-rfd-draggable-id]')
    .filter({ hasText: title })
    .first();
}

async function resetTaskStatus(
  page: import('@playwright/test').Page,
  projectName: string,
  taskTitle: string,
  status: 'todo' | 'in_progress' | 'in_review' | 'done' = 'todo'
) {
  const projectsResponse = await page.request.get('/api/projects');
  const projects = await projectsResponse.json();
  const project = projects.find((item: { name: string; id: string }) => item.name === projectName);

  if (!project) {
    throw new Error(`Project not found: ${projectName}`);
  }

  const tasksResponse = await page.request.get(`/api/projects/${project.id}/tasks`);
  const tasks = await tasksResponse.json();
  const task = tasks.find((item: { title: string; id: string }) => item.title === taskTitle);

  if (!task) {
    throw new Error(`Task not found: ${taskTitle}`);
  }

  const resetResponse = await page.request.patch(`/api/tasks/${task.id}/status`, {
    data: { status, position: 0 },
  });

  if (!resetResponse.ok()) {
    throw new Error(`Failed to reset task status for ${taskTitle}`);
  }
}

async function navigateToBoard(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByText('Sarah Chen').click();
  await page.getByText('Website Redesign').click();
  await expect(page.getByText('To Do')).toBeVisible();
}

test.describe('Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await resetTaskStatus(page, 'Website Redesign', 'Design new homepage layout');
    await navigateToBoard(page);
  });

  test('move a card from "To Do" to "In Progress" via drag-and-drop', async ({
    page,
  }) => {
    // Spec: "drag and drop cards back and forth between different columns"
    //
    // We drag "Design new homepage layout" (seeded in To Do)
    // into the In Progress column.

    const card = cardLocator(page, 'Design new homepage layout');
    const sourceColumn = page.locator('[data-rfd-droppable-id="todo"]');
    const targetColumn = page.locator('[data-rfd-droppable-id="in_progress"]');

    // Confirm card is currently in the To Do column
    await expect(sourceColumn).toContainText('Design new homepage layout');

    // Keyboard drag is the reliable interaction for this DnD implementation.
    await card.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');

    // Verify the card now lives in the In Progress column
    await expect(targetColumn).toContainText('Design new homepage layout');
  });

  test('card status is persisted after drag-and-drop (survives refresh)', async ({
    page,
  }) => {
    // Spec: "change the current status of the task between the different
    //        columns in the Kanban work board"
    // The API PATCH /api/tasks/:id/status persists the change.

    const card = cardLocator(page, 'Design new homepage layout');
    const targetColumn = page.locator('[data-rfd-droppable-id="in_progress"]');

    // Drag To Do → In Progress
    await card.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');

    // Wait for optimistic update AND network persist
    await expect(targetColumn).toContainText('Design new homepage layout');

    // Reload and re-navigate to confirm persistence
    await page.reload();
    await navigateToBoard(page);
    await expect(page.locator('[data-rfd-droppable-id="in_progress"]')).toContainText(
      'Design new homepage layout'
    );
  });
});
