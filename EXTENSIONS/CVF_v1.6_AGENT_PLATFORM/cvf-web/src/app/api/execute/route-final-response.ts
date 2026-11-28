import { createHash } from 'node:crypto';
import { InvalidRequestBodyEncodingError } from '@/lib/bounded-request-body';
import { NextResponse } from 'next/server';
import { appendAuditEvent } from '@/lib/control-plane-events';
import { evaluateDurableMemoryWrite, resolveDurableMemoryActorRole, resolveDurableMemoryPrincipal } from '@/lib/durable-memory-route';
import { emitExecutionTelemetry, resolveTokenUsage } from '@/lib/execute-telemetry';
import { attachReceiptToDiagnostic, buildExecutionDiagnostic } from '@/lib/execution-diagnostics';
import { buildPhase2CProductBriefSliceForRoute } from '@/lib/phase2c-product-brief-slice';
import { buildPhase3EOperationalMetricsForRoute } from '@/lib/phase3e-operational-emission';
import { buildRouteAuditMemoryCapture } from '@/lib/audit-memory-receipt';
import { buildContextBundleReadout } from '@/lib/context-bundle-readout';
import { buildEvidenceToLearningReadout } from '@/lib/evidence-to-learning-readout';
import { admitProviderCall } from '@/lib/server/canonical-web-held-release';
import {
    buildAuditFeedbackValidationReadout,
    buildExecutionContinuityHandoffReadout,
    buildSimulationFailureGateReadout,
} from '@/lib/mlw-runtime-chain-readouts';
import { buildRouteRequestContextReadout } from '@/lib/route-request-context-readout';
import { buildVerticalIntegrationReadout } from '@/lib/vertical-integration-readout';
import { buildEvidenceReceipt } from '@/lib/web-governance-envelope';
import { buildWorkflowExecutionProjection } from '@/lib/workflows/workflow-resolver';
import { resolveVerifiedSessionProvenance, withSessionAuditPayload } from '@/lib/middleware-auth';
import { calculateTokenCost } from '@/lib/model-pricing';
import { buildExecuteResponseReadouts } from './route-response-readouts';
import { buildProviderAttemptReconciliation, createProviderAttemptLedger, buildProviderRequestCancelledResponse } from '@/lib/provider-attempt-admission';
import type { ProviderAttemptLedger } from '@/lib/provider-attempt-admission';
import type {
    AIProvider,
    CanonicalGatewayEvidence,
    CanonicalLineageEvidence,
    CanonicalLineageHistoryEntry,
    CanonicalLineageSettlementUncertainResponse,
    ExecutionRequest,
    ExecutionResponse,
} from '@/lib/ai';
import {
    finalize as finalizeLineage,
    loadLineageConfig,
    observationFromCanonicalEvidence,
    projectObservation,
    reserve as reserveLineage,
    resolveServiceIdentity,
    resolveSessionIdentity,
    settle as settleLineage,
    type LineageConfig,
    type LineageFailure,
    type LineageIdentity,
    type LineageRef,
    type LineageResult,
    type SafeLineageView,
} from '@/lib/server/canonical-web-lineage';
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
import { issueHtmlExecutionEvidence, htmlPilotRequestSha256 } from '@/lib/server/html-execution-evidence';
import { renderLockedHtmlPilotSource } from '@/lib/html-cta-rendering';
import { buildReceiptIntegrityAnchor } from '@/lib/receipt-integrity-anchor';
import type { HtmlPilotPrepared } from './route-html-pilot';
import type { KnowledgeContextResult } from './route-knowledge-context';
import type { HtmlPilotClaim } from '@/lib/server/ncr-html-pilot-operation-ledger';

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
        session, body, outputValidation, retryState, routedProvider, aiResult,
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
            retryAttempts: retryState.attempt, validationDecision: outputValidation.decision, ...(outputValidation.wordLimit ? { wordLimit: outputValidation.wordLimit } : {}),
            provider: routedProvider,
            model: body.model ?? aiResult.model ?? routedProvider,
        }),
    });

    const validationExhaustedReconciliation = buildProviderAttemptReconciliation(providerAttemptLedger, routedProvider, body.model ?? 'default');
    const validationReceipt = buildEvidenceReceipt({
        envelope: govEnvelope, decision: 'BLOCK', riskLevel: enforcement.riskGate?.riskLevel, provider: routedProvider,
        model: body.model ?? aiResult.model ?? routedProvider, routingDecision: routingResult.decision, knowledgeSource, knowledgeInjected,
        knowledgeCollectionId: requestedKnowledgeCollectionId, knowledgeChunkCount: retrievalResult.allowedChunkCount,
        approvalId: approvedRequestRecord?.id, validationHint: outputValidation.qualityHint, aifMemoryReinjection: aifMemoryReinjection.receipt,
        durableMemoryRead: durableMemoryRoute.receipt, providerAttemptReconciliation: validationExhaustedReconciliation,
    });
    return NextResponse.json(
        {
            success: false,
            ...(outputValidation.decision === 'BLOCK' ? { error: 'Generated response exceeds the explicit word limit.', automaticRetryAllowed: false } : { error: 'Generated response failed output validation after retry attempts.' }),
            provider: routedProvider,
            model: body.model ?? aiResult.model ?? routedProvider,
            usage: aiResult.usage,
            canonicalGateway: aiResult.canonicalGateway,
            maoExecution: aiResult.maoExecution,
            maoRolePlan: aiResult.maoRolePlan,
            tokensUsed: aiResult.tokensUsed,
            executionTime: aiResult.executionTime,
            diagnostic: buildExecutionDiagnostic({
                stage: 'output_validation', class: 'output_validation_failed', provider: routedProvider,
                model: body.model ?? aiResult.model ?? routedProvider, httpStatus: 422,
                receiptId: validationReceipt.receiptId, traceId: validationReceipt.envelopeId,
            }),
            enforcement,
            guardResult,
            outputValidation: { qualityHint: outputValidation.qualityHint, issues: outputValidation.issues, reasons: outputValidation.reasons,
                retryAttempts: retryState.attempt, ...(outputValidation.wordLimit ? { wordLimit: outputValidation.wordLimit } : {}) },
            governanceEnvelope: govEnvelope,
            policySnapshotId: govEnvelope.policySnapshotId,
            governanceEvidenceReceipt: validationReceipt,
            providerAttemptReconciliation: validationExhaustedReconciliation,
        },
        { status: 422 },
    );
}

