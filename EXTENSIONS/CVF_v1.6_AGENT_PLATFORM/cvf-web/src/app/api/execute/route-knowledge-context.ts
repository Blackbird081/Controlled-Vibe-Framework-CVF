/**
 * SOT3-ACT-A1/A2 - Execute route knowledge-context helper
 *
 * Owns tenant-scoped knowledge retrieval, formatting, scope-audit emission,
 * SOT3 knowledge activation evaluation, durable activation-evidence
 * persistence, and knowledge system-prompt construction for
 * `/api/execute`. Extracted from `route.ts` to keep the near-limit route
 * file thin and to give this same-domain block a focused, independently
 * testable owner.
 *
 * Authorization: docs/work_orders/CVF_AGENT_WORK_ORDER_SOT3_ACT_A1_SCOPED_KNOWLEDGE_CONTEXT_PRODUCT_ADAPTER_2026-07-13.md
 * Authorization: docs/work_orders/CVF_AGENT_WORK_ORDER_SOT3_ACT_A2_DURABLE_ACTIVATION_EVIDENCE_2026-07-13.md
 */
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { CVF_SYSTEM_PROMPT } from '@/lib/ai';
import { buildKnowledgeSystemPrompt, hasKnowledgeContext } from '@/lib/knowledge-context-injector';
import { formatKnowledgeChunks, queryKnowledgeChunks, type KnowledgeQueryResult } from '@/lib/knowledge-retrieval';
import { knowledgeStore } from '@/lib/knowledge-store';
import { appendAuditEvent } from '@/lib/control-plane-events';
import { withSessionAuditPayload, type SessionCookie } from '@/lib/middleware-auth';
import {
    evaluateSot3KnowledgeActivation,
    resolveSot3KnowledgeActivationMode,
    type Sot3KnowledgeActivationResult,
    type Sot3KnowledgeChunkInput,
} from '@/lib/sot3-knowledge-adapter';
import {
    Sot3ActivationEvidenceStore,
    classifySot3EvidenceError,
    computeSot3EvidenceRecordIntegrityHash,
    deriveSot3EvidenceRecordId,
    SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION,
    type Sot3ActivationEvidenceRecord,
    type Sot3EvidenceDiagnosticClass,
} from '@/lib/sot3-activation-evidence-store';
import { DeterministicClock, SequentialIdFactory } from 'cvf-refinery';

export interface KnowledgeContextParams {
    intent: string;
    orgId: string | undefined;
    teamId: string | undefined;
    requestedCollectionId: string | undefined;
    templateLabel: string;
    session: SessionCookie | null | undefined;
    /** Injectable so route tests never touch shared workspace evidence. */
    evidenceStore?: Sot3ActivationEvidenceStore;
    /** Injectable request identity and clock for deterministic activation evidence. */
    activationRuntime?: {
        requestIdFactory: () => string;
        nowUtcIso: () => string;
    };
}

export interface KnowledgeContextResult {
    retrievalResult: KnowledgeQueryResult;
    finalKnowledgeContext: string | undefined;
    knowledgeInjected: boolean;
    knowledgeSource: 'retrieval' | 'none';
    knowledgeSystemPrompt: string;
    requestedKnowledgeCollectionId: string | null;
    sot3: Sot3KnowledgeActivationResult | null;
}

function resolveChunkSot3Source(chunk: { id: string; collectionId: string }) {
    const collection = knowledgeStore.getCollection(chunk.collectionId);
    return collection?.chunks.find((stored) => stored.id === chunk.id)?.sot3Source;
}

