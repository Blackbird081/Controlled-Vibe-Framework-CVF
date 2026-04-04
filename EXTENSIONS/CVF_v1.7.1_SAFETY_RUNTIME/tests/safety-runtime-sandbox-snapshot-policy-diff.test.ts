/**
 * CVF v1.7.1 Safety Runtime — Sandbox Mode, Snapshot, Provider Policy,
 * Usage Tracker, Policy Diff & Governed Generate Tests (W6-T71)
 * ================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (6 contracts):
 *   simulation/sandbox.mode.ts:
 *     enableSandbox / disableSandbox / isSandbox
 *   ai/provider.policy.ts:
 *     setProviderPolicy / enforceProviderPolicy
 *       — maxTokens exceeded; within limit; temperature blocked;
 *         blockedKeyword hit; clean prompt; no-policy baseline
 *   ai/usage.tracker.ts:
 *     recordUsage / getUsageHistory — empty start; accumulates
 *   simulation/proposal.snapshot.ts:
 *     saveSnapshot / getSnapshot / listSnapshots — save/get/list/unknown
 *   simulation/policy.diff.ts:
 *     diffPolicyImpact — all-unchanged → []; specific-changed → entry
 *   ai/ai.governance.ts:
 *     governedGenerate — success; policy blocks before generate;
 *     provider error propagates
 */

import { describe, it, expect } from 'vitest';

import { enableSandbox, disableSandbox, isSandbox } from '../simulation/sandbox.mode';
import { setProviderPolicy, enforceProviderPolicy } from '../ai/provider.policy';
import { recordUsage, getUsageHistory } from '../ai/usage.tracker';
import { saveSnapshot, getSnapshot, listSnapshots } from '../simulation/proposal.snapshot';
import { diffPolicyImpact } from '../simulation/policy.diff';
import { setActiveProvider, governedGenerate } from '../ai/ai.governance';
import type { AIGenerationResponse, SimulationContext, SimulationResult } from '../types/index';

// ─── sandbox.mode ─────────────────────────────────────────────────────────────

describe('sandbox.mode', () => {
  it('isSandbox() is false at module initialisation', () => {
    expect(isSandbox()).toBe(false);
  });

  it('enableSandbox → isSandbox() returns true', () => {
    enableSandbox();
    expect(isSandbox()).toBe(true);
  });

  it('disableSandbox → isSandbox() returns false', () => {
    disableSandbox();
    expect(isSandbox()).toBe(false);
  });
});

// ─── ai/provider.policy ───────────────────────────────────────────────────────

describe('provider.policy — enforceProviderPolicy', () => {
  function makeReq(overrides: Record<string, unknown> = {}) {
    return { userPrompt: 'Hello', ...overrides } as any;
  }

  it('empty policy → enforceProviderPolicy does not throw', () => {
    setProviderPolicy({});
    expect(() => enforceProviderPolicy(makeReq({ maxTokens: 1000 }))).not.toThrow();
  });

  it('maxTokens policy: request exceeds limit → throws', () => {
    setProviderPolicy({ maxTokens: 100 });
    expect(() => enforceProviderPolicy(makeReq({ maxTokens: 200 }))).toThrow(
      'Token limit exceeds provider policy',
    );
  });

  it('maxTokens policy: request within limit → no throw', () => {
    setProviderPolicy({ maxTokens: 100 });
    expect(() => enforceProviderPolicy(makeReq({ maxTokens: 50 }))).not.toThrow();
  });

  it('allowTemperature=false: request with temperature → throws', () => {
    setProviderPolicy({ allowTemperature: false });
    expect(() => enforceProviderPolicy(makeReq({ temperature: 0.7 }))).toThrow(
      'Temperature override not allowed',
    );
  });

  it('blockedKeywords: prompt contains keyword → throws with keyword in message', () => {
    setProviderPolicy({ blockedKeywords: ['secret'] });
    expect(() =>
      enforceProviderPolicy(makeReq({ userPrompt: 'my secret key' })),
    ).toThrow('secret');
  });

  it('blockedKeywords: prompt does not contain keyword → no throw', () => {
    setProviderPolicy({ blockedKeywords: ['secret'] });
    expect(() =>
      enforceProviderPolicy(makeReq({ userPrompt: 'safe prompt' })),
    ).not.toThrow();
  });
});

// ─── ai/usage.tracker ────────────────────────────────────────────────────────

