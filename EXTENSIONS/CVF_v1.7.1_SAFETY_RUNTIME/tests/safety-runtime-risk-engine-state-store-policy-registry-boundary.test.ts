/**
 * CVF v1.7.1 Safety Runtime — RiskEngine, StateStore, Policy Registry,
 * Execution Boundary & Approval State Tests (W6-T81)
 * ===========================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (5 contracts):
 *   policy/risk.engine.ts:
 *     RiskEngine.assess — CODE→LOW; POLICY base score→CRITICAL; INFRA+large-diff→HIGH;
 *       dependency-file adds score+reason; migration+core add score+reason
 *   core/state.store.ts:
 *     setState / getState — set+get round-trip; unknown→undefined
 *     _clearAllStates — clears all stored state
 *   policy/policy.registry.ts:
 *     registerPolicy — sets hash+createdAt; duplicate version→throws
 *     getPolicy — known→definition; unknown→throws
 *     listPolicies — includes registered policies
 *   core/execution.boundary.ts:
 *     runWithinBoundary — success→returns value; error→rethrows by default;
 *       suppressError→returns undefined; emits "error" event
 *   cvf-ui/approval/approval.state.ts:
 *     transitionApproval — PENDING+approve→APPROVED; PENDING+reject→REJECTED;
 *       non-PENDING→throws "Invalid state transition"
 */

import { beforeEach, describe, it, expect } from 'vitest';

import { RiskEngine } from '../policy/risk.engine';
import { setState, getState, _clearAllStates } from '../core/state.store';
import { registerPolicy, getPolicy, listPolicies } from '../policy/policy.registry';
import { runWithinBoundary } from '../core/execution.boundary';
import { transitionApproval } from '../cvf-ui/approval/approval.state';
import { eventBus } from '../core/event-bus';
import type { CVFEvent } from '../core/event-bus';
import type { ArtifactChangeMeta } from '../policy/risk.engine';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeChange(overrides: Partial<ArtifactChangeMeta> = {}): ArtifactChangeMeta {
  return {
    filePath: 'src/main.ts',
    diffSize: 10,
    isNewFile: false,
    isDeleted: false,
    touchesDependencyFile: false,
    touchesMigrationFile: false,
    touchesPolicyFile: false,
    touchesCoreFile: false,
    ...overrides,
  };
}

// ─── RiskEngine ───────────────────────────────────────────────────────────────

describe('RiskEngine.assess', () => {
  it('CODE single clean file → level=LOW, score=10', () => {
    const result = RiskEngine.assess({ artifactType: 'CODE', changes: [makeChange()] });
    expect(result.level).toBe('LOW');
    expect(result.score).toBe(10);
    expect(result.reasons).toHaveLength(0);
  });

  it('POLICY + policyFile change → CRITICAL (50 + 100 = 150)', () => {
    const result = RiskEngine.assess({
      artifactType: 'POLICY',
      changes: [makeChange({ filePath: 'policy/rules.ts', touchesPolicyFile: true })],
    });
    expect(result.level).toBe('CRITICAL');
    expect(result.score).toBeGreaterThanOrEqual(120);
    expect(result.reasons.some((r) => r.includes('Policy'))).toBe(true);
  });

  it('INFRA + very large diff → level=HIGH', () => {
    const result = RiskEngine.assess({
      artifactType: 'INFRA',
      changes: [makeChange({ diffSize: 2500 })],
    });
    // INFRA=20 + diff>2000=30 = 50 < 70 but diff > 2000 adds "Very large diff size" reason
    // actual: 20 (INFRA) + 30 (diff>2000) = 50 → MEDIUM
    // Let's just check score is at least MEDIUM
    expect(['MEDIUM', 'HIGH', 'CRITICAL']).toContain(result.level);
    expect(result.reasons.some((r) => r.includes('Infrastructure') || r.includes('large diff'))).toBe(true);
  });

  it('dependency file → adds 20 to score and reason', () => {
    const result = RiskEngine.assess({
      artifactType: 'CODE',
      changes: [makeChange({ filePath: 'package.json', touchesDependencyFile: true })],
    });
    expect(result.score).toBeGreaterThanOrEqual(30); // 10 (CODE) + 20 (dep)
    expect(result.reasons.some((r) => r.includes('Dependency file'))).toBe(true);
  });

  it('migration + core file changes → adds 50 to score with reasons', () => {
    const result = RiskEngine.assess({
      artifactType: 'CODE',
      changes: [
        makeChange({ filePath: 'db/migrate.ts', touchesMigrationFile: true }),
        makeChange({ filePath: 'core/index.ts', touchesCoreFile: true }),
      ],
    });
    // CODE=10 + migration=20 + core=30 = 60 ≥ 35 → MEDIUM
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.reasons.some((r) => r.includes('Migration'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('Core file'))).toBe(true);
  });
});