async function emitScopeFilterAudit(params: {
    retrievalResult: KnowledgeQueryResult;
    session: SessionCookie | null | undefined;
    templateLabel: string;
}): Promise<void> {
    const { retrievalResult, session, templateLabel } = params;
    if (retrievalResult.droppedChunkCount === 0) return;
    await appendAuditEvent({
        eventType: 'KNOWLEDGE_SCOPE_FILTER_APPLIED',
        actorId: session?.userId ?? 'service-account',
        actorRole: session?.role ?? 'service',
        targetResource: templateLabel,
        action: 'FILTER_KNOWLEDGE_SCOPE',
        riskLevel: 'R2',
        phase: 'PHASE D',
        outcome: 'FILTERED',
        payload: withSessionAuditPayload(session, {
            requestedOrgId: session?.orgId ?? null,
            requestedTeamId: session?.teamId ?? null,
            retrievedChunkCount: retrievalResult.matchedChunkCount,
            allowedChunkCount: retrievalResult.allowedChunkCount,
            droppedChunkCount: retrievalResult.droppedChunkCount,
            allowedCollectionIds: retrievalResult.allowedCollectionIds,
            droppedCollectionIds: retrievalResult.droppedCollectionIds,
        }),
    });
}

async function emitSot3ActivationAudit(params: {
    mode: 'SHADOW' | 'ENFORCE';
    result: Sot3KnowledgeActivationResult;
    retrievalResult: KnowledgeQueryResult;
    session: SessionCookie | null | undefined;
    templateLabel: string;
}): Promise<void> {
    const { mode, result, retrievalResult, session, templateLabel } = params;
    await appendAuditEvent({
        eventType: 'SOT3_KNOWLEDGE_ACTIVATION_EVALUATED',
        actorId: session?.userId ?? 'service-account',
        actorRole: session?.role ?? 'service',
        targetResource: templateLabel,
        action: 'EVALUATE_SOT3_KNOWLEDGE_ACTIVATION',
        riskLevel: 'R2',
        phase: 'PHASE D',
        outcome: result.terminalOutcome,
        payload: withSessionAuditPayload(session, {
            mode,
            terminalOutcome: result.terminalOutcome,
            injectionPermitted: result.injectionPermitted,
            failureStage: result.failureStage,
            retrievedChunkCount: retrievalResult.matchedChunkCount,
            allowedChunkCount: retrievalResult.allowedChunkCount,
            droppedChunkCount: retrievalResult.droppedChunkCount,
            refineryPacketId: result.refineryPacketId,
            refineryPacketIds: result.refineryPacketIds,
            refineryStatus: result.refineryStatus,
            kernelDecisionId: result.kernelDecisionId,
            kernelDecisionIds: result.kernelDecisionIds,
            kernelDecision: result.kernelDecision,
            kernelEvidenceCount: result.kernelEvidenceCount,
            truthReferenceId: result.truthReferenceId,
            truthReferenceIds: result.truthReferenceIds,
            flowPackageId: result.flowPackageId,
            flowPackageIds: result.flowPackageIds,
            flowAcknowledgementState: result.flowAcknowledgementState,
        }),
    });
}

async function emitEvidencePersistedAudit(params: {
    mode: 'SHADOW' | 'ENFORCE';
    diagnosticClass: Sot3EvidenceDiagnosticClass;
    record: Sot3ActivationEvidenceRecord;
    session: SessionCookie | null | undefined;
    templateLabel: string;
}): Promise<void> {
    const { mode, diagnosticClass, record, session, templateLabel } = params;
    await appendAuditEvent({
        eventType: 'SOT3_ACTIVATION_EVIDENCE_PERSISTED',
        actorId: session?.userId ?? 'service-account',
        actorRole: session?.role ?? 'service',
        targetResource: templateLabel,
        action: 'PERSIST_SOT3_ACTIVATION_EVIDENCE',
        riskLevel: 'R2',
        phase: 'PHASE D',
        outcome: diagnosticClass,
        payload: withSessionAuditPayload(session, {
            mode,
            recordId: record.recordId,
            requestId: record.requestId,
            diagnosticClass,
            traceCount: record.traces.length,
            terminalOutcome: record.terminalOutcome,
            failureStage: record.failureStage,
            refineryPacketIds: record.traces.map((trace) => trace.refineryPacketId).filter((id): id is string => id !== null),
            kernelDecisionIds: record.traces.map((trace) => trace.kernelDecision?.decision_id).filter((id): id is string => Boolean(id)),
            truthReferenceIds: record.traces.map((trace) => trace.truthReference?.reference_id).filter((id): id is string => Boolean(id)),
            flowPackageIds: record.traces.map((trace) => trace.flowPackage?.package_id).filter((id): id is string => Boolean(id)),
        }),
    });
}

