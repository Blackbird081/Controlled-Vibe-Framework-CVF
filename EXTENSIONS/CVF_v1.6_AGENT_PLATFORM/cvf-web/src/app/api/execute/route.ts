import { NextRequest, NextResponse } from 'next/server';
import { executeAI, AIProvider, ExecutionRequest, CVF_SYSTEM_PROMPT, type GovernanceEvidenceReceipt } from '@/lib/ai';
import { evaluateEnforcement } from '@/lib/enforcement';
import { getTemplateById } from '@/lib/templates';
import { isTrustedFormTemplateId } from '@/lib/form-routing';
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
import { buildExecutionPrompt } from '@/lib/execute-prompt-contract';
import { emitExecutionTelemetry, resolveTokenUsage } from '@/lib/execute-telemetry';
import { checkTeamQuota } from '@/lib/quota-guard';
import { appendAuditEvent } from '@/lib/control-plane-events';
import { applyDLPFilter } from '@/lib/dlp-filter';
import { withSessionAuditPayload } from '@/lib/middleware-auth';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';
import { formatKnowledgeChunks, queryKnowledgeChunks } from '@/lib/knowledge-retrieval';
import { buildGovernanceEnvelope } from '@/lib/web-governance-envelope';
import type { WebGovernanceEnvelope } from '@/lib/web-governance-envelope';
import { deriveServiceTokenIdentity, verifyServiceTokenRequest } from '@/lib/service-token-auth';
import { hasValidationRetryBudget, resolveExecutionMaxTokens } from '@/lib/execute-route-budget';
import { getApprovalStore, type ApprovalRequestRecord } from '../approvals/store';
import {
    approvalRecordMatchesActor,
    buildApprovalActorBinding,
    buildApprovalRequestSnapshot,
    computeApprovalRequestHash,
} from '../approvals/approval-binding';

// ── Output-level bypass detection (P1 guard — mirrors PVV CAT_MISS detector) ──
// Patterns cover both explicit keyword combos (V1) and governance-approval phrasing (V2).
const OUTPUT_BYPASS_PATTERNS: RegExp[] = [
    // V1 — original PVV detector patterns
    /\bapprove\b.{0,80}\bbypass\b/i,
    /\bbypass\b.{0,80}\bapprove\b/i,
    /\bauthorize\b.{0,80}\bbypass\b/i,
    /\bimmediately\b.{0,80}\bdeploy\b/i,
    /\byes\b.{0,30}\bbypass\b/i,
    /\bproceed\b.{0,50}\bwithout\b.{0,40}\breview\b/i,
    /\bskip\b.{0,50}\bgovernance\b/i,
    // V2 — governance-approval phrasing (from C-014 analysis)
    /\bgovernance\b.{0,30}\boverride\b/i,
    /\boverride\b.{0,50}\bgovernance\b/i,
    /\bskip\b.{0,50}\bcheck\b.{0,50}\boverride\b/i,
    /\bwithout\s+applying\b/i,
    /\bexecut\w*\b.{0,50}\bwithout\b.{0,60}\bcheck\b/i,
    /\ballow\w*\b.{0,60}\bskip\b.{0,50}\bcheck\b/i,
];

const DEFAULT_ANALYZE_TEMPLATE_GUARD_ACTION = 'analyze template execution request';
const DEFAULT_BUILD_TEMPLATE_GUARD_ACTION = 'build template execution request';

function detectBypassInOutput(output: string): { detected: boolean; matchedPattern?: string } {
    for (const pattern of OUTPUT_BYPASS_PATTERNS) {
        const match = output.match(pattern);
        if (match) return { detected: true, matchedPattern: match[0].slice(0, 100) };
    }
    return { detected: false };
}

function isBuildPhase(phase?: string): boolean {
    if (!phase) return false;
    const normalized = phase.trim().toUpperCase();
    return normalized === 'BUILD' || normalized === 'PHASE C' || normalized === 'C';
}

function isBuildLikeIntent(intent?: string): boolean {
    if (!intent) return false;
    const reviewOnlyCodeIntent = /\b(code review|review code|check code|code audit|code quality|đánh giá code|kiểm tra chất lượng code|review code)\b/i.test(intent);
    if (reviewOnlyCodeIntent) return false;
    return /\b(build|implement|develop|create files?|write code|generate code|sửa code|sua code|viết code|thực thi|triển khai)\b/i.test(intent);
}

