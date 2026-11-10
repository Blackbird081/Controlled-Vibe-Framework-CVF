import type { AtomicSQLiteRow, AtomicSQLiteWrite } from '../storage-adapter';
import { validateActionQuota, type ActionQuotaSnapshot } from 'cvf-model-gateway';

/** Pure decisions only. The Jev custody owner commits these with run and quota. */
export type JevTrialSpec = {
  schema: 'cvf.jevTrialSpec.v2'; trialId: string; authorizationDigest: string;
  sourceRevision: string; sourceDigest: string; transport: 'openrouter-systemone'; provider:'openrouter'; requestedModel:'typesafe/jev-1.14'; method:'system_one'; destination:'https://openrouter.ai/api/v1/systemone'; credentialEnv:'OPENROUTER_API_KEY'; reportedModels:['typesafe/jev-1.14-20261014']; rosterDigest: string;
  manifest: Record<string, string>; manifestDigest: string; expiresAt: string;
  maxCases: number; maxHttp: number; maxMicrounits: number; currency: 'USD';
  policyDigest: string; effectAuthorizationRef: string; dataBoundaryRef: string; costEnvelopeRef: string;
  pricing: { schema:'cvf.jevPricePin.v1'; identity:string; digest:string; evidenceType:'OFFLINE_SYNTHETIC'|'VERIFIED'; evidenceDigest:string; validUntil:string; currency:'USD'; inputMicrounitsPerMillion:number; outputMicrounitsPerMillion:number; wideInputLimit:number; wideOutputLimit:number; narrowInputLimit:number; narrowOutputLimit:number };
  wideMaxMicrounits: number; narrowMaxMicrounits: number; resultRetentionMs:number;
};
export type JevTrial = { schema: 'cvf.jevTrial.v2'; spec: JevTrialSpec; status: 'ACTIVE'|'STOPPED';
  reservedCases: number; reservedHttp: number; reservedMicrounits: number;
  inFlight: null | { caseId: string; runId: string; stageId: 'wide'|'narrow' } };
export type JevCase = { schema: 'cvf.jevTrialCase.v2'; trialId: string; caseId: string; runId: string;
  nonceHash: string; inputDigest: string; reservedHttp: number; reservedMicrounits: number };
