import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { SQLiteKeyedAtomicRecordStore } from '../../../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store';
const provenance = vi.hoisted(()=>vi.fn());
vi.mock('@/lib/middleware-auth',()=>({resolveVerifiedSessionProvenance:provenance}));
import { POST } from './route';
import { computeServiceRequestSignature, _testOnlyResetReplayLedger } from '@/lib/service-token-auth';
import { LINEAGE_CONFIG_ENV, createLineageStore, loadLineageConfig, parseLineageConfig, provisionTenantMetadata, requestKey, reserve, resolveSessionIdentity, type LineageConfig } from '@/lib/server/canonical-web-lineage';
let dir='';
const extraDirs:string[]=[];
const request=(body:unknown,headers:Record<string,string>={})=>new NextRequest('http://localhost/api/execute/control',{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
beforeEach(()=>{dir=mkdtempSync(path.join(tmpdir(),'control-route-'));SQLiteKeyedAtomicRecordStore.initialize(dir);const c=parseLineageConfig(JSON.stringify({schema:'cvf.webLineageConfig.v1',revision:1,directory:dir,namespace:'cvf-web-lineage-control',tenants:[{tenantId:'org',activeSlots:3,archiveSlots:3}],servicePrincipal:{principalId:'svc',tenantId:'org'}}));if(!c.ok) throw Error(c.reason);expect(provisionTenantMetadata(c.config).ok).toBe(true);vi.stubEnv(LINEAGE_CONFIG_ENV,JSON.stringify(c.config));/* hermetic: ambient .env.local AUTH_URL/NEXTAUTH_URL must not decide origin */vi.stubEnv('AUTH_URL',undefined);vi.stubEnv('NEXTAUTH_URL',undefined);_testOnlyResetReplayLedger();provenance.mockResolvedValue({qualified:true,userId:'user',teamId:'team',orgId:'org'});});
afterEach(()=>{vi.useRealTimers();vi.unstubAllEnvs();rmSync(dir,{recursive:true,force:true});while(extraDirs.length)rmSync(extraDirs.pop()!,{recursive:true,force:true});});
it('exposes ownerwide readonly status and persists Stop with explicit CAS Resume',async()=>{expect(await (await POST(request({action:'status'}))).json()).toMatchObject({success:true,control:{state:'OPEN',revision:0,ownerCapacity:{used:0}}});expect(await (await POST(request({action:'stop'}))).json()).toMatchObject({success:true,control:{state:'STOPPED',revision:1}});expect((await POST(request({action:'resume',expectedRevision:0}))).status).toBe(409);expect(await (await POST(request({action:'resume',expectedRevision:1}))).json()).toMatchObject({success:true,control:{state:'OPEN',revision:2}});});
it('denies foreign origin, malformed input and unqualified present session',async()=>{expect((await POST(request({action:'stop'},{origin:'https://evil.example'}))).status).toBe(403);expect((await POST(request({action:'stop',extra:1}))).status).toBe(400);provenance.mockResolvedValue({qualified:false,reason:'NO_SESSION'});expect((await POST(request({action:'status'},{cookie:'next-auth.session-token=invalid','x-cvf-service-token':'invalid'}))).status).toBe(401);});
it('accepts a correctly signed service body only when no session is supplied',async()=>{provenance.mockResolvedValue({qualified:false,reason:'NO_SESSION'});vi.stubEnv('CVF_SERVICE_TOKEN','service-token-test-0123456789');const body=JSON.stringify({action:'stop'});const timestamp=String(Date.now());const headers={'content-type':'application/json','x-cvf-service-token':'service-token-test-0123456789','x-cvf-service-timestamp':timestamp,'x-cvf-service-signature':computeServiceRequestSignature('service-token-test-0123456789',timestamp,body)};const req=new NextRequest('http://localhost/api/execute/control',{method:'POST',headers,body});expect(await(await POST(req)).json()).toMatchObject({success:true,control:{state:'STOPPED'}});const timestamp2=String(Date.now()+1);const signature2=computeServiceRequestSignature('service-token-test-0123456789',timestamp2,body);const denied=new NextRequest('http://localhost/api/execute/control',{method:'POST',headers:{...headers,cookie:'next-auth.session-token=invalid','x-cvf-service-timestamp':timestamp2,'x-cvf-service-signature':signature2},body});expect((await POST(denied)).status).toBe(401);});
it('each verified owner has separate state and stale snapshots cannot reopen',async()=>{await POST(request({action:'stop'}));provenance.mockResolvedValue({qualified:true,userId:'other',teamId:'team',orgId:'org'});expect(await(await POST(request({action:'status'}))).json()).toMatchObject({success:true,control:{state:'OPEN',revision:0}});expect((await POST(request({action:'resume',expectedRevision:1}))).status).toBe(409);});
it('uses configured public auth origin, never untrusted forwarding headers, and AUTH_URL takes precedence',async()=>{vi.stubEnv('NEXTAUTH_URL','http://localhost:3033');const external={origin:'http://localhost:3033','x-forwarded-host':'evil.example','x-forwarded-proto':'https'};expect((await POST(request({action:'stop'},external))).status).toBe(200);expect((await POST(request({action:'resume',expectedRevision:1},{origin:'http://localhost','x-forwarded-host':'localhost:3033'}))).status).toBe(403);expect((await POST(request({action:'resume',expectedRevision:1},{origin:'http://evil.example','x-forwarded-host':'evil.example'}))).status).toBe(403);vi.stubEnv('AUTH_URL','https://app.example/base');expect((await POST(request({action:'resume',expectedRevision:1},{origin:'http://localhost:3033'}))).status).toBe(403);expect((await POST(request({action:'resume',expectedRevision:1},{origin:'https://app.example'}))).status).toBe(200);});
it('malformed or credential-bearing configured origin fails closed',async()=>{for(const value of ['not a URL','http://user:password@localhost:3033','javascript:alert(1)','']){vi.stubEnv('AUTH_URL',value);expect((await POST(request({action:'stop'},{origin:'http://localhost'}))).status).toBe(403);}});

// B1 real-route negatives for release_held. The execution is seeded through the journal module (as the execute route does before a provider
// call); every refusal is asserted through the real control route, with the record and the control revision unchanged.
const HELD_MIN_AGE_MS = 300000;
const sessionOwner = (config: LineageConfig) => { const r = resolveSessionIdentity(config, { qualified: true, userId: 'user', orgId: 'org', teamId: 'team' }); if (!r.ok) throw Error('identity'); return r.value; };
const seedHeld = (config: LineageConfig, canonicalId: string) => { expect(reserve(config, sessionOwner(config), { canonicalId, contractRevision: 'c1', sourceRevision: 's1' }).ok).toBe(true); };
const readRow = (config: LineageConfig, canonicalId: string) => createLineageStore(config).readKeys([requestKey('org', canonicalId)])[0];
const controlStatus = async () => (await (await POST(request({ action: 'status' }))).json()).control;
const releaseHeld = (canonicalId: string, expectedRevision: number) => POST(request({ action: 'release_held', expectedRevision, canonicalId }));
function configWithSlots(activeSlots: number): LineageConfig {
  const directory = mkdtempSync(path.join(tmpdir(), 'control-route-slots-')); extraDirs.push(directory); SQLiteKeyedAtomicRecordStore.initialize(directory);
  const parsed = parseLineageConfig(JSON.stringify({ schema: 'cvf.webLineageConfig.v1', revision: 1, directory, namespace: 'cvf-web-lineage-control', tenants: [{ tenantId: 'org', activeSlots, archiveSlots: activeSlots }], servicePrincipal: { principalId: 'svc', tenantId: 'org' } }));
  if (!parsed.ok) throw Error(parsed.reason);
  expect(provisionTenantMetadata(parsed.config).ok).toBe(true);
  vi.stubEnv(LINEAGE_CONFIG_ENV, JSON.stringify(parsed.config));
  return parsed.config;
}
const currentConfig = () => { const c = loadLineageConfig(); if (!c.ok) throw Error(c.reason); return c.value; };

it('B1 release_held with a stale expectedRevision is refused 409 RELEASE_NOT_APPLICABLE even after the 300000 ms floor, and the record is unchanged', async () => {
  const config = currentConfig(); seedHeld(config, 'held-a');
  expect((await POST(request({ action: 'stop' }))).status).toBe(200); // control revision 0 -> 1, so a client holding 0 is stale
  const held = (await controlStatus()).execution; expect(held).toMatchObject({ canonicalId: 'held-a', active: true });
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(Date.parse(held.updatedAt) + HELD_MIN_AGE_MS);
  const before = readRow(config, 'held-a'); const beforeControl = await controlStatus(); expect(beforeControl.revision).toBe(1);
  const stale = await releaseHeld('held-a', 0); const data = await stale.json();
  expect(stale.status).toBe(409); expect(data).toMatchObject({ success: false, code: 'RELEASE_NOT_APPLICABLE' });
  expect(readRow(config, 'held-a')).toEqual(before); expect(await controlStatus()).toMatchObject({ revision: 1, state: 'STOPPED' }); expect((await controlStatus()).heldRelease).toBeUndefined();
  // Positive control: the same request with the fresh revision is accepted, so the refusal above was the revision and nothing else.
  const fresh = await releaseHeld('held-a', 1); expect(fresh.status).toBe(200); expect((await fresh.json()).control).toMatchObject({ revision: 2, heldRelease: { count: 1 } });
});

it('B1 release_held before the 300000 ms floor is refused 409 RELEASE_TOO_EARLY with releasableAt and leaves the record unchanged', async () => {
  const config = currentConfig(); seedHeld(config, 'held-a');
  const held = (await controlStatus()).execution; const at = Date.parse(held.updatedAt) + HELD_MIN_AGE_MS;
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(at - 1);
  const before = readRow(config, 'held-a');
  const early = await releaseHeld('held-a', 0); const data = await early.json();
  expect(early.status).toBe(409); expect(data).toMatchObject({ success: false, code: 'RELEASE_TOO_EARLY', releasableAt: new Date(at).toISOString() });
  expect(readRow(config, 'held-a')).toEqual(before); expect(await controlStatus()).toMatchObject({ revision: 0 });
  vi.setSystemTime(at); expect((await releaseHeld('held-a', 0)).status).toBe(200);
});

it('B1 a 4th owner release is refused 503 HELD_RELEASE_LIMIT and leaves the record, count and revision unchanged', async () => {
  const config = configWithSlots(6); const owner = sessionOwner(config);
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(Date.parse('2026-11-16T00:00:00.000Z'));
  for (const id of ['held-a', 'held-b', 'held-c']) {
    seedHeld(config, id); vi.setSystemTime(Date.now() + HELD_MIN_AGE_MS);
    const released = await releaseHeld(id, (await controlStatus()).revision); expect(released.status).toBe(200);
  }
  expect(await controlStatus()).toMatchObject({ revision: 3, heldRelease: { count: 3 } });
  seedHeld(config, 'held-d'); vi.setSystemTime(Date.now() + HELD_MIN_AGE_MS);
  const before = readRow(config, 'held-d'); const beforeControl = await controlStatus();
  const fourth = await releaseHeld('held-d', beforeControl.revision); const data = await fourth.json();
  expect(fourth.status).toBe(503); expect(data).toMatchObject({ success: false, code: 'HELD_RELEASE_LIMIT' }); expect(data.error).toMatch(/Release capacity exhausted/);
  expect(readRow(config, 'held-d')).toEqual(before);
  const afterControl = await controlStatus(); expect(afterControl.revision).toBe(beforeControl.revision); expect(afterControl.heldRelease).toEqual(beforeControl.heldRelease); expect(afterControl.heldRelease.count).toBe(3);
  expect(owner.tenantId).toBe('org');
});
