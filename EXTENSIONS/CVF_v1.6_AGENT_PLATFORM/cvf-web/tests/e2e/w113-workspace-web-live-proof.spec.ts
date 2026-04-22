import { test, expect } from '@playwright/test';
import { seedStorageWithAlibaba, login, postLiveGovernedExecution } from './utils';

test.beforeEach(async ({ page }) => {
    await seedStorageWithAlibaba(page);
});

test('W113 live proof includes W112 governance envelope and provider metadata', async ({ page }) => {
    await login(page);
    const { response, body } = await postLiveGovernedExecution(page, 'simple');

    expect(response.status()).toBe(200);
    expect(body.success).toBe(true);
    expect(String(body.output ?? '')).not.toContain('MOCK_');
    expect(String(body.output ?? '').length).toBeGreaterThan(100);

    expect(body.governanceEnvelope).toBeDefined();
    expect(body.governanceEnvelope.routeId).toBe('/api/execute');
    expect(body.governanceEnvelope.surfaceClass).toBe('governance-execution');
    expect(body.governanceEnvelope.evidenceMode).toBe('live');
    expect(body.governanceEnvelope.trancheRef).toBe('W112-T1');
    expect(body.governanceEnvelope.policySnapshotId).toMatch(/^pol-\d{8}-\d{4}$/);
    expect(body.policySnapshotId).toBe(body.governanceEnvelope.policySnapshotId);

    expect(body.providerRouting).toBeDefined();
    expect(body.providerRouting.selectedProvider).toBe('alibaba');
    expect(body.providerRouting.requestedProvider).toBe('alibaba');
    expect(body.providerRouting.decision).toBe('ALLOW');
    expect(body.governanceEnvelope.providerLane).toBe('alibaba');
});
