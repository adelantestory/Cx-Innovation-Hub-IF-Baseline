// =============================================================================
// E2E: Card Highlight — Current User's Cards Have Distinct Styling
// =============================================================================
// Requirement (Taskify Product Description):
//   "You will see any cards that are assigned to you, the currently logged
//    in user, in a different color from all the other ones, so you can
//    quickly see yours."
//
// ⚠️  NOTE: As of seed data, the Card component does NOT yet pass
//     `currentUser` down to apply distinct styling. This test validates
//     the spec requirement; it will fail until the feature is implemented
//     in Card.tsx (e.g., adding a data-own="true" attribute or a
//     "ring-blue-400" CSS class for cards assigned to the logged-in user).
// =============================================================================

import { test, expect } from '@playwright/test';

async function navigateToBoard(
  page: import('@playwright/test').Page,
  userName: string
) {
  await page.goto('/');
  await page.getByText(userName).click();
  await page.getByText('Website Redesign').click();
  await expect(page.getByText('To Do')).toBeVisible();
}

test.describe('Card Highlight — Current User', () => {
  test('cards assigned to the current user have visually distinct styling', async ({
    page,
  }) => {
    // Spec: "cards assigned to you…in a different color from all the other ones"
    //
    // Seed data for "Website Redesign":
    //   "Design new homepage layout"         → assigned to Jordan Kim
    //   "Implement responsive navigation bar" → assigned to Alex Rivera
    //   "Refactor CSS to Tailwind"            → assigned to Morgan Lee
    //   "Set up CI/CD pipeline"               → assigned to Taylor Patel
    //
    // Log in as Alex Rivera — "Implement responsive navigation bar" should
    // have distinct styling vs. the other three cards.

    await navigateToBoard(page, 'Alex Rivera');

    // Find Alex's card (in the "In Progress" column)
    // Use [data-rfd-draggable-id] to target the card element specifically
    const ownCard = page
      .locator('[data-rfd-droppable-id="in_progress"]')
      .locator('[data-rfd-draggable-id]')
      .filter({ hasText: 'Implement responsive navigation bar' });

    // Find another user's card (Jordan's in "To Do")
    const otherCard = page
      .locator('[data-rfd-droppable-id="todo"]')
      .locator('[data-rfd-draggable-id]')
      .filter({ hasText: 'Design new homepage layout' });

    // The implementation should differentiate own cards.
    // Strategy 1: data-own attribute
    //   <div data-own="true" …>
    // Strategy 2: extra CSS class (e.g., ring-2, border-blue-400)
    //
    // We test BOTH common approaches so one will pass once implemented.

    const ownHasAttribute = await ownCard.getAttribute('data-own');
    const otherHasAttribute = await otherCard.getAttribute('data-own');

    const ownClasses = (await ownCard.getAttribute('class')) || '';
    const otherClasses = (await otherCard.getAttribute('class')) || '';

    // Approach 1: data-own attribute
    const usesDataOwn =
      ownHasAttribute === 'true' && otherHasAttribute !== 'true';

    // Approach 2: different CSS class (common highlight patterns)
    const highlightPatterns = [
      /ring/,
      /border-blue/,
      /border-indigo/,
      /bg-blue/,
      /bg-indigo/,
      /highlight/,
      /own-card/,
    ];
    const ownHasHighlight = highlightPatterns.some((p) => p.test(ownClasses));
    const otherHasHighlight = highlightPatterns.some((p) =>
      p.test(otherClasses)
    );
    const usesClassHighlight = ownHasHighlight && !otherHasHighlight;

    // At least one approach must be implemented
    expect(
      usesDataOwn || usesClassHighlight,
      'Expected the current user\'s card to have distinct styling ' +
        '(data-own="true" or a highlight CSS class) compared to other cards. ' +
        'See Card.tsx — the currentUser must be passed down and used to ' +
        'differentiate assigned cards.'
    ).toBeTruthy();
  });

  test('switching users changes which cards are highlighted', async ({
    page,
  }) => {
    // Spec: "assigned to you, the currently logged in user, in a different
    //        color from all the other ones"
    //
    // Log in as Alex Rivera → his card highlighted.
    // Switch to Jordan Kim → Jordan's card highlighted, Alex's is NOT.

    // --- Alex Rivera ---
    await navigateToBoard(page, 'Alex Rivera');

    const alexCard = page
      .locator('[data-rfd-droppable-id="in_progress"]')
      .locator('[data-rfd-draggable-id]')
      .filter({ hasText: 'Implement responsive navigation bar' });

    // Alex's card should have highlight
    const alexClasses1 = (await alexCard.getAttribute('class')) || '';
    const alexData1 = await alexCard.getAttribute('data-own');
    const alexHighlighted =
      alexData1 === 'true' ||
      /ring|border-blue|border-indigo|highlight|own-card/.test(alexClasses1);
    expect(alexHighlighted, "Alex's card should be highlighted when logged in as Alex").toBeTruthy();

    // --- Switch to Jordan Kim ---
    // Go back, switch user
    await page.getByText('Switch User').click();
    await page.getByText('Jordan Kim').click();
    await page.getByText('Website Redesign').click();
    await expect(page.getByText('To Do')).toBeVisible();

    // Jordan's card (in To Do) should now be highlighted
    const jordanCard = page
      .locator('[data-rfd-droppable-id="todo"]')
      .locator('[data-rfd-draggable-id]')
      .filter({ hasText: 'Design new homepage layout' });

    const jordanClasses = (await jordanCard.getAttribute('class')) || '';
    const jordanData = await jordanCard.getAttribute('data-own');
    const jordanHighlighted =
      jordanData === 'true' ||
      /ring|border-blue|border-indigo|highlight|own-card/.test(jordanClasses);
    expect(jordanHighlighted, "Jordan's card should be highlighted when logged in as Jordan").toBeTruthy();

    // Alex's card should NOT be highlighted when Jordan is logged in
    const alexCard2 = page
      .locator('[data-rfd-droppable-id="in_progress"]')
      .locator('[data-rfd-draggable-id]')
      .filter({ hasText: 'Implement responsive navigation bar' });
    const alexClasses2 = (await alexCard2.getAttribute('class')) || '';
    const alexData2 = await alexCard2.getAttribute('data-own');
    const alexStillHighlighted =
      alexData2 === 'true' ||
      /ring|border-blue|border-indigo|highlight|own-card/.test(alexClasses2);
    expect(alexStillHighlighted, "Alex's card should NOT be highlighted when Jordan is logged in").toBeFalsy();
  });
});
