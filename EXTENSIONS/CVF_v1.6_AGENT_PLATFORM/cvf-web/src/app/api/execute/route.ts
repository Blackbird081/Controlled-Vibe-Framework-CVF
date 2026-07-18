import { NextRequest, NextResponse } from 'next/server';
import { executeAI, type AIProvider, type ExecutionRequest, type ExecutionResponse } from '@/lib/ai';
import { evaluateEnforcement } from '@/lib/enforcement';
import { getTemplateById } from '@/lib/templates';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { applySafetyFilters } from '@/lib/safety';
import { runSafetyWorkflowChain } from '@/lib/safety-workflow-chain';
import { getRateLimiter } from '@/lib/rate-limit';
import { checkBudget } from '@/lib/budget';
import { buildWebGuardContext, type GuardPipelineResult } from '@/lib/guard-runtime-adapter';
import { getSharedGuardEngine } from '@/lib/guard-engine-singleton';
import { validateOutput, shouldRetry, type ValidationResult, type RetryState } from '@/lib/output-validator';
import { routeWebProvider } from '@/lib/ai/provider-router-adapter';
import { lookupGuidedResponse } from './guided.response.registry';
import { buildAifMemoryReinjectionSystemPrompt, evaluateAifMemoryReinjection } from '@/lib/aif-memory-reinjection';
import { appendAifMemoryReinjectionAudit, buildAifMemoryReinjectionDeniedResponse } from '@/lib/aif-memory-reinjection-route';
import { buildExecutionPrompt } from '@/lib/execute-prompt-contract';
import { checkTeamQuota } from '@/lib/quota-guard';
import { appendAuditEvent } from '@/lib/control-plane-events';
import { applyDLPFilter } from '@/lib/dlp-filter';
import { withSessionAuditPayload } from '@/lib/middleware-auth';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';
import { blockInlineKnowledgeContextBypass, resolveKnowledgeContext } from './route-knowledge-context';
import { buildEvidenceReceipt, buildGovernanceEnvelope } from '@/lib/web-governance-envelope';
import { deriveServiceTokenIdentity, verifyServiceTokenRequest } from '@/lib/service-token-auth';
import { hasValidationRetryBudget, resolveExecutionMaxTokens } from '@/lib/execute-route-budget';
import { recordReportableDecisionObserved } from '@/lib/false-positive-report';
import { resolveWorkflowBindingForExecution } from '@/lib/workflows/workflow-resolver';
import { buildDurableMemorySystemPrompt, evaluateDurableMemoryRoute, resolveDurableMemoryActorRole } from '@/lib/durable-memory-route';
import { buildRoleOutputDeniedResponse, buildRolePermissionDeniedResponse } from '@/lib/execute-role-permission-gate';
import { buildExecutionIdentityDecision } from '@/lib/execution-identity';
import { evaluateExecutionActorRoleGate, resolveExecutionCVFRole, resolveExecutionOutputClass } from '@/lib/execute-role-resolver';
import { buildOutputBypassGuardResult, checkRoleOutputPermission, detectBypassInOutput, resolveGuardAction, shouldRequireSkillPreflight } from '@/lib/execute-route-guards';
import { buildExecutionDiagnostic } from '@/lib/execution-diagnostics';
import { getApprovalStore, type ApprovalRequestRecord } from '../approvals/store';
import { approvalRecordMatchesActor, buildApprovalActorBinding, buildApprovalRequestSnapshot, computeApprovalRequestHash } from '../approvals/approval-binding';
import { executeVisionRouteRequest, prepareVisionRouteRequest } from './vision-route-helper';
import { buildExecuteFinalResponse } from './route-final-response';
import { buildMemoryAdvisoryReadout } from './route-memory-advisory';

