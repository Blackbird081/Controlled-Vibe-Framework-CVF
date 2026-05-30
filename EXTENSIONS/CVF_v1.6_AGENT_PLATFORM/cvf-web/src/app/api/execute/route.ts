import { NextRequest, NextResponse } from 'next/server';
import { executeAI, CVF_SYSTEM_PROMPT, type AIProvider, type ExecutionRequest, type ExecutionResponse } from '@/lib/ai';
import { evaluateEnforcement } from '@/lib/enforcement';
import { getTemplateById } from '@/lib/templates';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { applySafetyFilters } from '@/lib/safety';
import { getRateLimiter } from '@/lib/rate-limit';
import { checkBudget } from '@/lib/budget';
import { buildWebGuardContext, type GuardPipelineResult } from '@/lib/guard-runtime-adapter';
import { getSharedGuardEngine } from '@/lib/guard-engine-singleton';
import { validateOutput, shouldRetry, type ValidationResult, type RetryState } from '@/lib/output-validator';
import { routeWebProvider } from '@/lib/ai/provider-router-adapter';
import { lookupGuidedResponse } from './guided.response.registry';
import { buildKnowledgeSystemPrompt, hasKnowledgeContext } from '@/lib/knowledge-context-injector';
import { buildAifMemoryReinjectionSystemPrompt, evaluateAifMemoryReinjection } from '@/lib/aif-memory-reinjection';
import { appendAifMemoryReinjectionAudit, buildAifMemoryReinjectionDeniedResponse } from '@/lib/aif-memory-reinjection-route';
import { buildExecutionPrompt } from '@/lib/execute-prompt-contract';
import { emitExecutionTelemetry, resolveTokenUsage } from '@/lib/execute-telemetry';
import { checkTeamQuota } from '@/lib/quota-guard';
import { appendAuditEvent } from '@/lib/control-plane-events';
import { applyDLPFilter } from '@/lib/dlp-filter';
import { withSessionAuditPayload } from '@/lib/middleware-auth';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';
import { formatKnowledgeChunks, queryKnowledgeChunks } from '@/lib/knowledge-retrieval';
import { buildEvidenceReceipt, buildGovernanceEnvelope } from '@/lib/web-governance-envelope';
import { deriveServiceTokenIdentity, verifyServiceTokenRequest } from '@/lib/service-token-auth';
import { hasValidationRetryBudget, resolveExecutionMaxTokens } from '@/lib/execute-route-budget';
import { recordReportableDecisionObserved } from '@/lib/false-positive-report';
import { buildPhase2CProductBriefSliceForRoute } from '@/lib/phase2c-product-brief-slice';
import { buildPhase3EOperationalMetricsForRoute } from '@/lib/phase3e-operational-emission';
import { buildWorkflowExecutionProjection, resolveWorkflowBindingForExecution } from '@/lib/workflows/workflow-resolver';
import { buildRouteAuditMemoryCapture } from '@/lib/audit-memory-receipt';
import { buildRouteRequestContextReadout } from '@/lib/route-request-context-readout';
import { buildVerticalIntegrationReadout } from '@/lib/vertical-integration-readout'; import { buildSpecFirstMediationReadout } from '@/lib/spec-first-mediation'; import { buildEnglishSpecFreezeReadout } from '@/lib/spec-english-freeze'; import { buildVi5LanguageReadout } from '@/lib/vi5-language-readout';
import { buildPipelineChainReadout } from '@/lib/pipeline-chain-readout';
import { buildWorkerTimeoutReadout } from '@/lib/worker-timeout-handler';
import { buildReviewerDeadlockReadout } from '@/lib/reviewer-deadlock-handler';
import { buildContextBudgetReadout } from '@/lib/context-budget-readout';
import { buildDurableMemorySystemPrompt, evaluateDurableMemoryRoute, evaluateDurableMemoryWrite, resolveDurableMemoryActorRole } from '@/lib/durable-memory-route';
import { buildRoleOutputDeniedResponse, buildRolePermissionDeniedResponse } from '@/lib/execute-role-permission-gate';
import { buildExecutionIdentityDecision } from '@/lib/execution-identity';
import { evaluateExecutionActorRoleGate, resolveExecutionCVFRole, resolveExecutionOutputClass } from '@/lib/execute-role-resolver';
import { buildOutputBypassGuardResult, checkRoleOutputPermission, detectBypassInOutput, resolveGuardAction, shouldRequireSkillPreflight } from '@/lib/execute-route-guards';
import { attachReceiptToDiagnostic, buildExecutionDiagnostic } from '@/lib/execution-diagnostics';
import { getApprovalStore, type ApprovalRequestRecord } from '../approvals/store';
import { approvalRecordMatchesActor, buildApprovalActorBinding, buildApprovalRequestSnapshot, computeApprovalRequestHash } from '../approvals/approval-binding';
import { executeVisionRouteRequest, prepareVisionRouteRequest } from './vision-route-helper';
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
        const limitResult = limiter.consume(request, limitIdentity, body.provider);
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
        if (!session && isServiceAllowed && typeof body.knowledgeContext === 'string' && body.knowledgeContext.trim()) {
            await appendAuditEvent({
                eventType: 'INLINE_KNOWLEDGE_CONTEXT_BLOCKED',
                actorId: 'service-account',
                actorRole: 'service',
                targetResource: body.templateName || body.templateId || 'unknown-template',
                action: 'BLOCK_INLINE_KNOWLEDGE_CONTEXT',
                riskLevel: body.cvfRiskLevel ?? 'R2',
                phase: body.cvfPhase ?? 'PHASE D',
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
        // Safety filters
        const safety = applySafetyFilters(filteredPrompt);
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
        const enforcement = evaluateEnforcement({
            mode,
            content: filteredPrompt,
            budgetOk: checkBudget(filteredPrompt),
            specFields: specFields.length ? specFields : undefined,
            specValues: body.inputs,
            cvfPhase: body.cvfPhase,
            cvfRiskLevel: body.cvfRiskLevel,
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

        // ── KNOWLEDGE RETRIEVAL + TENANT PARTITION ENFORCEMENT ────────────────────
        const retrievalResult = await queryKnowledgeChunks({
            intent: body.intent!,
            orgId: session?.orgId,
            teamId: session?.teamId,
            collectionId: typeof body.knowledgeCollectionId === 'string' ? body.knowledgeCollectionId : undefined,
        });
        const retrievedKnowledgeContext = formatKnowledgeChunks(retrievalResult.chunks);
        const finalKnowledgeContext = retrievedKnowledgeContext ?? undefined;
        const requestedKnowledgeCollectionId =
            typeof body.knowledgeCollectionId === 'string' && body.knowledgeCollectionId.trim()
                ? body.knowledgeCollectionId.trim()
                : null;
        const knowledgeInjected = hasKnowledgeContext(finalKnowledgeContext);
        const knowledgeSource = knowledgeInjected ? 'retrieval' : 'none';
        const knowledgeSystemPrompt = knowledgeInjected
            ? buildKnowledgeSystemPrompt(CVF_SYSTEM_PROMPT, finalKnowledgeContext, { orgId: session?.orgId, teamId: session?.teamId })
            : CVF_SYSTEM_PROMPT;
        const durableMemoryRoute = evaluateDurableMemoryRoute({ request: body, actorId: executionActorId, actorRole: resolveDurableMemoryActorRole(resolvedExecutionRole.role), defaultQuery: body.intent! });
        const durableMemorySystemPrompt = durableMemoryRoute.promptBlock ? buildDurableMemorySystemPrompt(knowledgeSystemPrompt, durableMemoryRoute.promptBlock) : knowledgeSystemPrompt;
        const aifMemoryReinjection = evaluateAifMemoryReinjection(body.aifMemoryReinjection);
        await appendAifMemoryReinjectionAudit({ decision: aifMemoryReinjection, request: body, session });

        if (aifMemoryReinjection.status === 'denied') {
            return buildAifMemoryReinjectionDeniedResponse({ decision: aifMemoryReinjection, envelope: govEnvelope, enforcement, guardResult, provider: routedProvider, routingResult, knowledgeSource, knowledgeInjected, knowledgeCollectionId: requestedKnowledgeCollectionId, knowledgeChunkCount: retrievalResult.allowedChunkCount });
        }

        const enrichedSystemPrompt = aifMemoryReinjection.promptBlock ? buildAifMemoryReinjectionSystemPrompt(durableMemorySystemPrompt, aifMemoryReinjection.promptBlock) : knowledgeInjected || durableMemoryRoute.injected ? durableMemorySystemPrompt : undefined;

        if (retrievalResult.droppedChunkCount > 0) {
            await appendAuditEvent({
                eventType: 'KNOWLEDGE_SCOPE_FILTER_APPLIED',
                actorId: session?.userId ?? 'service-account',
                actorRole: session?.role ?? 'service',
                targetResource: body.templateName || body.templateId || 'unknown-template',
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

        if (aiResult.success && !isVisionExecution) {
            outputValidation = validateOutput({
                output: aiResult.output ?? '',
                intent: body.intent!,
                templateName: body.templateName,
                templateCategory: template?.category,
            });

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

        if (aiResult.success && aiResult.output) {
            try {
                await emitExecutionTelemetry({
                    session,
                    request: body,
                    prompt: filteredPrompt,
                    output: aiResult.output,
                    provider: routedProvider,
                    model: body.model ?? aiResult.model ?? routedProvider,
                    response: aiResult,
                });
            } catch (telemetryError) {
                console.warn('Execution telemetry degraded:', telemetryError);
            }
        }

        const usage = aiResult.success && aiResult.output ? resolveTokenUsage(filteredPrompt, aiResult.output, aiResult) : undefined;
        const durableMemoryWriteReceipt = aiResult.success && aiResult.output
            ? evaluateDurableMemoryWrite({ request: body, actorId: executionActorId, actorRole: resolveDurableMemoryActorRole(resolvedExecutionRole.role), output: aiResult.output })
            : undefined;

        const governanceEvidenceReceipt = buildEvidenceReceipt({
            envelope: govEnvelope,
            decision: enforcement.status,
            riskLevel: enforcement.riskGate?.riskLevel,
            provider: routedProvider,
            model: body.model ?? aiResult.model ?? routedProvider,
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
        });
        if (isVisionExecution) governanceEvidenceReceipt.vision = true;
        const executionDiagnostic = !aiResult.success ? attachReceiptToDiagnostic(aiResult.diagnostic, buildExecutionDiagnostic({ stage: 'provider', class: 'unknown_error', provider: routedProvider, model: body.model ?? aiResult.model ?? routedProvider, latencyMs: aiResult.executionTime }), governanceEvidenceReceipt.receiptId, governanceEvidenceReceipt.envelopeId) : aiResult.success && !aiResult.output ? buildExecutionDiagnostic({ stage: 'provider', class: 'provider_empty_output', provider: routedProvider, model: body.model ?? aiResult.model ?? routedProvider, latencyMs: aiResult.executionTime, receiptId: governanceEvidenceReceipt.receiptId, traceId: governanceEvidenceReceipt.envelopeId }) : undefined;
        const workflowExecution = aiResult.success && workflowBinding ? buildWorkflowExecutionProjection(workflowBinding, governanceEvidenceReceipt.receiptId) : undefined;
        if (workflowExecution) {
            await appendAuditEvent({
                eventType: 'WORKFLOW_BINDING_EXECUTED',
                actorId: session?.userId ?? 'service-account',
                actorRole: session?.role ?? (isServiceAllowed ? 'service' : 'unknown'),
                targetResource: body.templateName || body.templateId || workflowExecution.templateId,
                action: 'EMIT_WORKFLOW_STEP_TRACES',
                riskLevel: body.cvfRiskLevel ?? enforcement.riskGate?.riskLevel ?? 'R1',
                phase: body.cvfPhase ?? 'PHASE E',
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
        const phase2cProductBrief = aiResult.success && aiResult.output
            ? buildPhase2CProductBriefSliceForRoute({
                responseSuccess: aiResult.success,
                templateId: executionTemplateId,
                templateName: template?.name ?? body.templateName,
                category: template?.category,
                inputs: body.inputs || {},
                intent: body.intent || '',
                output: aiResult.output,
                evidenceReceipt: governanceEvidenceReceipt,
                validation: outputValidation ? {
                    qualityHint: outputValidation.qualityHint,
                    issues: outputValidation.issues,
                } : undefined,
            })
            : undefined;
        const phase3eOperationalMetrics = buildPhase3EOperationalMetricsForRoute({
            phase2cProductBrief,
            evidenceReceipt: governanceEvidenceReceipt,
            responseSuccess: aiResult.success,
        });
        const { auditMemoryReceipt, auditEventPayload } = buildRouteAuditMemoryCapture({
            governanceReceiptId: governanceEvidenceReceipt.receiptId,
            actorId: session?.userId ?? (isServiceAllowed ? 'service-account' : 'unknown-actor'),
            actorRole: resolvedExecutionRole.role ?? (isServiceAllowed ? 'service' : 'unknown'),
            sessionId: session?.userId ?? (isServiceAllowed ? serviceIdentity ?? undefined : undefined),
            sessionRole: session?.role ?? (isServiceAllowed ? 'service' : undefined),
            templateId: executionTemplateId,
            templateName: body.templateName || body.templateId,
            workflowId: workflowExecution?.workflowId,
            provider: routedProvider,
            model: body.model ?? aiResult.model ?? routedProvider,
            decision: enforcement.status,
            stepTraceIds: workflowExecution?.stepTraces.map((trace) => trace.stepId) ?? [],
            rolePermission: { role: resolvedExecutionRole.role, permissionRole: rolePermission.role, outputClass: rolePermission.outputClass, allowed: rolePermission.allowed },
            riskLevel: body.cvfRiskLevel ?? enforcement.riskGate?.riskLevel,
            phase: body.cvfPhase,
        });
        await appendAuditEvent({ ...auditEventPayload, payload: withSessionAuditPayload(session, { ...auditEventPayload.payload, actor_role_gate_result: actorRoleGate.result, executionIdentity }) });
        const requestContextReadout = buildRouteRequestContextReadout({ request: body, knowledgeContextLength: finalKnowledgeContext?.length ?? 0, retrievedChunkCount: retrievalResult.allowedChunkCount, chainTurnIndex: body.verticalIntegrationChain?.turnIndex });
        const verticalIntegrationReadout = buildVerticalIntegrationReadout({ evidenceReceipt: governanceEvidenceReceipt, workflowExecution, auditMemoryReceipt, requestContextReadout, phase2cProductBrief, phase3eOperationalMetrics, chainRequest: body.verticalIntegrationChain, actorId: session?.userId ?? (isServiceAllowed ? 'service-account' : 'unknown-actor'), templateId: executionTemplateId });
        const specFirstMediation = buildSpecFirstMediationReadout({ request: body, template, routeOutcome: { success: aiResult.success, provider: routedProvider, model: body.model ?? aiResult.model ?? routedProvider, decision: enforcement.status, receipt: { receiptId: governanceEvidenceReceipt.receiptId, envelopeId: governanceEvidenceReceipt.envelopeId }, rawTechnicalEvidenceAvailable: true } }); const englishSpecFreeze = buildEnglishSpecFreezeReadout({ request: body, specFirstMediation, providerOutput: aiResult.output });
        const pipelineChainReadout = buildPipelineChainReadout(body.intent ?? '');
        const workerTimeoutReadout = buildWorkerTimeoutReadout(Date.now() - routeStartedAtMs);
        const reviewerDeadlockReadout = buildReviewerDeadlockReadout(); const contextBudgetReadout = buildContextBudgetReadout(resolvedExecutionRole.permissionRole ?? 'OPERATOR');
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
                requestedProvider: provider,
                routerOverrode: routingResult.selectedProvider !== null && routingResult.selectedProvider !== provider,
            },
            knowledgeInjection: { injected: knowledgeInjected, contextLength: finalKnowledgeContext?.length ?? 0, source: knowledgeSource, chunkCount: retrievalResult.allowedChunkCount, collectionId: requestedKnowledgeCollectionId, allowedCollectionIds: retrievalResult.allowedCollectionIds },
            aifMemoryReinjection: aifMemoryReinjection.receipt, durableMemoryRead: durableMemoryRoute.receipt, durableMemoryWriteReceipt,
            outputValidation: outputValidation ? {
                qualityHint: outputValidation.qualityHint,
                issues: outputValidation.issues,
                retryAttempts: retryState.attempt,
            } : undefined,
            governanceEnvelope: govEnvelope,
            policySnapshotId: govEnvelope.policySnapshotId,
            governanceEvidenceReceipt,
            ...(executionDiagnostic ? { diagnostic: executionDiagnostic } : {}),
            auditMemoryReceipt,
            requestContextReadout, verticalIntegrationReadout, specFirstMediation, englishSpecFreeze,
            ...buildVi5LanguageReadout({ request: body, specFirstMediation, englishSpecFreeze, workflowId: workflowExecution?.workflowId }),
            ...(workflowExecution ? workflowExecution : {}),
            ...(phase2cProductBrief ? { phase2cProductBrief } : {}), ...(phase3eOperationalMetrics ? { phase3eOperationalMetrics } : {}),
            pipelineChainReadout,
            workerTimeoutReadout,
            reviewerDeadlockReadout,
            contextBudgetReadout,
        });
    } catch (error) {
        console.error('Execute API error:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error', provider: 'unknown', model: 'unknown' }, { status: 500 });
    }
}
