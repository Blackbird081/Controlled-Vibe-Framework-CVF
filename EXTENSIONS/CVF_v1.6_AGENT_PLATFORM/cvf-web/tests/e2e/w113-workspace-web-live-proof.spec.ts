import { test, expect } from '@playwright/test';
import { seedStorageWithAlibaba, login, postLiveGovernedExecution } from './utils';

test.beforeEach(async ({ page }) => {
    await seedStorageWithAlibaba(page);
});

test('W113 live proof includes W112 governance envelope and provider metadata', async ({ page }) => {
    await login(page);
    const { response, body } = await postLiveGovernedExecution(page, 'simple');

    // The release runner retains only selected assertion lines. On a failed
    // provider result, emit enum fields and counts so a later diagnosis does
    // not require blind paid replay. Never log error text, output or keys.
    if (!body.success) {
        const stages = new Set(['request_validation', 'auth', 'rate_limit', 'governance', 'routing', 'provider',
            'output_validation', 'storage', 'network', 'benchmark_model', 'unknown']);
        const classes = new Set(['invalid_api_key', 'insufficient_balance', 'quota_exceeded', 'rate_limited',
            'provider_timeout', 'provider_http_error', 'provider_empty_output', 'provider_parse_error',
            'output_validation_failed', 'network_error', 'unknown_error']);
        const stage = body.diagnostic?.stage;
        const failureClass = body.diagnostic?.class;
        const providerHttpStatus = body.diagnostic?.httpStatus;
        const providerCallCount = body.providerAttemptReconciliation?.providerCallCount;
        console.log('CVF_SAFE_LIVE_FAILURE ' + JSON.stringify({
            routeHttpStatus: response.status(),
            stage: stages.has(stage) ? stage : 'unclassified',
            class: classes.has(failureClass) ? failureClass : 'unclassified',
            providerHttpStatus: Number.isInteger(providerHttpStatus) ? providerHttpStatus : null,
            providerCallCount: Number.isInteger(providerCallCount) ? providerCallCount : null,
        }));
    }

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
