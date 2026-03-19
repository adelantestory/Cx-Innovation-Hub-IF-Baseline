// =============================================================================
// E2E: Project List — 3 sample projects available for selection
// =============================================================================
// Requirement: "There will be three sample projects available for the user to
// pick from."
// =============================================================================

import { test, expect } from './base';

const EXPECTED_PROJECTS = [
  {
    name: 'Website Redesign',
    description: 'Modernize the company website with a fresh design and improved UX',
  },
  {
    name: 'Mobile App MVP',
    description: 'Build the minimum viable product for the mobile application',
  },
  {
    name: 'API Integration',
    description: 'Integrate third-party APIs for payment processing and notifications',
  },
];

test.describe('Project List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
  });

  test('project list displays exactly 3 sample projects', { tag: ['@smoke', '@qa', '@uat', '@prod-safe'] }, async ({ page }) => {
    // Requirement: "three sample projects available for the user to pick from"
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();

    for (const project of EXPECTED_PROJECTS) {
      await expect(page.getByRole('button').filter({ hasText: project.name })).toBeVisible();
    }

    // Verify exactly 3 project cards (buttons inside the grid)
    const projectCards = page.locator('.grid button');
    await expect(projectCards).toHaveCount(3);
  });

  test('each project card shows name and description', { tag: ['@qa', '@uat', '@prod-safe'] }, async ({ page }) => {
    for (const project of EXPECTED_PROJECTS) {
      const card = page.getByRole('button').filter({ hasText: project.name });
      await expect(card).toBeVisible();
      await expect(card.getByText(project.description)).toBeVisible();
    }
  });

  test('clicking a project navigates to its Kanban board', { tag: ['@qa', '@uat', '@prod-safe'] }, async ({ page }) => {
    await page.getByRole('button').filter({ hasText: 'Website Redesign' }).click();

    // Should see Kanban columns
    await expect(page.getByRole('heading', { name: 'To Do' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'In Progress' })).toBeVisible();

    // Back button should return to project list
    await expect(page.getByText('← Projects')).toBeVisible();
  });
});
