/**
 * CVF Phase 1.P — Canonical Contract Conformance Test Stubs
 * ===========================================================
 * Conformance stubs for PolicyEngine, RiskEngine, and GuardEngine contracts.
 * Each stub verifies the structural contract shape and R-scale binding.
 * These stubs pass immediately — they are shape-only checks.
 * Full integration tests are deferred to Phase 2.B runtime wire-up.
 *
 * Authorized by: docs/baselines/CVF_GC018_PHASE_1P_POLICY_RISK_GUARD_CONVERGENCE_2026-05-18.md
 */

import { describe, it, expect } from 'vitest';

import {
  RISK_LEVEL_ORDER,
  R_SCALE_POLICY_BINDING,
  isMoreSevere,
  maxRiskLevel,
  CANONICAL_GUARD_ENGINE,
  GUARD_ENGINE_ADAPTER_MAP,
  POLICY_ENGINE_ADAPTER_MAP,
  RISK_ENGINE_ADAPTER_MAP,
} from './index';

import type {
  PolicyEngine,
  PolicyRequestContext,
  PolicyDecisionResult,
  RiskEngine,
  RiskAssessmentContext,
  RiskAssessmentResult,
  GuardEngineAdapter,
  RiskLevel,
} from './index';

// ─── R-Scale Conformance ──────────────────────────────────────────────────────

describe('RiskLevel R-scale canonical binding', () => {
  it('defines all four R-scale levels', () => {
    const levels: RiskLevel[] = ['R0', 'R1', 'R2', 'R3'];
    for (const level of levels) {
      expect(RISK_LEVEL_ORDER[level]).toBeTypeOf('number');
    }
  });

  it('orders R-scale levels correctly: R0 < R1 < R2 < R3', () => {
    expect(RISK_LEVEL_ORDER.R0).toBeLessThan(RISK_LEVEL_ORDER.R1);
    expect(RISK_LEVEL_ORDER.R1).toBeLessThan(RISK_LEVEL_ORDER.R2);
    expect(RISK_LEVEL_ORDER.R2).toBeLessThan(RISK_LEVEL_ORDER.R3);
  });

  it('isMoreSevere returns correct ordering', () => {
    expect(isMoreSevere('R3', 'R0')).toBe(true);
    expect(isMoreSevere('R0', 'R3')).toBe(false);
    expect(isMoreSevere('R2', 'R2')).toBe(false);
  });

  it('maxRiskLevel returns the higher of two levels', () => {
    expect(maxRiskLevel('R1', 'R3')).toBe('R3');
    expect(maxRiskLevel('R3', 'R1')).toBe('R3');
    expect(maxRiskLevel('R0', 'R0')).toBe('R0');
  });

  it('R-scale policy binding covers all four levels', () => {
    const levels: RiskLevel[] = ['R0', 'R1', 'R2', 'R3'];
    for (const level of levels) {
      expect(R_SCALE_POLICY_BINDING[level]).toBeDefined();
    }
  });

  it('R-scale policy binding maps correctly', () => {
    expect(R_SCALE_POLICY_BINDING.R0).toBe('allow');
    expect(R_SCALE_POLICY_BINDING.R1).toBe('log');
    expect(R_SCALE_POLICY_BINDING.R2).toBe('escalate');
    expect(R_SCALE_POLICY_BINDING.R3).toBe('deny');
  });
});

// ─── PolicyEngine Contract Shape ──────────────────────────────────────────────

