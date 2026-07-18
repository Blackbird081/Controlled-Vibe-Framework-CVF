import type { GovernanceEvidenceReceipt, GovernanceTraceEntry, GovernanceTraceStage, RuntimeTelemetryReceipt } from '@/lib/ai';
import { generatePolicySnapshotId } from '@/lib/policy-snapshot-registry';
import type { AifMemoryReinjectionReceipt } from '@/lib/aif-memory-reinjection';
import type { DurableMemoryReceipt } from 'cvf-learning-plane-foundation/web-runtime';
import { buildReceiptIntegrityAnchor } from '@/lib/receipt-integrity-anchor';

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

export { generatePolicySnapshotId } from '@/lib/policy-snapshot-registry';

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
    governanceTrace?: GovernanceTraceEntry[];
    runtimeTelemetry?: Omit<RuntimeTelemetryReceipt, 'governanceTraceEntryCount'>;
    receiptIntegrity?: {
        signingSecret?: string | null;
        externalAnchorId?: string | null;
        externalAnchorUrl?: string | null;
    };
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

const GOVERNANCE_TRACE_STAGES: GovernanceTraceStage[] = [
    'enforcement',
    'routing',
    'knowledge',
    'approval',
    'memory',
    'validation',
];

const UNSAFE_TRACE_VALUE_PATTERN = /raw prompt|raw output|system prompt|provider key|secret|private memory|sk-[a-z0-9_-]+/i;

function safeTraceText(value: unknown, fallback: string): string {
    if (typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    if (!trimmed || UNSAFE_TRACE_VALUE_PATTERN.test(trimmed)) return fallback;
    return trimmed.slice(0, 240);
}

function safeTraceList(value: unknown, fallback: string[]): string[] {
    if (!Array.isArray(value)) return fallback;
    const sanitized = value
        .map((item) => safeTraceText(item, ''))
        .filter((item) => item.length > 0)
        .slice(0, 8);
    return sanitized.length > 0 ? sanitized : fallback;
}

function sanitizeGovernanceTraceEntry(entry: unknown, policySnapshotId: string): GovernanceTraceEntry | null {
    if (!entry || typeof entry !== 'object') return null;
    const source = entry as Partial<GovernanceTraceEntry>;
    const stage = GOVERNANCE_TRACE_STAGES.includes(source.stage as GovernanceTraceStage)
        ? source.stage as GovernanceTraceStage
        : null;
    if (!stage) return null;
    return {
        stage,
        policyId: safeTraceText(source.policyId, policySnapshotId),
        decision: safeTraceText(source.decision, 'recorded'),
        summary: safeTraceText(source.summary, `${stage} checkpoint recorded`),
        parametersChecked: safeTraceList(source.parametersChecked, ['bounded checkpoint metadata']),
        constraintsApplied: safeTraceList(source.constraintsApplied, ['summary-only receipt trace']),
    };
}

function buildDefaultGovernanceTrace(input: BuildGovernanceEvidenceReceiptInput): GovernanceTraceEntry[] {
    const policyId = input.envelope.policySnapshotId;
    const entries: GovernanceTraceEntry[] = [];
    const riskLevel = input.riskLevel ?? input.envelope.riskLevel;

    if (input.decision || riskLevel) {
        entries.push({
            stage: 'enforcement',
            policyId,
            decision: input.decision ?? 'recorded',
            summary: `Enforcement decision recorded${riskLevel ? ` for ${riskLevel}` : ''}.`,
            parametersChecked: ['decision', 'riskLevel', 'policySnapshotId'],
            constraintsApplied: ['summary-only evidence', 'no raw request capture'],
        });
    }

    if (input.routingDecision || input.provider || input.model) {
        entries.push({
            stage: 'routing',
            policyId,
            decision: input.routingDecision ?? 'recorded',
            summary: 'Provider routing metadata recorded.',
            parametersChecked: ['routingDecision', 'provider', 'model'],
            constraintsApplied: ['provider credential excluded', 'internal instruction excluded'],
        });
    }

    if (
        input.knowledgeSource
        || input.knowledgeInjected !== undefined
        || input.knowledgeCollectionId
        || input.knowledgeChunkCount !== undefined
    ) {
        entries.push({
            stage: 'knowledge',
            policyId,
            decision: input.knowledgeInjected ? 'injected' : 'not_injected',
            summary: 'Knowledge retrieval summary recorded.',
            parametersChecked: ['knowledgeSource', 'knowledgeInjected', 'knowledgeCollectionId', 'knowledgeChunkCount'],
            constraintsApplied: ['chunk count only', 'private content excluded'],
        });
    }

    if (input.approvalId) {
        entries.push({
            stage: 'approval',
            policyId,
            decision: 'approved',
            summary: 'Approval binding reference recorded.',
            parametersChecked: ['approvalId'],
            constraintsApplied: ['approval id only', 'approval payload excluded'],
        });
    }

    if (input.aifMemoryReinjection || input.durableMemoryRead || input.durableMemoryWriteReceipt) {
        entries.push({
            stage: 'memory',
            policyId,
            decision: 'recorded',
            summary: 'Memory receipt presence recorded.',
            parametersChecked: ['aifMemoryReinjection', 'durableMemoryRead', 'durableMemoryWriteReceipt'],
            constraintsApplied: ['receipt metadata only', 'private content excluded'],
        });
    }

    if (input.validationHint) {
        entries.push({
            stage: 'validation',
            policyId,
            decision: input.validationHint,
            summary: 'Output validation hint recorded.',
            parametersChecked: ['validationHint'],
            constraintsApplied: ['summary-only validation signal'],
        });
    }

    return entries;
}

export function buildGovernanceTrace(
    input: BuildGovernanceEvidenceReceiptInput,
): GovernanceTraceEntry[] | undefined {
    const explicitTrace = input.governanceTrace
        ?.map((entry) => sanitizeGovernanceTraceEntry(entry, input.envelope.policySnapshotId))
        .filter((entry): entry is GovernanceTraceEntry => Boolean(entry));

    const trace = explicitTrace && explicitTrace.length > 0
        ? explicitTrace
        : buildDefaultGovernanceTrace(input);

    return trace.length > 0 ? trace : undefined;
}

export function buildEvidenceReceipt(
    input: BuildGovernanceEvidenceReceiptInput,
): GovernanceEvidenceReceipt {
    const governanceTrace = buildGovernanceTrace(input);
    const runtimeTelemetry = input.runtimeTelemetry
        ? {
            ...input.runtimeTelemetry,
            governanceTraceEntryCount: governanceTrace?.length ?? 0,
        }
        : undefined;

    const baseReceipt: Omit<GovernanceEvidenceReceipt, 'receiptIntegrity'> = {
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
        governanceTrace,
        runtimeTelemetry,
        generatedAt: input.envelope.requestTimestamp,
    };
    const receiptIntegrity = input.receiptIntegrity
        ? buildReceiptIntegrityAnchor({ receipt: baseReceipt, ...input.receiptIntegrity })
        : undefined;

    return receiptIntegrity ? { ...baseReceipt, receiptIntegrity } : baseReceipt;
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
