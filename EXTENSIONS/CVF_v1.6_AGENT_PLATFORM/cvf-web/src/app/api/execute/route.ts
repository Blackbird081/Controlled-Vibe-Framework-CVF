import { isClaudeSubscriptionMode, resolveClaudeSubscriptionModel } from '@/lib/server/claude-cli-profile';
import { originalBrief, parseExplicitWordLimit } from '@/lib/pack-content-constraints';
import { buildDlpRedactedReadoutRequest } from './route-dlp-readout';
import { createMaoCanonicalSingleWorker, resolveMaoRisk, MAO_SINGLE_WORKER_ENV } from '@/lib/server/mao-canonical-single-worker';
import { createMaoCanonicalRolePlan, deniedAttemptFact, rolePlanFailureEvidence, maoRolePlanConfigConflict, maoRolePlanQuotaTooLow, maoRolePlanReviewerModelUnfit, MAO_ROLE_PLAN_ENV, ROLE_PLAN_FIT_REVIEWER_MODEL } from '@/lib/server/mao-canonical-role-plan';
import { NextRequest, NextResponse } from 'next/server';
import { readBoundedRequestBody } from '@/lib/bounded-request-body';
import { validateExecuteRequestShape } from '@/lib/execute-request-validation';
import type { AIProvider, CanonicalGatewayEvidence, ExecutionRequest, ExecutionResponse } from '@/lib/ai/types';
import { evaluateEnforcement } from '@/lib/enforcement';
import { getTemplateById } from '@/lib/templates';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { applySafetyFilters } from '@/lib/safety';
import { runSafetyWorkflowChain } from '@/lib/safety-workflow-chain';
import { getRateLimiter } from '@/lib/rate-limit';
import { checkBudget } from '@/lib/budget';
import { buildWebGuardContext, type GuardPipelineResult } from '@/lib/guard-runtime-adapter';
import { runExecuteRouteMandatoryGateway } from '@/lib/route-guard-gateway';
import { validateOutput, shouldRetry, type ValidationResult, type RetryState } from '@/lib/output-validator';
import { routeWebProvider } from '@/lib/ai/provider-router-adapter';
import { lookupGuidedResponse } from './guided.response.registry';
import { buildExecutionPrompt, resolveResponseLanguage } from '@/lib/execute-prompt-contract';
import { checkTeamQuota } from '@/lib/quota-guard';
import { appendAuditEvent } from '@/lib/control-plane-events';
import { applyDLPFilter } from '@/lib/dlp-filter';
import { withSessionAuditPayload } from '@/lib/middleware-auth';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';
import { resolveOpenAIApiKey } from '@/lib/openai-env';
import { blockInlineKnowledgeContextBypass } from './route-knowledge-context';
import { resolveMemoryContext, selectKnowledgeContext, sot3RejectionResponse } from './route-context-selection';
import { buildEvidenceReceipt, buildGovernanceEnvelope } from '@/lib/web-governance-envelope';
import { deriveServiceTokenIdentity, verifyServiceTokenRequest } from '@/lib/service-token-auth';
import { resolveDurableMemoryPrincipal } from '@/lib/durable-memory-route';
import { hasValidationRetryBudget, resolveExecutionMaxTokens } from '@/lib/execute-route-budget';
import { recordReportableDecisionObserved } from '@/lib/false-positive-report';
import { resolveWorkflowBindingForExecution } from '@/lib/workflows/workflow-resolver';
import { buildRoleOutputDeniedResponse, buildRolePermissionDeniedResponse } from '@/lib/execute-role-permission-gate';
import { buildExecutionIdentityDecision } from '@/lib/execution-identity';
import { evaluateExecutionActorRoleGate, resolveExecutionCVFRole, resolveExecutionOutputClass } from '@/lib/execute-role-resolver';
import { buildOutputBypassGuardResult, checkRoleOutputPermission, detectBypassInOutput, resolveGuardAction, shouldRequireSkillPreflight } from '@/lib/execute-route-guards';
import { buildExecutionDiagnostic } from '@/lib/execution-diagnostics';
import { buildProviderAttemptDeniedResponse, buildProviderAttemptReconciliation, buildProviderRequestCancelledResponse, createProviderAttemptLedger } from '@/lib/provider-attempt-admission';
import type { ProviderAttemptLedger } from '@/lib/provider-attempt-admission';
import { CANONICAL_WEB_DEFAULT_MODEL, CANONICAL_WEB_OPENAI_DEFAULT_MODEL, CANONICAL_WEB_PROFILE_DENIED_MESSAGE, canonicalWebProfileDenied, canonicalWebExecutionResponse, canonicalWebSystemPrompt, createAlibabaCanonicalWebExecutor, createOpenAiCanonicalWebExecutor, createClaudeSubscriptionCanonicalWebExecutor, sot3CanonicalExecutionIdFanoutArg } from '@/lib/canonical-web-gateway-execution';
import { getApprovalStore } from '../approvals/store';
import { buildApprovalActorBinding, buildApprovalRequestSnapshot, computeApprovalRequestHash } from '../approvals/approval-binding';
import { buildExecuteFinalResponse, buildOutputValidationExhaustedResponse, buildExecuteRouteFailure, resolveRouteLineage, type RouteLineageTracker } from './route-final-response';
import { routingGateResponse, routedProviderMismatchResponse, routedProviderPreflightResponse, maoFailureResponse, withRolePlanFailureEvidence } from './route-provider-routing';
import { buildMemoryAdvisoryReadout } from './route-memory-advisory';
import { buildGovernedStopOutput } from './route-governed-stop-output';
import { htmlPilotDisclosureGet } from './route-html-pilot';
import { buildExecuteTraceHash, hasExpiredExecuteApproval, loadExecuteApproval, resolveExecuteGovernanceAuthority } from './route-governance-authority';

export async function GET(request: NextRequest) {
    return htmlPilotDisclosureGet(request);
}