describe('PolicyEngine contract conformance', () => {
  it('a minimal PolicyEngine implementation satisfies the interface', () => {
    const mockEngine: PolicyEngine = {
      engineId: 'test-policy-engine',
      async evaluate(ctx: PolicyRequestContext): Promise<PolicyDecisionResult> {
        return {
          decision: 'allow',
          rationale: 'stub',
          riskLevel: 'R0',
          evaluatedAt: new Date().toISOString(),
        };
      },
      covers: () => ['*'],
    };

    expect(mockEngine.engineId).toBe('test-policy-engine');
    expect(typeof mockEngine.evaluate).toBe('function');
    expect(typeof mockEngine.covers).toBe('function');
    expect(mockEngine.covers()).toContain('*');
  });

  it('PolicyDecisionResult requires decision, rationale, riskLevel, evaluatedAt', async () => {
    const mockEngine: PolicyEngine = {
      engineId: 'shape-check',
      async evaluate(_ctx: PolicyRequestContext): Promise<PolicyDecisionResult> {
        return {
          decision: 'deny',
          rationale: 'R3 detected',
          riskLevel: 'R3',
          evaluatedAt: '2026-05-18T00:00:00Z',
        };
      },
      covers: () => [],
    };

    const ctx: PolicyRequestContext = {
      agentId: 'test-agent',
      action: 'execute_skill',
      payload: {},
    };

    const result = await mockEngine.evaluate(ctx);
    expect(result.decision).toBe('deny');
    expect(result.riskLevel).toBe('R3');
    expect(result.evaluatedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });
});

// ─── RiskEngine Contract Shape ────────────────────────────────────────────────

describe('RiskEngine contract conformance', () => {
  it('a minimal RiskEngine implementation satisfies the interface', () => {
    const mockEngine: RiskEngine = {
      engineId: 'test-risk-engine',
      async assess(_ctx: RiskAssessmentContext): Promise<RiskAssessmentResult> {
        return {
          level: 'R1',
          summary: 'Low risk detected',
          signals: [{ source: 'test', level: 'R1', reason: 'stub' }],
          assessedAt: new Date().toISOString(),
        };
      },
      covers: () => ['*'],
    };

    expect(mockEngine.engineId).toBe('test-risk-engine');
    expect(typeof mockEngine.assess).toBe('function');
  });

  it('RiskAssessmentResult aggregates signals correctly', async () => {
    const mockEngine: RiskEngine = {
      engineId: 'aggregation-check',
      async assess(_ctx: RiskAssessmentContext): Promise<RiskAssessmentResult> {
        const signals = [
          { source: 'contamination_guard', level: 'R2' as RiskLevel, reason: 'contamination detected' },
          { source: 'refusal_router', level: 'R1' as RiskLevel, reason: 'low risk' },
        ];
        return {
          level: 'R2', // max of signals
          summary: 'Contamination risk present',
          signals,
          assessedAt: '2026-05-18T00:00:00Z',
        };
      },
      covers: () => ['*'],
    };

    const result = await mockEngine.assess({
      agentId: 'agent-1',
      action: 'modify_file',
      payload: {},
    });

    expect(result.level).toBe('R2');
    expect(result.signals).toHaveLength(2);
    // Aggregated level must be >= all signal levels
    const maxSignalOrder = Math.max(
      ...result.signals.map((s) => RISK_LEVEL_ORDER[s.level])
    );
    expect(RISK_LEVEL_ORDER[result.level]).toBeGreaterThanOrEqual(maxSignalOrder);
  });
});

// ─── GuardEngine Adapter Contract ────────────────────────────────────────────

describe('GuardEngine canonical home declaration', () => {
  it('CANONICAL_GUARD_ENGINE points to the correct file', () => {
    expect(CANONICAL_GUARD_ENGINE.class).toBe('GuardRuntimeEngine');
    expect(CANONICAL_GUARD_ENGINE.file).toContain('CVF_GUARD_CONTRACT/src/engine.ts');
    expect(CANONICAL_GUARD_ENGINE.package).toBe('cvf-guard-contract');
  });

  it('a minimal GuardEngineAdapter satisfies the interface', () => {
    const adapter: GuardEngineAdapter = {
      domainId: 'test-domain',
      contributeGuards: () => [
        {
          guardId: 'test-guard',
          triggerLevel: 'R2',
          description: 'Test guard contribution',
        },
      ],
    };

    expect(adapter.domainId).toBe('test-domain');
    const contributions = adapter.contributeGuards();
    expect(contributions).toHaveLength(1);
    expect(contributions[0].triggerLevel).toBe('R2');
  });
});

// ─── Adapter Map Coverage ─────────────────────────────────────────────────────

describe('Phase 1.P adapter map coverage', () => {
  it('PolicyEngine adapter map covers all 13 Phase 1.0 surfaces', () => {
    expect(POLICY_ENGINE_ADAPTER_MAP).toHaveLength(13);
  });

  it('RiskEngine adapter map covers all 26 Phase 1.0 surfaces', () => {
    expect(RISK_ENGINE_ADAPTER_MAP).toHaveLength(26);
  });

  it('GuardEngine adapter map covers all 7 Phase 1.0 surfaces', () => {
    expect(GUARD_ENGINE_ADAPTER_MAP).toHaveLength(7);
  });

  it('every adapter map entry has required fields', () => {
    const allEntries = [
      ...POLICY_ENGINE_ADAPTER_MAP,
      ...RISK_ENGINE_ADAPTER_MAP,
      ...GUARD_ENGINE_ADAPTER_MAP,
    ];
    for (const entry of allEntries) {
      expect(entry.adapterId).toBeTruthy();
      expect(entry.domain).toBeTruthy();
      expect(entry.sourcePath).toBeTruthy();
      expect(['adapter', 'canonical_contract', 'legacy_reference', 'deprecate_candidate'])
        .toContain(entry.disposition);
    }
  });

  it('adapter IDs are unique across all three maps', () => {
    const ids = [
      ...POLICY_ENGINE_ADAPTER_MAP.map((e) => e.adapterId),
      ...RISK_ENGINE_ADAPTER_MAP.map((e) => e.adapterId),
      ...GUARD_ENGINE_ADAPTER_MAP.map((e) => e.adapterId),
    ];
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('canonical_contract surfaces exist in the adapter maps', () => {
    const policyCanonical = POLICY_ENGINE_ADAPTER_MAP.filter(
      (e) => e.disposition === 'canonical_contract'
    );
    const riskCanonical = RISK_ENGINE_ADAPTER_MAP.filter(
      (e) => e.disposition === 'canonical_contract'
    );
    const guardCanonical = GUARD_ENGINE_ADAPTER_MAP.filter(
      (e) => e.disposition === 'canonical_contract'
    );

    expect(policyCanonical.length).toBeGreaterThan(0);
    expect(riskCanonical.length).toBeGreaterThan(0);
    expect(guardCanonical.length).toBeGreaterThan(0);
  });
});
