import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { CredentialBoundary, type AdapterAdmissionRecord } from 'cvf-model-gateway';
import { requireAdminApiSession } from '@/lib/admin-session';
import { buildGovernanceEnvelope } from '@/lib/web-governance-envelope';
import { createProviderAttemptLedger, buildProviderAttemptReconciliation } from '@/lib/provider-attempt-admission';
import { assertJevAdmission, createJevCanonicalPort, executeJevCanonicalStage } from '@/lib/canonical-web-gateway-execution';
import { loadVisibleSkills, suggestJevSkill, createJevNativeAdapter, visibleRosterDigest, type SkillCandidate, type JevNativeStageV1, type JevNativeStageV2 } from '@/lib/server/jev-capability-suggestion';
import { JevSuggestionCustody, JevCustodyError, jevDigest, jevPolicyDigest, validateJevPolicy, verifyJevGrant, JEV_RECIPE_REVISION, JEV_SOURCE_REVISION, type JevAuthorizedPolicy, type JevActionGrant, type JevActor, type JevRun, type JevStoredResult, type JevTrialGrant, type JevTrialRun } from '@/lib/server/jev-suggestion-custody';
import type { JevAuthorizedRuntime, JevTrialRuntime } from '@/lib/server/jev-authorized-runtime';

const reply=(status:number,body:Record<string,unknown>)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',Vary:'Cookie, Origin'}});
function sameOrigin(request:Request):boolean{try{const origin=request.headers.get('origin');const site=request.headers.get('sec-fetch-site');return !!origin&&origin===new URL(request.url).origin&&(!site||site==='same-origin');}catch{return false;}}
/** Same native getToken default cookie name; bearer fallback is refused by this pilot. */
export function verifiedJevCookieBinding(request:NextRequest):string|null{
  if(request.headers.has('authorization'))return null;
  const parts=request.cookies.getAll().filter(c=>/^authjs\.session-token(?:\.\d+)?$/.test(c.name));
  if(!parts.length||parts.length>20||new Set(parts.map(c=>c.name)).size!==parts.length)return null;
  const base=parts.find(p=>p.name==='authjs.session-token');
  if(base)return parts.length===1&&base.value?jevDigest(base.value):null;
  const sorted=parts.sort((a,b)=>Number(a.name.split('.').at(-1))-Number(b.name.split('.').at(-1)));
  if(sorted.some((p,i)=>p.name!==`authjs.session-token.${i}`||!p.value))return null;
  return jevDigest(sorted.map(p=>p.value).join(''));
}
export function buildJevActionGrant(input:{actor:JevActor;nonce:string;goal:string;roster:SkillCandidate[];sessionExpiresAt:number;canonicalExecutionId:string;policy:JevAuthorizedPolicy;now:number}):JevActionGrant{
  validateJevPolicy(input.policy,input.now);
  const grant:JevActionGrant={runId:randomUUID(),canonicalExecutionId:input.canonicalExecutionId,executionToken:randomUUID()+randomUUID(),actor:input.actor,
    nonceHash:jevDigest(input.nonce),inputDigest:jevDigest(input.goal),rosterDigest:visibleRosterDigest(input.roster),recipeRevision:JEV_RECIPE_REVISION,sourceRevision:JEV_SOURCE_REVISION,
    policyDigest:jevPolicyDigest(input.policy),expiresAt:new Date(Math.min(input.sessionExpiresAt,Date.parse(input.policy.expiresAt))).toISOString(),provider:'typesafe',model:'jev-latest',method:'system_one',maxStages:2};
  verifyJevGrant(grant,input.policy,input.now);return grant;
}
type Dependencies={auth?:typeof requireAdminApiSession;configured?:()=>boolean;
  loadRuntimeSnapshot?:()=>Promise<JevAuthorizedRuntime>;
  loadAuthorizedJevPolicy?:()=>JevAuthorizedPolicy|undefined|Promise<JevAuthorizedPolicy|undefined>;
  loadAdapterAdmission?:()=>AdapterAdmissionRecord|undefined;roster?:()=>Promise<SkillCandidate[]>;
  credential?:()=>CredentialBoundary;transport?:typeof fetch;now?:()=>number};
