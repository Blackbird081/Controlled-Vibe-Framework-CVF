import {
    evaluateMemoryEventHook,
    MEMORY_EVENT_HOOKS_VERSION,
    type MemoryEventHookEvaluation,
} from 'cvf-learning-plane-foundation';
import {
    buildToolActionApprovalReadout,
    evaluateToolActionTaxonomy,
    TOOL_ACTION_APPROVAL_READOUT_VERSION,
    TOOL_ACTION_TAXONOMY_VERSION,
    type ToolActionApprovalReadout,
    type ToolActionTaxonomyEvaluation,
} from '../../../../../governance/contracts/tool-action-taxonomy';
import type { ExecutionRequest, GovernanceEvidenceReceipt } from '@/lib/ai';
import type { AuditMemoryReceipt } from '@/lib/audit-memory-receipt';
import type { Phase2CProductBriefSlice } from '@/lib/phase2c-product-brief-slice';
import type { Phase3EEmissionPilot } from '@/lib/phase3e-operational-emission';
import type { RouteRequestContextReadout } from '@/lib/route-request-context-readout';
import type { WorkflowExecutionProjection } from '@/lib/workflows/workflow-resolver';

export const VERTICAL_INTEGRATION_READOUT_VERSION = 'cvf.verticalWorkflowIntegration.vi1.v1';
export const VERTICAL_EVIDENCE_PACKAGE_VERSION = 'cvf.verticalEvidencePackage.vi4.v1';
export const PROVIDER_METHOD_FALLBACK_NORMALIZATION_VERSION = 'cvf.providerMethodFallbackNormalization.w5.v1';

export type VerticalIntegrationStatus = 'integrated' | 'partial' | 'not_applicable';
type ProviderFallbackDiagnosticClass = 'none' | 'unknown_error';
type ProviderFallbackUserAction = 'proceed' | 'stop_and_diagnose';
type ProviderMethodFallbackStatus = 'ready' | 'fallback_unavailable';

export type VerticalIntegrationSurfaceId =
    | 'governance_receipt'
    | 'workflow_state_machine'
    | 'workflow_recovery'
    | 'request_context_profile'
    | 'memory_event_hook'
    | 'tool_action_taxonomy'
    | 'tool_action_approval'
    | 'provider_method_fallback'
    | 'operational_scorecard'
    | 'artifact_verification'
    | 'operational_metrics';

export interface VerticalIntegrationSurfaceReadout {
    surfaceId: VerticalIntegrationSurfaceId;
    contractVersion: string;
    present: boolean;
    status: 'present' | 'missing';
    summary: string;
    evidenceRefs: readonly string[];
}

export interface VerticalIntegrationChainReadout {
    turnIndex: number;
    threadId: string | null;
    rootReceiptId: string | null;
    parentReceiptId: string | null;
    currentReceiptId: string;
    continuityProven: boolean;
    reason: string;
}

export interface VerticalOperationalScorecard {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    liveCalls: number;
    receiptBackedCalls: number;
    callPassRate: number;
    eventModel: {
        totalEvents: number;
        eventsPerCall: number;
        denominatorNote: string;
    };
}

export interface ProviderMethodReadout {
    contractVersion: typeof PROVIDER_METHOD_FALLBACK_NORMALIZATION_VERSION;
    status: ProviderMethodFallbackStatus;
    providerId: string;
    modelId: string;
    requestedMethod: 'chat';
    normalizedMethod: 'chat';
    supportedMethods: readonly ['chat'];
    methodSupported: boolean;
    adapterExecutionAuthorized: boolean;
    diagnosticClass: ProviderFallbackDiagnosticClass;
    retryable: boolean;
    fallback: {
        available: boolean;
        retryable: boolean;
        attemptedCount: number;
        remainingAttempts: number;
        reason: string;
    };
    userAction: ProviderFallbackUserAction;
    safeMessage: string;
}