interface BuildExecuteFinalResponseParams {
    htmlPilotClaim?: { prepared: HtmlPilotPrepared; claim: HtmlPilotClaim };
    aiResult: ExecutionResponse;
    outputValidation?: ValidationResult;
    retryState: RetryState;
    request: ExecutionRequest;
    template?: Template;
    routeStartedAtMs: number;
    routeStartedMonotonicMs: number;
    pilotProviderElapsedMs: number;
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
        aiResult: providerResult,
        outputValidation,
        retryState,
        request,
        template,
        routeStartedAtMs,
        routeStartedMonotonicMs,
        pilotProviderElapsedMs,
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
        htmlPilotClaim,
    } = params;

    // A failed or empty response cannot become a completed artifact downstream.
    const aiResult: ExecutionResponse = providerResult.success && typeof providerResult.output === 'string' && providerResult.output.trim()
        ? providerResult
        : {
            ...providerResult, success: false, output: undefined,
            error: providerResult.error || 'The provider returned no usable output.',
            diagnostic: providerResult.diagnostic ?? (providerResult.success
                ? buildExecutionDiagnostic({ stage: 'provider', class: 'provider_empty_output', provider: routedProvider, model: providerResult.model, latencyMs: providerResult.executionTime })
                : undefined),
        };
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

    const resolvedUsage = aiResult.success && aiResult.output ? resolveTokenUsage(filteredPrompt, aiResult.output, aiResult) : undefined;
    const usage = aiResult.canonicalGateway ? aiResult.usage : resolvedUsage ?? aiResult.usage;
    const durableMemoryWriteReceipt = aiResult.success && aiResult.output
        ? evaluateDurableMemoryWrite({ request, actorId, originPrincipalId: resolveDurableMemoryPrincipal({ isServiceAllowed, serviceIdentity, sessionUserId: session?.userId }), actorRole: resolveDurableMemoryActorRole(resolvedExecutionRole.role), output: aiResult.output })
        : undefined;
    const routeElapsedMs = Math.max(0, Date.now() - routeStartedAtMs);
    const runtimeTelemetry = resolvedUsage
        ? {
            schemaVersion: 'cvf.runtimeTelemetry.v1' as const,
            providerLatencyMs: aiResult.executionTime,
            routeElapsedMs,
            tokenUsage: resolvedUsage,
            ...(aiResult.canonicalGateway ? { tokenUsageProvenance: 'estimated_or_mixed' as const } : {}),
            estimatedCostUSD: calculateTokenCost(model, resolvedUsage.inputTokens, resolvedUsage.outputTokens),
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

    if (htmlPilotClaim && aiResult.success && aiResult.output) {
        const { prepared, claim } = htmlPilotClaim;
        // A source that the exact job verifier cannot render must not receive a signed pilot outcome.
        if (!renderLockedHtmlPilotSource(aiResult.output, prepared.parentRunId)) {
            return NextResponse.json({ success: false, error: 'PILOT_OUTPUT_FORMAT_REFUSED_NO_RESEND' }, { status: 422 });
        }
        const secret = process.env.CVF_RECEIPT_HMAC_SECRET ?? process.env.CVF_AUDIT_SIGNING_KEY ?? '';
        if (aiResult.model !== prepared.profile.model) {
            return NextResponse.json({ success: false, error: 'PILOT_ACTUAL_MODEL_MISMATCH' }, { status: 503 });
        }
        const routeElapsedMs = Math.max(0, performance.now() - routeStartedMonotonicMs);
        governanceEvidenceReceipt.htmlPilotTiming = { schema: 'cvf.htmlPilotTiming.v1', providerAwaitMs: pilotProviderElapsedMs,
            localGovernanceMs: Math.max(0, routeElapsedMs - pilotProviderElapsedMs), routeElapsedMs };
        const { receiptIntegrity: _oldIntegrity, htmlPilotEvidence: _oldPilot, ...unsigned } = governanceEvidenceReceipt;
        void _oldIntegrity; void _oldPilot;
        governanceEvidenceReceipt.receiptIntegrity = buildReceiptIntegrityAnchor({ receipt: unsigned,
            signingSecret: secret, externalAnchorId: process.env.CVF_RECEIPT_EXTERNAL_ANCHOR_ID,
            externalAnchorUrl: process.env.CVF_RECEIPT_EXTERNAL_ANCHOR_URL });
        const evidence = issueHtmlExecutionEvidence({ owner: prepared.owner, operationKey: prepared.operationKey,
            requestSha256: prepared.requestSha256, runId: claim.runId, rootRunId: prepared.rootRunId ?? claim.runId,
            parentRunId: prepared.parentRunId, parentOutputSha256: prepared.parentOutputSha256,
            htmlJobId: prepared.htmlJobId, receipt: governanceEvidenceReceipt, output: aiResult.output,
            provider: routedProvider, model: aiResult.model, profileDigest: prepared.profile.manifestSha256, secret });
        if (!evidence || !(await prepared.ledger.saveOutcome(claim, evidence.outputSha256, htmlPilotRequestSha256(evidence)))) {
            return NextResponse.json({ success: false, error: 'PILOT_SIGNED_OUTCOME_UNAVAILABLE_NO_RESEND' }, { status: 503 });
        }
        governanceEvidenceReceipt.htmlPilotEvidence = evidence;
    }

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
                ...(outputValidation.wordLimit ? { wordLimit: outputValidation.wordLimit } : {}),
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

/**
 * Common error response owner; cancellation keeps the exact admitted ledger. When a lineage envelope already holds
 * reserved ordinals, prior history is retained and the envelope is finalized (or the 503 uncertainty contract applies).
 */
export async function buildExecuteRouteFailure(error: unknown, ledgerForCatch: ProviderAttemptLedger | undefined,
    signal: AbortSignal | undefined, provider: string, model: string | undefined, lineage?: RouteLineageTracker): Promise<Response> {
        if (signal?.aborted) {
            const ledger = ledgerForCatch ?? createProviderAttemptLedger({ identityKind: 'service', identityHash: 'pre-admission-cancelled', providerModel: `${provider}:${model ?? 'default'}` });
            const cancelled = buildProviderRequestCancelledResponse({ ledger,
                routedProvider: provider, requestedModel: model });
            return lineage ? lineage.conclude(cancelled, 'CANCELLED') : cancelled;
        }
        if (error instanceof InvalidRequestBodyEncodingError) {
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        console.error('Execute API error:', error);
        // F01: carry reconciliation evidence here too when admission had
        // already started; omit it when the error predates admission.
        const catchReconciliation = ledgerForCatch
            ? buildProviderAttemptReconciliation(ledgerForCatch, 'unknown', 'unknown')
            : undefined;
        const failure = NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
                provider: 'unknown',
                model: 'unknown',
                ...(catchReconciliation ? { providerAttemptReconciliation: catchReconciliation } : {}),
            },
            { status: 500 },
        );
        return lineage ? lineage.conclude(failure, 'FAILED') : failure;
}