export async function POST(request: NextRequest) {
    const routeStartedAtMs = Date.now();
    const routeStartedMonotonicMs = performance.now();
    // F01: hoisted so the outer catch can carry reconciliation evidence too.
    let providerAttemptLedgerForCatch: ProviderAttemptLedger | undefined;
    let selectedCancellationSignalForCatch: AbortSignal | undefined;
    let selectedProviderForCatch = 'alibaba';
    let selectedModelForCatch: string | undefined;
    let lineageForCatch: RouteLineageTracker | undefined;
    try {
        const rawBodyText = await readBoundedRequestBody(request, 16 * 1024 * 1024);
        if (rawBodyText === null) return NextResponse.json({ success: false, error: 'Execution request body exceeds 16 MiB limit.' }, { status: 413 });
        let rawBody: unknown;
        try {
            rawBody = JSON.parse(rawBodyText);
        } catch {
            return NextResponse.json({ success: false, error: 'Invalid input payload.' }, { status: 400 });
        }
        // AuthN: allow either session cookie or service token
        const session = await verifySessionCookie(request);
        const serviceToken = request.headers.get('x-cvf-service-token');
        const configuredServiceToken = process.env.CVF_SERVICE_TOKEN;
        const serviceIdentity = serviceToken ? deriveServiceTokenIdentity(serviceToken) : null;
        const isServiceAllowed = verifyServiceTokenRequest({
            configuredToken: configuredServiceToken,
            presentedToken: serviceToken,
            signature: request.headers.get('x-cvf-service-signature'),
            timestamp: request.headers.get('x-cvf-service-timestamp'),
            body: rawBodyText,
        });
        if (!session && !isServiceAllowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: serviceToken ? 'Unauthorized: invalid service token or signature.' : 'Unauthorized: please login.',
                },
                { status: 401 }
            );
        }
        if (maoRolePlanConfigConflict()) return NextResponse.json({ success: false, code: 'MAO_CONFIG_CONFLICT', error: 'The single-worker and role-plan lanes cannot both be enabled.' }, { status: 503 });
        if (maoRolePlanQuotaTooLow()) return NextResponse.json({ success: false, code: 'MAO_CONFIG_QUOTA_TOO_LOW', error: 'The role plan needs a provider quota of at least 4 calls per minute.' }, { status: 503 });
        const shapeError = validateExecuteRequestShape(rawBody);
        if (shapeError) return NextResponse.json({ success: false, error: shapeError, diagnostic: buildExecutionDiagnostic({ stage: 'request_validation', class: 'invalid_input', httpStatus: 400 }) }, { status: 400 });
        const body = { ...(rawBody as Partial<ExecutionRequest>) };
        body.inputs = Object.fromEntries(Object.entries(body.inputs || {}).map(([k, v]) => [k, String(v ?? '').trim()]));
        if (typeof body.model === 'string') body.model = body.model.trim() || undefined;
        if (canonicalWebProfileDenied(body, process.env.DEFAULT_AI_PROVIDER)) {
            return NextResponse.json({ success: false, error: CANONICAL_WEB_PROFILE_DENIED_MESSAGE }, { status: 403 });
        }
        const nativeClaude = (body.provider || process.env.DEFAULT_AI_PROVIDER) === 'claude' && isClaudeSubscriptionMode();
        if (nativeClaude) {
            try { body.model = resolveClaudeSubscriptionModel(body.model); } catch { return NextResponse.json({ success: false, error: 'Only the sonnet subscription alias is supported.', code: 'CLAUDE_NATIVE_MODEL_UNSUPPORTED' }, { status: 400 }); }
            if (process.env[MAO_SINGLE_WORKER_ENV] !== '1' || !process.env.CVF_MAO_DURABLE_RUN_PATH) return NextResponse.json({ success: false, code: 'CLAUDE_NATIVE_NOT_READY', error: 'Subscription execution requires the configured MAO lane.' }, { status: 503 });
        }
        selectedCancellationSignalForCatch = request.signal;
        selectedModelForCatch = body.model;
        // Rate limit by session + IP (after provider known)
        const limiter = getRateLimiter();
        const limitIdentity = session?.userId
            ?? session?.user
            ?? (serviceIdentity || 'service');
        const limitResult = await limiter.consume(request, limitIdentity, body.provider);
        if (!limitResult.allowed) {
            return NextResponse.json(
                { success: false, error: 'Too many requests. Please slow down.', retryAfterSeconds: limitResult.retryAfterSeconds,
                    diagnostic: buildExecutionDiagnostic({ stage: 'rate_limit', class: 'rate_limited', httpStatus: 429 }) },
                { status: 429, headers: { 'Retry-After': String(limitResult.retryAfterSeconds) } }
            );
        }
        // Validate required fields
        if (!body.templateName || !body.inputs || !body.intent) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: templateName, inputs, intent',
                    diagnostic: buildExecutionDiagnostic({ stage: 'request_validation', class: 'invalid_input', httpStatus: 400 }),
                },
                { status: 400 }
            );
        }
        // Get provider config from environment or request
        const provider: AIProvider = body.provider ||
            (process.env.DEFAULT_AI_PROVIDER as AIProvider) || 'openai';
        const approvalActor = buildApprovalActorBinding({
            session,
            serviceIdentity: isServiceAllowed ? serviceIdentity : null,
        });
        const approvalSnapshot = buildApprovalRequestSnapshot(body, provider, approvalActor);
        const approvalRequestHash = computeApprovalRequestHash(approvalSnapshot);
        const authority = resolveExecuteGovernanceAuthority(body);
        body.cvfPhase = authority.phase;
        body.cvfRiskLevel = authority.riskLevel;
        const govEnvelope = buildGovernanceEnvelope({
            routeId: '/api/execute',
            surfaceClass: 'governance-execution',
            evidenceMode: 'live',
            actorId: session?.userId ?? (isServiceAllowed ? 'service-account' : null),
            actorRole: session?.role ?? (isServiceAllowed ? 'service' : null),
            phase: authority.phase,
            riskLevel: authority.riskLevel,
        });
        const inlineKnowledgeContextBlockResponse = await blockInlineKnowledgeContextBypass({ session, isServiceAllowed, knowledgeContext: body.knowledgeContext, templateLabel: body.templateName || body.templateId || 'unknown-template', riskLevel: authority.riskLevel, phase: authority.phase });
        if (inlineKnowledgeContextBlockResponse) return inlineKnowledgeContextBlockResponse;
        const approval = loadExecuteApproval(body.approvalId, approvalActor, approvalRequestHash, authority);
        if (approval instanceof Response) return approval;
        const approvedRequestRecord = approval;
        // Get API key from environment
        const apiKeyMap: Record<AIProvider, string | undefined> = {
            openai: resolveOpenAIApiKey(),
            claude: process.env.ANTHROPIC_API_KEY,
            gemini: process.env.GOOGLE_AI_API_KEY,
            alibaba: resolveAlibabaApiKey(),
            openrouter: process.env.OPENROUTER_API_KEY,
            deepseek: process.env.DEEPSEEK_API_KEY,
        };
        // Build the prompt from template inputs
        const userPrompt = buildExecutionPrompt(body as ExecutionRequest);
        const dlpResult = await applyDLPFilter(userPrompt);
        let filteredPrompt = dlpResult.redacted;
        const readoutRequest = await buildDlpRedactedReadoutRequest(body, dlpResult.wasRedacted);
        if (dlpResult.wasRedacted) {
            await appendAuditEvent({
                eventType: 'DLP_REDACTION_APPLIED',
                actorId: session?.userId ?? 'service-account',
                actorRole: session?.role ?? 'service',
                targetResource: body.templateName || body.templateId || 'unknown-template',
                action: 'EGRESS_FILTER',
                riskLevel: 'R2',
                phase: 'PHASE D',
                outcome: 'REDACTED',
                payload: withSessionAuditPayload(session, {
                    matchCount: dlpResult.matches.length,
                    patterns: dlpResult.matches.map(match => match.label),
                }),
            });
        }
        // SAF1: severity-classified safety workflow chain (ERH-SAF1)
        const saf1Result = runSafetyWorkflowChain(filteredPrompt);
        if (saf1Result.threats.length > 0) {
            await appendAuditEvent({
                eventType: 'SAFETY_WORKFLOW_CHAIN_TRIGGERED',
                actorId: session?.userId ?? 'service-account',
                actorRole: session?.role ?? 'service',
                targetResource: body.templateName || body.templateId || 'unknown-template',
                action: saf1Result.blocked ? 'BLOCK_EXECUTION_SAFETY' : 'SAFETY_STRIP_OR_LOG',
                riskLevel: saf1Result.highestSeverity === 'CRITICAL' ? 'R3'
                    : saf1Result.highestSeverity === 'HIGH' ? 'R2' : 'R1',
                phase: 'PHASE D',
                outcome: saf1Result.blocked ? 'BLOCKED' : 'SANITIZED',
                payload: withSessionAuditPayload(session, saf1Result.auditPayload),
            });
        }
        if (saf1Result.blocked) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Safety workflow chain blocked this request.',
                    details: saf1Result.threats.map(t => `${t.severity}: ${t.pattern}`),
                    provider,
                    model: 'blocked',
                },
                { status: 400 }
            );
        }
        filteredPrompt = saf1Result.sanitized;
        // Legacy safety filters (preserved for backward compatibility)
        const safety = applySafetyFilters(saf1Result.sanitized);
        if (safety.blocked) {
            const output = buildGovernedStopOutput({ decision: 'BLOCK', reason: safety.reason || 'Request blocked by safety filters.' });
            return NextResponse.json(
                {
                    success: false,
                    error: safety.reason || 'Request blocked by safety filters.',
                    output,
                    details: safety.details,
                    provider,
                    model: 'blocked',
                    governanceEvidenceReceipt: buildEvidenceReceipt({ envelope: govEnvelope, decision: 'BLOCK', riskLevel: body.cvfRiskLevel, provider, model: 'blocked' }),
                },
                { status: 400 }
            );
        }
        const quotaCheck = await checkTeamQuota(session?.teamId);
        if (quotaCheck.exceeded) {
            try {
                await appendAuditEvent({
                    eventType: 'QUOTA_HARD_CAP_BLOCKED',
                    actorId: session?.userId ?? 'service-account',
                    actorRole: session?.role ?? 'service',
                    targetResource: body.templateName || body.templateId || 'unknown-template',
                    action: 'BLOCK_EXECUTION_QUOTA',
                    riskLevel: 'R1',
                    phase: 'PHASE C',
                    outcome: 'BLOCKED',
                    payload: withSessionAuditPayload(session, {
                        teamId: quotaCheck.teamId,
                        currentUSD: quotaCheck.currentUSD,
                        hardCapUSD: quotaCheck.hardCapUSD,
                        period: quotaCheck.period,
                        billingWindowKey: quotaCheck.billingWindowKey,
                    }),
                });
            } catch (quotaAuditError) {
                console.warn('Quota block audit degraded:', quotaAuditError);
            }
            return NextResponse.json(
                {
                    success: false,
                    error: 'Team quota exceeded. Contact admin for override.',
                    quotaInfo: quotaCheck,
                },
                { status: 429 },
            );
        }
        const mode = body.mode || 'simple';
        const template = body.templateId ? getTemplateById(body.templateId) : undefined;
        const executionTemplateId = template?.id ?? body.templateId;
        const resolvedExecutionRole = resolveExecutionCVFRole(session, isServiceAllowed);
        const resolvedOutputClass = resolveExecutionOutputClass(executionTemplateId, template?.category, mode);
        const executionActorId = session?.userId ?? (isServiceAllowed ? 'service-account' : 'unknown-actor');
        const executionTargetResource = body.templateName || body.templateId || 'unknown-template';
        const executionIdentityBase = { actorId: executionActorId, sessionRole: session?.role ?? (isServiceAllowed ? 'service' : null), templateId: executionTemplateId, targetResource: executionTargetResource, resolvedRole: resolvedExecutionRole, resolvedOutputClass };
        if (!resolvedExecutionRole.allowed || !resolvedExecutionRole.permissionRole) {
            const executionIdentity = buildExecutionIdentityDecision(executionIdentityBase);
            return buildRolePermissionDeniedResponse({ session, body, provider, envelope: govEnvelope, resolvedRole: resolvedExecutionRole, resolvedOutputClass, executionIdentity });
        }
        const actorRoleGate = evaluateExecutionActorRoleGate(executionTemplateId, resolvedExecutionRole.role);
        if (!actorRoleGate.permitted) {
            const executionIdentity = buildExecutionIdentityDecision({ ...executionIdentityBase, actorRoleGate });
            await appendAuditEvent({ eventType: 'ACTOR_ROLE_GATE_REJECTED', actorId: executionActorId, actorRole: resolvedExecutionRole.role ?? 'unknown', targetResource: executionTargetResource, action: 'BLOCK_EXECUTION_ACTOR_ROLE', riskLevel: 'R1', phase: 'PHASE C', outcome: 'BLOCKED', payload: withSessionAuditPayload(session, { actor_role_gate_result: 'rejected', allowedActorRoles: actorRoleGate.allowedActorRoles, templateId: executionTemplateId, executionIdentity }) });
            return NextResponse.json({ success: false, error: 'actor_role_not_permitted', executionIdentity }, { status: 403 });
        }
        const rolePermission = checkRoleOutputPermission(
            resolvedExecutionRole.permissionRole,
            resolvedOutputClass.outputClass,
        );
        const executionIdentity = buildExecutionIdentityDecision({ ...executionIdentityBase, actorRoleGate, rolePermission });
        if (!rolePermission.allowed) {
            return buildRoleOutputDeniedResponse({ session, body, provider, envelope: govEnvelope, resolvedRole: resolvedExecutionRole, resolvedOutputClass, rolePermission, executionIdentity });
        }
        const workflowBinding = resolveWorkflowBindingForExecution(executionTemplateId);
        const specFields = template?.fields || [];
        const requiresSkillPreflight = shouldRequireSkillPreflight({
            phase: body.cvfPhase,
            // This registered artifact is an intake product brief, not a build result.
            templateCategory: template?.id === 'app_builder_complete' ? undefined : template?.category,
            intent: body.intent,
            templateId: template?.id ?? body.templateId,
        });
        const memoryAdvisoryReadout = authority.riskLevel === 'R4' ? undefined : buildMemoryAdvisoryReadout({ request: readoutRequest, actorRole: resolvedExecutionRole.role ?? 'unknown', actorId: session?.userId ?? (isServiceAllowed ? 'service-account' : 'unknown-actor'), sessionId: session?.userId ?? serviceIdentity ?? null });
        const enforcement = evaluateEnforcement({
            mode,
            content: filteredPrompt,
            riskText: authority.riskText,
            budgetOk: checkBudget(filteredPrompt),
            specFields: specFields.length ? specFields : undefined,
            specValues: body.inputs,
            cvfPhase: body.cvfPhase,
            cvfRiskLevel: body.cvfRiskLevel,
            memoryEligibility: memoryAdvisoryReadout?.eligibility,
            requiresSkillPreflight,
            skillPreflight: {
                passed: body.skillPreflightPassed,
                declaration: body.skillPreflightDeclaration,
                recordRef: body.skillPreflightRecordRef,
                skillIds: body.skillIds,
            },
        });

        if (enforcement.status === 'BLOCK' || authority.riskLevel === 'R4') {
            const guidedResponse = lookupGuidedResponse(userPrompt);
            const blockReason = enforcement.reasons.join(' | ')
                || (authority.riskLevel === 'R4' ? 'Risk level R4 is blocked by policy.' : 'Execution blocked by CVF policy.');
            const output = buildGovernedStopOutput({ decision: 'BLOCK', reason: blockReason, guidedResponse });
            const governanceEvidenceReceipt = buildEvidenceReceipt({
                envelope: govEnvelope,
                decision: 'BLOCK',
                riskLevel: authority.riskLevel,
                provider,
                model: 'blocked',
            });
            await recordReportableDecisionObserved({
                receipt: governanceEvidenceReceipt,
                templateId: body.templateId || body.templateName,
            });
            return NextResponse.json(
                {
                    success: false,
                    error: blockReason,
                    output,
                    provider,
                    model: 'blocked',
                    enforcement,
                    ...(guidedResponse ? { guidedResponse } : {}),
                    governanceEnvelope: govEnvelope,
                    policySnapshotId: govEnvelope.policySnapshotId,
                    governanceEvidenceReceipt,
                },
                { status: 400 }
            );
        }

        if (requiresSkillPreflight || resolvedOutputClass.outputClass === 'code_patch'
            || (body.fileScope?.length ?? 0) > 0) {
            return NextResponse.json({
                success: false,
                error: 'This request needs a server-authorized build phase. The current workflow is at intake.',
                governanceEnvelope: govEnvelope,
                policySnapshotId: govEnvelope.policySnapshotId,
            }, { status: 403 });
        }

        if (enforcement.status === 'CLARIFY') {
            const missing = enforcement.specGate?.missing?.map(field => field.label) || [];
            const output = buildGovernedStopOutput({ decision: 'CLARIFY', missing });
            const governanceEvidenceReceipt = buildEvidenceReceipt({
                envelope: govEnvelope,
                decision: enforcement.status,
                riskLevel: enforcement.riskGate?.riskLevel,
                provider,
                model: 'clarify',
            });
            await recordReportableDecisionObserved({
                receipt: governanceEvidenceReceipt,
                templateId: body.templateId || body.templateName,
            });
            return NextResponse.json(
                {
                    success: false,
                    error: 'Spec needs clarification before execution.',
                    output,
                    missing,
                    provider,
                    model: 'clarify',
                    enforcement,
                    governanceEnvelope: govEnvelope,
                    policySnapshotId: govEnvelope.policySnapshotId,
                    governanceEvidenceReceipt,
                },
                { status: 422 }
            );
        }

        if (enforcement.status === 'NEEDS_APPROVAL') {
            if (approvedRequestRecord) {
                if (getApprovalStore().get(approvedRequestRecord.id) !== approvedRequestRecord
                    || hasExpiredExecuteApproval(approvedRequestRecord)) {
                    return NextResponse.json({ success: false, error: 'Approval has expired, changed, or already been used.' }, { status: 409 });
                }
                getApprovalStore().delete(approvedRequestRecord.id);
                await appendAuditEvent({
                    eventType: 'APPROVAL_CONSUMED',
                    actorId: session?.userId ?? 'service-account',
                    actorRole: session?.role ?? 'service',
                    targetResource: body.templateName || body.templateId || 'unknown-template',
                    action: 'RESUME_EXECUTION',
                    riskLevel: body.cvfRiskLevel ?? approvedRequestRecord.riskLevel ?? 'R1',
                    phase: body.cvfPhase ?? approvedRequestRecord.phase,
                    outcome: 'APPROVED',
                    payload: withSessionAuditPayload(session, {
                        approvalId: approvedRequestRecord.id,
                        requestHash: approvedRequestRecord.requestHash,
                    }),
                });
            } else {
                const guidedResponse = lookupGuidedResponse(userPrompt);
                // CP9: Auto-create approval record so the user can track and resume post-approval
                const approvalId = `apr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
                const approvalReason = enforcement.reasons.join(' | ') || 'Human approval required before execution.';
                const output = buildGovernedStopOutput({ decision: 'NEEDS_APPROVAL', reason: approvalReason, approvalId, guidedResponse, userPrompt: body.intent });
                const approvalNow = new Date();
                getApprovalStore().set(approvalId, {
                    id: approvalId,
                    templateId: body.templateId || body.templateName || 'unknown',
                    templateName: body.templateName || body.templateId || 'unknown',
                    intent: body.intent!,
                    riskLevel: body.cvfRiskLevel,
                    phase: body.cvfPhase,
                    reason: enforcement.reasons.join(' | ') || 'Human approval required',
                    blockReason: enforcement.reasons.join(' | ') || 'NEEDS_APPROVAL',
                    requestContext: {
                        templateName: body.templateName,
                        intent: body.intent,
                        cvfPhase: body.cvfPhase,
                        cvfRiskLevel: body.cvfRiskLevel,
                        provider,
                        model: body.model,
                        policySnapshotId: govEnvelope.policySnapshotId,
                        envelopeId: govEnvelope.envelopeId,
                    },
                    requestHash: approvalRequestHash,
                    requestSnapshot: approvalSnapshot,
                    submittedByActorId: approvalActor?.actorId,
                    submittedByOrgId: approvalActor?.actorOrgId ?? null,
                    submittedByTeamId: approvalActor?.actorTeamId ?? null,
                    submittedByAuthMode: approvalActor?.actorAuthMode,
                    expiresAt: new Date(approvalNow.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                    status: 'pending',
                    submittedAt: approvalNow.toISOString(),
                });
                return NextResponse.json(
                    {
                        success: false,
                        error: approvalReason,
                        output,
                        provider,
                        model: 'approval-required',
                        enforcement,
                        ...(guidedResponse ? { guidedResponse } : {}),
                        approvalId,
                        approvalStatus: 'pending',
                        governanceEnvelope: govEnvelope,
                        policySnapshotId: govEnvelope.policySnapshotId,
                        governanceEvidenceReceipt: buildEvidenceReceipt({
                            envelope: govEnvelope,
                            decision: enforcement.status,
                            riskLevel: enforcement.riskGate?.riskLevel,
                            provider,
                            model: 'approval-required',
                            approvalId,
                        }),
                    },
                    { status: 409 }
                );
            }
        }

        // -- PRE-GUARDS: Run mandatory gateway exactly once (T1 composition) --
        const action = resolveGuardAction({ ...(rawBody as Record<string, unknown>), cvfPhase: authority.phase });
        const traceHash = authority.riskLevel === 'R2' || authority.riskLevel === 'R3'
            ? buildExecuteTraceHash({
                envelopeId: govEnvelope.envelopeId,
                requestHash: approvalRequestHash,
                phase: authority.phase,
                riskLevel: authority.riskLevel,
                role: resolvedExecutionRole.permissionRole,
                mode,
                action,
            })
            : undefined;
        const guardContext = buildWebGuardContext({
            requestId: (rawBody as Record<string, unknown>).requestId as string || undefined,
            phase: body.cvfPhase,
            riskLevel: body.cvfRiskLevel,
            traceHash,
            role: resolvedExecutionRole.permissionRole,
            userRole: isServiceAllowed ? 'admin' : session?.role,
            actorId: session?.userId ?? (isServiceAllowed ? 'service-account' : undefined),
            action,
            intent: body.intent,
            fileScope: (rawBody as Record<string, unknown>).fileScope as string[] | undefined,
            aiCommit: (rawBody as Record<string, unknown>).aiCommit as {
                commitId: string;
                agentId: string;
                timestamp: number;
                description?: string;
            } | undefined,
        });
        const gatewayOutcome = await runExecuteRouteMandatoryGateway({
            context: guardContext,
            envelope: govEnvelope,
            actorId: session?.userId ?? (isServiceAllowed ? 'service-account' : 'unknown-actor'),
            actorRole: session?.role ?? (isServiceAllowed ? 'service' : 'unknown-role'),
            provider,
            enforcementRiskLevel: enforcement.riskGate?.riskLevel,
        });
        if (gatewayOutcome.blockedResponse) {
            return gatewayOutcome.blockedResponse;
        }
        const guardResult: GuardPipelineResult = gatewayOutcome.guardResult;

        // -- PROVIDER ROUTER: Consult Track 5A canonical governance routing --
        // A requested canonical provider without a server key stays visible to the router so the route reports the missing
        // key (400) instead of silently selecting another provider.
        const configuredProviders = nativeClaude ? ['claude' as const] : (Object.keys(apiKeyMap) as AIProvider[]).filter(
            p => !!apiKeyMap[p] || (p === provider && (p === 'openai' || p === 'alibaba'))
        );
        const routingResult = routeWebProvider({
            requestedProvider: provider,
            riskLevel: body.cvfRiskLevel,
            phase: body.cvfPhase,
            configuredProviders,
        });

        const routingGate = routingGateResponse({ routingResult, provider, enforcement, guardResult, govEnvelope });
        if (routingGate) return routingGate;
        // routingGateResponse returned null, so a provider was selected.
        const selectedProvider = routingResult.selectedProvider as AIProvider;

        govEnvelope.providerLane = selectedProvider;
        const routedProvider: AIProvider = selectedProvider;
        const providerMismatch = routedProviderMismatchResponse(nativeClaude, routedProvider, provider);
        if (providerMismatch) return providerMismatch;
        const preflight = routedProviderPreflightResponse({ nativeClaude, routedProvider, apiKey: apiKeyMap[routedProvider], requestedModel: body.model, enforcement, govEnvelope, routingDecision: routingResult.decision });
        if (preflight) return preflight;
        // The role-plan reviewer model check precedes knowledge/memory resolution, lineage reservation and any provider call.
        const canonicalModel = body.model || (routedProvider === 'openai' ? CANONICAL_WEB_OPENAI_DEFAULT_MODEL : CANONICAL_WEB_DEFAULT_MODEL);
        if (process.env[MAO_ROLE_PLAN_ENV] === '1' && routedProvider === 'alibaba' && maoRolePlanReviewerModelUnfit(canonicalModel)) {
            return NextResponse.json({ success: false, code: 'ROLE_PLAN_REVIEWER_MODEL_UNFIT', error: `The role plan needs a reviewer model that is not a flash model; use ${ROLE_PLAN_FIT_REVIEWER_MODEL}.`, provider: routedProvider, model: canonicalModel }, { status: 400 });
        }
        const executionMaxTokens = resolveExecutionMaxTokens(executionTemplateId, routedProvider, body.model);

        // -- KNOWLEDGE RETRIEVAL + TENANT PARTITION ENFORCEMENT + SOT3 ACTIVATION --
        // A verified server-side pilot binding selects the no-ambient-lookup path; no request field can.
        const knowledgeContext = await selectKnowledgeContext(false, {
            intent: body.intent!,
            orgId: session?.orgId,
            teamId: session?.teamId,
            requestedCollectionId: typeof body.knowledgeCollectionId === 'string' ? body.knowledgeCollectionId : undefined,
            templateLabel: body.templateName || body.templateId || 'unknown-template',
            session,
            ...sot3CanonicalExecutionIdFanoutArg(govEnvelope.envelopeId), // CSCC-R1-T2 Finding 4: conditional on actual port usage
        });
        const { retrievalResult, finalKnowledgeContext, knowledgeInjected, knowledgeSource, requestedKnowledgeCollectionId } = knowledgeContext;

        // SOT3-ACT-A4: fail closed before any provider call; see route-context-selection.ts.
        const sot3Rejection = sot3RejectionResponse({ knowledge: knowledgeContext, envelope: govEnvelope, enforcement, guardResult,
            provider: routedProvider, routingResult });
        if (sot3Rejection) return sot3Rejection;

        const memoryContext = await resolveMemoryContext({ body, session, knowledge: knowledgeContext,
            actor: { id: executionActorId, executionRole: resolvedExecutionRole.role, targetResource: executionTargetResource,
                memoryPrincipalId: resolveDurableMemoryPrincipal({ isServiceAllowed, serviceIdentity, sessionUserId: session?.userId }) },
            envelope: govEnvelope, enforcement, guardResult, routedProvider, routingResult, htmlPilotPrepared: false });
        if (memoryContext.response) return memoryContext.response;
        const { durableMemoryRoute, aifMemoryReinjection, enrichedSystemPrompt } = memoryContext;

        // T3 lineage: readiness and verified identity are resolved before any port entry; failure is 503 JOURNAL_NOT_READY.
        const lineageResolution = await resolveRouteLineage({ request, session, isServiceAllowed, canonicalId: govEnvelope.envelopeId, governance: { guardResult, knowledge: knowledgeContext, memoryContextInjected: durableMemoryRoute.injected || Boolean(aifMemoryReinjection.promptBlock) } });
        if ('response' in lineageResolution) return lineageResolution.response;
        const lineage = lineageResolution.tracker;
        lineageForCatch = lineage;

        // -- PROVIDER-ATTEMPT ADMISSION: admission happens before every call;
        // providerCallCount is recorded only at the real invocation boundary
        // (recordProviderCallStart), see lib/provider-attempt-admission.ts. --
        const providerAttemptLedger = createProviderAttemptLedger({
            identityKind: session?.userId ? 'session' : 'service',
            identityHash: limitIdentity,
            providerModel: `${routedProvider}:${body.model ?? 'default'}`,
        });
        providerAttemptLedgerForCatch = providerAttemptLedger;
        const selectedRequestSignal = request.signal;
        selectedCancellationSignalForCatch = selectedRequestSignal;
        selectedProviderForCatch = routedProvider;
        selectedModelForCatch = body.model;
        const cancelled = () => selectedRequestSignal.aborted;
        // A role-plan failure (optional argument) adds its partial evidence to the unchanged cancellation response.
        const cancellationResponse = async (failed?: Parameters<typeof withRolePlanFailureEvidence>[1]) => {
            const cancelledResponse = buildProviderRequestCancelledResponse({ ledger: providerAttemptLedger, routedProvider, requestedModel: body.model });
            return lineage.conclude(failed ? await withRolePlanFailureEvidence(cancelledResponse, failed) : cancelledResponse, 'CANCELLED');
        };
        const denyProviderAttempt = (retryAfterSeconds: number) => buildProviderAttemptDeniedResponse({
            ledger: providerAttemptLedger, retryAfterSeconds, routedProvider, requestedModel: body.model,
            govEnvelope, enforcementRiskLevel: enforcement.riskGate?.riskLevel, routingDecision: routingResult.decision,
            knowledgeSource, knowledgeInjected, requestedKnowledgeCollectionId, knowledgeChunkCount: retrievalResult.allowedChunkCount,
            aifMemoryReinjectionReceipt: aifMemoryReinjection.receipt, durableMemoryReadReceipt: durableMemoryRoute.receipt,
            enforcement, guardResult,
        });

        let executor;
        try { executor = nativeClaude ? await createClaudeSubscriptionCanonicalWebExecutor({ model: canonicalModel, signal: request.signal })
            : routedProvider === 'openai' ? createOpenAiCanonicalWebExecutor({ model: canonicalModel, maxTokens: executionMaxTokens })
            : createAlibabaCanonicalWebExecutor({ model: canonicalModel, maxTokens: executionMaxTokens }); }
        catch { return NextResponse.json(nativeClaude
            ? { success: false, code: 'CLAUDE_NATIVE_NOT_READY', error: 'Native subscription readiness is unavailable. Do not resend automatically.', automaticRetryAllowed: false }
            : { success: false, code: 'PROVIDER_EXECUTOR_NOT_READY', error: 'Provider execution is unavailable. Do not resend automatically.', automaticRetryAllowed: false }, { status: 503 }); }
        const maoEnabled = process.env[MAO_SINGLE_WORKER_ENV] === '1';
        const executeCanonical = (prompt: string, purpose: 'initial' | 'retry' | 'continuation', systemPrompt?: string) => executor.execute({
            canonicalExecutionId: govEnvelope.envelopeId, prompt,
            systemPrompt: systemPrompt ?? canonicalWebSystemPrompt(enrichedSystemPrompt),
            policy: { traceId: govEnvelope.envelopeId, policyResult: 'allow', reason: 'web_guard_and_routing_passed', allowedProviderIds: [routedProvider] },
            preferredProviderId: routedProvider, routing: { requestedModelId: canonicalModel },
            ledger: providerAttemptLedger, purpose, signal: selectedRequestSignal,
        });
        const toGatewayEvidence = (result: Awaited<ReturnType<typeof executeCanonical>>): CanonicalGatewayEvidence | undefined => canonicalWebExecutionResponse(result, canonicalModel, Date.now(), routedProvider).canonicalGateway;
        // Ledger fact of a denied attempt: exactly one new attempt since the call started, not admitted, with its retry-after.
        const deniedFact = (since: number) => deniedAttemptFact(providerAttemptLedger.attempts, since);
        // Exactly one factory per request; the private reservation/launch claim is never reset.
        const maoWorker = maoEnabled ? createMaoCanonicalSingleWorker({
            owner: lineage, durableRunPath: process.env.CVF_MAO_DURABLE_RUN_PATH,
            riskLevel: resolveMaoRisk(enforcement.riskGate?.riskLevel, authority.riskLevel),
            execute: () => executeCanonical(filteredPrompt, 'initial'), signal: selectedRequestSignal,
            attemptCount: () => providerAttemptLedger.attempts.length, deniedAttempt: deniedFact, toEvidence: toGatewayEvidence,
        }) : null;
        // Role plan (draft, review, revise): the consumer reserves and settles every step itself; the retry loop is off in both MAO modes.
        const rolePlanEnabled = process.env[MAO_ROLE_PLAN_ENV] === '1';
        const rolePlan = rolePlanEnabled ? createMaoCanonicalRolePlan({
            owner: lineage, durableRunPath: process.env.CVF_MAO_DURABLE_RUN_PATH, prompt: filteredPrompt, templateName: body.templateName!, intent: body.intent!, inputs: body.inputs!,
            responseLanguage: resolveResponseLanguage(body as ExecutionRequest),
            riskLevel: resolveMaoRisk(enforcement.riskGate?.riskLevel, authority.riskLevel),
            execute: call => executeCanonical(call.prompt, call.purpose, call.systemPrompt), attemptCount: () => providerAttemptLedger.attempts.length,
            deniedAttempt: deniedFact, toEvidence: toGatewayEvidence,
            sanitize: async text => { const safe = runSafetyWorkflowChain((await applyDLPFilter(text)).redacted); return safe.blocked || applySafetyFilters(safe.sanitized).blocked ? null : safe.sanitized; },
            signal: selectedRequestSignal,
        }) : null;
        // A definite no-call denial answered like the non-MAO denied path: 429 + Retry-After, concluded DENIED (a role-plan failure adds its partial evidence).
        const deniedRefusal = async (retryAfterSeconds: number, evidence: CanonicalGatewayEvidence | undefined, failed?: Parameters<typeof withRolePlanFailureEvidence>[1]) => {
            const deniedResponse = denyProviderAttempt(retryAfterSeconds);
            const refusal = NextResponse.json({ ...await deniedResponse.json(), ...(evidence ? { canonicalGateway: evidence } : {}) },
                { status: deniedResponse.status, headers: { 'Retry-After': String(retryAfterSeconds) } });
            return lineage.conclude(failed ? await withRolePlanFailureEvidence(refusal, failed) : refusal, 'DENIED');
        };
        const invokeCanonical = async (prompt: string, purpose: 'initial' | 'retry') => {
            const startedAt = Date.now();
            const attemptsBefore = providerAttemptLedger.attempts.length;
            const plan = rolePlan ? await rolePlan.run() : null;
            if (plan && !plan.ok) {
                const failedEvidence = rolePlanFailureEvidence(plan);
                const maoInput = { mao: plan, nativeClaude, routedProvider, model: canonicalModel, canonicalId: lineage.canonicalId, evidence: failedEvidence };
                const blockedBody = { success: false, error: 'Safety screening blocked a role-plan step.', provider: routedProvider, model: 'blocked' };
                const lastAttempt = providerAttemptLedger.attempts[providerAttemptLedger.attempts.length - 1];
                if (plan.reason === 'MAO_REQUEST_CANCELLED') return { response: await cancellationResponse(failedEvidence) };
                if (plan.reason === 'MAO_STEP_PROMPT_BLOCKED') return { response: await lineage.conclude(await withRolePlanFailureEvidence(NextResponse.json(blockedBody, { status: 400 }), failedEvidence), 'DENIED') };
                if (plan.reason !== 'MAO_ATTEMPT_DENIED' || !lastAttempt || lastAttempt.admitted || lastAttempt.retryAfterSeconds === undefined) return { response: await maoFailureResponse(maoInput) };
                // Denied at the draft: a definite no-call outcome, answered like the non-MAO denied path (429 + Retry-After).
                return { response: await deniedRefusal(lastAttempt.retryAfterSeconds, plan.evidence, failedEvidence) };
            }
            if (plan?.ok) return { result: Object.assign(canonicalWebExecutionResponse(plan.payload, canonicalModel, startedAt, routedProvider), { maoRolePlan: plan.rolePlan }) };
            const mao = maoWorker ? await maoWorker.run() : null;
            // Single worker: a ledger-verified, settled pre-invoke denial is the same definite no-call refusal as the other lanes.
            if (mao && !mao.ok && mao.reason === 'MAO_ATTEMPT_DENIED' && mao.retryAfterSeconds !== undefined) return { response: await deniedRefusal(mao.retryAfterSeconds, mao.evidence) };
            if (mao && !mao.ok) return { response: await maoFailureResponse({ mao, nativeClaude, routedProvider, model: canonicalModel, canonicalId: lineage.canonicalId }) };
            const reservation = mao?.ok ? { ordinal: mao.ordinal } : await lineage.reserveNext();
            if ('response' in reservation) return { response: reservation.response };
            const callAdmission = mao?.ok ? null : lineage.beforeProviderCall(reservation.ordinal);
            if (callAdmission) return { response: callAdmission };
            const result = mao?.ok ? mao.payload : await executeCanonical(prompt, purpose);
            const response = canonicalWebExecutionResponse(result, canonicalModel, startedAt, routedProvider);
            if (mao?.ok) response.maoExecution = mao.reference;
            const settleFailure = await lineage.settleNext(reservation.ordinal, response.canonicalGateway,
                providerAttemptLedger.attempts.length > attemptsBefore ? attemptsBefore : null);
            if (settleFailure) return { response: settleFailure };
            if (result.attemptOutcome === 'denied') {
                const denied = providerAttemptLedger.attempts[providerAttemptLedger.attempts.length - 1];
                if (!denied || denied.admitted || denied.retryAfterSeconds === undefined) return { result: response };
                return { response: await deniedRefusal(denied.retryAfterSeconds, response.canonicalGateway) };
            }
            return { result: response };
        };
        if (cancelled()) return cancellationResponse();
        const initial = await invokeCanonical(filteredPrompt, 'initial');
        if (initial.response) return initial.response;
        let aiResult: ExecutionResponse = initial.result!;
        if (cancelled()) return cancellationResponse();
        const explicitWordLimit = template?.id === 'documentation'
            ? parseExplicitWordLimit(originalBrief(body.inputs)) : undefined;
        let outputValidation: ValidationResult | undefined;
        const retryState: RetryState = { attempt: 0, previousIssues: [] };
        let outputSafetyAuditEmitted = false;
        const emitOutputSafetyTriggered = async (validation: ValidationResult, result: ExecutionResponse) => {
            if (outputSafetyAuditEmitted || !validation.issues.includes('UNSAFE_CONTENT')) return;
            outputSafetyAuditEmitted = true;
            await appendAuditEvent({
                eventType: 'OUTPUT_SAFETY_TRIGGERED',
                actorId: session?.userId ?? 'service-account',
                actorRole: session?.role ?? 'service',
                targetResource: body.templateName || body.templateId || 'unknown-template',
                action: 'DETECT_UNSAFE_OUTPUT',
                riskLevel: body.cvfRiskLevel ?? enforcement.riskGate?.riskLevel ?? 'R1',
                phase: body.cvfPhase ?? 'PHASE D',
                outcome: 'DETECTED',
                payload: withSessionAuditPayload(session, {
                    issues: validation.issues,
                    issueCount: validation.issues.length,
                    provider: routedProvider,
                    model: body.model ?? result.model ?? routedProvider,
                }),
            });
        };

        if (aiResult.success) {
            outputValidation = validateOutput({
                output: aiResult.output ?? '',
                intent: body.intent!,
                templateName: body.templateName,
                templateCategory: template?.category,
                explicitWordLimit,
            });

            // -- OUTPUT_SAFETY_TRIGGERED: fire on first UNSAFE_CONTENT detection --
            await emitOutputSafetyTriggered(outputValidation, aiResult);
            if (cancelled()) return cancellationResponse();

            // Auto-retry loop (max 2 retries, invisible to user)
            while (!maoEnabled && !rolePlanEnabled && outputValidation.decision === 'RETRY') {
                if (cancelled()) return cancellationResponse();
                if (!hasValidationRetryBudget(routeStartedAtMs)) break;
                const retryDecision = shouldRetry(outputValidation, retryState);
                if (!retryDecision.retry) break;

                retryState.previousIssues = [...outputValidation.issues];
                retryState.attempt++;

                const retryPromptDraft = retryDecision.adjustedHint
                    ? `${filteredPrompt}\n\n[Improvement note: ${retryDecision.adjustedHint}]`
                    : filteredPrompt;
                // Validator hints can quote the original intent; filter after composition.
                const retryDlpPrompt = (await applyDLPFilter(retryPromptDraft)).redacted;
                if (cancelled()) return cancellationResponse();
                const retrySafety = runSafetyWorkflowChain(retryDlpPrompt);
                if (retrySafety.blocked || applySafetyFilters(retrySafety.sanitized).blocked) {
                    return lineage.conclude(NextResponse.json({ success: false, error: 'Safety screening blocked the validation retry.', provider: routedProvider, model: 'blocked' }, { status: 400 }), 'DENIED');
                }
                const retryPrompt = retrySafety.sanitized;

                const retryOutcome = await invokeCanonical(retryPrompt, 'retry');
                if (retryOutcome.response) return retryOutcome.response;
                aiResult = retryOutcome.result!;
                if (cancelled()) return cancellationResponse();
                if (!aiResult.success) break;

                outputValidation = validateOutput({
                    output: aiResult.output ?? '',
                    intent: body.intent!,
                    templateName: body.templateName,
                    templateCategory: template?.category,
                    explicitWordLimit,
                });
                await emitOutputSafetyTriggered(outputValidation, aiResult);
                if (cancelled()) return cancellationResponse();
            }
        }

        // -- POST-EXECUTION BYPASS DETECTION GUARD ------------------------------
        // Runs before the validation refusal so a bypass echo is recorded as DENIED even when the output is also refused.
        if (aiResult.success && aiResult.output) {
            const bypassCheck = detectBypassInOutput(aiResult.output);
            if (bypassCheck.detected) {
                const bypassGuardResult = buildOutputBypassGuardResult(guardResult, bypassCheck.matchedPattern);
                // F01: this terminal path also needs reconciliation evidence.
                const bypassReconciliation = buildProviderAttemptReconciliation(providerAttemptLedger, routedProvider, body.model ?? 'default');
                return lineage.conclude(NextResponse.json(
                    {
                        success: false,
                        error: 'Response blocked: governance bypass approval detected in model output.',
                        provider: routedProvider,
                        model: body.model ?? aiResult.model ?? 'unknown',
                        enforcement,
                        guardResult: bypassGuardResult,
                        providerAttemptReconciliation: bypassReconciliation,
                        canonicalGateway: aiResult.canonicalGateway,
                    },
                    { status: 400 },
                ), 'DENIED');
            }
        }

        if (aiResult.success && (outputValidation?.decision === 'RETRY' || outputValidation?.decision === 'BLOCK')) {
            // F01/file-size rework: the OUTPUT_VALIDATION_EXHAUSTED audit event
            // and 422 response are now built by buildOutputValidationExhaustedResponse
            // in route-final-response.ts, called from this exact branch.
            return lineage.conclude(await buildOutputValidationExhaustedResponse({
                session, isServiceAllowed, serviceIdentity: serviceIdentity ?? null, body, outputValidation, retryState,
                routedProvider, aiResult, enforcement, guardResult, govEnvelope, routingResult, knowledgeSource,
                knowledgeInjected, requestedKnowledgeCollectionId, retrievalResult, approvedRequestRecord,
                aifMemoryReinjection, durableMemoryRoute, providerAttemptLedger,
            }), outputValidation.decision === 'BLOCK' ? 'VALIDATION_FAILED' : 'EXHAUSTED');
        }

        if (cancelled()) return cancellationResponse();
        const finalResponse = await buildExecuteFinalResponse({
            aiResult: { ...aiResult, memoryAdvisoryReadout } as ExecutionResponse,
            outputValidation,
            retryState,
            request: readoutRequest,
            template,
            routeStartedAtMs,
            routeStartedMonotonicMs,
            pilotProviderElapsedMs: 0,
            session,
            serviceIdentity: serviceIdentity ?? null,
            isServiceAllowed,
            resolvedExecutionRole,
            rolePermission,
            enforcement,
            guardResult,
            routingResult,
            govEnvelope,
            knowledgeSource,
            knowledgeInjected,
            knowledgeContextLength: finalKnowledgeContext?.length ?? 0,
            requestedKnowledgeCollectionId,
            retrievalResult,
            approvedRequestRecord,
            aifMemoryReinjection,
            durableMemoryRoute,
            workflowBinding,
            executionTemplateId,
            executionIdentity,
            routedProvider,
            isVisionExecution: false,
            requestedProvider: provider,
            filteredPrompt,
            actorRoleGate,
            providerAttemptReconciliation: buildProviderAttemptReconciliation(providerAttemptLedger, routedProvider, body.model ?? 'default'),
        });
        if (cancelled()) return cancellationResponse();
        return lineage.conclude(finalResponse);
    } catch (error) {
        return buildExecuteRouteFailure(error, providerAttemptLedgerForCatch, selectedCancellationSignalForCatch, selectedProviderForCatch, selectedModelForCatch, lineageForCatch);
    }
}