export interface VerticalEvidencePackage {
    contractVersion: typeof VERTICAL_EVIDENCE_PACKAGE_VERSION;
    summary: string;
    nextSafeAction: string;
    callLevel: Omit<VerticalOperationalScorecard, 'eventModel'>;
    eventModel: VerticalOperationalScorecard['eventModel'];
    toolAction: ToolActionTaxonomyEvaluation;
    toolActionApproval: ToolActionApprovalReadout;
    providerMethod: ProviderMethodReadout;
    boundaries: readonly string[];
}

export interface VerticalIntegrationReadout {
    contractVersion: typeof VERTICAL_INTEGRATION_READOUT_VERSION;
    status: VerticalIntegrationStatus;
    requiredSurfaceCount: number;
    integratedSurfaceCount: number;
    liveReceipt: {
        present: boolean;
        receiptId: string;
        envelopeId?: string;
        provider?: string;
        model?: string;
        evidenceMode: GovernanceEvidenceReceipt['evidenceMode'];
    };
    surfaces: readonly VerticalIntegrationSurfaceReadout[];
    memoryEventHook: MemoryEventHookEvaluation;
    chain: VerticalIntegrationChainReadout;
    evidencePackage: VerticalEvidencePackage;
    boundaries: readonly string[];
}

export interface BuildVerticalIntegrationReadoutInput {
    evidenceReceipt: GovernanceEvidenceReceipt;
    workflowExecution?: WorkflowExecutionProjection;
    auditMemoryReceipt?: AuditMemoryReceipt;
    requestContextReadout?: RouteRequestContextReadout;
    phase2cProductBrief?: Phase2CProductBriefSlice;
    phase3eOperationalMetrics?: Phase3EEmissionPilot;
    chainRequest?: ExecutionRequest['verticalIntegrationChain'];
    actorId: string;
    templateId?: string;
}

const REQUIRED_SURFACE_COUNT = 5;

function normalizeRiskLevel(riskLevel?: string): 'R0' | 'R1' | 'R2' | 'R3' {
    if (riskLevel === 'R0' || riskLevel === 'R1' || riskLevel === 'R2' || riskLevel === 'R3') {
        return riskLevel;
    }
    return 'R1';
}

function mapPolicyDecision(decision?: string): 'allow' | 'allow_limited' | 'deny' | 'require_human_approval' {
    const normalized = String(decision ?? '').toUpperCase();
    if (normalized === 'BLOCK' || normalized === 'DENY') {
        return 'deny';
    }
    if (normalized === 'NEEDS_APPROVAL') {
        return 'require_human_approval';
    }
    return 'allow_limited';
}

function buildSurface(
    surfaceId: VerticalIntegrationSurfaceId,
    contractVersion: string,
    present: boolean,
    summary: string,
    evidenceRefs: readonly string[],
): VerticalIntegrationSurfaceReadout {
    return {
        surfaceId,
        contractVersion,
        present,
        status: present ? 'present' : 'missing',
        summary,
        evidenceRefs,
    };
}

function buildChainReadout(
    receipt: GovernanceEvidenceReceipt,
    chain?: ExecutionRequest['verticalIntegrationChain'],
): VerticalIntegrationChainReadout {
    const turnIndex = Number.isFinite(chain?.turnIndex) && Number(chain?.turnIndex) > 0
        ? Number(chain?.turnIndex)
        : 1;
    const parentReceiptId = chain?.parentReceiptId?.trim() || null;
    const rootReceiptId = chain?.rootReceiptId?.trim() || parentReceiptId;
    const threadId = chain?.threadId?.trim() || null;
    const continuityProven = turnIndex >= 2 && Boolean(threadId && parentReceiptId && rootReceiptId);

    return {
        turnIndex,
        threadId,
        rootReceiptId,
        parentReceiptId,
        currentReceiptId: receipt.receiptId,
        continuityProven,
        reason: continuityProven
            ? 'second_or_later_turn_links_to_prior_receipt'
            : turnIndex >= 2
                ? 'continuity_metadata_incomplete'
                : 'root_turn_or_single_turn',
    };
}