/**
 * Persists one durable activation-evidence record for an evaluated SOT3
 * result. Returns the exact persisted, duplicate, or classified failure
 * diagnostic after emitting the secret-safe audit projection.
 */
async function persistSot3ActivationEvidence(params: {
    mode: 'SHADOW' | 'ENFORCE';
    result: Sot3KnowledgeActivationResult;
    requestId: string;
    actorId: string;
    organization: string;
    team: string | null;
    session: SessionCookie | null | undefined;
    templateLabel: string;
    evidenceStore: Sot3ActivationEvidenceStore;
    createdAtUtc: string;
}): Promise<Sot3EvidenceDiagnosticClass> {
    const { mode, result, requestId, actorId, organization, team, session, templateLabel, evidenceStore, createdAtUtc } = params;

    const recordId = deriveSot3EvidenceRecordId({ requestId, actorId, organization, team, mode });
    const recordWithoutHash = {
        recordId,
        requestId,
        actorId,
        organization,
        team,
        mode,
        terminalOutcome: result.terminalOutcome,
        failureStage: result.failureStage,
        createdAtUtc,
        diagnosticClass: 'PERSISTED' as const,
        schemaVersion: SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION as typeof SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION,
        traces: result.traces,
    };
    const integrityHash = computeSot3EvidenceRecordIntegrityHash(recordWithoutHash);
    const record: Sot3ActivationEvidenceRecord = { ...recordWithoutHash, integrityHash };

    try {
        const outcome = await evidenceStore.append(record);
        await emitEvidencePersistedAudit({ mode, diagnosticClass: outcome.diagnosticClass, record, session, templateLabel });
        return outcome.diagnosticClass;
    } catch (error) {
        const diagnosticClass = classifySot3EvidenceError(error);
        await emitEvidencePersistedAudit({ mode, diagnosticClass, record, session, templateLabel });
        return diagnosticClass;
    }
}

/**
 * Blocks inline `knowledgeContext` bypass attempts from unauthenticated
 * service-token callers, auditing the block before rejecting. Returns the
 * rejection response when blocked, or `null` when the request may continue
 * to routing and scoped retrieval.
 */
export async function blockInlineKnowledgeContextBypass(params: {
    session: SessionCookie | null | undefined;
    isServiceAllowed: boolean;
    knowledgeContext: unknown;
    templateLabel: string;
    riskLevel: string | null | undefined;
    phase: string | null | undefined;
}): Promise<NextResponse | null> {
    const { session, isServiceAllowed, knowledgeContext, templateLabel, riskLevel, phase } = params;
    if (session || !isServiceAllowed || typeof knowledgeContext !== 'string' || !knowledgeContext.trim()) {
        return null;
    }

    await appendAuditEvent({
        eventType: 'INLINE_KNOWLEDGE_CONTEXT_BLOCKED',
        actorId: 'service-account',
        actorRole: 'service',
        targetResource: templateLabel,
        action: 'BLOCK_INLINE_KNOWLEDGE_CONTEXT',
        riskLevel: riskLevel ?? 'R2',
        phase: phase ?? 'PHASE D',
        outcome: 'BLOCKED',
        payload: {
            reason: 'service-token-inline-knowledge-disabled',
        },
    });

    return NextResponse.json(
        {
            success: false,
            error: 'Inline knowledgeContext is no longer accepted for service-token execution. Use scoped retrieval instead.',
        },
        { status: 400 },
    );
}