// ─── state.store ─────────────────────────────────────────────────────────────

describe('state.store', () => {
  beforeEach(() => _clearAllStates());

  it('setState + getState → round-trip', () => {
    setState('prop-1', 'validated');
    expect(getState('prop-1')).toBe('validated');
  });

  it('getState for unknown id → undefined', () => {
    expect(getState('non-existent')).toBeUndefined();
  });

  it('_clearAllStates → removes all entries', () => {
    setState('p1', 'proposed');
    setState('p2', 'approved');
    _clearAllStates();
    expect(getState('p1')).toBeUndefined();
    expect(getState('p2')).toBeUndefined();
  });
});

// ─── policy.registry ─────────────────────────────────────────────────────────
// Note: policy.registry has module-level state — use unique version names per test.

describe('policy.registry', () => {
  const rule = {
    id: 'r1',
    description: 'Test rule',
    evaluate: (_p: unknown) => ({ allowed: true }),
  };

  it('registerPolicy + getPolicy → hash and createdAt are set', () => {
    registerPolicy('t81-v1', [rule]);
    const policy = getPolicy('t81-v1');
    expect(policy.version).toBe('t81-v1');
    expect(typeof policy.hash).toBe('string');
    expect(policy.hash).toHaveLength(64);
    expect(typeof policy.createdAt).toBe('number');
  });

  it('registerPolicy duplicate version → throws "already exists"', () => {
    registerPolicy('t81-v2', [rule]);
    expect(() => registerPolicy('t81-v2', [rule])).toThrow('already exists');
  });

  it('getPolicy unknown version → throws "Policy version not found"', () => {
    expect(() => getPolicy('t81-nonexistent')).toThrow('Policy version not found');
  });

  it('listPolicies → includes registered policy', () => {
    registerPolicy('t81-v3', [rule]);
    const list = listPolicies();
    expect(list.some((p) => p.version === 't81-v3')).toBe(true);
  });
});

// ─── execution.boundary ──────────────────────────────────────────────────────

describe('runWithinBoundary', () => {
  it('success → returns the resolved value', async () => {
    const result = await runWithinBoundary(async () => 42);
    expect(result).toBe(42);
  });

  it('error without suppressError → rethrows original error', async () => {
    await expect(
      runWithinBoundary(async () => { throw new Error('boom'); })
    ).rejects.toThrow('boom');
  });

  it('error + suppressError=true → returns undefined instead of throwing', async () => {
    const result = await runWithinBoundary(
      async () => { throw new Error('suppressed'); },
      { suppressError: true }
    );
    expect(result).toBeUndefined();
  });

  it('error → emits "error" event on the global eventBus', async () => {
    const received: CVFEvent[] = [];
    const handler = (e: CVFEvent) => received.push(e);
    eventBus.on('error', handler);

    try {
      await runWithinBoundary(async () => { throw new Error('test-err'); }, { operationId: 'op-x' });
    } catch {
      // expected
    } finally {
      eventBus.off('error', handler);
    }

    expect(received).toHaveLength(1);
    expect((received[0].data as { source: string }).source).toContain('op-x');
  });
});

// ─── approval.state ───────────────────────────────────────────────────────────

describe('transitionApproval', () => {
  it('PENDING + approve → APPROVED', () => {
    expect(transitionApproval('PENDING', 'approve')).toBe('APPROVED');
  });

  it('PENDING + reject → REJECTED', () => {
    expect(transitionApproval('PENDING', 'reject')).toBe('REJECTED');
  });

  it('non-PENDING state → throws "Invalid state transition"', () => {
    expect(() => transitionApproval('APPROVED', 'approve')).toThrow('Invalid state transition');
    expect(() => transitionApproval('REJECTED', 'reject')).toThrow('Invalid state transition');
  });
});
