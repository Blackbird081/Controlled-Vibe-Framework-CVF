import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { NextRequest,NextResponse } from 'next/server';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { CredentialBoundary,type AdapterAdmissionRecord } from 'cvf-model-gateway';
import type { AdminSession } from '@/lib/admin-session';
import { JevSuggestionCustody, jevDigest,jevPolicyDigest,type JevAuthorizedPolicy } from '@/lib/server/jev-suggestion-custody';
import { resetRateLimitStoresForTest } from '@/lib/rate-limit';
import { skillSuggestionHandlers,verifiedJevCookieBinding } from './handlers';
import { visibleRosterDigest } from '@/lib/server/jev-capability-suggestion';
vi.mock('@/lib/admin-session',()=>({requireAdminApiSession:vi.fn()}));
const directories:string[]=[];
afterEach(()=>{for(const directory of directories.splice(0))rmSync(directory,{recursive:true,force:true});});
beforeEach(()=>resetRateLimitStoresForTest());
const url='http://localhost/api/skills/suggest';
const cookie='authjs.session-token=synthetic-signed-token-fixture';
const post=(body:unknown,origin='http://localhost',sessionCookie=cookie)=>new NextRequest(url,{method:'POST',headers:{origin,'sec-fetch-site':'same-origin','Content-Type':'application/json',cookie:sessionCookie},body:JSON.stringify(body)});
const get=(suffix='',sessionCookie=cookie)=>new NextRequest(url+suffix,{headers:{cookie:sessionCookie}});
function fixture(){
  const clock=Date.now();const directory=mkdtempSync(path.join(tmpdir(),'cvf-jev-route-owned-'));directories.push(directory);
  const session={authMode:'session',expiresAt:clock+600000,userId:'fixture',orgId:'org',teamId:'team',role:'owner',user:'fixture'} as AdminSession;
  const policy:JevAuthorizedPolicy={schema:'cvf.jevAuthorizedPolicy.v1',policyDigest:'',effectAuthorizationRef:'synthetic-effect',dataBoundaryRef:'synthetic-data',costEnvelopeRef:'synthetic-cost',authorizationEvidenceDigest:jevDigest('authorized-fixture-not-live'),destination:'https://api.typesafe.ai/v1/systemone',directory,writerIdentity:'synthetic-test',resultRetentionMs:300000,tombstoneRetentionMs:86400000,currency:'USD',wideMaxMicrounits:10,narrowMaxMicrounits:20,totalMaxMicrounits:30,pricingIdentity:'synthetic-price',reportedModels:['jev-fixture'],expiresAt:new Date(clock+600000).toISOString()};policy.policyDigest=jevPolicyDigest(policy);
  const admission={status:'admitted',providerId:'typesafe',modelId:'jev-latest',requestedMethod:'system_one',normalizedMethod:'system_one',supportedMethods:['system_one'],conformanceStatus:'conformant',liveExecutionAuthorized:false} as unknown as AdapterAdmissionRecord;
  const transport=vi.fn(async()=>new Response(JSON.stringify({model:'jev-fixture',answers:{which:{type:'choice',choice:'s0',probabilities:{s0:1}},needs_workflow:{type:'noul',noul:0},prose_suffices:{type:'noul',noul:1}},usage:{input_tokens:2,output_tokens:1},raw_secret:'discarded'})));
  const auth=vi.fn(async()=>session);const deps={auth,configured:()=>true,loadAuthorizedJevPolicy:()=>policy,loadAdapterAdmission:()=>admission,roster:async()=>[{key:'s0',title:'Catalog skill',domain:'Catalog domain',domainId:'domain',skillId:'skill',description:'Catalog description',detail:'Catalog detail'}],credential:()=>new CredentialBoundary({TYPESAFE_API_KEY:'synthetic-test-secret'}),transport};
  return {session,policy,admission,auth,transport,deps,handlers:skillSuggestionHandlers(deps)};
}
describe('trusted Jev submission/read-only recovery composition',()=>{
  it('denies bad origin, signed-out/role/impersonation/breakglass/expired sessions before calls',async()=>{
    const f=fixture();const body={goal:'Plan an application',nonce:'nonce_fixture_0001'};
    expect((await f.handlers.POST(post(body,'https://foreign'))).status).toBe(403);
    expect((await skillSuggestionHandlers({...f.deps,auth:vi.fn(async()=>NextResponse.json({},{status:401}))}).POST(post(body))).status).toBe(401);
    for(const patch of [{role:'member'},{authMode:'break-glass'},{realUserId:'someone'},{impersonation:{}},{expiresAt:0}]){
      const auth=vi.fn(async()=>({...f.session,...patch}) as AdminSession);
      expect((await skillSuggestionHandlers({...f.deps,auth}).POST(post(body))).status).toBe(403);
    }
    await f.handlers.GET(get());expect(f.transport).not.toHaveBeenCalled();expect(f.auth).toHaveBeenCalledWith(expect.anything(),'/api/skills/suggest',{ownerOnly:true,allowBreakGlass:false});
  });
  it('key/flag alone are configured, never admitted/observed; GET never probes',async()=>{
    const f=fixture();const handlers=skillSuggestionHandlers({auth:f.auth,configured:()=>true});
    expect(await(await handlers.GET(get())).json()).toMatchObject({configured:true,admitted:false,observed:false,connected:false});
    expect((await handlers.POST(post({goal:'Plan an application',nonce:'nonce_fixture_0001'}))).status).toBe(503);expect(f.transport).not.toHaveBeenCalled();
  });
  it('fails closed for missing/mismatched admission and action policy, and rejects arbitrary body fields',async()=>{
    const f=fixture();const body={goal:'Plan an application',nonce:'nonce_fixture_0001'};
    for(const admission of [undefined,{...f.admission,modelId:'other'},{...f.admission,normalizedMethod:'chat'}])expect((await skillSuggestionHandlers({...f.deps,loadAdapterAdmission:()=>admission}).POST(post(body))).status).toBe(503);
    expect((await f.handlers.POST(post({...body,provider:'other'}))).status).toBe(422);
    expect((await f.handlers.POST(post({...body,goal:'short'}))).status).toBe(422);
    const duplicate=new NextRequest(url,{method:'POST',headers:{origin:'http://localhost','Content-Type':'application/json',cookie},body:'{"goal":"Plan an application","nonce":"nonce_fixture_0001","goal":"Changed application"}'});expect((await f.handlers.POST(duplicate)).status).toBe(422);
    expect((await f.handlers.POST(post({...body,goal:'x'.repeat(3000)}))).status).toBe(413);
    expect((await skillSuggestionHandlers({...f.deps,loadAuthorizedJevPolicy:()=>({...f.policy,policyDigest:'bad'})}).POST(post(body))).status).toBe(403);
    expect(f.transport).not.toHaveBeenCalled();
  });
  it('uses real production composition once, duplicate submit/reload returns same terminal version without execution',async()=>{
    const f=fixture();const body={goal:'Explain this concept simply',nonce:'nonce_fixture_0001'};
    const response=await f.handlers.POST(post(body));expect(response.status).toBe(200);const first=await response.json();
    expect(first).toMatchObject({provider:'TypeSafe Jev',state:'NO_MATCH',providerContact:'RESPONSE_OBSERVED',result:{status:'no_match',model:'jev-fixture',inputTokens:2}});
    expect(first.providerAttemptReconciliation).toMatchObject({providerCallCount:1,retryCount:0,reconciles:true});
    expect(await(await f.handlers.POST(post(body))).json()).toMatchObject({runId:first.runId,recordVersion:first.recordVersion});
    expect(await(await f.handlers.GET(get(`?runId=${first.runId}`))).json()).toMatchObject({runId:first.runId,recordVersion:first.recordVersion,result:first.result});
    expect((await f.handlers.POST(post({...body,goal:'Changed goal content'}))).status).toBe(409);
    expect((await f.handlers.GET(get(`?runId=${first.runId}`,'authjs.session-token=other-verified-fixture'))).status).toBe(404);
    expect(f.transport).toHaveBeenCalledTimes(1);expect(JSON.stringify(first)).not.toContain('synthetic-test-secret');expect(JSON.stringify(first)).not.toContain(body.goal);expect(JSON.stringify(first)).not.toContain('discarded');
  });
  it('parallel same-nonce requests have one custody winner and no replay of ambiguous send',async()=>{
    const f=fixture();f.transport.mockRejectedValue(new Error('synthetic transport loss'));
    const body={goal:'Plan an application',nonce:'nonce_fixture_0001'};const responses=await Promise.all([f.handlers.POST(post(body)),f.handlers.POST(post(body))]);const results=await Promise.all(responses.map(r=>r.json()));
    expect(results[0].runId).toBe(results[1].runId);expect(f.transport).toHaveBeenCalledTimes(1);
    const recovered=await(await f.handlers.GET(get(`?runId=${results[0].runId}`))).json();expect(recovered).toMatchObject({state:'UNKNOWN_TERMINAL',providerContact:'POSSIBLE'});
    await f.handlers.POST(post(body));expect(f.transport).toHaveBeenCalledTimes(1);
  });
  it('binds only the verified native token bytes and rejects bearer fallback or malformed chunks',()=>{
    expect(verifiedJevCookieBinding(get())).toBe(jevDigest('synthetic-signed-token-fixture'));
    expect(verifiedJevCookieBinding(get('','authjs.session-token.0=part; authjs.session-token.1=two'))).toBe(jevDigest('parttwo'));
    expect(verifiedJevCookieBinding(get('','authjs.session-token.1=two'))).toBeNull();
    expect(verifiedJevCookieBinding(new NextRequest(url,{headers:{cookie,authorization:'Bearer synthetic'}}))).toBeNull();
  });
});


