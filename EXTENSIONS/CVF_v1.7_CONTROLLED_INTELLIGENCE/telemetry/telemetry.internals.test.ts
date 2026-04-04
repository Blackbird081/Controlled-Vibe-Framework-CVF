/**
 * CVF v1.7 Controlled Intelligence — Telemetry Internals Dedicated Tests (W6-T49)
 * ==================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage:
 *   logGovernanceEvent / getAuditLog / queryAuditLog (governance_audit_log.ts):
 *     - logged events appear in getAuditLog()
 *     - queryAuditLog filters by eventType
 *     - events have correct eventType, description, timestamp
 *     - getAuditLog returns a copy (not the buffer itself)
 *   recordElegance / getAverageElegance / getWeightedElegance / getEleganceTrend (elegance_score_tracker.ts):
 *     - average = simple mean of scores
 *     - weighted average respects weights
 *     - getEleganceTrend returns recent/overall/improving
 *     - improving=true when recent >= overall
 *   recordAction / recordMistake / getMistakeRate (mistake_rate_tracker.ts):
 *     - mistake rate = mistakes / actions
 *     - no actions → rate=0
 *   calculateVerificationScore (verification_metrics.ts) — pure function:
 *     - total=0 → 0
 *     - all passed → 1.0
 *     - all failed → 0.0
 *     - mixed → passed/total
 *   recordVerification / getOverallVerificationScore / getVerificationHistory (verification_metrics.ts):
 *     - overall score aggregates all recorded runs
 *     - getVerificationHistory returns a copy
 */

import { beforeAll, describe, it, expect } from 'vitest';

import {
  logGovernanceEvent,
  getAuditLog,
  queryAuditLog,
} from './governance_audit_log.js';

import {
  recordElegance,
  getAverageElegance,
  getWeightedElegance,
  getEleganceTrend,
} from './elegance_score_tracker.js';

import {
  recordAction,
  recordMistake,
  getMistakeRate,
} from './mistake_rate_tracker.js';

import {
  calculateVerificationScore,
  recordVerification,
  getOverallVerificationScore,
  getVerificationHistory,
} from './verification_metrics.js';

// ─── File-level setup ─────────────────────────────────────────────────────────
// Module state is isolated per test file in Vitest. Set up all state once
// before any tests run so individual tests can query predictable values.

beforeAll(() => {
  // governance_audit_log: 3 events
  logGovernanceEvent('PHASE_COMPLETE', 'phase done', 's1');
  logGovernanceEvent('RISK_ESCALATE', 'escalated', 's1');
  logGovernanceEvent('PHASE_COMPLETE', 'another phase', 's2');

  // elegance: 3 entries — scores [80, 60, 70], weights [1, 3, 1]
  recordElegance(80, 1.0, 'sess-a');
  recordElegance(60, 3.0, 'sess-a');
  recordElegance(70, 1.0, 'sess-a');

  // mistake rate: 4 actions + 1 mistake → rate = 0.25
  recordAction('sess-b');
  recordAction('sess-b');
  recordAction('sess-b');
  recordAction('sess-b');
  recordMistake('sess-b');

  // verification: 2 runs → total 15 passed, 5 failed → score = 0.75
  recordVerification({ testsPassed: 10, testsFailed: 0 }, 'sess-c');
  recordVerification({ testsPassed: 5, testsFailed: 5 }, 'sess-c');
});

// ─── calculateVerificationScore (pure) ───────────────────────────────────────

describe('calculateVerificationScore', () => {
  it('total=0 → 0', () => {
    expect(calculateVerificationScore({ testsPassed: 0, testsFailed: 0 })).toBe(0);
  });

  it('all passed → 1.0', () => {
    expect(calculateVerificationScore({ testsPassed: 10, testsFailed: 0 })).toBe(1.0);
  });

  it('all failed → 0.0', () => {
    expect(calculateVerificationScore({ testsPassed: 0, testsFailed: 10 })).toBe(0.0);
  });

  it('6 passed, 4 failed → 0.6', () => {
    expect(calculateVerificationScore({ testsPassed: 6, testsFailed: 4 })).toBeCloseTo(0.6);
  });

  it('1 passed, 1 failed → 0.5', () => {
    expect(calculateVerificationScore({ testsPassed: 1, testsFailed: 1 })).toBe(0.5);
  });
});