type ExecutionRequestWithSpecFirst = ExecutionRequest & {
    specFirst?: {
        originalPrompt?: string;
        advisory?: {
            draftSummary?: string;
            draftText?: string;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
};

async function redactTextForReadout(value: string | undefined): Promise<string | undefined> {
    if (typeof value !== 'string') return value;
    return (await applyDLPFilter(value)).redacted;
}

async function buildDlpRedactedReadoutRequest(
    request: Partial<ExecutionRequestWithSpecFirst>,
    dlpWasRedacted: boolean,
): Promise<ExecutionRequestWithSpecFirst> {
    if (!dlpWasRedacted) return request as ExecutionRequestWithSpecFirst;

    const redactedInputs = Object.fromEntries(
        await Promise.all(
            Object.entries(request.inputs ?? {}).map(async ([key, value]) => [
                key,
                (await redactTextForReadout(value)) ?? '',
            ]),
        ),
    );
    const specFirst = request.specFirst
        ? {
            ...request.specFirst,
            originalPrompt: await redactTextForReadout(request.specFirst.originalPrompt),
            advisory: request.specFirst.advisory
                ? {
                    ...request.specFirst.advisory,
                    draftSummary: await redactTextForReadout(request.specFirst.advisory.draftSummary),
                    draftText: await redactTextForReadout(request.specFirst.advisory.draftText),
                }
                : request.specFirst.advisory,
        }
        : request.specFirst;

    return {
        ...request,
        templateId: request.templateId ?? '',
        templateName: (await redactTextForReadout(request.templateName)) ?? '',
        inputs: redactedInputs,
        intent: (await redactTextForReadout(request.intent)) ?? '',
        specFirst,
    } as ExecutionRequestWithSpecFirst;
}

export async function POST(request: NextRequest) {
    const routeStartedAtMs = Date.now();
    try {
        const rawBodyText = await request.text();
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
        if (!rawBody || typeof rawBody !== 'object') {
            return NextResponse.json({ success: false, error: 'Invalid input payload.' }, { status: 400 });
        }
        const body = rawBody as Partial<ExecutionRequest>;
        body.inputs = Object.fromEntries(Object.entries(body.inputs || {}).map(([k, v]) => [k, String(v ?? '').trim()]));
        if (typeof body.model === 'string') body.model = body.model.trim() || undefined;
        const isVisionExecution = prepareVisionRouteRequest(body).isVisionExecution;
        // ── CP7/CP8: Build governance envelope + policy snapshot id ──────────
        const govEnvelope = buildGovernanceEnvelope({
            routeId: '/api/execute',
            surfaceClass: 'governance-execution',
            evidenceMode: 'live',
            actorId: session?.userId ?? (isServiceAllowed ? 'service-account' : null),
            actorRole: session?.role ?? (isServiceAllowed ? 'service' : null),
            phase: body.cvfPhase ?? null,
            riskLevel: body.cvfRiskLevel ?? null,
        });
        // Rate limit by session + IP (after provider known)
        const limiter = getRateLimiter();
        const limitIdentity = session?.userId
            ?? session?.user
            ?? (serviceIdentity || 'service');
        const limitResult = await limiter.consume(request, limitIdentity, body.provider);
        if (!limitResult.allowed) {
            return NextResponse.json(
                { success: false, error: 'Too many requests. Please slow down.' },
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
        const inlineKnowledgeContextBlockResponse = await blockInlineKnowledgeContextBypass({ session, isServiceAllowed, knowledgeContext: body.knowledgeContext, templateLabel: body.templateName || body.templateId || 'unknown-template', riskLevel: body.cvfRiskLevel, phase: body.cvfPhase });
        if (inlineKnowledgeContextBlockResponse) return inlineKnowledgeContextBlockResponse;
        // Get provider config from environment or request
        const provider: AIProvider = body.provider ||
            (process.env.DEFAULT_AI_PROVIDER as AIProvider) || 'openai';
        const approvalActor = buildApprovalActorBinding({
            session,
            serviceIdentity: isServiceAllowed ? serviceIdentity : null,
        });
        const approvalSnapshot = buildApprovalRequestSnapshot(body as Partial<ExecutionRequest>, provider, approvalActor);
        const approvalRequestHash = computeApprovalRequestHash(approvalSnapshot);
        let approvedRequestRecord: ApprovalRequestRecord | null = null;
        if (body.approvalId) {
            const approvalId = String(body.approvalId);
            const approvalStore = getApprovalStore();
            const approvalRecord = approvalStore.get(approvalId);

            if (!approvalRecord) {
                return NextResponse.json(
                    { success: false, error: 'Approval request not found.', approvalId },
                    { status: 404 },
                );
            }

            if (!approvalRecord.requestHash) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Approval request predates request binding and must be re-issued.',
                        approvalId,
                    },
                    { status: 409 },
                );
            }

            if (!approvalRecord.requestSnapshot?.actorId || !approvalRecord.submittedByActorId || !approvalRecord.submittedByAuthMode) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Approval request predates actor binding and must be re-issued.',
                        approvalId,
                    },
                    { status: 409 },
                );
            }

            if (!approvalRecordMatchesActor(approvalRecord, approvalActor)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Approval request was issued for a different actor and cannot be reused.',
                        approvalId,
                    },
                    { status: 403 },
                );
            }

            if (approvalRecord.requestHash !== approvalRequestHash) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Approval request does not match the current execution payload.',
                        approvalId,
                    },
                    { status: 409 },
                );
            }

            if (new Date(approvalRecord.expiresAt).getTime() <= Date.now()) {
                approvalStore.set(approvalRecord.id, {
                    ...approvalRecord,
                    status: 'expired',
                });
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Approval request has expired and must be re-submitted.',
                        approvalId,
                    },
                    { status: 409 },
                );
            }

            if (approvalRecord.status !== 'approved') {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Approval request is ${approvalRecord.status} and cannot authorize execution.`,
                        approvalId,
                        approvalStatus: approvalRecord.status,
                    },
                    { status: 409 },
                );
            }

            approvedRequestRecord = approvalRecord;
        }
        // Get API key from environment
        const apiKeyMap: Record<AIProvider, string | undefined> = {
            openai: process.env.OPENAI_API_KEY,
            claude: process.env.ANTHROPIC_API_KEY,
            gemini: process.env.GOOGLE_AI_API_KEY,
            alibaba: resolveAlibabaApiKey(),
            openrouter: process.env.OPENROUTER_API_KEY,
            deepseek: process.env.DEEPSEEK_API_KEY,
        };
        // Build the prompt from template inputs
        const userPrompt = buildExecutionPrompt(body as ExecutionRequest);
        const dlpResult = await applyDLPFilter(userPrompt);
        const filteredPrompt = dlpResult.redacted;
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
        // Legacy safety filters (preserved for backward compatibility)
        const safety = applySafetyFilters(saf1Result.sanitized);
        if (safety.blocked) {
            return NextResponse.json(
                {
                    success: false,
                    error: safety.reason || 'Request blocked by safety filters.',
                    details: safety.details,
                    provider,
                    model: 'blocked',
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
            templateCategory: template?.category,
            intent: body.intent,
            templateId: template?.id ?? body.templateId,
        });
        const memoryAdvisoryReadout = buildMemoryAdvisoryReadout({ request: readoutRequest, actorRole: resolvedExecutionRole.role ?? 'unknown', actorId: session?.userId ?? (isServiceAllowed ? 'service-account' : 'unknown-actor'), sessionId: session?.userId ?? serviceIdentity ?? null });
        const enforcement = evaluateEnforcement({
            mode,
            content: filteredPrompt,
            budgetOk: checkBudget(filteredPrompt),
            specFields: specFields.length ? specFields : undefined,
            specValues: body.inputs,
            cvfPhase: body.cvfPhase,
            cvfRiskLevel: body.cvfRiskLevel,
            memoryEligibility: memoryAdvisoryReadout.eligibility,
            requiresSkillPreflight,
            skillPreflight: {
                passed: body.skillPreflightPassed,
                declaration: body.skillPreflightDeclaration,
                recordRef: body.skillPreflightRecordRef,
                skillIds: body.skillIds,
            },
        });

        if (enforcement.status === 'BLOCK') {
            const guidedResponse = lookupGuidedResponse(userPrompt);
            const governanceEvidenceReceipt = buildEvidenceReceipt({
                envelope: govEnvelope,
                decision: enforcement.status,
                riskLevel: enforcement.riskGate?.riskLevel,
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
                    error: enforcement.reasons.join(' | ') || 'Execution blocked by CVF policy.',
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

        if (enforcement.status === 'CLARIFY') {
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
                    missing: enforcement.specGate?.missing?.map(field => field.label) || [],
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
                getApprovalStore().delete(approvedRequestRecord.id);
            } else {
                const guidedResponse = lookupGuidedResponse(userPrompt);
                // CP9: Auto-create approval record so the user can track and resume post-approval
                const approvalId = `apr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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
                        error: enforcement.reasons.join(' | ') || 'Human approval required before execution.',
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

        // ── PRE-GUARDS: Run guard runtime pipeline (shared engine — Sprint 6) ──
        const guardEngine = getSharedGuardEngine();
        const guardContext = buildWebGuardContext({
            requestId: (rawBody as Record<string, unknown>).requestId as string || undefined,
            phase: body.cvfPhase,
            riskLevel: body.cvfRiskLevel,
            role: resolvedExecutionRole.permissionRole,
            userRole: isServiceAllowed ? 'admin' : session?.role,
            action: resolveGuardAction(rawBody as Record<string, unknown>),
            intent: body.intent,
            fileScope: (rawBody as Record<string, unknown>).fileScope as string[] | undefined,
            aiCommit: (rawBody as Record<string, unknown>).aiCommit as {
                commitId: string;
                agentId: string;
                timestamp: number;
                description?: string;
            } | undefined,
        });
        const guardResult: GuardPipelineResult = guardEngine.evaluate(guardContext);

        if (guardResult.finalDecision === 'BLOCK') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'We need to adjust your request for better results.',
                    provider,
                    model: 'guard-blocked',
                    enforcement,
                    guardResult,
                },
                { status: 400 }
            );
        }

        // ── PROVIDER ROUTER: Consult Track 5A canonical governance routing ──
        const configuredProviders = (Object.keys(apiKeyMap) as AIProvider[]).filter(
            p => !!apiKeyMap[p]
        );
        const routingResult = routeWebProvider({
            requestedProvider: provider,
            riskLevel: body.cvfRiskLevel,
            phase: body.cvfPhase,
            configuredProviders,
        });

        if (routingResult.decision === 'DENY') {
            return NextResponse.json(
                {
                    success: false,
                    error: routingResult.deniedReason || 'Provider denied by governance routing policy.',
                    provider,
                    model: 'router-denied',
                    enforcement,
                    guardResult,
                    providerRouting: {
                        decision: routingResult.decision,
                        rationale: routingResult.rationale,
                    },
                    governanceEnvelope: govEnvelope,
                    policySnapshotId: govEnvelope.policySnapshotId,
                    governanceEvidenceReceipt: buildEvidenceReceipt({
                        envelope: govEnvelope,
                        decision: enforcement.status,
                        riskLevel: enforcement.riskGate?.riskLevel,
                        provider,
                        model: 'router-denied',
                        routingDecision: routingResult.decision,
                    }),
                    diagnostic: buildExecutionDiagnostic({ stage: 'routing', class: 'routing_denied', provider, model: 'router-denied', httpStatus: 403 }),
                },
                { status: 403 }
            );
        }

        if (routingResult.decision === 'ESCALATE') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Provider selection requires explicit approval.',
                    provider,
                    model: 'router-escalated',
                    enforcement,
                    guardResult,
                    providerRouting: {
                        decision: routingResult.decision,
                        rationale: routingResult.rationale,
                    },
                    governanceEnvelope: govEnvelope,
                    policySnapshotId: govEnvelope.policySnapshotId,
                    governanceEvidenceReceipt: buildEvidenceReceipt({
                        envelope: govEnvelope,
                        decision: enforcement.status,
                        riskLevel: enforcement.riskGate?.riskLevel,
                        provider,
                        model: 'router-escalated',
                        routingDecision: routingResult.decision,
                    }),
                },
                { status: 409 }
            );
        }

        // Use router-selected provider (may differ from requested if default was ineligible)
        if (!routingResult.selectedProvider) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Provider routing failed to resolve an executable provider.',
                    provider,
                    model: 'router-error',
                    enforcement,
                    guardResult,
                    providerRouting: {
                        decision: routingResult.decision,
                        rationale: routingResult.rationale,
                    },
                },
                { status: 500 },
            );
        }

        govEnvelope.providerLane = routingResult.selectedProvider;
        const routedProvider: AIProvider = routingResult.selectedProvider;
        const routedApiKey = apiKeyMap[routedProvider];
        const executionMaxTokens = resolveExecutionMaxTokens(executionTemplateId, routedProvider, body.model);

        // -- KNOWLEDGE RETRIEVAL + TENANT PARTITION ENFORCEMENT + SOT3 ACTIVATION --
        const { retrievalResult, finalKnowledgeContext, knowledgeInjected, knowledgeSource, knowledgeSystemPrompt, requestedKnowledgeCollectionId, sot3 } = await resolveKnowledgeContext({
            intent: body.intent!,
            orgId: session?.orgId,
            teamId: session?.teamId,
            requestedCollectionId: typeof body.knowledgeCollectionId === 'string' ? body.knowledgeCollectionId : undefined,
            templateLabel: body.templateName || body.templateId || 'unknown-template',
            session,
        });

        // SOT3-ACT-A4: fail closed before any provider call. In ENFORCE mode a
        // SOT3-rejected activation must never fall through to raw/legacy
        // context or reach `executeAI`. An explicitly requested governed
        // collection (requestedKnowledgeCollectionId is non-null) that
        // resolves to NO_CONTEXT is also rejected here, because the caller
        // named a specific collection and got nothing governed back; an
        // unrequested empty retrieval (requestedKnowledgeCollectionId is
        // null) is not SOT3's concern and preserves ordinary route behavior.
        const sot3ExplicitNoContext = sot3 !== null && sot3.terminalOutcome === 'NO_CONTEXT' && requestedKnowledgeCollectionId !== null;
        if (sot3 !== null && (sot3.terminalOutcome === 'REJECTED' || sot3ExplicitNoContext)) {
            const governanceEvidenceReceipt = buildEvidenceReceipt({
                envelope: govEnvelope,
                decision: 'DENY',
                riskLevel: enforcement.riskGate?.riskLevel,
                provider: routedProvider,
                model: 'sot3-rejected',
                routingDecision: routingResult.decision,
                knowledgeSource,
                knowledgeInjected,
                knowledgeCollectionId: requestedKnowledgeCollectionId,
                knowledgeChunkCount: retrievalResult.allowedChunkCount,
            });
            return NextResponse.json(
                {
                    success: false,
                    error: 'Governed knowledge activation rejected this request before provider execution.',
                    provider: routedProvider,
                    model: 'sot3-rejected',
                    enforcement,
                    guardResult,
                    governanceEnvelope: govEnvelope,
                    policySnapshotId: govEnvelope.policySnapshotId,
                    governanceEvidenceReceipt,
                    diagnostic: buildExecutionDiagnostic({ stage: 'governance', class: 'policy_blocked', provider: routedProvider, model: 'sot3-rejected', httpStatus: 409 }),
                },
                { status: 409 }
            );
        }

        const durableMemoryRoute = evaluateDurableMemoryRoute({ request: body, actorId: executionActorId, actorRole: resolveDurableMemoryActorRole(resolvedExecutionRole.role), defaultQuery: body.intent! });
        const durableMemorySystemPrompt = durableMemoryRoute.promptBlock ? buildDurableMemorySystemPrompt(knowledgeSystemPrompt, durableMemoryRoute.promptBlock) : knowledgeSystemPrompt;
        const aifMemoryReinjection = evaluateAifMemoryReinjection(body.aifMemoryReinjection);
        await appendAifMemoryReinjectionAudit({ decision: aifMemoryReinjection, request: body, session });

        if (aifMemoryReinjection.status === 'denied') {
            return buildAifMemoryReinjectionDeniedResponse({ decision: aifMemoryReinjection, envelope: govEnvelope, enforcement, guardResult, provider: routedProvider, routingResult, knowledgeSource, knowledgeInjected, knowledgeCollectionId: requestedKnowledgeCollectionId, knowledgeChunkCount: retrievalResult.allowedChunkCount });
        }

        const enrichedSystemPrompt = aifMemoryReinjection.promptBlock ? buildAifMemoryReinjectionSystemPrompt(durableMemorySystemPrompt, aifMemoryReinjection.promptBlock) : knowledgeInjected || durableMemoryRoute.injected ? durableMemorySystemPrompt : undefined;

        if (!routedApiKey) {
            const governanceEvidenceReceipt = buildEvidenceReceipt({
                envelope: govEnvelope,
                decision: enforcement.status,
                riskLevel: enforcement.riskGate?.riskLevel,
                provider: routedProvider,
                model: 'not configured',
                routingDecision: routingResult.decision,
                knowledgeSource,
                knowledgeInjected,
                knowledgeCollectionId: requestedKnowledgeCollectionId,
                knowledgeChunkCount: retrievalResult.allowedChunkCount,
                aifMemoryReinjection: aifMemoryReinjection.receipt,
                durableMemoryRead: durableMemoryRoute.receipt,
            });
            return NextResponse.json(
                {
                    success: false,
                    error: `API key not configured for provider: ${routedProvider}. Please set the corresponding environment variable.`,
                    provider: routedProvider,
                    model: 'not configured',
                    governanceEnvelope: govEnvelope,
                    policySnapshotId: govEnvelope.policySnapshotId,
                    governanceEvidenceReceipt,
                },
                { status: 400 }
            );
        }

        // ── EXECUTE AI with auto-retry on output validation failure ──
        let aiResult: ExecutionResponse;
        if (isVisionExecution) {
            if (routedProvider !== 'alibaba') return NextResponse.json({ success: false, error: 'Vision execution requires the Alibaba qwen-vl-plus provider lane.', provider: routedProvider, model: body.model ?? 'vision-router-error', enforcement, guardResult }, { status: 409 });
            aiResult = await executeVisionRouteRequest({ apiKey: routedApiKey, body, prompt: filteredPrompt, traceId: govEnvelope.envelopeId });
        } else {
            aiResult = await executeAI(routedProvider, routedApiKey, filteredPrompt, { model: body.model, maxTokens: executionMaxTokens, ...(enrichedSystemPrompt ? { systemPrompt: enrichedSystemPrompt } : {}) });
        }
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

        if (aiResult.success && !isVisionExecution) {
            outputValidation = validateOutput({
                output: aiResult.output ?? '',
                intent: body.intent!,
                templateName: body.templateName,
                templateCategory: template?.category,
            });

            // ── OUTPUT_SAFETY_TRIGGERED: fire on first UNSAFE_CONTENT detection ──
            await emitOutputSafetyTriggered(outputValidation, aiResult);

            // Auto-retry loop (max 2 retries, invisible to user)
            while (outputValidation.decision === 'RETRY') {
                if (!hasValidationRetryBudget(routeStartedAtMs)) break;
                const retryDecision = shouldRetry(outputValidation, retryState);
                if (!retryDecision.retry) break;

                retryState.previousIssues = [...outputValidation.issues];
                retryState.attempt++;

                const retryPrompt = retryDecision.adjustedHint
                    ? `${filteredPrompt}\n\n[Improvement note: ${retryDecision.adjustedHint}]`
                    : filteredPrompt;

                aiResult = await executeAI(routedProvider, routedApiKey, retryPrompt, {
                    model: body.model,
                    maxTokens: executionMaxTokens,
                    ...(enrichedSystemPrompt ? { systemPrompt: enrichedSystemPrompt } : {}),
                });
                if (!aiResult.success) break;

                outputValidation = validateOutput({
                    output: aiResult.output ?? '',
                    intent: body.intent!,
                    templateName: body.templateName,
                    templateCategory: template?.category,
                });
                await emitOutputSafetyTriggered(outputValidation, aiResult);
            }
        }

        if (aiResult.success && outputValidation?.decision === 'RETRY') {
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

            return NextResponse.json(
                {
                    success: false,
                    error: 'Generated response failed output validation after retry attempts.',
                    provider: routedProvider,
                    model: body.model ?? aiResult.model ?? routedProvider,
                    enforcement,
                    guardResult,
                    outputValidation: {
                        qualityHint: outputValidation.qualityHint,
                        issues: outputValidation.issues,
                        retryAttempts: retryState.attempt,
                    },
                    governanceEnvelope: govEnvelope,
                    policySnapshotId: govEnvelope.policySnapshotId,
                    governanceEvidenceReceipt: buildEvidenceReceipt({
                        envelope: govEnvelope,
                        decision: 'BLOCK',
                        riskLevel: enforcement.riskGate?.riskLevel,
                        provider: routedProvider,
                        model: body.model ?? aiResult.model ?? routedProvider,
                        routingDecision: routingResult.decision,
                        knowledgeSource,
                        knowledgeInjected,
                        knowledgeCollectionId: requestedKnowledgeCollectionId,
                        knowledgeChunkCount: retrievalResult.allowedChunkCount,
                        approvalId: approvedRequestRecord?.id,
                        validationHint: outputValidation.qualityHint,
                        aifMemoryReinjection: aifMemoryReinjection.receipt,
                        durableMemoryRead: durableMemoryRoute.receipt,
                    }),
                },
                { status: 422 },
            );
        }

        // ── POST-EXECUTION BYPASS DETECTION GUARD ──────────────────────────────
        if (aiResult.success && aiResult.output) {
            const bypassCheck = detectBypassInOutput(aiResult.output);
            if (bypassCheck.detected) {
                const bypassGuardResult = buildOutputBypassGuardResult(guardResult, bypassCheck.matchedPattern);
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Response blocked: governance bypass approval detected in model output.',
                        provider: routedProvider,
                        model: body.model ?? aiResult.model ?? 'unknown',
                        enforcement,
                        guardResult: bypassGuardResult,
                    },
                    { status: 400 },
                );
            }
        }

        return buildExecuteFinalResponse({
            aiResult: { ...aiResult, memoryAdvisoryReadout } as ExecutionResponse,
            outputValidation,
            retryState,
            request: readoutRequest,
            template,
            routeStartedAtMs,
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
            isVisionExecution,
            requestedProvider: provider,
            filteredPrompt,
            actorRoleGate,
        });
    } catch (error) {
        console.error('Execute API error:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error', provider: 'unknown', model: 'unknown' }, { status: 500 });
    }
}
