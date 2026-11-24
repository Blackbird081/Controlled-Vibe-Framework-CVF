import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { SQLiteKeyedAtomicRecordStore } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store';
import { _testOnlySetStoreHooks, buildArchiveRecord, buildInitialMetadata, finalize, parseLineageConfig, provisionTenantMetadata, readLineage, requestKey, reserve, resolveSessionIdentity, settle, validateMetadata, validateRequestRecord, type LineageConfig, type LineageFailure, type LineageIdentity, type LineageRef } from './canonical-web-lineage';

// Vitest runs from the cvf-web package root; jsdom's import.meta.url is not a file URL.
const nativeSource = path.resolve(process.cwd(), '../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store.ts');
const nodeRequire = createRequire(nativeSource);
const NAMESPACE = 'cvf-web-lineage-test';
const DATABASE_FILE = 'cvf-keyvalue-store.sqlite';

const cleanups: (() => void)[] = [];
afterEach(() => {
    _testOnlySetStoreHooks(undefined);
    while (cleanups.length) cleanups.pop()!();
});

type TenantSpec = { tenantId: string; activeSlots?: number; archiveSlots?: number };
function tempDir(prefix = 'cvf-web-lineage-'): string {
    const directory = mkdtempSync(path.join(tmpdir(), prefix));
    cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
    return directory;
}
function makeConfig(directory: string, overrides: Record<string, unknown> = {}): LineageConfig {
    const raw = {
        schema: 'cvf.webLineageConfig.v1', revision: 1, directory, namespace: NAMESPACE,
        tenants: [{ tenantId: 'org-a', activeSlots: 3, archiveSlots: 3 }, { tenantId: 'org-b', activeSlots: 3, archiveSlots: 3 }] as TenantSpec[],
        servicePrincipal: { principalId: 'svc-1', tenantId: 'org-a' },
        ...overrides,
    };
    const parsed = parseLineageConfig(JSON.stringify(raw));
    if (!parsed.ok) throw new Error(`config ${parsed.reason}`);
    return parsed.config;
}
function fixture(overrides: Record<string, unknown> = {}) {
    const directory = tempDir();
    SQLiteKeyedAtomicRecordStore.initialize(directory);
    const config = makeConfig(directory, overrides);
    const provisioned = provisionTenantMetadata(config);
    expect(provisioned.ok).toBe(true);
    return { directory, config };
}
function sessionIdentity(config: LineageConfig, orgId = 'org-a', userId = 'user-1', teamId = 'team-1'): LineageIdentity {
    const resolved = resolveSessionIdentity(config, { qualified: true, userId, orgId, teamId });
    if (!resolved.ok) throw new Error(`identity ${resolved.reason}`);
    return resolved.value;
}
const ref = (canonicalId: string): LineageRef => ({ canonicalId, contractRevision: 'contract-1', sourceRevision: 'src-1' });
function rawDb(directory: string) {
    const Database = nodeRequire('better-sqlite3') as new (file: string) => {
        prepare(sql: string): { run(...a: unknown[]): unknown; all(...a: unknown[]): unknown[]; get(...a: unknown[]): unknown };
        close(): void;
    };
    const db = new Database(path.join(directory, DATABASE_FILE));
    cleanups.push(() => { try { db.close(); } catch { /* already closed */ } });
    return db;
}
function rawRow(directory: string, id: string): { revision: number; item_json: string } | undefined {
    return rawDb(directory).prepare('SELECT revision, item_json FROM atomic_key_value_store WHERE namespace = ? AND id = ?').get(NAMESPACE, id) as { revision: number; item_json: string } | undefined;
}
function expectFailure(result: { ok: boolean }, code: string, reason?: string): LineageFailure {
    expect(result.ok).toBe(false);
    const failure = result as LineageFailure;
    expect(failure.code).toBe(code);
    if (reason !== undefined) expect(failure.reason).toBe(reason);
    return failure;
}
const invoked = { attemptOutcome: 'invoked', callbackAttemptIndex: 0, provider: 'alibaba', model: 'qwen-plus', gatewayReceiptIds: ['rcpt-1'], usageProvenance: 'unknown' };

