import { randomUUID } from 'node:crypto';
import { reserveActionQuota, transitionActionQuota, validateActionQuota, type ActionQuotaSnapshot } from '../../../CVF_MODEL_GATEWAY/src/quota-ledger';
import { SQLiteAtomicRecordAdapter, type AtomicSQLiteRow } from './atomic.sqlite.record.store';

/** Source-only custody: trusted host ports are required; this module does not authenticate an OS identity. */
export interface NonWebBinding {
  parentId: string; outcomeId: string; criteriaRevision: string; criteriaHash: string;
  authorityRevision: string; authorityHash: string; principalId: string; role: string;
  reviewerRef: string; verdictRef: string; expiresAt: string; currency: string;
  maxAttempts: number; moneyCap: number;
}
export interface CurrentAuthority {
  principalId: string; role: string; criteriaRevision: string; criteriaHash: string;
  authorityRevision: string; authorityHash: string; reviewerRef: string; verdictRef: string;
  revoked: boolean; veto: boolean;
}
export interface CustodyAuthorityPort {
  authorizeProvision(binding: NonWebBinding): boolean;
  current(binding: NonWebBinding): CurrentAuthority | null;
}
type Parent = { binding: NonWebBinding; attempts: number; denied: number; held: number; spent: number };
type RequestRecord = { parentId: string; requestRef: string; canonicalExecutionId: string; allocation: number;
  quota: ActionQuotaSnapshot; state: 'RESERVED' | 'CLAIMED' | 'HELD' | 'STARTED' | 'SETTLED' | 'RELEASED' | 'UNKNOWN';
  intent: 'NONE' | 'COMMITTED'; providerId: string | null; modelId: string | null; guardRef: string | null; contextRef: string | null;
  validationRef: string | null; receiptRef: string | null; manifestRef: string | null; auditRef: string | null;
  terminal: string | null; };
