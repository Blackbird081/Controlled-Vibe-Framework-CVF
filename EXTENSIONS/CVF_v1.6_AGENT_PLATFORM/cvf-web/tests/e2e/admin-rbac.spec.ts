import { expect, test } from '@playwright/test';

import { login, loginAs, seedStorage } from './utils';

test.beforeEach(async ({ page }) => {
  await seedStorage(page);
});

test('admin can open the enterprise control plane', async ({ page }) => {
  await login(page);
  await page.goto('/admin/finops');

  await expect(
    page.getByRole('heading', { name: /FinOps Dashboard|Chi phí & ngân sách/i })
  ).toBeVisible({ timeout: 20_000 });
});

test('developer is redirected away from /admin routes', async ({ page }) => {
  await loginAs(page, 'dev', 'dev123');
  await page.goto('/admin/team');

  await page.waitForURL(url => !url.pathname.startsWith('/admin'), { timeout: 10000 });
  await expect(page).not.toHaveURL(/\/admin\/team$/);
});
