/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { executeAI } from './providers';

const prompt = 'Return only the word OK.';
const options = { maxTokens: 32, temperature: 0 };

const openaiKey = process.env.OPENAI_API_KEY;
const geminiKey = process.env.GOOGLE_AI_API_KEY;
const claudeKey = process.env.ANTHROPIC_API_KEY;

describe('AI provider integration (real)', () => {
    const testOpenAI = openaiKey ? it : it.skip;
    const testGemini = geminiKey ? it : it.skip;
    const testClaude = claudeKey ? it : it.skip;

    testOpenAI('executes OpenAI provider', { timeout: 60000 }, async () => {
        const result = await executeAI('openai', openaiKey as string, prompt, options);
        expect(result.success).toBe(true);
        expect(result.output).toBeTruthy();
    });

    testGemini('executes Gemini provider', { timeout: 60000 }, async () => {
        const result = await executeAI('gemini', geminiKey as string, prompt, options);
        expect(result.success).toBe(true);
        expect(result.output).toBeTruthy();
    });

    testClaude('executes Claude provider', { timeout: 60000 }, async () => {
        const result = await executeAI('claude', claudeKey as string, prompt, options);
        expect(result.success).toBe(true);
        expect(result.output).toBeTruthy();
    });
});
