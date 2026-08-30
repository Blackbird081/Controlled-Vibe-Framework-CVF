import { NextResponse } from 'next/server';
import { appendAuditEvent } from '@/lib/control-plane-events';
import { evaluateDurableMemoryWrite, resolveDurableMemoryActorRole } from '@/lib/durable-memory-route';
import { emitExecutionTelemetry, resolveTokenUsage } from '@/lib/execute-telemetry';
import { attachReceiptToDiagnostic, buildExecutionDiagnostic } from '@/lib/execution-diagnostics';
import { buildPhase2CProductBriefSliceForRoute } from '@/lib/phase2c-product-brief-slice';
import { buildPhase3EOperationalMetricsForRoute } from '@/lib/phase3e-operational-emission';
import { buildRouteAuditMemoryCapture } from '@/lib/audit-memory-receipt';
import { buildContextBundleReadout } from '@/lib/context-bundle-readout';
import { buildEvidenceToLearningReadout } from '@/lib/evidence-to-learning-readout';
import {
    buildAuditFeedbackValidationReadout,
    buildExecutionContinuityHandoffReadout,
    buildSimulationFailureGateReadout,
} from '@/lib/mlw-runtime-chain-readouts';
import { buildRouteRequestContextReadout } from '@/lib/route-request-context-readout';
import { buildVerticalIntegrationReadout } from '@/lib/vertical-integration-readout';
import { buildEvidenceReceipt } from '@/lib/web-governance-envelope';
import { buildWorkflowExecutionProjection } from '@/lib/workflows/workflow-resolver';
import { withSessionAuditPayload } from '@/lib/middleware-auth';
import { calculateTokenCost } from '@/lib/model-pricing';
import { buildExecuteResponseReadouts } from './route-response-readouts';
import { buildProviderAttemptReconciliation } from '@/lib/provider-attempt-admission';
import type { ProviderAttemptLedger } from '@/lib/provider-attempt-admission';
import type { AIProvider, ExecutionRequest, ExecutionResponse } from '@/lib/ai';
import type { GuardPipelineResult } from '@/lib/guard-runtime-adapter';
import type { ValidationResult, RetryState } from '@/lib/output-validator';
import type { RoleOutputPermissionCheck } from '@/lib/execute-route-guards';
import type { ApprovalRequestRecord } from '../approvals/store';
import type { WebGovernanceEnvelope } from '@/lib/web-governance-envelope';
import type { WorkflowBinding } from 'cvf-guard-contract';
import type { ResolvedExecutionCVFRole, ActorRoleGateResult } from '@/lib/execute-role-resolver';
import type { SessionCookie } from '@/lib/middleware-auth';
import type { Template } from '@/types';
import type { EnforcementResult } from '@/lib/enforcement';
import type { WebProviderRoutingResult } from '@/lib/ai/provider-router-adapter';
import type { KnowledgeQueryResult } from '@/lib/knowledge-retrieval';
import type { ExecutionIdentityDecision } from '@/lib/execution-identity';
import type { AifMemoryReinjectionDecision } from '@/lib/aif-memory-reinjection';
import type { DurableMemoryRouteResult } from '@/lib/durable-memory-route';
import type { ProviderAttemptReconciliationReceipt } from '@/lib/ai';

interface BuildOutputValidationExhaustedResponseParams {
    session: SessionCookie | null;
    isServiceAllowed: boolean;
    serviceIdentity: string | null;
    body: { templateName?: string; templateId?: string; cvfRiskLevel?: string; cvfPhase?: string; model?: string };
    outputValidation: ValidationResult;
    retryState: RetryState;
    routedProvider: AIProvider;
    aiResult: ExecutionResponse;
    enforcement: EnforcementResult;
    guardResult: GuardPipelineResult;
    govEnvelope: WebGovernanceEnvelope;
    routingResult: WebProviderRoutingResult;
    knowledgeSource: string;
    knowledgeInjected: boolean;
    requestedKnowledgeCollectionId: string | null;
    retrievalResult: KnowledgeQueryResult;
    approvedRequestRecord: ApprovalRequestRecord | null;
    aifMemoryReinjection: AifMemoryReinjectionDecision;
    durableMemoryRoute: DurableMemoryRouteResult;
    providerAttemptLedger: ProviderAttemptLedger;
}

