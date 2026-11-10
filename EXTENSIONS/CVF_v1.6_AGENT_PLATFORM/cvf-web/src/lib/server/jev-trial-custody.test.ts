import { mkdtempSync, rmSync, writeFileSync, realpathSync } from 'node:fs';
import os from 'node:os'; import path from 'node:path'; import { randomUUID } from 'node:crypto'; import { spawn, type ChildProcess } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { JevSuggestionCustody, jevDigest, type JevTrialGrant } from './jev-suggestion-custody';
import { SQLiteAtomicRecordAdapter } from '../storage-adapter';
import { quote, validateTrialSpec, type JevTrialSpec } from './jev-trial-custody';
const now=Date.parse('2026-11-04T10:00:00.000Z');
const canonical=(o:Record<string,unknown>)=>JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a],[b])=>a<b?-1:a>b?1:0)));
function fixture(maxCases=2){
 const directory=mkdtempSync(path.join(os.tmpdir(),'jev-trial-')); const manifest={one:jevDigest('First approved goal'),two:jevDigest('Second approved goal')};
 const price={schema:'cvf.jevPricePin.v1' as const,identity:'synthetic',evidenceType:'OFFLINE_SYNTHETIC' as const,evidenceDigest:jevDigest('price-evidence'),validUntil:'2099-01-01T00:00:00.000Z',currency:'USD' as const,inputMicrounitsPerMillion:100,outputMicrounitsPerMillion:100,wideInputLimit:100,wideOutputLimit:100,narrowInputLimit:100,narrowOutputLimit:100};
 const noPolicy={schema:'cvf.jevTrialSpec.v2' as const,trialId:'trial1',authorizationDigest:jevDigest('authorization'),sourceRevision:'JEV-S1-OPENROUTER-TRIAL-20261104',sourceDigest:jevDigest('source'),transport:'openrouter-systemone' as const,provider:'openrouter' as const,requestedModel:'typesafe/jev-1.14' as const,method:'system_one' as const,destination:'https://openrouter.ai/api/v1/systemone' as const,credentialEnv:'OPENROUTER_API_KEY' as const,reportedModels:['typesafe/jev-1.14-20261014'] as ['typesafe/jev-1.14-20261014'],rosterDigest:jevDigest('roster'),manifest,manifestDigest:jevDigest(canonical(manifest)),expiresAt:'2026-11-05T10:00:00.000Z',maxCases,maxHttp:maxCases*2,maxMicrounits:100,currency:'USD' as const,effectAuthorizationRef:'effect',dataBoundaryRef:'data',costEnvelopeRef:'cost',pricing:{...price,digest:jevDigest(canonical(price))},wideMaxMicrounits:20,narrowMaxMicrounits:20,resultRetentionMs:86400000};
 const spec:JevTrialSpec={...noPolicy,policyDigest:jevDigest(canonical(noPolicy))};
 const grant=(caseId:'one'|'two'):JevTrialGrant=>({schema:'cvf.jevActionGrant.v2',spec,caseId,runId:randomUUID(),canonicalExecutionId:`env-${randomUUID()}`,executionToken:randomUUID()+randomUUID(),actor:{userId:'user',orgId:'org',teamId:'team',sessionBindingHash:jevDigest('session')},nonceHash:jevDigest(caseId),inputDigest:manifest[caseId],expiresAt:'2026-11-04T12:00:00.000Z',provider:'openrouter',model:'typesafe/jev-1.14',method:'system_one'});
 return {directory,spec,grant,cleanup:()=>rmSync(directory,{recursive:true,force:true})};
}
function repinPricing(spec: JevTrialSpec, patch: Partial<JevTrialSpec['pricing']>): JevTrialSpec {
 const { digest: _oldPriceDigest, ...price } = { ...spec.pricing, ...patch };
 const { policyDigest: _oldPolicyDigest, ...policy } = { ...spec, pricing: { ...price, digest: jevDigest(canonical(price)) } };
 return { ...policy, policyDigest: jevDigest(canonical(policy)) };
}