// ─── governance_audit_log ─────────────────────────────────────────────────────

describe('governance_audit_log', () => {
  it('getAuditLog returns at least 3 events', () => {
    expect(getAuditLog().length).toBeGreaterThanOrEqual(3);
  });

  it('getAuditLog returns a copy (not the buffer)', () => {
    const log1 = getAuditLog();
    const log2 = getAuditLog();
    expect(log1).not.toBe(log2);
  });

  it('queryAuditLog("PHASE_COMPLETE") returns events with that type', () => {
    const result = queryAuditLog('PHASE_COMPLETE');
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.every((e) => e.eventType === 'PHASE_COMPLETE')).toBe(true);
  });

  it('queryAuditLog("RISK_ESCALATE") returns events with that type', () => {
    const result = queryAuditLog('RISK_ESCALATE');
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].eventType).toBe('RISK_ESCALATE');
  });

  it('queryAuditLog for unknown type returns empty', () => {
    expect(queryAuditLog('NONEXISTENT_TYPE')).toHaveLength(0);
  });

  it('events have description preserved', () => {
    const result = queryAuditLog('RISK_ESCALATE');
    expect(result[0].description).toBe('escalated');
  });

  it('events have numeric timestamp', () => {
    const log = getAuditLog();
    expect(typeof log[0].timestamp).toBe('number');
    expect(log[0].timestamp).toBeGreaterThan(0);
  });
});

// ─── elegance_score_tracker ───────────────────────────────────────────────────

describe('elegance_score_tracker', () => {
  it('getAverageElegance returns simple mean of scores', () => {
    // (80 + 60 + 70) / 3 = 70
    expect(getAverageElegance()).toBeCloseTo(70);
  });

  it('getWeightedElegance respects weights', () => {
    // (80*1 + 60*3 + 70*1) / (1+3+1) = 330/5 = 66
    expect(getWeightedElegance()).toBeCloseTo(66);
  });

  it('getEleganceTrend returns object with recent, overall, improving', () => {
    const trend = getEleganceTrend();
    expect(trend).toHaveProperty('recent');
    expect(trend).toHaveProperty('overall');
    expect(trend).toHaveProperty('improving');
  });

  it('getEleganceTrend.overall equals getWeightedElegance', () => {
    const trend = getEleganceTrend();
    expect(trend.overall).toBeCloseTo(getWeightedElegance());
  });

  it('getEleganceTrend improving=true when recent >= overall', () => {
    // recent (simple avg of last 10) = 70, overall (weighted) = 66 → improving
    const trend = getEleganceTrend();
    expect(trend.improving).toBe(trend.recent >= trend.overall);
  });
});

// ─── mistake_rate_tracker ─────────────────────────────────────────────────────

describe('mistake_rate_tracker', () => {
  it('getMistakeRate returns mistakes/actions = 0.25', () => {
    // 1 mistake / 4 actions = 0.25
    expect(getMistakeRate()).toBeCloseTo(0.25);
  });
});

// ─── verification_metrics (stateful) ─────────────────────────────────────────

describe('verification_metrics stateful', () => {
  it('getOverallVerificationScore → 0.75 (15 passed, 5 failed)', () => {
    // Run 1: 10/0, Run 2: 5/5 → total 15 passed 5 failed → 15/20 = 0.75
    expect(getOverallVerificationScore()).toBeCloseTo(0.75);
  });

  it('getVerificationHistory returns at least 2 entries', () => {
    expect(getVerificationHistory().length).toBeGreaterThanOrEqual(2);
  });

  it('getVerificationHistory returns a copy', () => {
    const h1 = getVerificationHistory();
    const h2 = getVerificationHistory();
    expect(h1).not.toBe(h2);
  });

  it('history entries have testsPassed, testsFailed, timestamp', () => {
    const history = getVerificationHistory();
    const first = history[0];
    expect(typeof first.testsPassed).toBe('number');
    expect(typeof first.testsFailed).toBe('number');
    expect(typeof first.timestamp).toBe('number');
  });
});
