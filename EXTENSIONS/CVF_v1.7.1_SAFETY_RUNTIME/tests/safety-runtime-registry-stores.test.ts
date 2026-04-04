/**
 * CVF v1.7.1 Safety Runtime — Registry & Store Dedicated Tests (W6-T56)
 * ======================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (4 in-memory registry/store contracts + 1 config constant):
 *   policy/policy.registry.ts:
 *     registerPolicy (immutable, hash populated, createdAt set)
 *     getPolicy (returns stored policy, throws if not found)
 *     listPolicies (includes registered entries)
 *   core/proposal.store.ts:
 *     saveProposal (immutable, throws on duplicate)
 *     getProposal (returns stored, throws if not found)
 *     hasProposal (true/false), _clearAllProposals (cleanup)
 *   ai/usage.tracker.ts:
 *     recordUsage (builds UsageRecord with model+tokens)
 *     getUsageHistory (readonly array, cumulative)
 *   simulation/proposal.snapshot.ts:
 *     saveSnapshot / getSnapshot (found/undefined) / listSnapshots
 *   adapters/openclaw/openclaw.config.ts:
 *     defaultOpenClawConfig — safety-conservative default values
 */

import { describe, it, expect, beforeAll } from 'vitest';

import { registerPolicy, getPolicy, listPolicies } from '../policy/policy.registry';
import { saveProposal, getProposal, hasProposal, _clearAllProposals } from '../core/proposal.store';
import { recordUsage, getUsageHistory } from '../ai/usage.tracker';
import { saveSnapshot, getSnapshot, listSnapshots } from '../simulation/proposal.snapshot';
import { defaultOpenClawConfig } from '../adapters/openclaw/openclaw.config';
import type { PolicyRule } from '../types/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRule(id: string): PolicyRule {
  return {
    id,
    description: `Rule ${id}`,
    evaluate: () => 'approved',
  };
}

// ─── policy.registry ──────────────────────────────────────────────────────────

describe('policy.registry', () => {
  it('registerPolicy stores policy with hash and createdAt', () => {
    registerPolicy('v-test-1', [makeRule('r1')]);
    const policy = getPolicy('v-test-1');
    expect(policy.version).toBe('v-test-1');
    expect(typeof policy.hash).toBe('string');
    expect(policy.hash.length).toBeGreaterThan(0);
    expect(typeof policy.createdAt).toBe('number');
    expect(policy.createdAt).toBeGreaterThan(0);
  });

  it('getPolicy returns the registered policy with its rules', () => {
    registerPolicy('v-test-2', [makeRule('r2a'), makeRule('r2b')]);
    const policy = getPolicy('v-test-2');
    expect(policy.rules).toHaveLength(2);
    expect(policy.rules[0].id).toBe('r2a');
  });

  it('listPolicies includes all registered versions', () => {
    registerPolicy('v-test-3', [makeRule('r3')]);
    const policies = listPolicies();
    const versions = policies.map((p) => p.version);
    expect(versions).toContain('v-test-1');
    expect(versions).toContain('v-test-2');
    expect(versions).toContain('v-test-3');
  });

  it('registerPolicy with duplicate version throws immutability error', () => {
    registerPolicy('v-immutable', [makeRule('ri')]);
    expect(() => registerPolicy('v-immutable', [makeRule('ri2')])).toThrow(
      'Policy version already exists (immutable)'
    );
  });

  it('getPolicy for unknown version throws not found error', () => {
    expect(() => getPolicy('v-nonexistent-xyz')).toThrow('Policy version not found');
  });
});

// ─── proposal.store ───────────────────────────────────────────────────────────

