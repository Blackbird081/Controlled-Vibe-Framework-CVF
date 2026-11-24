import { afterEach, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileTaskGraph } from '../src/mao/task.graph.contract';
import { MaoFileRunStore } from '../src/mao/durable.run.store';
import { createMaoDelegationAdapter, createMaoInvocationIdentity, type MaoInvocationRequest } from '../src/mao/delegation.adapter.contract';
import { MaoLifecycleController } from '../src/mao/lifecycle.controller.contract';
import { MaoOperationalWorkerLauncher } from '../src/mao/operational.worker.launcher';
const roots:string[]=[];afterEach(async()=>{for(const p of roots.splice(0)) await rm(p,{recursive:true,force:true});});
async function fixture(){
 const root=await mkdtemp(join(tmpdir(),'mao-real-'));roots.push(root);
 const compiled=compileTaskGraph({authority:{workOrderId:'work-order',route:'SINGLE_AGENT_SINGLE_ROLE',riskLevel:'R1',budget:{maxInvocations:1,maxConcurrentRoles:1,maxRevisionDepth:1,tokenCostCeiling:null,wallClockCeilingMs:null},closerActorId:'closer',approvalCheckpoints:[]},tasks:[{taskId:'task',role:'worker',riskLevel:'R1',fileScope:['source']}]});
 if(!compiled.ok)throw Error(compiled.reason);const graph=compiled.graph;const store=new MaoFileRunStore(root);expect((await store.createRun(graph)).ok).toBe(true);const lifecycle=new MaoLifecycleController('2026-11-13T00:00:00.000Z');const launcher=new MaoOperationalWorkerLauncher(store,createMaoDelegationAdapter(),lifecycle);
 const request={taskGraphId:graph.taskGraphId,taskId:'task',admission:{taskGraphId:graph.taskGraphId,decision:'SINGLE_WORKER_ADMITTED' as const,approvalRequired:false,admittedRoles:['worker']},capability:{role:'worker',requiredCapabilities:['text'],offeredCapabilities:['text']},inputManifest:['input'],launchIdempotencyKey:'launch'};
 return {root,store,graph,launcher,request,lifecycle};
}
function receipt(request:MaoInvocationRequest){return {ok:true as const,replayed:false,receipt:{...createMaoInvocationIdentity(request),taskId:request.taskId,adapterId:'cvf-web-canonical-gateway',role:'worker',authorityHash:request.graph.authorityEnvelope.authorityHash,idempotencyKey:request.idempotencyKey,startedAt:request.startedAt,completedAt:request.startedAt,usage:{tokensReported:3,tokensEstimated:null,latencyMs:1,measurementLabel:'PROVIDER_REPORTED' as const},diagnosticClass:null}};}
it('persists admitted and running before actual port, exposes actual payload only after terminal',async()=>{const f=await fixture();const port={invoke:vi.fn(async(req:MaoInvocationRequest)=>{const run=await f.store.resumeRun(f.graph.taskGraphId);expect(run.ok&&run.events.map(e=>e.eventType)).toEqual(['GRAPH_COMPILED','TASK_ADMITTED','INVOCATION_STARTED']);return {invocationResult:receipt(req),payload:{answer:'actual'}};})};const result=await f.launcher.launchAsync(f.request,port);expect(result).toMatchObject({ok:true,payload:{answer:'actual'}});const run=await f.store.resumeRun(f.graph.taskGraphId);expect(run.ok&&run.events.at(-1)?.resultingState).toBe('succeeded');expect((await f.launcher.launchAsync(f.request,port))).toMatchObject({ok:false,reason:'DUPLICATE_LAUNCH_ADAPTER_NOT_CALLED'});expect(port.invoke).toHaveBeenCalledTimes(1);});
it('preflight rejection and delegation invoke no port',async()=>{const f=await fixture();const port={invoke:vi.fn()};expect(await f.launcher.launchAsync({...f.request,capability:{...f.request.capability,offeredCapabilities:[]}},port)).toMatchObject({ok:false,reason:'ADAPTER_REJECTED'});expect(await f.launcher.launchAsync({...f.request,delegation:{parentTaskId:'p',depth:1,reservationKey:'r'}},port)).toMatchObject({ok:false,reason:'DELEGATION_UNSUPPORTED'});expect(port.invoke).not.toHaveBeenCalled();});
it('after start a thrown or rejected actual port leaves running and no payload or retry',async()=>{const f=await fixture();const port={invoke:vi.fn(async()=>{throw Error('uncertain');})};const result=await f.launcher.launchAsync(f.request,port);expect(result).toMatchObject({ok:false,reason:'OUTCOME_UNKNOWN'});expect(result).not.toHaveProperty('payload');const run=await f.store.resumeRun(f.graph.taskGraphId);expect(run.ok&&run.events.at(-1)?.resultingState).toBe('running');expect(await f.launcher.launchAsync(f.request,port)).toMatchObject({ok:false,reason:'DUPLICATE_LAUNCH_ADAPTER_NOT_CALLED'});expect(port.invoke).toHaveBeenCalledTimes(1);});
it('timeout and abort after start remain unknown even when a late result resolves',async()=>{for(const mode of ['timeout','abort']){const f=await fixture();const controller=new AbortController();let finish!:(v:unknown)=>void;const port={invoke:vi.fn((req:MaoInvocationRequest)=>new Promise<{invocationResult:ReturnType<typeof receipt>;payload:string}>(resolve=>{finish=()=>resolve({invocationResult:receipt(req),payload:'late'});if(mode==='abort')setTimeout(()=>controller.abort(),1);} ))};const result=await f.launcher.launchAsync({...f.request,timeoutCeilingMs:mode==='timeout'?5:null},port,{signal:controller.signal});expect(result).toMatchObject({ok:false,reason:'OUTCOME_UNKNOWN'});finish(null);await Promise.resolve();const run=await f.store.resumeRun(f.graph.taskGraphId);expect(run.ok&&run.events.at(-1)?.resultingState).toBe('running');}});
it('failed admitted or started persistence makes zero calls; failed terminal persistence holds uncertainty',async()=>{for(const target of ['TASK_ADMITTED','INVOCATION_STARTED','INVOCATION_COMPLETED']){const f=await fixture();const original=f.store.appendEvent.bind(f.store);vi.spyOn(f.store,'appendEvent').mockImplementation(async(id,event)=>event.eventType===target?{ok:false,reason:'IO_FAILURE',detail:'test'}:original(id,event));const port={invoke:vi.fn(async(req:MaoInvocationRequest)=>({invocationResult:receipt(req),payload:'actual'}))};const result=await f.launcher.launchAsync(f.request,port);expect(result).toMatchObject({ok:false,reason:target==='INVOCATION_COMPLETED'?'OUTCOME_UNKNOWN':'LIFECYCLE_MILESTONE_PERSISTENCE_FAILED'});expect(port.invoke).toHaveBeenCalledTimes(target==='INVOCATION_COMPLETED'?1:0);expect(result).not.toHaveProperty('payload');}});
it('rejects malformed real receipt and negative port result without claiming a successful payload',async()=>{for(const mode of ['wrong-id','denied']){const f=await fixture();const port={invoke:vi.fn(async(req:MaoInvocationRequest)=>mode==='denied'?{invocationResult:{ok:false as const,reason:'REJECTED_MISSING_CAPABILITY' as const,detail:'x',diagnosticClass:'NON_RETRYABLE_SCOPE_BREACH' as const},payload:'untrusted'}:{invocationResult:{...receipt(req),receipt:{...receipt(req).receipt,attemptId:'other'}},payload:'untrusted'})};const result=await f.launcher.launchAsync(f.request,port);expect(result).toMatchObject({ok:false,reason:'OUTCOME_UNKNOWN'});expect(result).not.toHaveProperty('payload');}});
it('an exception while persisting completion is unknown, never a reported success',async()=>{const f=await fixture();const append=f.store.appendEvent.bind(f.store);vi.spyOn(f.store,'appendEvent').mockImplementation(async(id,event)=>{if(event.eventType==='INVOCATION_COMPLETED')throw Error('storage acknowledgement lost');return append(id,event);});const port={invoke:vi.fn(async(req:MaoInvocationRequest)=>({invocationResult:receipt(req),payload:'answer'}))};const result=await f.launcher.launchAsync(f.request,port);expect(result).toMatchObject({ok:false,reason:'OUTCOME_UNKNOWN'});expect(result).not.toHaveProperty('payload');});
it('concurrent launches on one graph never invoke the port twice',async()=>{const f=await fixture();const port={invoke:vi.fn(async(req:MaoInvocationRequest)=>({invocationResult:receipt(req),payload:'answer'}))};const [a,b]=await Promise.all([f.launcher.launchAsync(f.request,port),f.launcher.launchAsync(f.request,port)]);expect(port.invoke).toHaveBeenCalledTimes(1);expect([a,b].filter(x=>x.ok)).toHaveLength(1);});
it('elapsed ceiling after response prevents terminal success even if timeout callback has not fired',async()=>{const f=await fixture();const port={invoke:vi.fn(async(req:MaoInvocationRequest)=>{f.lifecycle.clock.advance(6);return {invocationResult:receipt(req),payload:'answer'};})};const result=await f.launcher.launchAsync({...f.request,timeoutCeilingMs:5},port);expect(result).toMatchObject({ok:false,reason:'OUTCOME_UNKNOWN'});const run=await f.store.resumeRun(f.graph.taskGraphId);expect(run.ok&&run.events.at(-1)?.resultingState).toBe('running');});
it('already aborted request and pre-existing graph history never contact port',async()=>{const f=await fixture();const ctl=new AbortController();ctl.abort();const port={invoke:vi.fn()};expect(await f.launcher.launchAsync(f.request,port,{signal:ctl.signal})).toMatchObject({ok:false,reason:'CANCELLED_BEFORE_START'});expect(port.invoke).not.toHaveBeenCalled();});
it('invalid timeout and invalid receipt timestamps/adapter are rejected without false success',async()=>{for(const timeout of [-1,NaN,Infinity,1.5]){const f=await fixture();const port={invoke:vi.fn()};expect(await f.launcher.launchAsync({...f.request,timeoutCeilingMs:timeout},port)).toMatchObject({ok:false,reason:'INVALID_TIMEOUT'});expect(port.invoke).not.toHaveBeenCalled();}for(const mode of ['invalid','past','future','adapter']){const f=await fixture();const port={invoke:vi.fn(async(req:MaoInvocationRequest)=>{const good=receipt(req);return {invocationResult:{...good,receipt:{...good.receipt,completedAt:mode==='invalid'?'bad':mode==='past'?'2025-01-01T00:00:00.000Z':mode==='future'?'2027-01-01T00:00:00.000Z':good.receipt.completedAt,adapterId:mode==='adapter'?'other':good.receipt.adapterId}},payload:'answer'};})};expect(await f.launcher.launchAsync(f.request,port)).toMatchObject({ok:false,reason:'OUTCOME_UNKNOWN'});}});
it('a different launch key and fresh launcher cannot reenter a running task',async()=>{const f=await fixture();let enter!:()=>void;let release!:()=>void;const entered=new Promise<void>(r=>enter=r);const held=new Promise<void>(r=>release=r);const port={invoke:vi.fn(async(req:MaoInvocationRequest)=>{enter();await held;return {invocationResult:receipt(req),payload:'answer'};})};const first=f.launcher.launchAsync(f.request,port);await entered;const restarted=new MaoOperationalWorkerLauncher(new MaoFileRunStore(f.root),createMaoDelegationAdapter(),new MaoLifecycleController('2026-11-13T00:00:00.000Z'));expect(await restarted.launchAsync({...f.request,launchIdempotencyKey:'different'},port)).toMatchObject({ok:false,reason:'DUPLICATE_LAUNCH_ADAPTER_NOT_CALLED'});release();expect((await first).ok).toBe(true);expect(port.invoke).toHaveBeenCalledTimes(1);});

