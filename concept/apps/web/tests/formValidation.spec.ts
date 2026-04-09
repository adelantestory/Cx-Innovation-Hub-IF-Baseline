// =============================================================================
// E2E: Form Validation — New Task and New Project guards
// =============================================================================
// Covers input validation that prevents empty or whitespace-only data from
// being submitted to the API.
//
// Requirements (Taskify Product Description):
//   "Include New Task button/form"
//   "New Task button … add → appears on board"
//
// These tests verify the defensive guards already implemented in Board.tsx
// (`disabled={!newTaskTitle.trim()}`) and in ProjectList.tsx.
// =============================================================================

import { test, expect } from "./base";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginAndOpenBoard(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button").filter({ hasText: "Alex Rivera" }).click();
  await page.getByRole("button").filter({ hasText: "Website Redesign" }).click();
  await expect(page.getByRole("heading", { name: "To Do" })).toBeVisible();
}

async function loginAndOpenProjectList(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button").filter({ hasText: "Alex Rivera" }).click();
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
}

// ---------------------------------------------------------------------------
// New Task form validation
// ---------------------------------------------------------------------------

test.describe("New Task Form Validation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndOpenBoard(page);
  });

  test(
    "Add button is disabled when task title is empty",
    { tag: ["@smoke", "@qa"] },
    async ({ page }) => {
      // Open the new task form
      await page.getByRole("button", { name: "+ New Task" }).click();
      await expect(page.getByPlaceholder("Task title…")).toBeVisible();

      // The submit button should be disabled with an empty title
      const addButton = page.getByRole("button", { name: "Add" });
      await expect(addButton).toBeDisabled();
    }
  );

  test(
    "Add button is disabled when task title is whitespace only",
    { tag: ["@qa"] },
    async ({ page }) => {
      await page.getByRole("button", { name: "+ New Task" }).click();
      const titleInput = page.getByPlaceholder("Task title…");
      await expect(titleInput).toBeVisible();

      // Type whitespace — the guard trims before enabling
      await titleInput.fill("   ");

      const addButton = page.getByRole("button", { name: "Add" });
      await expect(addButton).toBeDisabled();
    }
  );

  test(
    "Add button becomes enabled once a non-blank title is entered",
    { tag: ["@smoke", "@qa"] },
    async ({ page }) => {
      await page.getByRole("button", { name: "+ New Task" }).click();
      const titleInput = page.getByPlaceholder("Task title…");

      // Initially disabled
      const addButton = page.getByRole("button", { name: "Add" });
      await expect(addButton).toBeDisabled();

      // Type a valid title — button should become enabled
      await titleInput.fill("Valid task title");
      await expect(addButton).toBeEnabled();
    }
  );

  test(
    "Cancel button closes the new task form without creating a task",
    { tag: ["@qa"] },
    async ({ page }) => {
      await page.getByRole("button", { name: "+ New Task" }).click();
      await expect(page.getByPlaceholder("Task title…")).toBeVisible();

      // Fill a title but then cancel
      await page.getByPlaceholder("Task title…").fill("This should not be saved");
      await page.getByRole("button", { name: "Cancel" }).click();

      // Form should be hidden
      await expect(page.getByPlaceholder("Task title…")).toHaveCount(0);
      // The typed text should NOT appear as a card on the board
      await expect(page.getByText("This should not be saved")).toHaveCount(0);
    }
  );
});

// ---------------------------------------------------------------------------
// New Project form validation
// ---------------------------------------------------------------------------

test.describe("New Project Form Validation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndOpenProjectList(page);
  });

  test(
    "Create Project button is disabled when project name is empty",
    { tag: ["@smoke", "@qa"] },
    async ({ page }) => {
      await page.getByRole("button", { name: "New Project" }).click();
      await expect(page.getByPlaceholder("Project name")).toBeVisible();

      // Submit button should be disabled with an empty name field
      const createButton = page.getByRole("button", { name: "Create Project" });
      await expect(createButton).toBeDisabled();
    }
  );

  test(
    "Create Project button becomes enabled once a name is entered",
    { tag: ["@smoke", "@qa"] },
    async ({ page }) => {
      await page.getByRole("button", { name: "New Project" }).click();

      const createButton = page.getByRole("button", { name: "Create Project" });
      await expect(createButton).toBeDisabled();

      await page.getByPlaceholder("Project name").fill("My New Project");
      await expect(createButton).toBeEnabled();
    }
  );
});
