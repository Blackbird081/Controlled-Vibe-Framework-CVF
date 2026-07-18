import { expect, test } from '@playwright/test';

import { login, seedStorage } from './utils';

// Text Encoding Exception: Vietnamese assertion strings match this project's localized Help labels exactly.

/**
 * CVF-WEB-INHERITANCE-T5 provider-free proof: signs in through existing
 * mock-storage helpers, opens Help in both languages, follows the two new
 * SOT3 Evidence / MAO Durable Runs link cards, and verifies each target
 * page's read-only boundary text with zero action controls. Makes zero
 * business submissions and zero provider calls. Button-count assertions are
 * scoped to the `<main>` landmark so the dashboard shell's own navigation
 * buttons (sidebar, theme toggle, language toggle) are not counted as page
 * action controls.
 */

function setLanguage(page: import('@playwright/test').Page, lang: 'vi' | 'en') {
    return page.addInitScript((value) => {
        window.localStorage.setItem('cvf_language', value);
    }, lang);
}

test.beforeEach(async ({ page }) => {
    await seedStorage(page);
});

test('English: Help links to SOT3 Evidence and MAO Durable Runs, both read-only with no action controls', async ({ page }) => {
    await setLanguage(page, 'en');
    await login(page);

    await page.goto('/help', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Help Center' })).toBeVisible({ timeout: 15_000 });

    const sot3Link = page.getByRole('link', { name: 'SOT3 Evidence' });
    await expect(sot3Link).toBeVisible();
    await expect(sot3Link).toHaveAttribute('href', '/governance/sot3-evidence');

    const maoLink = page.getByRole('link', { name: 'MAO Durable Runs' });
    await expect(maoLink).toBeVisible();
    await expect(maoLink).toHaveAttribute('href', '/governance/mao-runs');

    await sot3Link.click();
    await expect(page).toHaveURL(/\/governance\/sot3-evidence$/);
    await expect(page.getByText(/Read-only status view over durable SOT3 knowledge-activation evidence\./)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('main').getByRole('button')).toHaveCount(0);

    await page.goto('/help', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'MAO Durable Runs' }).click();
    await expect(page).toHaveURL(/\/governance\/mao-runs$/);
    await expect(page.getByText(/Read-only durable-event status view/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/excludes evidence records, evidence milestones, evidence freshness, heartbeat/)).toBeVisible();
    await expect(page.getByRole('main').getByRole('button')).toHaveCount(0);
});

test('Vietnamese: Help links to SOT3 Evidence and MAO Durable Runs, both read-only with no action controls', async ({ page }) => {
    await setLanguage(page, 'vi');
    await login(page);

    await page.goto('/help', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Trung tâm trợ giúp' })).toBeVisible({ timeout: 15_000 });

    const sot3Link = page.getByRole('link', { name: 'Bằng chứng SOT3' });
    await expect(sot3Link).toBeVisible();
    await expect(sot3Link).toHaveAttribute('href', '/governance/sot3-evidence');

    const maoLink = page.getByRole('link', { name: 'Lượt chạy MAO bền vững' });
    await expect(maoLink).toBeVisible();
    await expect(maoLink).toHaveAttribute('href', '/governance/mao-runs');

    await sot3Link.click();
    await expect(page).toHaveURL(/\/governance\/sot3-evidence$/);
    await expect(page.getByText(/Read-only status view over durable SOT3 knowledge-activation evidence\./)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('main').getByRole('button')).toHaveCount(0);

    await page.goto('/help', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Lượt chạy MAO bền vững' }).click();
    await expect(page).toHaveURL(/\/governance\/mao-runs$/);
    await expect(page.getByText(/Read-only durable-event status view/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('main').getByRole('button')).toHaveCount(0);
});
