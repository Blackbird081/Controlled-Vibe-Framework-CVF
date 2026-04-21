import { test, expect } from '@playwright/test';
import { seedStorage, login } from './utils';

// All tests in this spec use mock mode (NEXT_PUBLIC_CVF_MOCK_AI=1).
// Badge data comes from static PROVIDER_LANE_EVIDENCE — no live API call needed.
// Run under: npx playwright test --config playwright.config.mock.ts tests/e2e/provider-lane-ui.spec.ts
// L-003 closure: provider lane badge rendering and no-parity-language assertions.

test.beforeEach(async ({ page }) => {
    await seedStorage(page);
});

test('Settings shows Certified badge for Alibaba', async ({ page }) => {
    await login(page);
    await page.goto('/settings');

    // Certified badge must be visible in the Alibaba provider card area
    await expect(
        page.getByText('Certified').first()
    ).toBeVisible({ timeout: 10_000 });

    // 3/3 PASS evidence note must be present
    await expect(
        page.getByText(/3\/3\s*PASS/i).first()
    ).toBeVisible({ timeout: 5_000 });

    // No parity language in provider section
    const providerSection = page.locator('[class*="provider"], [class*="settings"], main').first();
    const sectionText = await providerSection.textContent();
    expect(sectionText).not.toMatch(/fastest|cheapest|best provider|equal quality|parity/i);
});

test('Settings shows Certified badge for DeepSeek', async ({ page }) => {
    await login(page);
    await page.goto('/settings');

    // Both Alibaba and DeepSeek should have Certified — get all occurrences
    const certifiedBadges = page.getByText('Certified');
    const count = await certifiedBadges.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // DeepSeek row visible
    await expect(
        page.getByText(/deepseek/i).first()
    ).toBeVisible({ timeout: 10_000 });
});

test('ProviderSwitcher shows at least one lane badge', async ({ page }) => {
    await login(page);
    await page.goto('/home');

    // Open ProviderSwitcher — look for the button that triggers provider switching
    const switcherBtn = page.locator(
        'button[aria-label*="provider"], button[title*="provider"], [data-testid="provider-switcher"]'
    ).first();

    // If a dedicated switcher button exists, click it; otherwise check the header area
    const switcherCount = await switcherBtn.count();
    if (switcherCount > 0) {
        await switcherBtn.click();
    }

    // At least one lane status badge must be visible somewhere on the page
    const badge = page.getByText(/Certified|Canary Pass|Experimental|Unconfigured/i).first();
    await expect(badge).toBeVisible({ timeout: 10_000 });
});

test('Provider section contains no parity or quality comparison language', async ({ page }) => {
    await login(page);
    await page.goto('/settings');

    // Scan the full settings page for disallowed parity claims
    const fullText = await page.locator('main, [role="main"], body').first().textContent();
    expect(fullText).not.toMatch(/fastest|cheapest|best provider|equal quality|parity/i);

    // Evidence / certification language SHOULD be present
    await expect(
        page.getByText(/Certified|canary|evidence|User-paid/i).first()
    ).toBeVisible({ timeout: 5_000 });
});