describe('Jev published zero-rate pricing admission', () => {
 it('admits zero output pricing and preserves integer ceiling arithmetic', () => {
  const f=fixture(); try {
   const spec=repinPricing(f.spec,{inputMicrounitsPerMillion:42000,outputMicrounitsPerMillion:0});
   expect(validateTrialSpec(spec,jevDigest)).toBe(spec);
   expect(quote(100,100,spec.pricing)).toBe(5);
   expect(quote(262144,235929,spec.pricing)).toBe(11011);
  } finally { f.cleanup(); }
 });
 it('rejects invalid rates and zero token ceilings even after valid digest repinning', () => {
  const f=fixture(); try {
   for (const field of ['inputMicrounitsPerMillion','outputMicrounitsPerMillion'] as const) {
    for (const value of [-1,0.5,Number.NaN,Number.POSITIVE_INFINITY,Number.MAX_SAFE_INTEGER+1]) {
     expect(()=>validateTrialSpec(repinPricing(f.spec,{[field]:value}),jevDigest)).toThrow('JEV_TRIAL_REFUSED');
    }
   }
   for (const field of ['wideInputLimit','wideOutputLimit','narrowInputLimit','narrowOutputLimit'] as const) {
    expect(()=>validateTrialSpec(repinPricing(f.spec,{[field]:0}),jevDigest)).toThrow('JEV_TRIAL_REFUSED');
   }
  } finally { f.cleanup(); }
 });
});

describe('Jev v2 trial production custody',()=>{
 it('requires provisioning, retains in-flight across restart and stops all cases on unknown cost',()=>{const f=fixture();try{const a=f.grant('one'),b=f.grant('two');
 expect(()=>JevSuggestionCustody.submitTrial(f.directory,a,now)).toThrow();JevSuggestionCustody.provisionTrial(f.directory,f.spec,now);expect(()=>JevSuggestionCustody.provisionTrial(f.directory,f.spec,now)).toThrow();
 const one=JevSuggestionCustody.submitTrial(f.directory,a,now).run;const two=JevSuggestionCustody.submitTrial(f.directory,b,now).run;
 const started=JevSuggestionCustody.startTrial(f.directory,a,one.revision,'wide',now);expect(()=>JevSuggestionCustody.startTrial(f.directory,b,two.revision,'wide',now)).toThrow();
 const stopped=JevSuggestionCustody.settleTrial(f.directory,a,started.revision,'wide',null,now);expect(stopped.stages[0].state).toBe('UNKNOWN');expect(()=>JevSuggestionCustody.startTrial(f.directory,b,two.revision,'wide',now)).toThrow();expect(JevSuggestionCustody.readTrial(f.directory,a.actor,a.runId,now).stages[0].state).toBe('UNKNOWN');
 }finally{f.cleanup();}});
});