it('composes two actual canonical stages with one ID, separate receipts and zero retries',async()=>{
  const f=fixture();f.transport.mockReset().mockResolvedValueOnce(new Response(JSON.stringify({model:'jev-fixture',answers:{which:{type:'choice',choice:'s0',probabilities:{s0:1}},needs_workflow:{type:'noul',noul:1},prose_suffices:{type:'noul',noul:0}},usage:{input_tokens:4,output_tokens:1}})))
    .mockResolvedValueOnce(new Response(JSON.stringify({model:'jev-fixture',answers:{which:{type:'choice',choice:'s0',probabilities:{s0:1}},fits_s0:{type:'noul',noul:1}},usage:{input_tokens:5,output_tokens:2}})));
  const response=await f.handlers.POST(post({goal:'Produce the documented catalog task',nonce:'two_stage_fixture_001'}));const result=await response.json();
  expect(response.status).toBe(200);expect(result).toMatchObject({state:'SUCCEEDED',providerContact:'RESPONSE_OBSERVED',result:{status:'suggested',href:'/skills/domain/skill',inputTokens:9,outputTokens:3},providerAttemptReconciliation:{providerCallCount:2,retryCount:0,reconciles:true}});expect(f.transport).toHaveBeenCalledTimes(2);
  const {JevSuggestionCustody}=await import('@/lib/server/jev-suggestion-custody');const run=new JevSuggestionCustody(f.policy).read({userId:'fixture',orgId:'org',teamId:'team',sessionBindingHash:jevDigest('synthetic-signed-token-fixture')},result.runId);
  expect(run.stages[0].canonicalExecutionId).toBe(run.stages[1].canonicalExecutionId);expect(run.stages[0].stageExecutionKey).not.toBe(run.stages[1].stageExecutionKey);expect(run.stages[0].gatewayReceiptId).not.toBe(run.stages[1].gatewayReceiptId);
});

