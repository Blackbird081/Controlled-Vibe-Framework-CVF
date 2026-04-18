import { test, expect } from '@playwright/test';
import { seedStorage, login, openStrategyAnalysis, sendSpecToAgent } from './utils';

test.beforeEach(async ({ page }) => {
    await seedStorage(page);
    await login(page);
});

test('Simple mode flow renders response without acceptance controls', async ({ page }) => {
    await openStrategyAnalysis(page);
    await sendSpecToAgent(page, 'simple');

    await expect(page.getByText('MOCK_SIMPLE_RESPONSE')).toBeVisible();
    await expect(page.getByText('Có Quy tắc')).toHaveCount(0);
    await expect(page.getByText('CVF Full Mode')).toHaveCount(0);
    await expect(page.getByText('Chấp nhận')).toHaveCount(0);
});

test('Governance mode flow shows accept/retry/reject controls', async ({ page }) => {
    await openStrategyAnalysis(page);
    await sendSpecToAgent(page, 'governance');

    await expect(page.getByText('MOCK_GOVERNANCE_RESPONSE')).toBeVisible();
    await expect(page.getByText('⚠️ Có Quy tắc', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Chấp nhận/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Thử lại/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Từ chối/i })).toBeVisible();
});

test('Full mode flow triggers phase gate modal', async ({ page }) => {
    await openStrategyAnalysis(page);
    await sendSpecToAgent(page, 'full');

    await expect(page.getByText('MOCK_FULL_RESPONSE')).toBeVisible();
    await expect(page.getByText('🚦 CVF Full Mode', { exact: true }).first()).toBeVisible();

    await expect(page.getByRole('heading', { name: /Phase 1: Tiếp nhận|Phase 1: Intake/i })).toBeVisible();
    await page.getByRole('button', { name: /Duyệt → DESIGN|Approve/i }).click();
    await expect(page.getByText(/Phase INTAKE approved|Phase Discovery approved/i)).toBeVisible();
});