// -- T3 attempt lineage orchestration ------------------------------------------------------------------------------------
// The journal is synchronous SQLite. Each journal operation therefore runs in its own macrotask (see yieldToEventLoop),
// reserve happens before port entry, settle happens before any retry or response, and finalize happens before the response.

export const WEB_LINEAGE_CONTRACT_REVISION = 'cvf.webAttemptLineage.t3.v1';
export const WEB_LINEAGE_SOURCE_REVISION = 'cvf-web.execute-route.t3-source.20261112';
const LINEAGE_NO_STORE = { 'Cache-Control': 'no-store' };
const LINEAGE_NO_RESEND_NOTICE = 'No automatic resend occurs. Submitting this request again creates a new execution that may call and charge the provider again.';
const LINEAGE_SETTLEMENT_UNCERTAIN_MESSAGE = 'The execution result could not be confirmed in the attempt lineage journal, so the result is withheld. '
    + 'The provider may have completed and charged for this request, and resubmitting may duplicate the effect. No automatic retry will be made.';

// -- Governance references for the lineage terminal ----------------------------------------------------------------------
// Only stable, non-secret projections are hashed: decisions, guard ids, SOT3 ids and counts. Never prompts, chunk text,
// provider payloads or timestamps. SOT3 detailed evidence stays owned by SOT3; the lineage holds a reference only.