const peerBootstrap=String.raw`
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const production=process.argv[1],dir=process.argv[2],grant=JSON.parse(process.argv[3]),mode=process.argv[4],release=process.argv[5],now=Number(process.argv[6]);
const ts=require(path.join(path.dirname(production),'../../../node_modules/typescript'));
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const resolve=Module._resolveFilename;Module._resolveFilename=function(request,parent,...rest){if(request==='cvf-model-gateway')return path.resolve(path.dirname(production),'../../../../../CVF_MODEL_GATEWAY/src/quota-ledger.ts');if(request.startsWith('.')&&request.endsWith('.js')){const c=path.resolve(path.dirname(parent.filename),request.slice(0,-3)+'.ts');if(fs.existsSync(c))return c;}return resolve.call(this,request,parent,...rest);};
const {JevSuggestionCustody}=require(production);const {SQLiteAtomicRecordAdapter}=require(path.resolve(path.dirname(production),'../storage-adapter.ts'));
const event=(name,extra={})=>process.stdout.write(JSON.stringify({event:name,pid:process.pid,production:fs.realpathSync(production),...extra})+'\n');
const original=SQLiteAtomicRecordAdapter.prototype.transaction;SQLiteAtomicRecordAdapter.prototype.transaction=function(callback){return original.call(this,callback,{afterAcquire(){event('ENTERED',{released:fs.existsSync(release)});if(mode==='holder'){const end=Date.now()+10000;while(!fs.existsSync(release)){if(Date.now()>end)throw Error('DEADLOCK_SAFETY');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,5);}}if(mode==='fail')throw Error('AFTER_ACQUIRE');}})};
event('READY');process.stdin.once('data',()=>{event('START_ATTEMPT');event('ATTEMPTING');try{const result=mode==='starter'?JevSuggestionCustody.startTrial(dir,grant,0,'wide',now):JevSuggestionCustody.submitTrial(dir,grant,now);if(mode==='starter'){process.stdout.write(JSON.stringify({event:'COMPLETE',started:result.stages[0].state})+'\n',()=>process.kill(process.pid,'SIGKILL'));return;}event('COMPLETE',{created:result.created});}catch(error){event('COMPLETE',{code:error.code||error.message});}process.exit(0);});`;
it('serializes the last envelope in actual production processes with a barrier',async()=>{
 const f=fixture(1),release=path.join(f.directory,'release'),production=path.resolve('src/lib/server/jev-suggestion-custody.ts');const peers:ChildProcess[]=[];
 function peer(mode:string,grant:JevTrialGrant){const child=spawn(process.execPath,['-e',peerBootstrap,production,f.directory,JSON.stringify(grant),mode,release,String(now)],{cwd:process.cwd(),stdio:['pipe','pipe','pipe']});peers.push(child);const events:Record<string,unknown>[]=[];let buffer='',stderr='';child.stdout!.on('data',chunk=>{buffer+=String(chunk);const lines=buffer.split('\n');buffer=lines.pop()!;for(const line of lines)if(line)events.push(JSON.parse(line));});child.stderr!.on('data',chunk=>stderr+=String(chunk));
 async function wait(name:string){const end=Date.now()+15000;while(!events.some(e=>e.event===name)){if(Date.now()>end||child.exitCode!==null)throw Error(`PEER_${name}:${stderr}`);await new Promise(resolve=>setImmediate(resolve));}return events.find(e=>e.event===name)!;}return {child,events,wait};}
 try{JevSuggestionCustody.provisionTrial(f.directory,f.spec,now);const store=new SQLiteAtomicRecordAdapter(f.directory,'jev-suggestion-v1');const before=store.readAll();const failed=peer('fail',f.grant('one'));await failed.wait('READY');failed.child.stdin!.write('START');expect((await failed.wait('COMPLETE')).code).toBe('IO');expect(store.readAll()).toEqual(before);const first=peer('holder',f.grant('one'));await first.wait('READY');first.child.stdin!.write('START');await first.wait('ENTERED');const second=peer('contender',f.grant('two'));await second.wait('READY');second.child.stdin!.write('START');await second.wait('ATTEMPTING');expect(second.events.some(e=>e.event==='ENTERED')).toBe(false);writeFileSync(release,'PARENT_RELEASE');const won=await first.wait('COMPLETE'),entered=await second.wait('ENTERED'),lost=await second.wait('COMPLETE');expect(won.created).toBe(true);expect(lost.code).toBe('ACTION_REFUSED');expect(entered.released).toBe(true);expect(entered.production).toBe(realpathSync(production));expect(entered.pid).not.toBe(process.pid);expect(JevSuggestionCustody.trialStatus(f.directory,f.spec,now)).toBe('STOPPED');process.stdout.write('JEV_TRIAL_PEER '+JSON.stringify({production:entered.production,peerPid:entered.pid,barriers:['READY','START_ATTEMPT','ATTEMPTING','PARENT_RELEASE','ENTERED','COMPLETE'],winner:'created',loser:lost.code})+'\n');
 }finally{for(const child of peers)child.kill();f.cleanup();}
},30000);

it('survives a process exit after START and rejects an already reserved other case',async()=>{
 const f=fixture(),production=path.resolve('src/lib/server/jev-suggestion-custody.ts'),release=path.join(f.directory,'release');let child:ChildProcess|undefined;
 try{const a=f.grant('one'),b=f.grant('two');JevSuggestionCustody.provisionTrial(f.directory,f.spec,now);JevSuggestionCustody.submitTrial(f.directory,a,now);const other=JevSuggestionCustody.submitTrial(f.directory,b,now).run;
 child=spawn(process.execPath,['-e',peerBootstrap,production,f.directory,JSON.stringify(a),'starter',release,String(now)],{cwd:process.cwd(),stdio:['pipe','pipe','pipe']});let buffer='',stderr='';const events:Record<string,unknown>[]=[];
 child.stdout!.on('data',chunk=>{buffer+=String(chunk);const lines=buffer.split('\n');buffer=lines.pop()!;for(const line of lines)if(line)events.push(JSON.parse(line));});child.stderr!.on('data',c=>stderr+=String(c));
 async function wait(name:string){const end=Date.now()+15000;while(!events.some(e=>e.event===name)){if(Date.now()>end||child!.exitCode!==null)throw Error(`PEER_${name}:${stderr}`);await new Promise(resolve=>setImmediate(resolve));}return events.find(e=>e.event===name)!;}
 await wait('READY');child.stdin!.write('START');expect((await wait('COMPLETE')).started).toBe('START_COMMITTED');if(child.exitCode===null)await new Promise<void>(resolve=>child!.once('exit',()=>resolve()));
 expect(()=>JevSuggestionCustody.startTrial(f.directory,b,other.revision,'wide',now)).toThrow();expect(JevSuggestionCustody.readTrial(f.directory,a.actor,a.runId,now).stages[0].state).toBe('START_COMMITTED');
 }finally{child?.kill();f.cleanup();}
},30000);

