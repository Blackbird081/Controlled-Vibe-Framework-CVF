import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import type { CanonicalExecutionPortResult } from 'cvf-model-gateway';
import { createMaoCanonicalSingleWorker, isDeniedGatewayPayload, resolveMaoRisk } from './mao-canonical-single-worker';
import { canonicalWebExecutionResponse } from '@/lib/canonical-web-gateway-execution';
import { MaoFileRunStore } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/durable.run.store';
import { RouteLineageTracker } from '@/app/api/execute/route-final-response';
import { SQLiteKeyedAtomicRecordStore } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store';
import { _testOnlySetStoreHooks, parseLineageConfig, provisionTenantMetadata, readLineage, type LineageConfig, type LineageIdentity } from './canonical-web-lineage';
import { controlOperation } from './canonical-web-admission-control';

const directories: string[] = [];
function directory() { const p = mkdtempSync(path.join(tmpdir(), 'web-mao-')); directories.push(p); return p; }
const canonicalId = 'canonical-fixture';
const result = (id = canonicalId) => ({
    canonicalExecutionId: id, response: { text: 'actual fixture inference result', providerUsage: { inputTokens: 4, outputTokens: 3, totalTokens: 7 } },
    receipt: { receiptId: 'fixture-gateway-receipt', canonicalExecutionId: id, traceId: id },
    materialContextManifest: { canonicalExecutionId: id, traceId: id, manifestDigest: 'fixture-manifest' },
    attemptOutcome: 'observed', materialContextManifestDisposition: 'present',
}) as unknown as CanonicalExecutionPortResult;
function fixture(extra: Partial<Parameters<typeof createMaoCanonicalSingleWorker>[0]> = {}) {
    const runPath = directory();
    const reserveNext = vi.fn().mockResolvedValue({ ordinal: 1 });
    const execute = vi.fn().mockResolvedValue(result());
    const options = { owner: { canonicalId, beforeProviderCall: () => null, verifiedOwnerHash: 'a'.repeat(64), reserveNext }, riskLevel: 'R1', durableRunPath: runPath, execute, ...extra };
    return { runPath, reserveNext, execute, options, worker: createMaoCanonicalSingleWorker(options) };
}
function journal(): { config: LineageConfig; identity: LineageIdentity; owner: RouteLineageTracker } {
    const p = directory(); SQLiteKeyedAtomicRecordStore.initialize(p);
    const parsed = parseLineageConfig(JSON.stringify({ schema: 'cvf.webLineageConfig.v1', revision: 1, directory: p, namespace: 'cvf-web-lineage-mao', tenants: [{ tenantId: 'org' }] }));
    if (!parsed.ok) throw Error('fixture-config');
    expect(provisionTenantMetadata(parsed.config).ok).toBe(true);
    const identity: LineageIdentity = { tenantId: 'org', owner: { kind: 'session', orgId: 'org', teamId: 'team', userId: 'user' } };
    return { config: parsed.config, identity, owner: new RouteLineageTracker(parsed.config, identity, { canonicalId, contractRevision: 'fixture-c1', sourceRevision: 'fixture-s1' }) };
}
/** Every durable event of the single run under `runPath`, in ledger order. */
async function runEvents(runPath: string) {
    const files = readdirSync(runPath).filter(f => f.endsWith('.json'));
    expect(files).toHaveLength(1);
    const graphId = (JSON.parse(readFileSync(path.join(runPath, files[0]), 'utf8')) as { graph: { taskGraphId: string } }).graph.taskGraphId;
    const state = await new MaoFileRunStore(runPath).resumeRun(graphId);
    if (!state.ok) throw Error('resume');
    return state.events;
}
afterEach(() => { _testOnlySetStoreHooks(undefined); vi.restoreAllMocks(); while (directories.length) rmSync(directories.pop()!, { recursive: true, force: true }); });