it('binds the approved input and persistent one-action claim before a second provider start',async()=>{
  const f=fixture();const goal='Explain this concept simply';
  const roster=await f.deps.roster();const rosterDigest=visibleRosterDigest(roster);
  const singleAction={authorizationEvidenceDigest:f.policy.authorizationEvidenceDigest,effectAuthorizationRef:f.policy.effectAuthorizationRef,inputDigest:jevDigest(goal),rosterDigest};
  const snapshot={policy:f.policy,roster,admission:f.admission,approvedGoalDigest:jevDigest(goal),singleAction};
  const handlers=skillSuggestionHandlers({...f.deps,loadRuntimeSnapshot:async()=>snapshot});
  const first=await handlers.POST(post({goal,nonce:'action_nonce_000001'}));expect(first.status).toBe(200);
  const firstResult=await first.json();expect(firstResult.runId).toBeTruthy();expect(f.transport).toHaveBeenCalledTimes(1);
  const duplicate=await handlers.POST(post({goal,nonce:'action_nonce_000001'}));expect((await duplicate.json()).runId).toBe(firstResult.runId);
  expect((await handlers.POST(post({goal,nonce:'action_nonce_000002'}))).status).toBe(409);
  expect((await handlers.POST(post({goal:'A changed synthetic goal',nonce:'action_nonce_000003'}))).status).toBe(403);
  const drifted={...snapshot,roster:[{...roster[0],skillId:'changed'}]};
  expect((await skillSuggestionHandlers({...f.deps,loadRuntimeSnapshot:async()=>drifted}).POST(post({goal,nonce:'action_nonce_000004'}))).status).toBe(403);
  expect(f.transport).toHaveBeenCalledTimes(1);
});