const sha256Prefix = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 24);
const safeToken = (value: unknown): string | null => typeof value === 'string' && /^[A-Za-z0-9_-]{1,32}$/.test(value) ? value : null;
const boundedText = (value: unknown): string | null => typeof value === 'string' ? value.slice(0, 120) : null;
const boundedTexts = (value: unknown): string[] => Array.isArray(value) ? value.slice(0, 64).map(item => boundedText(item) ?? '') : [];

/**
 * `guard:<finalDecision>:<sha256-24>` over the actual pipeline decision (canonicalId, requestId, decision, blockedBy/escalatedBy, per-guard
 * id/decision/severity). Returns null when no well-formed Guard decision exists, so the journal keeps GUARD_NOT_RECORDED.
 */
export function buildGuardLineageRef(guardResult: unknown, canonicalId: string): string | null {
    try {
        const guard = guardResult as Partial<GuardPipelineResult> | null | undefined;
        if (!guard || typeof guard !== 'object' || typeof canonicalId !== 'string' || !canonicalId) return null;
        const decision = safeToken(guard.finalDecision);
        if (decision === null || !Array.isArray(guard.results)) return null;
        const results = guard.results.slice(0, 64).map(result => [boundedText(result?.guardId), safeToken(result?.decision), safeToken(result?.severity)]);
        // The server canonicalId is mixed in because the client-supplied guard requestId can collide across requests.
        return `guard:${decision.toLowerCase()}:${sha256Prefix({ canonicalId, requestId: boundedText(guard.requestId), decision, blockedBy: boundedText(guard.blockedBy), escalatedBy: boundedText(guard.escalatedBy), results })}`;
    } catch {
        return null;
    }
}

export type SotKnowledgeForLineage = Pick<KnowledgeContextResult, 'retrievalResult' | 'knowledgeInjected' | 'knowledgeSource' | 'requestedKnowledgeCollectionId' | 'sot3' | 'sot3Evidence'>;

const SOT3_EVIDENCE_DURABLE = new Set(['PERSISTED', 'DUPLICATE_NOOP']);
const RECORD_REF_RE = /^[a-zA-Z0-9._:/-]{1,120}$/;

