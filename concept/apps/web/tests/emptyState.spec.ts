// =============================================================================
// E2E: Empty State — New project has no tasks
// =============================================================================
// Verifies that a brand-new project starts with 4 empty Kanban columns and
// that each column shows a "0" count badge.
//
// Requirement (Taskify Product Description):
//   "Let's have the standard Kanban columns for the status of each task,
//    such as 'To Do,' 'In Progress,' 'In Review,' and 'Done.'"
//
// This also validates that the column count badge component renders correctly
// for the zero-tasks case, which is not covered by the seed-data tests that
// always find pre-populated tasks.
// =============================================================================

import { test, expect } from "./base";

const KANBAN_COLUMNS = ["To Do", "In Progress", "In Review", "Done"] as const;

test.describe("Empty State — New Project", () => {
  test(
    "a freshly created project shows 4 empty columns",
    { tag: ["@smoke", "@qa"] },
    async ({ page }) => {
      // 1. Log in
      await page.goto("/");
      await page.getByRole("button").filter({ hasText: "Alex Rivera" }).click();
      await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

      // 2. Create a new project so we get a guaranteed empty board
      const projectName = `Empty State Project ${Date.now()}`;
      await page.getByRole("button", { name: "New Project" }).click();
      await page.getByPlaceholder("Project name").fill(projectName);
      await page.getByRole("button", { name: "Create Project" }).click();

      // 3. Navigate into the new project's board
      await page.getByRole("button").filter({ hasText: projectName }).click();
      await expect(page.getByRole("heading", { name: "To Do" })).toBeVisible();

      // 4. All 4 column headings must be visible
      for (const col of KANBAN_COLUMNS) {
        await expect(page.getByRole("heading", { name: col })).toBeVisible();
      }

      // 5. No task cards should be present
      await expect(page.locator("[data-rfd-draggable-id]")).toHaveCount(0);
    }
  );

  test(
    "each column shows a 0 count badge when the project has no tasks",
    { tag: ["@qa"] },
    async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button").filter({ hasText: "Alex Rivera" }).click();

      const projectName = `Badge Zero Test ${Date.now()}`;
      await page.getByRole("button", { name: "New Project" }).click();
      await page.getByPlaceholder("Project name").fill(projectName);
      await page.getByRole("button", { name: "Create Project" }).click();

      await page.getByRole("button").filter({ hasText: projectName }).click();
      await expect(page.getByRole("heading", { name: "To Do" })).toBeVisible();

      // Each column shows a rounded badge with the task count.
      // The badge is a <span> next to the column heading — "0" for empty columns.
      // We locate each column wrapper via its heading text and check for the badge.
      for (const col of KANBAN_COLUMNS) {
        const heading = page.getByRole("heading", { name: col });
        // Navigate up to the column container (parent of the heading's parent)
        const columnHeader = heading.locator("xpath=..");
        await expect(columnHeader.locator("span").filter({ hasText: /^0$/ })).toBeVisible();
      }
    }
  );

  test(
    "new task added to empty board appears in To Do column",
    { tag: ["@smoke", "@qa"] },
    async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button").filter({ hasText: "Alex Rivera" }).click();

      const projectName = `First Task Test ${Date.now()}`;
      await page.getByRole("button", { name: "New Project" }).click();
      await page.getByPlaceholder("Project name").fill(projectName);
      await page.getByRole("button", { name: "Create Project" }).click();

      await page.getByRole("button").filter({ hasText: projectName }).click();
      await expect(page.getByRole("heading", { name: "To Do" })).toBeVisible();

      // Confirm empty
      await expect(page.locator("[data-rfd-draggable-id]")).toHaveCount(0);

      // Add the first task
      const taskTitle = `First Task ${Date.now()}`;
      await page.getByRole("button", { name: "+ New Task" }).click();
      await page.getByPlaceholder("Task title…").fill(taskTitle);
      await page.getByRole("button", { name: "Add" }).click();

      // Task should appear in "To Do" column (default status for new tasks)
      const todoColumn = page.locator('[data-rfd-droppable-id="todo"]');
      await expect(todoColumn).toContainText(taskTitle);

      // Other columns should remain empty
      for (const colId of ["in_progress", "in_review", "done"] as const) {
        await expect(
          page.locator(`[data-rfd-droppable-id="${colId}"]`)
        ).not.toContainText(taskTitle);
      }
    }
  );
});