function presentTrial(run:JevTrialRun):Record<string,unknown>{
  const stages=run.stages.filter(s=>s.state==='SETTLED');const result=run.result?.status==='suggested'?{status:'suggested',title:run.result.presentation?.title,domain:run.result.presentation?.domain,href:run.result.presentation?.existingSkillHref,reason:run.result.reasonCode,model:stages.at(-1)?.reportedModel??null}:run.result?{status:'no_match',reason:run.result.reasonCode,model:stages.at(-1)?.reportedModel??null}:null;
  const uncertain=run.stages.some(s=>s.state==='UNKNOWN'||s.state==='START_COMMITTED');return {provider:'OpenRouter / TypeSafe Jev',connection:'openrouter-systemone',destination:'https://openrouter.ai/api/v1/systemone',rosterMetadataEgress:true,observed:stages.length>0||run.terminal?.providerContact==='RESPONSE_OBSERVED',runId:run.runId,recordVersion:run.revision,state:run.result?(run.result.status==='suggested'?'SUCCEEDED':'NO_MATCH'):uncertain?'UNKNOWN_TERMINAL':run.terminal?'FAILED':'RESERVED',result,terminal:run.terminal,providerContact:run.terminal?.providerContact??(stages.length?'RESPONSE_OBSERVED':uncertain?'POSSIBLE':'NOT_STARTED'),requestedModel:run.model,costStatus:uncertain?'UNKNOWN':stages.length?'REPORTED':'UNKNOWN'};
}
function present(run:JevRun):Record<string,unknown>{
  const stages=run.stages.filter(s=>s.state==='RESPONSE_VALIDATED');
  const sum=(key:'inputTokens'|'outputTokens')=>stages.length&&stages.every(s=>s[key]!==null)?stages.reduce((n,s)=>n+s[key]!,0):null;
  const result=run.result?run.result.status==='suggested'?{status:'suggested',title:run.result.presentation!.title,domain:run.result.presentation!.domain,href:run.result.presentation!.existingSkillHref,reason:'CATALOG_TASK_FIT',model:stages.at(-1)?.reportedModel??null,inputTokens:sum('inputTokens'),outputTokens:sum('outputTokens')}:{status:'no_match',reason:run.result.reasonCode,model:stages.at(-1)?.reportedModel??null,inputTokens:sum('inputTokens'),outputTokens:sum('outputTokens')}:null;
  return {provider:'TypeSafe Jev',runId:run.runId,recordVersion:run.revision,state:run.state,result,terminal:run.terminal,providerContact:run.terminal?.providerContact??(run.stages.some(s=>s.state==='START_COMMITTED')?'POSSIBLE':'NOT_STARTED'),requestedModel:'jev-latest'};
}
export function skillSuggestionHandlers(deps:Dependencies={}){
  const auth=deps.auth??requireAdminApiSession;const now=deps.now??Date.now;
  const configured=(connection:'typesafe'|'openrouter-systemone'='typesafe')=>deps.configured?deps.configured():process.env.CVF_JEV_SUGGESTION_ENABLED==='1'
    &&new CredentialBoundary().resolveMetadata(connection==='typesafe'?{providerId:'typesafe',keyId:'jev-server-typesafe',envNames:['TYPESAFE_API_KEY']}:{providerId:'openrouter',keyId:'jev-server-openrouter',envNames:['OPENROUTER_API_KEY']}).available;
  async function principal(request:NextRequest){
    const session=await auth(request,'/api/skills/suggest',{ownerOnly:true,allowBreakGlass:false});
    if(session instanceof NextResponse)return session;
    const binding=verifiedJevCookieBinding(request);
    if(session.authMode!=='session'||session.role!=='owner'||session.realUserId||session.impersonation||!Number.isFinite(session.expiresAt)||session.expiresAt<=now()||!binding)return reply(403,{error:'SESSION_REFUSED'});
    return {actor:{userId:session.userId,orgId:session.orgId,teamId:session.teamId,sessionBindingHash:binding},expiresAt:session.expiresAt};
  }
  async function policy(){const p=await deps.loadAuthorizedJevPolicy?.();if(p)validateJevPolicy(p,now());return p;}
  function failed(error:unknown,metadata:Record<string,unknown>={}){if(error instanceof JevCustodyError)return reply(error.code==='CONFLICT'?409:error.code==='NOT_FOUND'?404:error.code==='EXPIRED'?410:403,{...metadata,error:error.code});return reply(503,{...metadata,error:'JEV_EXECUTION_BLOCKED'});}
  function trialAvailability(snapshot:JevTrialRuntime):Record<string,unknown>{
    let trialStatus:'ACTIVE'|'STOPPED'|'EXPIRED'|'IN_FLIGHT'|'UNAVAILABLE'='UNAVAILABLE';
    try{assertJevAdmission(snapshot.admission,'openrouter-systemone');trialStatus=JevSuggestionCustody.trialStatus(snapshot.directory,snapshot.trialSpec,now());}catch{/* unreadable custody never advertises admission */}
    const ready=configured('openrouter-systemone');
    return {configured:ready,admitted:ready&&trialStatus==='ACTIVE',trialStatus,provider:'OpenRouter / TypeSafe Jev',connection:'openrouter-systemone',destination:'https://openrouter.ai/api/v1/systemone',requestedModel:'typesafe/jev-1.14',rosterMetadataEgress:true,costStatus:'UNKNOWN'};
  }
  function trialReply(snapshot:JevTrialRuntime,status:number,body:Record<string,unknown>){return reply(status,{...trialAvailability(snapshot),...body});}
  async function executeTrial(snapshot:JevTrialRuntime,actor:JevActor,sessionExpiresAt:number,goal:string,nonce:string,request:NextRequest):Promise<NextResponse>{
    const spec=snapshot.trialSpec;const matches=Object.entries(spec.manifest).filter(([,digest])=>digest===jevDigest(goal));if(matches.length!==1)return trialReply(snapshot,403,{error:'ACTION_REFUSED'});
    const caseId=matches[0][0];const existing=JevSuggestionCustody.lookupTrialCase(snapshot.directory,spec,actor,caseId,jevDigest(nonce),jevDigest(goal),now());if(existing)return trialReply(snapshot,200,presentTrial(existing));
    assertJevAdmission(snapshot.admission,'openrouter-systemone');if(!configured('openrouter-systemone'))return trialReply(snapshot,503,{error:'JEV_NOT_CONFIGURED'});
    const envelope=buildGovernanceEnvelope({routeId:'/api/skills/suggest',surfaceClass:'governance-execution',evidenceMode:'none',actorId:actor.userId,actorRole:'owner',providerLane:'openrouter'});
    const grant:JevTrialGrant={schema:'cvf.jevActionGrant.v2',spec,caseId,runId:randomUUID(),canonicalExecutionId:envelope.envelopeId,executionToken:randomUUID()+randomUUID(),actor,nonceHash:jevDigest(nonce),inputDigest:jevDigest(goal),expiresAt:new Date(Math.min(sessionExpiresAt,Date.parse(spec.expiresAt),Date.parse(spec.pricing.validUntil))).toISOString(),provider:'openrouter',model:'typesafe/jev-1.14',method:'system_one'};
    const inserted=JevSuggestionCustody.submitTrial(snapshot.directory,grant,now());if(!inserted.created)return trialReply(snapshot,200,presentTrial(inserted.run));let run=inserted.run;
    let expected:JevNativeStageV2|undefined;const credential=(deps.credential??(()=>new CredentialBoundary()))();const reference={providerId:'openrouter',keyId:'jev-server-openrouter',envNames:['OPENROUTER_API_KEY']};
    const adapter=createJevNativeAdapter({connection:'openrouter-systemone',credential,reference,expectedStage:()=>expected,reportedModels:['typesafe/jev-1.14-20261014'],transport:deps.transport});
    const port=createJevCanonicalPort({connection:'openrouter-systemone',adapter,credential,reference,admission:snapshot.admission});const ledger=createProviderAttemptLedger({identityKind:'session',identityHash:actor.sessionBindingHash,providerModel:'openrouter/typesafe/jev-1.14'});
    try{const result=await suggestJevSkill(goal,snapshot.roster,async(stageId,body)=>{
      const current=await principal(request);if(current instanceof NextResponse||JSON.stringify(current.actor)!==JSON.stringify(actor)||request.signal.aborted)throw Error('SESSION_REFUSED');
      const stage=run.stages[stageId==='wide'?0:1];expected={schema:'cvf.jevNativeStage.v2',transport:'openrouter-systemone',trialId:spec.trialId,caseId,method:'system_one',stageId,runId:run.runId,canonicalExecutionId:run.canonicalExecutionId,stageExecutionKey:stage.stageExecutionKey,inputDigest:run.inputDigest,rosterDigest:run.rosterDigest,recipeRevision:JEV_RECIPE_REVISION,...body};
      const response=await executeJevCanonicalStage(port,{connection:'openrouter-systemone',canonicalExecutionId:run.canonicalExecutionId,stageId,ledger,admission:snapshot.admission,signal:request.signal,verifyAndCommitStart:()=>{run=JevSuggestionCustody.startTrial(snapshot.directory,grant,run.revision,stageId,now());},onRetainedReservation:()=>{}},JSON.stringify(expected));expected=undefined;
      if(response.error||!response.response||response.attemptOutcome!=='invoked'||response.receipt.canonicalExecutionId!==run.canonicalExecutionId||response.receipt.traceId!==run.canonicalExecutionId||response.receipt.providerId!=='openrouter'||response.receipt.selectedModelId!=='typesafe/jev-1.14'||response.receipt.fallback)throw Error('JEV_STAGE_FAILED');
      const projection=JSON.parse(response.response.text) as {model:string;usage:{input_tokens:number|null;output_tokens:number|null;costMicrounits:number|null}};
      const inputLimit=stageId==='wide'?spec.pricing.wideInputLimit:spec.pricing.narrowInputLimit;const outputLimit=stageId==='wide'?spec.pricing.wideOutputLimit:spec.pricing.narrowOutputLimit;
      const usageValid=Number.isSafeInteger(projection.usage.input_tokens)&&Number.isSafeInteger(projection.usage.output_tokens)&&projection.usage.input_tokens!>=0&&projection.usage.output_tokens!>=0&&projection.usage.input_tokens!<=inputLimit&&projection.usage.output_tokens!<=outputLimit;
      run=JevSuggestionCustody.settleTrial(snapshot.directory,grant,run.revision,stageId,{costMicrounits:usageValid?projection.usage.costMicrounits:null,reportedModel:projection.model,gatewayReceiptId:response.receipt.receiptId,receiptDigest:jevDigest(JSON.stringify({receiptId:response.receipt.receiptId,canonicalExecutionId:response.receipt.canonicalExecutionId,stageExecutionKey:stage.stageExecutionKey})),inputTokens:projection.usage.input_tokens,outputTokens:projection.usage.output_tokens},now());
      if(run.stages[stageId==='wide'?0:1].state!=='SETTLED')throw Error('TRIAL_STOPPED');return projection;
    });
    const skill=result.status==='suggested'?snapshot.roster.find(s=>`/skills/${s.domainId}/${s.skillId}`===result.href):undefined;
    const stored:JevStoredResult={schema:'cvf.jevSuggestionResult.v1',resultVersion:1,status:result.status,catalogSkillId:skill?`${skill.domainId}/${skill.skillId}`:null,reasonCode:skill?'CATALOG_TASK_FIT':run.stages[1].state==='SETTLED'?'NATIVE_LOW_FIT':'NATIVE_NO_WORKFLOW',presentation:skill?{title:skill.title,domain:skill.domain,existingSkillHref:`/skills/${skill.domainId}/${skill.skillId}`}:null,validatedStageIds:run.stages.filter(s=>s.state==='SETTLED').map(s=>s.stageId)};
    run=JevSuggestionCustody.finishTrial(snapshot.directory,grant,run.revision,stored,now());
    }catch{const active=run.stages.find(s=>s.state==='START_COMMITTED');if(active){try{run=JevSuggestionCustody.settleTrial(snapshot.directory,grant,run.revision,active.stageId,null,now());}catch{return trialReply(snapshot,503,{error:'COMMIT_UNKNOWN',runId:run.runId,providerContact:'POSSIBLE'});}}else if(!run.stages.some(s=>s.state==='UNKNOWN')){try{run=JevSuggestionCustody.stopTrial(snapshot.directory,grant,now());}catch{return trialReply(snapshot,503,{error:'COMMIT_UNKNOWN',runId:run.runId,providerContact:'POSSIBLE'});}}}
    return trialReply(snapshot,run.result?200:502,{...presentTrial(run),providerAttemptReconciliation:buildProviderAttemptReconciliation(ledger,'openrouter','typesafe/jev-1.14')});
  }
  return {
    async GET(request:NextRequest):Promise<NextResponse>{
      const actor=await principal(request);if(actor instanceof NextResponse)return actor;
      try{const runId=request.nextUrl.searchParams.get('runId');const retainedDirectory=process.env.CVF_JEV_CUSTODY_DIRECTORY;
        if(runId&&retainedDirectory){const retained=JevSuggestionCustody.readRetained(retainedDirectory,actor.actor,runId,now());return reply(200,retained.schema==='cvf.jevSuggestionRun.v2'?presentTrial(retained):present(retained));}
        const snapshot=deps.loadRuntimeSnapshot?await deps.loadRuntimeSnapshot():undefined;
        if(snapshot&&'trialSpec' in snapshot)return reply(200,{...trialAvailability(snapshot),observed:false,connected:false});
        const p=snapshot?.policy??await policy();
        if(runId){if(!p)return reply(503,{error:'CUSTODY_UNAVAILABLE'});return reply(200,present(new JevSuggestionCustody(p,now).read(actor.actor,runId)));}
        let admitted=false;try{assertJevAdmission(snapshot?.admission??deps.loadAdapterAdmission?.());admitted=!!p;}catch{/* configuration is not authority */}
        return reply(200,{configured:configured(),admitted,observed:false,connected:false,provider:'TypeSafe Jev'});
      }catch(error){return failed(error);}
    },
    async POST(request:NextRequest):Promise<NextResponse>{
      if(!sameOrigin(request))return reply(403,{error:'ORIGIN_REFUSED'});
      const actor=await principal(request);if(actor instanceof NextResponse)return actor;
      if(!(request.headers.get('content-type')??'').toLowerCase().startsWith('application/json'))return reply(415,{error:'JSON_REQUIRED'});
      const declared=request.headers.get('content-length');if(declared&&(!/^\d+$/.test(declared)||Number(declared)>2500))return reply(413,{error:'BODY_TOO_LARGE'});
      let body:unknown;
      try{const reader=request.body?.getReader();if(!reader)return reply(422,{error:'INVALID_REQUEST'});const chunks:Uint8Array[]=[];let total=0;
        for(;;){const{done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>2500){await reader.cancel();return reply(413,{error:'BODY_TOO_LARGE'});}chunks.push(value);}
        const bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);body=JSON.parse(raw);
        if((raw.match(/"(?:[^"\\]|\\[\s\S])*"/g)??[]).length!==4)return reply(422,{error:'INVALID_REQUEST'});
      }catch{return reply(422,{error:'INVALID_REQUEST'});}
      if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).sort().join(',')!=='goal,nonce')return reply(422,{error:'INVALID_REQUEST'});
      const {goal:rawGoal,nonce}=body as {goal:unknown;nonce:unknown};if(typeof rawGoal!=='string'||typeof nonce!=='string'||!/^[a-zA-Z0-9_-]{16,100}$/.test(nonce))return reply(422,{error:'INVALID_REQUEST'});
      const goal=rawGoal.trim();if(goal.length<8||goal.length>1000)return reply(422,{error:'GOAL_LENGTH'});
      try{
        const snapshot=deps.loadRuntimeSnapshot?await deps.loadRuntimeSnapshot():undefined;
        if(snapshot&&'trialSpec' in snapshot){try{return await executeTrial(snapshot,actor.actor,actor.expiresAt,goal,nonce,request);}catch(error){return failed(error,trialAvailability(snapshot));}}
        const p=snapshot?.policy??await policy();if(!p)return reply(503,{error:'JEV_ACTION_NOT_AUTHORIZED'});
        const roster=snapshot?.roster??await(deps.roster??loadVisibleSkills)();
        const inputDigest=jevDigest(goal),rosterDigest=visibleRosterDigest(roster);
        if(snapshot&&(inputDigest!==snapshot.approvedGoalDigest||rosterDigest!==snapshot.singleAction.rosterDigest))return reply(403,{error:'ACTION_REFUSED'});
        const custody=new JevSuggestionCustody(p,now);
        const existing=snapshot?null:custody.lookup(actor.actor,jevDigest(nonce),inputDigest,rosterDigest);
        if(existing)return reply(200,present(custody.read(actor.actor,existing.runId)));
        const admission=snapshot?.admission??deps.loadAdapterAdmission?.();assertJevAdmission(admission);
        if(!configured())return reply(503,{error:'JEV_NOT_CONFIGURED'});
        const envelope=buildGovernanceEnvelope({routeId:'/api/skills/suggest',surfaceClass:'governance-execution',evidenceMode:'none',actorId:actor.actor.userId,actorRole:'owner',providerLane:'typesafe'});
        const grant=buildJevActionGrant({actor:actor.actor,nonce,goal,roster,sessionExpiresAt:actor.expiresAt,canonicalExecutionId:envelope.envelopeId,policy:p,now:now()});
        const inserted=custody.submit(grant,snapshot?.singleAction);if(!inserted.created)return reply(200,present(custody.read(actor.actor,inserted.run.runId)));
        let run=inserted.run;let expected:JevNativeStageV1|undefined;
        const credential=(deps.credential??(()=>new CredentialBoundary()))();
        const reference={providerId:'typesafe',keyId:'jev-server-typesafe',envNames:['TYPESAFE_API_KEY']};
        const adapter=createJevNativeAdapter({credential,reference,expectedStage:()=>expected,reportedModels:p.reportedModels,transport:deps.transport});
        const port=createJevCanonicalPort({adapter,credential,reference,admission:admission!});
        const ledger=createProviderAttemptLedger({identityKind:'session',identityHash:actor.actor.sessionBindingHash,providerModel:'typesafe/jev-latest'});
        try{
          const result=await suggestJevSkill(goal,roster,async(stageId,stageBody)=>{
            const current=await principal(request);if(current instanceof NextResponse||JSON.stringify(current.actor)!==JSON.stringify(actor.actor))throw new JevCustodyError('ACTION_REFUSED');
            verifyJevGrant(grant,p,now(),current.actor);if(request.signal.aborted)throw new Error('CANCELLED');
            const stage=run.stages[stageId==='wide'?0:1];expected={schema:'cvf.jevNativeStage.v1',method:'system_one',stageId,runId:run.runId,canonicalExecutionId:run.canonicalExecutionId,stageExecutionKey:stage.stageExecutionKey,inputDigest:run.inputDigest,rosterDigest:run.rosterDigest,recipeRevision:JEV_RECIPE_REVISION,...stageBody};
            const response=await executeJevCanonicalStage(port,{canonicalExecutionId:run.canonicalExecutionId,stageId,ledger,admission,signal:request.signal,
              verifyAndCommitStart:(_selected,index)=>{verifyJevGrant(grant,p,now(),current.actor);run=custody.start(grant,run.revision,stageId,index);},
              onRetainedReservation:()=>{run=custody.terminate(grant,run.revision,'RESERVATION_RETAINED_NO_INVOCATION');}},JSON.stringify(expected));
            expected=undefined;
            if(response.error||!response.response||response.attemptOutcome!=='invoked'||response.receipt.canonicalExecutionId!==run.canonicalExecutionId||response.receipt.traceId!==run.canonicalExecutionId
              ||response.receipt.providerId!=='typesafe'||response.receipt.selectedModelId!=='jev-latest'||response.receipt.fallback)throw new Error('JEV_STAGE_FAILED');
            const projection=JSON.parse(response.response.text) as {model:string;usage:{input_tokens:number|null;output_tokens:number|null}};
            run=custody.settle(grant,run.revision,stageId,{canonicalExecutionId:run.canonicalExecutionId,stageExecutionKey:stage.stageExecutionKey,inputDigest:run.inputDigest,rosterDigest:run.rosterDigest,
              gatewayReceiptId:response.receipt.receiptId,receiptDigest:jevDigest(JSON.stringify({receiptId:response.receipt.receiptId,canonicalExecutionId:response.receipt.canonicalExecutionId,stageExecutionKey:stage.stageExecutionKey})),reportedModel:projection.model,httpStatus:200,inputTokens:projection.usage.input_tokens,outputTokens:projection.usage.output_tokens,costMicrounits:null});
            return projection;
          });
          const skill=result.status==='suggested'?roster.find(s=>`/skills/${s.domainId}/${s.skillId}`===result.href):undefined;
          const stored:JevStoredResult={schema:'cvf.jevSuggestionResult.v1',resultVersion:1,status:result.status,catalogSkillId:skill?`${skill.domainId}/${skill.skillId}`:null,reasonCode:skill?'CATALOG_TASK_FIT':run.stages[1].state==='RESPONSE_VALIDATED'?'NATIVE_LOW_FIT':'NATIVE_NO_WORKFLOW',presentation:skill?{title:skill.title,domain:skill.domain,existingSkillHref:`/skills/${skill.domainId}/${skill.skillId}`}:null,validatedStageIds:run.stages.filter(s=>s.state==='RESPONSE_VALIDATED').map(s=>s.stageId)};
          run=custody.finish(grant,run.revision,stored);
        }catch{
          if(!run.terminal){try{run=custody.terminate(grant,run.revision,request.signal.aborted?'CANCELLED':'PROVIDER_UNAVAILABLE');}catch{return reply(503,{error:'COMMIT_UNKNOWN',runId:grant.runId,providerContact:'POSSIBLE',providerAttemptReconciliation:buildProviderAttemptReconciliation(ledger,'typesafe','jev-latest')});}}
        }
        return reply(run.result?200:502,{...present(run),providerAttemptReconciliation:buildProviderAttemptReconciliation(ledger,'typesafe','jev-latest')});
      }catch(error){return failed(error);}
    },
  };
}