const row = (rows: AtomicSQLiteRow[], id: string) => rows.find(r => r.id === id);
const good = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9._:/-]{1,200}$/.test(v);
const integer = (v: number) => Number.isSafeInteger(v) && v > 0;
const validId = (v: string) => /^[a-zA-Z0-9._:-]{1,150}$/.test(v);
function checkedParent(value: unknown): Parent {
  if (!value || typeof value !== 'object') throw Error('PARENT_CORRUPT');
  const p=value as Parent, b=p.binding;
  if (!b || !validId(b.parentId) || ![b.outcomeId,b.criteriaRevision,b.criteriaHash,b.authorityRevision,b.authorityHash,b.principalId,b.role,b.reviewerRef,b.verdictRef].every(good)
      || !integer(b.maxAttempts) || !integer(b.moneyCap) || !/^[A-Z]{3}$/.test(b.currency) || !Number.isFinite(Date.parse(b.expiresAt))
      || !Number.isSafeInteger(p.attempts) || p.attempts < 0 || p.attempts > b.maxAttempts
      || !Number.isSafeInteger(p.denied) || p.denied < 0 || !Number.isSafeInteger(p.held) || p.held < 0 || !Number.isSafeInteger(p.spent) || p.spent < 0
      || !Number.isSafeInteger(p.held+p.spent) || p.held+p.spent > b.moneyCap) throw Error('PARENT_CORRUPT');
  return p;
}
function checkedRequest(value: unknown): RequestRecord {
  if (!value || typeof value !== 'object') throw Error('REQUEST_CORRUPT');
  const r=value as RequestRecord;
  if (!validId(r.parentId) || !validId(r.requestRef) || !good(r.canonicalExecutionId) || !integer(r.allocation)
      || !['RESERVED','CLAIMED','HELD','STARTED','SETTLED','RELEASED','UNKNOWN'].includes(r.state)
      || !['NONE','COMMITTED'].includes(r.intent)) throw Error('REQUEST_CORRUPT');
  const q=validateActionQuota(r.quota);
  if (q.scopeId !== r.parentId || q.reservationId !== r.requestRef || q.totalMicrounits !== r.allocation || Object.keys(q.stages).join(',') !== 'attempt0' || q.stages.attempt0.allocation !== r.allocation) throw Error('REQUEST_CORRUPT');
  return r;
}
function permitted(b: NonWebBinding, c: CurrentAuthority | null, now: number): boolean {
  return !!c && c.revoked === false && c.veto === false && Number.isFinite(now) && now < Date.parse(b.expiresAt)
    && c.principalId === b.principalId && c.role === b.role && c.criteriaRevision === b.criteriaRevision
    && c.criteriaHash === b.criteriaHash && c.authorityRevision === b.authorityRevision
    && c.authorityHash === b.authorityHash && c.reviewerRef === b.reviewerRef && c.verdictRef === b.verdictRef;
}
export class NonWebCanonicalCustody {
  constructor(protected readonly store: SQLiteAtomicRecordAdapter, protected readonly authority: CustodyAuthorityPort,
    protected readonly clock: () => number = Date.now) {
    if (!store || !authority || typeof authority.authorizeProvision !== 'function' || typeof authority.current !== 'function') throw Error('TRUSTED_AUTHORITY_REQUIRED');
  }
  read(requestRef: string): Readonly<RequestRecord> { const rr = row(this.store.readAll(), `request:${requestRef}`); if (!rr) throw Error('REQUEST_MISSING'); return structuredClone(checkedRequest(rr.value)); }
  claim(requestRef: string, principalId: string): void {
    this.store.transaction(rows => {
      const rr=row(rows, `request:${requestRef}`); if (!rr) throw Error('REQUEST_MISSING');
      const request=checkedRequest(rr.value); const pr=row(rows, `parent:${request.parentId}`); const ar=row(rows, `authority:${request.parentId}`);
      if (!pr || !ar) throw Error('PARENT_MISSING'); const parent=checkedParent(pr.value);
      if (request.state !== 'RESERVED' || principalId !== parent.binding.principalId || !permitted(parent.binding, ar.value as CurrentAuthority, this.clock()) || !permitted(parent.binding,this.authority.current(parent.binding),this.clock())) throw Error('CLAIM_DENIED');
      request.state='CLAIMED';
      return {writes:[{id:rr.id,expectedRevision:rr.revision,value:request}],result:undefined};
    });
  }
  start(requestRef: string, principalId: string, providerId: string, modelId: string, guardRef: string, contextRef: string): void {
    if (![principalId,providerId,modelId,guardRef,contextRef].every(good)) throw Error('EVIDENCE_REQUIRED');
    this.store.transaction(rows => {
      const rr = row(rows, `request:${requestRef}`); if (!rr) throw Error('REQUEST_MISSING');
      const request = checkedRequest(rr.value); const pr = row(rows, `parent:${request.parentId}`); if (!pr) throw Error('PARENT_MISSING');
      const parent = checkedParent(pr.value);
      const ar = row(rows, `authority:${request.parentId}`);
      if (request.state !== 'CLAIMED' || principalId !== parent.binding.principalId || !ar || !permitted(parent.binding, ar.value as CurrentAuthority, this.clock()) || !permitted(parent.binding, this.authority.current(parent.binding), this.clock())) throw Error('START_DENIED');
      request.quota = transitionActionQuota(validateActionQuota(request.quota), 'attempt0', 'start');
      Object.assign(request,{state:'STARTED',intent:'COMMITTED',providerId,modelId,guardRef,contextRef});
      return {writes:[{id:rr.id,expectedRevision:rr.revision,value:request}],result:undefined};
    });
  }
  finish(requestRef: string, result: {cost: number | null; validationRef: string; receiptRef: string; manifestRef: string; auditRef: string; terminal: string}): void {
    if (![result.validationRef,result.receiptRef,result.manifestRef,result.auditRef,result.terminal].every(good)) throw Error('EVIDENCE_REQUIRED');
    this.store.transaction(rows => {
      const rr = row(rows, `request:${requestRef}`); if (!rr) throw Error('REQUEST_MISSING'); const request = checkedRequest(rr.value);
      const pr = row(rows, `parent:${request.parentId}`); if (!pr) throw Error('PARENT_MISSING'); const parent = checkedParent(pr.value);
      if (request.state === 'SETTLED') {
        const st=validateActionQuota(request.quota).stages.attempt0;
        if (st.cost === result.cost && request.validationRef === result.validationRef && request.receiptRef === result.receiptRef && request.manifestRef === result.manifestRef && request.auditRef === result.auditRef && request.terminal === result.terminal) return {writes:[],result:undefined};
        throw Error('SETTLEMENT_CONFLICT');
      }
      if (request.state !== 'STARTED' && request.state !== 'UNKNOWN') throw Error('SETTLEMENT_DENIED');
      request.quota = transitionActionQuota(validateActionQuota(request.quota),'attempt0','settle',result.cost);
      Object.assign(request,{state:result.cost === null ? 'UNKNOWN' : 'SETTLED',validationRef:result.validationRef,receiptRef:result.receiptRef,manifestRef:result.manifestRef,auditRef:result.auditRef,terminal:result.terminal});
      if (result.cost !== null) { parent.held -= request.allocation; parent.spent += result.cost; }
      return {writes:[{id:rr.id,expectedRevision:rr.revision,value:request},{id:pr.id,expectedRevision:pr.revision,value:parent}],result:undefined};
    });
  }
  /** Called only during owned restart reconciliation, never as an automatic resend. */
  recover(requestRef: string): void {
    const state = this.read(requestRef).state;
    if (state === 'STARTED' || state === 'CLAIMED') this.hold(requestRef);
  }
  hold(requestRef: string): void {
    this.store.transaction(rows => {
      const rr=row(rows, `request:${requestRef}`); if (!rr) throw Error('REQUEST_MISSING'); const request=checkedRequest(rr.value);
      if (request.state === 'STARTED') {request.quota=transitionActionQuota(request.quota,'attempt0','unknown'); request.state='UNKNOWN';}
      else if (request.state === 'CLAIMED' || request.state === 'RESERVED') request.state='HELD';
      else if (request.state !== 'UNKNOWN' && request.state !== 'HELD') throw Error('HOLD_DENIED');
      request.terminal='POSSIBLE_CONTACT';
      return {writes:[{id:rr.id,expectedRevision:rr.revision,value:request}],result:undefined};
    });
  }
  stop(requestRef: string, reason: string): void {
    if (!good(reason)) throw Error('REASON_REQUIRED');
    this.store.transaction(rows => {
      const rr = row(rows, `request:${requestRef}`); if (!rr) throw Error('REQUEST_MISSING'); const request = checkedRequest(rr.value);
      const pr = row(rows, `parent:${request.parentId}`); if (!pr) throw Error('PARENT_MISSING'); const parent = checkedParent(pr.value);
      if (request.state === 'RESERVED' || request.state === 'CLAIMED') { request.quota = transitionActionQuota(request.quota,'attempt0','release'); request.state='RELEASED'; parent.held-=request.allocation; }
      else if (request.state === 'STARTED') { request.quota=transitionActionQuota(request.quota,'attempt0','unknown'); request.state='UNKNOWN'; }
      else throw Error('STOP_DENIED');
      request.terminal=reason;
      return {writes:[{id:rr.id,expectedRevision:rr.revision,value:request},{id:pr.id,expectedRevision:pr.revision,value:parent}],result:undefined};
    });
  }
}