/**
 * Build the 422 response returned when output-validation retries are
 * exhausted. Extracted from route.ts (DSH-WRA-R1-RV-F01 rework) as a pure
 * response builder alongside its sibling final-response/denied-response
 * builders, to keep route.ts's own line count within the governed
 * maintainability threshold without changing this path's behavior.
 */
export async function buildOutputValidationExhaustedResponse(params: BuildOutputValidationExhaustedResponseParams) {
    const {
        session, isServiceAllowed, serviceIdentity, body, outputValidation, retryState, routedProvider, aiResult,
        enforcement, guardResult, govEnvelope, routingResult, knowledgeSource, knowledgeInjected,
        requestedKnowledgeCollectionId, retrievalResult, approvedRequestRecord, aifMemoryReinjection,
        durableMemoryRoute, providerAttemptLedger,
    } = params;

    await appendAuditEvent({
        eventType: 'OUTPUT_VALIDATION_EXHAUSTED',
        actorId: session?.userId ?? 'service-account',
        actorRole: session?.role ?? 'service',
        targetResource: body.templateName || body.templateId || 'unknown-template',
        action: 'BLOCK_INVALID_OUTPUT',
        riskLevel: body.cvfRiskLevel ?? enforcement.riskGate?.riskLevel ?? 'R1',
        phase: body.cvfPhase ?? 'PHASE D',
        outcome: 'BLOCKED',
        payload: withSessionAuditPayload(session, {
            issues: outputValidation.issues,
            qualityHint: outputValidation.qualityHint,
            retryAttempts: retryState.attempt,
            provider: routedProvider,
            model: body.model ?? aiResult.model ?? routedProvider,
        }),
    });

    const validationExhaustedReconciliation = buildProviderAttemptReconciliation(providerAttemptLedger, routedProvider, body.model ?? 'default');
    return NextResponse.json(
        {
            success: false,
            error: 'Generated response failed output validation after retry attempts.',
            provider: routedProvider,
            model: body.model ?? aiResult.model ?? routedProvider,
            enforcement,
            guardResult,
            outputValidation: { qualityHint: outputValidation.qualityHint, issues: outputValidation.issues, retryAttempts: retryState.attempt },
            governanceEnvelope: govEnvelope,
            policySnapshotId: govEnvelope.policySnapshotId,
            governanceEvidenceReceipt: buildEvidenceReceipt({
                envelope: govEnvelope, decision: 'BLOCK', riskLevel: enforcement.riskGate?.riskLevel, provider: routedProvider,
                model: body.model ?? aiResult.model ?? routedProvider, routingDecision: routingResult.decision, knowledgeSource, knowledgeInjected,
                knowledgeCollectionId: requestedKnowledgeCollectionId, knowledgeChunkCount: retrievalResult.allowedChunkCount,
                approvalId: approvedRequestRecord?.id, validationHint: outputValidation.qualityHint, aifMemoryReinjection: aifMemoryReinjection.receipt,
                durableMemoryRead: durableMemoryRoute.receipt, providerAttemptReconciliation: validationExhaustedReconciliation,
            }),
            providerAttemptReconciliation: validationExhaustedReconciliation,
        },
        { status: 422 },
    );
}

