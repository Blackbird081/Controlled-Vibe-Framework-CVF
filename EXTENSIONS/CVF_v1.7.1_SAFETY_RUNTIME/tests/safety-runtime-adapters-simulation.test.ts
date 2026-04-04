/**
 * CVF v1.7.1 Safety Runtime — Adapters, Simulation & Bootstrap Dedicated Tests (W6-T64)
 * ========================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (5 contracts):
 *   ai/direct.provider.adapter.ts:
 *     DirectProviderAdapter.generate — no-client throws; with-client delegates
 *   kernel-architecture/runtime/llm_adapter.ts:
 *     LLMAdapter.generate — wrong token blocked; correct token + message; correct + empty
 *   simulation/simulation.engine.ts:
 *     SimulationEngine.simulate — no-snapshot throws; snapshot found + mock CVF API
 *   simulation/replay.service.ts:
 *     ReplayService.replay — wraps simulate with simulateOnly=true context
 *   core/bootstrap.ts:
 *     createLifecycleEngine — returns LifecycleEngine without throw
 */

import { describe, it, expect } from 'vitest';

import {
  DirectProviderAdapter,
  registerDirectLLMClient,
} from '../ai/direct.provider.adapter';
import { LLMAdapter } from '../kernel-architecture/runtime/llm_adapter';
import { SimulationEngine } from '../simulation/simulation.engine';
import { saveSnapshot } from '../simulation/proposal.snapshot';
import { ReplayService } from '../simulation/replay.service';
import { createLifecycleEngine } from '../core/bootstrap';

// ─── DirectProviderAdapter ────────────────────────────────────────────────────

describe('DirectProviderAdapter', () => {
  it('generate without registered client → throws "Direct LLM client not registered"', async () => {
    const adapter = new DirectProviderAdapter();
    await expect(adapter.generate({ userPrompt: 'hello' })).rejects.toThrow(
      'Direct LLM client not registered'
    );
  });

  it('generate with registered mock client → returns mock response', async () => {
    const mockClient = {
      generate: async () => ({ content: 'mock result', model: 'test-model' }),
    };
    registerDirectLLMClient(mockClient);

    const adapter = new DirectProviderAdapter();
    const result = await adapter.generate({ userPrompt: 'hello' });
    expect(result.content).toBe('mock result');
    expect(result.model).toBe('test-model');
  });
});

// ─── LLMAdapter ───────────────────────────────────────────────────────────────

describe('LLMAdapter', () => {
  it('generate with wrong token → throws "Direct LLM access blocked"', async () => {
    const token = Symbol('my-token');
    const adapter = new LLMAdapter(undefined, token);
    await expect(adapter.generate({ message: 'hello' }, Symbol('other'))).rejects.toThrow(
      'Direct LLM access blocked'
    );
  });

  it('correct token + message string → returns "CVF response: {message}"', async () => {
    const token = Symbol('my-token');
    const adapter = new LLMAdapter(undefined, token);
    const result = await adapter.generate({ message: 'hello' }, token);
    expect(result).toBe('CVF response: hello');
  });

  it('correct token + empty message → returns "CVF response generated."', async () => {
    const token = Symbol('my-token');
    const adapter = new LLMAdapter(undefined, token);
    const result = await adapter.generate({ message: '' }, token);
    expect(result).toBe('CVF response generated.');
  });
});

// ─── SimulationEngine ─────────────────────────────────────────────────────────

describe('SimulationEngine', () => {
  it('simulate with no snapshot → throws "Snapshot not found"', async () => {
    const mockCVF = { submitProposal: async () => ({ status: 'approved' as const }) };
    const engine = new SimulationEngine(mockCVF);
    await expect(
      engine.simulate({ proposalId: 'nonexistent-sim-id', policyVersion: 'v1', simulateOnly: true })
    ).rejects.toThrow('Snapshot not found');
  });

  it('simulate with existing snapshot → returns SimulationResult with changed flag', async () => {
    // Save snapshot first (fresh module per file)
    saveSnapshot({ proposalId: 'sim-snap-001', proposal: {}, policyVersion: 'v1', decision: 'approved', timestamp: Date.now() });

    const mockCVF = { submitProposal: async () => ({ status: 'rejected' as const }) };
    const engine = new SimulationEngine(mockCVF);

    const result = await engine.simulate({ proposalId: 'sim-snap-001', policyVersion: 'v2', simulateOnly: true });
    expect(result.originalDecision).toBe('approved');
    expect(result.simulatedDecision).toBe('rejected');
    expect(result.changed).toBe(true);
    expect(result.policyVersion).toBe('v2');
  });
});

// ─── ReplayService ────────────────────────────────────────────────────────────

describe('ReplayService', () => {
  it('replay calls simulate with simulateOnly=true context', async () => {
    const captured: any[] = [];
    const mockEngine = {
      simulate: async (ctx: any) => {
        captured.push(ctx);
        return { originalDecision: 'approved', simulatedDecision: 'approved', policyVersion: 'v1', changed: false };
      },
    };

    const service = new ReplayService(mockEngine as any);
    const result = await service.replay('prop-XYZ', 'v1');

    expect(captured).toHaveLength(1);
    expect(captured[0].proposalId).toBe('prop-XYZ');
    expect(captured[0].policyVersion).toBe('v1');
    expect(captured[0].simulateOnly).toBe(true);
    expect(result.changed).toBe(false);
  });
});

// ─── core/bootstrap ───────────────────────────────────────────────────────────

describe('bootstrap', () => {
  it('createLifecycleEngine returns a LifecycleEngine instance (has submit method)', () => {
    const engine = createLifecycleEngine();
    expect(engine).toBeDefined();
    expect(typeof engine.submit).toBe('function');
  });
});