/**
 * Resolves scoped knowledge context for the execute route: retrieval,
 * scope-audit emission, SOT3 activation evaluation (mode-gated), and the
 * final knowledge system prompt. Ordering is fixed: retrieval and scope
 * audit happen first (already-authorized scope remains authoritative), SOT3
 * evaluation happens next, and prompt construction happens last, before
 * provider execution in the caller.
 */
export async function resolveKnowledgeContext(params: KnowledgeContextParams): Promise<KnowledgeContextResult> {
    const { intent, orgId, teamId, requestedCollectionId, templateLabel, session, evidenceStore, activationRuntime } = params;

    const retrievalResult = await queryKnowledgeChunks({
        intent,
        orgId,
        teamId,
        collectionId: requestedCollectionId,
    });

    await emitScopeFilterAudit({ retrievalResult, session, templateLabel });

    const requestedKnowledgeCollectionId = requestedCollectionId?.trim() ? requestedCollectionId.trim() : null;

    const mode = resolveSot3KnowledgeActivationMode(process.env.CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE);
    const retrievedKnowledgeContext = formatKnowledgeChunks(retrievalResult.chunks);

    let sot3: Sot3KnowledgeActivationResult | null = null;
    let finalKnowledgeContext = retrievedKnowledgeContext ?? undefined;

    if (mode !== 'OFF') {
        const organization = orgId ?? '';
        const team = teamId ?? null;
        const actorId = session?.userId ?? 'service-account';
        const requestId = activationRuntime?.requestIdFactory() ?? randomUUID();
        const activationTimeUtc = activationRuntime?.nowUtcIso() ?? new Date().toISOString();

        const chunkInputs: Sot3KnowledgeChunkInput[] = retrievalResult.chunks.map((chunk) => ({
            id: chunk.id,
            content: chunk.content,
            collectionId: chunk.collectionId,
            sot3Source: resolveChunkSot3Source(chunk),
        }));

        sot3 = evaluateSot3KnowledgeActivation(
            {
                chunks: chunkInputs,
                organization,
                team,
                actorId,
                requestId,
                policyVersion: 'cvf-web-knowledge-context-v1',
                ruleVersion: 'cvf-web-knowledge-context-v1',
                clock: new DeterministicClock(activationTimeUtc, 1000),
                ids: new SequentialIdFactory(),
            },
            mode,
        );

        await emitSot3ActivationAudit({ mode, result: sot3, retrievalResult, session, templateLabel });

        const diagnosticClass = await persistSot3ActivationEvidence({
            mode,
            result: sot3,
            requestId,
            actorId,
            organization,
            team,
            session,
            templateLabel,
            evidenceStore: evidenceStore ?? new Sot3ActivationEvidenceStore(process.env.CVF_SOT3_ACTIVATION_EVIDENCE_PATH),
            createdAtUtc: activationTimeUtc,
        });

        if (mode === 'ENFORCE') {
            const evidencePersisted = diagnosticClass === 'PERSISTED' || diagnosticClass === 'DUPLICATE_NOOP';
            if (!evidencePersisted) {
                sot3 = { ...sot3, injectionPermitted: false, failureStage: 'EVIDENCE_PERSISTENCE_FAILED' };
            }
            finalKnowledgeContext = evidencePersisted && sot3.injectionPermitted && sot3.approvedContext ? sot3.approvedContext : undefined;
        }
    }

    const knowledgeInjected = hasKnowledgeContext(finalKnowledgeContext);
    const knowledgeSource: 'retrieval' | 'none' = knowledgeInjected ? 'retrieval' : 'none';
    const knowledgeSystemPrompt = knowledgeInjected
        ? buildKnowledgeSystemPrompt(CVF_SYSTEM_PROMPT, finalKnowledgeContext as string, { orgId, teamId })
        : CVF_SYSTEM_PROMPT;

    return {
        retrievalResult,
        finalKnowledgeContext,
        knowledgeInjected,
        knowledgeSource,
        knowledgeSystemPrompt,
        requestedKnowledgeCollectionId,
        sot3,
    };
}