/**
 * SOT3 governance reference. SOT3 owns the detailed evidence; the lineage only points at it:
 * - SOT3 activation evaluated AND its evidence record is durable (PERSISTED or DUPLICATE_NOOP):
 *   `sot3:<mode>-<terminalOutcome>:<evidence recordId>` (the dereferenceable SOT3 record id, e.g. `SOT3EV-<hex32>`), falling
 *   back to a 24-hex digest of the SOT3 ids and retrieval counts when the record id is unusable as a reference. The mode is part
 *   of the visible token (`shadow-approved` vs `enforce-approved`) because SHADOW does not gate injection, so a SHADOW record must
 *   never read as an enforced decision; a gap on every SHADOW run would be noise, and the token is visible wherever the ref is.
 * - SOT3 evaluated but evidence not durable (ENFORCE persistence failure, SHADOW persist failure or unknown): no ref, so
 *   SOT3_NOT_RECORDED stays, plus the named gap SOT3_EVIDENCE_NOT_PERSISTED.
 * - Nothing requested, retrieved or injected: the declared `sot3:none:no_knowledge_retrieval`. SOT3 scope is knowledge retrieval
 *   only; it says nothing about durable or AIF memory context (see MEMORY_CONTEXT_INJECTED).
 * - Knowledge requested/retrieved/injected but SOT3 activation OFF: no ref plus the named gap SOT3_ACTIVATION_OFF.
 * - SHADOW rejected (observe-only, the request still ran on ordinary context): the ref above reads `sot3:shadow-rejected:<recordId>`
 *   and `buildGovernanceLineageRefs` adds the named gap SOT3_SHADOW_REJECTED, so a rejection never hides behind a successful run.
 *   An explicitly requested collection with no governed context in SHADOW (which ENFORCE would 409) adds SOT3_SHADOW_NO_CONTEXT.
 */
export function buildSot3LineageRef(knowledge: SotKnowledgeForLineage | null | undefined): { ref: string | null; gap: string | null } {
    if (!knowledge?.retrievalResult) return { ref: null, gap: null };
    const { sot3, retrievalResult: retrieval } = knowledge;
    if (sot3) {
        const evidence = knowledge.sot3Evidence;
        if (!evidence || !SOT3_EVIDENCE_DURABLE.has(evidence.diagnosticClass)) return { ref: null, gap: 'SOT3_EVIDENCE_NOT_PERSISTED' };
        const mode = safeToken(sot3.mode)?.toLowerCase() ?? 'unknown';
        const outcome = safeToken(sot3.terminalOutcome)?.toLowerCase() ?? 'unknown';
        const prefix = `sot3:${mode}-${outcome}:`;
        if (typeof evidence.recordId === 'string' && RECORD_REF_RE.test(prefix + evidence.recordId)) return { ref: prefix + evidence.recordId, gap: null };
        return { ref: prefix + sha256Prefix({
            mode: sot3.mode, outcome: sot3.terminalOutcome, injectionPermitted: sot3.injectionPermitted, failureStage: sot3.failureStage,
            refineryStatus: sot3.refineryStatus, kernelDecision: sot3.kernelDecision, flowAcknowledgementState: sot3.flowAcknowledgementState,
            refineryPacketIds: boundedTexts(sot3.refineryPacketIds), kernelDecisionIds: boundedTexts(sot3.kernelDecisionIds),
            truthReferenceIds: boundedTexts(sot3.truthReferenceIds), flowPackageIds: boundedTexts(sot3.flowPackageIds),
            source: knowledge.knowledgeSource, injected: knowledge.knowledgeInjected, requested: boundedText(knowledge.requestedKnowledgeCollectionId),
            matched: retrieval.matchedChunkCount, allowed: retrieval.allowedChunkCount, dropped: retrieval.droppedChunkCount,
            allowedCollections: boundedTexts(retrieval.allowedCollectionIds), droppedCollections: boundedTexts(retrieval.droppedCollectionIds),
            chunkIds: Array.isArray(retrieval.chunks) ? retrieval.chunks.slice(0, 64).map(chunk => [boundedText(chunk?.collectionId), boundedText(chunk?.id)]) : [],
        }), gap: null };
    }
    const applicable = knowledge.knowledgeInjected || knowledge.requestedKnowledgeCollectionId !== null || retrieval.matchedChunkCount > 0;
    return applicable ? { ref: null, gap: 'SOT3_ACTIVATION_OFF' } : { ref: 'sot3:none:no_knowledge_retrieval', gap: null };
}

export type RouteGovernanceRefs = { guardRef: string | null; sot3Ref: string | null; namedGaps: string[] };

/**
 * Pure builder of the references the tracker passes to finalize. It never throws: any failure degrades to null refs (journal
 * gaps), so a builder defect cannot turn into a journal-not-ready or settlement-uncertain response.
 */
