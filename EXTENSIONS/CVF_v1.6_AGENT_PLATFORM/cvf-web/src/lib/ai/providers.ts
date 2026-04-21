import { AIConfig, ExecutionResponse, AIProvider, DEFAULT_MODELS, CVF_SYSTEM_PROMPT } from './types';

function isAlibabaStreamingOnlyModel(model: string): boolean {
    return /^qvq-/i.test(model);
}

async function parseAlibabaStreamingResponse(response: Response): Promise<{
    output: string;
    tokensUsed?: number;
    finishReason?: string;
}> {
    const raw = await response.text();
    const lines = raw
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('data: '));

    let output = '';
    let reasoning = '';
    let tokensUsed: number | undefined;
    let finishReason: string | undefined;

    for (const line of lines) {
        const payload = line.slice(6);
        if (payload === '[DONE]') continue;

        try {
            const data = JSON.parse(payload);
            const delta = data.choices?.[0]?.delta;
            if (typeof delta?.content === 'string') {
                output += delta.content;
            }
            if (typeof delta?.reasoning_content === 'string') {
                reasoning += delta.reasoning_content;
            }
            if (typeof data.choices?.[0]?.finish_reason === 'string') {
                finishReason = data.choices[0].finish_reason;
            }
            if (typeof data.usage?.total_tokens === 'number') {
                tokensUsed = data.usage.total_tokens;
            }
        } catch {
            // Ignore malformed SSE chunks and preserve the parsable output.
        }
    }

    return {
        output: output || reasoning,
        tokensUsed,
        finishReason,
    };
}

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
                model: config.model,
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
            model: config.model,
            tokensUsed: data.usage?.total_tokens,
            usage: {
                inputTokens: data.usage?.prompt_tokens,
                outputTokens: data.usage?.completion_tokens,
                totalTokens: data.usage?.total_tokens,
            },
            executionTime: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            provider: 'openai',
            model: config.model,
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
                model: config.model,
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
            model: config.model,
            tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
            usage: {
                inputTokens: data.usage?.input_tokens,
                outputTokens: data.usage?.output_tokens,
                totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
            },
            executionTime: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            provider: 'claude',
            model: config.model,
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
        const model = config.model;
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
            usage: {
                inputTokens: data.usageMetadata?.promptTokenCount,
                outputTokens: data.usageMetadata?.candidatesTokenCount,
                totalTokens: data.usageMetadata?.totalTokenCount,
            },
            executionTime: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            provider: 'gemini',
            model: config.model,
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
    const isStreamingOnly = isAlibabaStreamingOnlyModel(config.model);

    try {
        const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: config.maxTokens || 4096,
                temperature: config.temperature || 0.7,
                ...(isStreamingOnly
                    ? {
                        stream: true,
                        stream_options: { include_usage: true },
                    }
                    : {}),
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            const message = error.error?.message || 'Alibaba DashScope API error';
            if (isStreamingOnly && error.error?.code === 'model_not_supported') {
                throw new Error(
                    `Alibaba model ${config.model} is not supported on the current compatible-mode endpoint. ` +
                    'Try qvq-max or use a provider-specific endpoint/adapter that supports this snapshot model.'
                );
            }
            throw new Error(message);
        }

        if (isStreamingOnly) {
            const data = await parseAlibabaStreamingResponse(response);
            return {
                success: true,
                output: data.output,
                provider: 'alibaba',
                model: config.model,
                tokensUsed: data.tokensUsed,
                usage: {
                    totalTokens: data.tokensUsed,
                },
                executionTime: Date.now() - startTime,
            };
        }

        const data = await response.json();
        return {
            success: true,
            output: data.choices[0].message.content,
            provider: 'alibaba',
            model: config.model,
            tokensUsed: data.usage?.total_tokens,
            usage: {
                inputTokens: data.usage?.prompt_tokens,
                outputTokens: data.usage?.completion_tokens,
                totalTokens: data.usage?.total_tokens,
            },
            executionTime: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            provider: 'alibaba',
            model: config.model,
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
                model: config.model,
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
            model: config.model,
            tokensUsed: data.usage?.total_tokens,
            usage: {
                inputTokens: data.usage?.prompt_tokens,
                outputTokens: data.usage?.completion_tokens,
                totalTokens: data.usage?.total_tokens,
            },
            executionTime: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            provider: 'openrouter',
            model: config.model,
            executionTime: Date.now() - startTime,
        };
    }
}

// DeepSeek Client (OpenAI-compatible)
async function executeDeepSeek(
    config: AIConfig,
    systemPrompt: string,
    userPrompt: string
): Promise<ExecutionResponse> {
    const startTime = Date.now();

    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.model,
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
            throw new Error(error.error?.message || 'DeepSeek API error');
        }

        const data = await response.json();
        return {
            success: true,
            output: data.choices[0].message.content,
            provider: 'deepseek',
            model: config.model,
            tokensUsed: data.usage?.total_tokens,
            usage: {
                inputTokens: data.usage?.prompt_tokens,
                outputTokens: data.usage?.completion_tokens,
                totalTokens: data.usage?.total_tokens,
            },
            executionTime: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            provider: 'deepseek',
            model: config.model,
            executionTime: Date.now() - startTime,
        };
    }
}

// Main execute function
export async function executeAI(
    provider: AIProvider,
    apiKey: string,
    userPrompt: string,
    options?: Partial<AIConfig> & { systemPrompt?: string }
): Promise<ExecutionResponse> {
    const config: AIConfig = {
        provider,
        apiKey,
        model: options?.model || DEFAULT_MODELS[provider],
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
    };

    const systemPrompt = options?.systemPrompt ?? CVF_SYSTEM_PROMPT;

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
        case 'deepseek':
            return executeDeepSeek(config, systemPrompt, userPrompt);
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
