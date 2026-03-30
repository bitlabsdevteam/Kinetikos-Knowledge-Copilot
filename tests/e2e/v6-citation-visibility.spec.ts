import { expect, test } from '@playwright/test';

test('v6: explains why citations are hidden when none are citable', async ({ page }) => {
  await page.route('**/api/chat', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        answer: 'Answer with internal-only evidence',
        grounded: true,
        backend: 'dify',
        citations: [
          {
            id: 'c-int',
            title: 'Internal SOP',
            sourceType: 'manual',
            href: '#',
            excerpt: 'Internal only',
            citable: false,
          },
        ],
      }),
    });
  });

  await page.goto('/app?dev_auth_bypass=1');
  await page.getByRole('textbox').fill('show citations');
  await page.keyboard.press('Control+Enter');

  await expect(page.getByText('No public citations shown (current setting hides internal/non-citable sources).')).toBeVisible();

  await page.locator('.toggle-row', { hasText: 'Show blocked/internal citations' }).getByRole('button').click();
  await expect(page.getByText('Internal SOP')).toBeVisible();
});