interface BuildExecuteFinalResponseParams {
    aiResult: ExecutionResponse;
    outputValidation?: ValidationResult;
    retryState: RetryState;
    request: ExecutionRequest;
    template?: Template;
    routeStartedAtMs: number;
    session: SessionCookie | null;
    serviceIdentity: string | null;
    isServiceAllowed: boolean;
    resolvedExecutionRole: ResolvedExecutionCVFRole;
    rolePermission: RoleOutputPermissionCheck;
    enforcement: EnforcementResult;
    guardResult: GuardPipelineResult;
    routingResult: WebProviderRoutingResult;
    govEnvelope: WebGovernanceEnvelope;
    knowledgeSource: string;
    knowledgeInjected: boolean;
    knowledgeContextLength: number;
    requestedKnowledgeCollectionId: string | null;
    retrievalResult: KnowledgeQueryResult;
    approvedRequestRecord: ApprovalRequestRecord | null;
    aifMemoryReinjection: AifMemoryReinjectionDecision;
    durableMemoryRoute: DurableMemoryRouteResult;
    workflowBinding?: WorkflowBinding;
    executionTemplateId?: string | null;
    executionIdentity: ExecutionIdentityDecision;
    routedProvider: AIProvider;
    isVisionExecution: boolean;
    requestedProvider: AIProvider;
    filteredPrompt: string;
    actorRoleGate: ActorRoleGateResult;
    providerAttemptReconciliation: ProviderAttemptReconciliationReceipt;
}

