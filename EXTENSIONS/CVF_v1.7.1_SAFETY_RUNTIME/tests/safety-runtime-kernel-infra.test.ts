/**
 * CVF v1.7.1 Safety Runtime — Kernel Infrastructure Dedicated Tests (W6-T58)
 * ===========================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (6 kernel infrastructure contracts):
 *   kernel/04_refusal_router/capability.guard.ts:
 *     CapabilityGuard.validate — allowed capability passes, denied throws
 *   kernel/05_creative_control/refusal.registry.ts:
 *     RefusalRegistry.record / getAll — accumulates entries with fields
 *   kernel/05_creative_control/lineage.store.ts:
 *     LineageStore.add / getAll — in-memory accumulation, empty default
 *   kernel/05_creative_control/invariant.checker.ts:
 *     InvariantChecker.validateNoCrossDomainReuse — same domain ok, cross throws
 *   internal_ledger/risk_evolution.ts:
 *     RiskEvolution.record / getHistory — snapshot accumulation
 *   internal_ledger/lineage_tracker.ts:
 *     LineageTracker.record / getAll — node accumulation
 */

import { describe, it, expect } from 'vitest';

import { CapabilityGuard } from '../kernel-architecture/kernel/04_refusal_router/capability.guard';
import { RefusalRegistry } from '../kernel-architecture/kernel/05_creative_control/refusal.registry';
import { LineageStore } from '../kernel-architecture/kernel/05_creative_control/lineage.store';
import { InvariantChecker } from '../kernel-architecture/kernel/05_creative_control/invariant.checker';
import { RiskEvolution } from '../kernel-architecture/internal_ledger/risk_evolution';
import { LineageTracker } from '../kernel-architecture/internal_ledger/lineage_tracker';

// ─── CapabilityGuard ──────────────────────────────────────────────────────────

describe('CapabilityGuard', () => {
  const guard = new CapabilityGuard();

  it('allowed capability "read" → validate passes without throwing', () => {
    expect(() => guard.validate({ capability: 'read', source: 'test' })).not.toThrow();
  });

  it('denied capability "write" → validate throws "Capability denied: write"', () => {
    expect(() => guard.validate({ capability: 'write', source: 'test' })).toThrow(
      'Capability denied: write'
    );
  });
});

// ─── RefusalRegistry ──────────────────────────────────────────────────────────

describe('RefusalRegistry', () => {
  it('record + getAll returns entries with reason, domain, timestamp', () => {
    const registry = new RefusalRegistry();
    registry.record('explicit content', 'creative');
    const all = registry.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].reason).toBe('explicit content');
    expect(all[0].domain).toBe('creative');
    expect(typeof all[0].timestamp).toBe('number');
  });

  it('multiple records accumulate in order', () => {
    const registry = new RefusalRegistry();
    registry.record('reason-A', 'domain-X');
    registry.record('reason-B', 'domain-Y');
    const all = registry.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].reason).toBe('reason-A');
    expect(all[1].reason).toBe('reason-B');
  });

  it('empty registry → getAll returns empty array', () => {
    const registry = new RefusalRegistry();
    expect(registry.getAll()).toHaveLength(0);
  });
});

// ─── LineageStore ─────────────────────────────────────────────────────────────

describe('LineageStore', () => {
  it('add + getAll returns the stored node', () => {
    const store = new LineageStore();
    store.add({ id: 'n1', type: 'input', domain: 'informational', parentIds: [], timestamp: Date.now() });
    const nodes = store.getAll();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('n1');
    expect(nodes[0].domain).toBe('informational');
  });

  it('multiple nodes accumulate', () => {
    const store = new LineageStore();
    store.add({ id: 'n1', type: 'input', domain: 'informational', parentIds: [], timestamp: 1 });
    store.add({ id: 'n2', type: 'process', domain: 'informational', parentIds: ['n1'], timestamp: 2 });
    expect(store.getAll()).toHaveLength(2);
  });

  it('empty store → getAll returns empty array', () => {
    const store = new LineageStore();
    expect(store.getAll()).toHaveLength(0);
  });
});

// ─── InvariantChecker ────────────────────────────────────────────────────────

describe('InvariantChecker', () => {
  it('nodes within same domain → validateNoCrossDomainReuse passes', () => {
    const store = new LineageStore();
    store.add({ id: 'a', type: 'input', domain: 'finance', parentIds: [], timestamp: 1 });
    store.add({ id: 'b', type: 'process', domain: 'finance', parentIds: ['a'], timestamp: 2 });
    const checker = new InvariantChecker(store);
    expect(() => checker.validateNoCrossDomainReuse()).not.toThrow();
  });

  it('child node referencing parent in different domain → throws cross-domain error', () => {
    const store = new LineageStore();
    store.add({ id: 'p1', type: 'input', domain: 'legal', parentIds: [], timestamp: 1 });
    store.add({ id: 'c1', type: 'output', domain: 'medical', parentIds: ['p1'], timestamp: 2 });
    const checker = new InvariantChecker(store);
    expect(() => checker.validateNoCrossDomainReuse()).toThrow('Cross-domain reuse detected');
  });
});

// ─── RiskEvolution ────────────────────────────────────────────────────────────

describe('RiskEvolution', () => {
  it('record + getHistory returns snapshot with all fields', () => {
    const evo = new RiskEvolution();
    evo.record({
      requestId: 'req-001',
      policyVersion: 'v1',
      decisionCode: 'ALLOW',
      traceHash: 'abc123',
      level: 'low',
      score: 10,
      reasons: ['test'],
      timestamp: Date.now(),
    });
    const history = evo.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].requestId).toBe('req-001');
    expect(history[0].level).toBe('low');
    expect(history[0].score).toBe(10);
  });

  it('multiple snapshots accumulate in insertion order', () => {
    const evo = new RiskEvolution();
    evo.record({ requestId: 'r1', policyVersion: 'v1', decisionCode: 'A', traceHash: 'h1', level: 'low', score: 5, timestamp: 1 });
    evo.record({ requestId: 'r2', policyVersion: 'v1', decisionCode: 'B', traceHash: 'h2', level: 'high', score: 80, timestamp: 2 });
    expect(evo.getHistory()).toHaveLength(2);
    expect(evo.getHistory()[1].level).toBe('high');
  });
});

// ─── LineageTracker ───────────────────────────────────────────────────────────

describe('LineageTracker', () => {
  it('record + getAll returns the tracked node', () => {
    const tracker = new LineageTracker();
    tracker.record({
      id: 'node-A',
      parentIds: [],
      domain: 'finance',
      requestId: 'req-X',
      policyVersion: 'v1',
      decisionCode: 'ALLOW',
      traceHash: 'trace-abc',
      timestamp: Date.now(),
    });
    const nodes = tracker.getAll();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('node-A');
    expect(nodes[0].domain).toBe('finance');
  });

  it('multiple records accumulate; empty tracker returns []', () => {
    const trackerEmpty = new LineageTracker();
    expect(trackerEmpty.getAll()).toHaveLength(0);

    const tracker = new LineageTracker();
    tracker.record({ id: 'n1', parentIds: [], domain: 'D', requestId: 'r', policyVersion: 'v1', decisionCode: 'A', traceHash: 'h', timestamp: 1 });
    tracker.record({ id: 'n2', parentIds: ['n1'], domain: 'D', requestId: 'r', policyVersion: 'v1', decisionCode: 'A', traceHash: 'h', timestamp: 2 });
    expect(tracker.getAll()).toHaveLength(2);
  });
});
