import { NextResponse } from 'next/server';

import type { AIProvider, ExecutionRequest } from '@/lib/ai';
import type { EnforcementResult } from '@/lib/enforcement';
import type { GuardPipelineResult } from '@/lib/guard-runtime-adapter';
import { appendAuditEvent } from '@/lib/control-plane-events';
import { withSessionAuditPayload } from '@/lib/middleware-auth';
import type { WebProviderRoutingResult } from '@/lib/ai/provider-router-adapter';
import { buildEvidenceReceipt, type WebGovernanceEnvelope } from '@/lib/web-governance-envelope';
import type { AifMemoryReinjectionDecision } from '@/lib/aif-memory-reinjection';

type SessionForAudit = Parameters<typeof withSessionAuditPayload>[0];
type AifMemoryRouteRequest = Partial<ExecutionRequest> & Pick<ExecutionRequest, 'aifMemoryReinjection'>;

export async function appendAifMemoryReinjectionAudit(input: {
    decision: AifMemoryReinjectionDecision;
    request: AifMemoryRouteRequest;
    session: SessionForAudit;
}): Promise<void> {
    if (!input.decision.receipt.requested) return;
    await appendAuditEvent({
        eventType: input.decision.status === 'allowed'
            ? 'AIF_MEMORY_REINJECTION_APPLIED'
            : 'AIF_MEMORY_REINJECTION_DENIED',
        actorId: input.session?.userId ?? 'service-account',
        actorRole: input.session?.role ?? 'service',
        targetResource: input.request.templateName || input.request.templateId || 'unknown-template',
        action: 'EVALUATE_AIF_MEMORY_REINJECTION',
        riskLevel: input.request.cvfRiskLevel ?? 'R1',
        phase: input.request.cvfPhase ?? 'PHASE D',
        outcome: input.decision.status === 'allowed' ? 'COMPLETED' : 'BLOCKED',
        payload: withSessionAuditPayload(input.session, {
            ...input.decision.receipt,
            actorAuthorized: input.request.aifMemoryReinjection?.policy?.actorAuthorized === true,
            canReinject: input.request.aifMemoryReinjection?.policy?.canReinject === true,
        }),
    });
}

export function buildAifMemoryReinjectionDeniedResponse(input: {
    decision: AifMemoryReinjectionDecision;
    envelope: WebGovernanceEnvelope;
    enforcement: EnforcementResult;
    guardResult: GuardPipelineResult;
    provider: AIProvider;
    routingResult: WebProviderRoutingResult;
    knowledgeSource: 'retrieval' | 'none';
    knowledgeInjected: boolean;
    knowledgeCollectionId: string | null;
    knowledgeChunkCount: number;
}) {
    const governanceEvidenceReceipt = buildEvidenceReceipt({
        envelope: input.envelope,
        decision: 'BLOCK',
        riskLevel: input.enforcement.riskGate?.riskLevel,
        provider: input.provider,
        model: 'aif-memory-reinjection-denied',
        routingDecision: input.routingResult.decision,
        knowledgeSource: input.knowledgeSource,
        knowledgeInjected: input.knowledgeInjected,
        knowledgeCollectionId: input.knowledgeCollectionId,
        knowledgeChunkCount: input.knowledgeChunkCount,
        aifMemoryReinjection: input.decision.receipt,
    });
    return NextResponse.json({
        success: false,
        error: input.decision.receipt.reason,
        provider: input.provider,
        model: 'aif-memory-reinjection-denied',
        enforcement: input.enforcement,
        guardResult: input.guardResult,
        governanceEnvelope: input.envelope,
        policySnapshotId: input.envelope.policySnapshotId,
        governanceEvidenceReceipt,
        aifMemoryReinjection: input.decision.receipt,
    }, { status: 403 });
}