import { admitProviderCall, releaseHeldExecution, digest16, validHeldRelease, validOwnerRelease, HELD_RELEASE_CONTROL_BYTES } from './canonical-web-held-release';
import { controlOperation, initialControl, validControls } from './canonical-web-admission-control';
import { archiveLineage } from './canonical-web-lineage-maintenance';
afterEach(() => {vi.useRealTimers();vi.restoreAllMocks();});
const clock = () => { let now=Date.parse('2026-11-16T00:00:00.000Z'); vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(now);return (delta:number)=>{now+=delta;vi.setSystemTime(now);return now;}; };
const status = (config:LineageConfig,identity:LineageIdentity) => {const r=controlOperation(config,identity,{action:'status'});if(!r.ok)throw Error(r.reason);return r.value;};
const release = (config:LineageConfig,identity:LineageIdentity,id:string) => releaseHeldExecution(config,identity,id,status(config,identity).revision);
const readRecord=(config:LineageConfig,id:string)=> { const store=new SQLiteKeyedAtomicRecordStore(config.directory,config.namespace,{maxRowBytes:49152,maxRowBytesFor:id=>id.startsWith("m:")?49152:16384});return store.readKeys([requestKey('org-a',id)])[0]; };
describe('held execution SQLite release contract',()=>{
 it('D2/D3 exact age, stale revision, permanent marker and unchanged evidence',()=>{
  const tick=clock(),{config}=fixture();const id=sessionIdentity(config);expect(reserve(config,id,ref('A')).ok).toBe(true);const before=readRecord(config,'A');
  tick(299999);expectFailure(release(config,id,'A'),'CONFLICT','RELEASE_TOO_EARLY');tick(1);
  expectFailure(releaseHeldExecution(config,id,'A',2),'CONFLICT','RELEASE_NOT_APPLICABLE');expect(release(config,id,'A').ok).toBe(true);
  const after=readRecord(config,'A');expect(after.state).toBe('PRESENT');if(after.state!=='PRESENT'||before.state!=='PRESENT')throw Error('row');
  expect(after.value).toEqual({...before.value as object,ownerRelease:{releasedAt:new Date(Date.now()).toISOString(),controlRevision:1}});
  expectFailure(reserve(config,id,ref('A')),'CONFLICT','HELD_RELEASED');expectFailure(admitProviderCall(config,id,ref('A'),1),'CONFLICT','HELD_RELEASED');
  expect(status(config,id)).toMatchObject({execution:{canonicalId:'A',active:true},heldRelease:{count:1,idDigest:digest16('A')}});
 });
 it('F9 two releases refuse both old IDs; D8 release count never resets',()=>{
  const tick=clock(),{config}=fixture({tenants:[{tenantId:'org-a',activeSlots:6,archiveSlots:6}]});const id=sessionIdentity(config);
  for(const name of ['A','B','C']){expect(reserve(config,id,ref(name)).ok).toBe(true);tick(300000);expect(release(config,id,name).ok).toBe(true);}
  expect(status(config,id).heldRelease?.count).toBe(3);for(const name of ['A','B','C'])expectFailure(reserve(config,id,ref(name)),'CONFLICT','HELD_RELEASED');
  expect(reserve(config,id,ref('D')).ok).toBe(true);tick(300000);expectFailure(release(config,id,'D'),'CAPACITY','HELD_RELEASE_LIMIT');
 });
 it('D8 full tenant refuses release without changing record or revision',()=>{
  const tick=clock(),{config}=fixture({tenants:[{tenantId:'org-a',activeSlots:1,archiveSlots:1}]});const id=sessionIdentity(config);reserve(config,id,ref('A'));tick(300000);
  const before=readRecord(config,'A');expectFailure(release(config,id,'A'),'CAPACITY','HELD_RELEASE_LIMIT');expect(readRecord(config,'A')).toEqual(before);expect(status(config,id).revision).toBe(0);
 });
 it('F10 late settle/finalize keep B pointer and marker through ordinary archive',()=>{
  const tick=clock(),{config}=fixture();const id=sessionIdentity(config);reserve(config,id,ref('A'));tick(300000);expect(release(config,id,'A').ok).toBe(true);reserve(config,id,ref('B'));
  expect(settle(config,id,ref('A'),1,invoked).ok).toBe(true);expect(finalize(config,id,ref('A'),{disposition:'COMPLETED'}).ok).toBe(true);
  expect(status(config,id).execution?.canonicalId).toBe('B');const row=readRecord(config,'A');if(row.state!=='PRESENT')throw Error('row');expect(validateRequestRecord(row.value)?.ownerRelease).toBeDefined();
  const report=archiveLineage(config,{now:Date.now()+86400000*2});expect(report.archived).toBe(1);expectFailure(reserve(config,id,ref('A')),'CONFLICT'); // Existing newer-pointer refusal may precede archive refusal.
  const view=readLineage(config,id,'A');expect(view.ok&&view.value.location).toBe('ARCHIVE');
 });
 it.each([239999,240000])('D13 deadline %i and invalid reference/ordinal fail closed',age=>{
  const tick=clock(),{config}=fixture();const id=sessionIdentity(config);reserve(config,id,ref('A'));tick(age);
  expectFailure(admitProviderCall(config,id,{...ref('A'),sourceRevision:'wrong'},1),'CONFLICT','INVALID_CALL_ADMISSION');expectFailure(admitProviderCall(config,id,ref('A'),0),'CONFLICT','INVALID_CALL_ADMISSION');
  const result=admitProviderCall(config,id,ref('A'),1);if(age===240000)expectFailure(result,'CONFLICT','EXECUTION_DEADLINE_EXCEEDED');else{expect(result.ok).toBe(true);tick(299999);expectFailure(release(config,id,'A'),'CONFLICT','RELEASE_TOO_EARLY');tick(1);expect(release(config,id,'A').ok).toBe(true);}
 });
 it.each(['beforeCommit','afterCommit'] as const)('release and gate %s transaction faults preserve atomicity',hook=>{
  const tick=clock(),{config}=fixture();const id=sessionIdentity(config);reserve(config,id,ref('A'));const before=readRecord(config,'A');
  tick(1);_testOnlySetStoreHooks({[hook](){throw Error('fixture')}});expect(admitProviderCall(config,id,ref('A'),1).ok).toBe(false);_testOnlySetStoreHooks(undefined);
  const gated=readRecord(config,'A');if(hook==='beforeCommit')expect(gated).toEqual(before);else expect(gated).not.toEqual(before);
  tick(300000);_testOnlySetStoreHooks({[hook](){throw Error('fixture')}});expect(releaseHeldExecution(config,id,'A',0).ok).toBe(false);_testOnlySetStoreHooks(undefined);
  const row=readRecord(config,'A');if(row.state!=='PRESENT')throw Error('row');expect(!!validateRequestRecord(row.value)?.ownerRelease).toBe(hook==='afterCommit');
 });
 it('legacy records and exact additive marker schemas validate',()=>{
  const {config}=fixture(),id=sessionIdentity(config);reserve(config,id,ref('A'));const row=readRecord(config,'A');if(row.state!=='PRESENT')throw Error('row');expect(validateRequestRecord(row.value)).not.toBeNull();
  expect(validOwnerRelease({releasedAt:'2026-11-16T00:00:00.000Z',controlRevision:1,extra:true})).toBe(false);expect(validHeldRelease({releasedAt:'2026-11-16T00:00:00.000Z',count:4,idDigest:'a'.repeat(16)})).toBe(false);
 });
});

    it('a maximum-size four-entry envelope stays within the 15000-byte record body and the 16 KiB request and archive rows', () => {
        const { config, directory } = fixture();
        const identity = sessionIdentity(config);
        const refs = ['r'.repeat(120), 's'.repeat(120), 't'.repeat(120)];
        const maximal = { attemptOutcome: 'invoked', callbackAttemptIndex: 99, provider: 'p'.repeat(64), model: 'm'.repeat(96), gatewayReceiptIds: refs, receiptDecision: 'fallback', manifestDigest: 'f'.repeat(64), manifestDisposition: 'not_built_precondition_stopped', usageProvenance: 'provider_reported_partial_or_complete', usage: { inputTokens: 999999999, outputTokens: 999999999, totalTokens: 999999999 }, statusCode: 'q'.repeat(64), httpStatus: 599, errorCode: 'e'.repeat(64) };
        const long = { canonicalId: 'c'.repeat(100), contractRevision: 'v'.repeat(80), sourceRevision: 'w'.repeat(80), contextRefs: Array.from({ length: 8 }, () => 'x'.repeat(120)) };
        expect(reserve(config, identity, long).ok).toBe(true);
        for (const ordinal of [1, 2, 3, 4]) {
            expect(settle(config, identity, long, ordinal, maximal).ok).toBe(true);
            if (ordinal < 4) expect(reserve(config, identity, long).ok).toBe(true);
        }
        expect(finalize(config, identity, long, { disposition: 'COMPLETED', validationRef: 'v'.repeat(120), guardRef: 'g'.repeat(120), sot3Ref: 's'.repeat(120), auditRef: 'a'.repeat(120), namedGaps: ['G1', 'G2', 'G3', 'G4', 'G5'] }).ok).toBe(true);
        const item = rawRow(directory, requestKey('org-a', long.canonicalId))!.item_json;
        expect(Buffer.byteLength(item)).toBeLessThan(15000);
        const released={...JSON.parse(item),ownerRelease:{releasedAt:'2026-11-16T00:00:00.000Z',controlRevision:Number.MAX_SAFE_INTEGER}};expect(validateRequestRecord(released)).not.toBeNull();expect(Buffer.byteLength(JSON.stringify(released))).toBeLessThanOrEqual(15000);const archived = buildArchiveRecord(validateRequestRecord(released)!, 4, '2026-11-12T00:00:00.000Z');
        expect(Buffer.byteLength(JSON.stringify(archived))).toBeLessThanOrEqual(16384);console.log('D9_REQUEST_BYTES '+Buffer.byteLength(item)+' RELEASED_REQUEST_BYTES '+Buffer.byteLength(JSON.stringify(released))+' ARCHIVE_BYTES '+Buffer.byteLength(JSON.stringify(archived)));
    });

