import type { CanonicalExecutionPort, CanonicalExecutionPortRequest, CanonicalExecutionPortResult } from 'cvf-model-gateway';
import { NonWebCanonicalCustody } from './nonweb.canonical.custody';

export interface NonWebTrustedPorts {
  identity(): Promise<{ principalId: string } | null>;
  guard(requestRef: string): Promise<{ allowed: boolean; reference: string } | null>;
  context(requestRef: string): Promise<{ allowed: boolean; reference: string } | null>;
  validate(result: CanonicalExecutionPortResult): Promise<{ valid: boolean; reference: string; auditRef: string; manifestRef: string; cost: number | null } | null>;
}
export class NonWebCanonicalExecution {
  constructor(private readonly custody: NonWebCanonicalCustody, private readonly port: CanonicalExecutionPort, private readonly trusted: NonWebTrustedPorts) {
    if (!custody || !port || typeof port.execute !== 'function' || !trusted || ['identity','guard','context','validate'].some(k => typeof trusted[k as keyof NonWebTrustedPorts] !== 'function')) throw Error('TRUSTED_PORTS_REQUIRED');
  }
  async execute(requestRef: string, input: Omit<CanonicalExecutionPortRequest,'canonicalExecutionId'|'attemptBoundary'>): Promise<CanonicalExecutionPortResult> {
    const record = this.custody.read(requestRef);
    if (record.state !== 'RESERVED') throw Error('REQUEST_NOT_AVAILABLE');
    let started = false;
    let uncertain = false;
    try {
      const identity = await this.trusted.identity();
      const guard = await this.trusted.guard(requestRef);
      const context = await this.trusted.context(requestRef);
      if (!identity?.principalId || guard?.allowed !== true || !guard.reference || context?.allowed !== true || !context.reference || input.signal?.aborted) throw Error('PRECHECK_DENIED');
      try { this.custody.claim(requestRef, identity.principalId); } catch (error) { uncertain = !!error && typeof error === 'object' && 'code' in error && error.code === 'COMMIT_UNKNOWN'; throw error; }
      const result = await this.port.execute({ ...input, policy: { ...input.policy, traceId: record.canonicalExecutionId }, canonicalExecutionId: record.canonicalExecutionId,
        attemptBoundary: async selected => {
          if (selected.canonicalExecutionId !== record.canonicalExecutionId || selected.traceId !== record.canonicalExecutionId || input.signal?.aborted) return {decision:'deny',attemptIndex:0,reason:'BINDING_DENIED'};
          try {
            this.custody.start(requestRef, identity.principalId, selected.providerId, selected.modelId, guard.reference, context.reference);
            started = true;
            return {decision:'allow',attemptIndex:0};
          } catch (error) { uncertain = !!error && typeof error === 'object' && 'code' in error && error.code === 'COMMIT_UNKNOWN'; return {decision:'deny',attemptIndex:0,reason:'CUSTODY_DENIED'}; }
        } });
      if (!started) { if (uncertain) this.custody.hold(requestRef); else this.custody.stop(requestRef, 'PRE_PROVIDER_DENIED'); return result; }
      if (result.canonicalExecutionId !== record.canonicalExecutionId || result.receipt.canonicalExecutionId !== record.canonicalExecutionId || result.receipt.traceId !== record.canonicalExecutionId || !result.receipt.receiptId) throw Error('RECEIPT_MISMATCH');
      const validation = await this.trusted.validate(result);
      if (!validation?.reference || !validation.auditRef || !validation.manifestRef || !result.materialContextManifest || validation.manifestRef !== result.materialContextManifest.manifestDigest || result.materialContextManifest.canonicalExecutionId !== record.canonicalExecutionId || result.materialContextManifest.traceId !== record.canonicalExecutionId) throw Error('VALIDATION_UNAVAILABLE');
      this.custody.finish(requestRef, {cost:validation.cost,validationRef:validation.reference,receiptRef:result.receipt.receiptId,manifestRef:validation.manifestRef,auditRef:validation.auditRef,terminal:validation.cost === null ? 'POSSIBLE_CONTACT' : validation.valid === true && !result.error ? 'SUCCEEDED' : 'FAILED'});
      if (validation.cost === null || validation.valid !== true || result.error) throw Error('RESULT_NOT_ACCEPTED');
      return result;
    } catch (error) {
      try { const state = this.custody.read(requestRef).state; if (state === 'STARTED' || state === 'CLAIMED') this.custody.hold(requestRef); else if (state === 'RESERVED' && uncertain) this.custody.hold(requestRef); else if (state === 'RESERVED') this.custody.stop(requestRef, 'PRE_PROVIDER_DENIED'); } catch { /* retain uncertainty for recovery */ }
      throw error;
    }
  }
}
