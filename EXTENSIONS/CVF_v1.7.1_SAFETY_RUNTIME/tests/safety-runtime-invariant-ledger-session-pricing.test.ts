/**
 * CVF v1.7.1 Safety Runtime — Invariant Checker, Trace Reporter, Internal Ledger,
 * Session State, Pricing Registry & Checkpoint Store Tests (W6-T74)
 * ============================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (8 contracts):
 *   kernel/05_creative_control/invariant.checker.ts:
 *     InvariantChecker.validateNoCrossDomainReuse — same-domain → no throw;
 *       cross-domain parent → throws with domain names in message
 *   kernel/05_creative_control/trace.reporter.ts:
 *     TraceReporter.generateReport — returns {lineage, events} snapshots
 *   kernel-architecture/internal_ledger/boundary_snapshot.ts:
 *     BoundarySnapshot.capture / getAll — single; accumulates
 *   kernel-architecture/internal_ledger/lineage_tracker.ts:
 *     LineageTracker.record / getAll — single; accumulates
 *   kernel-architecture/internal_ledger/risk_evolution.ts:
 *     RiskEvolution.record / getHistory — single; accumulates
 *   kernel-architecture/runtime/session_state.ts:
 *     SessionState — getDomain undefined; setDomain/getDomain; setRisk/getRisk
 *   cvf-ui/pricing/pricing.registry.ts:
 *     calculateUsdCost — gpt-4o formula; claude-3-opus formula; unknown model throws
 *   core/checkpoint.store.ts:
 *     saveCheckpoint / getCheckpoint / hasCheckpoint / _clearAllCheckpoints
 */

import { beforeEach, describe, it, expect } from 'vitest';

import { InvariantChecker } from '../kernel-architecture/kernel/05_creative_control/invariant.checker';
import { TraceReporter } from '../kernel-architecture/kernel/05_creative_control/trace.reporter';
import { LineageStore } from '../kernel-architecture/kernel/05_creative_control/lineage.store';
import { AuditLogger } from '../kernel-architecture/kernel/05_creative_control/audit.logger';
import { BoundarySnapshot } from '../kernel-architecture/internal_ledger/boundary_snapshot';
import { LineageTracker } from '../kernel-architecture/internal_ledger/lineage_tracker';
import { RiskEvolution } from '../kernel-architecture/internal_ledger/risk_evolution';
import { SessionState } from '../kernel-architecture/runtime/session_state';
import { calculateUsdCost } from '../cvf-ui/pricing/pricing.registry';
import {
  saveCheckpoint,
  getCheckpoint,
  hasCheckpoint,
  _clearAllCheckpoints,
} from '../core/checkpoint.store';
import type { LifecycleCheckpoint } from '../types/index';

// ─── InvariantChecker ────────────────────────────────────────────────────────

describe('InvariantChecker.validateNoCrossDomainReuse', () => {
  it('no cross-domain parents → does not throw', () => {
    const store = new LineageStore();
    store.add({ id: 'n1', type: 'input', domain: 'finance', parentIds: [], timestamp: 1 });
    store.add({ id: 'n2', type: 'output', domain: 'finance', parentIds: ['n1'], timestamp: 2 });
    const checker = new InvariantChecker(store);
    expect(() => checker.validateNoCrossDomainReuse()).not.toThrow();
  });

  it('child has parent from different domain → throws with both domain names', () => {
    const store = new LineageStore();
    store.add({ id: 'p1', type: 'input', domain: 'medical', parentIds: [], timestamp: 1 });
    store.add({ id: 'c1', type: 'output', domain: 'legal', parentIds: ['p1'], timestamp: 2 });
    const checker = new InvariantChecker(store);
    expect(() => checker.validateNoCrossDomainReuse()).toThrow(/medical.*legal|legal.*medical/);
  });
});

// ─── TraceReporter ───────────────────────────────────────────────────────────

describe('TraceReporter.generateReport', () => {
  it('returns object with lineage (from store) and events (from logger)', () => {
    const store = new LineageStore();
    const logger = new AuditLogger();
    store.add({ id: 'n1', type: 'process', domain: 'test', parentIds: [], timestamp: 1 });
    logger.log('INFO', 'processed');
    const reporter = new TraceReporter(store, logger);
    const report = reporter.generateReport();
    expect(report.lineage.length).toBe(1);
    expect(report.events.length).toBe(1);
    expect(report.events[0].message).toBe('processed');
  });
});

// ─── BoundarySnapshot ────────────────────────────────────────────────────────

describe('BoundarySnapshot', () => {
  const makeState = (id: string) => ({
    requestId: id,
    policyVersion: 'v1',
    decisionCode: 'ALLOW',
    traceHash: 'abc',
    domain: 'analytical',
    contractValid: true,
    refusalTriggered: false,
    timestamp: Date.now(),
  });

  it('capture + getAll returns the captured state', () => {
    const snap = new BoundarySnapshot();
    const state = makeState('req-1');
    snap.capture(state);
    expect(snap.getAll()).toContain(state);
  });

  it('multiple captures accumulate', () => {
    const snap = new BoundarySnapshot();
    snap.capture(makeState('req-a'));
    snap.capture(makeState('req-b'));
    expect(snap.getAll().length).toBe(2);
  });
});