// --- Root Amendment 2026-11-15: multi-task graph launch (Web v1 bounded role plan) ---
async function planFixture(maxInvocations = 3){
 const root=await mkdtemp(join(tmpdir(),'mao-plan-'));roots.push(root);
 const compiled=compileTaskGraph({authority:{workOrderId:'work-order-plan',route:'SINGLE_AGENT_MULTI_ROLE',riskLevel:'R1',budget:{maxInvocations,maxConcurrentRoles:2,maxRevisionDepth:1,tokenCostCeiling:null,wallClockCeilingMs:180000},closerActorId:'closer',approvalCheckpoints:[]},tasks:[
  {taskId:'draft',role:'worker',riskLevel:'R1',fileScope:['web-artifact/draft']},
  {taskId:'review',role:'reviewer',riskLevel:'R1',fileScope:['web-artifact/review'],requiresIsolatedSourcePacket:true},
  {taskId:'revise',role:'worker',riskLevel:'R1',fileScope:['web-artifact/revision']}]});
 if(!compiled.ok)throw Error(compiled.reason);const graph=compiled.graph;const store=new MaoFileRunStore(root);expect((await store.createRun(graph)).ok).toBe(true);
 const lifecycle=new MaoLifecycleController('2026-11-13T00:00:00.000Z');const launcher=new MaoOperationalWorkerLauncher(store,createMaoDelegationAdapter(),lifecycle);
 const requestFor=(taskId:string,role:string)=>({taskGraphId:graph.taskGraphId,taskId,admission:{taskGraphId:graph.taskGraphId,decision:'BOUNDED_ROLE_PLAN_ADMITTED' as const,approvalRequired:false,admittedRoles:['worker','reviewer']},capability:{role,requiredCapabilities:['text'],offeredCapabilities:['text']},inputManifest:[`input:${taskId}`],launchIdempotencyKey:`launch-${taskId}`});
 return {root,store,graph,launcher,lifecycle,requestFor,draft:requestFor('draft','worker'),review:requestFor('review','reviewer'),revise:requestFor('revise','worker')};
}
function roleReceipt(request:MaoInvocationRequest,role:string){const base=receipt(request);return {...base,receipt:{...base.receipt,role}};}
const roleOf:Record<string,string>={draft:'worker',review:'reviewer',revise:'worker'};
const planPort=()=>({invoke:vi.fn(async(req:MaoInvocationRequest)=>({invocationResult:roleReceipt(req,roleOf[req.taskId]),payload:`out-${req.taskId}`}))});

