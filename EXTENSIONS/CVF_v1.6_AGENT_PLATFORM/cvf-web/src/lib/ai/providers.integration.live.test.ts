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

// Selection is not execution authority. Even under `--mode live`, provider
// cases skip unless an orchestrator injects the complete grant envelope. The
// shared fetch guard independently validates every binding and call budget
// before network traffic.
const providerExecutionGrantPresent = Boolean(
    process.env.CVF_PROVIDER_EXECUTION_GRANT_JSON &&
    process.env.CVF_PROVIDER_EXECUTION_GRANT_ID &&
    process.env.CVF_AGENT_ID &&
    process.env.CVF_DELEGATION_ID
);

describe('AI provider integration (real)', () => {
    const testOpenAI = providerExecutionGrantPresent && openaiKey ? it : it.skip;
    const testGemini = providerExecutionGrantPresent && geminiKey ? it : it.skip;
    const testClaude = providerExecutionGrantPresent && claudeKey ? it : it.skip;

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