it('routes a v2 missing-cost response to durable STOP and preserves historical read without runtime snapshot',async()=>{
  const f=fixture(),clock=Date.now(),goal='Plan an application',second='Explain the other task';
  const roster=await f.deps.roster();const canonical=(o:Record<string,unknown>)=>JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a],[b])=>a<b?-1:a>b?1:0)));
  const manifest={one:jevDigest(goal),two:jevDigest(second)};const price={schema:'cvf.jevPricePin.v1' as const,identity:'offline',evidenceType:'OFFLINE_SYNTHETIC' as const,evidenceDigest:jevDigest('price-evidence'),validUntil:'2099-01-01T00:00:00.000Z',currency:'USD' as const,inputMicrounitsPerMillion:100,outputMicrounitsPerMillion:100,wideInputLimit:100,wideOutputLimit:100,narrowInputLimit:100,narrowOutputLimit:100};
  const base={schema:'cvf.jevTrialSpec.v2' as const,trialId:'trial',authorizationDigest:jevDigest('authority'),sourceRevision:'JEV-S1-OPENROUTER-TRIAL-20261104',sourceDigest:jevDigest('source'),transport:'openrouter-systemone' as const,provider:'openrouter' as const,requestedModel:'typesafe/jev-1.14' as const,method:'system_one' as const,destination:'https://openrouter.ai/api/v1/systemone' as const,credentialEnv:'OPENROUTER_API_KEY' as const,reportedModels:['typesafe/jev-1.14-20261014'] as ['typesafe/jev-1.14-20261014'],rosterDigest:visibleRosterDigest(roster),manifest,manifestDigest:jevDigest(canonical(manifest)),expiresAt:new Date(clock+600000).toISOString(),maxCases:2,maxHttp:4,maxMicrounits:100,currency:'USD' as const,effectAuthorizationRef:'effect',dataBoundaryRef:'data',costEnvelopeRef:'cost',pricing:{...price,digest:jevDigest(canonical(price))},wideMaxMicrounits:20,narrowMaxMicrounits:20,resultRetentionMs:86400000};
  const spec={...base,policyDigest:jevDigest(canonical(base))};JevSuggestionCustody.provisionTrial(f.policy.directory,spec,clock);
  const admission={...f.admission,providerId:'openrouter',modelId:'typesafe/jev-1.14'};const snapshot={schema:'cvf.jevTrialRuntime.v2' as const,directory:f.policy.directory,trialSpec:spec,roster,admission};
  const transport=vi.fn(async(_url:RequestInfo|URL,_init?:RequestInit)=>new Response(JSON.stringify({model:'typesafe/jev-1.14-20261014',answers:{which:{type:'choice',choice:'s0',probabilities:{s0:1}},needs_workflow:{type:'noul',noul:1},prose_suffices:{type:'noul',noul:0}},usage:{input_tokens:2,output_tokens:1}})));
  const handlers=skillSuggestionHandlers({auth:f.auth,configured:()=>true,loadRuntimeSnapshot:async()=>snapshot,credential:()=>new CredentialBoundary({OPENROUTER_API_KEY:'synthetic'}),transport});
  const previous=process.env.CVF_JEV_CUSTODY_DIRECTORY;process.env.CVF_JEV_CUSTODY_DIRECTORY=f.policy.directory;
  try{const refused=await handlers.POST(post({goal:'A goal outside the approved manifest',nonce:'nonce_unapproved_001'}));expect(refused.status).toBe(403);expect(await refused.json()).toMatchObject({error:'ACTION_REFUSED',trialStatus:'ACTIVE',admitted:true,requestedModel:'typesafe/jev-1.14'});expect(transport).not.toHaveBeenCalled();const res=await handlers.POST(post({goal,nonce:'nonce_trial_fixture_1'}));const first=await res.json();expect(res.status).toBe(502);expect(first).toMatchObject({state:'UNKNOWN_TERMINAL',costStatus:'UNKNOWN',trialStatus:'STOPPED',admitted:false,configured:true});expect(transport).toHaveBeenCalledTimes(1);expect(transport.mock.calls[0][1]?.redirect).toBe('error');
    const blocked=await handlers.POST(post({goal:second,nonce:'nonce_trial_fixture_2'}));expect(blocked.status).toBe(503);expect(await blocked.json()).toMatchObject({trialStatus:'STOPPED',admitted:false});expect(transport).toHaveBeenCalledTimes(1);expect(await(await handlers.GET(get())).json()).toMatchObject({admitted:false,trialStatus:'STOPPED',requestedModel:'typesafe/jev-1.14',rosterMetadataEgress:true});
    const retained=skillSuggestionHandlers({auth:f.auth,loadRuntimeSnapshot:async()=>{throw Error('expired snapshot');}});expect(await(await retained.GET(get(`?runId=${first.runId}`))).json()).toMatchObject({runId:first.runId,state:'UNKNOWN_TERMINAL'});
  }finally{if(previous===undefined)delete process.env.CVF_JEV_CUSTODY_DIRECTORY;else process.env.CVF_JEV_CUSTODY_DIRECTORY=previous;}
});