function buildToolActionReadouts(
    receipt: GovernanceEvidenceReceipt,
    templateId?: string,
): { taxonomy: ToolActionTaxonomyEvaluation; approval: ToolActionApprovalReadout } {
    const actionId = `vertical-readout:${templateId ?? receipt.routeId}:provider-result-observation`;
    const taxonomy = evaluateToolActionTaxonomy({
        actionId,
        surface: 'capability_provider',
        sideEffect: 'read_only',
        scopeDeclared: true,
        targetDeclared: true,
        traceBindingId: receipt.receiptId,
        sourceFamily: 'vi4_vertical_evidence_surface_expansion',
    });
    const approval = buildToolActionApprovalReadout(taxonomy);
    return { taxonomy, approval };
}

function buildProviderMethodReadout(receipt: GovernanceEvidenceReceipt): ProviderMethodReadout {
    const providerId = receipt.provider ?? 'unknown_provider';
    const modelId = receipt.model ?? 'unknown_model';
    const ready = Boolean(receipt.provider && receipt.model && receipt.decision === 'ALLOW');

    return {
        contractVersion: PROVIDER_METHOD_FALLBACK_NORMALIZATION_VERSION,
        status: ready ? 'ready' : 'fallback_unavailable',
        providerId,
        modelId,
        requestedMethod: 'chat',
        normalizedMethod: 'chat',
        supportedMethods: ['chat'],
        methodSupported: ready,
        adapterExecutionAuthorized: ready,
        diagnosticClass: ready ? 'none' : 'unknown_error',
        retryable: false,
        fallback: {
            available: false,
            retryable: false,
            attemptedCount: 0,
            remainingAttempts: ready ? 3 : 0,
            reason: ready ? 'no_failure_present' : 'route_receipt_did_not_prove_ready_provider_method',
        },
        userAction: ready ? 'proceed' : 'stop_and_diagnose',
        safeMessage: ready
            ? `${providerId}/${modelId} is receipt-backed for chat on the current governed route call.`
            : `${providerId}/${modelId} provider-method readiness is not proven by this receipt.`,
    };
}

function buildOperationalScorecard(
    receipt: GovernanceEvidenceReceipt,
    totalEvents: number,
): VerticalOperationalScorecard {
    const successfulCalls = receipt.decision === 'ALLOW' ? 1 : 0;
    const totalCalls = 1;

    return {
        totalCalls,
        successfulCalls,
        failedCalls: totalCalls - successfulCalls,
        liveCalls: receipt.evidenceMode === 'live' ? 1 : 0,
        receiptBackedCalls: receipt.receiptId ? 1 : 0,
        callPassRate: successfulCalls / totalCalls,
        eventModel: {
            totalEvents,
            eventsPerCall: totalEvents,
            denominatorNote: 'VI4 emits multiple evidence surfaces for one governed route call; event totals are not the call-level pass-rate denominator.',
        },
    };
}

function buildEvidencePackage(params: {
    receipt: GovernanceEvidenceReceipt;
    totalEvents: number;
    toolAction: ToolActionTaxonomyEvaluation;
    toolActionApproval: ToolActionApprovalReadout;
    providerMethod: ProviderMethodReadout;
}): VerticalEvidencePackage {
    const scorecard = buildOperationalScorecard(params.receipt, params.totalEvents);
    const { eventModel, ...callLevel } = scorecard;

    return {
        contractVersion: VERTICAL_EVIDENCE_PACKAGE_VERSION,
        summary: `current call ${scorecard.successfulCalls}/${scorecard.totalCalls} pass; ${eventModel.totalEvents} VI surfaces exposed`,
        nextSafeAction: params.providerMethod.adapterExecutionAuthorized
            ? 'Use this package as response-level evidence for the chained workflow; open a new governed tranche before adding runtime execution.'
            : 'Stop and classify provider-method readiness before rerunning or widening the route.',
        callLevel,
        eventModel,
        toolAction: params.toolAction,
        toolActionApproval: params.toolActionApproval,
        providerMethod: params.providerMethod,
        boundaries: [
            'response_level_evidence_package_only',
            'w3_ta1_readout_only_no_runtime_execution',
            'w4_current_call_scorecard_not_offline_benchmark_suite',
            'w5_provider_method_readout_no_routing_or_adapter_change',
            'no_prompt_mutation',
            'no_receipt_envelope_change',
        ],
    };
}

