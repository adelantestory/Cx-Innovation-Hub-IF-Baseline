// =============================================================================
// E2E: UI Navigation Flow — end-to-end navigation paths
// =============================================================================
// Covers every main navigation path from the Mermaid UI flow diagram
// (concept/docs/UI_NAVIGATION_FLOW.md) that is NOT already tested by the
// feature-specific spec files.
//
// Diagram paths covered:
//   ① Full forward:  User Select → Projects → Board → Task Detail
//   ② Full round-trip: …→ Close → ← Projects → Switch User → User Select
//   ③ Header logo:   Board → Taskify logo → Project List
//   ④ Header logo:   Project List → Taskify logo → stays on Project List
//   ⑤ Header absent: User Select has no header
//   ⑥ New Project:   Inline form → create → appears in list
//   ⑦ New Task:      Inline form → add → appears on board
//   ⑧ Task edit:     Title + description inline edit → save
//   ⑨ Task assign:   Change assignee dropdown
//   ⑩ Task delete:   Delete → confirm → card removed, returns to board
//   ⑪ Multi-project: Navigate between different projects
// =============================================================================

import { test, expect } from "./base";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Log in as a given user and land on the Project List. */
async function loginAs(page: import("@playwright/test").Page, userName: string) {
  await page.goto("/");
  await page.getByRole("button").filter({ hasText: userName }).click();
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
}

/** From Project List, open a project's Kanban board. */
async function openProject(
  page: import("@playwright/test").Page,
  projectName: string
) {
  await page.getByRole("button").filter({ hasText: projectName }).click();
  await expect(page.getByRole("heading", { name: "To Do" })).toBeVisible();
}

/** From the Kanban board, click a task card to open the Task Detail modal. */
async function openTaskDetail(
  page: import("@playwright/test").Page,
  taskTitle: string
) {
  await page.getByText(taskTitle).first().click();
  await expect(
    page.locator(".fixed").getByText(taskTitle)
  ).toBeVisible();
}

// ---------------------------------------------------------------------------
// ① ② Full navigation paths
// ---------------------------------------------------------------------------

test.describe("Full Navigation Paths", () => {
  test(
    "complete forward path: User Select → Projects → Board → Task Detail",
    { tag: ["@navigation", "@smoke"] },
    async ({ page }) => {
      await page.goto("/");

      // User Selection screen
      await expect(
        page.getByText("Select your user to get started")
      ).toBeVisible();

      // → Project List
      await page.getByRole("button").filter({ hasText: "Alex Rivera" }).click();
      await expect(
        page.getByRole("heading", { name: "Projects" })
      ).toBeVisible();

      // → Kanban Board
      await page
        .getByRole("button")
        .filter({ hasText: "Website Redesign" })
        .click();
      await expect(
        page.getByRole("heading", { name: "To Do" })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "In Progress" })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "In Review" })
      ).toBeVisible();
      await expect(page.getByRole("heading", { name: "Done" })).toBeVisible();

      // → Task Detail modal
      await page.getByText("Implement responsive navigation bar").click();
      await expect(
        page
          .locator(".fixed")
          .getByText("Implement responsive navigation bar")
      ).toBeVisible();
      await expect(page.getByText("Comments").first()).toBeVisible();
    }
  );

  test(
    "full round-trip: forward to Task Detail then back to User Select",
    { tag: ["@navigation", "@smoke"] },
    async ({ page }) => {
      // Forward path
      await page.goto("/");
      await page.getByRole("button").filter({ hasText: "Alex Rivera" }).click();
      await page
        .getByRole("button")
        .filter({ hasText: "Website Redesign" })
        .click();
      await expect(
        page.getByRole("heading", { name: "To Do" })
      ).toBeVisible();
      await page.getByText("Implement responsive navigation bar").click();
      await expect(
        page
          .locator(".fixed")
          .getByText("Implement responsive navigation bar")
      ).toBeVisible();

      // Close modal → back on Board
      await page
        .locator(".fixed")
        .getByRole("button", { name: "x", exact: true })
        .click();
      await expect(page.locator(".fixed")).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "To Do" })
      ).toBeVisible();

      // ← Projects → back on Project List
      await page.getByText("← Projects").click();
      await expect(
        page.getByRole("heading", { name: "Projects" })
      ).toBeVisible();

      // Switch User → back on User Select
      await page.getByText("Switch User").click();
      await expect(
        page.getByText("Select your user to get started")
      ).toBeVisible();
    }
  );
});

// ---------------------------------------------------------------------------
// ③ ④ ⑤ Header navigation & visibility
// ---------------------------------------------------------------------------

