import { NextRequest, NextResponse } from 'next/server';
import { executeAI, AIProvider, ExecutionRequest } from '@/lib/ai';
import { evaluateEnforcement } from '@/lib/enforcement';
import { getTemplateById } from '@/lib/templates';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { applySafetyFilters } from '@/lib/safety';
import { getRateLimiter } from '@/lib/rate-limit';
import { checkBudget } from '@/lib/budget';

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
        };

        const apiKey = apiKeyMap[provider];

        if (!apiKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: `API key not configured for provider: ${provider}. Please set the corresponding environment variable.`,
                    provider,
                    model: 'not configured',
                },
                { status: 400 }
            );
        }

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
        const enforcement = evaluateEnforcement({
            mode,
            content: userPrompt,
            budgetOk: checkBudget(userPrompt),
            specFields: specFields.length ? specFields : undefined,
            specValues: body.inputs,
        });

        if (enforcement.status === 'BLOCK') {
            return NextResponse.json(
                {
                    success: false,
                    error: enforcement.reasons.join(' | ') || 'Execution blocked by CVF policy.',
                    provider,
                    model: 'blocked',
                    enforcement,
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
            return NextResponse.json(
                {
                    success: false,
                    error: enforcement.reasons.join(' | ') || 'Human approval required before execution.',
                    provider,
                    model: 'approval-required',
                    enforcement,
                },
                { status: 409 }
            );
        }

        // Execute AI request
        const result = await executeAI(provider, apiKey, userPrompt);

        return NextResponse.json({ ...result, enforcement });

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
