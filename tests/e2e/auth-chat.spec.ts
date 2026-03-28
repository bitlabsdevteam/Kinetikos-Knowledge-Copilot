import { expect, test } from '@playwright/test';

test('unauthenticated /app access redirects to /login', async ({ page }) => {
  await page.goto('/app');
  await page.waitForURL('**/login');
  await page.screenshot({ path: 'tests/screenshots/task9-step1-redirect-login.png', fullPage: true });

  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
});

test('login page shows primary auth action', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  await page.screenshot({ path: 'tests/screenshots/task9-step2-login-page.png', fullPage: true });
});