it('composes v2 two-stage System One with valid cost and no fallback',async()=>{
 const f=fixture(),clock=Date.now(),goal='Plan an application',roster=await f.deps.roster();const canonical=(o:Record<string,unknown>)=>JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a],[b])=>a<b?-1:a>b?1:0)));const manifest={one:jevDigest(goal)};
 const price={schema:'cvf.jevPricePin.v1' as const,identity:'offline',evidenceType:'OFFLINE_SYNTHETIC' as const,evidenceDigest:jevDigest('price'),validUntil:'2099-01-01T00:00:00.000Z',currency:'USD' as const,inputMicrounitsPerMillion:100,outputMicrounitsPerMillion:100,wideInputLimit:100,wideOutputLimit:100,narrowInputLimit:100,narrowOutputLimit:100};
 const base={schema:'cvf.jevTrialSpec.v2' as const,trialId:'trial',authorizationDigest:jevDigest('authority'),sourceRevision:'JEV-S1-OPENROUTER-TRIAL-20261104',sourceDigest:jevDigest('source'),transport:'openrouter-systemone' as const,provider:'openrouter' as const,requestedModel:'typesafe/jev-1.14' as const,method:'system_one' as const,destination:'https://openrouter.ai/api/v1/systemone' as const,credentialEnv:'OPENROUTER_API_KEY' as const,reportedModels:['typesafe/jev-1.14-20261014'] as ['typesafe/jev-1.14-20261014'],rosterDigest:visibleRosterDigest(roster),manifest,manifestDigest:jevDigest(canonical(manifest)),expiresAt:new Date(clock+600000).toISOString(),maxCases:1,maxHttp:2,maxMicrounits:100,currency:'USD' as const,effectAuthorizationRef:'effect',dataBoundaryRef:'data',costEnvelopeRef:'cost',pricing:{...price,digest:jevDigest(canonical(price))},wideMaxMicrounits:20,narrowMaxMicrounits:20,resultRetentionMs:86400000};const spec={...base,policyDigest:jevDigest(canonical(base))};JevSuggestionCustody.provisionTrial(f.policy.directory,spec,clock);
 const admission={...f.admission,providerId:'openrouter',modelId:'typesafe/jev-1.14'};const snapshot={schema:'cvf.jevTrialRuntime.v2' as const,directory:f.policy.directory,trialSpec:spec,roster,admission};const answer=(answers:Record<string,unknown>)=>new Response(JSON.stringify({model:'typesafe/jev-1.14-20261014',answers,usage:{input_tokens:2,output_tokens:1,cost:0.000001}}));
 const transport=vi.fn().mockResolvedValueOnce(answer({which:{type:'choice',choice:'s0',probabilities:{s0:1}},needs_workflow:{type:'noul',noul:1},prose_suffices:{type:'noul',noul:0}})).mockResolvedValueOnce(answer({which:{type:'choice',choice:'s0',probabilities:{s0:1}},fits_s0:{type:'noul',noul:1}}));
 const handlers=skillSuggestionHandlers({auth:f.auth,configured:()=>true,loadRuntimeSnapshot:async()=>snapshot,credential:()=>new CredentialBoundary({OPENROUTER_API_KEY:'synthetic'}),transport});const body={goal,nonce:'nonce_trial_fixture_3'};
 const response=await handlers.POST(post(body));const result=await response.json();expect(response.status).toBe(200);expect(result).toMatchObject({state:'SUCCEEDED',result:{status:'suggested',href:'/skills/domain/skill'},providerAttemptReconciliation:{providerCallCount:2,retryCount:0}});expect(transport).toHaveBeenCalledTimes(2);expect(transport.mock.calls.every(c=>c[0]==='https://openrouter.ai/api/v1/systemone'&&c[1].redirect==='error')).toBe(true);expect((await(await handlers.POST(post(body))).json()).runId).toBe(result.runId);expect(transport).toHaveBeenCalledTimes(2);
});
