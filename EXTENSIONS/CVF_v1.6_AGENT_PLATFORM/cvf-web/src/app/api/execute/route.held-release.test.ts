const nativeProbe = vi.hoisted(() => vi.fn());
const nativeInvoke = vi.hoisted(() => vi.fn());
vi.mock('cvf-model-gateway', async () => {
 const actual = await vi.importActual<typeof import('cvf-model-gateway')>('cvf-model-gateway');
 return { ...actual, probeClaudeCliSubscription: nativeProbe, createClaudeCliExecutionAdapter: () => ({ providerId: 'claude', execute: nativeInvoke }) };
});
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const auth = vi.hoisted(() => vi.fn());
const provenance = vi.hoisted(() => vi.fn());
// Journal call probe: records call order and detects two journal calls inside one macrotask.
const journalProbe = vi.hoisted(() => ({
    events: [] as string[],
    violations: [] as string[],
    marker: null as { fired: boolean } | null,
}));
const enforcement = vi.hoisted(() => vi.fn());
const quota = vi.hoisted(() => vi.fn());
const audit = vi.hoisted(() => vi.fn());
const cost = vi.hoisted(() => vi.fn());
vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: auth,
    resolveVerifiedSessionProvenance: provenance,
    withSessionAuditPayload: (_session: unknown, payload: unknown) => payload,
}));
vi.mock('@/lib/server/canonical-web-lineage', async () => {
    const actual = await vi.importActual<typeof import('@/lib/server/canonical-web-lineage')>('@/lib/server/canonical-web-lineage');
    // After each journal call a setImmediate marker is queued. The next journal call must find that marker already fired,
    // which is only true when the caller yielded a real macrotask in between.
    function probed<A extends unknown[], R>(name: string, operation: (...args: A) => R): (...args: A) => R {
        return (...args: A): R => {
            if (journalProbe.marker && !journalProbe.marker.fired) {
                journalProbe.violations.push(`${name} ran in the same macrotask as the previous journal call`);
            }
            journalProbe.events.push(name);
            const result = operation(...args);
            const marker = { fired: false };
            journalProbe.marker = marker;
            setImmediate(() => {
                marker.fired = true;
            });
            return result;
        };
    }
    return {
        ...actual,
        reserve: probed('reserve', actual.reserve),
        settle: probed('settle', actual.settle),
        finalize: probed('finalize', actual.finalize),
    };
});
vi.mock('@/lib/enforcement', () => ({ evaluateEnforcement: enforcement }));
vi.mock('@/lib/quota-guard', () => ({ checkTeamQuota: quota, hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false) }));
vi.mock('@/lib/control-plane-events', async () => {
    const actual = await vi.importActual<typeof import('@/lib/control-plane-events')>('@/lib/control-plane-events');
    return { ...actual, appendAuditEvent: audit, appendCostEvent: cost };
});

import { POST } from './route';
import { POST as controlPOST } from './control/route';
import { getRateLimiter, resetRateLimitStoresForTest } from '@/lib/rate-limit';
import { _testOnlyResetReplayLedger } from '@/lib/service-token-auth';
import { SQLiteKeyedAtomicRecordStore } from '../../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store';
import { MaoFileRunStore } from '../../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/durable.run.store';
import { controlOperation } from '@/lib/server/canonical-web-admission-control';
import { RouteLineageTracker } from './route-final-response';
import {
    LINEAGE_CONFIG_ENV,
    _testOnlySetStoreHooks,
    parseLineageConfig,
    provisionTenantMetadata,
    resolveSessionIdentity,
    type LineageConfig,
} from '@/lib/server/canonical-web-lineage';

const originalEnv = { ...process.env };
const body = (extra: Record<string, unknown> = {}) => ({
    templateId: 'strategy_analysis',
    templateName: 'Strategy',
    intent: 'Analyze the market',
    inputs: { topic: 'SMB market', context: 'Compare market opportunities for SMBs' },
    provider: 'alibaba',
    model: 'qwen-plus-character',
    ...extra,
});
const request = (data: Record<string, unknown>) => new Request('http://localhost/api/execute', { method: 'POST', body: JSON.stringify(data) });
const verifiedProvenance = { qualified: true as const, userId: 'canonical-user', orgId: 'org-1', teamId: 'team-1', role: 'admin', oauthProvider: 'github', oauthSubject: 'subject-1', expiresAt: Date.now() + 3600000 };
const journalDirs: string[] = [];
let journalConfig: LineageConfig;