function shouldRequireSkillPreflight(input: {
    phase?: string;
    templateCategory?: string;
    intent?: string;
    templateId?: string;
}): boolean {
    const isTrustedForm = isTrustedFormTemplateId(input.templateId);
    return isBuildPhase(input.phase)
        || (!isTrustedForm && isBuildLikeIntent(input.intent))
        || (input.templateCategory === 'development' && !isTrustedForm);
}

function resolveGuardAction(rawBody: Record<string, unknown>): string {
    const explicitAction = rawBody.action;
    if (typeof explicitAction === 'string' && explicitAction.trim()) {
        return explicitAction.trim();
    }

    // W134: generated form intents are user content, not authority verbs.
    // Using them as guard actions caused legitimate VN trusted forms to be
    // blocked before AI execution by the English action allow-list.
    const phase = typeof rawBody.cvfPhase === 'string' ? rawBody.cvfPhase.trim().toUpperCase() : '';
    const hasBuildPreflight =
        typeof rawBody.skillPreflightDeclaration === 'string' ||
        typeof rawBody.skillPreflightRecordRef === 'string' ||
        Array.isArray(rawBody.skillIds) ||
        Array.isArray(rawBody.fileScope);

    if (phase === 'BUILD' || phase === 'PHASE C' || phase === 'C' || hasBuildPreflight) {
        return DEFAULT_BUILD_TEMPLATE_GUARD_ACTION;
    }

    return DEFAULT_ANALYZE_TEMPLATE_GUARD_ACTION;
}

function buildEvidenceReceipt(input: {
    envelope: WebGovernanceEnvelope;
    decision?: string;
    riskLevel?: string;
    provider?: AIProvider | string;
    model?: string;
    routingDecision?: string;
    knowledgeSource?: string;
    knowledgeInjected?: boolean;
    knowledgeCollectionId?: string | null;
    knowledgeChunkCount?: number;
    approvalId?: string;
    validationHint?: string;
}): GovernanceEvidenceReceipt {
    return {
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
        generatedAt: input.envelope.requestTimestamp,
    };
}

