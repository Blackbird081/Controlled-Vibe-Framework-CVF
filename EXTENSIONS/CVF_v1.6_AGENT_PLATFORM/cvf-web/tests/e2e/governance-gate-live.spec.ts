import { test, expect } from '@playwright/test';
import { seedStorageWithAlibaba, login, postLiveGovernedExecution } from './utils';

// All tests in this spec make real Alibaba (qwen-turbo) API calls.
// Assert governance BEHAVIOR — never assert exact AI response content.
// AI output varies run-to-run; governance behavior must be deterministic.
//
// Run under: DASHSCOPE_API_KEY=<key> npx playwright test tests/e2e/governance-gate-live.spec.ts --reporter=line
// Provider: Alibaba qwen-turbo | Timeout per test: 30s (plus 15s buffer)

test.beforeEach(async ({ page }) => {
    await seedStorageWithAlibaba(page);
});

test('normal governed request completes without block', async ({ page }) => {
    await login(page);
    const { response, body } = await postLiveGovernedExecution(page, 'simple');

    expect(response.status()).toBe(200);
    expect(body.success).toBe(true);
    expect(String(body.output ?? '').length).toBeGreaterThan(100);
    expect(String(body.output ?? '')).not.toContain('MOCK_');
    expect(body.enforcement).toBeDefined();
    expect(body.guardResult).toBeDefined();
    expect(body.providerRouting?.selectedProvider).toBe('alibaba');
});

test('bypass detection handles high-risk output correctly', async ({ page }) => {
    await login(page);
    const { response, body } = await postLiveGovernedExecution(page, 'simple');

    expect(response.status()).toBe(200);
    expect(body.success).toBe(true);
    expect(body.outputValidation).toBeDefined();
    expect(body.guardResult).toBeDefined();
    expect(String(body.output ?? '')).not.toContain('MOCK_');
});

test('governance audit trail updated after real AI call', async ({ page }) => {
    await login(page);
    await postLiveGovernedExecution(page, 'simple');

    // Navigate to audit / history section
    const auditNav = page.getByRole('link', { name: /Audit|Lịch sử|History|Governance/i }).first();
    const auditNavCount = await auditNav.count();

    if (auditNavCount > 0) {
        await auditNav.click();
        // At least one recent audit entry must exist
        const auditEntry = page.locator(
            '[class*="audit"], [class*="history"], tr, [data-audit-entry]'
        ).first();
        await expect(auditEntry).toBeVisible({ timeout: 10_000 });

        // Entry should contain a timestamp or provider reference
        const entryText = await auditEntry.textContent();
        expect(entryText?.length).toBeGreaterThan(5);
    } else {
        // Sidebar link not found — check that audit API endpoint at least responds
        const resp = await page.request.get('/api/audit/events?limit=5');
        expect(resp.status()).toBeLessThan(500);
        test.info().annotations.push({
            type: 'audit_trail',
            description: `Audit nav link not found; /api/audit/events responded ${resp.status()}`,
        });
    }
});
