import { describe,it,expect,vi } from 'vitest';
import { mkdtempSync,rmSync,writeFileSync,realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { JevSuggestionCustody,validateJevRun,jevDigest,jevPolicyDigest,JEV_RECIPE_REVISION,JEV_SOURCE_REVISION,type JevActionGrant,type JevAuthorizedPolicy,type JevRun,type JevStoredResult } from './jev-suggestion-custody';
function fixture(){
  const directory=mkdtempSync(path.join(tmpdir(),'cvf-jev-custody-owned-'));let clock=Date.parse('2026-10-26T10:00:00.000Z');
  const policy:JevAuthorizedPolicy={schema:'cvf.jevAuthorizedPolicy.v1',policyDigest:'',effectAuthorizationRef:'synthetic-effect',dataBoundaryRef:'synthetic-data',costEnvelopeRef:'synthetic-cost',authorizationEvidenceDigest:jevDigest('synthetic-authorization'),destination:'https://api.typesafe.ai/v1/systemone',directory,writerIdentity:'synthetic-test',resultRetentionMs:60000,tombstoneRetentionMs:86400000,currency:'USD',wideMaxMicrounits:10,narrowMaxMicrounits:20,totalMaxMicrounits:30,pricingIdentity:'synthetic-pricing-not-live',reportedModels:['jev-fixture'],expiresAt:new Date(clock+3600000).toISOString()};policy.policyDigest=jevPolicyDigest(policy);
  const grant:JevActionGrant={runId:randomUUID(),canonicalExecutionId:'env-jev-custody',executionToken:randomUUID()+randomUUID(),actor:{userId:'synthetic-user',orgId:'org',teamId:'team',sessionBindingHash:jevDigest('signed-synthetic-cookie')},nonceHash:jevDigest('nonce'),inputDigest:jevDigest('bounded nonsecret goal'),rosterDigest:jevDigest('visible-roster'),recipeRevision:JEV_RECIPE_REVISION,sourceRevision:JEV_SOURCE_REVISION,policyDigest:policy.policyDigest,expiresAt:new Date(clock+300000).toISOString(),provider:'typesafe',model:'jev-latest',method:'system_one',maxStages:2};
  const custody=new JevSuggestionCustody(policy,()=>clock);
  const evidence=(run:JevRun,index=0)=>({canonicalExecutionId:run.canonicalExecutionId,stageExecutionKey:run.stages[index].stageExecutionKey,inputDigest:run.inputDigest,rosterDigest:run.rosterDigest,gatewayReceiptId:`gw-fixture-${index}`,receiptDigest:jevDigest(`receipt-${index}`),reportedModel:'jev-fixture',httpStatus:200,inputTokens:2,outputTokens:1,costMicrounits:3});
  return {directory,policy,grant,custody,evidence,advance:(ms:number)=>{clock+=ms;},cleanup:()=>rmSync(directory,{recursive:true,force:true})};
}
describe('Jev immutable custody and atomic quota connection',()=>{
  it('atomically reserves nonce/run/quota once; exact duplicate returns winner while mutation conflicts',()=>{const f=fixture();try{
    const first=f.custody.submit(f.grant);const loser=f.custody.submit({...f.grant,runId:randomUUID(),executionToken:randomUUID()+randomUUID()});
    expect(first.created).toBe(true);expect(loser.created).toBe(false);expect(loser.run).toEqual(first.run);expect(f.custody.store.readAll()).toHaveLength(3);
    expect(()=>f.custody.submit({...f.grant,inputDigest:jevDigest('mutated')})).toThrow('CONFLICT');
    expect(JSON.stringify(f.custody.store.readAll())).not.toContain('bounded nonsecret goal');expect(JSON.stringify(f.custody.store.readAll())).not.toContain(f.grant.executionToken);
    expect(()=>f.custody.start({...f.grant,executionToken:'wrong-token-but-long-enough-123456789'},0,'wide',0)).toThrow('ACTION_REFUSED');
  }finally{f.cleanup();}});
  it('joins one canonical ID with distinct wide/narrow receipts, zero replay and idempotent settlements',()=>{const f=fixture();try{
    let r=f.custody.submit(f.grant).run;r=f.custody.start(f.grant,r.revision,'wide',0);expect(()=>f.custody.start(f.grant,r.revision,'wide',0)).toThrow('STAGE_REFUSED');
    const first=f.evidence(r);r=f.custody.settle(f.grant,r.revision,'wide',first);const revision=r.revision;
    expect(f.custody.settle(f.grant,revision,'wide',first).revision).toBe(revision);
    r=f.custody.start(f.grant,r.revision,'narrow',1);expect(r.stages[0].canonicalExecutionId).toBe(r.stages[1].canonicalExecutionId);expect(r.stages[0].stageExecutionKey).not.toBe(r.stages[1].stageExecutionKey);
    expect(()=>f.custody.settle(f.grant,r.revision,'narrow',{...f.evidence(r,1),gatewayReceiptId:first.gatewayReceiptId})).toThrow('CORRUPT');
    r=f.custody.settle(f.grant,r.revision,'narrow',f.evidence(r,1));
    const result:JevStoredResult={schema:'cvf.jevSuggestionResult.v1',resultVersion:1,status:'suggested',catalogSkillId:'domain/skill',reasonCode:'CATALOG_TASK_FIT',presentation:{title:'Catalog title',domain:'Catalog domain',existingSkillHref:'/skills/domain/skill'},validatedStageIds:['wide','narrow']};
    r=f.custody.finish(f.grant,r.revision,result);expect(r.state).toBe('SUCCEEDED');expect(r.quota.settledMicrounits).toBe(6);expect(()=>f.custody.start(f.grant,r.revision,'narrow',1)).toThrow();
    expect(new JevSuggestionCustody(f.policy,()=>Date.parse(r.createdAt)).read(f.grant.actor,r.runId)).toEqual(r);
  }finally{f.cleanup();}});
  it('unknown possible send retains positive spend, late settlement never revives execution',()=>{const f=fixture();try{
    let r=f.custody.submit(f.grant).run;r=f.custody.start(f.grant,r.revision,'wide',0);r=f.custody.terminate(f.grant,r.revision,'PROVIDER_UNAVAILABLE');
    expect(r.state).toBe('UNKNOWN_TERMINAL');expect(r.terminal?.providerContact).toBe('POSSIBLE');expect(r.quota.settledMicrounits).toBeNull();expect(r.quota.reservedMicrounits).toBe(30);
    const saved=f.custody.store.readAll();expect(JSON.stringify(saved)).toContain('UNKNOWN');
    r=f.custody.settle(f.grant,r.revision,'wide',f.evidence(r));expect(r.state).toBe('FAILED');expect(r.terminal?.safeCode).toBe('INTERRUPTED');expect(()=>f.custody.start(f.grant,r.revision,'narrow',1)).toThrow();
  }finally{f.cleanup();}});
  it('crash after validated wide never resumes narrow; expiry denies result but preserves nonce tombstone',()=>{const f=fixture();try{
    let r=f.custody.submit(f.grant).run;r=f.custody.start(f.grant,r.revision,'wide',0);r=f.custody.settle(f.grant,r.revision,'wide',f.evidence(r));
    const duplicate=f.custody.submit({...f.grant,runId:randomUUID()});expect(duplicate.created).toBe(false);expect(duplicate.run.state).toBe('WIDE_VALIDATED');
    r=f.custody.terminate(f.grant,r.revision,'INTERRUPTED');expect(r.state).toBe('FAILED');expect(r.terminal?.outcomeKnown).toBe(true);
    expect(()=>f.custody.read({...f.grant.actor,sessionBindingHash:jevDigest('changed-cookie')},r.runId)).toThrow('NOT_FOUND');
    f.advance(60001);expect(()=>f.custody.read(f.grant.actor,r.runId)).toThrow('EXPIRED');expect(f.custody.store.readAll()).toHaveLength(3);
    expect(f.custody.lookup(f.grant.actor,f.grant.nonceHash,f.grant.inputDigest,f.grant.rosterDigest)?.runId).toBe(r.runId);
  }finally{f.cleanup();}});
  it('denies corrupt record/identity, stale revision/token, extra fields and missing authority',()=>{const f=fixture();try{
    const r=f.custody.submit(f.grant).run;
    expect(()=>f.custody.start(f.grant,1,'wide',0)).toThrow('CONFLICT');
    expect(()=>f.custody.start({...f.grant,policyDigest:jevDigest('other')},0,'wide',0)).toThrow('ACTION_REFUSED');
    expect(()=>validateJevRun({...r,rawBody:'forbidden'})).toThrow('CORRUPT');
    const altered=structuredClone(r);altered.stages[0].canonicalExecutionId='env-wrong';expect(()=>validateJevRun(altered)).toThrow('CORRUPT');
    f.custody.store.transaction(()=>({writes:[{id:`run:${r.runId}`,expectedRevision:0,value:{...r,revision:999}}],result:0}));
    expect(()=>f.custody.read(f.grant.actor,r.runId)).toThrow('CORRUPT');
  }finally{f.cleanup();}});
  it('holds one stable authorization across nonces, policy revisions and restarts',()=>{const f=fixture();try{
    const singleAction={authorizationEvidenceDigest:f.policy.authorizationEvidenceDigest,effectAuthorizationRef:f.policy.effectAuthorizationRef,inputDigest:f.grant.inputDigest,rosterDigest:f.grant.rosterDigest};
    const first=f.custody.submit(f.grant,singleAction);expect(first.created).toBe(true);
    expect(f.custody.store.readAll()).toHaveLength(4);
    const reopened=new JevSuggestionCustody(f.policy,()=>Date.parse(first.run.createdAt));
    expect(reopened.submit({...f.grant,runId:randomUUID(),executionToken:randomUUID()+randomUUID()},singleAction)).toMatchObject({created:false,run:{runId:first.run.runId}});
    expect(()=>reopened.submit({...f.grant,runId:randomUUID(),nonceHash:jevDigest('second nonce')},singleAction)).toThrow('CONFLICT');
    expect(()=>reopened.submit({...f.grant,runId:randomUUID(),actor:{...f.grant.actor,sessionBindingHash:jevDigest('second signed session')}},singleAction)).toThrow('CONFLICT');
    expect(()=>reopened.submit({...f.grant,inputDigest:jevDigest('different goal')},{...singleAction,inputDigest:jevDigest('different goal')})).toThrow('CONFLICT');
    const changed={...f.policy,expiresAt:new Date(Date.parse(f.policy.expiresAt)+60000).toISOString(),totalMaxMicrounits:40};changed.policyDigest=jevPolicyDigest(changed);
    const changedCustody=new JevSuggestionCustody(changed,()=>Date.parse(first.run.createdAt));
    expect(()=>changedCustody.submit({...f.grant,policyDigest:changed.policyDigest,nonceHash:jevDigest('changed policy nonce')},singleAction)).toThrow('CONFLICT');
    const claim=f.custody.store.readAll().find(r=>r.id.startsWith('action:'))!;
    f.custody.store.transaction(()=>({writes:[{id:claim.id,expectedRevision:claim.revision,value:{...(claim.value as Record<string,unknown>),extra:'bad'}}],result:0}));
    expect(()=>f.custody.submit(f.grant,singleAction)).toThrow('CORRUPT');
  }finally{f.cleanup();}});
  it('keeps legacy three-record submission and rolls back a four-record claim on transaction failure',()=>{const f=fixture();try{
    const singleAction={authorizationEvidenceDigest:f.policy.authorizationEvidenceDigest,effectAuthorizationRef:f.policy.effectAuthorizationRef,inputDigest:f.grant.inputDigest,rosterDigest:f.grant.rosterDigest};
    const transaction=f.custody.store.transaction.bind(f.custody.store);
    vi.spyOn(f.custody.store,'transaction').mockImplementation((callback)=>transaction(callback,{beforeCommit(){throw Error('INJECTED_FAILURE');}}));
    expect(()=>f.custody.submit(f.grant,singleAction)).toThrow();
    vi.restoreAllMocks();expect(f.custody.store.readAll()).toHaveLength(0);
    // A malformed pre-existing nonce is refused rather than upgraded into a new claim.
    f.custody.submit(f.grant);expect(f.custody.store.readAll()).toHaveLength(3);
    expect(()=>f.custody.submit(f.grant,singleAction)).toThrow('CONFLICT');
  }finally{f.cleanup();}});
});

const peerBootstrap=String.raw`
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const production=process.argv[1],policy=JSON.parse(process.argv[2]),grant=JSON.parse(process.argv[3]),singleAction=JSON.parse(process.argv[4]),mode=process.argv[5],release=process.argv[6],now=Number(process.argv[7]);
const ts=require(path.join(path.dirname(production),'../../../node_modules/typescript'));
require.extensions['.ts']=(mod,file)=>{mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);};
const resolve=Module._resolveFilename;Module._resolveFilename=function(request,parent,...rest){if(request==='cvf-model-gateway')return path.resolve(path.dirname(production),'../../../../../CVF_MODEL_GATEWAY/src/quota-ledger.ts');if(request.startsWith('.')&&request.endsWith('.js')){const candidate=path.resolve(path.dirname(parent.filename),request.slice(0,-3)+'.ts');if(fs.existsSync(candidate))return candidate;}return resolve.call(this,request,parent,...rest);};
const {JevSuggestionCustody}=require(production);
const custody=new JevSuggestionCustody(policy,()=>now);
const event=(name,extra={})=>process.stdout.write(JSON.stringify({event:name,pid:process.pid,production:fs.realpathSync(production),...extra})+'\n');
const original=custody.store.transaction.bind(custody.store);
custody.store.transaction=(callback)=>original(callback,{afterAcquire(){event('ENTERED',{released:fs.existsSync(release)});if(mode==='holder'){const end=Date.now()+10000;while(!fs.existsSync(release)){if(Date.now()>end)throw Error('DEADLOCK_SAFETY');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,5);}}}});
event('READY');process.stdin.once('data',()=>{event('START_ATTEMPT');event('ATTEMPTING');try{const result=custody.submit(grant,singleAction);event('COMPLETE',{created:result.created,runId:result.run.runId});}catch(error){event('COMPLETE',{code:error.code||error.message});}process.exit(0);});`;

it('allows one stable action across actual production processes with a deterministic peer barrier',async()=>{
  const f=fixture();const release=path.join(f.directory,'parent-release');
  const production=path.resolve('src/lib/server/jev-suggestion-custody.ts');
  const singleAction={authorizationEvidenceDigest:f.policy.authorizationEvidenceDigest,effectAuthorizationRef:f.policy.effectAuthorizationRef,inputDigest:f.grant.inputDigest,rosterDigest:f.grant.rosterDigest};
  const now=Date.parse('2026-10-26T10:00:00.000Z');
  const peers:ChildProcess[]=[];
  function peer(mode:string,grant:JevActionGrant){
    const child=spawn(process.execPath,['-e',peerBootstrap,production,JSON.stringify(f.policy),JSON.stringify(grant),JSON.stringify(singleAction),mode,release,String(now)],{cwd:process.cwd(),stdio:['pipe','pipe','pipe']});peers.push(child);
    const events:Record<string,unknown>[]=[];let buffer='';let stderr='';
    child.stdout!.on('data',chunk=>{buffer+=String(chunk);const lines=buffer.split('\n');buffer=lines.pop()!;for(const line of lines)if(line)events.push(JSON.parse(line));});
    child.stderr!.on('data',chunk=>{stderr+=String(chunk);});
    async function wait(name:string){const end=Date.now()+15000;while(!events.some(e=>e.event===name)){if(Date.now()>end||child.exitCode!==null)throw Error(`PEER_${name}:${stderr}`);await new Promise(resolve=>setImmediate(resolve));}return events.find(e=>e.event===name)!;}
    return {child,events,wait};
  }
  try{
    f.custody.store.readAll();
    const holder=peer('holder',f.grant);await holder.wait('READY');holder.child.stdin!.write('START');await holder.wait('ENTERED');
    const contender=peer('contender',{...f.grant,runId:randomUUID(),nonceHash:jevDigest('another nonce')});
    await contender.wait('READY');contender.child.stdin!.write('START');await contender.wait('ATTEMPTING');
    expect(contender.events.some(e=>e.event==='ENTERED')).toBe(false);
    writeFileSync(release,'PARENT_RELEASE');
    const first=await holder.wait('COMPLETE');const entered=await contender.wait('ENTERED');const second=await contender.wait('COMPLETE');
    expect(first.created).toBe(true);expect(second.code).toBe('CONFLICT');
    expect(entered.released).toBe(true);expect(entered.production).toBe(realpathSync(production));
    expect(entered.pid).not.toBe(process.pid);expect(f.custody.store.readAll()).toHaveLength(4);
    process.stdout.write('JEV_SINGLE_ACTION_PEER '+JSON.stringify({production:entered.production,peerPid:entered.pid,barriers:['READY','START_ATTEMPT','ATTEMPTING','PARENT_RELEASE','ENTERED','COMPLETE'],winner:first.runId,loser:second.code})+'\n');
  }finally{for(const child of peers)child.kill();f.cleanup();}
},30000);


it('reads strict legacy records through retained storage without reauthorizing the old grant',()=>{const f=fixture();try{const run=f.custody.submit(f.grant).run;const now=Date.parse(run.createdAt)+1000;expect(JevSuggestionCustody.readRetained(f.directory,f.grant.actor,run.runId,now)).toEqual(run);expect(()=>JevSuggestionCustody.readRetained(f.directory,{...f.grant.actor,userId:'other'},run.runId,now)).toThrow('NOT_FOUND');expect(()=>JevSuggestionCustody.readRetained(f.directory,f.grant.actor,run.runId,Date.parse(run.resultExpiresAt))).toThrow('EXPIRED');}finally{f.cleanup();}});