export function buildGovernanceLineageRefs(input: {
    canonicalId: string; guardResult?: unknown; knowledge?: SotKnowledgeForLineage | null; memoryContextInjected?: boolean;
}): RouteGovernanceRefs {
    try {
        const sot3 = buildSot3LineageRef(input.knowledge);
        const shadowRejected = input.knowledge?.sot3?.mode === 'SHADOW' && input.knowledge.sot3.terminalOutcome === 'REJECTED';
        // ENFORCE would 409 an explicitly requested collection that yields no governed context; SHADOW lets it run, so name it.
        const shadowNoContext = input.knowledge?.sot3?.mode === 'SHADOW' && input.knowledge.sot3.terminalOutcome === 'NO_CONTEXT'
            && input.knowledge.requestedKnowledgeCollectionId !== null;
        const namedGaps = [...(sot3.gap ? [sot3.gap] : []), ...(shadowRejected ? ['SOT3_SHADOW_REJECTED'] : []),
            ...(shadowNoContext ? ['SOT3_SHADOW_NO_CONTEXT'] : []),
            ...(input.memoryContextInjected === true ? ['MEMORY_CONTEXT_INJECTED'] : [])].slice(0, 4);
        return { guardRef: buildGuardLineageRef(input.guardResult, input.canonicalId), sot3Ref: sot3.ref, namedGaps };
    } catch {
        return { guardRef: null, sot3Ref: null, namedGaps: [] };
    }
}

export type LineageDisposition = 'COMPLETED' | 'VALIDATION_FAILED' | 'DENIED' | 'CANCELLED' | 'EXHAUSTED' | 'FAILED';

/** One real macrotask boundary, so no two synchronous journal transactions run in the same event-loop turn. */
export function yieldToEventLoop(): Promise<void> {
    return new Promise<void>(resolve => setImmediate(resolve));
}

/** Maps a journal failure that occurred before port entry. Never carries Retry-After. */
function journalPortNotEnteredResponse(failure: Pick<LineageFailure, 'code'> & Partial<Pick<LineageFailure, 'reason'>>): NextResponse {
    let status = 503;
    let code = 'JOURNAL_UNAVAILABLE';
    let error = 'The attempt lineage journal is unavailable. No provider call was made for this step.';
    if (failure.reason === 'HELD_RELEASED' || failure.reason === 'EXECUTION_DEADLINE_EXCEEDED') {
        return NextResponse.json({ success: false, code: failure.reason, error: 'This step was not admitted. No provider call was made for this step.' }, { status: 409, headers: LINEAGE_NO_STORE });
    }
    if (failure.reason === 'ADMISSION_STOPPED' || failure.reason === 'ADMISSION_CONFLICT') {
        status = 409;
        code = failure.reason;
        error = 'New admission is stopped or another execution remains active. No provider call was made for this step.';
    } else if (failure.reason === 'CONTROL_MIGRATION_REQUIRED') {
        code = 'CONTROL_MIGRATION_REQUIRED';
    } else if (failure.reason === 'ADMISSION_CAPACITY') {
        code = 'ADMISSION_CAPACITY';
    } else if (failure.code === 'COMMIT_UNKNOWN') {
        code = 'JOURNAL_COMMIT_UNKNOWN';
    } else if (failure.code === 'UNQUALIFIED' || failure.code === 'NOT_READY') {
        code = 'JOURNAL_NOT_READY';
        error = 'The attempt lineage journal is not ready for this deployment or identity. The request was not executed and no provider call was made.';
    } else if (failure.code === 'CAPACITY') {
        status = 429;
        code = 'JOURNAL_TENANT_CAPACITY';
        error = 'The attempt lineage capacity for this tenant is exhausted. No provider call was made for this step.';
    } else if (failure.code === 'BUSY') {
        code = 'JOURNAL_BUSY';
        error = 'The attempt lineage journal is busy. No provider call was made for this step.';
    }
    return NextResponse.json({ success: false, code, error }, { status, headers: LINEAGE_NO_STORE });
}

export class RouteLineageTracker {
    private entries: CanonicalLineageHistoryEntry[] = [];
    private finalized = false;
    private uncertain = false;
    private lastView: SafeLineageView | undefined;
    private latestEvidence: CanonicalGatewayEvidence | undefined;
    private governance: RouteGovernanceRefs = { guardRef: null, sot3Ref: null, namedGaps: [] };

    constructor(private readonly config: LineageConfig, private readonly identity: LineageIdentity, private readonly ref: LineageRef) {}

    get canonicalId(): string {
        return this.ref.canonicalId;
    }