/** Controller capability only; never expose this object to the execution client. */
export class NonWebCanonicalController extends NonWebCanonicalCustody {
  provision(binding: NonWebBinding): void {
    if (!this.authority.authorizeProvision(binding) || !validId(binding.parentId)
      || ![binding.outcomeId,binding.criteriaRevision,binding.criteriaHash,binding.authorityRevision,binding.authorityHash,binding.principalId,binding.role,binding.reviewerRef,binding.verdictRef].every(good)
      || !integer(binding.maxAttempts) || !integer(binding.moneyCap) || !/^[A-Z]{3}$/.test(binding.currency)
      || !Number.isFinite(Date.parse(binding.expiresAt))) throw Error('PROVISION_DENIED');
    this.store.transaction(rows => {
      if (row(rows, `parent:${binding.parentId}`)) throw Error('PARENT_EXISTS');
      const value: Parent = { binding: structuredClone(binding), attempts: 0, denied: 0, held: 0, spent: 0 };
      const current = this.authority.current(binding);
      if (!permitted(binding, current, this.clock())) throw Error('AUTHORITY_DENIED');
      return { writes: [{ id: `parent:${binding.parentId}`, expectedRevision: null, value }, {id:`authority:${binding.parentId}`, expectedRevision:null, value:current}], result: undefined };
    });
  }
  updateAuthority(parentId: string, current: CurrentAuthority): void {
    this.store.transaction(rows => {
      const pr = row(rows, `parent:${parentId}`); const ar = row(rows, `authority:${parentId}`);
      if (!pr || !ar || !this.authority.authorizeProvision(checkedParent(pr.value).binding)) throw Error('AUTHORITY_UPDATE_DENIED');
      return {writes:[{id:ar.id,expectedRevision:ar.revision,value:current}],result:undefined};
    });
  }
  /** The request ref is caller supplied but canonical identity is minted here and cannot be replaced. */
  request(parentId: string, requestRef: string, allocation: number): string {
    if (!validId(parentId) || !validId(requestRef) || !integer(allocation)) throw Error('REQUEST_INVALID');
    const outcome = this.store.transaction<{id:string|null;error:string|null}>(rows => {
      const pr = row(rows, `parent:${parentId}`); if (!pr) throw Error('PARENT_MISSING');
      const parent = checkedParent(pr.value);
      if (row(rows, `request:${requestRef}`) || row(rows, `denial:${requestRef}`)) throw Error('REQUEST_REPLAY');
      const ar = row(rows, `authority:${parentId}`);
      const denied = !ar || !permitted(parent.binding, ar.value as CurrentAuthority, this.clock()) || !permitted(parent.binding, this.authority.current(parent.binding), this.clock()) ? 'AUTHORITY_DENIED' :
        parent.attempts >= parent.binding.maxAttempts || !Number.isSafeInteger(parent.held + parent.spent + allocation) || parent.held + parent.spent + allocation > parent.binding.moneyCap ? 'PARENT_CAP' : null;
      if (denied) {
        if (!Number.isSafeInteger(parent.denied+1)) throw Error('DENIAL_OVERFLOW');
        parent.denied++;
        return {writes:[{id:pr.id,expectedRevision:pr.revision,value:parent},{id:`denial:${requestRef}`,expectedRevision:null,value:{parentId,requestRef,reason:denied}}],result:{id:null,error:denied}};
      }
      const canonicalExecutionId = randomUUID();
      const quota = reserveActionQuota({ scopeId: parentId, reservationId: requestRef, currency: parent.binding.currency,
        totalMicrounits: allocation, stageAllocations: { attempt0: allocation } });
      const value: RequestRecord = { parentId, requestRef, canonicalExecutionId, allocation, quota, state:'RESERVED', intent:'NONE', providerId:null,modelId:null,guardRef:null,contextRef:null,validationRef:null,receiptRef:null,manifestRef:null,auditRef:null,terminal:null };
      parent.attempts++; parent.held += allocation;
      return { writes: [{id:pr.id, expectedRevision:pr.revision, value:parent}, {id:`request:${requestRef}`, expectedRevision:null,value}], result:{id:canonicalExecutionId,error:null} };
    });
    if (outcome.error) throw Error(outcome.error);
    return outcome.id!;
  }
}
