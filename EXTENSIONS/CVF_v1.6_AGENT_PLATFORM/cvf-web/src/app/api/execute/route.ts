import { NextRequest, NextResponse } from 'next/server';
import { executeAI, AIProvider, ExecutionRequest } from '@/lib/ai';
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
    return /\b(build|implement|code|develop|create files?|write code|generate code|sua code|viết code|thực thi|triển khai)\b/i.test(intent);
}

function shouldRequireSkillPreflight(input: {
    phase?: string;
    templateCategory?: string;
    intent?: string;
}): boolean {
    return isBuildPhase(input.phase)
        || input.templateCategory === 'development'
        || isBuildLikeIntent(input.intent);
}

export async function POST(request: NextRequest) {
    try {
        // AuthN: allow either session cookie or service token
        const session = await verifySessionCookie(request);
        const serviceToken = request.headers.get('x-cvf-service-token');
        const configuredServiceToken = process.env.CVF_SERVICE_TOKEN;
        const isServiceAllowed = configuredServiceToken && serviceToken === configuredServiceToken;
        if (!session && !isServiceAllowed) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: please login.' },
                { status: 401 }
            );
        }

        const rawBody = await request.json();
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

        // Rate limit by session + IP (after provider known)
        const limiter = getRateLimiter();
        const limitResult = limiter.consume(request, session?.user || 'service', body.provider);
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

        // Get provider config from environment or request
        const provider: AIProvider = body.provider ||
            (process.env.DEFAULT_AI_PROVIDER as AIProvider) || 'openai';

        // Get API key from environment
        const apiKeyMap: Record<AIProvider, string | undefined> = {
            openai: process.env.OPENAI_API_KEY,
            claude: process.env.ANTHROPIC_API_KEY,
            gemini: process.env.GOOGLE_AI_API_KEY,
            alibaba: process.env.ALIBABA_API_KEY,
            openrouter: process.env.OPENROUTER_API_KEY,
        };

        // Build the prompt from template inputs
        const userPrompt = buildPromptFromInputs(body as ExecutionRequest);

        // Safety filters
        const safety = applySafetyFilters(userPrompt);
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

        const mode = body.mode || 'simple';
        const template = body.templateId ? getTemplateById(body.templateId) : undefined;
        const specFields = template?.fields || [];
        const requiresSkillPreflight = shouldRequireSkillPreflight({
            phase: body.cvfPhase,
            templateCategory: template?.category,
            intent: body.intent,
        });
        const enforcement = evaluateEnforcement({
            mode,
            content: userPrompt,
            budgetOk: checkBudget(userPrompt),
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
            return NextResponse.json(
                {
                    success: false,
                    error: enforcement.reasons.join(' | ') || 'Execution blocked by CVF policy.',
                    provider,
                    model: 'blocked',
                    enforcement,
                    ...(guidedResponse ? { guidedResponse } : {}),
                },
                { status: 400 }
            );
        }

        if (enforcement.status === 'CLARIFY') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Spec needs clarification before execution.',
                    missing: enforcement.specGate?.missing?.map(field => field.label) || [],
                    provider,
                    model: 'clarify',
                    enforcement,
                },
                { status: 422 }
            );
        }

        if (enforcement.status === 'NEEDS_APPROVAL') {
            const guidedResponse = lookupGuidedResponse(userPrompt);
            return NextResponse.json(
                {
                    success: false,
                    error: enforcement.reasons.join(' | ') || 'Human approval required before execution.',
                    provider,
                    model: 'approval-required',
                    enforcement,
                    ...(guidedResponse ? { guidedResponse } : {}),
                },
                { status: 409 }
            );
        }

        // ── PRE-GUARDS: Run guard runtime pipeline (shared engine — Sprint 6) ──
        const guardEngine = getSharedGuardEngine();
        const guardContext = buildWebGuardContext({
            requestId: (rawBody as Record<string, unknown>).requestId as string || undefined,
            phase: body.cvfPhase,
            riskLevel: body.cvfRiskLevel,
            role: isServiceAllowed ? 'OPERATOR' : 'HUMAN',
            userRole: isServiceAllowed ? 'admin' : session?.role,
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
                },
                { status: 409 }
            );
        }

        // Use router-selected provider (may differ from requested if default was ineligible)
        const routedProvider: AIProvider = routingResult.selectedProvider ?? provider;
        const routedApiKey = apiKeyMap[routedProvider];

        if (!routedApiKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: `API key not configured for provider: ${routedProvider}. Please set the corresponding environment variable.`,
                    provider: routedProvider,
                    model: 'not configured',
                },
                { status: 400 }
            );
        }

        // ── EXECUTE AI with auto-retry on output validation failure ──
        let aiResult = await executeAI(routedProvider, routedApiKey, userPrompt, {
            model: body.model,
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
                const retryDecision = shouldRetry(outputValidation, retryState);
                if (!retryDecision.retry) break;

                retryState.previousIssues = [...outputValidation.issues];
                retryState.attempt++;

                const retryPrompt = retryDecision.adjustedHint
                    ? `${userPrompt}\n\n[Improvement note: ${retryDecision.adjustedHint}]`
                    : userPrompt;

                aiResult = await executeAI(routedProvider, routedApiKey, retryPrompt, {
                    model: body.model,
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

        return NextResponse.json({
            ...aiResult,
            enforcement,
            guardResult,
            providerRouting: {
                decision: routingResult.decision,
                selectedProvider: routingResult.selectedProvider,
                rationale: routingResult.rationale,
            },
            outputValidation: outputValidation ? {
                qualityHint: outputValidation.qualityHint,
                issues: outputValidation.issues,
                retryAttempts: retryState.attempt,
            } : undefined,
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

// Build prompt from template inputs
function buildPromptFromInputs(request: ExecutionRequest): string {
    const { templateName, inputs, intent } = request;

    let prompt = `## Task: ${templateName}\n\n`;
    prompt += `### User Intent\n${intent}\n\n`;
    prompt += `### Input Data\n`;

    for (const [key, value] of Object.entries(inputs)) {
        if (value && value.trim()) {
            // Convert camelCase/snake_case to readable label
            const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/_/g, ' ')
                .replace(/^\s/, '')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

            prompt += `\n**${label}:**\n${value}\n`;
        }
    }

    prompt += `\n---\n\n`;
    prompt += `Please analyze the above information and provide a comprehensive, structured response following CVF guidelines.`;

    return prompt;
}