it('D9 all 32 realizable maximal controls plus maximum metadata fit the fixed row',()=>{
 const {config}=fixture(),identity=sessionIdentity(config);const timestamp='2026-11-16T00:00:00.000Z';
 const execution={canonicalId:'c'.repeat(100),contractRevision:'r'.repeat(80),sourceRevision:'s'.repeat(80),state:'FINALIZED' as const,active:false,recordingStatus:'CONFIRMED' as const,providerContact:'POSSIBLE_OR_OBSERVED' as const,continuationHold:false,pendingOrdinals:0,terminalDisposition:'VALIDATION_FAILED',gaps:['VALIDATION_NOT_RECORDED','GUARD_NOT_RECORDED','SOT3_NOT_RECORDED','AUDIT_NOT_RECORDED',...Array.from({length:4},(_,i)=>'x'.repeat(63)+i)],updatedAt:timestamp};
 const controls=Array.from({length:32},(_,i)=>({...initialControl({...identity,owner:{kind:'session' as const,orgId:'org-a',teamId:'t',userId:`u${i}`}}),state:'STOPPED' as const,revision:Number.MAX_SAFE_INTEGER,updatedAt:timestamp,execution,heldRelease:{count:3,idDigest:'f'.repeat(16),releasedAt:timestamp}}));
 expect(validControls(controls)).toBe(true);const meta={...buildInitialMetadata(config,config.tenants[0]),tenantId:'x'.repeat(64),configRevision:Number.MAX_SAFE_INTEGER,activeSlots:100,archiveSlots:100,activeUsed:100,archiveUsed:100,activeBytes:1638400,archiveBytes:1638400,admissionControls:controls};expect(validateMetadata(meta)).not.toBeNull();const bytes=Buffer.byteLength(JSON.stringify(meta));console.log('D9_METADATA_BYTES '+bytes+' CONTROL_ADDITION '+HELD_RELEASE_CONTROL_BYTES);expect(bytes).toBeLessThanOrEqual(49152);
});

