import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import type { AifMemoryReinjectionReceipt } from '@/lib/aif-memory-reinjection';
import type { DurableMemoryReceipt } from 'cvf-learning-plane-foundation';

/**
 * Web Governance Envelope — CVF W112-T1 (CP7)
 * =============================================
 * Normalizes governance metadata for all governance-relevant web routes.
 * Provides a shared structure that records who did what, under which policy,
 * in which evidence mode, for each request processed through the CVF web layer.
 *
 * @module lib/web-governance-envelope
 */

export type EvidenceMode = 'live' | 'ui_mock' | 'static' | 'none';
export type SurfaceClass =
    | 'governance-execution'
    | 'policy-mutation'
    | 'evidence-read'
    | 'ui-support'
    | 'out-of-scope';

export interface WebGovernanceEnvelope {
    envelopeId: string;
    routeId: string;
    surfaceClass: SurfaceClass;
    evidenceMode: EvidenceMode;
    actorId: string | null;
    actorRole: string | null;
    phase: string | null;
    riskLevel: string | null;
    policySnapshotId: string;
    providerLane: string | null;
    auditEventIds: string[];
    requestTimestamp: string;
    trancheRef: 'W112-T1';
}

let _policyCounter = 0;

/**
 * Generate a deterministic-ish policy snapshot id.
 * In production this would reference a real persisted policy version.
 * For now it captures date + a monotonic counter so each request
 * records a unique policy snapshot id that is replayable within a process lifetime.
 */
export function generatePolicySnapshotId(): string {
    _policyCounter++;
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `pol-${date}-${_policyCounter.toString().padStart(4, '0')}`;
}

export interface BuildEnvelopeInput {
    routeId: string;
    surfaceClass: SurfaceClass;
    evidenceMode: EvidenceMode;
    actorId?: string | null;
    actorRole?: string | null;
    phase?: string | null;
    riskLevel?: string | null;
    providerLane?: string | null;
    auditEventIds?: string[];
}

export interface BuildGovernanceEvidenceReceiptInput {
    envelope: WebGovernanceEnvelope;
    decision?: string;
    riskLevel?: string;
    provider?: string;
    model?: string;
    routingDecision?: string;
    knowledgeSource?: string;
    knowledgeInjected?: boolean;
    knowledgeCollectionId?: string | null;
    knowledgeChunkCount?: number;
    approvalId?: string;
    validationHint?: string;
    aifMemoryReinjection?: AifMemoryReinjectionReceipt;
    durableMemoryRead?: DurableMemoryReceipt;
    durableMemoryWriteReceipt?: DurableMemoryReceipt;
}

/**
 * Build a WebGovernanceEnvelope for the current request.
 * Call once per route handler and attach the result to the response.
 */
export function buildGovernanceEnvelope(input: BuildEnvelopeInput): WebGovernanceEnvelope {
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    return {
        envelopeId: `env-${ts.toString(36)}-${rand}`,
        routeId: input.routeId,
        surfaceClass: input.surfaceClass,
        evidenceMode: input.evidenceMode,
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        phase: input.phase ?? null,
        riskLevel: input.riskLevel ?? null,
        policySnapshotId: generatePolicySnapshotId(),
        providerLane: input.providerLane ?? null,
        auditEventIds: input.auditEventIds ?? [],
        requestTimestamp: new Date(ts).toISOString(),
        trancheRef: 'W112-T1',
    };
}

export function buildEvidenceReceipt(
    input: BuildGovernanceEvidenceReceiptInput,
): GovernanceEvidenceReceipt {
    return {
        receiptId: `rcpt-${input.envelope.envelopeId}`,
        evidenceMode: 'live',
        routeId: input.envelope.routeId,
        decision: input.decision,
        riskLevel: input.riskLevel ?? input.envelope.riskLevel ?? undefined,
        provider: input.provider,
        model: input.model,
        routingDecision: input.routingDecision,
        policySnapshotId: input.envelope.policySnapshotId,
        envelopeId: input.envelope.envelopeId,
        knowledgeSource: input.knowledgeSource,
        knowledgeInjected: input.knowledgeInjected,
        knowledgeCollectionId: input.knowledgeCollectionId ?? null,
        knowledgeChunkCount: input.knowledgeChunkCount,
        approvalId: input.approvalId,
        validationHint: input.validationHint,
        aifMemoryReinjection: input.aifMemoryReinjection,
        durableMemoryRead: input.durableMemoryRead,
        durableMemoryWriteReceipt: input.durableMemoryWriteReceipt,
        generatedAt: input.envelope.requestTimestamp,
    };
}

/**
 * Append an audit event id to an existing envelope (mutates in place).
 * Call this after emitting each audit event to keep the envelope complete.
 */
export function appendAuditEventToEnvelope(
    envelope: WebGovernanceEnvelope,
    eventId: string,
): void {
    envelope.auditEventIds.push(eventId);
}
