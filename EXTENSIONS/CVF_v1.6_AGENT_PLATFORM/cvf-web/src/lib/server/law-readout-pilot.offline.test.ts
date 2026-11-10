import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { SQLiteAtomicRecordAdapter, type AtomicSQLiteRow, type AtomicSQLiteWrite } from '../storage-adapter';
import { LawReadoutPilot, readoutInputSha256, readoutTextSha256 as sha,
    type ReadoutPlan, type ReadoutRequest, type ReadoutResponse, type ReadoutTransportRequest } from './law-readout-pilot';

// Real disposable SQLite; synthetic authority/prices/transport. No env/provider setup.
const system = 'Produce a bounded Vietnamese delivery readout.';
const input = 'Explain the verified LAW delivery facts and owned remainder.';
const revision = 'Make provenance source and development-owned remainder explicit.';
// Text Encoding Exception: Vietnamese response fixtures exercise UTF-8 digest/storage fidelity.
const initialOutput = 'Bản V1: quy tắc đã giao, bằng chứng chỉ có phạm vi giới hạn.';
const revisionOutput = 'Bản V2: workspace nhận từ provenance; đội phát triển giữ phần kiểm kỹ thuật.';
const now = new Date('2026-10-29T08:00:00Z');
const root = path.resolve(process.cwd(), '../../../.cvf/runtime/law-readout-offline-fixtures');
mkdirSync(root, { recursive: true });
const fixtures: string[] = [];
const fetchTrap = vi.fn(() => { throw new Error('EXTERNAL_FETCH_FORBIDDEN'); });
beforeAll(() => vi.stubGlobal('fetch', fetchTrap));
afterAll(() => {
    vi.unstubAllGlobals();
    // Closed handles only; exact task-created files, with no recursive deletion or traversal.
    for (const directory of fixtures) {
        expect(path.dirname(directory)).toBe(root);
        expect(lstatSync(directory).isSymbolicLink()).toBe(false);
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            expect(entry.isFile()).toBe(true);
            expect(/^cvf-keyvalue-store\.sqlite(?:-wal|-shm|-journal)?$/.test(entry.name)).toBe(true);
            unlinkSync(path.join(directory, entry.name));
        }
        rmdirSync(directory);
    }
});
afterEach(() => { vi.useRealTimers(); expect(fetchTrap).not.toHaveBeenCalled(); });

function fixture(change?: (plan: ReadoutPlan) => void) {
    const plan: ReadoutPlan = {
        runId: 'law-readout-test', workerAgentId: 'worker', delegationId: 'offline-test', reviewerAgentId: 'reviewer',
        grant: { authority: 'ORCHESTRATOR_GRANT_REQUIRED', grantId: 'synthetic-offline', authorizedBy: 'ORCHESTRATOR',
            subjectAgentId: 'worker', delegationId: 'offline-test', allowedProviders: ['alibaba'], maxCalls: 2,
            expiresAt: '2026-10-29T09:00:00Z' },
        sourceHead: 'a'.repeat(40), packetSha256: sha('packet'), oracleSha256: sha('oracle'),
        systemPromptSha256: sha(system), initialInputSha256: readoutInputSha256(system, input),
        revisionInstructionsSha256: sha(revision), provider: 'alibaba', model: 'synthetic-offline-model',
        pricing: { identity: 'SYNTHETIC_NOT_PROVIDER_PRICE', inputNanoUsdPerToken: 100, outputNanoUsdPerToken: 200 },
        maxInputTokens: 30000, maxOutputTokens: 3000, totalMicrounits: 500000, timeoutMs: 100,
    };
    change?.(plan);
    const directory = mkdtempSync(path.join(root, 'case-'));
    fixtures.push(directory);
    const store = new SQLiteAtomicRecordAdapter(directory, 'law-readout-pilot');
    const pilot = new LawReadoutPilot(plan, store, () => now);
    const request: ReadoutRequest = { workerAgentId: 'worker', delegationId: 'offline-test', grantId: 'synthetic-offline',
        sourceHead: plan.sourceHead, packetSha256: plan.packetSha256, oracleSha256: plan.oracleSha256,
        systemPrompt: system, userPrompt: input };
    const response = (output = initialOutput): ReadoutResponse => ({ provider: 'alibaba', model: plan.model,
        output, finishReason: 'stop', usage: { inputTokens: 2000, outputTokens: 100 } });
    const transport = vi.fn(async (_request: ReadoutTransportRequest) => { void _request; return response(); });
    pilot.initialize();
    return { plan, directory, store, pilot, request, response, transport };
}
function revisionRequest(request: ReadoutRequest, output = initialOutput): ReadoutRequest {
    return { ...request, userPrompt: revision, parentOutput: output,
        review: { reviewerAgentId: 'reviewer', parentOutputSha256: sha(output), decision: 'REVISE',
            expectedInformationGain: 'Test whether explicitly naming provenance removes ambiguous source guidance.' } };
}

