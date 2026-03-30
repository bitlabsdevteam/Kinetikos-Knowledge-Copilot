import { expect, test } from '@playwright/test';

test('v7: chat api accepts desiredLanguage=ja payload', async ({ request }) => {
  const response = await request.post('/api/chat', {
    data: {
      message: '日本語で答えてください',
      history: [],
      desiredLanguage: 'ja',
      accessContext: {
        source: 'web',
      },
    },
  });

  // In environments without Dify config this may return 503,
  // but it should not reject desiredLanguage as invalid.
  expect(response.status()).not.toBe(400);
});
