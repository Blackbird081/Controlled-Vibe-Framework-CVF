import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { reserveActionQuota, transitionActionQuota, validateActionQuota, type ActionQuotaSnapshot } from 'cvf-model-gateway';
import { SQLiteAtomicRecordAdapter, type AtomicSQLiteRow, type AtomicSQLiteWrite } from '../storage-adapter';
import { provisionTrial, reserveTrialCase, trialStage, trialRow, validateTrial, validateTrialSpec, caseKey, type JevTrialSpec, type JevCase } from './jev-trial-custody';

export const JEV_RECIPE_REVISION = 'cvf.jevSkillSuggestion.v2';
export const JEV_SOURCE_REVISION = 'JEV-S1-J04';
export const jevDigest = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');
const sha = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const exact = (v: unknown, keys: string[]): boolean => obj(v) && Object.keys(v).sort().join(',') === [...keys].sort().join(',');
const money = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const utc = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
export class JevCustodyError extends Error {
  constructor(readonly code: 'CONFLICT' | 'NOT_FOUND' | 'EXPIRED' | 'CORRUPT' | 'ACTION_REFUSED' | 'STAGE_REFUSED') { super(code); }
}
export type JevActor = { userId: string; orgId: string; teamId: string; sessionBindingHash: string };
export type JevAuthorizedPolicy = {
  schema: 'cvf.jevAuthorizedPolicy.v1'; policyDigest: string;
  effectAuthorizationRef: string; dataBoundaryRef: string; costEnvelopeRef: string;
  authorizationEvidenceDigest: string; destination: 'https://api.typesafe.ai/v1/systemone';
  directory: string; writerIdentity: string; resultRetentionMs: number; tombstoneRetentionMs: number;
  currency: string; wideMaxMicrounits: number; narrowMaxMicrounits: number; totalMaxMicrounits: number;
  pricingIdentity: string; reportedModels: string[]; expiresAt: string;
};
export function jevPolicyDigest(policy: Omit<JevAuthorizedPolicy, 'policyDigest'> | JevAuthorizedPolicy): string {
  return jevDigest(JSON.stringify(Object.fromEntries(Object.entries(policy).filter(([k]) => k !== 'policyDigest').sort(([a], [b]) => a.localeCompare(b)))));
}
export function validateJevPolicy(policy: JevAuthorizedPolicy, now = Date.now()): void {
  if (!exact(policy, ['schema','policyDigest','effectAuthorizationRef','dataBoundaryRef','costEnvelopeRef','authorizationEvidenceDigest','destination','directory','writerIdentity','resultRetentionMs','tombstoneRetentionMs','currency','wideMaxMicrounits','narrowMaxMicrounits','totalMaxMicrounits','pricingIdentity','reportedModels','expiresAt'])
    || policy.schema !== 'cvf.jevAuthorizedPolicy.v1' || policy.policyDigest !== jevPolicyDigest(policy)
    || !sha(policy.authorizationEvidenceDigest) || !path.isAbsolute(policy.directory) || !policy.writerIdentity
    || policy.destination !== 'https://api.typesafe.ai/v1/systemone' || !utc(policy.expiresAt) || Date.parse(policy.expiresAt) <= now
    || ![policy.effectAuthorizationRef,policy.dataBoundaryRef,policy.costEnvelopeRef,policy.pricingIdentity].every(v => typeof v === 'string' && v.length > 0 && v.length <= 200)
    || ![policy.resultRetentionMs,policy.tombstoneRetentionMs,policy.wideMaxMicrounits,policy.narrowMaxMicrounits,policy.totalMaxMicrounits].every(v => money(v) && v > 0)
    || !/^[A-Z]{3}$/.test(policy.currency) || policy.wideMaxMicrounits + policy.narrowMaxMicrounits > policy.totalMaxMicrounits
    || !Array.isArray(policy.reportedModels) || policy.reportedModels.length < 1 || policy.reportedModels.length > 20
    || !policy.reportedModels.every(v => /^jev-[a-zA-Z0-9._-]{1,60}$/.test(v))) throw new JevCustodyError('ACTION_REFUSED');
}
export type JevActionGrant = {
  runId: string; canonicalExecutionId: string; executionToken: string; actor: JevActor;
  nonceHash: string; inputDigest: string; rosterDigest: string; recipeRevision: string; sourceRevision: string;
  policyDigest: string; expiresAt: string; provider: 'typesafe'; model: 'jev-latest'; method: 'system_one'; maxStages: 2;
};
/** Optional caller boundary. Existing three-record submit callers remain unchanged. */
export type JevSingleActionConstraint = {
  authorizationEvidenceDigest: string; effectAuthorizationRef: string;
  inputDigest: string; rosterDigest: string;
};
export type JevStage = {
  stageId: 'wide' | 'narrow'; stageExecutionKey: string; canonicalExecutionId: string; attemptIndex: 0 | 1;
  state: 'NOT_STARTED' | 'START_COMMITTED' | 'RESPONSE_VALIDATED' | 'FAILED' | 'UNKNOWN';
  provider: 'typesafe'; requestedModel: 'jev-latest'; reportedModel: string | null;
  gatewayReceiptId: string | null; receiptDigest: string | null; httpStatus: number | null;
  inputTokens: number | null; outputTokens: number | null; costMicrounits: number | null;
  startedAt: string | null; finishedAt: string | null;
};
export type JevStoredResult = {
  schema: 'cvf.jevSuggestionResult.v1'; resultVersion: 1; status: 'suggested' | 'no_match'; catalogSkillId: string | null;
  reasonCode: 'NATIVE_NO_WORKFLOW' | 'NATIVE_LOW_FIT' | 'CATALOG_TASK_FIT';
  presentation: null | { title: string; domain: string; existingSkillHref: string }; validatedStageIds: ('wide' | 'narrow')[];
};
export type JevSafeCode = 'COMPLETED' | 'NO_MATCH' | 'SESSION_REFUSED' | 'ACTION_REFUSED' | 'STORAGE_FAILED' | 'COMMIT_UNKNOWN' | 'PROVIDER_UNAVAILABLE' | 'PROVIDER_RESPONSE_INVALID' | 'CANCELLED' | 'INTERRUPTED' | 'POSSIBLE_SEND' | 'RESERVATION_RETAINED_NO_INVOCATION';
export type JevRun = {
  schema: 'cvf.jevSuggestionRun.v1'; runId: string; canonicalExecutionId: string; revision: number; actor: JevActor;
  nonceHash: string; inputDigest: string; rosterDigest: string; recipeRevision: string; sourceRevision: string;
  authority: { effectAuthorizationRef: string; dataBoundaryRef: string; costEnvelopeRef: string };
  quota: { scopeId: string; reservationId: string; currency: string; reservedMicrounits: number; settledMicrounits: number | null; settlement: 'RESERVED' | 'SETTLED' | 'UNKNOWN' };
  createdAt: string; sessionExpiresAt: string; resultExpiresAt: string; tombstoneExpiresAt: string;
  state: 'RESERVED' | 'WIDE_STARTED' | 'WIDE_VALIDATED' | 'NARROW_STARTED' | 'SUCCEEDED' | 'NO_MATCH' | 'FAILED' | 'CANCELLED' | 'UNKNOWN_TERMINAL';
  lease: null | { executionTokenHash: string; expiresAt: string }; stages: JevStage[]; result: JevStoredResult | null;
  terminal: null | { safeCode: JevSafeCode; outcomeKnown: boolean; providerContact: 'NOT_STARTED' | 'POSSIBLE' | 'RESPONSE_OBSERVED'; at: string };
};
const runKeys = ['schema','runId','canonicalExecutionId','revision','actor','nonceHash','inputDigest','rosterDigest','recipeRevision','sourceRevision','authority','quota','createdAt','sessionExpiresAt','resultExpiresAt','tombstoneExpiresAt','state','lease','stages','result','terminal'];
const stageKeys = ['stageId','stageExecutionKey','canonicalExecutionId','attemptIndex','state','provider','requestedModel','reportedModel','gatewayReceiptId','receiptDigest','httpStatus','inputTokens','outputTokens','costMicrounits','startedAt','finishedAt'];
export function jevStageKey(runId: string, canonicalExecutionId: string, stageId: string): string { return jevDigest(JSON.stringify([runId, canonicalExecutionId, stageId])); }
export function validateJevRun(value: unknown): JevRun {
  const bad = () => { throw new JevCustodyError('CORRUPT'); };
  if (!exact(value, runKeys)) return bad();
  const r = value as JevRun;
  if (r.schema !== 'cvf.jevSuggestionRun.v1' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(r.runId) || !/^env-[a-zA-Z0-9-]{1,100}$/.test(r.canonicalExecutionId)
    || !money(r.revision) || !exact(r.actor,['userId','orgId','teamId','sessionBindingHash']) || !sha(r.actor.sessionBindingHash)
    || ![r.actor.userId,r.actor.orgId,r.actor.teamId,r.recipeRevision,r.sourceRevision].every(v => typeof v === 'string' && v.length > 0 && v.length <= 200)
    || ![r.nonceHash,r.inputDigest,r.rosterDigest].every(sha) || r.recipeRevision !== JEV_RECIPE_REVISION || r.sourceRevision !== JEV_SOURCE_REVISION
    || !exact(r.authority,['effectAuthorizationRef','dataBoundaryRef','costEnvelopeRef']) || !Object.values(r.authority).every(v => typeof v === 'string' && v.length > 0 && v.length <= 200)
    || !exact(r.quota,['scopeId','reservationId','currency','reservedMicrounits','settledMicrounits','settlement'])
    || r.quota.reservationId !== r.runId || !/^[A-Z]{3}$/.test(r.quota.currency) || !sha(r.quota.scopeId) || !money(r.quota.reservedMicrounits)
    || r.quota.reservedMicrounits <= 0 || (r.quota.settledMicrounits !== null && !money(r.quota.settledMicrounits))
    || !['RESERVED','SETTLED','UNKNOWN'].includes(r.quota.settlement)
    || ![r.createdAt,r.sessionExpiresAt,r.resultExpiresAt,r.tombstoneExpiresAt].every(utc)
    || Date.parse(r.resultExpiresAt) > Date.parse(r.sessionExpiresAt) || Date.parse(r.tombstoneExpiresAt) <= Date.parse(r.sessionExpiresAt)
    || !['RESERVED','WIDE_STARTED','WIDE_VALIDATED','NARROW_STARTED','SUCCEEDED','NO_MATCH','FAILED','CANCELLED','UNKNOWN_TERMINAL'].includes(r.state)
    || !Array.isArray(r.stages) || r.stages.length !== 2) return bad();
  if (r.lease !== null && (!exact(r.lease,['executionTokenHash','expiresAt']) || !sha(r.lease.executionTokenHash) || !utc(r.lease.expiresAt))) return bad();
  for (const [i, s] of r.stages.entries()) {
    if (!exact(s,stageKeys) || s.stageId !== (i === 0 ? 'wide' : 'narrow') || s.attemptIndex !== i
      || s.stageExecutionKey !== jevStageKey(r.runId,r.canonicalExecutionId,s.stageId) || s.canonicalExecutionId !== r.canonicalExecutionId
      || s.provider !== 'typesafe' || s.requestedModel !== 'jev-latest' || !['NOT_STARTED','START_COMMITTED','RESPONSE_VALIDATED','FAILED','UNKNOWN'].includes(s.state)
      || (s.reportedModel !== null && !/^jev-[a-zA-Z0-9._-]{1,60}$/.test(s.reportedModel))
      || (s.gatewayReceiptId !== null && (typeof s.gatewayReceiptId !== 'string' || s.gatewayReceiptId.length > 200))
      || (s.receiptDigest !== null && !sha(s.receiptDigest))
      || [s.inputTokens,s.outputTokens,s.costMicrounits].some(v => v !== null && !money(v))
      || (s.httpStatus !== null && (!Number.isInteger(s.httpStatus) || s.httpStatus < 100 || s.httpStatus > 599))
      || [s.startedAt,s.finishedAt].some(v => v !== null && !utc(v))) return bad();
  }
  if (r.terminal !== null && (!exact(r.terminal,['safeCode','outcomeKnown','providerContact','at']) || typeof r.terminal.outcomeKnown !== 'boolean'
    || !['COMPLETED','NO_MATCH','SESSION_REFUSED','ACTION_REFUSED','STORAGE_FAILED','COMMIT_UNKNOWN','PROVIDER_UNAVAILABLE','PROVIDER_RESPONSE_INVALID','CANCELLED','INTERRUPTED','POSSIBLE_SEND','RESERVATION_RETAINED_NO_INVOCATION'].includes(r.terminal.safeCode)
    || !['NOT_STARTED','POSSIBLE','RESPONSE_OBSERVED'].includes(r.terminal.providerContact) || !utc(r.terminal.at))) return bad();
  if (r.result !== null) {
    const v = r.result;
    if (!exact(v,['schema','resultVersion','status','catalogSkillId','reasonCode','presentation','validatedStageIds']) || v.schema !== 'cvf.jevSuggestionResult.v1' || v.resultVersion !== 1
      || !['suggested','no_match'].includes(v.status) || !['NATIVE_NO_WORKFLOW','NATIVE_LOW_FIT','CATALOG_TASK_FIT'].includes(v.reasonCode)
      || !Array.isArray(v.validatedStageIds) || v.validatedStageIds.join(',') !== (r.stages[1].state === 'RESPONSE_VALIDATED' ? 'wide,narrow' : 'wide')) return bad();
    if (v.status === 'suggested') {
      if (typeof v.catalogSkillId !== 'string' || !/^[a-z0-9_]+\/[a-z0-9_]+$/.test(v.catalogSkillId)
        || !exact(v.presentation,['title','domain','existingSkillHref']) || !v.presentation
        || v.presentation.existingSkillHref !== `/skills/${v.catalogSkillId}` || ![v.presentation.title,v.presentation.domain].every(s => typeof s === 'string' && s.length > 0 && s.length <= 100)) return bad();
    } else if (v.catalogSkillId !== null || v.presentation !== null) return bad();
  }
  return r;
}
const sameActor = (a: JevActor, b: JevActor) => a.userId===b.userId&&a.orgId===b.orgId&&a.teamId===b.teamId&&a.sessionBindingHash===b.sessionBindingHash;
export function verifyJevGrant(grant: JevActionGrant, policy: JevAuthorizedPolicy, now: number, actor = grant.actor): void {
  validateJevPolicy(policy,now);
  if (!sameActor(actor,grant.actor) || grant.policyDigest !== policy.policyDigest || grant.provider !== 'typesafe' || grant.model !== 'jev-latest'
    || grant.method !== 'system_one' || grant.maxStages !== 2 || !utc(grant.expiresAt) || Date.parse(grant.expiresAt) <= now
    || Date.parse(grant.expiresAt) > Date.parse(policy.expiresAt) || !sha(grant.inputDigest) || !sha(grant.rosterDigest) || !sha(grant.nonceHash)
    || grant.executionToken.length < 32 || grant.recipeRevision !== JEV_RECIPE_REVISION || grant.sourceRevision !== JEV_SOURCE_REVISION) throw new JevCustodyError('ACTION_REFUSED');
}
export type JevTrialGrant = { schema:'cvf.jevActionGrant.v2'; spec:JevTrialSpec; caseId:string; runId:string; canonicalExecutionId:string; executionToken:string; actor:JevActor; nonceHash:string; inputDigest:string; expiresAt:string; provider:'openrouter'; model:'typesafe/jev-1.14'; method:'system_one' };
export type JevTrialRun = { schema:'cvf.jevSuggestionRun.v2'; revision:number; runId:string; canonicalExecutionId:string; trialId:string; caseId:string; policyDigest:string; actor:JevActor; nonceHash:string; inputDigest:string; rosterDigest:string; tokenHash:string; createdAt:string; expiresAt:string; resultExpiresAt:string; provider:'openrouter'; model:'typesafe/jev-1.14'; method:'system_one'; result:JevStoredResult|null; terminal:null|{safeCode:'POSSIBLE_SEND'|'ACTION_REFUSED'|'COMPLETED'|'NO_MATCH';providerContact:'NOT_STARTED'|'POSSIBLE'|'RESPONSE_OBSERVED';outcomeKnown:boolean}; stages:{stageId:'wide'|'narrow'; stageExecutionKey:string; state:'NOT_STARTED'|'START_COMMITTED'|'SETTLED'|'UNKNOWN'; costMicrounits:number|null; reportedModel:string|null; receiptDigest:string|null; gatewayReceiptId:string|null; inputTokens:number|null; outputTokens:number|null}[] };
export type JevTrialEvidence = { costMicrounits:number|null; reportedModel:string; receiptDigest:string; gatewayReceiptId:string; inputTokens:number|null; outputTokens:number|null };
export class JevSuggestionCustody {
  static trialStatus(directory:string,spec:JevTrialSpec,now=Date.now()):'ACTIVE'|'STOPPED'|'EXPIRED'|'IN_FLIGHT' {const rows=new SQLiteAtomicRecordAdapter(directory,'jev-suggestion-v1').readAll();const {trial}=trialRow(rows,spec,jevDigest,now,false);return Date.parse(spec.expiresAt)<=now?'EXPIRED':trial.status==='ACTIVE'&&trial.inFlight?'IN_FLIGHT':trial.status;}
  static provisionTrial(directory:string,spec:JevTrialSpec,now=Date.now()):void {
    const store=new SQLiteAtomicRecordAdapter(directory,'jev-suggestion-v1');
    store.transaction(rows=>({writes:[provisionTrial(rows,spec,jevDigest,now)],result:undefined}));
  }
  static submitTrial(directory:string,grant:JevTrialGrant,now=Date.now()):{created:boolean;run:JevTrialRun} { return submitTrial(directory,grant,now); }
  static startTrial(directory:string,grant:JevTrialGrant,revision:number,stageId:'wide'|'narrow',now=Date.now()):JevTrialRun { return changeTrial(directory,grant,revision,stageId,'start',null,now); }
  static settleTrial(directory:string,grant:JevTrialGrant,revision:number,stageId:'wide'|'narrow',evidence:JevTrialEvidence|null,now=Date.now()):JevTrialRun { return changeTrial(directory,grant,revision,stageId,'settle',evidence,now); }
  static stopTrial(directory:string,grant:JevTrialGrant,now=Date.now()):JevTrialRun {
    return new SQLiteAtomicRecordAdapter(directory,'jev-suggestion-v1').transaction(rows=>{const {row,trial}=trialRow(rows,grant.spec,jevDigest,now);const rr=rows.find(r=>r.id===`run:${grant.runId}`),qr=rows.find(r=>r.id===`quota:${grant.runId}`);if(!rr||!qr)throw new JevCustodyError('CORRUPT');const run=readTrialRun(rr);validateTrialRows(rows,run);if(run.tokenHash!==jevDigest(grant.executionToken)||!sameActor(run.actor,grant.actor)||run.trialId!==grant.spec.trialId||run.caseId!==grant.caseId||run.result)throw new JevCustodyError('ACTION_REFUSED');
      const q=validateActionQuota(qr.value as ActionQuotaSnapshot);const active=run.stages.find(s=>s.state==='START_COMMITTED');if(active){Object.assign(q,transitionActionQuota(q,active.stageExecutionKey,'unknown'));active.state='UNKNOWN';}run.terminal={safeCode:active?'POSSIBLE_SEND':'ACTION_REFUSED',providerContact:active?'POSSIBLE':run.stages.some(s=>s.state==='SETTLED')?'RESPONSE_OBSERVED':'NOT_STARTED',outcomeKnown:!active};trial.status='STOPPED';run.revision++;return {writes:[{id:row.id,expectedRevision:row.revision,value:trial},{id:rr.id,expectedRevision:rr.revision,value:run},{id:qr.id,expectedRevision:qr.revision,value:q}],result:run};});
  }
  static finishTrial(directory:string,grant:JevTrialGrant,revision:number,result:JevStoredResult,now=Date.now()):JevTrialRun { return finishTrial(directory,grant,revision,result,now); }
  static readRetained(directory:string,actor:JevActor,runId:string,now=Date.now()):JevRun|JevTrialRun {
    const rows=new SQLiteAtomicRecordAdapter(directory,'jev-suggestion-v1').readAll();const row=rows.find(r=>r.id===`run:${runId}`);if(!row)throw new JevCustodyError('NOT_FOUND');
    if(obj(row.value)&&row.value.schema==='cvf.jevSuggestionRun.v2')return JevSuggestionCustody.readTrial(directory,actor,runId,now);
    const run=validateJevRun(row.value);const qr=rows.find(r=>r.id===`quota:${runId}`);if(row.revision!==run.revision||run.runId!==runId||!qr||qr.revision!==row.revision)throw new JevCustodyError('CORRUPT');
    const quota=validateActionQuota(qr.value as ActionQuotaSnapshot);if(quota.scopeId!==run.quota.scopeId||quota.reservationId!==run.runId||quota.currency!==run.quota.currency||quota.totalMicrounits!==run.quota.reservedMicrounits||Object.keys(quota.stages).sort().join(',')!==run.stages.map(s=>s.stageExecutionKey).sort().join(','))throw new JevCustodyError('CORRUPT');
    for(const stage of run.stages){const q=quota.stages[stage.stageExecutionKey];if(stage.state==='START_COMMITTED'&&q.state!=='STARTED'||stage.state==='UNKNOWN'&&q.state!=='UNKNOWN'||stage.state==='RESPONSE_VALIDATED'&&!['SETTLED','UNKNOWN'].includes(q.state)||stage.state==='NOT_STARTED'&&!['RESERVED','RELEASED'].includes(q.state))throw new JevCustodyError('CORRUPT');}
    if(!sameActor(run.actor,actor))throw new JevCustodyError('NOT_FOUND');if(now>=Date.parse(run.resultExpiresAt))throw new JevCustodyError('EXPIRED');return run;
  }
  static lookupTrialCase(directory:string,spec:JevTrialSpec,actor:JevActor,caseId:string,nonceHash:string,inputDigest:string,now=Date.now()):JevTrialRun|null {
    const rows=new SQLiteAtomicRecordAdapter(directory,'jev-suggestion-v1').readAll(),c=rows.find(r=>r.id===caseKey(spec.trialId,caseId));if(!c)return null;
    if(!exact(c.value,['schema','trialId','caseId','runId','nonceHash','inputDigest','reservedHttp','reservedMicrounits']))throw new JevCustodyError('CORRUPT');const v=c.value as JevCase;
    if(v.trialId!==spec.trialId||v.caseId!==caseId||v.inputDigest!==inputDigest||v.nonceHash!==nonceHash)throw new JevCustodyError('CONFLICT');
    const row=rows.find(r=>r.id===`run:${v.runId}`);if(!row)throw new JevCustodyError('CORRUPT');const run=readTrialRun(row);validateTrialRows(rows,run);if(!sameActor(run.actor,actor)||run.policyDigest!==spec.policyDigest||run.inputDigest!==inputDigest)throw new JevCustodyError('CONFLICT');
    if(now>=Date.parse(run.resultExpiresAt))throw new JevCustodyError('EXPIRED');return run;
  }
  static readTrial(directory:string,actor:JevActor,runId:string,now=Date.now()):JevTrialRun { const store=new SQLiteAtomicRecordAdapter(directory,'jev-suggestion-v1'); const rows=store.readAll(),row=rows.find(r=>r.id===`run:${runId}`); if(!row)throw new JevCustodyError('NOT_FOUND');const run=readTrialRun(row);validateTrialRows(rows,run);if(!sameActor(run.actor,actor))throw new JevCustodyError('NOT_FOUND');if(now>=Date.parse(run.resultExpiresAt))throw new JevCustodyError('EXPIRED');return run; }

