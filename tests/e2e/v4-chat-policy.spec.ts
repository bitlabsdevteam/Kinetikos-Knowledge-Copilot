import { expect, test } from '@playwright/test';

test('v4: IME composition prevents accidental submit on Enter and requires Ctrl+Enter', async ({ page }) => {
  let chatCalls = 0;

  await page.route('**/api/chat', async (route) => {
    chatCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        answer: 'ok',
        citations: [],
        grounded: true,
        suggestedQuestions: ['next one'],
        backend: 'dify',
      }),
    });
  });

  await page.goto('/app?dev_auth_bypass=1');

  const textbox = page.getByRole('textbox');
  await textbox.fill('たんぱく質');

  await textbox.dispatchEvent('compositionstart');
  await textbox.press('Enter');
  expect(chatCalls).toBe(0);

  await textbox.dispatchEvent('compositionend');
  await textbox.press('Enter');
  expect(chatCalls).toBe(0);

  await textbox.focus();
  await page.keyboard.press('Control+Enter');
  await expect.poll(() => chatCalls).toBe(1);

  await page.screenshot({ path: 'tests/screenshots/task9-step1-ime-safe-enter.png', fullPage: true });
});

test('v4: citation card uses direct trusted URL when present', async ({ page }) => {
  await page.route('**/api/chat', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        answer: 'Citation test answer',
        citations: [
          {
            id: 'c1',
            title: 'Trusted Source',
            sourceType: 'manual',
            href: 'https://example.com/trusted-source',
            excerpt: 'Evidence excerpt',
          },
        ],
        grounded: true,
        suggestedQuestions: ['What is next?'],
        backend: 'dify',
      }),
    });
  });

  await page.goto('/app?dev_auth_bypass=1');
  await page.getByRole('textbox').fill('Show me source links');
  await page.getByRole('button', { name: 'Send message' }).click();

  const citationLink = page.locator('a.citation-card').first();
  await expect(citationLink).toBeVisible();
  await expect(citationLink).toHaveAttribute('href', 'https://example.com/trusted-source');
  await page.screenshot({ path: 'tests/screenshots/task9-step2-citation-direct-link.png', fullPage: true });
});

test('v4: backend policy denies request without required permission', async ({ request }) => {
  const response = await request.post('/api/chat', {
    data: {
      message: 'Policy check',
      history: [],
      accessContext: {
        memberLevel: 'basic',
        permissions: [],
        usageCountToday: 0,
      },
    },
  });

  expect(response.status()).toBe(403);
  const payload = await response.json();
  expect(payload.code).toBe('policy_denied');
});
