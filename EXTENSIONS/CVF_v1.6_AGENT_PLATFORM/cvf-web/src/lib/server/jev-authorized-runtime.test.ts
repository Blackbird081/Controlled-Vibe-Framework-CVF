import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { jevDigest, jevPolicyDigest, type JevAuthorizedPolicy } from './jev-suggestion-custody';
import { JEV_APPROVED_GOAL_DIGEST, loadJevAuthorizedRuntime } from './jev-authorized-runtime';
import { visibleRosterDigest, type SkillCandidate } from './jev-capability-suggestion';

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function fixture() {
  const directory = mkdtempSync(path.join(tmpdir(), 'cvf-jev-runtime-owned-'));
  roots.push(directory);
  const now = Date.parse('2026-10-26T10:00:00.000Z');
  const policy: JevAuthorizedPolicy = {
    schema: 'cvf.jevAuthorizedPolicy.v1', policyDigest: '', effectAuthorizationRef: 'synthetic-effect',
    dataBoundaryRef: 'synthetic-data', costEnvelopeRef: 'synthetic-cost',
    authorizationEvidenceDigest: jevDigest('synthetic-authorization'),
    destination: 'https://api.typesafe.ai/v1/systemone', directory, writerIdentity: 'synthetic-test',
    resultRetentionMs: 60_000, tombstoneRetentionMs: 86_400_000, currency: 'USD',
    wideMaxMicrounits: 5_000, narrowMaxMicrounits: 5_000, totalMaxMicrounits: 10_000,
    pricingIdentity: 'synthetic-pricing', reportedModels: ['jev-1.14.0', 'jev-latest'],
    expiresAt: new Date(now + 600_000).toISOString(),
  };
  policy.policyDigest = jevPolicyDigest(policy);
  const roster: SkillCandidate[] = [{ key: 's0', title: 'Catalog skill', domain: 'Catalog domain',
    domainId: 'domain', skillId: 'skill', description: 'Catalog description', detail: 'Catalog detail' }];
  const policyPath = path.join(directory, 'authorized-policy.json');
  const approvedGoalDigest = JEV_APPROVED_GOAL_DIGEST;
  const wrapper = { schema: 'cvf.jevSingleActionRuntime.v1', policy, approvedGoalDigest,
    approvedRosterDigest: visibleRosterDigest(roster) };
  const write = (value: unknown) => writeFileSync(policyPath, JSON.stringify(value), 'utf8');
  write(wrapper);
  return { now, policy, roster, policyPath, wrapper, write, approvedGoalDigest };
}

describe('trusted server single-action snapshot', () => {
  it('loads an exact policy, roster and native structural admission without invocation', async () => {
    const f = fixture();
    const snapshot = await loadJevAuthorizedRuntime({ policyPath: f.policyPath, now: f.now, loadRoster: async () => f.roster });
    expect(snapshot).toMatchObject({ policy: f.policy, approvedGoalDigest: f.approvedGoalDigest,
      admission: { status: 'admitted', providerId: 'typesafe', modelId: 'jev-latest',
        requestedMethod: 'system_one', liveExecutionAuthorized: false },
      singleAction: { authorizationEvidenceDigest: f.policy.authorizationEvidenceDigest,
        inputDigest: f.approvedGoalDigest, rosterDigest: visibleRosterDigest(f.roster) } });
  });
  it('fails closed for absent, relative, unreadable, oversized, malformed and drifted configuration', async () => {
    const f = fixture();
    const load = (policyPath: string) => loadJevAuthorizedRuntime({ policyPath, now: f.now, loadRoster: async () => f.roster });
    await expect(load('relative.json')).rejects.toThrow('ACTION_REFUSED');
    await expect(load(path.join(path.dirname(f.policyPath), 'absent.json'))).rejects.toThrow('ACTION_REFUSED');
    await expect(load(path.dirname(f.policyPath))).rejects.toThrow('ACTION_REFUSED');
    f.write('x'.repeat(64_001)); await expect(load(f.policyPath)).rejects.toThrow('ACTION_REFUSED');
    f.write('{'); await expect(load(f.policyPath)).rejects.toThrow('ACTION_REFUSED');
    f.write({ ...f.wrapper, extra: true }); await expect(load(f.policyPath)).rejects.toThrow('ACTION_REFUSED');
    f.write({ ...f.wrapper, policy: { ...f.policy, policyDigest: 'wrong' } }); await expect(load(f.policyPath)).rejects.toThrow('ACTION_REFUSED');
    f.write({ ...f.wrapper, approvedGoalDigest: jevDigest('different synthetic goal') }); await expect(load(f.policyPath)).rejects.toThrow('ACTION_REFUSED');
    const otherModel={...f.policy,reportedModels:['jev-another']};otherModel.policyDigest=jevPolicyDigest(otherModel);
    f.write({ ...f.wrapper, policy: otherModel }); await expect(load(f.policyPath)).rejects.toThrow('ACTION_REFUSED');
    f.write(f.wrapper);
    await expect(loadJevAuthorizedRuntime({ policyPath: f.policyPath, now: f.now, loadRoster: async () => [{ ...f.roster[0], skillId: 'changed' }] })).rejects.toThrow('ACTION_REFUSED');
  });
});


