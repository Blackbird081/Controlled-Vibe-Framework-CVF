import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    buildApprovalRequestSnapshot,
    computeApprovalRequestHash,
} from '@/app/api/approvals/approval-binding';
import type { ApprovalRequestRecord, ApprovalRequestSnapshot } from '@/app/api/approvals/store';

import {
    GUARD_POLICY_SNAPSHOT_SCHEMA_VERSION,
    validateEnvironmentIdentity,
    validateGuardPolicySnapshot,
    type GuardPolicySnapshot,
    type PendingAgentExecutionImmutablePayload,
} from '../pending-agent-execution';
import * as composition from '../pending-agent-execution-composition';
import { PendingAgentExecutionSqliteStore } from '../pending-agent-execution-sqlite-store';
import {
    runPendingAgentExecutionLocalHarness,
    type PendingAgentExecutionLocalHarnessInput,
} from './pending-agent-execution-local-harness';

const CREATED_AT = '2026-08-31T01:00:00.000Z';
const CLAIMED_AT = '2026-08-31T01:00:01.000Z';
const TERMINAL_AT = '2026-08-31T01:00:02.000Z';

const ACTOR: PendingAgentExecutionImmutablePayload['binding']['actor'] = {
    actorId: 'operator-1',
    actorOrgId: 'org-1',
    actorTeamId: 'team-1',
    actorAuthMode: 'session',
};

let tempDirs: string[] = [];

afterEach(() => {
    vi.restoreAllMocks();
    for (const dir of tempDirs) {
        rmSync(dir, { recursive: true, force: true });
    }
    tempDirs = [];
});

function makeTempDb(label: string): { dir: string; dbPath: string } {
    const dir = mkdtempSync(join(tmpdir(), `cvf-pae-local-harness-${label}-`));
    tempDirs.push(dir);
    return { dir, dbPath: join(dir, 'pending.sqlite') };
}

function buildSnapshot(): ApprovalRequestSnapshot {
    return buildApprovalRequestSnapshot({
        templateId: 'tpl-1',
        templateName: 'Template One',
        intent: 'run the bounded local lifecycle',
    }, 'test-provider', ACTOR);
}

function buildPolicySnapshot(overrides: Partial<GuardPolicySnapshot> = {}): GuardPolicySnapshot {
    return validateGuardPolicySnapshot({
        schemaVersion: GUARD_POLICY_SNAPSHOT_SCHEMA_VERSION,
        rows: [{ guardId: 'guard-a', guardVersion: '1.0.0', configDigest: 'a'.repeat(64) }],
        phase: 'build',
        riskLevel: 'low',
        role: 'BUILDER',
        channel: 'web',
        controlMode: 'enforced',
        policySnapshotId: 'policy-snap-1',
        ...overrides,
    });
}

function buildPayload(snapshot: ApprovalRequestSnapshot = buildSnapshot()): PendingAgentExecutionImmutablePayload {
    return {
        approvalId: 'approval-1',
        approvalRequestHash: computeApprovalRequestHash(snapshot),
        approvalRequestSnapshot: snapshot,
        normalizedIntent: { action: 'run-template', targetFiles: ['a.ts'] },
        binding: {
            actor: ACTOR,
            sessionId: 'session-1',
            cwd: '/repo',
            fileScope: ['a.ts'],
        },
        originalGuardResult: { finalDecision: 'ALLOW', reasons: ['ok'] },
        environment: validateEnvironmentIdentity({
            nodeEnv: 'test',
            runtimeName: 'vitest',
            deploymentBoundary: 'single_process_non_production',
        }),
        policySnapshot: buildPolicySnapshot(),
    };
}

function buildApprovalRecord(snapshot: ApprovalRequestSnapshot = buildSnapshot()): ApprovalRequestRecord {
    return {
        id: 'approval-1',
        templateId: snapshot.templateId,
        templateName: snapshot.templateName,
        intent: snapshot.intent,
        reason: 'approved for local proof',
        expiresAt: '2026-09-01T00:00:00.000Z',
        status: 'approved',
        submittedAt: '2026-08-31T00:00:00.000Z',
        requestHash: computeApprovalRequestHash(snapshot),
        requestSnapshot: snapshot,
        submittedByActorId: ACTOR.actorId,
        submittedByOrgId: ACTOR.actorOrgId,
        submittedByTeamId: ACTOR.actorTeamId,
        submittedByAuthMode: ACTOR.actorAuthMode,
    };
}

