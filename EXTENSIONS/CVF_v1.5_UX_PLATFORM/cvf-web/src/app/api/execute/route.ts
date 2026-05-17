import { NextRequest, NextResponse } from 'next/server';
import { executeAI, AIProvider, ExecutionRequest } from '@/lib/ai';

export async function POST(request: NextRequest) {
    try {
        const body: ExecutionRequest = await request.json();

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
        const userPrompt = buildPromptFromInputs(body);

        // Execute AI request
        const result = await executeAI(provider, apiKey, userPrompt);

        return NextResponse.json(result);

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
