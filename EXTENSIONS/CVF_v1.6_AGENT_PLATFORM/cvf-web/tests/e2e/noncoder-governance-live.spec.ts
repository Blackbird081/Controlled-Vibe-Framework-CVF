import { test, expect } from '@playwright/test';
import { seedStorageWithAlibaba, login, openStrategyAnalysis, sendSpecToAgent } from './utils';

// All tests in this spec use a real Alibaba (qwen-turbo) API call.
// Assert governance behavior — never assert exact AI response content.
// Provider: Alibaba, timeout per test: 30s (Tests 1-3 structural, no AI call)
// L-008 closure: Tests 4 and 5 prove CVF governs real AI on behalf of non-coders.

test.beforeEach(async ({ page }) => {
    await seedStorageWithAlibaba(page);
});

test('landing page renders CVF value props and non-coder CTA', async ({ page }) => {
    await page.goto('/landing');

    await expect(page.locator('h1').first()).toBeVisible();

    await expect(
        page.getByRole('link', { name: /Xem templates|View templates/i }).first()
    ).toBeVisible();

    await expect(
        page.getByRole('button', { name: /EN|VI/i }).first()
    ).toBeVisible();
});

test('template gallery shows governed templates for non-coder', async ({ page }) => {
    await login(page);
    await page.goto('/home');

    await expect(
        page.locator('[class*="template"], [data-template], .grid').first()
    ).toBeVisible({ timeout: 10_000 });

    const linkCount = await page.getByRole('button').count();
    expect(linkCount).toBeGreaterThan(0);
});

test('intake wizard advances after project details — no AI call required', async ({ page }) => {
    await login(page);
    await openStrategyAnalysis(page);

    await expect(
        page.getByRole('button', { name: /Gửi đến Agent|Send to Agent/i }).first()
    ).toBeVisible({ timeout: 10_000 });
});

test('governance controls fire on real Alibaba AI response — L-008', async ({ page }) => {
    await login(page);
    await openStrategyAnalysis(page);
    await sendSpecToAgent(page, 'governance');

    // Assert governance badge — proves governance mode is active
    await expect(
        page.locator('text=/Có Quy tắc|With Rules/').first()
    ).toBeVisible({ timeout: 30_000 });

    // Assert approval controls rendered — proves governance pipeline ran
    await expect(
        page.getByRole('button', { name: /Chấp nhận|Accept/i }).first()
    ).toBeVisible({ timeout: 30_000 });

    // Assert response is real, not a mock string
    const responseEl = page.locator('.prose').first();
    await expect(responseEl).toBeVisible({ timeout: 30_000 });
    const text = await responseEl.textContent();
    expect(text?.length).toBeGreaterThan(50);
    expect(text).not.toContain('MOCK_');
});

test('phase gate modal fires on real Alibaba AI output in full mode', async ({ page }) => {
    await login(page);
    await openStrategyAnalysis(page);
    await sendSpecToAgent(page, 'full');

    // Assert phase gate modal — proves CVF enforces phase control on real AI output
    await expect(
        page.getByRole('heading', { name: /Phase 1: Tiếp nhận|Phase 1: Intake/i })
    ).toBeVisible({ timeout: 30_000 });

    await expect(
        page.getByRole('button', { name: /Duyệt → DESIGN|Approve/i })
    ).toBeVisible({ timeout: 5_000 });
});