/** Creates an initialized dedicated journal in a temp directory and points the server configuration at it. */
function openJournal(activeSlots = 5, withService = false): LineageConfig {
    const directory = mkdtempSync(path.join(tmpdir(), 'cvf-route-lineage-'));
    journalDirs.push(directory);
    SQLiteKeyedAtomicRecordStore.initialize(directory);
    const raw = JSON.stringify({
        schema: 'cvf.webLineageConfig.v1', revision: 1, directory, namespace: 'cvf-web-lineage-route-test',
        tenants: [{ tenantId: 'org-1', activeSlots, archiveSlots: 5 }, ...(withService ? [{ tenantId: 'org-2', activeSlots, archiveSlots: 5 }] : [])],
        ...(withService ? { servicePrincipal: { principalId: 'service-test', tenantId: 'org-2' } } : {}),
    });
    const parsed = parseLineageConfig(raw);
    if (!parsed.ok) throw new Error(`journal config ${parsed.reason}`);
    expect(provisionTenantMetadata(parsed.config).ok).toBe(true);
    process.env[LINEAGE_CONFIG_ENV] = raw;
    return parsed.config;
}
const respond = (text: string) => new Response(JSON.stringify({ choices: [{ message: { content: text }, finish_reason: 'stop' }] }), { status: 200 });


const longText = (tag: string) => `## ${tag}\n\nThis response provides a structured recommendation with enough detail to satisfy output validation requirements.\n\n1. Review the request context carefully.\n2. Apply the governed execution plan.\n3. Return a concise, safe outcome for the operator.`;
const DRAFT = longText('Draft Output');
const REVISED = longText('Revised Output');
const PASS = JSON.stringify({ verdict: 'PASS', findings: [] });
const REVISE = JSON.stringify({ verdict: 'REVISE', findings: [{ criterion: 'clarity', problem: 'too vague', fix: 'be concrete' }] });