describe('one real canonical MAO worker consumer', () => {
    it.each(['R0', 'R1'])('uses native resolver for %s and returns the actual payload after durable completion', async riskLevel => {
        const f = fixture({ riskLevel }); const actual = result(); f.execute.mockResolvedValue(actual);
        const outcome = await f.worker.run();
        expect(outcome.ok).toBe(true);
        if (!outcome.ok) throw Error(outcome.reason);
        expect(outcome.payload).toBe(actual);
        expect(outcome.reference).toMatchObject({ canonicalExecutionId: canonicalId, state: 'succeeded' });
        const state = await new MaoFileRunStore(f.runPath).resumeRun(outcome.reference.taskGraphId);
        expect(state.ok && state.events.map(e => e.resultingState)).toEqual(['planned', 'admitted', 'running', 'succeeded']);
        expect(JSON.stringify(state)).not.toContain(actual.response!.text);
        expect(f.execute).toHaveBeenCalledTimes(1); expect(f.reserveNext).toHaveBeenCalledTimes(1);
    });
    it.each(['R2', 'R3', 'R4', 'bad', null])('refuses actual risk %s without reservation, graph or port effect', async riskLevel => {
        const f = fixture({ riskLevel }); expect(await f.worker.run()).toMatchObject({ ok: false, reason: 'MAO_RISK_DENIED' });
        expect(f.reserveNext).not.toHaveBeenCalled(); expect(f.execute).not.toHaveBeenCalled(); expect(readdirSync(f.runPath)).toEqual([]);
    });
    it('uses the highest actual risk without defaulting missing authority down to R1', () => {
        expect(resolveMaoRisk(undefined, null)).toBeNull();
        expect(resolveMaoRisk('R1', 'R2', 'R0')).toBe('R2');
        expect(resolveMaoRisk('R0', 'R3')).toBe('R3');
        expect(resolveMaoRisk('R1', 'invalid')).toBeNull();
    });
    it.each([undefined, '', 'relative-directory', ' /tmp/invalid '])('missing or invalid path %s fails before all effects', async durableRunPath => {
        const f = fixture({ durableRunPath }); expect(await f.worker.run()).toMatchObject({ ok: false, reason: 'MAO_NOT_READY' });
        expect(f.reserveNext).not.toHaveBeenCalled(); expect(f.execute).not.toHaveBeenCalled();
    });
    it('claims the request synchronously before the reservation await and never resets after completion', async () => {
        let release!: (value: { ordinal: number }) => void;
        const reserveNext = vi.fn().mockReturnValue(new Promise(r => { release = r; }));
        const f = fixture({ owner: { canonicalId, beforeProviderCall: () => null, verifiedOwnerHash: 'a'.repeat(64), reserveNext } });
        const first = f.worker.run(); expect(await f.worker.run()).toMatchObject({ reason: 'MAO_ALREADY_CLAIMED' });
        release({ ordinal: 1 }); expect((await first).ok).toBe(true);
        expect(await f.worker.run()).toMatchObject({ reason: 'MAO_ALREADY_CLAIMED' }); expect(reserveNext).toHaveBeenCalledTimes(1); expect(f.execute).toHaveBeenCalledTimes(1);
    });
    it('refuses parallel reentry while the actual port is pending and persists RUNNING first', async () => {
        let finish!: (value: CanonicalExecutionPortResult) => void;
        const f = fixture(); f.execute.mockImplementation(() => new Promise(r => { finish = r; }));
        const pending = f.worker.run(); await vi.waitFor(() => expect(f.execute).toHaveBeenCalledTimes(1));
        const files = readdirSync(f.runPath).filter(p => p.endsWith('.json'));
        const snapshot = JSON.parse(readFileSync(path.join(f.runPath, files[0]), 'utf8'));
        expect(snapshot.events.at(-1).resultingState).toBe('running');
        expect(await f.worker.run()).toMatchObject({ reason: 'MAO_ALREADY_CLAIMED' });
        finish(result()); expect((await pending).ok).toBe(true); expect(f.execute).toHaveBeenCalledTimes(1);
    });
    it('refuses ordinal two before graph creation and never calls a second worker', async () => {
        const f = fixture(); f.reserveNext.mockResolvedValue({ ordinal: 2 });
        expect(await f.worker.run()).toMatchObject({ reason: 'MAO_ORDINAL_DENIED' }); expect(readdirSync(f.runPath)).toEqual([]); expect(f.execute).not.toHaveBeenCalled();
    });
    it('rejects existing completed and empty runs across reconstructed helpers without replay', async () => {
        const f = fixture(); expect((await f.worker.run()).ok).toBe(true);
        expect(await createMaoCanonicalSingleWorker(f.options).run()).toMatchObject({ reason: 'MAO_RUN_UNAVAILABLE_NO_RESEND' });
        const file = path.join(f.runPath, readdirSync(f.runPath).find(p => p.endsWith('.json'))!);
        const raw = JSON.parse(readFileSync(file, 'utf8')); raw.events = []; writeFileSync(file, JSON.stringify(raw));
        expect(await createMaoCanonicalSingleWorker(f.options).run()).toMatchObject({ reason: 'MAO_RUN_UNAVAILABLE_NO_RESEND' }); expect(f.execute).toHaveBeenCalledTimes(1);
        writeFileSync(file, '{partial');
        expect(await createMaoCanonicalSingleWorker(f.options).run()).toMatchObject({ reason: 'MAO_RUN_UNAVAILABLE_NO_RESEND' }); expect(f.execute).toHaveBeenCalledTimes(1);
    });
    it('holds pending Web lineage and returns no payload when the real port throws', async () => {
        const j = journal(); const f = fixture({ owner: j.owner }); f.execute.mockRejectedValue(Error('transport-unknown'));
        const outcome = await f.worker.run(); expect(outcome).toEqual({ ok: false, reason: 'MAO_OUTCOME_UNKNOWN' });
        const state = readLineage(j.config, j.identity, canonicalId);
        expect(state.ok && state.value.history[0].state).toBe('PORT_PENDING');
        const restarted = new RouteLineageTracker(j.config, j.identity, { canonicalId, contractRevision: 'fixture-c1', sourceRevision: 'fixture-s1' });
        expect(await createMaoCanonicalSingleWorker({ ...f.options, owner: restarted }).run()).toMatchObject({ ok: false }); expect(f.execute).toHaveBeenCalledTimes(1);
    });
    it('does not expose actual AI output on uncertain terminal persistence', async () => {
        const original = MaoFileRunStore.prototype.appendEvent;
        vi.spyOn(MaoFileRunStore.prototype, 'appendEvent').mockImplementation(function (this: MaoFileRunStore, graphId, input) {
            if (input.eventType === 'INVOCATION_COMPLETED') return Promise.resolve({ ok: false, reason: 'IO_FAILURE', detail: 'lost acknowledgement' });
            return original.call(this, graphId, input);
        });
        const j = journal(); const f = fixture({ owner: j.owner }); const outcome = await f.worker.run();
        expect(outcome).toEqual({ ok: false, reason: 'MAO_OUTCOME_UNKNOWN' }); expect('payload' in outcome).toBe(false);
        const state = readLineage(j.config, j.identity, canonicalId); expect(state.ok && state.value.history[0].state).toBe('PORT_PENDING');
    });
    it('unconfirmed pre-call persistence never enters the actual port', async () => {
        vi.spyOn(MaoFileRunStore.prototype, 'appendEvent').mockResolvedValue({ ok: false, reason: 'IO_FAILURE', detail: 'uncertain write' });
        const f = fixture(); expect(await f.worker.run()).toMatchObject({ ok: false }); expect(f.execute).not.toHaveBeenCalled();
    });
    it('cancellation after durable running yields unknown, never cancelled output or retry', async () => {
        const controller = new AbortController(); const f = fixture({ signal: controller.signal }); f.execute.mockReturnValue(new Promise(() => {}));
        const pending = f.worker.run(); await vi.waitFor(() => expect(f.execute).toHaveBeenCalledTimes(1)); controller.abort();
        expect(await pending).toEqual({ ok: false, reason: 'MAO_OUTCOME_UNKNOWN' }); expect(await f.worker.run()).toMatchObject({ reason: 'MAO_ALREADY_CLAIMED' });
    });
    it('refuses canonical receipt mismatches instead of returning a fabricated successful receipt', async () => {
        const f = fixture(); f.execute.mockResolvedValue(result('foreign-canonical'));
        expect(await f.worker.run()).toEqual({ ok: false, reason: 'MAO_OUTCOME_UNKNOWN' });
    });
    it('verified owner and tenant differences produce distinct server graph identities', async () => {
        const first = fixture(); const second = fixture({ owner: { ...first.options.owner, verifiedOwnerHash: 'b'.repeat(64) } });
        const a = await first.worker.run(), b = await second.worker.run();
        expect(a.ok && b.ok && a.reference.taskGraphId !== b.reference.taskGraphId).toBe(true);
        const j = journal(); const otherTenant = new RouteLineageTracker(j.config, { ...j.identity, tenantId: 'other' }, { canonicalId, contractRevision: 'c1', sourceRevision: 's1' });
        expect(j.owner.verifiedOwnerHash).not.toBe(otherTenant.verifiedOwnerHash);
        expect(j.owner.verifiedOwnerHash).toMatch(/^[a-f0-9]{64}$/);
    });
    it('Stop wins with no graph and a committed reservation may still finish after Stop', async () => {
        const j = journal(); expect(controlOperation(j.config, j.identity, { action: 'stop' }).ok).toBe(true);
        const stopped = fixture({ owner: j.owner }); expect(await stopped.worker.run()).toMatchObject({ reason: 'WEB_ADMISSION_DENIED' });
        expect(stopped.execute).not.toHaveBeenCalled(); expect(readdirSync(stopped.runPath)).toEqual([]);
        expect(controlOperation(j.config, j.identity, { action: 'resume', expectedRevision: 1 }).ok).toBe(true);
        const f = fixture({ owner: j.owner }); f.execute.mockImplementation(async () => {
            expect(controlOperation(j.config, j.identity, { action: 'stop' }).ok).toBe(true); return result();
        }); expect((await f.worker.run()).ok).toBe(true);
        expect(controlOperation(j.config, j.identity, { action: 'status' })).toMatchObject({ ok: true, value: { state: 'STOPPED' } });
    });
    it('a lost Web reservation acknowledgement creates no graph and makes no provider call', async () => {
        const j = journal(); const f = fixture({ owner: j.owner });
        _testOnlySetStoreHooks({ afterCommit() { throw Error('lost reservation acknowledgement'); } });
        expect(await f.worker.run()).toMatchObject({ reason: 'WEB_ADMISSION_DENIED' });
        _testOnlySetStoreHooks(undefined); expect(f.execute).not.toHaveBeenCalled(); expect(readdirSync(f.runPath)).toEqual([]);
        const state = readLineage(j.config, j.identity, canonicalId); expect(state.ok && state.value.history[0].state).toBe('PORT_PENDING');
    });

    it('two separate consumer processes sharing one Web envelope admit exactly one graph producer and one actual port', async () => {
        const j = journal(), ctl = directory(), mao = directory();
        const script = String.raw`
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),crypto=require('node:crypto');
const [helper,lineage,ctl]=process.argv.slice(2),input=JSON.parse(fs.readFileSync(path.join(ctl,'input.json'),'utf8'));
const resolve=Module._resolveFilename;Module._resolveFilename=function(r,...args){try{return resolve.call(this,r,...args)}catch(e){if(r.endsWith('.js'))return resolve.call(this,r.slice(0,-3)+'.ts',...args);throw e}};
require.extensions['.ts']=(m,f)=>{
    // Source files are fixed for this case. Only compiled code is shared between peers.
    const cache=path.join(ctl,crypto.createHash('sha256').update(f).digest('hex')+'.cjs');
    let source;
    try{ source=fs.readFileSync(cache,'utf8'); }
    catch(error){
        if(error.code!=='ENOENT')throw error;
        const ts=require(path.join(process.cwd(),'node_modules/typescript'));
        source=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
        const candidate=cache+'.'+process.pid;
        fs.writeFileSync(candidate,source);
        fs.renameSync(candidate,cache);
    }
    m._compile(source,f);
};
const api=require(helper),journal=require(lineage),id=input.canonicalId;
if(input.loseReservationAck)journal._testOnlySetStoreHooks({afterCommit(){throw Error('lost reservation acknowledgement')}});
if(input.loseTerminalAck){const Store=require(path.resolve(path.dirname(helper),'../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/durable.run.store.ts')).MaoFileRunStore;const append=Store.prototype.appendEvent;Store.prototype.appendEvent=async function(graph,event){const result=await append.call(this,graph,event);if(event.eventType==='INVOCATION_COMPLETED'&&result.ok)throw Error('lost terminal acknowledgement');return result};}
const owner={canonicalId:id,beforeProviderCall:()=>null,verifiedOwnerHash:crypto.createHash('sha256').update(JSON.stringify([input.identity.tenantId,input.identity.owner])).digest('hex'),reserveNext:async()=>{const r=journal.reserve(input.config,input.identity,{canonicalId:id,contractRevision:'fixture-c1',sourceRevision:'fixture-s1'});return r.ok?{ordinal:r.value.ordinal}:{response:{status:503}}}};
const worker=api.createMaoCanonicalSingleWorker({owner,riskLevel:'R1',durableRunPath:input.mao,execute:async()=>{fs.appendFileSync(path.join(ctl,'calls.txt'),process.pid+'\n');return {canonicalExecutionId:id,response:{text:'actual fixture result'},receipt:{receiptId:'fixture',canonicalExecutionId:id,traceId:id},materialContextManifest:{canonicalExecutionId:id,traceId:id},attemptOutcome:'observed'}}});
process.stdout.write('READY\n');process.stdin.once('data',async()=>{const result=await worker.run();process.stdout.write(JSON.stringify({ok:result.ok,reason:result.reason,ref:result.reference})+'\n')});`;
        writeFileSync(path.join(ctl, 'peer.cjs'), script);
        writeFileSync(path.join(ctl, 'input.json'), JSON.stringify({ ...j, owner: undefined, canonicalId, mao }));
        const children: ReturnType<typeof spawn>[] = [];
        try {
            function start() {
                const child = spawn(process.execPath, [path.join(ctl, 'peer.cjs'), path.resolve('src/lib/server/mao-canonical-single-worker.ts'), path.resolve('src/lib/server/canonical-web-lineage.ts'), ctl], { cwd: process.cwd(), stdio: ['pipe', 'pipe', 'pipe'] });
                children.push(child); let stdout = '', stderr = '';
                child.stdout!.on('data', b => { stdout += String(b); }); child.stderr!.on('data', b => { stderr += String(b); });
                return { child, ready: async () => vi.waitFor(() => { if (child.exitCode !== null) throw Error(stderr); expect(stdout).toContain('READY\n'); }, { timeout: 60000 }), done: async () => { await vi.waitFor(() => { if (child.exitCode !== null && child.exitCode !== 0) throw Error(stderr); expect(stdout.trim().split('\n').length).toBe(2); }, { timeout: 60000 }); return JSON.parse(stdout.trim().split('\n')[1]); } };
            }
            // The first peer prepares the test's isolated compile cache. Both peers are
            // ready before either may compete for the same durable reservation.
            const a = start(); await a.ready();
            const b = start(); await b.ready();
            a.child.stdin!.write('go'); b.child.stdin!.write('go');
            const outcomes = await Promise.all([a.done(), b.done()]);
            expect(outcomes.filter(o => o.ok)).toHaveLength(1);
            expect(readFileSync(path.join(ctl, 'calls.txt'), 'utf8').trim().split('\n')).toHaveLength(1);
            expect(readdirSync(mao).filter(f => f.endsWith('.json'))).toHaveLength(1);
            const restart = start(); await restart.ready(); restart.child.stdin!.write('go'); expect((await restart.done()).ok).toBe(false);
            expect(readFileSync(path.join(ctl, 'calls.txt'), 'utf8').trim().split('\n')).toHaveLength(1);

            // A distinct process writes terminal state then loses its acknowledgement.
            const unknown = journal(), unknownMao = directory();
            writeFileSync(path.join(ctl, 'input.json'), JSON.stringify({ ...unknown, owner: undefined, canonicalId, mao: unknownMao, loseTerminalAck: true }));
            const lost = start(); await lost.ready(); lost.child.stdin!.write('go');
            expect(await lost.done()).toMatchObject({ ok: false, reason: 'MAO_OUTCOME_UNKNOWN' });
            expect(readLineage(unknown.config, unknown.identity, canonicalId)).toMatchObject({ ok: true, value: { history: [{ state: 'PORT_PENDING' }] } });
            const again = start(); await again.ready(); again.child.stdin!.write('go'); expect((await again.done()).ok).toBe(false);
            expect(readFileSync(path.join(ctl, 'calls.txt'), 'utf8').trim().split('\n')).toHaveLength(2);

            const reservationLost = journal(), lostMao = directory();
            writeFileSync(path.join(ctl, 'input.json'), JSON.stringify({ ...reservationLost, owner: undefined, canonicalId, mao: lostMao, loseReservationAck: true }));
            const noGrant = start(); await noGrant.ready(); noGrant.child.stdin!.write('go'); expect(await noGrant.done()).toMatchObject({ ok: false, reason: 'WEB_ADMISSION_DENIED' });
            expect(readdirSync(lostMao)).toEqual([]); expect(readFileSync(path.join(ctl, 'calls.txt'), 'utf8').trim().split('\n')).toHaveLength(2);
        } finally { children.forEach(child => child.kill()); }
    }, 90000);
});