describe('usage.tracker', () => {
  it('getUsageHistory() is empty at module load', () => {
    expect(getUsageHistory().length).toBe(0);
  });

  it('recordUsage → getUsageHistory has one entry with model and totalTokens', () => {
    recordUsage({ content: 'resp', model: 'gpt-4', usage: { totalTokens: 200 } });
    const history = getUsageHistory();
    expect(history.length).toBe(1);
    expect(history[0].model).toBe('gpt-4');
    expect(history[0].totalTokens).toBe(200);
  });

  it('multiple recordUsage calls accumulate entries', () => {
    recordUsage({ content: 'resp2', model: 'claude', usage: { totalTokens: 150 } });
    expect(getUsageHistory().length).toBe(2);
  });
});

// ─── simulation/proposal.snapshot ────────────────────────────────────────────

describe('proposal.snapshot', () => {
  it('saveSnapshot + getSnapshot returns the saved entry', () => {
    saveSnapshot({
      proposalId: 'snap-A',
      proposal: {},
      policyVersion: 'v1',
      decision: 'approved',
      timestamp: 1000,
    });
    const s = getSnapshot('snap-A');
    expect(s).toBeDefined();
    expect(s?.decision).toBe('approved');
  });

  it('saves a second snapshot independently', () => {
    saveSnapshot({
      proposalId: 'snap-B',
      proposal: {},
      policyVersion: 'v1',
      decision: 'rejected',
      timestamp: 2000,
    });
    expect(getSnapshot('snap-B')?.decision).toBe('rejected');
  });

  it('listSnapshots returns all saved snapshots', () => {
    const ids = listSnapshots().map((s) => s.proposalId);
    expect(ids).toContain('snap-A');
    expect(ids).toContain('snap-B');
  });

  it('getSnapshot with unknown id → returns undefined', () => {
    expect(getSnapshot('no-such-id')).toBeUndefined();
  });
});

// ─── simulation/policy.diff ───────────────────────────────────────────────────

describe('diffPolicyImpact', () => {
  // snapshot store carries snap-A and snap-B from the describe block above

  it('engine returning changed=false for all snapshots → empty changedProposals', async () => {
    const engine = {
      simulate: async (_ctx: SimulationContext): Promise<SimulationResult> => ({
        changed: false,
        simulatedDecision: 'approved',
        policyVersion: 'v2',
      }),
    };
    const result = await diffPolicyImpact(engine as any, 'v2');
    expect(result).toEqual([]);
  });

  it('engine returns changed=true for one snapshot → entry with correct from/to', async () => {
    saveSnapshot({
      proposalId: 'diff-c1',
      proposal: {},
      policyVersion: 'v1',
      decision: 'approved',
      timestamp: 3000,
    });
    const engine = {
      simulate: async (ctx: SimulationContext): Promise<SimulationResult> => ({
        changed: ctx.proposalId === 'diff-c1',
        simulatedDecision: ctx.proposalId === 'diff-c1' ? 'rejected' : 'approved',
        policyVersion: 'v2',
      }),
    };
    const result = await diffPolicyImpact(engine as any, 'v2');
    expect(result.length).toBe(1);
    expect(result[0].proposalId).toBe('diff-c1');
    expect(result[0].from).toBe('approved');
    expect(result[0].to).toBe('rejected');
  });
});

// ─── ai/ai.governance — governedGenerate ─────────────────────────────────────

describe('governedGenerate', () => {
  const mockResponse: AIGenerationResponse = {
    content: 'AI output',
    model: 'mock-model',
    usage: { totalTokens: 50 },
  };

  it('clean policy + active provider → returns AI response', async () => {
    setProviderPolicy({});
    setActiveProvider({ generate: async () => mockResponse });
    const resp = await governedGenerate({ userPrompt: 'test' });
    expect(resp.content).toBe('AI output');
  });

  it('policy violation before generate → throws without calling provider.generate', async () => {
    setProviderPolicy({ maxTokens: 10 });
    let called = false;
    setActiveProvider({
      generate: async () => {
        called = true;
        return mockResponse;
      },
    });
    await expect(governedGenerate({ userPrompt: 'test', maxTokens: 100 })).rejects.toThrow();
    expect(called).toBe(false);
  });

  it('provider.generate throws → governedGenerate propagates the error', async () => {
    setProviderPolicy({});
    setActiveProvider({
      generate: async () => {
        throw new Error('provider error');
      },
    });
    await expect(governedGenerate({ userPrompt: 'test' })).rejects.toThrow('provider error');
  });
});