// HREL-C1: negative heldRelease schema cases and a control that only fits because of the heldRelease byte allowance.
it('D9 rejects a malformed heldRelease marker directly and inside validControls',()=>{
 const {config}=fixture(),identity=sessionIdentity(config);const timestamp='2026-11-16T00:00:00.000Z';const good={count:1,idDigest:'a'.repeat(16),releasedAt:timestamp};
 expect(validHeldRelease(good)).toBe(true);expect(validHeldRelease({...good,count:3})).toBe(true);
 const bad:Record<string,unknown>[]=[{...good,count:0},{...good,count:-1},{...good,count:1.5},{...good,count:'1'},{...good,idDigest:'A'.repeat(16)},{...good,idDigest:'g'.repeat(16)},{...good,idDigest:'a'.repeat(15)},{...good,idDigest:'a'.repeat(17)},{...good,releasedAt:'2026-11-16'},{...good,releasedAt:'not-a-date'},{count:1,idDigest:'a'.repeat(16)},{...good,extra:1}];
 for(const marker of bad)expect(validHeldRelease(marker)).toBe(false);
 const control={...initialControl(identity),state:'OPEN' as const,revision:2,updatedAt:timestamp};
 expect(validControls([{...control,heldRelease:good}])).toBe(true);
 for(const marker of [...bad,null,[],'x'])expect(validControls([{...control,heldRelease:marker}])).toBe(false);
});

