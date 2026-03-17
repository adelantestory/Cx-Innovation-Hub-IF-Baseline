// =============================================================================
// E2E: Card Highlight — current user's cards have distinct styling
// =============================================================================
// Requirement: "You will see any cards that are assigned to you, the currently
// logged in user, in a different color from all the other ones, so you can
// quickly see yours."
//
// Design tokens from Board.tsx stub:
//   --card-mine-bg:     #EFF6FF  (assigned to currentUser)
//   --card-mine-border: #BFDBFE
//   --card-bg:          #FFFFFF  (other users' cards)
// =============================================================================

import { test, expect } from './base';

test.describe('Card Highlight', () => {
  test('cards assigned to the current user have a distinct background color', { tag: ['@prod-safe'] }, async ({ page }) => {
    // Requirement: "cards assigned to you...in a different color from all the
    // other ones, so you can quickly see yours"

    // Log in as Alex Rivera — seed data assigns "Implement responsive
    // navigation bar" to Alex in the Website Redesign project
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Website Redesign').first().click();
    await expect(page.locator('[data-rfd-droppable-id="todo"]')).toBeVisible();

    // Alex's card (assigned to current user)
    const myCard = page.getByText('Implement responsive navigation bar').first().locator('..');
    const myBg = await myCard.evaluate((el) => getComputedStyle(el).backgroundColor);

    // Another user's card (Jordan Kim's)
    const otherCard = page.getByText('Design new homepage layout').first().locator('..');
    const otherBg = await otherCard.evaluate((el) => getComputedStyle(el).backgroundColor);

    // The backgrounds must differ
    expect(myBg).not.toEqual(otherBg);
  });

  test('card highlight updates when switching users', { tag: ['@prod-safe'] }, async ({ page }) => {
    // Requirement: styling is based on "the currently logged in user"

    // Log in as Jordan Kim — "Design new homepage layout" is assigned to Jordan
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Jordan Kim' }).click();
    await page.getByText('Website Redesign').first().click();
    await expect(page.locator('[data-rfd-droppable-id="todo"]')).toBeVisible();

    // Jordan's card should be highlighted
    const jordanCard = page.getByText('Design new homepage layout').first().locator('..');
    const jordanBg = await jordanCard.evaluate((el) => getComputedStyle(el).backgroundColor);

    // Alex's card should NOT be highlighted (different user)
    const alexCard = page.getByText('Implement responsive navigation bar').first().locator('..');
    const alexBg = await alexCard.evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(jordanBg).not.toEqual(alexBg);
  });

  test('unassigned cards use the default (non-highlighted) style', { tag: ['@smoke','@prod-safe'] }, async ({ page }) => {
    // Mobile App MVP has an unassigned task: "Create onboarding flow"
    await page.goto('/');
    await page.getByRole('button').filter({ hasText: 'Alex Rivera' }).click();
    await page.getByText('Mobile App MVP').click();
    await expect(page.locator('[data-rfd-droppable-id="todo"]')).toBeVisible();

    const unassignedCard = page.getByText('Create onboarding flow').locator('..');
    const unassignedBg = await unassignedCard.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );

    // Unassigned cards should NOT have the highlight color (#EFF6FF → rgb(239, 246, 255))
    expect(unassignedBg).not.toBe('rgb(239, 246, 255)');
  });
});
