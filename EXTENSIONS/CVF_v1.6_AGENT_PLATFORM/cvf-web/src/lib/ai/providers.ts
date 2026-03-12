import { AIConfig, ExecutionResponse, AIProvider, DEFAULT_MODELS, CVF_SYSTEM_PROMPT } from './types';

// OpenAI Client
async function executeOpenAI(
    config: AIConfig,
    systemPrompt: string,
    userPrompt: string
): Promise<ExecutionResponse> {
    const startTime = Date.now();

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.model || DEFAULT_MODELS.openai,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: config.maxTokens || 4096,
                temperature: config.temperature || 0.7,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API error');
        }

        const data = await response.json();
        return {
            success: true,
            output: data.choices[0].message.content,
            provider: 'openai',
            model: config.model || DEFAULT_MODELS.openai,
            tokensUsed: data.usage?.total_tokens,
            executionTime: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            provider: 'openai',
            model: config.model || DEFAULT_MODELS.openai,
            executionTime: Date.now() - startTime,
        };
    }
}

// Claude Client
async function executeClaude(
    config: AIConfig,
    systemPrompt: string,
    userPrompt: string
): Promise<ExecutionResponse> {
    const startTime = Date.now();

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: config.model || DEFAULT_MODELS.claude,
                max_tokens: config.maxTokens || 4096,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: userPrompt },
                ],
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Claude API error');
        }

        const data = await response.json();
        return {
            success: true,
            output: data.content[0].text,
            provider: 'claude',
            model: config.model || DEFAULT_MODELS.claude,
            tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
            executionTime: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            provider: 'claude',
            model: config.model || DEFAULT_MODELS.claude,
            executionTime: Date.now() - startTime,
        };
    }
}

// Gemini Client
async function executeGemini(
    config: AIConfig,
    systemPrompt: string,
    userPrompt: string
): Promise<ExecutionResponse> {
    const startTime = Date.now();

    try {
        const model = config.model || DEFAULT_MODELS.gemini;
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: `${systemPrompt}\n\n---\n\n${userPrompt}` }
                            ]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: config.maxTokens || 4096,
                        temperature: config.temperature || 0.7,
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Gemini API error');
        }

        const data = await response.json();
        return {
            success: true,
            output: data.candidates[0].content.parts[0].text,
            provider: 'gemini',
            model: model,
            executionTime: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            provider: 'gemini',
            model: config.model || DEFAULT_MODELS.gemini,
            executionTime: Date.now() - startTime,
        };
    }
}

// Alibaba DashScope Client (OpenAI-compatible)
async function executeAlibaba(
    config: AIConfig,
    systemPrompt: string,
    userPrompt: string
): Promise<ExecutionResponse> {
    const startTime = Date.now();

    try {
        const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.model || DEFAULT_MODELS.alibaba,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: config.maxTokens || 4096,
                temperature: config.temperature || 0.7,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Alibaba DashScope API error');
        }

        const data = await response.json();
        return {
            success: true,
            output: data.choices[0].message.content,
            provider: 'alibaba',
            model: config.model || DEFAULT_MODELS.alibaba,
            tokensUsed: data.usage?.total_tokens,
            executionTime: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            provider: 'alibaba',
            model: config.model || DEFAULT_MODELS.alibaba,
            executionTime: Date.now() - startTime,
        };
    }
}

// OpenRouter Client (OpenAI-compatible)
async function executeOpenRouter(
    config: AIConfig,
    systemPrompt: string,
    userPrompt: string
): Promise<ExecutionResponse> {
    const startTime = Date.now();

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
                'HTTP-Referer': 'https://cvf.dev',
                'X-Title': 'CVF Agent Platform',
            },
            body: JSON.stringify({
                model: config.model || DEFAULT_MODELS.openrouter,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: config.maxTokens || 4096,
                temperature: config.temperature || 0.7,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenRouter API error');
        }

        const data = await response.json();
        return {
            success: true,
            output: data.choices[0].message.content,
            provider: 'openrouter',
            model: config.model || DEFAULT_MODELS.openrouter,
            tokensUsed: data.usage?.total_tokens,
            executionTime: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            provider: 'openrouter',
            model: config.model || DEFAULT_MODELS.openrouter,
            executionTime: Date.now() - startTime,
        };
    }
}

// Main execute function
export async function executeAI(
    provider: AIProvider,
    apiKey: string,
    userPrompt: string,
    options?: Partial<AIConfig>
): Promise<ExecutionResponse> {
    const config: AIConfig = {
        provider,
        apiKey,
        model: options?.model || DEFAULT_MODELS[provider],
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
    };

    const systemPrompt = CVF_SYSTEM_PROMPT;

    switch (provider) {
        case 'openai':
            return executeOpenAI(config, systemPrompt, userPrompt);
        case 'claude':
            return executeClaude(config, systemPrompt, userPrompt);
        case 'gemini':
            return executeGemini(config, systemPrompt, userPrompt);
        case 'alibaba':
            return executeAlibaba(config, systemPrompt, userPrompt);
        case 'openrouter':
            return executeOpenRouter(config, systemPrompt, userPrompt);
        default:
            return {
                success: false,
                error: `Unknown provider: ${provider}`,
                provider,
                model: 'unknown',
            };
    }
}

export { CVF_SYSTEM_PROMPT, DEFAULT_MODELS };