export function buildVerticalIntegrationReadout(
    input: BuildVerticalIntegrationReadoutInput,
): VerticalIntegrationReadout {
    const receipt = input.evidenceReceipt;
    const memoryIds = input.auditMemoryReceipt?.receipt.memoryIds ?? [];
    const captureRecord = input.auditMemoryReceipt?.captureRecord;
    const chain = buildChainReadout(receipt, input.chainRequest);
    const memoryEventHook = evaluateMemoryEventHook({
        eventId: `vi1-${receipt.receiptId}`,
        sessionId: chain.threadId ?? receipt.envelopeId ?? receipt.receiptId,
        actorId: input.actorId,
        projectId: input.templateId ?? receipt.routeId,
        eventType: 'execution_result',
        riskLevel: normalizeRiskLevel(receipt.riskLevel),
        policyDecision: mapPolicyDecision(receipt.decision),
        memoryIds,
        containsSensitiveData: false,
    });

    const artifactVerification = input.phase2cProductBrief?.deliverablePack.artifactVerification;
    const toolActionReadouts = buildToolActionReadouts(receipt, input.templateId);
    const providerMethodReadout = buildProviderMethodReadout(receipt);
    const baseSurfaces = [
        buildSurface(
            'governance_receipt',
            'web_governance_evidence_receipt',
            Boolean(receipt.receiptId && receipt.envelopeId),
            receipt.evidenceMode === 'live'
                ? 'live governance receipt is attached to the route response'
                : `${receipt.evidenceMode} governance receipt is attached to the route response`,
            [receipt.receiptId, receipt.envelopeId].filter(Boolean) as string[],
        ),
        buildSurface(
            'workflow_state_machine',
            'cvf.workflowStateMachineProjection.v1',
            input.workflowExecution?.stateMachine.contractVersion === 'cvf.workflowStateMachineProjection.v1',
            input.workflowExecution
                ? `workflow final state ${input.workflowExecution.stateMachine.finalState}`
                : 'workflow state-machine projection is not present',
            input.workflowExecution?.stateMachine.completedStepIds ?? [],
        ),
        buildSurface(
            'workflow_recovery',
            'cvf.workflowRecoveryReadout.wr1.v1',
            input.workflowExecution?.recovery.contractVersion === 'cvf.workflowRecoveryReadout.wr1.v1',
            input.workflowExecution
                ? `workflow recovery action ${input.workflowExecution.recovery.recoveryAction}`
                : 'workflow recovery readout is not present',
            input.workflowExecution?.recovery.lastRestorableCheckpoint?.receiptId
                ? [input.workflowExecution.recovery.lastRestorableCheckpoint.receiptId]
                : [],
        ),
        buildSurface(
            'request_context_profile',
            'cvf.routeRequestContextProfile.vi2.v1',
            input.requestContextReadout?.readoutVersion === 'cvf.routeRequestContextProfile.vi2.v1',
            input.requestContextReadout
                ? `request context ${input.requestContextReadout.readiness}; profile ${input.requestContextReadout.profile}`
                : 'request context profile readout is not present',
            input.requestContextReadout?.detectedSignals ?? [],
        ),
        buildSurface(
            'memory_event_hook',
            MEMORY_EVENT_HOOKS_VERSION,
            memoryEventHook.allowed,
            `${memoryEventHook.decision}; capture=${captureRecord?.captureDecision ?? 'missing'}; rawMemoryReleased=${memoryEventHook.receipt.rawMemoryReleased}; canReinject=${memoryEventHook.receipt.canReinject}`,
            [...memoryIds, captureRecord?.eventId, captureRecord?.auditReceiptId].filter(Boolean) as string[],
        ),
        buildSurface(
            'tool_action_taxonomy',
            TOOL_ACTION_TAXONOMY_VERSION,
            toolActionReadouts.taxonomy.taxonomyVersion === TOOL_ACTION_TAXONOMY_VERSION,
            `tool action ${toolActionReadouts.taxonomy.decision}; runtimeExecutionAuthorized=${toolActionReadouts.taxonomy.runtimeExecutionAuthorized}`,
            [toolActionReadouts.taxonomy.actionId, receipt.receiptId],
        ),
        buildSurface(
            'tool_action_approval',
            TOOL_ACTION_APPROVAL_READOUT_VERSION,
            toolActionReadouts.approval.contractVersion === TOOL_ACTION_APPROVAL_READOUT_VERSION,
            `approval ${toolActionReadouts.approval.approvalState}; runtimeExecutionAuthorized=${toolActionReadouts.approval.runtimeExecutionAuthorized}`,
            [toolActionReadouts.approval.actionId, receipt.receiptId],
        ),
        buildSurface(
            'provider_method_fallback',
            PROVIDER_METHOD_FALLBACK_NORMALIZATION_VERSION,
            providerMethodReadout.contractVersion === PROVIDER_METHOD_FALLBACK_NORMALIZATION_VERSION,
            `provider method ${providerMethodReadout.status}; diagnostic=${providerMethodReadout.diagnosticClass}; retryable=${providerMethodReadout.retryable}`,
            [providerMethodReadout.providerId, providerMethodReadout.modelId, receipt.receiptId],
        ),
        buildSurface(
            'operational_scorecard',
            VERTICAL_EVIDENCE_PACKAGE_VERSION,
            Boolean(receipt.receiptId),
            'call-level pass-rate and event-model denominator are reported separately',
            [receipt.receiptId],
        ),
        buildSurface(
            'artifact_verification',
            'cvf.packArtifactVerification.w6.v1',
            artifactVerification?.provenance.rendererPolicy === 'cvf.packArtifactVerification.w6.v1',
            artifactVerification
                ? `artifact verification ${artifactVerification.status}`
                : 'artifact verification is not present',
            artifactVerification?.provenance.receiptId ? [artifactVerification.provenance.receiptId] : [],
        ),
        buildSurface(
            'operational_metrics',
            'CVF_17_05_PHASE_3E_EMISSION_PILOT',
            input.phase3eOperationalMetrics?.status === 'emitted',
            input.phase3eOperationalMetrics
                ? `operational metrics emitted: ${input.phase3eOperationalMetrics.metrics.map(metric => metric.metricId).join(', ')}`
                : 'operational metric emission is not present',
            input.phase3eOperationalMetrics?.metrics.map(metric => metric.metricId) ?? [],
        ),
    ] as const;
    const evidencePackage = buildEvidencePackage({
        receipt,
        totalEvents: baseSurfaces.length,
        toolAction: toolActionReadouts.taxonomy,
        toolActionApproval: toolActionReadouts.approval,
        providerMethod: providerMethodReadout,
    });
    const surfaces = baseSurfaces;
    const integratedSurfaceCount = surfaces.filter(surface => surface.present).length;
    const status: VerticalIntegrationStatus = integratedSurfaceCount >= REQUIRED_SURFACE_COUNT
        ? 'integrated'
        : integratedSurfaceCount > 0
            ? 'partial'
            : 'not_applicable';

    return {
        contractVersion: VERTICAL_INTEGRATION_READOUT_VERSION,
        status,
        requiredSurfaceCount: REQUIRED_SURFACE_COUNT,
        integratedSurfaceCount,
        liveReceipt: {
            present: receipt.evidenceMode === 'live' && Boolean(receipt.receiptId),
            receiptId: receipt.receiptId,
            envelopeId: receipt.envelopeId,
            provider: receipt.provider,
            model: receipt.model,
            evidenceMode: receipt.evidenceMode,
        },
        surfaces,
        memoryEventHook,
        chain,
        evidencePackage,
        boundaries: [
            'response_level_readout_only',
            'no_new_receipt_envelope_schema',
            'no_workflow_engine_or_route_transition_blocking',
            'no_memory_reinjection_or_raw_memory_release',
            'no_provider_adapter_semantic_change',
            'w3_w4_w5_ta1_response_level_surfaces_only',
        ],
    };
}
