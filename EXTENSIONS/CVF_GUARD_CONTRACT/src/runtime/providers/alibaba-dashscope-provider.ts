/**
 * Alibaba DashScope Execution Provider
 * =====================================
 * Real AI execution via Alibaba Cloud DashScope API (Qwen models).
 * Implements the `ExecutionProvider` interface from AgentExecutionRuntime.
 *
 * API docs: https://dashscope-intl.aliyuncs.com/api/v1/services/aigc (International)
 * API docs CN: https://dashscope.aliyuncs.com/api/v1/services/aigc (China)
 *
 * @module cvf-guard-contract/runtime/providers/alibaba-dashscope-provider
 */

import type { ExecutionProvider } from '../agent-execution-runtime';

interface DashScopeMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DashScopeResponse {
  output?: {
    choices?: Array<{
      message?: { content?: string };
      finish_reason?: string;
    }>;
    text?: string;
    finish_reason?: string;
  };
  usage?: { total_tokens: number };
  request_id?: string;
  code?: string;
  message?: string;
}

export interface AlibabaDashScopeConfig {
  apiKey: string;
  /** Default: qwen-turbo (fast, cheap). Options: qwen-plus, qwen-max, qwen-long */
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemInstruction?: string;
  /** Use OpenAI-compatible endpoint (recommended). Default: true */
  openAICompatible?: boolean;
  /** Use International endpoint (dashscope-intl). Default: true. Set false for China accounts. */
  international?: boolean;
}

export class AlibabaDashScopeProvider implements ExecutionProvider {
  name = 'alibaba-dashscope';
  private apiKey: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private systemInstruction: string;
  private openAICompatible: boolean;
  private baseUrl: string;

  constructor(config: AlibabaDashScopeConfig) {
    if (!config.apiKey) {
      throw new Error('AlibabaDashScopeProvider requires an API key.');
    }
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'qwen-turbo';
    this.maxTokens = config.maxTokens ?? 2048;
    this.temperature = config.temperature ?? 0.7;
    this.openAICompatible = config.openAICompatible ?? true;
    const intl = config.international ?? true;
    this.baseUrl = intl ? 'https://dashscope-intl.aliyuncs.com' : 'https://dashscope.aliyuncs.com';
    this.systemInstruction = config.systemInstruction ??
      'You are a CVF-governed AI agent. Follow the task precisely. Return only the result, no explanations.';
  }

  async execute(action: string, parameters?: Record<string, unknown>): Promise<string> {
    return this.openAICompatible
      ? this.executeOpenAICompat(action, parameters)
      : this.executeNative(action, parameters);
  }

  /** OpenAI-compatible endpoint (recommended, easier to swap providers) */
  private async executeOpenAICompat(action: string, parameters?: Record<string, unknown>): Promise<string> {
    const url = `${this.baseUrl}/compatible-mode/v1/chat/completions`;
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: this.systemInstruction },
        { role: 'user', content: this.buildPrompt(action, parameters) },
      ],
      max_tokens: this.maxTokens,
      temperature: this.temperature,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
    });

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message: string } };
    if (!response.ok || data.error) {
      throw new Error(`DashScope OpenAI-compat error (${response.status}): ${data.error?.message ?? JSON.stringify(data)}`);
    }
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('DashScope returned empty response.');
    return text;
  }

  /** Native DashScope endpoint */
  private async executeNative(action: string, parameters?: Record<string, unknown>): Promise<string> {
    const url = `${this.baseUrl}/api/v1/services/aigc/text-generation/generation`;
    const body = {
      model: this.model,
      input: { messages: [{ role: 'system', content: this.systemInstruction }, { role: 'user', content: this.buildPrompt(action, parameters) }] },
      parameters: { max_tokens: this.maxTokens, temperature: this.temperature, result_format: 'message' },
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as DashScopeResponse;
    if (!response.ok || data.code) {
      throw new Error(`DashScope native error (${response.status}): ${data.message ?? JSON.stringify(data)}`);
    }
    const text = data.output?.choices?.[0]?.message?.content ?? data.output?.text;
    if (!text) throw new Error('DashScope returned empty response.');
    return text;
  }

  private buildPrompt(action: string, parameters?: Record<string, unknown>): string {
    let prompt = `## Task\n${action}\n`;
    if (parameters && Object.keys(parameters).length > 0) {
      prompt += `\n## Parameters\n`;
      for (const [key, value] of Object.entries(parameters)) {
        prompt += `- **${key}:** ${JSON.stringify(value)}\n`;
      }
    }
    return prompt;
  }
}