describe('LAW source-only composition against existing quota and SQLite owners', () => {
    it('commits reservation before transport; delivers V1/V2 with linked metadata and no stored text', async () => {
        const f = fixture();
        f.transport.mockImplementation(async req => {
            expect(req.maxTokens).toBe(3000);
            const stage = req.userPrompt === input ? 'initial' : 'revision';
            expect(f.pilot.snapshot().quota.stages[stage].state).toBe('STARTED');
            return f.response(stage === 'initial' ? initialOutput : revisionOutput);
        });
        const v1 = await f.pilot.run('initial', f.request, f.transport);
        const v2 = await f.pilot.run('revision', revisionRequest(f.request, v1.output), f.transport);
        expect(v1.receipt.outputSha256).toBe(sha(initialOutput));
        expect(v2.output).toBe(revisionOutput);
        expect(v2.receipt.parentOutputSha256).toBe(v1.receipt.outputSha256);
        expect(v2.receipt.reviewSha256).toMatch(/^[a-f0-9]{64}$/);
        expect(v2.receipt.costMicrounits).toBe(220);
        expect(f.transport).toHaveBeenCalledTimes(2);
        const records = JSON.stringify(f.store.readAll());
        for (const privateText of [system, input, initialOutput, revisionOutput, revision,
            revisionRequest(f.request).review!.expectedInformationGain]) expect(records).not.toContain(privateText);
        // SQLite pages must not contain those texts either.
        const database = readFileSync(f.store.databasePath).toString('utf8');
        expect(database).not.toContain(initialOutput);
    });

    it('reopens custody without replenishing quota and denies all replay/third calls', async () => {
        const f = fixture();
        await f.pilot.run('initial', f.request, f.transport);
        const reopened = new LawReadoutPilot(f.plan, new SQLiteAtomicRecordAdapter(f.directory, 'law-readout-pilot'), () => now);
        reopened.initialize();
        await expect(reopened.run('initial', f.request, f.transport)).rejects.toThrow('REPLAY');
        await expect(reopened.run('revision', revisionRequest(f.request), f.transport)).rejects.toThrow('RECONCILIATION_REQUIRED');
        await f.pilot.run('revision', revisionRequest(f.request), f.transport);
        await expect(reopened.run('revision', revisionRequest(f.request), f.transport)).rejects.toThrow('REPLAY');
        expect(f.transport).toHaveBeenCalledTimes(2);
    });

    it('cannot replenish the same grant by changing runId', async () => {
        const f = fixture(); await f.pilot.run('initial', f.request, f.transport);
        expect(() => new LawReadoutPilot({ ...f.plan, runId: 'another-label' }, f.store, () => now).initialize())
            .toThrow('PLAN_DRIFT');
        expect(f.transport).toHaveBeenCalledTimes(1);
    });

    it('blocks successor even when settlement and every recovery acknowledgement fail', async () => {
        const f = fixture();
        class RepeatedFailureStore extends SQLiteAtomicRecordAdapter {
            calls = 0;
            override transaction<T>(fn: (rows: AtomicSQLiteRow[]) => { writes: AtomicSQLiteWrite[]; result: T }): T {
                this.calls++;
                if (this.calls > 2) throw new Error('persistent-offline-storage-failure');
                return super.transaction(fn, this.calls === 2
                    ? { afterCommit: () => { throw new Error('ambiguous-settlement'); } } : {});
            }
        }
        const pilot = new LawReadoutPilot(f.plan, new RepeatedFailureStore(f.directory, 'law-readout-pilot'), () => now);
        await expect(pilot.run('initial', f.request, f.transport)).rejects.toThrow('EXECUTION_UNKNOWN');
        expect(f.pilot.snapshot().stages.initial.status).toBe('VALID'); // Actual commit survived; acknowledgement did not.
        const reopened = new LawReadoutPilot(f.plan, f.store, () => now);
        await expect(reopened.run('revision', revisionRequest(f.request), f.transport)).rejects.toThrow('RECONCILIATION_REQUIRED');
        expect(f.transport).toHaveBeenCalledTimes(1);
    });

    it.each(['workerAgentId', 'delegationId', 'grantId'] as const)('denies wrong %s before transport', async field => {
        const f = fixture(); f.request[field] = 'wrong';
        await expect(f.pilot.run('initial', f.request, f.transport)).rejects.toThrow('AUTHORITY');
        expect(f.transport).not.toHaveBeenCalled();
        expect(f.pilot.snapshot().quota.stages.initial.state).toBe('RESERVED');
    });

    it.each(['sourceHead', 'packetSha256', 'oracleSha256'] as const)('denies changed %s', async field => {
        const f = fixture(); f.request[field] = 'b'.repeat(64);
        await expect(f.pilot.run('initial', f.request, f.transport)).rejects.toThrow('INPUT_PIN');
        expect(f.transport).not.toHaveBeenCalled();
    });

    it.each(['expiry', 'provider', 'issuer'] as const)('denies invalid grant %s', async kind => {
        const f = fixture(plan => {
            if (kind === 'expiry') plan.grant.expiresAt = now.toISOString();
            if (kind === 'provider') plan.grant.allowedProviders = ['other'];
            if (kind === 'issuer') plan.grant.authorizedBy = null;
        });
        await expect(f.pilot.run('initial', f.request, f.transport)).rejects.toThrow('AUTHORITY');
        expect(f.transport).not.toHaveBeenCalled();
    });

    it('rejects a changed system/input and caps a correctly pinned oversized request before transport', async () => {
        const f = fixture();
        await expect(f.pilot.run('initial', { ...f.request, systemPrompt: 'changed' }, f.transport)).rejects.toThrow('PROMPT_PIN');
        await expect(f.pilot.run('initial', { ...f.request, userPrompt: 'changed' }, f.transport)).rejects.toThrow('INITIAL_PIN');
        const huge = 'x'.repeat(30000);
        const g = fixture(plan => { plan.initialInputSha256 = readoutInputSha256(system, huge); });
        await expect(g.pilot.run('initial', { ...g.request, userPrompt: huge }, g.transport)).rejects.toThrow('INPUT_CAP');
        expect(f.transport).not.toHaveBeenCalled(); expect(g.transport).not.toHaveBeenCalled();
    });

    it('pins plan, pricing and model across reopen and snapshots cannot mutate custody', () => {
        const f = fixture();
        const snapshot = f.pilot.snapshot(); snapshot.quota.totalMicrounits = 1;
        expect(f.pilot.snapshot().quota.totalMicrounits).toBe(500000);
        for (const mutation of [{ ...f.plan, model: 'changed' }, { ...f.plan, pricing: { ...f.plan.pricing, identity: 'changed' } }]) {
            expect(() => new LawReadoutPilot(mutation, f.store, () => now).initialize()).toThrow('PLAN_DRIFT');
        }
    });

    it.each(['no-parent', 'wrong-parent', 'wrong-reviewer', 'no-gain', 'wrong-instructions'] as const)
    ('blocks blind revision: %s', async kind => {
        const f = fixture();
        if (kind !== 'no-parent') await f.pilot.run('initial', f.request, f.transport);
        const req = revisionRequest(f.request);
        if (kind === 'wrong-parent') req.parentOutput = 'not-the-delivered-version';
        if (kind === 'wrong-reviewer') req.review!.reviewerAgentId = 'worker';
        if (kind === 'no-gain') req.review!.expectedInformationGain = ' ';
        if (kind === 'wrong-instructions') req.userPrompt = 'unapproved';
        const before = f.transport.mock.calls.length;
        await expect(f.pilot.run('revision', req, f.transport)).rejects.toThrow(/REVIEW_REQUIRED|REVISION_PIN/);
        expect(f.transport).toHaveBeenCalledTimes(before);
        expect(f.pilot.snapshot().quota.stages.revision.state).toBe('RESERVED');
    });

    it.each(['missing-usage', 'negative-usage', 'overflow-usage', 'wrong-model', 'transport-error'] as const)
    ('retains possible spend and blocks successor on %s', async kind => {
        const f = fixture();
        f.transport.mockImplementation(async () => {
            if (kind === 'transport-error') throw new Error('sensitive provider detail');
            const res = f.response();
            if (kind === 'missing-usage') delete res.usage;
            if (kind === 'negative-usage') res.usage!.inputTokens = -1;
            if (kind === 'overflow-usage') res.usage!.outputTokens = 3001;
            if (kind === 'wrong-model') res.model = 'unapproved';
            return res;
        });
        await expect(f.pilot.run('initial', f.request, f.transport)).rejects.toThrow(/USAGE_UNKNOWN|RESPONSE_IDENTITY|EXECUTION_UNKNOWN/);
        expect(f.pilot.snapshot().quota.stages.initial).toMatchObject({ state: 'UNKNOWN', cost: null });
        await expect(f.pilot.run('initial', f.request, f.transport)).rejects.toThrow('REPLAY');
        await expect(f.pilot.run('revision', revisionRequest(f.request), f.transport)).rejects.toThrow('REVIEW_REQUIRED');
        expect(f.transport).toHaveBeenCalledTimes(1);
    });

    it.each(['length', 'empty', 'oversize'])('rejects unusable %s output while settling known usage', async kind => {
        const f = fixture();
        f.transport.mockImplementation(async () => ({ ...f.response(),
            output: kind === 'empty' ? ' ' : kind === 'oversize' ? 'x'.repeat(24001) : initialOutput,
            finishReason: kind === 'length' ? 'length' : 'stop' }));
        await expect(f.pilot.run('initial', f.request, f.transport)).rejects.toThrow('OUTPUT_REJECTED');
        expect(f.pilot.snapshot().stages.initial.status).toBe('FAILED');
        expect(f.pilot.snapshot().quota.stages.initial.state).toBe('SETTLED');
        await expect(f.pilot.run('revision', revisionRequest(f.request), f.transport)).rejects.toThrow('REVIEW_REQUIRED');
        expect(f.transport).toHaveBeenCalledTimes(1);
    });

    it('pre-cancel never starts or calls transport', async () => {
        const f = fixture(); const abort = new AbortController(); abort.abort();
        await expect(f.pilot.run('initial', f.request, f.transport, abort.signal)).rejects.toThrow('CANCELLED_BEFORE_START');
        expect(f.pilot.snapshot().quota.stages.initial.state).toBe('RESERVED');
        expect(f.transport).not.toHaveBeenCalled();
    });

    it.each(['cancel', 'timeout'] as const)('holds UNKNOWN after %s even if transport later resolves', async kind => {
        const f = fixture(); const abort = new AbortController();
        let resolve!: (res: ReadoutResponse) => void;
        f.transport.mockImplementation(() => new Promise(done => { resolve = done; }));
        const pending = f.pilot.run('initial', f.request, f.transport, abort.signal);
        const result = expect(pending).rejects.toThrow('CANCELLED_OR_TIMEOUT');
        await Promise.resolve();
        if (kind === 'cancel') abort.abort();
        await result;
        expect(f.pilot.snapshot().quota.stages.initial.state).toBe('UNKNOWN');
        expect(f.transport.mock.calls[0][0].signal.aborted).toBe(true);
        resolve(f.response()); await Promise.resolve(); await Promise.resolve();
        expect(f.pilot.snapshot().stages.initial.status).toBe('UNKNOWN');
        await expect(f.pilot.run('initial', f.request, f.transport)).rejects.toThrow('REPLAY');
        expect(f.transport).toHaveBeenCalledTimes(1);
    });

    it.each(['before-start-commit', 'after-start-commit', 'after-settle-commit'] as const)
    ('denies success on %s without unsafe replay', async kind => {
        const f = fixture();
        class FaultStore extends SQLiteAtomicRecordAdapter {
            calls = 0;
            override transaction<T>(fn: (rows: AtomicSQLiteRow[]) => { writes: AtomicSQLiteWrite[]; result: T }): T {
                this.calls++;
                const target = kind === 'after-settle-commit' ? 2 : 1;
                const fail = () => { throw new Error('injected-offline'); };
                return super.transaction(fn, this.calls === target
                    ? kind === 'before-start-commit' ? { beforeCommit: fail } : { afterCommit: fail } : {});
            }
        }
        const fault = new FaultStore(f.directory, 'law-readout-pilot');
        const pilot = new LawReadoutPilot(f.plan, fault, () => now);
        await expect(pilot.run('initial', f.request, f.transport)).rejects.toThrow(/IO|COMMIT_UNKNOWN|EXECUTION_UNKNOWN/);
        const reopened = new LawReadoutPilot(f.plan, f.store, () => now);
        if (kind === 'before-start-commit') {
            expect(f.transport).not.toHaveBeenCalled();
            expect(reopened.snapshot().quota.stages.initial.state).toBe('RESERVED');
        } else {
            await expect(reopened.run('initial', f.request, f.transport)).rejects.toThrow('REPLAY');
            expect(f.transport).toHaveBeenCalledTimes(kind === 'after-start-commit' ? 0 : 1);
            await expect(reopened.run('revision', revisionRequest(f.request), f.transport)).rejects.toThrow('REVIEW_REQUIRED');
            if (kind === 'after-settle-commit') {
                expect(reopened.snapshot().stages.initial.status).toBe('UNKNOWN');
                expect(reopened.snapshot().quota.stages.initial).toMatchObject({ state: 'SETTLED', cost: 220 });
                expect(reopened.snapshot().stages.initial.receipt?.outputSha256).toBe(sha(initialOutput));
            }
        }
    });

    it('rejects plan/grant identity disagreement before opening custody', () => {
        for (const field of ['subjectAgentId', 'delegationId'] as const) {
            expect(() => fixture(plan => { plan.grant[field] = 'different'; })).toThrow('PLAN_GRANT_IDENTITY');
        }
    });

    it('handles cancellation during the committed-start acknowledgement without an unhandled rejection', async () => {
        const f = fixture(); const abort = new AbortController();
        class CancellingStore extends SQLiteAtomicRecordAdapter {
            override transaction<T>(fn: (rows: AtomicSQLiteRow[]) => { writes: AtomicSQLiteWrite[]; result: T }): T {
                return super.transaction(fn, { afterCommit: () => abort.abort() });
            }
        }
        const pilot = new LawReadoutPilot(f.plan, new CancellingStore(f.directory, 'law-readout-pilot'), () => now);
        await expect(pilot.run('initial', f.request, f.transport, abort.signal)).rejects.toThrow('CANCELLED_OR_TIMEOUT');
        expect(f.transport).not.toHaveBeenCalled();
        expect(pilot.snapshot().quota.stages.initial.state).toBe('UNKNOWN');
    });

    it('rejects a contradictory quota/status record and never calls transport', async () => {
        const f = fixture();
        f.store.transaction(rows => {
            const row = rows[0]; const value = row.value as { stages: { initial: { status: string } } };
            value.stages.initial.status = 'VALID';
            return { writes: [{ id: row.id, expectedRevision: row.revision, value }], result: undefined };
        });
        await expect(f.pilot.run('initial', f.request, f.transport)).rejects.toThrow('RECORD_INVALID');
        expect(f.transport).not.toHaveBeenCalled();
    });
});
