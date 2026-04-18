/**
 * AlibabaDashScopeProvider Tests
 * ================================
 * Unit tests (always run) + Live tests (run when ALIBABA_API_KEY is set)
 */

import { describe, it, expect } from 'vitest';
import { AlibabaDashScopeProvider } from './alibaba-dashscope-provider';
import { AgentExecutionRuntime } from '../agent-execution-runtime';
import { createGuardEngine } from '../../index';

// Use environment variable for API key (do not commit raw keys).
// Canonical env is ALIBABA_API_KEY; legacy aliases remain supported for compatibility.
const API_KEY =
  process.env.ALIBABA_API_KEY ||
  process.env.CVF_BENCHMARK_ALIBABA_KEY ||
  process.env.CVF_ALIBABA_API_KEY ||
  'PLACEHOLDER_KEY';
const LIVE = API_KEY !== 'PLACEHOLDER_KEY';

// ─── Constructor (always run) ─────────────────────────────────────────

describe('AlibabaDashScopeProvider constructor', () => {
  it('creates with valid config', () => {
    const p = new AlibabaDashScopeProvider({ apiKey: API_KEY });
    expect(p.name).toBe('alibaba-dashscope');
  });

  it('throws without API key', () => {
    expect(() => new AlibabaDashScopeProvider({ apiKey: '' })).toThrow('requires an API key');
  });

  it('accepts custom model', () => {
    const p = new AlibabaDashScopeProvider({ apiKey: API_KEY, model: 'qwen-plus' });
    expect(p.name).toBe('alibaba-dashscope');
  });

  it('uses China endpoint when international=false', () => {
    const p = new AlibabaDashScopeProvider({ apiKey: API_KEY, international: false });
    expect(p.name).toBe('alibaba-dashscope');
  });
});

// ─── Guard blocks before API call (always run — no real API needed) ───

describe('AlibabaDashScopeProvider with guard blocking', () => {
  it('blocks AI_AGENT in INTAKE — Alibaba never called', async () => {
    const engine = createGuardEngine();
    const provider = new AlibabaDashScopeProvider({ apiKey: API_KEY });
    const runtime = new AgentExecutionRuntime(engine, provider, {
      phase: 'INTAKE',
      riskLevel: 'R0',
      role: 'AI_AGENT',
      agentId: 'ai-test',
      channel: 'mcp',
      liveExecution: true,
    });
    const result = await runtime.run('write code');
    expect(result.status).toBe('BLOCKED');
    expect(result.output).toBeUndefined();
  });
});

// ─── Live API Tests (only when an Alibaba API key env is set) ─────────

describe.skipIf(!LIVE)('AlibabaDashScopeProvider live execution', () => {
  it('calls Qwen API and returns response', async () => {
    const provider = new AlibabaDashScopeProvider({
      apiKey: API_KEY,
      maxTokens: 20,
      temperature: 0,
    });
    const result = await provider.execute('Return ONLY the text "CVF_GUARD_OK", nothing else.');
    expect(result).toContain('CVF_GUARD_OK');
  }, 15000);

  it('passes parameters in prompt', async () => {
    const provider = new AlibabaDashScopeProvider({ apiKey: API_KEY, maxTokens: 10, temperature: 0 });
    const result = await provider.execute('What is 2+3? Reply with only the number.', { format: 'number' });
    expect(result).toContain('5');
  }, 15000);
});

// ─── E2E: Full governed pipeline (only when an Alibaba API key env is set)

describe.skipIf(!LIVE)('Full governed pipeline with AlibabaDashScopeProvider', () => {
  it('executes safe HUMAN action end-to-end', async () => {
    const engine = createGuardEngine();
    const provider = new AlibabaDashScopeProvider({ apiKey: API_KEY, maxTokens: 30, temperature: 0 });
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
    expect(result.guardDecision?.finalDecision).toBe('ALLOW');
  }, 15000);
});