it('amended launcher: a three-task graph launches draft, review, revise sequentially with per-task role receipts',async()=>{
 const f=await planFixture();const port=planPort();
 expect(await f.launcher.launchAsync(f.draft,port)).toMatchObject({ok:true,payload:'out-draft'});
 expect(await f.launcher.launchAsync(f.review,port)).toMatchObject({ok:true,payload:'out-review'});
 expect(await f.launcher.launchAsync(f.revise,port)).toMatchObject({ok:true,payload:'out-revise'});
 expect(port.invoke.mock.calls.map(c=>c[0].taskId)).toEqual(['draft','review','revise']);
 const run=await f.store.resumeRun(f.graph.taskGraphId);
 expect(run.ok&&run.events.filter(e=>e.eventType==='INVOCATION_COMPLETED').map(e=>e.taskId)).toEqual(['draft','review','revise']);
 expect(run.ok&&run.events.every(e=>['succeeded','planned','admitted','running'].includes(e.resultingState))).toBe(true);
});
it('amended launcher: a reviewer-role receipt is accepted for the review task and a first-task worker role is rejected for it',async()=>{
 const f=await planFixture();const ok=planPort();
 expect((await f.launcher.launchAsync(f.draft,ok)).ok).toBe(true);expect((await f.launcher.launchAsync(f.review,ok)).ok).toBe(true);
 const g=await planFixture();const wrong={invoke:vi.fn(async(req:MaoInvocationRequest)=>({invocationResult:roleReceipt(req,'worker'),payload:'x'}))};
 expect((await g.launcher.launchAsync(g.draft,planPort())).ok).toBe(true);
 expect(await g.launcher.launchAsync(g.review,wrong)).toMatchObject({ok:false,reason:'OUTCOME_UNKNOWN'});
});
it('amended launcher: starting review while draft is running is refused without a port call',async()=>{
 const f=await planFixture();let enter!:()=>void;let release!:()=>void;const entered=new Promise<void>(r=>enter=r);const held=new Promise<void>(r=>release=r);
 const slow={invoke:vi.fn(async(req:MaoInvocationRequest)=>{enter();await held;return {invocationResult:roleReceipt(req,'worker'),payload:'draft'};})};
 const first=f.launcher.launchAsync(f.draft,slow);await entered;
 const other=planPort();const refused=await f.launcher.launchAsync(f.review,other);
 expect(refused).toMatchObject({ok:false,reason:'UNKNOWN_OR_NON_RUNNABLE_TASK'});expect(other.invoke).not.toHaveBeenCalled();
 release();expect((await first).ok).toBe(true);expect((await f.launcher.launchAsync(f.review,other)).ok).toBe(true);
});
it('amended launcher: a draft left unknown (running) blocks later tasks and an admitted-only task also blocks',async()=>{
 const f=await planFixture();const boom={invoke:vi.fn(async()=>{throw Error('uncertain');})};
 expect(await f.launcher.launchAsync(f.draft,boom)).toMatchObject({ok:false,reason:'OUTCOME_UNKNOWN'});
 const port=planPort();expect(await f.launcher.launchAsync(f.review,port)).toMatchObject({ok:false,reason:'UNKNOWN_OR_NON_RUNNABLE_TASK'});expect(port.invoke).not.toHaveBeenCalled();
 const g=await planFixture();const original=g.store.appendEvent.bind(g.store);
 vi.spyOn(g.store,'appendEvent').mockImplementation(async(id,event)=>event.eventType==='INVOCATION_STARTED'?{ok:false,reason:'IO_FAILURE',detail:'test'}:original(id,event));
 expect(await g.launcher.launchAsync(g.draft,port)).toMatchObject({ok:false,reason:'LIFECYCLE_MILESTONE_PERSISTENCE_FAILED'});
 vi.restoreAllMocks();expect(await g.launcher.launchAsync(g.review,port)).toMatchObject({ok:false,reason:'UNKNOWN_OR_NON_RUNNABLE_TASK'});expect(port.invoke).not.toHaveBeenCalled();
});
it('amended launcher: a start beyond maxInvocations is refused with INVOCATION_BUDGET_EXHAUSTED and no port call',async()=>{
 const f=await planFixture(2);const port=planPort();
 expect((await f.launcher.launchAsync(f.draft,port)).ok).toBe(true);expect((await f.launcher.launchAsync(f.review,port)).ok).toBe(true);
 expect(await f.launcher.launchAsync(f.revise,port)).toMatchObject({ok:false,reason:'INVOCATION_BUDGET_EXHAUSTED'});expect(port.invoke).toHaveBeenCalledTimes(2);
 const run=await f.store.resumeRun(f.graph.taskGraphId);expect(run.ok&&run.events.some(e=>e.taskId==='revise')).toBe(false);
});
it('amended launcher: a duplicate task launch, an unknown task and delegation are still refused in a multi-task graph',async()=>{
 const f=await planFixture();const port=planPort();
 expect((await f.launcher.launchAsync(f.draft,port)).ok).toBe(true);
 expect(await f.launcher.launchAsync(f.draft,port)).toMatchObject({ok:false,reason:'DUPLICATE_LAUNCH_ADAPTER_NOT_CALLED'});
 expect(await f.launcher.launchAsync({...f.draft,launchIdempotencyKey:'other-key'},port)).toMatchObject({ok:false,reason:'DUPLICATE_LAUNCH_ADAPTER_NOT_CALLED'});
 expect(await f.launcher.launchAsync({...f.review,taskId:'unknown'},port)).toMatchObject({ok:false,reason:'UNKNOWN_OR_NON_RUNNABLE_TASK',detail:'The target task is not declared in this graph.'});
 expect(await f.launcher.launchAsync({...f.review,delegation:{parentTaskId:'draft',depth:1,reservationKey:'r'}},port)).toMatchObject({ok:false,reason:'DELEGATION_UNSUPPORTED'});
 expect(port.invoke).toHaveBeenCalledTimes(1);
});
it('amended launcher: single-task graphs keep the original shape checks and reasons',async()=>{
 const f=await fixture();const port={invoke:vi.fn()};
 expect(await f.launcher.launchAsync({...f.request,taskId:'missing'},port)).toMatchObject({ok:false,reason:'UNKNOWN_OR_NON_RUNNABLE_TASK',detail:'Exactly one graph task is required.'});
 const root=await mkdtemp(join(tmpdir(),'mao-two-')); roots.push(root);
 const compiled=compileTaskGraph({authority:{workOrderId:'wo-2',route:'SINGLE_AGENT_SINGLE_ROLE',riskLevel:'R1',budget:{maxInvocations:2,maxConcurrentRoles:1,maxRevisionDepth:1,tokenCostCeiling:null,wallClockCeilingMs:null},closerActorId:'closer',approvalCheckpoints:[]},tasks:[{taskId:'task',role:'worker',riskLevel:'R1',fileScope:['source']}]});
 if(!compiled.ok)throw Error(compiled.reason);const store=new MaoFileRunStore(root);expect((await store.createRun(compiled.graph)).ok).toBe(true);
 const launcher=new MaoOperationalWorkerLauncher(store,createMaoDelegationAdapter(),new MaoLifecycleController('2026-11-13T00:00:00.000Z'));
 expect(await launcher.launchAsync({...f.request,taskGraphId:compiled.graph.taskGraphId},port)).toMatchObject({ok:false,reason:'UNKNOWN_OR_NON_RUNNABLE_TASK',detail:'Exactly one graph task is required.'});
 expect(port.invoke).not.toHaveBeenCalled();
});