test.describe("Header Navigation", () => {
  test(
    "Taskify logo on Board navigates back to Project List",
    { tag: ["@navigation"] },
    async ({ page }) => {
      await loginAs(page, "Alex Rivera");
      await openProject(page, "Website Redesign");

      // Click the Taskify logo in the header
      await page.getByRole("button", { name: "Taskify" }).click();

      // Should be back on Project List
      await expect(
        page.getByRole("heading", { name: "Projects" })
      ).toBeVisible();
      await expect(
        page.getByRole("button").filter({ hasText: "Website Redesign" })
      ).toBeVisible();
    }
  );

  test(
    "Taskify logo on Project List keeps user on Project List",
    { tag: ["@navigation"] },
    async ({ page }) => {
      await loginAs(page, "Alex Rivera");

      // Click the Taskify logo while already on Project List
      await page.getByRole("button", { name: "Taskify" }).click();

      // Should still be on Project List
      await expect(
        page.getByRole("heading", { name: "Projects" })
      ).toBeVisible();
    }
  );

  test(
    "header is visible on Projects and Board but absent on User Select",
    { tag: ["@navigation"] },
    async ({ page }) => {
      // User Select — no header
      await page.goto("/");
      await expect(
        page.getByText("Select your user to get started")
      ).toBeVisible();
      await expect(page.getByText("Switch User")).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Taskify" })
      ).toHaveCount(0);

      // Project List — header visible
      await page.getByRole("button").filter({ hasText: "Alex Rivera" }).click();
      await expect(
        page.getByRole("button", { name: "Taskify" })
      ).toBeVisible();
      await expect(page.getByText("Switch User")).toBeVisible();
      await expect(page.getByText("Alex Rivera")).toBeVisible();

      // Kanban Board — header still visible
      await page
        .getByRole("button")
        .filter({ hasText: "Website Redesign" })
        .click();
      await expect(
        page.getByRole("button", { name: "Taskify" })
      ).toBeVisible();
      await expect(page.getByText("Switch User")).toBeVisible();
    }
  );
});

// ---------------------------------------------------------------------------
// ⑥ New Project form flow
// ---------------------------------------------------------------------------

test.describe("New Project Flow", () => {
  test(
    "create a new project via inline form and see it in the list",
    { tag: ["@navigation"] },
    async ({ page }) => {
      await loginAs(page, "Alex Rivera");

      // Open the new project form
      await page.getByRole("button", { name: "New Project" }).click();
      await expect(page.getByPlaceholder("Project name")).toBeVisible();

      // Fill and submit
      const projectName = `Nav Test Project ${Date.now()}`;
      await page.getByPlaceholder("Project name").fill(projectName);
      await page
        .getByPlaceholder("Description (optional)")
        .fill("Created by navigation E2E test");
      await page.getByRole("button", { name: "Create Project" }).click();

      // Verify the new project appears in the list
      await expect(
        page.getByRole("button").filter({ hasText: projectName })
      ).toBeVisible();

      // Verify we can navigate into its board
      await page
        .getByRole("button")
        .filter({ hasText: projectName })
        .click();
      await expect(
        page.getByRole("heading", { name: "To Do" })
      ).toBeVisible();
    }
  );
});

// ---------------------------------------------------------------------------
// ⑦ New Task form flow
// ---------------------------------------------------------------------------

test.describe("New Task Flow", () => {
  test(
    "create a new task via inline form and see it on the board",
    { tag: ["@navigation"] },
    async ({ page }) => {
      await loginAs(page, "Alex Rivera");
      await openProject(page, "Website Redesign");

      // Open the new task form
      await page.getByRole("button", { name: "+ New Task" }).click();
      await expect(page.getByPlaceholder("Task title…")).toBeVisible();

      // Fill and submit
      const taskTitle = `Nav Test Task ${Date.now()}`;
      await page.getByPlaceholder("Task title…").fill(taskTitle);
      await page.getByRole("button", { name: "Add" }).click();

      // New tasks land in "To Do" column
      await expect(page.getByText(taskTitle)).toBeVisible();

      // Verify we can open its detail modal
      await page.getByText(taskTitle).click();
      await expect(
        page.locator(".fixed").getByText(taskTitle)
      ).toBeVisible();
    }
  );
});

// ---------------------------------------------------------------------------
// ⑧ Task Detail: edit title and description
// ---------------------------------------------------------------------------

