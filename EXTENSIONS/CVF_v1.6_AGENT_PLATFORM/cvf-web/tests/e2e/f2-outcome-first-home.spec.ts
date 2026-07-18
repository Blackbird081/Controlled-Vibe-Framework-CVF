import { expect, test } from '@playwright/test';
import { login, seedStorage } from './utils';

test.beforeEach(async ({ page }) => {
  await seedStorage(page);
});

test('F2 home surfaces outcomes before template browsing', async ({ page }) => {
  await login(page);
  await page.evaluate(() => localStorage.setItem('cvf_language', 'en'));
  await page.goto('/home');

  const outcomePanel = page.getByTestId('outcome-quick-actions');
  await expect(page.getByRole('heading', { name: 'Outcomes' }).first()).toBeVisible();
  await expect(outcomePanel).toBeVisible();

  const outcomeBox = await outcomePanel.boundingBox();
  const templateBox = await page.locator('#tour-template-grid').boundingBox();
  expect(outcomeBox).not.toBeNull();
  expect(templateBox).not.toBeNull();
  expect(outcomeBox!.y).toBeLessThan(templateBox!.y);

  for (const name of [
    'Create PRD',
    'Generate SOP',
    'Review Contract',
    'Build Landing Page',
    'Summarize Meeting',
    'Create Proposal',
  ]) {
    await expect(page.getByRole('button', { name })).toBeVisible();
  }

  await expect(outcomePanel.getByText('Pack export').first()).toBeVisible();
  await expect(outcomePanel.getByText('Receipt').first()).toBeVisible();
});

test('F2 outcome journey opens an existing workflow form', async ({ page }) => {
  await login(page);
  await page.evaluate(() => localStorage.setItem('cvf_language', 'en'));
  await page.goto('/home');

  await page.getByRole('button', { name: 'Create Proposal' }).click();

  await expect(page.getByRole('heading', { name: /Mẫu Email|Email Template|Proposal/i })).toBeVisible();
  await expect(page.getByText(/Describe the outcome|mô tả kết quả mong muốn/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Export Spec/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Create Agent Spec/i })).toBeVisible();
});