function buildInput(dbPath: string, overrides: Partial<PendingAgentExecutionLocalHarnessInput> = {}): PendingAgentExecutionLocalHarnessInput {
    const approval = buildApprovalRecord();
    return {
        dbPath,
        pendingExecutionId: 'pending-1',
        createdAt: CREATED_AT,
        payload: buildPayload(),
        actor: ACTOR,
        requestId: 'request-1',
        now: CLAIMED_AT,
        lookupApproval: () => approval,
        currentPolicySnapshot: buildPolicySnapshot(),
        generateClaimId: () => 'claim-1',
        attemptIndex: 2,
        terminalStatus: 'SUCCEEDED',
        terminalReason: 'local lifecycle complete',
        terminalAt: TERMINAL_AT,
        ...overrides,
    };
}

describe('pending-agent-execution local harness', () => {
    it('runs one real durable lifecycle through versions 0, 1, 2 and 3 while preserving caller identity', () => {
        const { dbPath } = makeTempDb('happy');
        const observedVersions: number[] = [];
        const originalBuilder = composition.buildPendingAgentExecutionRuntime;
        const builder = vi.spyOn(composition, 'buildPendingAgentExecutionRuntime').mockImplementation((path) => {
            const runtime = originalBuilder(path);
            return {
                ...runtime,
                create(...args) {
                    const result = runtime.create(...args);
                    if (result.record) observedVersions.push(result.record.state.recordVersion);
                    return result;
                },
                claim(input) {
                    const result = runtime.claim(input);
                    if (result.record) observedVersions.push(result.record.state.recordVersion);
                    return result;
                },
                begin(grant, attemptIndex) {
                    const result = runtime.begin(grant, attemptIndex);
                    if (result.record) observedVersions.push(result.record.state.recordVersion);
                    return result;
                },
                terminal(input) {
                    const result = runtime.terminal(input);
                    if (result.record) observedVersions.push(result.record.state.recordVersion);
                    return result;
                },
                close() {
                    runtime.close();
                },
            };
        });

        const outcome = runPendingAgentExecutionLocalHarness(buildInput(dbPath));

        expect(builder).toHaveBeenCalledTimes(1);
        expect(builder).toHaveBeenCalledWith(dbPath);
        expect(observedVersions).toEqual([0, 1, 2, 3]);
        expect(outcome.ok).toBe(true);
        expect(outcome.stage).toBe('TERMINAL');
        expect(outcome.reason).toBe('OK');
        expect(outcome.record?.state).toMatchObject({
            status: 'SUCCEEDED',
            recordVersion: 3,
            claimedBy: ACTOR,
            requestId: 'request-1',
            claimId: 'claim-1',
            attemptIndex: 2,
            terminalReason: 'local lifecycle complete',
            terminalAt: TERMINAL_AT,
        });
    });

    it('persists the terminal record across a close and durable reopen', () => {
        const { dbPath } = makeTempDb('restart');
        const outcome = runPendingAgentExecutionLocalHarness(buildInput(dbPath));
        expect(outcome.ok).toBe(true);

        const readStore = new PendingAgentExecutionSqliteStore(dbPath);
        const persisted = readStore.get('pending-1');
        readStore.close();

        expect(persisted).toEqual(outcome.record);
        expect(persisted?.state.recordVersion).toBe(3);
        expect(persisted?.state.status).toBe('SUCCEEDED');
    });

    it('fails closed at construction for a relative path without creating an implicit file', () => {
        const relativePath = join('cvf-t1e-relative-path-must-not-exist', 'pending.sqlite');
        expect(existsSync(relativePath)).toBe(false);

        const outcome = runPendingAgentExecutionLocalHarness(buildInput(relativePath));

        expect(outcome).toEqual({
            ok: false,
            stage: 'CONSTRUCT',
            reason: 'CONSTRUCTION_FAILED',
            record: null,
        });
        expect(existsSync(relativePath)).toBe(false);
    });

    it('stops at claim when approval is missing and persists no executing/requested-terminal state', () => {
        const { dbPath } = makeTempDb('approval-missing');
        const outcome = runPendingAgentExecutionLocalHarness(buildInput(dbPath, { lookupApproval: () => null }));

        expect(outcome.ok).toBe(false);
        expect(outcome.stage).toBe('CLAIM');
        expect(outcome.reason).toBe('APPROVAL_NOT_FOUND');
        expect(outcome.record?.state.status).toBe('STALE');
        expect(['EXECUTING', 'SUCCEEDED', 'FAILED', 'DENIED', 'UNKNOWN_TERMINAL']).not.toContain(outcome.record?.state.status);

        const readStore = new PendingAgentExecutionSqliteStore(dbPath);
        expect(readStore.get('pending-1')?.state).toMatchObject({
            status: 'STALE',
            recordVersion: 1,
            attemptIndex: null,
            terminalReason: 'STALE_APPROVAL_NOT_FOUND',
        });
        readStore.close();
    });

    it('stops at claim on policy drift and never advances to executing or the requested terminal', () => {
        const { dbPath } = makeTempDb('policy-drift');
        const outcome = runPendingAgentExecutionLocalHarness(buildInput(dbPath, {
            currentPolicySnapshot: buildPolicySnapshot({ riskLevel: 'critical' }),
        }));

        expect(outcome.ok).toBe(false);
        expect(outcome.stage).toBe('CLAIM');
        expect(outcome.reason).toBe('POLICY_FINGERPRINT_DRIFT');
        expect(outcome.record?.state).toMatchObject({
            status: 'STALE',
            recordVersion: 1,
            attemptIndex: null,
            terminalReason: 'STALE_POLICY_FINGERPRINT_CHANGED',
        });
    });

    it('marks a legacy-hash CREATED row stale without a grant while using the raw canonical builder snapshot', () => {
        const { dbPath } = makeTempDb('legacy-snapshot-hash');
        const productionSnapshot = buildApprovalRequestSnapshot({
            templateId: 'tpl-1',
            templateName: 'Template One',
            intent: 'run the bounded local lifecycle',
        }, 'test-provider', ACTOR);
        const legacySnapshot = {
            templateId: productionSnapshot.templateId,
            templateName: productionSnapshot.templateName,
            intent: productionSnapshot.intent,
            provider: productionSnapshot.provider,
            knowledgeCollectionId: productionSnapshot.knowledgeCollectionId,
            actorId: productionSnapshot.actorId,
            actorOrgId: productionSnapshot.actorOrgId,
            actorTeamId: productionSnapshot.actorTeamId,
            actorAuthMode: productionSnapshot.actorAuthMode,
        };
        const legacyHash = createHash('sha256')
            .update(JSON.stringify(legacySnapshot), 'utf8')
            .digest('hex');
        expect(legacyHash).not.toBe(computeApprovalRequestHash(productionSnapshot));
        const approval = {
            ...buildApprovalRecord(productionSnapshot),
            requestHash: legacyHash,
        };
        const payload = {
            ...buildPayload(productionSnapshot),
            approvalRequestHash: legacyHash,
        };

        const outcome = runPendingAgentExecutionLocalHarness(buildInput(dbPath, {
            payload,
            lookupApproval: () => approval,
        }));

        expect(outcome.ok).toBe(false);
        expect(outcome.stage).toBe('CLAIM');
        expect(outcome.reason).toBe('APPROVAL_SNAPSHOT_HASH_MISMATCH');
        expect(outcome.record?.state).toMatchObject({
            status: 'STALE',
            recordVersion: 1,
            attemptIndex: null,
            terminalReason: 'STALE_APPROVAL_SNAPSHOT_HASH_MISMATCH',
        });
    });

    it('gives a non-CREATED legacy-hash row no new grant or execution authority', () => {
        const { dbPath } = makeTempDb('legacy-non-created');
        const snapshot = buildSnapshot();
        const legacyHash = createHash('sha256').update(JSON.stringify({
            templateId: snapshot.templateId,
            templateName: snapshot.templateName,
            intent: snapshot.intent,
            provider: snapshot.provider,
            knowledgeCollectionId: snapshot.knowledgeCollectionId,
            actorId: snapshot.actorId,
            actorOrgId: snapshot.actorOrgId,
            actorTeamId: snapshot.actorTeamId,
            actorAuthMode: snapshot.actorAuthMode,
        }), 'utf8').digest('hex');
        const legacyPayload = { ...buildPayload(snapshot), approvalRequestHash: legacyHash };
        const seedStore = new PendingAgentExecutionSqliteStore(dbPath);
        seedStore.create('pending-1', CREATED_AT, legacyPayload);
        const seededClaim = seedStore.compareAndSwap('pending-1', 0, 'CREATED', {
            kind: 'CLAIM', claimId: 'legacy-claim', claimedAt: CLAIMED_AT,
            claimedBy: ACTOR, requestId: 'legacy-request',
        });
        expect(seededClaim.ok).toBe(true);
        const recordBeforeRejectedClaim = seedStore.get('pending-1');
        seedStore.close();

        const runtime = composition.buildPendingAgentExecutionRuntime(dbPath);
        const result = runtime.claim({
            pendingExecutionId: 'pending-1',
            actor: ACTOR,
            requestId: 'new-request',
            now: CLAIMED_AT,
            lookupApproval: () => ({ ...buildApprovalRecord(snapshot), requestHash: legacyHash }),
            currentPolicySnapshot: buildPolicySnapshot(),
            generateClaimId: () => 'new-claim',
        });
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('ALREADY_CLAIMED_OR_TERMINAL');
        expect(result.grant).toBeNull();
        expect(result.record?.state.status).toBe('CLAIMED');
        runtime.close();

        const reopenedStore = new PendingAgentExecutionSqliteStore(dbPath);
        expect(reopenedStore.get('pending-1')).toEqual(recordBeforeRejectedClaim);
        reopenedStore.close();
    });

    it('overrides an earlier successful terminal outcome when close fails and exposes no capability or raw error', () => {
        const { dbPath } = makeTempDb('close-failure');
        const originalBuilder = composition.buildPendingAgentExecutionRuntime;
        vi.spyOn(composition, 'buildPendingAgentExecutionRuntime').mockImplementation((path) => {
            const runtime = originalBuilder(path);
            return {
                ...runtime,
                close() {
                    runtime.close();
                    throw new Error('deliberate close failure');
                },
            };
        });

        const outcome = runPendingAgentExecutionLocalHarness(buildInput(dbPath));

        expect(outcome).toEqual({
            ok: false,
            stage: 'CLOSE',
            reason: 'CLOSE_FAILED',
            record: null,
        });
        expect(Object.keys(outcome).sort()).toEqual(['ok', 'reason', 'record', 'stage']);
        expect(outcome).not.toHaveProperty('runtime');
        expect(outcome).not.toHaveProperty('store');
        expect(outcome).not.toHaveProperty('grant');
        expect(outcome).not.toHaveProperty('error');
    });

    it('releases every SQLite handle so its OS temp directory is immediately removable', () => {
        const { dir, dbPath } = makeTempDb('cleanup');
        const outcome = runPendingAgentExecutionLocalHarness(buildInput(dbPath));
        expect(outcome.ok).toBe(true);

        rmSync(dir, { recursive: true });
        tempDirs = tempDirs.filter((candidate) => candidate !== dir);
        expect(existsSync(dir)).toBe(false);
    });

    it('has exactly the direct internal imports, public exports and static server boundary allowed by T1E', () => {
        const sourcePath = join(dirname(fileURLToPath(import.meta.url)), 'pending-agent-execution-local-harness.ts');
        const source = readFileSync(sourcePath, 'utf8');
        const moduleSpecifiers = Array.from(source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g), (match) => match[1]);
        const exportedSymbols = Array.from(source.matchAll(/export\s+(?:interface|type|function|class|const)\s+([A-Za-z0-9_]+)/g), (match) => match[1]);

        expect(moduleSpecifiers).toEqual([
            '../pending-agent-execution-composition',
            '../pending-agent-execution',
        ]);
        expect(exportedSymbols).toEqual([
            'PendingAgentExecutionLocalHarnessInput',
            'PendingAgentExecutionLocalHarnessOutcome',
            'runPendingAgentExecutionLocalHarness',
        ]);
        expect(source.match(/buildPendingAgentExecutionRuntime\s*\(/g)).toHaveLength(1);

        const forbidden = [
            /['"]use client['"]/, /\breact\b/i, /\bnext\//i, /\bapp\/api\b/i,
            /\bprovider\b/i, /\badmission\b/i, /\baudit\b/i, /\bmao\b/i,
            /execution-plane/i, /\bconfig\b/i, /\benvironment\b/i, /process\.env/,
            /\bfetch\b/, /\bhttps?:\b/i, /node:net/, /child_process/i,
            /\bdaemon\b/i, /\bwatcher\b/i, /package\.json/i, /\/index(?:['"]|\.)/,
        ];
        for (const pattern of forbidden) {
            expect(source).not.toMatch(pattern);
        }
    });
});