    beforeProviderCall(ordinal: number): Response | null {
        const result = this.attempt(() => admitProviderCall(this.config, this.identity, this.ref, ordinal));
        if (!result.ok) return journalPortNotEnteredResponse(result);
        this.adoptView(result.value);
        return null;
    }

    /** Record the Guard/SOT3 references established before the terminal. Anything never recorded stays a journal gap. */
    recordGovernanceRefs(refs: Partial<RouteGovernanceRefs>): void {
        this.governance = {
            guardRef: refs.guardRef !== undefined ? refs.guardRef : this.governance.guardRef,
            sot3Ref: refs.sot3Ref !== undefined ? refs.sot3Ref : this.governance.sot3Ref,
            namedGaps: (refs.namedGaps !== undefined ? [...refs.namedGaps] : this.governance.namedGaps).slice(0, 4),
        };
    }

    /** Server-owned verified tuple only; never sourced from the request body. */
    get verifiedOwnerHash(): string {
        return createHash('sha256').update(JSON.stringify([this.identity.tenantId, this.identity.owner])).digest('hex');
    }

    /** Journal functions report failures as results; this guard also turns an unexpected throw into UNAVAILABLE. */
    private attempt<T>(operation: () => LineageResult<T>): LineageResult<T> {
        try {
            return operation();
        } catch {
            return { ok: false, code: 'UNAVAILABLE', reason: 'INTERNAL_ERROR' };
        }
    }

    private evidence(recordingStatus: 'RECORDED' | 'UNCONFIRMED', durable: boolean): CanonicalLineageEvidence {
        return {
            canonicalId: this.ref.canonicalId, recordingStatus, automaticRetryAllowed: false,
            history: this.entries.map(entry => ({ ...entry, durable: durable && entry.durable })),
            ...(durable ? {} : { durable: false }),
            notice: LINEAGE_NO_RESEND_NOTICE,
        };
    }

    /** 503 JOURNAL_SETTLEMENT_UNCERTAIN: bounded safe in-memory evidence only, never AI output, no Retry-After. */
    private uncertaintyResponse(): NextResponse {
        const body: CanonicalLineageSettlementUncertainResponse = {
            success: false, code: 'JOURNAL_SETTLEMENT_UNCERTAIN', error: LINEAGE_SETTLEMENT_UNCERTAIN_MESSAGE,
            recordingStatus: 'UNCONFIRMED', providerContact: 'POSSIBLE_OR_OBSERVED', automaticRetryAllowed: false,
            canonicalId: this.ref.canonicalId, canonicalLineage: this.evidence('UNCONFIRMED', false),
        };
        return NextResponse.json(body, { status: 503, headers: LINEAGE_NO_STORE });
    }

    private adoptView(view: SafeLineageView): void {
        this.lastView = view;
        this.entries = view.history.map(entry => ({
            ordinal: entry.ordinal, state: entry.state, durable: true, reservedAt: entry.reservedAt,
            settledAt: entry.settledAt, join: entry.join, observation: entry.observation,
        }));
    }

    /** Reserve the next ordinal before port entry. A failure means the port must not be entered for this call. */
    async reserveNext(): Promise<{ ordinal: number } | { response: Response }> {
        await yieldToEventLoop();
        const result = this.attempt(() => reserveLineage(this.config, this.identity, { ...this.ref }));
        if (!result.ok) {
            const failure = journalPortNotEnteredResponse(result);
            // Prior ordinals were already settled: keep their history and finalize the envelope as FAILED.
            return { response: this.entries.length > 0 ? await this.conclude(failure, 'FAILED') : failure };
        }
        this.entries.push({ ordinal: result.value.ordinal, state: 'PORT_PENDING', durable: true, observation: null });
        return { ordinal: result.value.ordinal };
    }

    /**
     * Settle the ordinal after the port returned (including denied or failed outcomes). Returns null when committed, or the
     * 503 uncertainty response; the caller must then stop retrying and return that response.
     */
    async settleNext(ordinal: number, evidence: CanonicalGatewayEvidence | undefined, callbackAttemptIndex: number | null): Promise<Response | null> {
        if (evidence) this.latestEvidence = evidence;
        await yieldToEventLoop();
        const raw = observationFromCanonicalEvidence(evidence, { callbackAttemptIndex });
        const result = this.attempt(() => settleLineage(this.config, this.identity, this.ref, ordinal, raw));
        if (result.ok) {
            this.adoptView(result.value.view);
            return null;
        }
        const entry = this.entries.find(candidate => candidate.ordinal === ordinal);
        if (entry) Object.assign(entry, { state: 'SETTLED', durable: false, observation: projectObservation(raw) });
        this.uncertain = true;
        return this.uncertaintyResponse();
    }