// ─── LineageTracker ───────────────────────────────────────────────────────────

describe('LineageTracker', () => {
  const makeNode = (id: string) => ({
    id,
    parentIds: [],
    domain: 'finance',
    requestId: 'r1',
    policyVersion: 'v1',
    decisionCode: 'ALLOW',
    traceHash: 'xyz',
    timestamp: Date.now(),
  });

  it('record + getAll returns the recorded node', () => {
    const tracker = new LineageTracker();
    const node = makeNode('lt-1');
    tracker.record(node);
    expect(tracker.getAll()).toContain(node);
  });

  it('multiple records accumulate', () => {
    const tracker = new LineageTracker();
    tracker.record(makeNode('lt-a'));
    tracker.record(makeNode('lt-b'));
    expect(tracker.getAll().length).toBe(2);
  });
});

// ─── RiskEvolution ───────────────────────────────────────────────────────────

describe('RiskEvolution', () => {
  const makeSnapshot = (id: string, level: string) => ({
    requestId: id,
    policyVersion: 'v1',
    decisionCode: 'ALLOW',
    traceHash: 'abc',
    level,
    score: 10,
    timestamp: Date.now(),
  });

  it('record + getHistory returns the snapshot', () => {
    const evo = new RiskEvolution();
    const snap = makeSnapshot('re-1', 'LOW');
    evo.record(snap);
    expect(evo.getHistory()).toContain(snap);
  });

  it('multiple records accumulate in history', () => {
    const evo = new RiskEvolution();
    evo.record(makeSnapshot('re-a', 'LOW'));
    evo.record(makeSnapshot('re-b', 'HIGH'));
    expect(evo.getHistory().length).toBe(2);
  });
});

// ─── SessionState ─────────────────────────────────────────────────────────────

describe('SessionState', () => {
  it('getDomain() is undefined before setDomain', () => {
    const s = new SessionState();
    expect(s.getDomain()).toBeUndefined();
  });

  it('setDomain + getDomain returns the set domain', () => {
    const s = new SessionState();
    s.setDomain('analytics');
    expect(s.getDomain()).toBe('analytics');
  });

  it('setRisk + getRisk returns the set risk level', () => {
    const s = new SessionState();
    s.setRisk('R2');
    expect(s.getRisk()).toBe('R2');
  });
});

// ─── calculateUsdCost ─────────────────────────────────────────────────────────

describe('calculateUsdCost', () => {
  it('gpt-4o: 1000 input + 1000 output tokens → 0.005 + 0.015 = 0.02', () => {
    expect(calculateUsdCost('gpt-4o', 1000, 1000)).toBeCloseTo(0.02);
  });

  it('claude-3-opus: 2000 input + 500 output tokens → 0.030 + 0.0375 = 0.0675', () => {
    expect(calculateUsdCost('claude-3-opus', 2000, 500)).toBeCloseTo(0.0675);
  });

  it('unknown model → throws "Unknown model pricing"', () => {
    expect(() => calculateUsdCost('unknown-model', 100, 100)).toThrow('Unknown model pricing');
  });
});

// ─── checkpoint.store ─────────────────────────────────────────────────────────

describe('checkpoint.store', () => {
  const makeCheckpoint = (proposalId: string): LifecycleCheckpoint => ({
    proposalId,
    state: 'validated',
    policyVersion: 'v1',
    policyHash: 'hash-abc',
    simulateOnly: false,
    checkpointedAt: Date.now(),
    resumeToken: 'token-xyz',
    resumeCount: 0,
  });

  beforeEach(() => {
    _clearAllCheckpoints();
  });

  it('hasCheckpoint returns false when no checkpoint saved', () => {
    expect(hasCheckpoint('cp-none')).toBe(false);
  });

  it('saveCheckpoint → hasCheckpoint returns true', () => {
    saveCheckpoint(makeCheckpoint('cp-1'));
    expect(hasCheckpoint('cp-1')).toBe(true);
  });

  it('getCheckpoint returns saved checkpoint with correct fields', () => {
    const cp = makeCheckpoint('cp-2');
    saveCheckpoint(cp);
    const retrieved = getCheckpoint('cp-2');
    expect(retrieved.proposalId).toBe('cp-2');
    expect(retrieved.state).toBe('validated');
    expect(retrieved.policyVersion).toBe('v1');
  });

  it('getCheckpoint for unknown proposalId → throws "Checkpoint not found"', () => {
    expect(() => getCheckpoint('no-such-id')).toThrow('Checkpoint not found');
  });
});