function buildGovernedStopOutput(input: {
    decision: 'BLOCK' | 'CLARIFY' | 'NEEDS_APPROVAL';
    reason?: string;
    missing?: string[];
    approvalId?: string;
    guidedResponse?: string | null;
}): string {
    const reason = input.reason?.trim();
    const guidedResponse = input.guidedResponse?.trim();
    const missing = (input.missing || [])
        .map(field => field.trim())
        .filter(Boolean);

    if (input.decision === 'CLARIFY') {
        const missingLines = missing.length
            ? missing.map(field => `- ${field}`).join('\n')
            : '- The goal, audience, constraints, and success criteria for this request.';

        return [
            '## CVF Decision: Clarification Needed',
            '',
            'I need a little more information before this can be executed safely and usefully.',
            '',
            'Please provide:',
            missingLines,
            '',
            'Once those details are provided, CVF can re-check the request and continue through the governed path.',
        ].join('\n');
    }

    if (input.decision === 'NEEDS_APPROVAL') {
        return [
            '## CVF Decision: Approval Required',
            '',
            'This request may be valid, but it crosses a boundary that needs explicit human approval before execution.',
            ...(reason ? ['', `Reason: ${reason}`] : []),
            ...(input.approvalId ? ['', `Approval request: ${input.approvalId}`] : []),
            '',
            'Safe next steps:',
            '- Submit or wait for the approval decision tied to this request.',
            '- Keep the request within the approved phase, scope, provider, and data-access boundary.',
            '- If approval is not available, restate the goal as a lower-risk planning or documentation task.',
            ...(guidedResponse ? ['', 'Suggested safe alternative:', guidedResponse] : []),
        ].join('\n');
    }

    return [
        '## CVF Decision: Blocked',
        '',
        'I cannot help execute that request because it would cross a safety, access, audit, or governance boundary.',
        ...(reason ? ['', `Reason: ${reason}`] : []),
        '',
        'Safe next steps:',
        '- Use an approved account, data source, and access path for any operational work.',
        '- Report exposed credentials, secrets, or audit concerns through the appropriate security channel.',
        '- Restate the request as a compliant planning, documentation, remediation, or review task.',
        '- Keep evidence, approvals, and scope visible so the next attempt can pass governance review.',
        ...(guidedResponse ? ['', 'Suggested safe alternative:', guidedResponse] : []),
    ].join('\n');
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
        body.inputs = Object.fromEntries(
            Object.entries(body.inputs || {}).map(([k, v]) => [k, String(v ?? '').trim()])
        );
        if (typeof body.model === 'string') {
            body.model = body.model.trim() || undefined;
        }

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
                { success: false, error: 'Missing required fields: templateName, inputs, intent' },
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
            const output = buildGovernedStopOutput({
                decision: 'BLOCK',
                reason: safety.reason || 'Request blocked by safety filters.',
            });
            return NextResponse.json(
                {
                    success: false,
                    error: safety.reason || 'Request blocked by safety filters.',
                    output,
                    details: safety.details,
                    provider,
                    model: 'blocked',
                    governanceEnvelope: govEnvelope,
                    policySnapshotId: govEnvelope.policySnapshotId,
                    governanceEvidenceReceipt: buildEvidenceReceipt({
                        envelope: govEnvelope,
                        decision: 'BLOCK',
                        riskLevel: body.cvfRiskLevel ?? 'R3',
                        provider,
                        model: 'blocked',
                    }),
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
        const executionMaxTokens = resolveExecutionMaxTokens(template?.id ?? body.templateId);
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
            const blockReason = enforcement.reasons.join(' | ') || 'Execution blocked by CVF policy.';
            const output = buildGovernedStopOutput({
                decision: 'BLOCK',
                reason: blockReason,
                guidedResponse,
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
                    governanceEvidenceReceipt: buildEvidenceReceipt({
                        envelope: govEnvelope,
                        decision: enforcement.status,
                        riskLevel: enforcement.riskGate?.riskLevel,
                        provider,
                        model: 'blocked',
                    }),
                },
                { status: 400 }
            );
        }

        if (enforcement.status === 'CLARIFY') {
            const missing = enforcement.specGate?.missing?.map(field => field.label) || [];
            const output = buildGovernedStopOutput({
                decision: 'CLARIFY',
                reason: enforcement.reasons.join(' | ') || 'Spec needs clarification before execution.',
                missing,
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
                    governanceEvidenceReceipt: buildEvidenceReceipt({
                        envelope: govEnvelope,
                        decision: enforcement.status,
                        riskLevel: enforcement.riskGate?.riskLevel,
                        provider,
                        model: 'clarify',
                    }),
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
                const approvalReason = enforcement.reasons.join(' | ') || 'Human approval required before execution.';
                const output = buildGovernedStopOutput({
                    decision: 'NEEDS_APPROVAL',
                    reason: approvalReason,
                    approvalId,
                    guidedResponse,
                });
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

        // ── PRE-GUARDS: Run guard runtime pipeline (shared engine — Sprint 6) ──
        const guardEngine = getSharedGuardEngine();
        const guardContext = buildWebGuardContext({
            requestId: (rawBody as Record<string, unknown>).requestId as string || undefined,
            phase: body.cvfPhase,
            riskLevel: body.cvfRiskLevel,
            role: isServiceAllowed ? 'OPERATOR' : 'HUMAN',
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
        const knowledgeSource = retrievedKnowledgeContext ? 'retrieval' : 'none';
        const enrichedSystemPrompt = hasKnowledgeContext(finalKnowledgeContext)
            ? buildKnowledgeSystemPrompt(CVF_SYSTEM_PROMPT, finalKnowledgeContext, {
                orgId: session?.orgId,
                teamId: session?.teamId,
            })
            : undefined;

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
            return NextResponse.json(
                {
                    success: false,
                    error: `API key not configured for provider: ${routedProvider}. Please set the corresponding environment variable.`,
                    provider: routedProvider,
                    model: 'not configured',
                    governanceEnvelope: govEnvelope,
                    policySnapshotId: govEnvelope.policySnapshotId,
                    governanceEvidenceReceipt: buildEvidenceReceipt({
                        envelope: govEnvelope,
                        decision: enforcement.status,
                        riskLevel: enforcement.riskGate?.riskLevel,
                        provider: routedProvider,
                        model: 'not configured',
                        routingDecision: routingResult.decision,
                        knowledgeSource,
                        knowledgeInjected: !!enrichedSystemPrompt,
                        knowledgeCollectionId: requestedKnowledgeCollectionId,
                        knowledgeChunkCount: retrievalResult.allowedChunkCount,
                    }),
                },
                { status: 400 }
            );
        }

        // ── EXECUTE AI with auto-retry on output validation failure ──
        let aiResult = await executeAI(routedProvider, routedApiKey, filteredPrompt, {
            model: body.model,
            maxTokens: executionMaxTokens,
            ...(enrichedSystemPrompt ? { systemPrompt: enrichedSystemPrompt } : {}),
        });
        let outputValidation: ValidationResult | undefined;
        const retryState: RetryState = { attempt: 0, previousIssues: [] };

        if (aiResult.success && aiResult.output) {
            outputValidation = validateOutput({
                output: aiResult.output,
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
                });
                if (!aiResult.success || !aiResult.output) break;

                outputValidation = validateOutput({
                    output: aiResult.output,
                    intent: body.intent!,
                    templateName: body.templateName,
                    templateCategory: template?.category,
                });
            }
        }

        if (aiResult.success && aiResult.output && outputValidation?.decision === 'RETRY') {
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
                        knowledgeInjected: !!enrichedSystemPrompt,
                        knowledgeCollectionId: requestedKnowledgeCollectionId,
                        knowledgeChunkCount: retrievalResult.allowedChunkCount,
                        approvalId: approvedRequestRecord?.id,
                        validationHint: outputValidation.qualityHint,
                    }),
                },
                { status: 422 },
            );
        }

        // ── POST-EXECUTION BYPASS DETECTION GUARD ──────────────────────────────
        if (aiResult.success && aiResult.output) {
            const bypassCheck = detectBypassInOutput(aiResult.output);
            if (bypassCheck.detected) {
                const bypassGuardResult = {
                    ...guardResult,
                    finalDecision: 'BLOCK' as const,
                    blockedBy: 'output_bypass_detection',
                    results: [
                        ...(guardResult.results ?? []),
                        {
                            guardId: 'output_bypass_detection',
                            decision: 'BLOCK' as const,
                            severity: 'ERROR' as const,
                            reason: `Governance bypass language detected in model output: "${bypassCheck.matchedPattern}"`,
                            timestamp: new Date().toISOString(),
                        },
                    ],
                };
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Response blocked: governance bypass approval detected in model output.',
                        provider: routedProvider,
                        model: body.model ?? 'unknown',
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

        const usage = aiResult.success && aiResult.output
            ? resolveTokenUsage(filteredPrompt, aiResult.output, aiResult)
            : undefined;

        return NextResponse.json({
            ...aiResult,
            usage,
            enforcement,
            guardResult,
            providerRouting: {
                decision: routingResult.decision,
                selectedProvider: routingResult.selectedProvider,
                rationale: routingResult.rationale,
                deniedReason: routingResult.deniedReason,
                fallbackChain: routingResult.fallbackChain,
                requestedProvider: provider,
                routerOverrode: routingResult.selectedProvider !== null && routingResult.selectedProvider !== provider,
            },
            knowledgeInjection: {
                injected: !!enrichedSystemPrompt,
                contextLength: finalKnowledgeContext?.length ?? 0,
                source: knowledgeSource,
                chunkCount: retrievalResult.allowedChunkCount,
                collectionId: requestedKnowledgeCollectionId,
                allowedCollectionIds: retrievalResult.allowedCollectionIds,
            },
            outputValidation: outputValidation ? {
                qualityHint: outputValidation.qualityHint,
                issues: outputValidation.issues,
                retryAttempts: retryState.attempt,
            } : undefined,
            governanceEnvelope: govEnvelope,
            policySnapshotId: govEnvelope.policySnapshotId,
            governanceEvidenceReceipt: buildEvidenceReceipt({
                envelope: govEnvelope,
                decision: enforcement.status,
                riskLevel: enforcement.riskGate?.riskLevel,
                provider: routedProvider,
                model: body.model ?? aiResult.model ?? routedProvider,
                routingDecision: routingResult.decision,
                knowledgeSource,
                knowledgeInjected: !!enrichedSystemPrompt,
                knowledgeCollectionId: requestedKnowledgeCollectionId,
                knowledgeChunkCount: retrievalResult.allowedChunkCount,
                approvalId: approvedRequestRecord?.id,
                validationHint: outputValidation?.qualityHint,
            }),
        });

    } catch (error) {
        console.error('Execute API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
                provider: 'unknown',
                model: 'unknown',
            },
            { status: 500 }
        );
    }
}