describe('closed Gateway failure projection for API-key lanes', () => {
    function apiFailed(providerId: 'openai' | 'alibaba', providerDiagnostic: Record<string, unknown>, extra: { retryable?: boolean; errorClass?: string; attemptOutcome?: string } = {}) {
        const value = result(); delete value.response;
        value.materialContextManifestDisposition = 'attached'; value.attemptOutcome = (extra.attemptOutcome ?? 'invoked') as never;
        value.receipt = { ...value.receipt, providerId, selectedModelId: 'm', metadata: { materialContextManifestDigest: 'c'.repeat(64) } };
        value.materialContextManifest = { ...value.materialContextManifest!, selectedProviderId: providerId, selectedModelId: 'm', manifestDigest: 'c'.repeat(64) };
        value.error = { errorClass: extra.errorClass ?? 'provider_unavailable', traceId: canonicalId, message: 'secret raw provider body', retryable: extra.retryable ?? false, credentialShielded: true,
            providerDiagnostic } as unknown as NonNullable<CanonicalExecutionPortResult['error']>;
        return value;
    }
    it.each([
        ['openai', { code: 'provider_http_error', httpStatus: 401, credentialFingerprint: 'a'.repeat(12) }, { code: 'provider_http_error', httpStatus: 401 }],
        ['openai', { code: 'quota_locked', httpStatus: 429, usage: { totalTokens: 7, bogus: 1 } }, { code: 'quota_locked', httpStatus: 429, usage: { totalTokens: 7 } }],
        ['alibaba', { code: 'provider_timeout' }, { code: 'provider_timeout' }],
    ] as const)('captures only closed code/status/usage for %s %j and stays UNKNOWN with no resend', async (providerId, diagnostic, expected) => {
        const f = fixture(); f.execute.mockResolvedValue(apiFailed(providerId, diagnostic as Record<string, unknown>, { errorClass: 'policy_denied', retryable: true })); const outcome = await f.worker.run();
        expect(outcome).toEqual({ ok: false, reason: 'MAO_OUTCOME_UNKNOWN', safeGatewayFailure: { providerId, errorClass: 'policy_denied', retryable: true, providerDiagnostic: expected } });
        expect(JSON.stringify(outcome)).not.toMatch(/secret|fingerprint|aaaa|payload|message|bogus/);
        expect(await f.worker.run()).toMatchObject({ reason: 'MAO_ALREADY_CLAIMED' }); expect(f.execute).toHaveBeenCalledTimes(1);
    });
    it.each([
        ['uncertain network_error', apiFailed('openai', { code: 'network_error' })],
        ['uncertain unknown_error', apiFailed('alibaba', { code: 'unknown_error' })],
        ['no provider code', apiFailed('openai', undefined as never)],
        ['provider not invoked', apiFailed('openai', { code: 'provider_timeout' }, { attemptOutcome: 'not_reached' })],
        ['callback error', apiFailed('openai', { code: 'provider_timeout' }, { attemptOutcome: 'callback_error' })],
        ['open code', apiFailed('openai', { code: 'secret-code' })],
        ['open error class', apiFailed('openai', { code: 'provider_timeout' }, { errorClass: 'secret-class' })],
        ['unknown provider', apiFailed('openai', { code: 'provider_timeout' })],
        ['manifest provider mismatch', (() => { const v = apiFailed('openai', { code: 'provider_timeout' }); v.materialContextManifest = { ...v.materialContextManifest!, selectedProviderId: 'alibaba' }; return v; })()],
        ['digest mismatch', (() => { const v = apiFailed('openai', { code: 'provider_timeout' }); v.receipt.metadata.materialContextManifestDigest = 'd'.repeat(64); return v; })()],
        ['error trace mismatch', (() => { const v = apiFailed('openai', { code: 'provider_timeout' }); v.error!.traceId = 'wrong'; return v; })()],
    ])('keeps %s as plain MAO_OUTCOME_UNKNOWN without a typed diagnostic', async (name, value) => {
        if (name === 'unknown provider') value.receipt = { ...value.receipt, providerId: 'other' };
        const f = fixture(); f.execute.mockResolvedValue(value);
        expect(await f.worker.run()).toEqual({ ok: false, reason: 'MAO_OUTCOME_UNKNOWN' });
    });
    it('leaves the Claude subscription projection untouched for a Claude failure', async () => {
        const value = apiFailed('openai', { code: 'quota_locked', executionSurface: 'claude_cli_subscription', nativeProcessState: 'started' });
        value.receipt = { ...value.receipt, providerId: 'claude', selectedModelId: 'sonnet' };
        value.materialContextManifest = { ...value.materialContextManifest!, selectedProviderId: 'claude', selectedModelId: 'sonnet' };
        const f = fixture(); f.execute.mockResolvedValue(value);
        expect(await f.worker.run()).toEqual({ ok: false, reason: 'MAO_OUTCOME_UNKNOWN', safeProviderDiagnostic: { code: 'quota_locked', executionSurface: 'claude_cli_subscription', nativeProcessState: 'started' } });
    });
});