it('D9 per-control byte bound rises by exactly the heldRelease allowance',()=>{
 const {config}=fixture(),identity=sessionIdentity(config);const timestamp='2026-11-16T00:00:00.000Z';
 const execution=(gaps:string[])=>({canonicalId:'c'.repeat(120),contractRevision:'r'.repeat(120),sourceRevision:'s'.repeat(120),state:'FINALIZED' as const,active:false,recordingStatus:'CONFIRMED' as const,providerContact:'POSSIBLE_OR_OBSERVED' as const,continuationHold:false,pendingOrdinals:0,terminalDisposition:'VALIDATION_FAILED',gaps,updatedAt:timestamp});
 const sized=(target:number,withMarker:boolean)=>{const gaps:string[]=[];const make=()=>({...initialControl(identity),state:'STOPPED' as const,revision:9,updatedAt:timestamp,execution:execution(gaps),...(withMarker?{heldRelease:{count:3,idDigest:'f'.repeat(16),releasedAt:timestamp}}:{})});
  const size=()=>Buffer.byteLength(JSON.stringify(make()));while(gaps.length<8&&size()+(gaps.length?123:122)<=target)gaps.push('g'.repeat(120));
  let room=target-size();if(room>0&&room<(gaps.length?4:3)){gaps[gaps.length-1]='g'.repeat(117);room+=3;}if(room>0)gaps.push('g'.repeat(room-(gaps.length?3:2)));
  const c=make();expect(Buffer.byteLength(JSON.stringify(c))).toBe(target);return c;};
 const limit=1440+HELD_RELEASE_CONTROL_BYTES;
 expect(HELD_RELEASE_CONTROL_BYTES).toBeGreaterThan(0);
 expect(validControls([sized(limit,true)])).toBe(true);
 expect(validControls([sized(limit+1,true)])).toBe(false);
 expect(validControls([sized(1440,false)])).toBe(true);
 expect(validControls([sized(1441,false)])).toBe(false);
});

it('D2 CAS race, wrong owner/ID and already released are refused',()=>{const tick=clock(),{config}=fixture(),id=sessionIdentity(config);reserve(config,id,ref('A'));tick(300000);expectFailure(releaseHeldExecution(config,sessionIdentity(config,'org-a','other'),'A',0),'CONFLICT','RELEASE_NOT_APPLICABLE');expectFailure(releaseHeldExecution(config,id,'wrong',0),'CONFLICT','RELEASE_NOT_APPLICABLE');const results=[releaseHeldExecution(config,id,'A',0),releaseHeldExecution(config,id,'A',0)];expect(results.filter(r=>r.ok)).toHaveLength(1);expectFailure(releaseHeldExecution(config,id,'A',1),'CONFLICT','RELEASE_NOT_APPLICABLE');});
it('reserve, gate and settle update current time without moving backward',()=>{const tick=clock(),{config}=fixture(),id=sessionIdentity(config);reserve(config,id,ref('A'));tick(100);expect(admitProviderCall(config,id,ref('A'),1).ok).toBe(true);const record=()=>{const r=readRecord(config,'A');if(r.state!=='PRESENT')throw Error('row');return validateRequestRecord(r.value)!;};expect(record().updatedAt).toBe(new Date(Date.now()).toISOString());tick(-50);settle(config,id,ref('A'),1,invoked);expect(Date.parse(record().updatedAt)).toBe(Date.now()+50);tick(150);reserve(config,id,ref('A'));expect(record().updatedAt).toBe(new Date(Date.now()).toISOString());tick(300000);expect(release(config,id,'A').ok).toBe(true);expectFailure(reserve(config,id,ref('A')),'CONFLICT','HELD_RELEASED');});