  readonly store: SQLiteAtomicRecordAdapter;
  constructor(readonly policy: JevAuthorizedPolicy, private readonly now: () => number = Date.now) {
    validateJevPolicy(policy,now()); this.store = new SQLiteAtomicRecordAdapter(policy.directory,'jev-suggestion-v1');
  }
  private readRun(rows: AtomicSQLiteRow[], id: string): JevRun {
    const row = rows.find(r => r.id === `run:${id}`);
    if (!row) throw new JevCustodyError('NOT_FOUND');
    const run = validateJevRun(row.value);
    if (run.revision !== row.revision || run.runId!==id) throw new JevCustodyError('CORRUPT');
    const qrow=rows.find(r=>r.id===`quota:${id}`);if(!qrow||qrow.revision!==run.revision)throw new JevCustodyError('CORRUPT');
    const quota=validateActionQuota(qrow.value as ActionQuotaSnapshot);
    if(quota.reservationId!==run.runId||quota.scopeId!==run.quota.scopeId||quota.currency!==run.quota.currency||quota.totalMicrounits!==run.quota.reservedMicrounits
      ||Object.keys(quota.stages).sort().join(',')!==run.stages.map(s=>s.stageExecutionKey).sort().join(','))throw new JevCustodyError('CORRUPT');
    for(const stage of run.stages){const q=quota.stages[stage.stageExecutionKey];
      if(stage.state==='START_COMMITTED'&&q.state!=='STARTED'||stage.state==='UNKNOWN'&&q.state!=='UNKNOWN'
        ||stage.state==='RESPONSE_VALIDATED'&&!['SETTLED','UNKNOWN'].includes(q.state)
        ||stage.state==='NOT_STARTED'&&!['RESERVED','RELEASED'].includes(q.state))throw new JevCustodyError('CORRUPT');}
    return run;
  }
  private nonceId(actor: JevActor, nonceHash: string) { return `nonce:${jevDigest(JSON.stringify([actor.userId,actor.orgId,actor.teamId,actor.sessionBindingHash,nonceHash]))}`; }
  lookup(actor: JevActor, nonceHash: string, inputDigest: string, rosterDigest: string): JevRun | null {
    const rows = this.store.readAll(); const binding = rows.find(r => r.id === this.nonceId(actor,nonceHash));
    if (!binding) return null;
    if (!exact(binding.value,['runId','inputDigest','rosterDigest','recipeRevision'])) throw new JevCustodyError('CORRUPT');
    const b = binding.value as {runId:string;inputDigest:string;rosterDigest:string;recipeRevision:string};
    if (b.inputDigest !== inputDigest || b.rosterDigest !== rosterDigest || b.recipeRevision !== JEV_RECIPE_REVISION) throw new JevCustodyError('CONFLICT');
    const run = this.readRun(rows,b.runId);
    if (!sameActor(run.actor,actor)) throw new JevCustodyError('NOT_FOUND');
    if(run.nonceHash!==nonceHash||run.inputDigest!==inputDigest||run.rosterDigest!==rosterDigest||run.recipeRevision!==b.recipeRevision)throw new JevCustodyError('CORRUPT');
    return run;
  }
  submit(grant: JevActionGrant, singleAction?: JevSingleActionConstraint): { created: boolean; run: JevRun } {
    verifyJevGrant(grant,this.policy,this.now());
    if (singleAction && (!exact(singleAction,['authorizationEvidenceDigest','effectAuthorizationRef','inputDigest','rosterDigest'])
      || !sha(singleAction.authorizationEvidenceDigest) || !sha(singleAction.inputDigest) || !sha(singleAction.rosterDigest)
      || singleAction.authorizationEvidenceDigest !== this.policy.authorizationEvidenceDigest
      || singleAction.effectAuthorizationRef !== this.policy.effectAuthorizationRef
      || singleAction.inputDigest !== grant.inputDigest || singleAction.rosterDigest !== grant.rosterDigest)) {
      throw new JevCustodyError('ACTION_REFUSED');
    }
    return this.store.transaction<{created:boolean;run:JevRun}>(rows => {
      const nonceId = this.nonceId(grant.actor,grant.nonceHash); const existing = rows.find(r => r.id === nonceId);
      const claimId = singleAction ? `action:${jevDigest(JSON.stringify(['jev-single-action-v1',singleAction.authorizationEvidenceDigest]))}` : null;
      const claimRow = claimId ? rows.find(r => r.id === claimId) : undefined;
      if (claimRow) {
        if (!exact(claimRow.value,['schema','authorizationEvidenceDigest','effectAuthorizationRef','nonceHash','inputDigest','rosterDigest','runId'])
          || claimRow.revision !== 0) throw new JevCustodyError('CORRUPT');
        const claim = claimRow.value as Record<string, unknown>;
        if (claim.schema !== 'cvf.jevSingleActionClaim.v1' || claim.authorizationEvidenceDigest !== singleAction!.authorizationEvidenceDigest
          || typeof claim.effectAuthorizationRef !== 'string' || typeof claim.nonceHash !== 'string' || !sha(claim.nonceHash)
          || typeof claim.inputDigest !== 'string' || !sha(claim.inputDigest)
          || typeof claim.rosterDigest !== 'string' || !sha(claim.rosterDigest)
          || typeof claim.runId !== 'string') throw new JevCustodyError('CORRUPT');
        if (claim.effectAuthorizationRef !== singleAction!.effectAuthorizationRef || claim.nonceHash !== grant.nonceHash
          || claim.inputDigest !== grant.inputDigest || claim.rosterDigest !== grant.rosterDigest) throw new JevCustodyError('CONFLICT');
        if (!existing) {
          const claimedRun=this.readRun(rows,claim.runId as string);
          throw new JevCustodyError(sameActor(claimedRun.actor,grant.actor)?'CORRUPT':'CONFLICT');
        }
      } else if (singleAction && existing) {
        // A legacy nonce cannot silently acquire a new single-action claim.
        throw new JevCustodyError('CONFLICT');
      }
      if (existing) {
        if (!exact(existing.value,['runId','inputDigest','rosterDigest','recipeRevision'])) throw new JevCustodyError('CORRUPT');
        const b = existing.value as {runId:string;inputDigest:string;rosterDigest:string;recipeRevision:string};
        if (b.inputDigest !== grant.inputDigest || b.rosterDigest !== grant.rosterDigest || b.recipeRevision !== grant.recipeRevision) throw new JevCustodyError('CONFLICT');
        const run=this.readRun(rows,b.runId);if(!sameActor(run.actor,grant.actor)||run.nonceHash!==grant.nonceHash||run.inputDigest!==grant.inputDigest||run.rosterDigest!==grant.rosterDigest)throw new JevCustodyError('CORRUPT');
        if (claimRow && (claimRow.value as Record<string,unknown>).runId !== run.runId) throw new JevCustodyError('CORRUPT');
        return { writes: [], result: { created:false, run } };
      }
      const at = new Date(this.now()).toISOString();
      const stages = (['wide','narrow'] as const).map((stageId,i): JevStage => ({ stageId,stageExecutionKey:jevStageKey(grant.runId,grant.canonicalExecutionId,stageId),canonicalExecutionId:grant.canonicalExecutionId,attemptIndex:i as 0|1,state:'NOT_STARTED',provider:'typesafe',requestedModel:'jev-latest',reportedModel:null,gatewayReceiptId:null,receiptDigest:null,httpStatus:null,inputTokens:null,outputTokens:null,costMicrounits:null,startedAt:null,finishedAt:null }));
      const quota = reserveActionQuota({scopeId:grant.policyDigest,reservationId:grant.runId,currency:this.policy.currency,totalMicrounits:this.policy.totalMaxMicrounits,stageAllocations:{[stages[0].stageExecutionKey]:this.policy.wideMaxMicrounits,[stages[1].stageExecutionKey]:this.policy.narrowMaxMicrounits}});
      const run: JevRun = {schema:'cvf.jevSuggestionRun.v1',runId:grant.runId,canonicalExecutionId:grant.canonicalExecutionId,revision:0,actor:grant.actor,nonceHash:grant.nonceHash,inputDigest:grant.inputDigest,rosterDigest:grant.rosterDigest,recipeRevision:grant.recipeRevision,sourceRevision:grant.sourceRevision,authority:{effectAuthorizationRef:this.policy.effectAuthorizationRef,dataBoundaryRef:this.policy.dataBoundaryRef,costEnvelopeRef:this.policy.costEnvelopeRef},quota:{scopeId:quota.scopeId,reservationId:quota.reservationId,currency:quota.currency,reservedMicrounits:quota.totalMicrounits,settledMicrounits:null,settlement:'RESERVED'},createdAt:at,sessionExpiresAt:grant.expiresAt,resultExpiresAt:new Date(Math.min(this.now()+this.policy.resultRetentionMs,Date.parse(grant.expiresAt))).toISOString(),tombstoneExpiresAt:new Date(Date.parse(grant.expiresAt)+this.policy.tombstoneRetentionMs).toISOString(),state:'RESERVED',lease:{executionTokenHash:jevDigest(grant.executionToken),expiresAt:grant.expiresAt},stages,result:null,terminal:null};
      validateJevRun(run);
      const writes:AtomicSQLiteWrite[]=[{id:nonceId,expectedRevision:null,value:{runId:run.runId,inputDigest:run.inputDigest,rosterDigest:run.rosterDigest,recipeRevision:run.recipeRevision}},{id:`run:${run.runId}`,expectedRevision:null,value:run},{id:`quota:${run.runId}`,expectedRevision:null,value:quota}];
      if (claimId && singleAction) writes.push({id:claimId,expectedRevision:null,value:{schema:'cvf.jevSingleActionClaim.v1',authorizationEvidenceDigest:singleAction.authorizationEvidenceDigest,effectAuthorizationRef:singleAction.effectAuthorizationRef,nonceHash:grant.nonceHash,inputDigest:grant.inputDigest,rosterDigest:grant.rosterDigest,runId:run.runId}});
      return {writes,result:{created:true,run}};
    });
  }
  read(actor: JevActor, runId: string): JevRun {
    const run = this.readRun(this.store.readAll(),runId);
    if (!sameActor(run.actor,actor)) throw new JevCustodyError('NOT_FOUND');
    if (this.now() >= Date.parse(run.resultExpiresAt)) throw new JevCustodyError('EXPIRED');
    return run;
  }
  private change<T>(grant: JevActionGrant, revision: number, fn: (run: JevRun, quota: ActionQuotaSnapshot) => T, enforceLive = true): {run:JevRun;result:T} {
    if (enforceLive) verifyJevGrant(grant,this.policy,this.now());
    return this.store.transaction(rows => {
      const run = this.readRun(rows,grant.runId);
      if (!sameActor(run.actor,grant.actor) || run.canonicalExecutionId !== grant.canonicalExecutionId || run.inputDigest !== grant.inputDigest || run.rosterDigest !== grant.rosterDigest
        || run.nonceHash !== grant.nonceHash || !run.lease || run.lease.executionTokenHash !== jevDigest(grant.executionToken)
        ||run.sessionExpiresAt!==grant.expiresAt||run.lease.expiresAt!==grant.expiresAt||(enforceLive&&Date.parse(run.lease.expiresAt)<=this.now())) throw new JevCustodyError('ACTION_REFUSED');
      if (run.revision !== revision) throw new JevCustodyError('CONFLICT');
      const qrow = rows.find(r => r.id === `quota:${run.runId}`); if (!qrow) throw new JevCustodyError('CORRUPT');
      const quota = validateActionQuota(qrow.value as ActionQuotaSnapshot);
      if (quota.scopeId !== grant.policyDigest || quota.reservationId !== run.runId || quota.currency !== run.quota.currency) throw new JevCustodyError('CORRUPT');
      const result = fn(run,quota);
      if (result === false) return {writes:[],result:{run,result}};
      run.revision++;
      const qs = Object.values(quota.stages);
      run.quota.settlement = qs.some(s => s.state === 'UNKNOWN' || s.state === 'STARTED') ? 'UNKNOWN' : qs.every(s => s.state === 'SETTLED' || s.state === 'RELEASED') ? 'SETTLED' : 'RESERVED';
      run.quota.settledMicrounits = qs.every(s => s.cost !== null) ? qs.reduce((n,s) => n+s.cost!,0) : null;
      validateJevRun(run);
      const writes:AtomicSQLiteWrite[]=[{id:`run:${run.runId}`,expectedRevision:revision,value:run},{id:qrow.id,expectedRevision:qrow.revision,value:quota}];
      return {writes,result:{run,result}};
    });
  }
  start(grant:JevActionGrant,revision:number,stageId:'wide'|'narrow',attemptIndex:number):JevRun {
    return this.change(grant,revision,(run,quota) => {
      const stage=run.stages[stageId==='wide'?0:1];
      if(run.terminal || stage.state!=='NOT_STARTED' || stage.attemptIndex!==attemptIndex
        || (stageId==='wide'?run.state!=='RESERVED':run.state!=='WIDE_VALIDATED')) throw new JevCustodyError('STAGE_REFUSED');
      Object.assign(quota,transitionActionQuota(quota,stage.stageExecutionKey,'start'));
      stage.state='START_COMMITTED';stage.startedAt=new Date(this.now()).toISOString();run.state=stageId==='wide'?'WIDE_STARTED':'NARROW_STARTED';
    }).run;
  }
  settle(grant:JevActionGrant,revision:number,stageId:'wide'|'narrow',evidence:{canonicalExecutionId:string;stageExecutionKey:string;inputDigest:string;rosterDigest:string;gatewayReceiptId:string;receiptDigest:string;reportedModel:string;httpStatus:number;inputTokens:number|null;outputTokens:number|null;costMicrounits:number|null}):JevRun {
    return this.change(grant,revision,(run,quota)=>{
      const stage=run.stages[stageId==='wide'?0:1];
      if (stage.state==='RESPONSE_VALIDATED' && stage.gatewayReceiptId===evidence.gatewayReceiptId && stage.receiptDigest===evidence.receiptDigest && stage.reportedModel===evidence.reportedModel && stage.costMicrounits===evidence.costMicrounits && evidence.canonicalExecutionId===run.canonicalExecutionId && evidence.stageExecutionKey===stage.stageExecutionKey && evidence.inputDigest===run.inputDigest && evidence.rosterDigest===run.rosterDigest) return false;
      if (!['START_COMMITTED','UNKNOWN'].includes(stage.state) || evidence.canonicalExecutionId!==run.canonicalExecutionId || evidence.stageExecutionKey!==stage.stageExecutionKey
        || evidence.inputDigest!==run.inputDigest || evidence.rosterDigest!==run.rosterDigest || !sha(evidence.receiptDigest)
        || !evidence.gatewayReceiptId || evidence.gatewayReceiptId.length>200 || run.stages.some(s=>s.gatewayReceiptId===evidence.gatewayReceiptId)
        || !this.policy.reportedModels.includes(evidence.reportedModel) || evidence.httpStatus!==200) throw new JevCustodyError('CORRUPT');
      Object.assign(quota,transitionActionQuota(quota,stage.stageExecutionKey,'settle',evidence.costMicrounits));
      Object.assign(stage,{state:'RESPONSE_VALIDATED',gatewayReceiptId:evidence.gatewayReceiptId,receiptDigest:evidence.receiptDigest,reportedModel:evidence.reportedModel,httpStatus:evidence.httpStatus,inputTokens:evidence.inputTokens,outputTokens:evidence.outputTokens,costMicrounits:evidence.costMicrounits,finishedAt:new Date(this.now()).toISOString()});
      if(stageId==='wide'&&!run.terminal)run.state='WIDE_VALIDATED';
      if(run.terminal&&!run.stages.some(s=>s.state==='UNKNOWN')){run.state='FAILED';run.terminal={safeCode:'INTERRUPTED',outcomeKnown:true,providerContact:'RESPONSE_OBSERVED',at:new Date(this.now()).toISOString()};}
    }).run;
  }
  finish(grant:JevActionGrant,revision:number,result:JevStoredResult):JevRun {
    return this.change(grant,revision,(run,quota)=>{
      if(run.terminal || run.stages[0].state!=='RESPONSE_VALIDATED' || run.stages.some(s=>s.state==='START_COMMITTED'))throw new JevCustodyError('STAGE_REFUSED');
      if(result.status==='suggested'&&run.stages[1].state!=='RESPONSE_VALIDATED')throw new JevCustodyError('STAGE_REFUSED');
      for(const stage of run.stages)if(stage.state==='NOT_STARTED')Object.assign(quota,transitionActionQuota(quota,stage.stageExecutionKey,'release'));
      run.result=result;run.state=result.status==='suggested'?'SUCCEEDED':'NO_MATCH';run.terminal={safeCode:result.status==='suggested'?'COMPLETED':'NO_MATCH',outcomeKnown:true,providerContact:'RESPONSE_OBSERVED',at:new Date(this.now()).toISOString()};
    }).run;
  }
  terminate(grant:JevActionGrant,revision:number,safeCode:JevSafeCode):JevRun {
    return this.change(grant,revision,(run,quota)=>{
      if(run.terminal)throw new JevCustodyError('STAGE_REFUSED');
      let possible=false;
      for(const stage of run.stages){
        if(stage.state==='START_COMMITTED'){possible=true;stage.state='UNKNOWN';Object.assign(quota,transitionActionQuota(quota,stage.stageExecutionKey,'unknown'));}
        else if(stage.state==='NOT_STARTED')Object.assign(quota,transitionActionQuota(quota,stage.stageExecutionKey,'release'));
      }
      run.state=possible?'UNKNOWN_TERMINAL':safeCode==='CANCELLED'?'CANCELLED':'FAILED';
      run.terminal={safeCode:possible?'POSSIBLE_SEND':safeCode,outcomeKnown:!possible,providerContact:possible?'POSSIBLE':run.stages.some(s=>s.state==='RESPONSE_VALIDATED')?'RESPONSE_OBSERVED':'NOT_STARTED',at:new Date(this.now()).toISOString()};
    },false).run;
  }
}
export const newJevRunId = ():string => randomUUID();