describe('safe native failure projection only', () => {
    function failed(code = 'quota_locked') {
        const value = result(); delete value.response;
        value.materialContextManifestDisposition = 'attached';
        value.receipt = { ...value.receipt, providerId: 'claude', selectedModelId: 'sonnet', metadata: { materialContextManifestDigest: 'b'.repeat(64) } };
        value.materialContextManifest = { ...value.materialContextManifest!, selectedProviderId: 'claude', selectedModelId: 'sonnet', manifestDigest: 'b'.repeat(64) };
        value.error = { errorClass: 'provider_unavailable', traceId: canonicalId, message: 'secret raw provider body', retryable: true, credentialShielded: true,
            providerDiagnostic: { code, executionSurface: 'claude_cli_subscription', nativeProcessState: 'started', usage: { totalTokens: 900 } } } as unknown as NonNullable<CanonicalExecutionPortResult['error']>;
        return value;
    }
    it.each(['quota_locked', 'credential_unavailable', 'provider_timeout'])('projects only bounded %s after all joins, preserving unknown/no resend', async code => {
        const f = fixture(); f.execute.mockResolvedValue(failed(code)); const outcome = await f.worker.run();
        expect(outcome).toEqual({ ok: false, reason: 'MAO_OUTCOME_UNKNOWN', safeProviderDiagnostic: { code, executionSurface: 'claude_cli_subscription', nativeProcessState: 'started' } });
        expect(JSON.stringify(outcome)).not.toMatch(/secret|900|payload|output|message|usage/);
        expect(await f.worker.run()).toMatchObject({ reason: 'MAO_ALREADY_CLAIMED' }); expect(f.execute).toHaveBeenCalledTimes(1);
    });
    it.each(['canonical', 'receipt', 'manifest', 'errorTrace', 'code', 'surface', 'process', 'provider', 'model', 'digest', 'disposition'])('drops entire diagnostic for invalid %s join/enum', async field => {
        const value = failed();
        if (field === 'provider') value.receipt.providerId = 'wrong';
        if (field === 'model') value.receipt.selectedModelId = 'wrong';
        if (field === 'digest') value.receipt.metadata.materialContextManifestDigest = 'wrong';
        if (field === 'disposition') value.materialContextManifestDisposition = 'invalid';
        if (field === 'canonical') value.canonicalExecutionId = 'wrong';
        if (field === 'receipt') value.receipt.traceId = 'wrong';
        if (field === 'manifest') value.materialContextManifest = { ...value.materialContextManifest!, canonicalExecutionId: 'wrong' };
        if (field === 'errorTrace') value.error!.traceId = 'wrong';
        if (field === 'code') value.error!.providerDiagnostic!.code = 'secret-code' as never;
        if (field === 'surface') value.error!.providerDiagnostic!.executionSurface = 'secret-surface' as never;
        if (field === 'process') value.error!.providerDiagnostic!.nativeProcessState = 'secret-process' as never;
        const f = fixture(); f.execute.mockResolvedValue(value); const outcome = await f.worker.run();
        expect(outcome).toEqual({ ok: false, reason: 'MAO_OUTCOME_UNKNOWN' }); expect(f.execute).toHaveBeenCalledTimes(1);
    });
});