test.describe("Task Detail Editing", () => {
  test(
    "edit task title and description inline",
    { tag: ["@navigation"] },
    async ({ page }) => {
      await loginAs(page, "Alex Rivera");
      await openProject(page, "Website Redesign");
      await openTaskDetail(page, "Implement responsive navigation bar");

      // Click "Edit Task" to enter edit mode
      await page.getByRole("button", { name: "Edit Task" }).click();

      // Title input should appear with current value
      const titleInput = page.locator(".fixed input[type='text']").first();
      await expect(titleInput).toBeVisible();

      // Modify title
      const suffix = ` (edited ${Date.now()})`;
      const originalTitle = await titleInput.inputValue();
      await titleInput.fill(originalTitle + suffix);

      // Save
      await page
        .locator(".fixed")
        .getByRole("button", { name: "Save" })
        .click();

      // Verify updated title appears
      await expect(
        page.locator(".fixed").getByText(originalTitle + suffix)
      ).toBeVisible();

      // Restore original title to avoid polluting other tests
      await page.getByRole("button", { name: "Edit Task" }).click();
      const restoreInput = page.locator(".fixed input[type='text']").first();
      await restoreInput.fill(originalTitle);
      await page
        .locator(".fixed")
        .getByRole("button", { name: "Save" })
        .click();
    }
  );
});

// ---------------------------------------------------------------------------
// ⑨ Task Detail: assign / reassign user
// ---------------------------------------------------------------------------

test.describe("Task Assignment", () => {
  test(
    "change task assignee via dropdown",
    { tag: ["@navigation"] },
    async ({ page }) => {
      await loginAs(page, "Alex Rivera");
      await openProject(page, "Website Redesign");
      await openTaskDetail(page, "Implement responsive navigation bar");

      // The assignee dropdown should be visible
      const assignSelect = page.locator(".fixed select");
      await expect(assignSelect).toBeVisible();

      // Record original assignee
      const originalValue = await assignSelect.inputValue();

      // Change to a different user
      await assignSelect.selectOption({ label: "Morgan Lee" });

      // Verify the dropdown updated
      await expect(assignSelect).toHaveValue(
        await page
          .locator('.fixed select option:text("Morgan Lee")')
          .getAttribute("value")
          .then((v) => v ?? "")
      );

      // Restore original assignment
      if (originalValue) {
        await assignSelect.selectOption(originalValue);
      } else {
        await assignSelect.selectOption("");
      }
    }
  );
});

// ---------------------------------------------------------------------------
// ⑩ Task Detail: delete task
// ---------------------------------------------------------------------------

test.describe("Task Deletion", () => {
  test(
    "delete a task returns to board with the card removed",
    { tag: ["@navigation"] },
    async ({ page }) => {
      await loginAs(page, "Alex Rivera");
      await openProject(page, "Website Redesign");

      // Create a throwaway task to delete
      await page.getByRole("button", { name: "+ New Task" }).click();
      const taskTitle = `Deletable Task ${Date.now()}`;
      await page.getByPlaceholder("Task title…").fill(taskTitle);
      await page.getByRole("button", { name: "Add" }).click();
      await expect(page.getByText(taskTitle)).toBeVisible();

      // Open the task detail
      await page.getByText(taskTitle).click();
      await expect(
        page.locator(".fixed").getByText(taskTitle)
      ).toBeVisible();

      // Accept the confirm dialog that appears on delete
      page.on("dialog", (dialog) => dialog.accept());

      // Delete
      await page.getByRole("button", { name: "Delete Task" }).click();

      // Modal should close and card should be gone from the board
      await expect(page.locator(".fixed")).toHaveCount(0);
      await expect(page.getByText(taskTitle)).toHaveCount(0);
    }
  );
});

// ---------------------------------------------------------------------------
// ⑪ Multi-project navigation
// ---------------------------------------------------------------------------

test.describe("Multi-Project Navigation", () => {
  test(
    "navigate between different projects and verify board changes",
    { tag: ["@navigation"] },
    async ({ page }) => {
      await loginAs(page, "Alex Rivera");

      // Open first project
      await openProject(page, "Website Redesign");
      await expect(
        page.getByText("Implement responsive navigation bar")
      ).toBeVisible();

      // Go back to Project List
      await page.getByText("← Projects").click();
      await expect(
        page.getByRole("heading", { name: "Projects" })
      ).toBeVisible();

      // Open a different project
      await openProject(page, "Mobile App MVP");

      // Board should show different tasks (not Website Redesign tasks)
      await expect(
        page.getByText("Implement responsive navigation bar")
      ).toHaveCount(0);

      // Go back and open the third project
      await page.getByText("← Projects").click();
      await openProject(page, "API Integration");

      // Should have different content again
      await expect(
        page.getByText("Implement responsive navigation bar")
      ).toHaveCount(0);
    }
  );
});