function verifyTrialGrant(g:JevTrialGrant,now:number):void {
  if(!exact(g,['schema','spec','caseId','runId','canonicalExecutionId','executionToken','actor','nonceHash','inputDigest','expiresAt','provider','model','method'])||g.schema!=='cvf.jevActionGrant.v2')throw new JevCustodyError('ACTION_REFUSED');
  validateTrialSpec(g.spec,jevDigest);
  if(g.provider!=='openrouter'||g.model!=='typesafe/jev-1.14'||g.method!=='system_one'||!exact(g.actor,['userId','orgId','teamId','sessionBindingHash'])||!sha(g.actor.sessionBindingHash)
    ||![g.actor.userId,g.actor.orgId,g.actor.teamId].every(v=>typeof v==='string'&&v.length>0&&v.length<=200)||!sha(g.nonceHash)||!sha(g.inputDigest)||g.spec.manifest[g.caseId]!==g.inputDigest
    ||! /^[a-f0-9-]{36}$/.test(g.runId)||! /^env-[a-zA-Z0-9-]{1,100}$/.test(g.canonicalExecutionId)||typeof g.executionToken!=='string'||g.executionToken.length<32
    ||!utc(g.expiresAt)||Date.parse(g.expiresAt)<=now||Date.parse(g.expiresAt)>Date.parse(g.spec.expiresAt)||Date.parse(g.expiresAt)>Date.parse(g.spec.pricing.validUntil))throw new JevCustodyError('ACTION_REFUSED');
}
function readTrialRun(row:AtomicSQLiteRow):JevTrialRun {
  const v=row.value;if(!exact(v,['schema','revision','runId','canonicalExecutionId','trialId','caseId','policyDigest','actor','nonceHash','inputDigest','rosterDigest','tokenHash','createdAt','expiresAt','resultExpiresAt','provider','model','method','result','terminal','stages']))throw new JevCustodyError('CORRUPT');
  const r=v as JevTrialRun;
  if(r.schema!=='cvf.jevSuggestionRun.v2'||r.revision!==row.revision||row.id!==`run:${r.runId}`||!sha(r.policyDigest)||!sha(r.nonceHash)||!sha(r.inputDigest)||!sha(r.rosterDigest)||!sha(r.tokenHash)
    ||!exact(r.actor,['userId','orgId','teamId','sessionBindingHash'])||!sha(r.actor.sessionBindingHash)||![r.actor.userId,r.actor.orgId,r.actor.teamId].every(v=>typeof v==='string'&&v.length>0&&v.length<=200)||! /^[a-f0-9-]{36}$/.test(r.runId)||! /^env-[a-zA-Z0-9-]{1,100}$/.test(r.canonicalExecutionId)||! /^[a-zA-Z0-9_-]{1,80}$/.test(r.trialId)||! /^[a-zA-Z0-9_-]{1,80}$/.test(r.caseId)||!utc(r.createdAt)||!utc(r.expiresAt)||!utc(r.resultExpiresAt)||Date.parse(r.createdAt)>=Date.parse(r.expiresAt)
    ||r.provider!=='openrouter'||r.model!=='typesafe/jev-1.14'||r.method!=='system_one'||!Array.isArray(r.stages)||r.stages.length!==2)throw new JevCustodyError('CORRUPT');
  for(const [i,s] of r.stages.entries())if(!exact(s,['stageId','stageExecutionKey','state','costMicrounits','reportedModel','receiptDigest','gatewayReceiptId','inputTokens','outputTokens'])||s.stageId!==(i?'narrow':'wide')||s.stageExecutionKey!==jevStageKey(r.runId,r.canonicalExecutionId,s.stageId)||!['NOT_STARTED','START_COMMITTED','SETTLED','UNKNOWN'].includes(s.state)||(s.costMicrounits!==null&&!money(s.costMicrounits))||(s.reportedModel!==null&&s.reportedModel!=='typesafe/jev-1.14-20261014')||(s.receiptDigest!==null&&!sha(s.receiptDigest))||(s.gatewayReceiptId!==null&&(typeof s.gatewayReceiptId!=='string'||s.gatewayReceiptId.length>200))||[s.inputTokens,s.outputTokens].some(x=>x!==null&&!money(x))||(s.state==='SETTLED'&&(s.costMicrounits===null||s.reportedModel===null||s.receiptDigest===null||!s.gatewayReceiptId)))throw new JevCustodyError('CORRUPT');
  if(r.terminal!==null&&(!exact(r.terminal,['safeCode','providerContact','outcomeKnown'])||!['POSSIBLE_SEND','ACTION_REFUSED','COMPLETED','NO_MATCH'].includes(r.terminal.safeCode)||!['NOT_STARTED','POSSIBLE','RESPONSE_OBSERVED'].includes(r.terminal.providerContact)||typeof r.terminal.outcomeKnown!=='boolean'))throw new JevCustodyError('CORRUPT');
  if(r.result!==null&&(!exact(r.result,['schema','resultVersion','status','catalogSkillId','reasonCode','presentation','validatedStageIds'])||r.result.schema!=='cvf.jevSuggestionResult.v1'||r.result.resultVersion!==1||!['suggested','no_match'].includes(r.result.status)||!Array.isArray(r.result.validatedStageIds)||r.result.validatedStageIds.join(',')!==r.stages.filter(x=>x.state==='SETTLED').map(x=>x.stageId).join(',')))throw new JevCustodyError('CORRUPT');
  if(r.result){const v=r.result;if(!['NATIVE_NO_WORKFLOW','NATIVE_LOW_FIT','CATALOG_TASK_FIT'].includes(v.reasonCode)||v.status==='suggested'&&(typeof v.catalogSkillId!=='string'||! /^[a-z0-9_]+\/[a-z0-9_]+$/.test(v.catalogSkillId)||!exact(v.presentation,['title','domain','existingSkillHref'])||!v.presentation||v.presentation.existingSkillHref!==`/skills/${v.catalogSkillId}`||![v.presentation.title,v.presentation.domain].every(x=>typeof x==='string'&&x.length>0&&x.length<=100))||v.status==='no_match'&&(v.catalogSkillId!==null||v.presentation!==null))throw new JevCustodyError('CORRUPT');}
  if(r.stages[0].gatewayReceiptId!==null&&r.stages[0].gatewayReceiptId===r.stages[1].gatewayReceiptId)throw new JevCustodyError('CORRUPT');
  if(r.result&&(!r.terminal||!r.terminal.outcomeKnown||r.terminal.providerContact!=='RESPONSE_OBSERVED'||r.terminal.safeCode!==(r.result.status==='suggested'?'COMPLETED':'NO_MATCH'))||!r.result&&r.terminal&&['COMPLETED','NO_MATCH'].includes(r.terminal.safeCode)||r.stages.some(x=>x.state==='UNKNOWN')&&r.terminal?.safeCode!=='POSSIBLE_SEND')throw new JevCustodyError('CORRUPT');
  if(r.stages.some(x=>x.state!=='SETTLED'&&(x.costMicrounits!==null||x.reportedModel!==null||x.receiptDigest!==null||x.gatewayReceiptId!==null||x.inputTokens!==null||x.outputTokens!==null)))throw new JevCustodyError('CORRUPT');
  if(r.stages[1].state!=='NOT_STARTED'&&r.stages[0].state!=='SETTLED')throw new JevCustodyError('CORRUPT');
  return structuredClone(r);
}
function validateTrialRows(rows:AtomicSQLiteRow[],run:JevTrialRun):void {
  const tr=rows.find(r=>r.id===`trial:${run.trialId}`),cr=rows.find(r=>r.id===caseKey(run.trialId,run.caseId)),qr=rows.find(r=>r.id===`quota:${run.runId}`);if(!tr||!cr||!qr||qr.revision!==run.revision)throw new JevCustodyError('CORRUPT');
  const trial=validateTrial(tr.value,jevDigest),c=cr.value as JevCase,q=validateActionQuota(qr.value as ActionQuotaSnapshot);trialRow(rows,trial.spec,jevDigest,0,false);
  if(!exact(c,['schema','trialId','caseId','runId','nonceHash','inputDigest','reservedHttp','reservedMicrounits'])||cr.revision!==0||c.schema!=='cvf.jevTrialCase.v2'||c.trialId!==run.trialId||c.caseId!==run.caseId||c.runId!==run.runId||c.nonceHash!==run.nonceHash||c.inputDigest!==run.inputDigest||trial.spec.manifest[run.caseId]!==run.inputDigest||trial.spec.policyDigest!==run.policyDigest||trial.spec.rosterDigest!==run.rosterDigest||Date.parse(run.resultExpiresAt)!==Date.parse(run.createdAt)+trial.spec.resultRetentionMs||q.scopeId!==run.policyDigest||q.reservationId!==run.runId||q.currency!=='USD'||q.totalMicrounits!==c.reservedMicrounits||Object.keys(q.stages).sort().join(',')!==run.stages.map(x=>x.stageExecutionKey).sort().join(','))throw new JevCustodyError('CORRUPT');
  for(const stage of run.stages){const allocated=stage.stageId==='wide'?trial.spec.wideMaxMicrounits:trial.spec.narrowMaxMicrounits;if(q.stages[stage.stageExecutionKey].allocation!==allocated)throw new JevCustodyError('CORRUPT');const status=q.stages[stage.stageExecutionKey].state;if(stage.state==='NOT_STARTED'&&!['RESERVED','RELEASED'].includes(status)||stage.state==='START_COMMITTED'&&status!=='STARTED'||stage.state==='SETTLED'&&(status!=='SETTLED'||q.stages[stage.stageExecutionKey].cost!==stage.costMicrounits)||stage.state==='UNKNOWN'&&status!=='UNKNOWN')throw new JevCustodyError('CORRUPT');}
}
function trialCase(g:JevTrialGrant):JevCase {return {schema:'cvf.jevTrialCase.v2',trialId:g.spec.trialId,caseId:g.caseId,runId:g.runId,nonceHash:g.nonceHash,inputDigest:g.inputDigest,reservedHttp:2,reservedMicrounits:g.spec.wideMaxMicrounits+g.spec.narrowMaxMicrounits};}
function submitTrial(directory:string,g:JevTrialGrant,now:number):{created:boolean;run:JevTrialRun} {
  verifyTrialGrant(g,now);const store=new SQLiteAtomicRecordAdapter(directory,'jev-suggestion-v1');
  const outcome=store.transaction(rows=>{
    const nonceId=`nonce:${jevDigest(JSON.stringify([g.actor.userId,g.actor.orgId,g.actor.teamId,g.actor.sessionBindingHash,g.nonceHash]))}`;
    const nonce=rows.find(r=>r.id===nonceId);const existing=rows.find(r=>r.id===caseKey(g.spec.trialId,g.caseId));
    if(existing){if(!nonce||!exact(nonce.value,['runId','inputDigest','rosterDigest','recipeRevision'])||(nonce.value as Record<string,unknown>).runId!==g.runId)throw new JevCustodyError('CORRUPT');if(JSON.stringify(existing.value)!==JSON.stringify(trialCase(g)))throw new JevCustodyError('CONFLICT');const row=rows.find(r=>r.id===`run:${g.runId}`);if(!row)throw new JevCustodyError('CORRUPT');const run=readTrialRun(row);if(!sameActor(run.actor,g.actor)||run.tokenHash!==jevDigest(g.executionToken))throw new JevCustodyError('CONFLICT');return {writes:[],result:{created:false,run}};}
    if(nonce)throw new JevCustodyError('CONFLICT');
    const reservation=reserveTrialCase(rows,g.spec,trialCase(g),jevDigest,now);
    if(!reservation.admitted)return {writes:reservation.writes,result:null};
    const stages=(['wide','narrow'] as const).map(stageId=>({stageId,stageExecutionKey:jevStageKey(g.runId,g.canonicalExecutionId,stageId),state:'NOT_STARTED' as const,costMicrounits:null,reportedModel:null,receiptDigest:null,gatewayReceiptId:null,inputTokens:null,outputTokens:null}));
    const run:JevTrialRun={schema:'cvf.jevSuggestionRun.v2',revision:0,runId:g.runId,canonicalExecutionId:g.canonicalExecutionId,trialId:g.spec.trialId,caseId:g.caseId,policyDigest:g.spec.policyDigest,actor:g.actor,nonceHash:g.nonceHash,inputDigest:g.inputDigest,rosterDigest:g.spec.rosterDigest,tokenHash:jevDigest(g.executionToken),createdAt:new Date(now).toISOString(),expiresAt:g.expiresAt,resultExpiresAt:new Date(now+g.spec.resultRetentionMs).toISOString(),provider:g.provider,model:g.model,method:g.method,result:null,terminal:null,stages};
    const quota=reserveActionQuota({scopeId:g.spec.policyDigest,reservationId:g.runId,currency:'USD',totalMicrounits:trialCase(g).reservedMicrounits,stageAllocations:{[stages[0].stageExecutionKey]:g.spec.wideMaxMicrounits,[stages[1].stageExecutionKey]:g.spec.narrowMaxMicrounits}});
    return {writes:[...reservation.writes,{id:nonceId,expectedRevision:null,value:{runId:g.runId,inputDigest:g.inputDigest,rosterDigest:g.spec.rosterDigest,recipeRevision:JEV_RECIPE_REVISION}},{id:`run:${g.runId}`,expectedRevision:null,value:run},{id:`quota:${g.runId}`,expectedRevision:null,value:quota}],result:{created:true,run}};
  });
  if(!outcome)throw new JevCustodyError('ACTION_REFUSED');return outcome;
}
function changeTrial(directory:string,g:JevTrialGrant,revision:number,stageId:'wide'|'narrow',operation:'start'|'settle',evidence:JevTrialEvidence|null,now:number):JevTrialRun {
  verifyTrialGrant(g,now);const store=new SQLiteAtomicRecordAdapter(directory,'jev-suggestion-v1');
  return store.transaction(rows=>{
    const row=rows.find(r=>r.id===`run:${g.runId}`);const qr=rows.find(r=>r.id===`quota:${g.runId}`);if(!row||!qr)throw new JevCustodyError('CORRUPT');
    const run=readTrialRun(row);validateTrialRows(rows,run);if(run.revision!==revision||!sameActor(run.actor,g.actor)||run.tokenHash!==jevDigest(g.executionToken)||run.trialId!==g.spec.trialId||run.caseId!==g.caseId||run.policyDigest!==g.spec.policyDigest||run.inputDigest!==g.inputDigest||run.rosterDigest!==g.spec.rosterDigest||run.canonicalExecutionId!==g.canonicalExecutionId||run.nonceHash!==g.nonceHash||run.expiresAt!==g.expiresAt)throw new JevCustodyError('CONFLICT');
    const quota=validateActionQuota(qr.value as ActionQuotaSnapshot);if(qr.revision!==row.revision||quota.scopeId!==g.spec.policyDigest||quota.reservationId!==g.runId)throw new JevCustodyError('CORRUPT');
    const stage=run.stages[stageId==='wide'?0:1];let action:'start'|'settle'|'stop'=operation;
    if(operation==='start'){if(stage.state!=='NOT_STARTED'||(stageId==='narrow'&&run.stages[0].state!=='SETTLED'))throw new JevCustodyError('STAGE_REFUSED');Object.assign(quota,transitionActionQuota(quota,stage.stageExecutionKey,'start'));stage.state='START_COMMITTED';}
    else {if(stage.state!=='START_COMMITTED')throw new JevCustodyError('STAGE_REFUSED');const cap=quota.stages[stage.stageExecutionKey].allocation;const cost=evidence?.costMicrounits;const invalid=!evidence||!exact(evidence,['costMicrounits','reportedModel','receiptDigest','gatewayReceiptId','inputTokens','outputTokens'])||evidence.reportedModel!=='typesafe/jev-1.14-20261014'||!sha(evidence.receiptDigest)||!evidence.gatewayReceiptId||evidence.gatewayReceiptId.length>200||run.stages.some(s=>s.gatewayReceiptId===evidence.gatewayReceiptId)||[evidence.inputTokens,evidence.outputTokens].some(x=>x!==null&&!money(x));if(invalid||!money(cost)||cost>cap){action='stop';Object.assign(quota,transitionActionQuota(quota,stage.stageExecutionKey,'unknown'));stage.state='UNKNOWN';run.terminal={safeCode:'POSSIBLE_SEND',providerContact:invalid?'POSSIBLE':'RESPONSE_OBSERVED',outcomeKnown:false};}else{Object.assign(quota,transitionActionQuota(quota,stage.stageExecutionKey,'settle',cost));stage.state='SETTLED';stage.costMicrounits=cost;stage.reportedModel=evidence!.reportedModel;stage.receiptDigest=evidence!.receiptDigest;stage.gatewayReceiptId=evidence!.gatewayReceiptId;stage.inputTokens=evidence!.inputTokens;stage.outputTokens=evidence!.outputTokens;}}
    const trialWrite=trialStage(rows,g.spec,trialCase(g),stageId,action,jevDigest,now);run.revision++;
    return {writes:[trialWrite,{id:row.id,expectedRevision:row.revision,value:run},{id:qr.id,expectedRevision:qr.revision,value:quota}],result:run};
  });
}