it('requires a verified unexpired price and source-bound server directory for the v2 snapshot',async()=>{
 const f=fixture(),directory=path.dirname(f.policyPath),goal=jevDigest('synthetic goal');const canonical=(o:Record<string,unknown>)=>JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a],[b])=>a<b?-1:a>b?1:0)));
 const manifest={one:goal};const p={schema:'cvf.jevPricePin.v1' as const,identity:'fixture',evidenceType:'VERIFIED' as const,evidenceDigest:jevDigest('fixture proof'),validUntil:new Date(f.now+600000).toISOString(),currency:'USD' as const,inputMicrounitsPerMillion:100,outputMicrounitsPerMillion:100,wideInputLimit:100,wideOutputLimit:100,narrowInputLimit:100,narrowOutputLimit:100};
 function wrap(price:Omit<typeof p,'evidenceType'>&{evidenceType:'VERIFIED'|'OFFLINE_SYNTHETIC'}){const base={schema:'cvf.jevTrialSpec.v2' as const,trialId:'trial',authorizationDigest:jevDigest('auth'),sourceRevision:'JEV-S1-OPENROUTER-TRIAL-20261104',sourceDigest:jevDigest('source'),transport:'openrouter-systemone' as const,provider:'openrouter' as const,requestedModel:'typesafe/jev-1.14' as const,method:'system_one' as const,destination:'https://openrouter.ai/api/v1/systemone' as const,credentialEnv:'OPENROUTER_API_KEY' as const,reportedModels:['typesafe/jev-1.14-20261014'] as ['typesafe/jev-1.14-20261014'],rosterDigest:visibleRosterDigest(f.roster),manifest,manifestDigest:jevDigest(canonical(manifest)),expiresAt:new Date(f.now+600000).toISOString(),maxCases:1,maxHttp:2,maxMicrounits:100,currency:'USD' as const,effectAuthorizationRef:'effect',dataBoundaryRef:'data',costEnvelopeRef:'cost',pricing:{...price,digest:jevDigest(canonical(price))},wideMaxMicrounits:20,narrowMaxMicrounits:20,resultRetentionMs:86400000};return {schema:'cvf.jevTrialRuntime.v2',directory,trialSpec:{...base,policyDigest:jevDigest(canonical(base))}};}
 const oldDir=process.env.CVF_JEV_CUSTODY_DIRECTORY,oldSource=process.env.CVF_JEV_SOURCE_DIGEST;process.env.CVF_JEV_CUSTODY_DIRECTORY=directory;process.env.CVF_JEV_SOURCE_DIGEST=jevDigest('source');
 try{f.write(wrap(p));expect(await loadJevAuthorizedRuntime({policyPath:f.policyPath,now:f.now,loadRoster:async()=>f.roster})).toMatchObject({schema:'cvf.jevTrialRuntime.v2',admission:{providerId:'openrouter',modelId:'typesafe/jev-1.14',liveExecutionAuthorized:false}});
 f.write(wrap({...p,evidenceType:'OFFLINE_SYNTHETIC'}));await expect(loadJevAuthorizedRuntime({policyPath:f.policyPath,now:f.now,loadRoster:async()=>f.roster})).rejects.toThrow('ACTION_REFUSED');
 f.write(wrap(p));process.env.CVF_JEV_SOURCE_DIGEST=jevDigest('different');await expect(loadJevAuthorizedRuntime({policyPath:f.policyPath,now:f.now,loadRoster:async()=>f.roster})).rejects.toThrow('ACTION_REFUSED');
 }finally{if(oldDir===undefined)delete process.env.CVF_JEV_CUSTODY_DIRECTORY;else process.env.CVF_JEV_CUSTODY_DIRECTORY=oldDir;if(oldSource===undefined)delete process.env.CVF_JEV_SOURCE_DIGEST;else process.env.CVF_JEV_SOURCE_DIGEST=oldSource;}
});
