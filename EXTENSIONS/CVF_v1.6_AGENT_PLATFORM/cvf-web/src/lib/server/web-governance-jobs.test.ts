import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { listGovernanceJobs, redactGovernanceJobOutput, submitGovernanceJob } from './web-governance-jobs';

const roots: string[] = [];

function makeContext() {
    const repoRoot = mkdtempSync(join(tmpdir(), 'cvf-jobs-'));
    roots.push(repoRoot);
    let id = 0;
    return {
        repoRoot,
        auditPath: resolve(repoRoot, '.cvf', 'runtime', 'web-governance-jobs.jsonl'),
        now: () => '2026-05-08T00:00:00.000Z',
        idFactory: () => `id-${++id}`,
    };
}

describe('web governance jobs', () => {
    afterEach(() => {
        for (const root of roots.splice(0)) {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('runs an authorized allowlisted diagnostic job with fixed argv and audit events', async () => {
        const context = makeContext();
        const result = await submitGovernanceJob({
            jobType: 'cvf_doctor',
            role: 'operator',
            requestedBy: 'tester',
            authMode: 'authenticated',
            localMode: false,
            requestIpClass: 'loopback',
        }, {
            ...context,
            runCommand: async (command, argv) => ({
                stdout: JSON.stringify({ ok: true, command, argv }),
                stderr: '',
                exitCode: 0,
                timedOut: false,
                errorClass: null,
            }),
        });

        expect(result.status).toBe('succeeded');
        expect(result.latestEvent.fixedArgv).toEqual(['scripts/cvf_doctor.py', '--json']);
        const audit = listGovernanceJobs(context);
        expect(audit.events.map((event) => event.eventType)).toEqual(['requested', 'running', 'succeeded']);
        expect(audit.jobs[0].status).toBe('succeeded');
    });

    it('blocks read-only roles before launching a job and audits the policy block', async () => {
        const context = makeContext();
        let launched = false;
        const result = await submitGovernanceJob({
            jobType: 'provider_check',
            provider: 'alibaba',
            role: 'viewer',
            requestedBy: 'viewer',
            authMode: 'authenticated',
            localMode: false,
            requestIpClass: 'loopback',
        }, {
            ...context,
            runCommand: async () => {
                launched = true;
                return { stdout: '', stderr: '', exitCode: 0, timedOut: false, errorClass: null };
            },
        });

        expect(result.status).toBe('blocked_by_policy');
        expect(result.decisionReason).toBe('read_only_role_cannot_trigger');
        expect(launched).toBe(false);
        expect(listGovernanceJobs(context).events.map((event) => event.eventType)).toEqual(['requested', 'blocked_by_policy']);
    });

    it('blocks invalid provider lane input before launching provider checks', async () => {
        const context = makeContext();
        let launched = false;
        const result = await submitGovernanceJob({
            jobType: 'provider_check',
            provider: 'not-a-provider',
            role: 'operator',
            requestedBy: 'operator',
            authMode: 'authenticated',
            localMode: false,
            requestIpClass: 'loopback',
        }, {
            ...context,
            runCommand: async () => {
                launched = true;
                return { stdout: '', stderr: '', exitCode: 0, timedOut: false, errorClass: null };
            },
        });

        expect(result.status).toBe('blocked_by_policy');
        expect(result.decisionReason).toBe('invalid_provider');
        expect(launched).toBe(false);
    });

    it('runs provider checks as live validation with fixed argv', async () => {
        const context = makeContext();
        const result = await submitGovernanceJob({
            jobType: 'provider_check',
            provider: 'deepseek',
            role: 'operator',
            requestedBy: 'operator',
            authMode: 'authenticated',
            localMode: false,
            requestIpClass: 'loopback',
        }, {
            ...context,
            runCommand: async (_command, argv) => ({
                stdout: JSON.stringify({ status: 'LIVE_VALIDATED', argv }),
                stderr: '',
                exitCode: 0,
                timedOut: false,
                errorClass: null,
            }),
        });

        expect(result.status).toBe('succeeded');
        expect(result.latestEvent.handlerId).toBe('scripts.cvf_provider_check.json.live');
        expect(result.latestEvent.fixedArgv).toEqual(['scripts/cvf_provider_check.py', '--provider', 'deepseek', '--live', '--json']);
    });

    it('runs the full live release gate with fixed argv when a live key is configured', async () => {
        const context = makeContext();
        const envPath = resolve(context.repoRoot, 'EXTENSIONS', 'CVF_v1.6_AGENT_PLATFORM', 'cvf-web', '.env.local');
        mkdirSync(resolve(envPath, '..'), { recursive: true });
        writeFileSync(envPath, 'ALIBABA_API_KEY=test-key\n', 'utf8');
        const result = await submitGovernanceJob({
            jobType: 'full_live_release_gate',
            role: 'operator',
            requestedBy: 'operator',
            authMode: 'authenticated',
            localMode: false,
            requestIpClass: 'loopback',
        }, {
            ...context,
            runCommand: async (_command, argv) => ({
                stdout: JSON.stringify({ gate_result: 'PASS', argv }),
                stderr: '',
                exitCode: 0,
                timedOut: false,
                errorClass: null,
            }),
        });

        expect(result.status).toBe('succeeded');
        expect(result.latestEvent.handlerId).toBe('scripts.run_cvf_release_gate_bundle.live');
        expect(result.latestEvent.fixedArgv).toEqual(['scripts/run_cvf_release_gate_bundle.py', '--json']);
        expect(result.latestEvent.providerLane).toBe('alibaba');
        expect(result.latestEvent.timeoutMs).toBe(900_000);
    });

    it('blocks the full live release gate when no live key is configured', async () => {
        const saved = {
            DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY,
            ALIBABA_API_KEY: process.env.ALIBABA_API_KEY,
            CVF_ALIBABA_API_KEY: process.env.CVF_ALIBABA_API_KEY,
            CVF_BENCHMARK_ALIBABA_KEY: process.env.CVF_BENCHMARK_ALIBABA_KEY,
        };
        delete process.env.DASHSCOPE_API_KEY;
        delete process.env.ALIBABA_API_KEY;
        delete process.env.CVF_ALIBABA_API_KEY;
        delete process.env.CVF_BENCHMARK_ALIBABA_KEY;
        const context = makeContext();
        let launched = false;
        const result = await submitGovernanceJob({
            jobType: 'full_live_release_gate',
            role: 'operator',
            requestedBy: 'operator',
            authMode: 'authenticated',
            localMode: false,
            requestIpClass: 'loopback',
        }, {
            ...context,
            runCommand: async () => {
                launched = true;
                return { stdout: '', stderr: '', exitCode: 0, timedOut: false, errorClass: null };
            },
        });
        for (const [key, value] of Object.entries(saved)) {
            if (value === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = value;
            }
        }

        expect(result.status).toBe('blocked_by_policy');
        expect(result.decisionReason).toBe('missing_live_provider_key');
        expect(launched).toBe(false);
    });

    it('blocks a second full live release gate while one is active', async () => {
        const context = makeContext();
        const envPath = resolve(context.repoRoot, 'EXTENSIONS', 'CVF_v1.6_AGENT_PLATFORM', 'cvf-web', '.env.local');
        mkdirSync(resolve(envPath, '..'), { recursive: true });
        writeFileSync(envPath, 'ALIBABA_API_KEY=test-key\n', 'utf8');
        mkdirSync(resolve(context.auditPath, '..'), { recursive: true });
        writeFileSync(context.auditPath, JSON.stringify({
            eventId: 'event-1',
            jobId: 'active-gate',
            eventType: 'running',
            jobType: 'full_live_release_gate',
            requestedBy: 'operator',
            role: 'operator',
            authMode: 'authenticated',
            localMode: false,
            requestIpClass: 'loopback',
            requestedAt: '2026-05-08T00:00:00.000Z',
            recordedAt: '2026-05-08T00:00:00.000Z',
            decision: 'allowed',
            decisionReason: 'role_authorized',
            status: 'running',
            cwdLabel: 'repo',
            handlerId: 'scripts.run_cvf_release_gate_bundle.live',
            fixedArgv: ['scripts/run_cvf_release_gate_bundle.py', '--json'],
            providerLane: 'alibaba',
            redactionApplied: true,
            stdoutSummary: '',
            stderrSummary: '',
            exitCode: null,
            timeoutMs: 900_000,
            timedOut: false,
            errorClass: null,
            evidenceRefs: [],
            uiRequestId: 'ui-1',
            correlationId: 'corr-1',
        }) + '\n', 'utf8');
        const result = await submitGovernanceJob({
            jobType: 'full_live_release_gate',
            role: 'operator',
            requestedBy: 'operator',
            authMode: 'authenticated',
            localMode: false,
            requestIpClass: 'loopback',
        }, context);

        expect(result.status).toBe('blocked_by_policy');
        expect(result.decisionReason).toBe('full_release_gate_already_running');
    });

    it('allows anonymous local mode only for read-only diagnostics', async () => {
        const context = makeContext();
        const allowed = await submitGovernanceJob({
            jobType: 'cvf_doctor',
            role: 'anonymous_local',
            requestedBy: 'local',
            authMode: 'anonymous_local',
            localMode: true,
            requestIpClass: 'loopback',
        }, {
            ...context,
            runCommand: async () => ({ stdout: 'ok', stderr: '', exitCode: 0, timedOut: false, errorClass: null }),
        });
        const blocked = await submitGovernanceJob({
            jobType: 'provider_check',
            provider: 'alibaba',
            role: 'anonymous_local',
            requestedBy: 'local',
            authMode: 'anonymous_local',
            localMode: true,
            requestIpClass: 'loopback',
        }, context);

        expect(allowed.status).toBe('succeeded');
        expect(blocked.status).toBe('blocked_by_policy');
        expect(blocked.decisionReason).toBe('anonymous_local_trigger_not_allowed');
    });

    it('redacts known secrets and high entropy tokens before persistence', async () => {
        const context = makeContext();
        const secret = 'dashscope-super-secret-token-12345678901234567890';
        const result = await submitGovernanceJob({
            jobType: 'release_gate_dry_readiness',
            role: 'owner',
            requestedBy: 'owner',
            authMode: 'authenticated',
            localMode: false,
            requestIpClass: 'loopback',
        }, {
            ...context,
            runCommand: async () => ({
                stdout: `DASHSCOPE_API_KEY=${secret} token=${secret}`,
                stderr: '',
                exitCode: 0,
                timedOut: false,
                errorClass: null,
            }),
        });

        expect(result.latestEvent.stdoutSummary).not.toContain(secret);
        expect(result.latestEvent.stdoutSummary).toContain('[REDACTED]');
    });

    it('redacts an environment-backed fake live key from full release gate output', async () => {
        const context = makeContext();
        const fakeKey = 'test_invalid_cvf_redaction_probe_20260508';
        const saved = process.env.ALIBABA_API_KEY;
        process.env.ALIBABA_API_KEY = fakeKey;
        const result = await submitGovernanceJob({
            jobType: 'full_live_release_gate',
            role: 'operator',
            requestedBy: 'operator',
            authMode: 'authenticated',
            localMode: false,
            requestIpClass: 'loopback',
        }, {
            ...context,
            runCommand: async () => ({
                stdout: `provider_key=${fakeKey}`,
                stderr: `ALIBABA_API_KEY=${fakeKey}`,
                exitCode: 1,
                timedOut: false,
                errorClass: 'process_failed',
            }),
        });
        if (saved === undefined) {
            delete process.env.ALIBABA_API_KEY;
        } else {
            process.env.ALIBABA_API_KEY = saved;
        }

        const persisted = listGovernanceJobs(context);
        const serialized = JSON.stringify({ result, persisted });
        expect(serialized).not.toContain(fakeKey);
        expect(serialized).toContain('[REDACTED]');
    });

    it('marks timed out commands as timed_out', async () => {
        const context = makeContext();
        let observedTimeoutMs = 0;
        const result = await submitGovernanceJob({
            jobType: 'docs_governance_check',
            role: 'admin',
            requestedBy: 'admin',
            authMode: 'authenticated',
            localMode: false,
            requestIpClass: 'loopback',
            timeoutMsOverride: 5,
        }, {
            ...context,
            runCommand: async (_command, _argv, options) => {
                observedTimeoutMs = options.timeoutMs;
                return {
                stdout: '',
                stderr: 'timeout',
                exitCode: null,
                timedOut: true,
                errorClass: 'timeout',
                };
            },
        });

        expect(result.status).toBe('timed_out');
        expect(observedTimeoutMs).toBe(5);
        expect(result.latestEvent.timeoutMs).toBe(5);
        expect(result.latestEvent.timedOut).toBe(true);
        expect(result.latestEvent.errorClass).toBe('timeout');
    });

    it('redacts standalone output helper without needing a job run', () => {
        expect(redactGovernanceJobOutput('DEEPSEEK_API_KEY=abc123superlongsecretvalue', {
            NODE_ENV: 'test',
            DEEPSEEK_API_KEY: 'abc123superlongsecretvalue',
        } as NodeJS.ProcessEnv)).toBe('DEEPSEEK_API_KEY=[REDACTED]');
    });

    it('blocks over-budget provider checks before launching the command', async () => {
        const context = makeContext();
        const policyPath = resolve(context.repoRoot, '.cvf', 'config', 'cost-quota-policy.json');
        mkdirSync(resolve(policyPath, '..'), { recursive: true });
        writeFileSync(policyPath, JSON.stringify({
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
        }), 'utf8');
        let launched = false;

        const result = await submitGovernanceJob({
            jobType: 'provider_check',
            provider: 'alibaba',
            role: 'operator',
            requestedBy: 'operator',
            authMode: 'authenticated',
            localMode: false,
            requestIpClass: 'loopback',
        }, {
            ...context,
            runCommand: async () => {
                launched = true;
                return { stdout: '', stderr: '', exitCode: 0, timedOut: false, errorClass: null };
            },
        });

        expect(result.status).toBe('blocked_by_policy');
        expect(result.decisionReason).toBe('cost_quota_per_job_limit_exceeded');
        expect(result.costQuota?.expectedLiveCallCount).toBe(1);
        expect(launched).toBe(false);
    });

    it('allows owner override and denies operator override for over-budget jobs', async () => {
        const context = makeContext();
        const policyPath = resolve(context.repoRoot, '.cvf', 'config', 'cost-quota-policy.json');
        mkdirSync(resolve(policyPath, '..'), { recursive: true });
        writeFileSync(policyPath, JSON.stringify({
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
        }), 'utf8');
        let launched = 0;

        const owner = await submitGovernanceJob({
            jobType: 'provider_check',
            provider: 'alibaba',
            role: 'owner',
            requestedBy: 'owner',
            authMode: 'authenticated',
            localMode: false,
            requestIpClass: 'loopback',
            costQuotaOverride: { requested: true, reason: 'bounded CQ verification' },
        }, {
            ...context,
            runCommand: async () => {
                launched += 1;
                return { stdout: 'ok', stderr: '', exitCode: 0, timedOut: false, errorClass: null };
            },
        });
        const operator = await submitGovernanceJob({
            jobType: 'provider_check',
            provider: 'alibaba',
            role: 'operator',
            requestedBy: 'operator',
            authMode: 'authenticated',
            localMode: false,
            requestIpClass: 'loopback',
            costQuotaOverride: { requested: true, reason: 'should not pass' },
        }, {
            ...context,
            runCommand: async () => {
                launched += 1;
                return { stdout: 'no', stderr: '', exitCode: 0, timedOut: false, errorClass: null };
            },
        });

        expect(owner.status).toBe('succeeded');
        expect(owner.costQuota?.overrideUsed).toBe(true);
        expect(operator.status).toBe('blocked_by_policy');
        expect(operator.decisionReason).toBe('cost_quota_override_denied');
        expect(launched).toBe(1);
    });
});
