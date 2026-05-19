import { test, expect } from "./base";

test.describe("Task Priority", () => {
  test(
    "create task with selected priority and show it on card",
    { tag: ["@priority"] },
    async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button").filter({ hasText: "Alex Rivera" }).click();
      await page.getByRole("button").filter({ hasText: "Website Redesign" }).click();

      await page.getByRole("button", { name: "New Task" }).click();
      const taskTitle = `Priority Task ${Date.now()}`;
      await page.getByPlaceholder("Task title...").fill(taskTitle);
      await page.getByLabel("Task priority").selectOption("High");
      await page.getByRole("button", { name: "Add Task" }).click();

      const createdCard = page
        .locator("div.bg-white.rounded-lg.shadow-sm.border.p-3.mb-2")
        .filter({ hasText: taskTitle });
      await expect(createdCard).toBeVisible();
      await expect(createdCard).toContainText("High");
    }
  );
});
