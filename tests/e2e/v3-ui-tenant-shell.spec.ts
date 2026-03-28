import { expect, test } from '@playwright/test';

test('v3: account controls render top-right in header', async ({ page }) => {
  await page.goto('/app?dev_auth_bypass=1');

  const logout = page.getByRole('button', { name: 'Logout' });
  await expect(logout).toBeVisible();

  const box = await logout.boundingBox();
  expect(box).not.toBeNull();

  const width = page.viewportSize()?.width ?? 1280;
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeGreaterThan(width * 0.75);

  await page.screenshot({ path: 'tests/screenshots/task7-step1-top-right-controls.png', fullPage: true });
});

test('v3: Try to ask section is visible after assistant response', async ({ page }) => {
  await page.route('**/api/chat', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        answer: 'Protein intake supports recovery and muscle maintenance.',
        citations: [],
        grounded: true,
        suggestedQuestions: ['How much protein per day?', 'Best post-workout meal?', 'Any contraindications?'],
        backend: 'dify',
      }),
    });
  });

  await page.goto('/app?dev_auth_bypass=1');
  await page.getByRole('textbox').fill('Tell me about protein for recovery');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByText('Try to ask').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'How much protein per day?' })).toBeVisible();
  await page.screenshot({ path: 'tests/screenshots/task7-step2-try-to-ask-visible.png', fullPage: true });
});
