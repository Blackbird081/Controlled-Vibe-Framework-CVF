// AI Provider Types and Interfaces
export type AIProvider = 'openai' | 'claude' | 'gemini';

export interface AIConfig {
    provider: AIProvider;
    apiKey: string;
    model: string;
    maxTokens?: number;
    temperature?: number;
}

export interface ExecutionRequest {
    templateId: string;
    templateName: string;
    inputs: Record<string, string>;
    intent: string;
    provider?: AIProvider;
}

export interface ExecutionResponse {
    success: boolean;
    output?: string;
    error?: string;
    provider: AIProvider;
    model: string;
    tokensUsed?: number;
    executionTime?: number;
}

export interface ProviderStatus {
    provider: AIProvider;
    configured: boolean;
    model: string;
}

// Default models per provider
export const DEFAULT_MODELS: Record<AIProvider, string> = {
    openai: 'gpt-4o',
    claude: 'claude-3-5-sonnet-20241022',
    gemini: 'gemini-2.0-flash',
};

// CVF System prompt template
export const CVF_SYSTEM_PROMPT = `You are an AI assistant operating under the CVF (Controlled Vibe Framework) guidelines.

CORE PRINCIPLES:
- Focus on the user's intent, not their exact wording
- Provide structured, actionable output
- Be honest about limitations and uncertainties
- Follow the template structure provided

EXECUTION RULES:
- Always acknowledge what you understood from the input
- Structure output according to the template format
- Flag any assumptions you had to make
- Suggest next steps when appropriate

OUTPUT FORMAT:
- Use markdown formatting
- Be concise but comprehensive
- Include examples where helpful
`;
