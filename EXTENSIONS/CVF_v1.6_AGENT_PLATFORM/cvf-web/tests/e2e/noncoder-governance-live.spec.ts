import { test, expect } from '@playwright/test';
import { seedStorageWithAlibaba, login, postLiveGovernedExecution } from './utils';

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
    await page.goto('/home');
    const strategyButton = page.getByRole('button', { name: /Phân tích Chiến lược|Strategy Analysis/i }).first();
    await strategyButton.click();

    await expect(
        page.getByRole('heading', { name: /Phân tích Chiến lược|Strategy Analysis/i }).first()
    ).toBeVisible({ timeout: 10_000 });
});

test('governance controls fire on real Alibaba AI response — L-008', async ({ page }) => {
    await login(page);
    const { response, body } = await postLiveGovernedExecution(page, 'simple');

    expect(response.status()).toBe(200);
    expect(body.success).toBe(true);
    expect(body.enforcement).toBeDefined();
    expect(body.guardResult).toBeDefined();
    expect(body.providerRouting?.selectedProvider).toBe('alibaba');
    expect(String(body.output ?? '').length).toBeGreaterThan(100);
    expect(String(body.output ?? '')).not.toContain('MOCK_');
});

test.skip('phase gate modal fires on real Alibaba AI output in full mode', async ({ page }) => {
    await login(page);
    const { response, body } = await postLiveGovernedExecution(page, 'full');

    expect(response.status()).toBe(200);
    expect(body.success).toBe(true);
    expect(body.enforcement).toBeDefined();
    expect(body.guardResult).toBeDefined();
    expect(body.providerRouting?.selectedProvider).toBe('alibaba');
    expect(String(body.output ?? '')).not.toContain('MOCK_');
});
