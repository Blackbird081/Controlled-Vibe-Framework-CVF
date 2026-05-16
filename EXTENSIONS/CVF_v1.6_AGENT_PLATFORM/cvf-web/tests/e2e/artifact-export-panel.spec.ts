import { expect, test } from '@playwright/test';
import { login, seedStorage } from './utils';

test.beforeEach(async ({ page }) => {
  await seedStorage(page);
});

test('Artifacts page creates an English HTML review packet without provider calls', async ({ page }) => {
  await page.route('**/api/artifacts/export', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          html: '<!doctype html><html lang="en"><body><main><h1>Customer Insight Review</h1></main></body></html>',
          filename: 'customer-insight-review.html',
          receiptAnchor: 'receipt-customer-insight',
          generatedAt: '2026-05-16T10:00:00.000Z',
          verification: [
            { label: 'Source reference recorded', passed: true, detail: 'docs/reviews/customer-insight.md' },
            { label: 'Review boundary visible', passed: true, detail: 'HTML review packet only.' },
          ],
        },
      }),
    });
  });

  await login(page);
  await page.evaluate(() => localStorage.setItem('cvf_language', 'en'));
  await page.goto('/artifacts');

  await expect(page.getByRole('heading', { name: /Turn approved work into an HTML review packet/i })).toBeVisible();
  await expect(page.getByText('Bring knowledge into the review')).toBeVisible();
  await expect(page.getByText('Keep the receipt visible')).toBeVisible();
  await expect(page.getByText('Hand off with less guessing')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Review Packet Export' })).toBeVisible();

  await page.getByLabel('Title').fill('Customer Insight Review');
  await page.getByRole('button', { name: /Build HTML/i }).click();

  await expect(page.getByText('#receipt-customer-insight')).toBeVisible();
  await expect(page.getByText('Source reference recorded')).toBeVisible();
  await expect(page.getByTitle('Preview')).toBeVisible();

  const artifactText = await page.getByTestId('artifact-export-panel').textContent();
  expect(artifactText).toContain('Review Packet Export');
});

test('Artifacts page follows the Vietnamese language setting', async ({ page }) => {
  await login(page);
  await page.goto('/artifacts');

  await expect(page.getByRole('heading', { name: /Biến phần đã duyệt thành gói HTML để rà soát/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Xuất gói rà soát' })).toBeVisible();
  await expect(page.getByLabel('Tiêu đề')).toBeVisible();
});