describe('proposal.store', () => {
  beforeAll(() => {
    _clearAllProposals();
  });

  it('saveProposal stores proposal; getProposal retrieves it', () => {
    const proposal = {
      id: 'prop-001',
      payload: { action: 'deploy' },
      policyVersion: 'v1',
      policyHash: 'abc123',
      createdAt: Date.now(),
    };
    saveProposal(proposal);
    const retrieved = getProposal('prop-001');
    expect(retrieved.id).toBe('prop-001');
    expect(retrieved.policyVersion).toBe('v1');
  });

  it('hasProposal returns true for stored proposal', () => {
    expect(hasProposal('prop-001')).toBe(true);
  });

  it('hasProposal returns false for unknown id', () => {
    expect(hasProposal('prop-nonexistent')).toBe(false);
  });

  it('saveProposal with duplicate id throws immutability error', () => {
    expect(() =>
      saveProposal({ id: 'prop-001', payload: {}, policyVersion: 'v2', policyHash: 'x', createdAt: 0 })
    ).toThrow('Proposal already exists (immutable)');
  });

  it('getProposal for unknown id throws not found error', () => {
    expect(() => getProposal('prop-missing')).toThrow('Proposal not found');
  });
});

// ─── usage.tracker ────────────────────────────────────────────────────────────

describe('usage.tracker', () => {
  it('recordUsage appends entry; getUsageHistory reflects it', () => {
    const before = getUsageHistory().length;
    recordUsage({ content: 'ok', usage: { totalTokens: 500 }, model: 'gpt-4o' });
    expect(getUsageHistory().length).toBe(before + 1);
  });

  it('recorded entry has model and totalTokens', () => {
    recordUsage({ content: 'hi', usage: { totalTokens: 200 }, model: 'claude-3-opus' });
    const history = getUsageHistory();
    const entry = history[history.length - 1];
    expect(entry.model).toBe('claude-3-opus');
    expect(entry.totalTokens).toBe(200);
    expect(typeof entry.timestamp).toBe('number');
  });

  it('recordUsage with no usage object → totalTokens is undefined', () => {
    recordUsage({ content: 'bare' });
    const history = getUsageHistory();
    const entry = history[history.length - 1];
    expect(entry.totalTokens).toBeUndefined();
    expect(entry.model).toBeUndefined();
  });

  it('getUsageHistory is readonly and cumulative across calls', () => {
    const h1 = getUsageHistory().length;
    recordUsage({ content: 'extra', usage: { totalTokens: 10 } });
    const h2 = getUsageHistory().length;
    expect(h2).toBe(h1 + 1);
  });
});

// ─── proposal.snapshot ────────────────────────────────────────────────────────

describe('proposal.snapshot', () => {
  it('saveSnapshot stores; getSnapshot retrieves by proposalId', () => {
    saveSnapshot({
      proposalId: 'snap-001',
      proposal: { action: 'read' },
      policyVersion: 'v1',
      decision: 'approved',
      timestamp: Date.now(),
    });
    const snap = getSnapshot('snap-001');
    expect(snap).toBeDefined();
    expect(snap!.proposalId).toBe('snap-001');
    expect(snap!.decision).toBe('approved');
  });

  it('getSnapshot returns undefined for unknown proposalId', () => {
    expect(getSnapshot('snap-nonexistent')).toBeUndefined();
  });

  it('listSnapshots returns all saved snapshots', () => {
    saveSnapshot({
      proposalId: 'snap-002',
      proposal: {},
      policyVersion: 'v2',
      decision: 'rejected',
      timestamp: Date.now(),
    });
    const all = listSnapshots();
    const ids = all.map((s) => s.proposalId);
    expect(ids).toContain('snap-001');
    expect(ids).toContain('snap-002');
  });

  it('listSnapshots returns readonly array (length reflects both saves)', () => {
    const snaps = listSnapshots();
    expect(snaps.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── openclaw.config defaults ─────────────────────────────────────────────────

describe('defaultOpenClawConfig', () => {
  it('enabled=false by default (off by default for safety)', () => {
    expect(defaultOpenClawConfig.enabled).toBe(false);
  });

  it('requireHumanApproval=true by default', () => {
    expect(defaultOpenClawConfig.requireHumanApproval).toBe(true);
  });

  it('allowToolExecution=false by default', () => {
    expect(defaultOpenClawConfig.allowToolExecution).toBe(false);
  });
});
