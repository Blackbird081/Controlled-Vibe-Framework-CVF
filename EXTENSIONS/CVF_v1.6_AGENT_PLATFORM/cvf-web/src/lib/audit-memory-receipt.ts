import {
    createControlledMemoryGatewayContract,
    type ControlledMemoryReceipt,
} from 'cvf-learning-plane-foundation';
import type { CVFRole } from 'cvf-guard-contract';
import {
    MEMORY_CONTINUITY_CONTRACT_VERSION,
    MEMORY_REINJECTION_POLICIES,
    MEMORY_TIER_OWNER_POLICIES,
} from '../../../../CVF_GUARD_CONTRACT/src/contracts/memory-continuity.contract';

export interface BuildAuditMemoryReceiptInput {
    governanceReceiptId: string;
    actorId: string;
    actorRole: CVFRole | 'service' | 'unknown';
    sessionId?: string;
    templateId?: string;
    workflowId?: string;
    provider?: string;
    model?: string;
    decision?: string;
    stepTraceIds?: string[];
    rolePermission?: {
        role?: string | null;
        permissionRole?: string | null;
        outputClass?: string;
        allowed?: boolean;
    };
}

export interface AuditMemoryReceipt {
    tier: 'session';
    contractVersion: typeof MEMORY_CONTINUITY_CONTRACT_VERSION;
    ownerRole: string;
    reinjectionPolicy: {
        tier: 'session';
        privacyFilter: string;
        provenanceScoreThreshold: number;
        maxAgeSeconds: number;
        receiptRequired: true;
    };
    receipt: ControlledMemoryReceipt;
}

const auditMemoryGateway = createControlledMemoryGatewayContract();

export function buildAuditMemoryReceipt(input: BuildAuditMemoryReceiptInput): AuditMemoryReceipt {
    const tier = 'session' as const;
    const ownerPolicy = MEMORY_TIER_OWNER_POLICIES[tier];
    const reinjectionPolicy = MEMORY_REINJECTION_POLICIES[tier];
    const content = JSON.stringify({
        eventType: 'GOVERNANCE_AUDIT_MEMORY_RECEIPT',
        governanceReceiptId: input.governanceReceiptId,
        templateId: input.templateId,
        workflowId: input.workflowId,
        provider: input.provider,
        model: input.model,
        decision: input.decision,
        stepTraceIds: input.stepTraceIds ?? [],
        rolePermission: input.rolePermission,
    });

    const capture = auditMemoryGateway.capture({
        sourceEvent: 'execution_result',
        content,
        kind: 'episodic',
        scope: tier,
        sensitivity: 'internal',
        sessionId: input.sessionId,
        policy: {
            traceId: input.governanceReceiptId,
            policyResult: 'allow',
            actorId: input.actorId,
            actorRole: mapMemoryActorRole(input.actorRole),
            allowedScopes: [tier],
            canWrite: true,
            canReinject: false,
        },
        provenance: {
            sourceClass: 'runtime_event',
            summary: 'Governance execute audit receipt captured after provider response.',
        },
    });

    return {
        tier,
        contractVersion: MEMORY_CONTINUITY_CONTRACT_VERSION,
        ownerRole: ownerPolicy.ownerRole,
        reinjectionPolicy: {
            tier,
            privacyFilter: reinjectionPolicy.privacyFilter,
            provenanceScoreThreshold: reinjectionPolicy.provenanceScoreThreshold,
            maxAgeSeconds: reinjectionPolicy.maxAgeSeconds,
            receiptRequired: reinjectionPolicy.receiptRequired,
        },
        receipt: capture.receipt,
    };
}

function mapMemoryActorRole(
    role: BuildAuditMemoryReceiptInput['actorRole'],
): 'operator' | 'orchestrator' | 'worker' | 'reviewer' | 'system' {
    if (role === 'OPERATOR' || role === 'HUMAN') return 'operator';
    if (role === 'REVIEWER' || role === 'GOVERNOR') return 'reviewer';
    if (role === 'SERVICE_AGENT' || role === 'service') return 'system';
    return 'worker';
}

export interface RouteAuditMemoryContext {
    governanceReceiptId: string;
    actorId: string;
    actorRole: CVFRole | 'service' | 'unknown';
    sessionId?: string;
    sessionRole?: string;
    templateId?: string;
    templateName?: string;
    workflowId?: string;
    provider?: string;
    model?: string;
    decision?: string;
    stepTraceIds?: string[];
    rolePermission?: BuildAuditMemoryReceiptInput['rolePermission'];
    riskLevel?: string;
    phase?: string;
}

export interface RouteAuditMemoryCaptureResult {
    auditMemoryReceipt: AuditMemoryReceipt;
    auditEventPayload: {
        eventType: string;
        actorId: string;
        actorRole: string;
        targetResource: string;
        action: string;
        riskLevel: string;
        phase: string;
        outcome: string;
        payload: Record<string, unknown>;
    };
}

export function buildRouteAuditMemoryCapture(
    ctx: RouteAuditMemoryContext,
): RouteAuditMemoryCaptureResult {
    const auditMemoryReceipt = buildAuditMemoryReceipt({
        governanceReceiptId: ctx.governanceReceiptId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        sessionId: ctx.sessionId,
        templateId: ctx.templateId,
        workflowId: ctx.workflowId,
        provider: ctx.provider,
        model: ctx.model,
        decision: ctx.decision,
        stepTraceIds: ctx.stepTraceIds,
        rolePermission: ctx.rolePermission,
    });
    return {
        auditMemoryReceipt,
        auditEventPayload: {
            eventType: 'AUDIT_MEMORY_RECEIPT_CAPTURED',
            actorId: ctx.actorId,
            actorRole: ctx.sessionRole ?? ctx.actorRole,
            targetResource: ctx.templateName ?? ctx.templateId ?? 'unknown-template',
            action: 'CAPTURE_GOVERNANCE_AUDIT_MEMORY',
            riskLevel: ctx.riskLevel ?? 'R1',
            phase: ctx.phase ?? 'PHASE H',
            outcome: auditMemoryReceipt.receipt.decision === 'captured' ? 'COMPLETED' : 'DEGRADED',
            payload: {
                governanceReceiptId: ctx.governanceReceiptId,
                memoryReceiptId: auditMemoryReceipt.receipt.receiptId,
                memoryIds: auditMemoryReceipt.receipt.memoryIds,
                memoryTier: auditMemoryReceipt.tier,
                memoryContractVersion: auditMemoryReceipt.contractVersion,
            },
        },
    };
}