it('settles valid costs, admits narrow, and reads retained results after the action expires',()=>{const f=fixture();try{const a=f.grant('one');JevSuggestionCustody.provisionTrial(f.directory,f.spec,now);const submitted=JevSuggestionCustody.submitTrial(f.directory,a,now);const wide=JevSuggestionCustody.startTrial(f.directory,a,submitted.run.revision,'wide',now);const evidence={costMicrounits:4,reportedModel:'typesafe/jev-1.14-20261014',receiptDigest:jevDigest('receipt'),gatewayReceiptId:'receipt1',inputTokens:2,outputTokens:1};const settled=JevSuggestionCustody.settleTrial(f.directory,a,wide.revision,'wide',evidence,now);const narrow=JevSuggestionCustody.startTrial(f.directory,a,settled.revision,'narrow',now);const done=JevSuggestionCustody.settleTrial(f.directory,a,narrow.revision,'narrow',{...evidence,gatewayReceiptId:'receipt2'},now);expect(done.stages.map(s=>s.state)).toEqual(['SETTLED','SETTLED']);expect(JevSuggestionCustody.readTrial(f.directory,a.actor,a.runId,Date.parse(a.expiresAt)+1).runId).toBe(a.runId);expect(()=>JevSuggestionCustody.readTrial(f.directory,{...a.actor,userId:'other'},a.runId,now)).toThrow('NOT_FOUND');}finally{f.cleanup();}});
it('stops on cost above stage reservation and rejects corruption and version crossing',()=>{const f=fixture();try{const a=f.grant('one'),b=f.grant('two');JevSuggestionCustody.provisionTrial(f.directory,f.spec,now);expect(()=>JevSuggestionCustody.submitTrial(f.directory,{...a,schema:'cvf.jevActionGrant.v1'} as unknown as JevTrialGrant,now)).toThrow();const one=JevSuggestionCustody.submitTrial(f.directory,a,now).run;const two=JevSuggestionCustody.submitTrial(f.directory,b,now).run;const started=JevSuggestionCustody.startTrial(f.directory,a,one.revision,'wide',now);const stopped=JevSuggestionCustody.settleTrial(f.directory,a,started.revision,'wide',{costMicrounits:21,reportedModel:'typesafe/jev-1.14-20261014',receiptDigest:jevDigest('receipt'),gatewayReceiptId:'r',inputTokens:1,outputTokens:1},now);expect(stopped.stages[0].state).toBe('UNKNOWN');expect(()=>JevSuggestionCustody.startTrial(f.directory,b,two.revision,'wide',now)).toThrow();const store=new SQLiteAtomicRecordAdapter(f.directory,'jev-suggestion-v1');store.transaction(rows=>{const row=rows.find(r=>r.id===`quota:${a.runId}`)!;return {writes:[{id:row.id,expectedRevision:row.revision,value:{bad:true}}],result:0};});expect(()=>JevSuggestionCustody.readTrial(f.directory,a.actor,a.runId,now)).toThrow();}finally{f.cleanup();}});

it('refuses changed source, roster, price, and case manifest identities without minting capacity',()=>{const f=fixture();try{const a=f.grant('one');JevSuggestionCustody.provisionTrial(f.directory,f.spec,now);for(const patch of [{sourceDigest:jevDigest('other')},{rosterDigest:jevDigest('other')},{manifest:{one:jevDigest('other')}},{requestedModel:'different'}])expect(()=>JevSuggestionCustody.submitTrial(f.directory,{...a,spec:{...a.spec,...patch}} as unknown as JevTrialGrant,now)).toThrow();expect(JevSuggestionCustody.submitTrial(f.directory,a,now).created).toBe(true);}finally{f.cleanup();}});

it('retains a durable pre-start lease after a lost submit acknowledgement',()=>{const f=fixture();const original=SQLiteAtomicRecordAdapter.prototype.transaction;try{const a=f.grant('one'),b=f.grant('two');JevSuggestionCustody.provisionTrial(f.directory,f.spec,now);SQLiteAtomicRecordAdapter.prototype.transaction=function(this:SQLiteAtomicRecordAdapter,callback){return original.call(this,callback,{afterCommit(){throw Error('LOST_ACK');}});} as typeof original;expect(()=>JevSuggestionCustody.submitTrial(f.directory,a,now)).toThrow('COMMIT_UNKNOWN');SQLiteAtomicRecordAdapter.prototype.transaction=original;const other=JevSuggestionCustody.submitTrial(f.directory,b,now).run;expect(()=>JevSuggestionCustody.startTrial(f.directory,b,other.revision,'wide',now)).toThrow();expect(JevSuggestionCustody.trialStatus(f.directory,f.spec,now)).toBe('IN_FLIGHT');}finally{SQLiteAtomicRecordAdapter.prototype.transaction=original;f.cleanup();}});
