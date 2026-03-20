/**
 * GeminiProvider Tests
 * ====================
 * Unit tests (always run) + Live tests (run when CVF_GEMINI_LIVE_TEST=true)
 */

import { describe, it, expect } from 'vitest';
import { GeminiProvider } from './gemini-provider';
import { AgentExecutionRuntime } from '../agent-execution-runtime';
import { createGuardEngine } from '../../index';

// Use environment variable for API key (do not commit raw keys)
const API_KEY = process.env.CVF_GEMINI_API_KEY || 'PLACEHOLDER_KEY';
const LIVE = process.env.CVF_GEMINI_LIVE_TEST === 'true';

// ─── Constructor (always run) ─────────────────────────────────────────

describe('GeminiProvider constructor', () => {
  it('creates with valid config', () => {
    const provider = new GeminiProvider({ apiKey: API_KEY });
    expect(provider.name).toBe('gemini');
  });

  it('throws without API key', () => {
    expect(() => new GeminiProvider({ apiKey: '' })).toThrow('requires an API key');
  });

  it('accepts custom model', () => {
    const provider = new GeminiProvider({ apiKey: API_KEY, model: 'gemini-1.5-pro' });
    expect(provider.name).toBe('gemini');
  });

  it('accepts custom temperature and maxTokens', () => {
    const provider = new GeminiProvider({
      apiKey: API_KEY,
      temperature: 0.2,
      maxTokens: 500,
    });
    expect(provider.name).toBe('gemini');
  });
});

// ─── Guard blocks before Gemini call (no API needed) ──────────────────

describe('GeminiProvider with guard blocking (no API call)', () => {
  it('blocks AI_AGENT in INTAKE — Gemini never called', async () => {
    const engine = createGuardEngine();
    const provider = new GeminiProvider({ apiKey: API_KEY });
    const runtime = new AgentExecutionRuntime(engine, provider, {
      phase: 'INTAKE',
      riskLevel: 'R0',
      role: 'AI_AGENT',
      agentId: 'ai-test',
      channel: 'mcp',
      liveExecution: true,
    });

    const result = await runtime.run('write some code');
    expect(result.status).toBe('BLOCKED');
    expect(result.output).toBeUndefined(); // Gemini was NOT called
  });

  it('blocks R3 AI_AGENT — Gemini never called', async () => {
    const engine = createGuardEngine();
    const provider = new GeminiProvider({ apiKey: API_KEY });
    const runtime = new AgentExecutionRuntime(engine, provider, {
      phase: 'BUILD',
      riskLevel: 'R3',
      role: 'AI_AGENT',
      agentId: 'ai-test',
      channel: 'mcp',
      liveExecution: true,
    });

    const result = await runtime.run('deploy to production');
    expect(result.status).toBe('BLOCKED');
    expect(result.output).toBeUndefined();
  });
});

// ─── Live API Tests (only when CVF_GEMINI_LIVE_TEST=true) ─────────────

describe.skipIf(!LIVE)('GeminiProvider live execution', () => {
  it('calls Gemini API and gets response', async () => {
    const provider = new GeminiProvider({
      apiKey: API_KEY,
      maxTokens: 100,
      temperature: 0.1,
    });

    const result = await provider.execute(
      'Return ONLY the text "CVF_GUARD_OK" with no other text.',
    );

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('CVF_GUARD_OK');
  }, 15000);

  it('full governed pipeline with real Gemini', async () => {
    const engine = createGuardEngine();
    const provider = new GeminiProvider({
      apiKey: API_KEY,
      maxTokens: 50,
      temperature: 0,
    });
    const runtime = new AgentExecutionRuntime(engine, provider, {
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'HUMAN',
      agentId: 'cvf-test',
      channel: 'cli',
      liveExecution: true,
    });

    const result = await runtime.run('generate: Return ONLY "PIPELINE_OK"');
    expect(result.status).toBe('COMPLETED');
    expect(result.output).toBeDefined();
  }, 15000);
});
