import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { getRuntimeObservabilitySnapshot, runtimeObservabilityFilePresence } from './runtime-observability';

const roots: string[] = [];

function makeRepo() {
    const repoRoot = mkdtempSync(join(tmpdir(), 'cvf-runtime-observability-'));
    roots.push(repoRoot);
    mkdirSync(resolve(repoRoot, '.cvf', 'runtime'), { recursive: true });
    mkdirSync(resolve(repoRoot, 'EXTENSIONS', 'CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME', 'observability'), { recursive: true });
    writeFileSync(resolve(repoRoot, 'EXTENSIONS', 'CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME', 'observability', 'runtime.dashboard.snapshot.ts'), '// test\n', 'utf8');
    return repoRoot;
}

describe('runtime observability snapshot for web', () => {
    afterEach(() => {
        for (const root of roots.splice(0)) {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('returns a read-only snapshot with source-tagged panels', () => {
        const repoRoot = makeRepo();
        const snapshot = getRuntimeObservabilitySnapshot({
            repoRoot,
            appRoot: resolve(repoRoot, 'EXTENSIONS', 'CVF_v1.6_AGENT_PLATFORM', 'cvf-web'),
            now: () => '2026-05-17T00:00:00.000Z',
        });

        expect(snapshot.mode).toBe('READ_ONLY_MODE');
        expect(snapshot.allowedActions).toContain('observe');
        expect(snapshot.blockedInterventions).toContain('kill_process');
        expect(snapshot.panels.processes[0].source).toBe('CVF_PROCESS_PORT_GUARD');
        expect(snapshot.panels.tokenContext[0].verifiedSource).toBe(false);
        expect(snapshot.panels.alerts.some((alert) => alert.source === 'CVF_TOKEN_CONTEXT_METER')).toBe(true);
    });

    it('maps governance job audit events into session visibility', () => {
        const repoRoot = makeRepo();
        const auditPath = resolve(repoRoot, '.cvf', 'runtime', 'web-governance-jobs.jsonl');
        writeFileSync(auditPath, `${JSON.stringify({
            eventId: 'evt-1',
            jobId: 'job-1',
            eventType: 'running',
            jobType: 'full_live_release_gate',
            requestedBy: 'operator',
            role: 'operator',
            authMode: 'authenticated',
            localMode: false,
            requestIpClass: 'loopback',
            requestedAt: '2026-05-17T00:00:00.000Z',
            recordedAt: '2026-05-17T00:00:01.000Z',
            decision: 'allowed',
            decisionReason: 'role_authorized',
            status: 'running',
            cwdLabel: 'Controlled-Vibe-Framework-CVF',
            handlerId: 'scripts.run_cvf_release_gate_bundle.live',
            fixedArgv: ['scripts/run_cvf_release_gate_bundle.py', '--json'],
            providerLane: 'alibaba',
            redactionApplied: true,
            stdoutSummary: 'running',
            stderrSummary: '',
            exitCode: null,
            timeoutMs: 900000,
            timedOut: false,
            errorClass: null,
            evidenceRefs: ['receipt-1'],
            uiRequestId: 'ui-1',
            correlationId: 'corr-job',
            costQuota: null,
        })}\n`, 'utf8');

        const snapshot = getRuntimeObservabilitySnapshot({
            repoRoot,
            appRoot: resolve(repoRoot, 'EXTENSIONS', 'CVF_v1.6_AGENT_PLATFORM', 'cvf-web'),
            now: () => '2026-05-17T00:00:02.000Z',
        });

        expect(snapshot.panels.sessions[0].sessionId).toBe('job-1');
        expect(snapshot.panels.sessions[0].provider).toBe('alibaba');
        expect(snapshot.panels.sessions[0].status).toBe('ACTIVE');
        expect(snapshot.summary.activeSessions).toBe(1);
    });

    it('keeps the adaptive runtime contract file discoverable', () => {
        const repoRoot = makeRepo();

        expect(runtimeObservabilityFilePresence(repoRoot)).toBe(true);
    });
});
