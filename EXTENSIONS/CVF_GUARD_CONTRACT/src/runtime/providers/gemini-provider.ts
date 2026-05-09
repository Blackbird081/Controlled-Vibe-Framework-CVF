/**
 * CVF Gemini Execution Provider
 * ==============================
 * Real AI execution provider using Google Gemini API.
 * Implements the `ExecutionProvider` interface from AgentExecutionRuntime.
 *
 * @module cvf-guard-contract/runtime/providers/gemini-provider
 */

import type { ExecutionProvider } from '../agent-execution-runtime';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message: string; code: number };
}

export interface GeminiProviderConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemInstruction?: string;
}

export class GeminiProvider implements ExecutionProvider {
  name = 'gemini';
  private apiKey: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private systemInstruction: string;

  constructor(config: GeminiProviderConfig) {
    if (!config.apiKey) {
      throw new Error('GeminiProvider requires an API key.');
    }
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'gemini-2.0-flash';
    this.maxTokens = config.maxTokens ?? 2048;
    this.temperature = config.temperature ?? 0.7;
    this.systemInstruction = config.systemInstruction ??
      'You are a CVF-governed AI agent. Follow the task precisely. Return only the result, no explanations.';
  }

  async execute(action: string, parameters?: Record<string, unknown>): Promise<string> {
    const prompt = this.buildPrompt(action, parameters);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      system_instruction: {
        parts: [{ text: this.systemInstruction }],
      },
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: this.maxTokens,
        temperature: this.temperature,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as GeminiResponse;

    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini returned empty response.');
    }

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