const sha = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const keys = (v: unknown, k: string[]) => obj(v) && Object.keys(v).sort().join(',') === [...k].sort().join(',');
const positive = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) > 0;
const nonnegative = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const id = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(v);
const fail = (): never => { throw new Error('JEV_TRIAL_REFUSED'); };
export const trialKey = (trialId: string) => `trial:${trialId}`;
export const caseKey = (trialId: string, caseId: string) => `case:${trialId}:${caseId}`;
export function quote(input:number, output:number, p:JevTrialSpec['pricing']):number {
  if(!nonnegative(input)||!nonnegative(output))return fail();
  const n=BigInt(input)*BigInt(p.inputMicrounitsPerMillion)+BigInt(output)*BigInt(p.outputMicrounitsPerMillion);
  const rounded=(n+BigInt(999999))/BigInt(1000000); if(rounded>BigInt(Number.MAX_SAFE_INTEGER))return fail();return Number(rounded);
}
export function validateTrialSpec(v: unknown, digest: (value:string)=>string): JevTrialSpec {
  if (!keys(v,['schema','trialId','authorizationDigest','sourceRevision','sourceDigest','transport','provider','requestedModel','method','destination','credentialEnv','reportedModels','rosterDigest','manifest','manifestDigest','expiresAt','maxCases','maxHttp','maxMicrounits','currency','policyDigest','effectAuthorizationRef','dataBoundaryRef','costEnvelopeRef','pricing','wideMaxMicrounits','narrowMaxMicrounits','resultRetentionMs'])) return fail();
  const s=v as JevTrialSpec;
  const policyDigest=digest(JSON.stringify(Object.fromEntries(Object.entries(s).filter(([k])=>k!=='policyDigest').sort(([a],[b])=>a<b?-1:a>b?1:0))));
  if(s.policyDigest!==policyDigest)return fail();
  if(!keys(s.pricing,['schema','identity','digest','evidenceType','evidenceDigest','validUntil','currency','inputMicrounitsPerMillion','outputMicrounitsPerMillion','wideInputLimit','wideOutputLimit','narrowInputLimit','narrowOutputLimit']))return fail();
  const p=s.pricing;
  // Published per-token rates may be zero; request/token ceilings must remain positive.
  if(p.schema!=='cvf.jevPricePin.v1'||!p.identity||p.identity.length>200||!sha(p.digest)||p.currency!=='USD'||!['OFFLINE_SYNTHETIC','VERIFIED'].includes(p.evidenceType)||!sha(p.evidenceDigest)||typeof p.validUntil!=='string'||!Number.isFinite(Date.parse(p.validUntil))||new Date(p.validUntil).toISOString()!==p.validUntil||![p.inputMicrounitsPerMillion,p.outputMicrounitsPerMillion].every(nonnegative)||![p.wideInputLimit,p.wideOutputLimit,p.narrowInputLimit,p.narrowOutputLimit].every(positive))return fail();
  const pricingDigest=digest(JSON.stringify(Object.fromEntries(Object.entries(p).filter(([k])=>k!=='digest').sort(([a],[b])=>a<b?-1:a>b?1:0))));
  if(p.digest!==pricingDigest||!positive(s.wideMaxMicrounits)||!positive(s.narrowMaxMicrounits)||quote(p.wideInputLimit,p.wideOutputLimit,p)>s.wideMaxMicrounits||quote(p.narrowInputLimit,p.narrowOutputLimit,p)>s.narrowMaxMicrounits||!sha(s.policyDigest)||![s.effectAuthorizationRef,s.dataBoundaryRef,s.costEnvelopeRef].every(x=>typeof x==='string'&&x.length>0&&x.length<=200))return fail();
  if(s.schema!=='cvf.jevTrialSpec.v2'||!id(s.trialId)||!sha(s.authorizationDigest)||s.sourceRevision!=='JEV-S1-OPENROUTER-TRIAL-20261104'||!sha(s.sourceDigest)
    ||s.transport!=='openrouter-systemone'||s.provider!=='openrouter'||s.requestedModel!=='typesafe/jev-1.14'||s.method!=='system_one'||s.destination!=='https://openrouter.ai/api/v1/systemone'||s.credentialEnv!=='OPENROUTER_API_KEY'||!Array.isArray(s.reportedModels)||s.reportedModels.length!==1||s.reportedModels[0]!=='typesafe/jev-1.14-20261014'||!sha(s.rosterDigest)||!obj(s.manifest)||!sha(s.manifestDigest)
    ||!Object.keys(s.manifest).length||Object.keys(s.manifest).length>10||Object.entries(s.manifest).some(([k,x])=>!id(k)||!sha(x))
    ||s.manifestDigest!==digest(JSON.stringify(Object.fromEntries(Object.entries(s.manifest).sort(([a],[b])=>a<b?-1:a>b?1:0))))
    ||typeof s.expiresAt!=='string'||!Number.isFinite(Date.parse(s.expiresAt))||new Date(s.expiresAt).toISOString()!==s.expiresAt
    ||!positive(s.maxCases)||s.maxCases>10||s.maxCases>Object.keys(s.manifest).length||!positive(s.maxHttp)||s.maxHttp>20
    ||!positive(s.maxMicrounits)||s.maxMicrounits>100000||s.currency!=='USD'||!positive(s.resultRetentionMs)||s.resultRetentionMs>604800000) return fail();
  return s;
}
export function validateTrial(v: unknown, digest:(value:string)=>string): JevTrial {
  if(!keys(v,['schema','spec','status','reservedCases','reservedHttp','reservedMicrounits','inFlight']))return fail();
  const t=v as JevTrial; validateTrialSpec(t.spec,digest);
  if(t.schema!=='cvf.jevTrial.v2'||!['ACTIVE','STOPPED'].includes(t.status)||!nonnegative(t.reservedCases)||t.reservedCases>t.spec.maxCases
    ||!nonnegative(t.reservedHttp)||t.reservedHttp>t.spec.maxHttp||!nonnegative(t.reservedMicrounits)||t.reservedMicrounits>t.spec.maxMicrounits
    ||(t.inFlight!==null&&(!keys(t.inFlight,['caseId','runId','stageId'])||!id(t.inFlight.caseId)||typeof t.inFlight.runId!=='string'||!['wide','narrow'].includes(t.inFlight.stageId))))return fail();
  return t;
}
export function provisionTrial(rows: AtomicSQLiteRow[], spec:JevTrialSpec, digest:(value:string)=>string, now:number):AtomicSQLiteWrite {
  validateTrialSpec(spec,digest); if(Date.parse(spec.expiresAt)<=now||rows.some(r=>r.id===trialKey(spec.trialId)))return fail();
  return {id:trialKey(spec.trialId),expectedRevision:null,value:{schema:'cvf.jevTrial.v2',spec,status:'ACTIVE',reservedCases:0,reservedHttp:0,reservedMicrounits:0,inFlight:null} satisfies JevTrial};
}
export function trialRow(rows:AtomicSQLiteRow[], spec:JevTrialSpec, digest:(value:string)=>string, now:number, requireActive=true):{row:AtomicSQLiteRow; trial:JevTrial} {
  const row=rows.find(r=>r.id===trialKey(spec.trialId)); if(!row)return fail();
  const trial=validateTrial(row.value,digest);
  const cases=rows.filter(r=>r.id.startsWith(`case:${spec.trialId}:`));let http=0,moneyTotal=0;const runIds=new Set<string>();
  for(const item of cases){const c=item.value as JevCase;if(!keys(c,['schema','trialId','caseId','runId','nonceHash','inputDigest','reservedHttp','reservedMicrounits'])||c.schema!=='cvf.jevTrialCase.v2'||c.trialId!==spec.trialId||!id(c.caseId)||item.id!==caseKey(spec.trialId,c.caseId)||item.revision!==0||typeof c.runId!=='string'||!sha(c.nonceHash)||spec.manifest[c.caseId]!==c.inputDigest||c.reservedHttp!==2||c.reservedMicrounits!==spec.wideMaxMicrounits+spec.narrowMaxMicrounits||runIds.has(c.runId))return fail();runIds.add(c.runId);const rr=rows.find(r=>r.id===`run:${c.runId}`),qr=rows.find(r=>r.id===`quota:${c.runId}`);if(!rr||!qr||rr.revision!==qr.revision||!obj(rr.value)||rr.value.schema!=='cvf.jevSuggestionRun.v2'||rr.value.runId!==c.runId||rr.value.trialId!==c.trialId||rr.value.caseId!==c.caseId||rr.value.nonceHash!==c.nonceHash||rr.value.inputDigest!==c.inputDigest||rr.value.policyDigest!==spec.policyDigest)return fail();let q:ActionQuotaSnapshot;try{q=validateActionQuota(qr.value as ActionQuotaSnapshot);}catch{return fail();}if(q.reservationId!==c.runId||q.scopeId!==spec.policyDigest||q.currency!=='USD'||q.totalMicrounits!==c.reservedMicrounits||!Array.isArray(rr.value.stages)||rr.value.stages.length!==2)return fail();const stages=rr.value.stages;for(const [i,x] of stages.entries()){if(!obj(x)||x.stageId!==(i?'narrow':'wide')||typeof x.stageExecutionKey!=='string')return fail();const sq=q.stages[x.stageExecutionKey];if(!sq||sq.allocation!==(i?spec.narrowMaxMicrounits:spec.wideMaxMicrounits)||x.state==='NOT_STARTED'&&!['RESERVED','RELEASED'].includes(sq.state)||x.state==='START_COMMITTED'&&sq.state!=='STARTED'||x.state==='UNKNOWN'&&sq.state!=='UNKNOWN'||x.state==='SETTLED'&&(sq.state!=='SETTLED'||sq.cost!==x.costMicrounits)||!['NOT_STARTED','START_COMMITTED','UNKNOWN','SETTLED'].includes(String(x.state)))return fail();}if(Object.keys(q.stages).length!==2)return fail();http+=c.reservedHttp;moneyTotal+=c.reservedMicrounits;}
  if(cases.length!==trial.reservedCases||http!==trial.reservedHttp||moneyTotal!==trial.reservedMicrounits)return fail();
  if(trial.inFlight){const flight=trial.inFlight;const bound=cases.find(c=>c.id===caseKey(spec.trialId,flight.caseId));if(!bound||(bound.value as JevCase).runId!==flight.runId)return fail();const run=rows.find(r=>r.id===`run:${flight.runId}`);if(!run||!obj(run.value)||!Array.isArray(run.value.stages))return fail();const stage=run.value.stages.find((s:unknown)=>obj(s)&&s.stageId===flight.stageId);if(!obj(stage)||!['NOT_STARTED','START_COMMITTED','UNKNOWN'].includes(String(stage.state)))return fail();}
  if(JSON.stringify(trial.spec)!==JSON.stringify(spec)||(requireActive&&(trial.status!=='ACTIVE'||Date.parse(spec.expiresAt)<=now)))return fail();
  return {row,trial};
}
export function reserveTrialCase(rows:AtomicSQLiteRow[], spec:JevTrialSpec, c:JevCase, digest:(value:string)=>string, now:number):{writes:AtomicSQLiteWrite[];admitted:boolean} {
  const {row,trial}=trialRow(rows,spec,digest,now);
  if(!keys(c,['schema','trialId','caseId','runId','nonceHash','inputDigest','reservedHttp','reservedMicrounits'])||c.schema!=='cvf.jevTrialCase.v2'
    ||c.trialId!==spec.trialId||!id(c.caseId)||!c.runId||!sha(c.nonceHash)||spec.manifest[c.caseId]!==c.inputDigest
    ||!positive(c.reservedHttp)||c.reservedHttp>2||!positive(c.reservedMicrounits)||rows.some(r=>r.id===caseKey(c.trialId,c.caseId)))return fail();
  if(trial.reservedCases+1>spec.maxCases||trial.reservedHttp+c.reservedHttp>spec.maxHttp||trial.reservedMicrounits+c.reservedMicrounits>spec.maxMicrounits){
    trial.status='STOPPED';return {writes:[{id:row.id,expectedRevision:row.revision,value:trial}],admitted:false};
  }
  trial.reservedCases++;trial.reservedHttp+=c.reservedHttp;trial.reservedMicrounits+=c.reservedMicrounits;
  // A committed reservation is a durable lease before the first stage, so a lost submit acknowledgment cannot open the next case.
  if(!trial.inFlight)trial.inFlight={caseId:c.caseId,runId:c.runId,stageId:'wide'};
  return {writes:[{id:row.id,expectedRevision:row.revision,value:trial},{id:caseKey(c.trialId,c.caseId),expectedRevision:null,value:c}],admitted:true};
}
export function trialStage(rows:AtomicSQLiteRow[],spec:JevTrialSpec,c:JevCase,stageId:'wide'|'narrow',operation:'start'|'settle'|'stop',digest:(value:string)=>string,now:number):AtomicSQLiteWrite {
  const {row,trial}=trialRow(rows,spec,digest,now); const binding=rows.find(r=>r.id===caseKey(spec.trialId,c.caseId));
  if(!binding||JSON.stringify(binding.value)!==JSON.stringify(c))return fail();
  if(operation==='start'){if(trial.inFlight&&(trial.inFlight.caseId!==c.caseId||trial.inFlight.runId!==c.runId||trial.inFlight.stageId!==stageId))return fail();trial.inFlight={caseId:c.caseId,runId:c.runId,stageId};}
  else {if(!trial.inFlight||trial.inFlight.caseId!==c.caseId||trial.inFlight.runId!==c.runId||trial.inFlight.stageId!==stageId)return fail();
    if(operation==='stop')trial.status='STOPPED';else trial.inFlight=null;}
  return {id:row.id,expectedRevision:row.revision,value:trial};
}