describe('opt-in bounded MAO role plan route', () => {
    function enable(risk = 'R1') {
        process.env.CVF_WEB_CANONICAL_MAO_ROLE_PLAN = '1';
        const directory = mkdtempSync(path.join(tmpdir(), 'cvf-route-plan-')); journalDirs.push(directory);
        process.env.CVF_MAO_DURABLE_RUN_PATH = directory;
        enforcement.mockReturnValue({ status: 'ALLOW', reasons: [], riskGate: { status: 'ALLOW', riskLevel: risk } });
        return directory;
    }
    const sequence = (...texts: string[]) => { const fetch = vi.fn(); texts.forEach(text => fetch.mockResolvedValueOnce(respond(text))); vi.stubGlobal('fetch', fetch); return fetch; };
    beforeEach(() => {
        process.env = { ...originalEnv, NODE_ENV: 'test', ALIBABA_API_KEY: 'fixture-key', CVF_ALIBABA_QUOTA_SCOPE_CONFIRMED: '1', CVF_ALIBABA_FREE_QUOTA_ONLY: '1', CVF_PROVIDER_QUOTA_PER_MIN: '10000', CVF_RATE_LIMIT: '10000' };
        delete process.env.CVF_CLAUDE_EXECUTION_MODE; delete process.env.CVF_WEB_CANONICAL_MAO_ROLE_PLAN; delete process.env.CVF_WEB_CANONICAL_MAO_SINGLE_WORKER;
        nativeProbe.mockReset().mockResolvedValue({ state: 'available', checkedAt: '2026-11-13T00:00:00Z', executionSurface: 'claude_cli_subscription' });
        nativeInvoke.mockReset();
        auth.mockReset().mockResolvedValue({ userId: 'canonical-user', user: 'canonical-user', role: 'admin', orgId: 'org-1', teamId: 'team-1', expiresAt: Date.now() + 3600000 });
        provenance.mockReset().mockResolvedValue(verifiedProvenance);
        journalProbe.events.length = 0; journalProbe.violations.length = 0; journalProbe.marker = null;
        journalConfig = openJournal();
        enforcement.mockReset().mockReturnValue({ status: 'ALLOW', reasons: [], riskGate: { status: 'ALLOW', riskLevel: 'R1' } });
        quota.mockReset().mockResolvedValue({ exceeded: false, currentUSD: 0, softCapUSD: 0, hardCapUSD: 0, overrideActive: false });
        audit.mockReset().mockResolvedValue({ id: 'fixture-audit' }); cost.mockReset().mockResolvedValue({ id: 'fixture-cost' });
        resetRateLimitStoresForTest(); _testOnlyResetReplayLedger();
    });
    afterEach(() => {
        vi.useRealTimers(); _testOnlySetStoreHooks(undefined); process.env = { ...originalEnv }; vi.restoreAllMocks(); vi.unstubAllGlobals();
        while (journalDirs.length) rmSync(journalDirs.pop()!, { recursive: true, force: true });
    });



    const owner=()=>{const r=resolveSessionIdentity(journalConfig,verifiedProvenance);if(!r.ok)throw Error('identity');return r.value;};
    const status=()=>{const r=controlOperation(journalConfig,owner(),{action:'status'});if(!r.ok)throw Error(r.reason);return r.value;};
    const release=async()=>{const response=await controlPOST(new Request('http://localhost/api/execute/control',{method:'POST',body:JSON.stringify({action:'release_held',expectedRevision:status().revision,canonicalId:status().execution!.canonicalId})}) as never);const data=await response.json();return data.success?{ok:true,...data}:{ok:false,reason:data.code,...data};};
    const laneSetup=(lane:string)=>{enable();if(lane!=='RP')delete process.env.CVF_WEB_CANONICAL_MAO_ROLE_PLAN;if(lane==='MAO')process.env.CVF_WEB_CANONICAL_MAO_SINGLE_WORKER='1';};
    const run=()=>POST(request(body({cvfRiskLevel:'R1'})) as never);
    const payload=(id:string,text=DRAFT)=>({canonicalExecutionId:id,response:{text},receipt:{receiptId:'fixture',canonicalExecutionId:id,traceId:id},materialContextManifest:{canonicalExecutionId:id,traceId:id},attemptOutcome:'invoked'});
    for(const lane of ['DIRECT','MAO','RP']) for(const fault of ['F1','F2','F3','F5','F6','F7']) it(`R3 ${lane} ${fault} owner recovery and unchanged hold`,async()=>{
      laneSetup(lane);const lineage=await import('@/lib/server/canonical-web-lineage');const gateway=await import('cvf-model-gateway');const maintenance=await import('@/lib/server/canonical-web-lineage-maintenance');
      const controller=new AbortController();let calls=0;let nextCalls=0;let failing=true;let finish:((value:never)=>void)|undefined;
      vi.stubGlobal('fetch',vi.fn(()=>{throw Error('NETWORK_FORBIDDEN')}));
      vi.spyOn(gateway.CanonicalExecutionAdapter.prototype,'execute').mockImplementation(async input=>{
        calls++;if(failing){if(fault==='F1')throw Error('fixture_transport');if(fault==='F2')return await new Promise(resolve=>{finish=resolve;});if(fault==='F3'){controller.abort();throw Error('fixture_abort');}if(fault==='F5')_testOnlySetStoreHooks({beforeCommit(){throw Error('fixture_settle')}});}
        return payload(failing&&fault==='F7'?'foreign-id':input.canonicalExecutionId,failing?DRAFT:(++nextCalls===1?DRAFT:PASS)) as never;
      });
      let pending:Promise<Response>|undefined;
      if(fault==='F6')expect(lineage.reserve(journalConfig,owner(),{canonicalId:'orphan',contractRevision:'c1',sourceRevision:'s1'}).ok).toBe(true);
      else{pending=POST(new Request('http://localhost/api/execute',{method:'POST',body:JSON.stringify(body({cvfRiskLevel:'R1'})),signal:controller.signal}) as never);if(fault==='F2'){for(let n=0;n<1000&&calls===0;n++)await new Promise(r=>setTimeout(r,1));expect(calls).toBe(1);}else await pending;}
      _testOnlySetStoreHooks(undefined);
      const held=status().execution!;expect(held.active).toBe(true);const count=calls;
      const blocked=await run();expect(blocked.status).toBe(409);expect((await blocked.json()).code).toBe('ADMISSION_CONFLICT');expect(calls).toBe(count);
      vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(Date.parse(held.updatedAt)+299999);const early=await release();expect(early).toMatchObject({ok:false,reason:'RELEASE_TOO_EARLY'});expect('releasableAt' in early).toBe(true);
      vi.setSystemTime(Date.parse(held.updatedAt)+300000);expect((await release()).ok).toBe(true);expect(status().heldRelease?.count).toBe(1);
      const store=new SQLiteKeyedAtomicRecordStore(journalConfig.directory,journalConfig.namespace,{maxRowBytes:49152,maxRowBytesFor:id=>id.startsWith("m:")?49152:16384});const record=store.readKeys([lineage.requestKey('org-1',held.canonicalId)])[0];expect(record.state).toBe('PRESENT');if(record.state!=='PRESENT')throw Error('row');expect(lineage.validateRequestRecord(record.value)?.ownerRelease).toBeDefined();
      expect(status().execution).toEqual(held);
      failing=false;const next=await run();expect(next.status).toBe(200);expect(calls).toBe(count+(lane==='RP'?2:1));
      expect(lineage.reserve(journalConfig,owner(),{canonicalId:held.canonicalId,contractRevision:held.contractRevision,sourceRevision:held.sourceRevision})).toMatchObject({ok:false,reason:'HELD_RELEASED'});
      const report=maintenance.reconcileLineage(journalConfig,{now:Date.now()});const t=report.tenants[0];expect([...t.pending,...t.uncertain,...t.joinDiscrepant]).toContain(held.canonicalId);
      if(finish){finish(payload(held.canonicalId) as never);await pending;expect(status().execution?.canonicalId).not.toBe(held.canonicalId);}
      console.log('CVF_R3_ROW '+JSON.stringify({lane,fault,executorCalls:calls,providerCalls:0,heldId:held.canonicalId,assertions:'a-g PASS'}));
    });
    for(const lane of ['DIRECT','MAO','RP']) for(const scenario of ['released','deadline239999','deadline240000','beforeCommit','afterCommit']) it(`R3 F8 ${lane} ${scenario} post-preparation fence`,async()=>{
      laneSetup(lane);const gateway=await import('cvf-model-gateway');let calls=0;let entered=false;let resume!:()=>void;const pause=new Promise<void>(resolve=>{resume=resolve;});
      vi.stubGlobal('fetch',vi.fn(()=>{throw Error('NETWORK_FORBIDDEN')}));vi.spyOn(gateway.CanonicalExecutionAdapter.prototype,'execute').mockImplementation(async input=>{calls++;return payload(input.canonicalExecutionId,calls===1?DRAFT:PASS) as never;});
      if(lane==='DIRECT'){const actual=RouteLineageTracker.prototype.reserveNext;vi.spyOn(RouteLineageTracker.prototype,'reserveNext').mockImplementation(async function(this:RouteLineageTracker){const r=await actual.call(this);if(!entered){entered=true;await pause;}return r;});}
      else{const actual=MaoFileRunStore.prototype.appendEvent;vi.spyOn(MaoFileRunStore.prototype,'appendEvent').mockImplementation(async function(this:MaoFileRunStore,...args:Parameters<typeof actual>){const r=await actual.apply(this,args);if(!entered&&args[1].eventType==='INVOCATION_STARTED'){entered=true;await pause;}return r;});}
      const pending=run();for(let n=0;n<2000&&!entered;n++)await new Promise(r=>setTimeout(r,1));expect(entered).toBe(true);expect(calls).toBe(0);
      const initial=status().execution!;vi.useFakeTimers({toFake:['Date']});const age=scenario==='released'?300000:scenario==='deadline239999'?239999:scenario==='deadline240000'?240000:1000;vi.setSystemTime(Date.parse(initial.updatedAt)+age);
      if(scenario==='released')expect((await release()).ok).toBe(true);
      if(scenario==='beforeCommit'||scenario==='afterCommit')_testOnlySetStoreHooks({[scenario](){throw Error('fixture_gate_fault');}});
      resume();const response=await pending;_testOnlySetStoreHooks(undefined);
      if(scenario==='deadline239999'){expect(calls).toBeGreaterThan(0);const current=status().execution!;expect(Date.parse(current.updatedAt)).toBeGreaterThanOrEqual(Date.parse(initial.updatedAt)+239999);}
      else{expect(calls).toBe(0);const data=await response.json();if(scenario==='released'||scenario==='deadline240000'){expect(response.status).toBe(409);expect(data.code).toBe(scenario==='released'?'HELD_RELEASED':'EXECUTION_DEADLINE_EXCEEDED');}}
      console.log('CVF_R3_F8 '+JSON.stringify({lane,scenario,executorCalls:calls,providerCalls:0,status:response.status}));
    });

    const exhaust=async(count:number)=>{for(let i=0;i<count;i++)await getRateLimiter().consumeProviderAttempt('session','canonical-user','alibaba:qwen-plus-character');};
    for(const lane of ['DIRECT','MAO','RP1','RP4']) it(`R3 F4 ${lane} definite denial needs no release`,async()=>{
      const single=lane==='DIRECT'||lane==='MAO';
      laneSetup(lane==='DIRECT'||lane==='MAO'?lane:'RP');process.env.CVF_PROVIDER_QUOTA_PER_MIN=single?'1':'4';await exhaust(lane==='RP4'?1:single?1:4);
      const fetch=lane==='RP4'?sequence(DRAFT,REVISE,REVISED):sequence();const first=await run();const data=await first.json();expect(first.status).toBe(lane==='RP4'?200:429);expect(fetch).toHaveBeenCalledTimes(lane==='RP4'?3:0);
      if(lane==='MAO'){expect(Number(first.headers.get('Retry-After'))).toBeGreaterThan(0);expect(data.code).not.toBe('MAO_OUTCOME_UNKNOWN');expect(data.canonicalGateway.attemptOutcome).toBe('denied');}
      expect(status().execution).toMatchObject({active:false,state:'FINALIZED',terminalDisposition:lane==='RP4'?'COMPLETED':'DENIED'});expect(await release()).toMatchObject({ok:false,reason:'RELEASE_NOT_APPLICABLE'});
      if(lane==='RP4')expect(data.maoRolePlan.stoppedEarly).toBe('ATTEMPT_DENIED');process.env.CVF_PROVIDER_QUOTA_PER_MIN='10000';resetRateLimitStoresForTest();const next=sequence(DRAFT,PASS);expect((await run()).status).toBe(200);expect(next).toHaveBeenCalledTimes(single?1:2);
    });
    it('R3 F9/F10 real-route pending A then B releases keep IDs fenced and late A writes preserve B',async()=>{
      laneSetup('DIRECT');const gateway=await import('cvf-model-gateway');vi.stubGlobal('fetch',vi.fn(()=>{throw Error('NETWORK_FORBIDDEN')}));let finishA!:(value:never)=>void;let calls=0;
      const execute=vi.spyOn(gateway.CanonicalExecutionAdapter.prototype,'execute').mockImplementation(async()=>{calls++;if(calls===1)return await new Promise(resolve=>{finishA=resolve;});throw Error('fixture_unknown_B');});
      const pendingA=run();for(let n=0;n<2000&&calls===0;n++)await new Promise(resolve=>setTimeout(resolve,1));expect(calls).toBe(1);
      const a=status().execution!;vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(Date.parse(a.updatedAt)+300000);expect((await release()).ok).toBe(true);
      await run();const b=status().execution!;vi.setSystemTime(Date.parse(b.updatedAt)+300000);expect((await release()).ok).toBe(true);expect(status().heldRelease?.count).toBe(2);expect(execute).toHaveBeenCalledTimes(2);
      const lineage=await import('@/lib/server/canonical-web-lineage');for(const v of [a,b])expect(lineage.reserve(journalConfig,owner(),{canonicalId:v.canonicalId,contractRevision:v.contractRevision,sourceRevision:v.sourceRevision})).toMatchObject({reason:'HELD_RELEASED'});
      finishA(payload(a.canonicalId) as never);expect((await pendingA).status).toBe(200);expect(status().execution?.canonicalId).toBe(b.canonicalId);
      const row=lineage.createLineageStore(journalConfig).readKeys([lineage.requestKey('org-1',a.canonicalId)])[0];if(row.state!=='PRESENT')throw Error('row');const record=lineage.validateRequestRecord(row.value)!;expect(record.ownerRelease).toBeTruthy();expect(record.state).toBe('FINALIZED');expect(record.entries[0].state).toBe('SETTLED');
      const maintenance=await import('@/lib/server/canonical-web-lineage-maintenance');expect(maintenance.archiveLineage(journalConfig,{now:Date.now()+86400000*2}).archived).toBe(1);expect(lineage.reserve(journalConfig,owner(),{canonicalId:a.canonicalId,contractRevision:a.contractRevision,sourceRevision:a.sourceRevision}).ok).toBe(false);expect(status().execution?.canonicalId).toBe(b.canonicalId);expect(execute).toHaveBeenCalledTimes(2);
    });
});