export async function buildExecuteFinalResponse(params: BuildExecuteFinalResponseParams) {
    const {
        aiResult,
        outputValidation,
        retryState,
        request,
        template,
        routeStartedAtMs,
        session,
        serviceIdentity,
        isServiceAllowed,
        resolvedExecutionRole,
        rolePermission,
        enforcement,
        guardResult,
        routingResult,
        govEnvelope,
        knowledgeSource,
        knowledgeInjected,
        knowledgeContextLength,
        requestedKnowledgeCollectionId,
        retrievalResult,
        approvedRequestRecord,
        aifMemoryReinjection,
        durableMemoryRoute,
        workflowBinding,
        executionTemplateId,
        executionIdentity,
        routedProvider,
        isVisionExecution,
        requestedProvider,
        filteredPrompt,
        actorRoleGate,
        providerAttemptReconciliation,
    } = params;

    const model = request.model ?? aiResult.model ?? routedProvider;
    const actorId = session?.userId ?? (isServiceAllowed ? 'service-account' : 'unknown-actor');
    const actorRole = resolvedExecutionRole.role ?? (isServiceAllowed ? 'service' : 'unknown');

    if (aiResult.success && aiResult.output) {
        try {
            await emitExecutionTelemetry({
                session,
                request,
                prompt: filteredPrompt,
                output: aiResult.output,
                provider: routedProvider,
                model,
                response: aiResult,
            });
        } catch (telemetryError) {
            console.warn('Execution telemetry degraded:', telemetryError);
        }
    }

    const usage = aiResult.success && aiResult.output ? resolveTokenUsage(filteredPrompt, aiResult.output, aiResult) : undefined;
    const durableMemoryWriteReceipt = aiResult.success && aiResult.output
        ? evaluateDurableMemoryWrite({ request, actorId, actorRole: resolveDurableMemoryActorRole(resolvedExecutionRole.role), output: aiResult.output })
        : undefined;
    const routeElapsedMs = Math.max(0, Date.now() - routeStartedAtMs);
    const runtimeTelemetry = usage
        ? {
            schemaVersion: 'cvf.runtimeTelemetry.v1' as const,
            providerLatencyMs: aiResult.executionTime,
            routeElapsedMs,
            tokenUsage: usage,
            estimatedCostUSD: calculateTokenCost(model, usage.inputTokens, usage.outputTokens),
            costEstimateSource: 'cvf_model_pricing_table_or_fallback' as const,
            redactionApplied: true as const,
            claimBoundary: 'summary_only_no_raw_prompt_output_key_or_provider_payload' as const,
        }
        : undefined;

    const governanceEvidenceReceipt = buildEvidenceReceipt({
        envelope: govEnvelope,
        decision: enforcement.status,
        riskLevel: enforcement.riskGate?.riskLevel,
        provider: routedProvider,
        model,
        routingDecision: routingResult.decision,
        knowledgeSource,
        knowledgeInjected,
        knowledgeCollectionId: requestedKnowledgeCollectionId,
        knowledgeChunkCount: retrievalResult.allowedChunkCount,
        approvalId: approvedRequestRecord?.id,
        validationHint: outputValidation?.qualityHint,
        aifMemoryReinjection: aifMemoryReinjection.receipt,
        durableMemoryRead: durableMemoryRoute.receipt,
        durableMemoryWriteReceipt,
        runtimeTelemetry,
        providerAttemptReconciliation,
        receiptIntegrity: {
            signingSecret: process.env.CVF_RECEIPT_HMAC_SECRET ?? process.env.CVF_AUDIT_SIGNING_KEY,
            externalAnchorId: process.env.CVF_RECEIPT_EXTERNAL_ANCHOR_ID,
            externalAnchorUrl: process.env.CVF_RECEIPT_EXTERNAL_ANCHOR_URL,
        },
    });

    if (isVisionExecution) governanceEvidenceReceipt.vision = true;

    const executionDiagnostic = !aiResult.success
        ? attachReceiptToDiagnostic(
            aiResult.diagnostic,
            buildExecutionDiagnostic({ stage: 'provider', class: 'unknown_error', provider: routedProvider, model, latencyMs: aiResult.executionTime }),
            governanceEvidenceReceipt.receiptId,
            governanceEvidenceReceipt.envelopeId,
        )
        : aiResult.success && !aiResult.output
            ? buildExecutionDiagnostic({
                stage: 'provider',
                class: 'provider_empty_output',
                provider: routedProvider,
                model,
                latencyMs: aiResult.executionTime,
                receiptId: governanceEvidenceReceipt.receiptId,
                traceId: governanceEvidenceReceipt.envelopeId,
            })
            : undefined;

    const workflowExecution = aiResult.success && workflowBinding
        ? buildWorkflowExecutionProjection(workflowBinding, governanceEvidenceReceipt.receiptId)
        : undefined;

    if (workflowExecution) {
        await appendAuditEvent({
            eventType: 'WORKFLOW_BINDING_EXECUTED',
            actorId,
            actorRole,
            targetResource: request.templateName || request.templateId || workflowExecution.templateId,
            action: 'EMIT_WORKFLOW_STEP_TRACES',
            riskLevel: request.cvfRiskLevel ?? enforcement.riskGate?.riskLevel ?? 'R1',
            phase: request.cvfPhase ?? 'PHASE E',
            outcome: 'COMPLETED',
            payload: withSessionAuditPayload(session, {
                workflowId: workflowExecution.workflowId,
                workflowVersion: workflowExecution.workflowVersion,
                capabilityId: workflowExecution.capabilityId,
                templateId: workflowExecution.templateId,
                stepTraces: workflowExecution.stepTraces,
                receipts: workflowExecution.receipts,
                receiptObligations: workflowExecution.receiptObligations,
                receiptBinding: workflowExecution.receiptBinding,
                deferredStepIds: workflowExecution.deferredStepIds,
                stateMachine: workflowExecution.stateMachine,
                governanceReceiptId: governanceEvidenceReceipt.receiptId,
                rolePermission: {
                    role: resolvedExecutionRole.role,
                    permissionRole: rolePermission.role,
                    outputClass: rolePermission.outputClass,
                    allowed: rolePermission.allowed,
                    source: resolvedExecutionRole.source,
                },
                executionIdentity,
            }),
        });
    }

    const normalizedTemplateId = executionTemplateId ?? undefined;

    const phase2cProductBrief = aiResult.success && aiResult.output
        ? buildPhase2CProductBriefSliceForRoute({
            responseSuccess: aiResult.success,
            templateId: normalizedTemplateId,
            templateName: template?.name ?? request.templateName,
            category: template?.category,
            inputs: request.inputs || {},
            intent: request.intent || '',
            output: aiResult.output,
            evidenceReceipt: governanceEvidenceReceipt,
            validation: outputValidation
                ? {
                    qualityHint: outputValidation.qualityHint,
                    issues: outputValidation.issues,
                }
                : undefined,
        })
        : undefined;

    const phase3eOperationalMetrics = buildPhase3EOperationalMetricsForRoute({
        phase2cProductBrief,
        evidenceReceipt: governanceEvidenceReceipt,
        responseSuccess: aiResult.success,
    });

    await appendAuditEvent({
        eventType: 'OPERATIONAL_BENCHMARK_METRIC_EMITTED',
        actorId,
        actorRole,
        targetResource: request.templateName || request.templateId || 'unknown-template',
        action: 'EMIT_RUNTIME_RECEIPT_COUNT',
        riskLevel: request.cvfRiskLevel ?? enforcement.riskGate?.riskLevel ?? 'R1',
        phase: request.cvfPhase ?? 'REVIEW',
        outcome: aiResult.success ? 'COMPLETED' : 'FAILED',
        payload: withSessionAuditPayload(session, {
            metricId: 'runtime_receipt_count',
            kind: 'receipt_count',
            emittedAtPoint: 'review',
            value: 1,
            numerator: 1,
            denominator: 1,
            receiptLinked: true,
            liveEmissionWired: true,
            governanceReceiptId: governanceEvidenceReceipt.receiptId,
            envelopeId: governanceEvidenceReceipt.envelopeId,
            policySnapshotId: governanceEvidenceReceipt.policySnapshotId,
            routeId: governanceEvidenceReceipt.routeId,
            provider: routedProvider,
            model,
            claimBoundary: 'single_metric_live_emission_only_no_full_operational_benchmark_claim',
        }),
    });

    const { auditMemoryReceipt, auditEventPayload } = buildRouteAuditMemoryCapture({
        governanceReceiptId: governanceEvidenceReceipt.receiptId,
        actorId,
        actorRole,
        sessionId: session?.userId ?? (isServiceAllowed ? serviceIdentity ?? undefined : undefined),
        sessionRole: session?.role ?? (isServiceAllowed ? 'service' : undefined),
        templateId: normalizedTemplateId,
        templateName: request.templateName || request.templateId,
        workflowId: workflowExecution?.workflowId,
        provider: routedProvider,
        model,
        decision: enforcement.status,
        stepTraceIds: workflowExecution?.stepTraces.map((trace) => trace.stepId) ?? [],
        rolePermission: { role: resolvedExecutionRole.role, permissionRole: rolePermission.role, outputClass: rolePermission.outputClass, allowed: rolePermission.allowed },
        riskLevel: request.cvfRiskLevel ?? enforcement.riskGate?.riskLevel,
        phase: request.cvfPhase,
    });

    await appendAuditEvent({
        ...auditEventPayload,
        payload: withSessionAuditPayload(session, { ...auditEventPayload.payload, actor_role_gate_result: actorRoleGate.result, executionIdentity }),
    });

    const requestContextReadout = buildRouteRequestContextReadout({
        request,
        knowledgeContextLength,
        retrievedChunkCount: retrievalResult.allowedChunkCount,
        chainTurnIndex: request.verticalIntegrationChain?.turnIndex,
    });
    const contextBundleReadout = buildContextBundleReadout({
        receipt: governanceEvidenceReceipt,
        requestContextReadout,
        retrievalResult,
        requestedKnowledgeCollectionId,
        knowledgeSource,
        knowledgeInjected,
        durableMemoryRead: durableMemoryRoute.receipt,
        aifMemoryReinjection: aifMemoryReinjection.receipt,
    });

    const verticalIntegrationReadout = buildVerticalIntegrationReadout({
        evidenceReceipt: governanceEvidenceReceipt,
        workflowExecution,
        auditMemoryReceipt,
        requestContextReadout,
        phase2cProductBrief,
        phase3eOperationalMetrics,
        chainRequest: request.verticalIntegrationChain,
        actorId,
        templateId: normalizedTemplateId,
    });

    const responseReadouts = buildExecuteResponseReadouts({
        request,
        template,
        routeStartedAtMs,
        success: aiResult.success,
        output: aiResult.output,
        provider: routedProvider,
        model,
        decision: enforcement.status,
        receipt: { receiptId: governanceEvidenceReceipt.receiptId, envelopeId: governanceEvidenceReceipt.envelopeId },
        workflowId: workflowExecution?.workflowId,
        permissionRole: resolvedExecutionRole.permissionRole,
    });
    const evidenceToLearningReadout = buildEvidenceToLearningReadout({
        receipt: governanceEvidenceReceipt,
        contextBundleReadout,
        learningPlaneReadout: responseReadouts.learningPlaneReadout,
        auditMemoryReceipt,
    });
    const executionContinuityHandoffReadout = buildExecutionContinuityHandoffReadout({
        receipt: governanceEvidenceReceipt,
        contextBundleReadout,
        evidenceToLearningReadout,
    });
    const auditFeedbackValidationReadout = buildAuditFeedbackValidationReadout({
        receipt: governanceEvidenceReceipt,
        contextBundleReadout,
        evidenceToLearningReadout,
        executionContinuityHandoffReadout,
        auditMemoryReceipt,
    });
    const simulationFailureGateReadout = buildSimulationFailureGateReadout({
        receipt: governanceEvidenceReceipt,
        contextBundleReadout,
        evidenceToLearningReadout,
        executionContinuityHandoffReadout,
        auditFeedbackValidationReadout,
    });

    return NextResponse.json({
        ...aiResult,
        usage,
        enforcement,
        guardResult,
        rolePermission: {
            role: resolvedExecutionRole.role,
            permissionRole: rolePermission.role,
            outputClass: rolePermission.outputClass,
            allowed: rolePermission.allowed,
            source: resolvedExecutionRole.source,
        },
        executionIdentity,
        providerRouting: {
            decision: routingResult.decision,
            selectedProvider: routingResult.selectedProvider,
            rationale: routingResult.rationale,
            deniedReason: routingResult.deniedReason,
            fallbackChain: routingResult.fallbackChain,
            requestedProvider,
            routerOverrode: routingResult.selectedProvider !== null && routingResult.selectedProvider !== requestedProvider,
        },
        knowledgeInjection: {
            injected: knowledgeInjected,
            contextLength: knowledgeContextLength,
            source: knowledgeSource,
            chunkCount: retrievalResult.allowedChunkCount,
            collectionId: requestedKnowledgeCollectionId,
            allowedCollectionIds: retrievalResult.allowedCollectionIds,
        },
        aifMemoryReinjection: aifMemoryReinjection.receipt,
        durableMemoryRead: durableMemoryRoute.receipt,
        durableMemoryWriteReceipt,
        outputValidation: outputValidation
            ? {
                qualityHint: outputValidation.qualityHint,
                issues: outputValidation.issues,
                retryAttempts: retryState.attempt,
            }
            : undefined,
        governanceEnvelope: govEnvelope,
        policySnapshotId: govEnvelope.policySnapshotId,
        governanceEvidenceReceipt,
        providerAttemptReconciliation,
        ...(executionDiagnostic ? { diagnostic: executionDiagnostic } : {}),
        auditMemoryReceipt,
        requestContextReadout,
        contextBundleReadout,
        evidenceToLearningReadout,
        executionContinuityHandoffReadout,
        auditFeedbackValidationReadout,
        simulationFailureGateReadout,
        verticalIntegrationReadout,
        ...responseReadouts,
        ...(workflowExecution ? workflowExecution : {}),
        ...(phase2cProductBrief ? { phase2cProductBrief } : {}),
        ...(phase3eOperationalMetrics ? { phase3eOperationalMetrics } : {}),
    });
}
