import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { estimateLiveCalls, evaluateCostQuotaPreflight, summarizeCostQuota } from './web-governance-cost-quota';

const roots: string[] = [];

function makeContext() {
    const repoRoot = mkdtempSync(join(tmpdir(), 'cvf-cq-'));
    roots.push(repoRoot);
    let id = 0;
    return {
        repoRoot,
        now: () => '2026-05-08T00:00:00.000Z',
        idFactory: () => `cq-${++id}`,
    };
}

function writePolicy(repoRoot: string, policy: Record<string, unknown>) {
    const policyPath = resolve(repoRoot, '.cvf', 'config', 'cost-quota-policy.json');
    mkdirSync(resolve(policyPath, '..'), { recursive: true });
    writeFileSync(policyPath, JSON.stringify(policy, null, 2), 'utf8');
    return policyPath;
}

describe('web governance cost/quota guard', () => {
    afterEach(() => {
        for (const root of roots.splice(0)) {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('returns integer live-call estimates with provider lane and window mode', () => {
        const estimate = estimateLiveCalls('full_live_release_gate', 'alibaba', 'rolling_24h');

        expect(Number.isInteger(estimate.expectedLiveCallCount)).toBe(true);
        expect(estimate.expectedLiveCallCount).toBe(7);
        expect(estimate.providerLane).toBe('alibaba');
        expect(estimate.policyWindowMode).toBe('rolling_24h');
    });

    it('allows under-budget live jobs and records usage increment audit', () => {
        const context = makeContext();
        const result = evaluateCostQuotaPreflight({
            ...context,
            jobId: 'job-1',
            jobType: 'provider_check',
            providerLane: 'alibaba',
            role: 'operator',
            requestedBy: 'operator',
        });

        expect(result.decision).toBe('allowed');
        expect(result.estimate.expectedLiveCallCount).toBe(1);
        const audit = readFileSync(result.auditPath, 'utf8');
        expect(audit).toContain('"eventType":"usage_incremented"');
        expect(audit).not.toContain('ALIBABA_API_KEY=');
    });

    it('blocks over-budget direct preflight attempts before provider calls', () => {
        const context = makeContext();
        writePolicy(context.repoRoot, {
            version: 1,
            windowMode: 'rolling_24h',
            globalDailyLiveCallLimit: 0,
            providerLanes: {
                alibaba: { dailyLiveCallLimit: 0, perJobLiveCallLimit: { provider_check: 0 } },
                deepseek: { dailyLiveCallLimit: 0, perJobLiveCallLimit: { provider_check: 0 } },
            },
            cooldownSeconds: {},
            requireOwnerOverrideAboveLimit: true,
            overrideMode: 'owner_or_admin',
            auditMode: 'append_only_jsonl',
        });

        const result = evaluateCostQuotaPreflight({
            ...context,
            jobId: 'job-2',
            jobType: 'provider_check',
            providerLane: 'alibaba',
            role: 'operator',
            requestedBy: 'operator',
        });

        expect(result.decision).toBe('blocked_by_policy');
        expect(result.decisionReason).toBe('cost_quota_per_job_limit_exceeded');
    });

    it('allows owner/admin override but denies operator override', () => {
        const owner = makeContext();
        const operator = makeContext();
        for (const context of [owner, operator]) {
            writePolicy(context.repoRoot, {
                version: 1,
                windowMode: 'rolling_24h',
                globalDailyLiveCallLimit: 0,
                providerLanes: {
                    alibaba: { dailyLiveCallLimit: 0, perJobLiveCallLimit: { provider_check: 0 } },
                    deepseek: { dailyLiveCallLimit: 0, perJobLiveCallLimit: { provider_check: 0 } },
                },
                cooldownSeconds: {},
                requireOwnerOverrideAboveLimit: true,
                overrideMode: 'owner_or_admin',
                auditMode: 'append_only_jsonl',
            });
        }

        const ownerResult = evaluateCostQuotaPreflight({
            ...owner,
            jobId: 'owner-job',
            jobType: 'provider_check',
            providerLane: 'alibaba',
            role: 'owner',
            requestedBy: 'owner',
            override: { requested: true, reason: 'bounded CQ verification' },
        });
        const operatorResult = evaluateCostQuotaPreflight({
            ...operator,
            jobId: 'operator-job',
            jobType: 'provider_check',
            providerLane: 'alibaba',
            role: 'operator',
            requestedBy: 'operator',
            override: { requested: true, reason: 'should not pass' },
        });

        expect(ownerResult.decision).toBe('allowed');
        expect(ownerResult.overrideUsed).toBe(true);
        expect(readFileSync(ownerResult.auditPath, 'utf8')).toContain('"eventType":"override_used"');
        expect(operatorResult.decision).toBe('blocked_by_policy');
        expect(operatorResult.decisionReason).toBe('cost_quota_override_denied');
        expect(readFileSync(operatorResult.auditPath, 'utf8')).toContain('"eventType":"override_denied"');
    });

    it('blocks policy files containing secret-like values', () => {
        const context = makeContext();
        writePolicy(context.repoRoot, {
            version: 1,
            windowMode: 'rolling_24h',
            ALIBABA_API_KEY: 'dashscope-this-should-not-be-in-policy-1234567890',
        });

        const result = evaluateCostQuotaPreflight({
            ...context,
            jobId: 'secret-policy-job',
            jobType: 'provider_check',
            providerLane: 'alibaba',
            role: 'operator',
            requestedBy: 'operator',
        });

        expect(result.decision).toBe('blocked_by_policy');
        expect(result.decisionReason).toBe('policy_file_contains_secret_like_value');
    });

    it('summarizes current usage for the operations UI', () => {
        const context = makeContext();
        evaluateCostQuotaPreflight({
            ...context,
            jobId: 'job-summary',
            jobType: 'provider_check',
            providerLane: 'deepseek',
            role: 'operator',
            requestedBy: 'operator',
        });

        const summary = summarizeCostQuota(context.repoRoot, '2026-05-08T00:01:00.000Z');

        expect(summary.globalUsage).toBe(1);
        expect(summary.providerUsage.deepseek).toBe(1);
        expect(summary.estimates.full_live_release_gate.expectedLiveCallCount).toBe(7);
    });
});