function finishTrial(directory:string,g:JevTrialGrant,revision:number,result:JevStoredResult,now:number):JevTrialRun {
  verifyTrialGrant(g,now);return new SQLiteAtomicRecordAdapter(directory,'jev-suggestion-v1').transaction(rows=>{
    const row=rows.find(r=>r.id===`run:${g.runId}`),qr=rows.find(r=>r.id===`quota:${g.runId}`);if(!row||!qr)throw new JevCustodyError('CORRUPT');
    const run=readTrialRun(row),quota=validateActionQuota(qr.value as ActionQuotaSnapshot);validateTrialRows(rows,run);
    if(run.revision!==revision||qr.revision!==revision||run.tokenHash!==jevDigest(g.executionToken)||!sameActor(run.actor,g.actor)||run.policyDigest!==g.spec.policyDigest||run.trialId!==g.spec.trialId||run.caseId!==g.caseId||run.result||run.stages[0].state!=='SETTLED'||run.stages.some(s=>s.state==='START_COMMITTED'||s.state==='UNKNOWN')||(result.status==='suggested'&&run.stages[1].state!=='SETTLED'))throw new JevCustodyError('ACTION_REFUSED');
    for(const stage of run.stages)if(stage.state==='NOT_STARTED')Object.assign(quota,transitionActionQuota(quota,stage.stageExecutionKey,'release'));
    run.result=result;run.terminal={safeCode:result.status==='suggested'?'COMPLETED':'NO_MATCH',providerContact:'RESPONSE_OBSERVED',outcomeKnown:true};run.revision++;readTrialRun({id:row.id,revision:run.revision,value:run});
    return {writes:[{id:row.id,expectedRevision:revision,value:run},{id:qr.id,expectedRevision:qr.revision,value:quota}],result:run};
  });
}
