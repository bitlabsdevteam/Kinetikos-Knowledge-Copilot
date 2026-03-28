import { expect, test } from '@playwright/test';

test('v2: logout button is visible in authenticated workspace shell (dev bypass)', async ({ page }) => {
  await page.goto('/app?dev_auth_bypass=1');
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  await page.screenshot({ path: 'tests/screenshots/task7-step1-logout-visible.png', fullPage: true });
});

test('v2: theme selection persists across reload', async ({ page }) => {
  await page.goto('/app?dev_auth_bypass=1');

  await page.getByRole('button', { name: /Theme:/ }).click();
  await expect(page.getByRole('button', { name: 'Theme: Light' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: 'Theme: Light' })).toBeVisible();
  await page.screenshot({ path: 'tests/screenshots/task7-step2-theme-persist.png', fullPage: true });
});

test('v2: logout redirects to login', async ({ page }) => {
  await page.goto('/app?dev_auth_bypass=1');
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.waitForURL('**/login');
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  await page.screenshot({ path: 'tests/screenshots/task7-step3-logout-redirect.png', fullPage: true });
});