    /**
     * Finalize the envelope, then attach `canonicalLineage` (and the latest `canonicalGateway`) to the response body.
     * Finalize failure or ambiguity replaces the response with the 503 uncertainty contract. With no reserved ordinal
     * nothing was recorded and the response is returned unchanged.
     */
    async conclude(response: Response, disposition?: LineageDisposition): Promise<Response> {
        if (this.uncertain) return this.uncertaintyResponse();
        if (this.entries.length === 0) return response;
        let data: Record<string, unknown> | null = null;
        try {
            data = await response.clone().json() as Record<string, unknown>;
        } catch {
            data = null;
        }
        if (!this.finalized) {
            const receipt = data?.governanceEvidenceReceipt as { receiptId?: unknown } | undefined;
            const receiptId = typeof receipt?.receiptId === 'string' ? receipt.receiptId : null;
            await yieldToEventLoop();
            const result = this.attempt(() => finalizeLineage(this.config, this.identity, this.ref, {
                disposition: disposition ?? (data?.success === true ? 'COMPLETED' : 'FAILED'),
                auditRef: receiptId, validationRef: data?.outputValidation && receiptId ? receiptId : null,
                // The terminal response's own Guard decision (e.g. an output-bypass block) wins over the pre-provider one.
                guardRef: buildGuardLineageRef(data?.guardResult, this.ref.canonicalId) ?? this.governance.guardRef,
                sot3Ref: this.governance.sot3Ref, namedGaps: this.governance.namedGaps,
            }));
            if (!result.ok) {
                this.uncertain = true;
                return this.uncertaintyResponse();
            }
            this.finalized = true;
            this.adoptView(result.value.view);
        }
        if (!data) return response;
        const recorded = this.lastView?.recordingStatus === 'CONFIRMED';
        const headers = new Headers(response.headers);
        headers.delete('content-length');
        return NextResponse.json({
            ...data,
            ...(data.canonicalGateway === undefined && this.latestEvidence ? { canonicalGateway: this.latestEvidence } : {}),
            canonicalLineage: this.evidence(recorded ? 'RECORDED' : 'UNCONFIRMED', true),
        }, { status: response.status, headers });
    }
}

/**
 * Resolves journal readiness and the verified identity (session provenance, else the signed service request) before any
 * port entry. Missing or invalid configuration, unqualified identity or an unmapped service principal returns 503
 * JOURNAL_NOT_READY. Store/schema readiness is confirmed by the first reserve, which also precedes port entry.
 */
export async function resolveRouteLineage(input: {
    request: Request; session: SessionCookie | null; isServiceAllowed: boolean; canonicalId: string;
    /** Guard and SOT3 outcomes already established for this request; absent means they stay journal gaps. */
    governance?: { guardResult?: unknown; knowledge?: SotKnowledgeForLineage | null; memoryContextInjected?: boolean };
}): Promise<{ tracker: RouteLineageTracker } | { response: Response }> {
    const notReady = { response: journalPortNotEnteredResponse({ code: 'NOT_READY' }) };
    try {
        const configResult = loadLineageConfig();
        if (!configResult.ok) return notReady;
        let identity: LineageResult<LineageIdentity>;
        if (input.session) {
            const provenance = await resolveVerifiedSessionProvenance(input.request);
            if (!provenance?.qualified) return notReady;
            identity = resolveSessionIdentity(configResult.value, provenance);
        } else if (input.isServiceAllowed) identity = resolveServiceIdentity(configResult.value, true);
        else return notReady;
        if (!identity.ok) return notReady;
        const ref: LineageRef = { canonicalId: input.canonicalId, contractRevision: WEB_LINEAGE_CONTRACT_REVISION, sourceRevision: WEB_LINEAGE_SOURCE_REVISION };
        const tracker = new RouteLineageTracker(configResult.value, identity.value, ref);
        if (input.governance) tracker.recordGovernanceRefs(buildGovernanceLineageRefs({ ...input.governance, canonicalId: input.canonicalId }));
        return { tracker };
    } catch {
        return notReady;
    }
}
