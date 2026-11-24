import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const probe = vi.hoisted(() => vi.fn());
vi.mock('cvf-model-gateway', () => ({ probeClaudeCliSubscription: probe }));
import { claudeNativeOptions, claudeSubscriptionReadiness, isClaudeSubscriptionMode, prepareClaudeSubscription, resolveClaudeSubscriptionModel } from './claude-cli-profile';
const original = { ...process.env };
beforeEach(() => {
    process.env = { ...original, CVF_CLAUDE_EXECUTION_MODE: 'subscription_cli', CVF_WEB_CANONICAL_MAO_SINGLE_WORKER: '1', CVF_MAO_DURABLE_RUN_PATH: '/fixture/mao', CVF_CLAUDE_CLI_PATH: '/fixture/claude.exe', CVF_CLAUDE_CLI_SHA256: 'a'.repeat(64) };
    probe.mockReset().mockResolvedValue({ state: 'available', checkedAt: '2026-11-13T00:00:00Z', executionSurface: 'claude_cli_subscription' });
});
afterEach(() => { process.env = { ...original }; });
describe('server subscription profile', () => {
    it('requires explicit mode and keeps sonnet an alias, rejecting API model IDs', () => {
        expect(isClaudeSubscriptionMode()).toBe(true); delete process.env.CVF_CLAUDE_EXECUTION_MODE; expect(isClaudeSubscriptionMode()).toBe(false);
        expect(resolveClaudeSubscriptionModel()).toBe('sonnet'); expect(resolveClaudeSubscriptionModel('sonnet')).toBe('sonnet');
        expect(() => resolveClaudeSubscriptionModel('claude-sonnet-4-20250514')).toThrow('MODEL_UNSUPPORTED');
    });
    it.each(['CVF_WEB_CANONICAL_MAO_SINGLE_WORKER', 'CVF_MAO_DURABLE_RUN_PATH', 'CVF_CLAUDE_CLI_PATH', 'CVF_CLAUDE_CLI_SHA256'])('missing %s denies without native probe', async key => {
        delete process.env[key]; await expect(prepareClaudeSubscription()).rejects.toThrow(); expect(probe).not.toHaveBeenCalled();
    });
    it('strips secrets and gives the entire execution one pre-probe monotonic deadline', async () => {
        process.env.ANTHROPIC_API_KEY = 'secret-key'; process.env.CVF_SERVICE_TOKEN = 'private-service'; process.env.ANTHROPIC_BASE_URL = 'unsafe';
        const before = performance.now(); const prepared = await prepareClaudeSubscription();
        expect(prepared.deadlineMonotonicMs).toBeGreaterThanOrEqual(before + 60000);
        expect(prepared.deadlineMonotonicMs).toBeLessThanOrEqual(performance.now() + 60000);
        expect(probe).toHaveBeenCalledWith(prepared); expect(JSON.stringify(prepared)).not.toMatch(/secret-key|private-service|unsafe/);
        expect(claudeNativeOptions().deadlineMonotonicMs).toBeUndefined();
    });
    it.each(['unavailable', 'unknown'])('native %s fails closed and remains unready', async state => {
        probe.mockResolvedValue({ state, checkedAt: '2026-11-13T00:00:00Z' });
        await expect(prepareClaudeSubscription()).rejects.toThrow('NOT_READY'); expect((await claudeSubscriptionReadiness()).state).toBe(state);
    });
    it('throw and unrecognized native status do not produce available or raw errors', async () => {
        probe.mockRejectedValue(new Error('secret-body')); const status = await claudeSubscriptionReadiness();
        expect(status.state).toBe('unknown'); expect(JSON.stringify(status)).not.toContain('secret-body');
        probe.mockResolvedValue({ state: 'bad', checkedAt: '2026-11-13T00:00:00Z' }); expect((await claudeSubscriptionReadiness()).state).toBe('unknown');
    });
});
