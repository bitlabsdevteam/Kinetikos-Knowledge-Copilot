import { expect, test } from '@playwright/test';

test('v5: history list and reopen session hydrates messages', async ({ page }) => {
  await page.route('**/api/history?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        conversations: [
          {
            sessionId: 'sess-1',
            latestAt: new Date().toISOString(),
            preview: 'Follow-up about glucose monitoring',
          },
        ],
      }),
    });
  });

  await page.route('**/api/history/sess-1?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessionId: 'sess-1',
        difyConversationId: 'dify-1',
        messages: [
          { role: 'user', text: 'What about glucose spikes?' },
          { role: 'assistant', text: 'Check meal timing and fiber.' },
        ],
      }),
    });
  });

  await page.goto('/app?dev_auth_bypass=1');
  await page.getByRole('button', { name: 'Follow-up about glucose monitoring' }).click();

  await expect(page.getByText('What about glucose spikes?', { exact: true })).toBeVisible();
  await expect(page.getByText('Check meal timing and fiber.', { exact: true }).first()).toBeVisible();
});

test('v5: citation visibility toggles and blocked citations hidden by default', async ({ page }) => {
  await page.route('**/api/chat', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        answer: 'Here are your sources',
        grounded: true,
        backend: 'dify',
        citations: [
          {
            id: 'c1',
            title: 'Public Source',
            sourceType: 'manual',
            href: 'https://example.com/source',
            excerpt: 'Trusted excerpt',
            citable: true,
            domain: 'example.com',
          },
          {
            id: 'c2',
            title: 'Internal Doc',
            sourceType: 'manual',
            href: '#',
            excerpt: 'Internal excerpt',
            citable: false,
          },
        ],
      }),
    });
  });

  await page.goto('/app?dev_auth_bypass=1');
  await page.getByRole('textbox').fill('Show source links');
  await page.keyboard.press('Control+Enter');

  await expect(page.locator('a.citation-card').first()).toHaveAttribute('href', 'https://example.com/source');
  await expect(page.getByText('Internal Doc')).toHaveCount(0);

  await page.locator('.toggle-row', { hasText: 'Show blocked/internal citations' }).getByRole('button').click();
  await expect(page.getByText('Internal Doc')).toBeVisible();

  await page.locator('.toggle-row', { hasText: 'Show citations' }).getByRole('button').click();
  await expect(page.locator('.citation-list')).toHaveCount(0);
});