describe('ledger-verified pre-invoke denial settles as a definite no-call outcome', () => {
    function deniedResult(id = canonicalId) {
        const value = result(id); delete value.response;
        value.attemptOutcome = 'denied' as never; value.materialContextManifestDisposition = 'not_built_precondition_stopped' as never;
        value.error = { errorClass: 'admission_blocked', traceId: id, message: 'quota', credentialShielded: true, retryable: true } as unknown as NonNullable<CanonicalExecutionPortResult['error']>;
        return value;
    }
    /** `attempts` is the fixture provider-attempt ledger length; the executor adds one attempt per call like the real gateway. */
    function denialFixture(payload: CanonicalExecutionPortResult = deniedResult(), extra: Record<string, unknown> = {}, withSettle = true) {
        const state = { attempts: 0 };
        const settleNext = vi.fn().mockResolvedValue(null);
        const deniedAttempt = vi.fn((since: number) => state.attempts === since + 1 ? { retryAfterSeconds: 7 } : null);
        const f = fixture({
            owner: { canonicalId, beforeProviderCall: () => null, verifiedOwnerHash: 'a'.repeat(64), reserveNext: vi.fn().mockResolvedValue({ ordinal: 1 }), ...(withSettle ? { settleNext } : {}) },
            attemptCount: () => state.attempts, deniedAttempt, toEvidence: value => canonicalWebExecutionResponse(value, 'm', Date.now(), 'alibaba').canonicalGateway, ...extra,
        });
        f.execute.mockImplementation(async () => { state.attempts += 1; return payload; });
        return { ...f, state, settleNext, deniedAttempt };
    }
    it('payload join plus the single not-admitted ledger fact settles ordinal 1 as denied and returns MAO_ATTEMPT_DENIED with the retry-after', async () => {
        const f = denialFixture(); const outcome = await f.worker.run();
        expect(outcome).toMatchObject({ ok: false, reason: 'MAO_ATTEMPT_DENIED', retryAfterSeconds: 7, evidence: { attemptOutcome: 'denied' } });
        expect('payload' in outcome).toBe(false); expect('response' in outcome).toBe(false);
        expect(f.deniedAttempt).toHaveBeenCalledWith(0); expect(f.settleNext).toHaveBeenCalledTimes(1);
        expect(f.settleNext).toHaveBeenCalledWith(1, expect.objectContaining({ attemptOutcome: 'denied' }), 0); expect(f.execute).toHaveBeenCalledTimes(1);
        // The denied task ends rejected: the durable run is never left running for a settled no-call denial.
        expect((await runEvents(f.runPath)).map(event => event.resultingState)).toEqual(['planned', 'admitted', 'running', 'rejected']);
        expect((await runEvents(f.runPath)).at(-1)).toMatchObject({ eventType: 'TASK_TRANSITIONED', resultingState: 'rejected' });
        expect((await runEvents(f.runPath)).at(-1)?.idempotencyKey).toMatch(/^web-once-[a-f0-9]{64}::DENIED_NO_CALL$/);
    });
    it.each([
        ['no ledger fact', () => denialFixture(deniedResult(), { deniedAttempt: () => null })],
        ['ledger shows two new attempts', () => { const f = denialFixture(); f.execute.mockImplementation(async () => { f.state.attempts += 2; return deniedResult(); }); return f; }],
        ['invoked payload with an error', () => denialFixture((() => { const v = deniedResult(); v.attemptOutcome = 'invoked' as never; return v; })())],
        ['foreign canonical id', () => denialFixture(deniedResult('foreign-canonical'))],
        ['only the payload canonical id is foreign', () => denialFixture((() => { const v = deniedResult(); v.canonicalExecutionId = 'foreign-canonical'; return v; })())],
        ['receipt trace mismatch', () => denialFixture((() => { const v = deniedResult(); v.receipt = { ...v.receipt, traceId: 'wrong' }; return v; })())],
        ['error trace mismatch', () => denialFixture((() => { const v = deniedResult(); v.error!.traceId = 'wrong'; return v; })())],
        ['wrong error class', () => denialFixture((() => { const v = deniedResult(); v.error!.errorClass = 'provider_unavailable' as never; return v; })())],
        ['attached manifest disposition', () => denialFixture((() => { const v = deniedResult(); v.materialContextManifestDisposition = 'attached' as never; return v; })())],
        ['payload carries a response', () => denialFixture((() => { const v = deniedResult(); v.response = result().response; return v; })())],
        ['execute throws', () => { const f = denialFixture(); f.execute.mockRejectedValue(Error('transport-unknown')); return f; }],
        ['legacy construction without the denial options', () => denialFixture(deniedResult(), { attemptCount: undefined, deniedAttempt: undefined, toEvidence: undefined }, false)],
        ['owner without settleNext', () => denialFixture(deniedResult(), {}, false)],
        ['no toEvidence', () => denialFixture(deniedResult(), { toEvidence: undefined })],
    ])('keeps %s as plain MAO_OUTCOME_UNKNOWN and never settles', async (_name, build) => {
        const f = build(); expect(await f.worker.run()).toEqual({ ok: false, reason: 'MAO_OUTCOME_UNKNOWN' });
        expect(f.settleNext).not.toHaveBeenCalled(); expect(f.execute).toHaveBeenCalledTimes(1);
        // Unknown outcomes keep the task running by design: the provider may have run, so no terminal event is written.
        expect((await runEvents(f.runPath)).map(event => event.resultingState)).toEqual(['planned', 'admitted', 'running']);
    });
    it('a failed settle gives WEB_SETTLEMENT_UNCERTAIN with its response, never a denial, and the task stays running', async () => {
        const f = denialFixture(); const uncertain = new Response('uncertain', { status: 503 }); f.settleNext.mockResolvedValue(uncertain);
        const outcome = await f.worker.run(); expect(outcome).toMatchObject({ ok: false, reason: 'WEB_SETTLEMENT_UNCERTAIN', response: uncertain });
        expect('retryAfterSeconds' in outcome).toBe(false); expect('evidence' in outcome).toBe(false);
        expect((await runEvents(f.runPath)).map(event => event.resultingState)).toEqual(['planned', 'admitted', 'running']);
    });
    it('a failed terminal append never changes the denial: MAO_ATTEMPT_DENIED with the retry-after, and the task stays running', async () => {
        const original = MaoFileRunStore.prototype.appendEvent;
        const spy = vi.spyOn(MaoFileRunStore.prototype, 'appendEvent').mockImplementation(function (this: MaoFileRunStore, graphId, input) {
            if (input.resultingState === 'rejected') throw Error('terminal append exploded');
            return original.call(this, graphId, input);
        });
        const f = denialFixture();
        const outcome = await f.worker.run();
        expect(outcome).toMatchObject({ ok: false, reason: 'MAO_ATTEMPT_DENIED', retryAfterSeconds: 7, evidence: { attemptOutcome: 'denied' } });
        expect(spy).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ resultingState: 'rejected' }));
        expect((await runEvents(f.runPath)).map(event => event.resultingState)).toEqual(['planned', 'admitted', 'running']);
    });
    it('a terminal append reporting a failed write also never changes the denial', async () => {
        const original = MaoFileRunStore.prototype.appendEvent;
        vi.spyOn(MaoFileRunStore.prototype, 'appendEvent').mockImplementation(function (this: MaoFileRunStore, graphId, input) {
            if (input.resultingState === 'rejected') return Promise.resolve({ ok: false, reason: 'IO_FAILURE', detail: 'uncertain write' });
            return original.call(this, graphId, input);
        });
        const f = denialFixture();
        expect(await f.worker.run()).toMatchObject({ ok: false, reason: 'MAO_ATTEMPT_DENIED', retryAfterSeconds: 7 });
        expect((await runEvents(f.runPath)).map(event => event.resultingState)).toEqual(['planned', 'admitted', 'running']);
    });
    it('a Web admission refusal before the provider call ends the started task rejected and never enters the port', async () => {
        const refused = new Response('refused', { status: 429 });
        const f = fixture({ owner: { canonicalId, beforeProviderCall: () => refused, verifiedOwnerHash: 'a'.repeat(64), reserveNext: vi.fn().mockResolvedValue({ ordinal: 1 }) } });
        expect(await f.worker.run()).toMatchObject({ ok: false, reason: 'WEB_ADMISSION_DENIED', response: refused });
        expect(f.execute).not.toHaveBeenCalled();
        expect((await runEvents(f.runPath)).map(event => event.resultingState)).toEqual(['planned', 'admitted', 'running', 'rejected']);
    });
    it('keeps the one-shot claim: a second run is MAO_ALREADY_CLAIMED and the port is entered once', async () => {
        const f = denialFixture(); expect((await f.worker.run()).ok).toBe(false);
        expect(await f.worker.run()).toMatchObject({ reason: 'MAO_ALREADY_CLAIMED' }); expect(f.execute).toHaveBeenCalledTimes(1); expect(f.settleNext).toHaveBeenCalledTimes(1);
    });
    it('real lineage: ordinal 1 is SETTLED with a denied observation (not PORT_PENDING) and a DENIED conclusion finalizes the envelope', async () => {
        const j = journal(); const f = denialFixture(deniedResult(), { owner: j.owner });
        const outcome = await f.worker.run(); expect(outcome).toMatchObject({ ok: false, reason: 'MAO_ATTEMPT_DENIED', retryAfterSeconds: 7 });
        expect((await runEvents(f.runPath)).at(-1)?.resultingState).toBe('rejected');
        const state = readLineage(j.config, j.identity, canonicalId);
        expect(state.ok && state.value.history.map(h => [h.ordinal, h.state, h.observation?.attemptOutcome])).toEqual([[1, 'SETTLED', 'denied']]);
        await j.owner.conclude(new Response(JSON.stringify({ success: false }), { status: 429 }), 'DENIED');
        const finalized = readLineage(j.config, j.identity, canonicalId);
        expect(finalized.ok && [finalized.value.state, finalized.value.terminal?.disposition, finalized.value.continuationHold]).toEqual(['FINALIZED', 'DENIED', false]);
    });
    it('the shared predicate matches only the gateway own pre-invoke denial joined to the canonical id', () => {
        expect(isDeniedGatewayPayload(deniedResult(), canonicalId)).toBe(true);
        expect(isDeniedGatewayPayload(deniedResult(), 'other')).toBe(false);
        expect(isDeniedGatewayPayload(result(), canonicalId)).toBe(false);
    });
});
