/**
 * CVF Guard Contract — Full Test Suite
 * =====================================
 * Tests all 6 guards + engine + factory.
 * Promoted from MCP v2.5 test suite with adaptations for contract package.
 */

import { describe, it, expect } from 'vitest';
import {
  createGuardEngine,
  GuardRuntimeEngine,
  PhaseGateGuard,
  RiskGateGuard,
  AuthorityGateGuard,
  MutationBudgetGuard,
  ScopeGuard,
  AuditTrailGuard,
  type GuardRequestContext,
} from './index.js';

function ctx(overrides?: Partial<GuardRequestContext>): GuardRequestContext {
  return {
    requestId: 'test-001',
    phase: 'BUILD',
    riskLevel: 'R0',
    role: 'HUMAN',
    action: 'test_action',
    ...overrides,
  };
}

// ─── Factory ──────────────────────────────────────────────────────────

describe('createGuardEngine', () => {
  it('creates engine with 6 guards', () => {
    const engine = createGuardEngine();
    expect(engine.getGuardCount()).toBe(6);
  });

  it('registers all guard IDs', () => {
    const engine = createGuardEngine();
    const ids = engine.getRegisteredGuards().map((g) => g.id);
    expect(ids).toContain('phase_gate');
    expect(ids).toContain('risk_gate');
    expect(ids).toContain('authority_gate');
    expect(ids).toContain('mutation_budget');
    expect(ids).toContain('scope_guard');
    expect(ids).toContain('audit_trail');
  });

  it('evaluates full pipeline — ALLOW for safe context', () => {
    const engine = createGuardEngine();
    const result = engine.evaluate(ctx());
    expect(result.finalDecision).toBe('ALLOW');
    expect(result.results.length).toBe(6);
  });

  it('blocks AI_AGENT in DISCOVERY phase', () => {
    const engine = createGuardEngine();
    const result = engine.evaluate(ctx({ phase: 'DISCOVERY', role: 'AI_AGENT' }));
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('phase_gate');
    expect(result.agentGuidance).toBeDefined();
  });
});

// ─── Engine ───────────────────────────────────────────────────────────

describe('GuardRuntimeEngine', () => {
  it('creates with default config', () => {
    const engine = new GuardRuntimeEngine();
    expect(engine.getGuardCount()).toBe(0);
    expect(engine.getConfig().strictMode).toBe(true);
  });

  it('supports custom config', () => {
    const engine = new GuardRuntimeEngine({ strictMode: false });
    expect(engine.getConfig().strictMode).toBe(false);
  });

  it('rejects duplicate guards', () => {
    const engine = new GuardRuntimeEngine();
    engine.registerGuard(new PhaseGateGuard());
    expect(() => engine.registerGuard(new PhaseGateGuard())).toThrow();
  });

  it('unregisters guards', () => {
    const engine = new GuardRuntimeEngine();
    engine.registerGuard(new PhaseGateGuard());
    expect(engine.unregisterGuard('phase_gate')).toBe(true);
    expect(engine.getGuardCount()).toBe(0);
  });

  it('stores audit log', () => {
    const engine = createGuardEngine();
    engine.evaluate(ctx());
    expect(engine.getAuditLogSize()).toBe(1);
    const entry = engine.getAuditEntry('test-001');
    expect(entry).toBeDefined();
  });

  it('clears audit log', () => {
    const engine = createGuardEngine();
    engine.evaluate(ctx());
    engine.clearAuditLog();
    expect(engine.getAuditLogSize()).toBe(0);
  });
});

// ─── Phase Gate Guard ─────────────────────────────────────────────────

describe('PhaseGateGuard', () => {
  const guard = new PhaseGateGuard();

  it('allows HUMAN in all phases', () => {
    for (const phase of ['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW'] as const) {
      expect(guard.evaluate(ctx({ phase, role: 'HUMAN' })).decision).toBe('ALLOW');
    }
  });

  it('allows AI_AGENT in BUILD only', () => {
    expect(guard.evaluate(ctx({ phase: 'BUILD', role: 'AI_AGENT' })).decision).toBe('ALLOW');
    expect(guard.evaluate(ctx({ phase: 'DISCOVERY', role: 'AI_AGENT' })).decision).toBe('BLOCK');
    expect(guard.evaluate(ctx({ phase: 'DESIGN', role: 'AI_AGENT' })).decision).toBe('BLOCK');
    expect(guard.evaluate(ctx({ phase: 'REVIEW', role: 'AI_AGENT' })).decision).toBe('BLOCK');
  });

  it('provides agentGuidance on block', () => {
    const r = guard.evaluate(ctx({ phase: 'DISCOVERY', role: 'AI_AGENT' }));
    expect(r.agentGuidance).toContain('AI_AGENT');
    expect(r.suggestedAction).toBeDefined();
  });

  it('blocks unknown phase', () => {
    const r = guard.evaluate(ctx({ phase: 'INVALID' as any }));
    expect(r.decision).toBe('BLOCK');
    expect(r.severity).toBe('CRITICAL');
  });
});

// ─── Risk Gate Guard ──────────────────────────────────────────────────

describe('RiskGateGuard', () => {
  const guard = new RiskGateGuard();

  it('allows R0/R1 for any role', () => {
    expect(guard.evaluate(ctx({ riskLevel: 'R0', role: 'AI_AGENT' })).decision).toBe('ALLOW');
    expect(guard.evaluate(ctx({ riskLevel: 'R1', role: 'AI_AGENT' })).decision).toBe('ALLOW');
  });

  it('escalates R2 for AI_AGENT', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R2', role: 'AI_AGENT' }));
    expect(r.decision).toBe('ESCALATE');
    expect(r.suggestedAction).toBe('present_plan_for_approval');
  });

  it('blocks R3 for AI_AGENT', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R3', role: 'AI_AGENT' }));
    expect(r.decision).toBe('BLOCK');
    expect(r.suggestedAction).toBe('request_human_approval');
  });

  it('escalates R3 for HUMAN', () => {
    expect(guard.evaluate(ctx({ riskLevel: 'R3', role: 'HUMAN' })).decision).toBe('ESCALATE');
  });
});

// ─── Authority Gate Guard ─────────────────────────────────────────────

describe('AuthorityGateGuard', () => {
  const guard = new AuthorityGateGuard();

  it('allows HUMAN for any action', () => {
    expect(guard.evaluate(ctx({ role: 'HUMAN', action: 'deploy' })).decision).toBe('ALLOW');
  });

  it('blocks AI_AGENT from restricted actions', () => {
    for (const action of ['approve PR', 'merge branch', 'deploy to prod', 'release v2']) {
      expect(guard.evaluate(ctx({ role: 'AI_AGENT', action })).decision).toBe('BLOCK');
    }
  });

  it('allows AI_AGENT for safe actions', () => {
    expect(guard.evaluate(ctx({ role: 'AI_AGENT', action: 'write code' })).decision).toBe('ALLOW');
  });

  it('provides agentGuidance on block', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT', action: 'deploy' }));
    expect(r.agentGuidance).toContain('AI_AGENT');
    expect(r.suggestedAction).toBe('delegate_to_authorized_role');
  });
});

// ─── Mutation Budget Guard ────────────────────────────────────────────

describe('MutationBudgetGuard', () => {
  const guard = new MutationBudgetGuard();

  it('allows within budget', () => {
    expect(guard.evaluate(ctx({ mutationCount: 5, riskLevel: 'R0' })).decision).toBe('ALLOW');
  });

  it('blocks over budget', () => {
    expect(guard.evaluate(ctx({ mutationCount: 51, riskLevel: 'R0' })).decision).toBe('BLOCK');
  });

  it('escalates approaching budget (>80%)', () => {
    expect(guard.evaluate(ctx({ mutationCount: 41, riskLevel: 'R0' })).decision).toBe('ESCALATE');
  });

  it('respects per-risk budgets', () => {
    expect(guard.evaluate(ctx({ mutationCount: 21, riskLevel: 'R1' })).decision).toBe('BLOCK');
    expect(guard.evaluate(ctx({ mutationCount: 11, riskLevel: 'R2' })).decision).toBe('BLOCK');
    expect(guard.evaluate(ctx({ mutationCount: 4, riskLevel: 'R3' })).decision).toBe('BLOCK');
  });
});

// ─── Scope Guard ──────────────────────────────────────────────────────

describe('ScopeGuard', () => {
  const guard = new ScopeGuard();

  it('allows when no target files', () => {
    expect(guard.evaluate(ctx()).decision).toBe('ALLOW');
  });

  it('blocks AI_AGENT from governance paths', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT', targetFiles: ['governance/rules.yaml'] }));
    expect(r.decision).toBe('BLOCK');
  });

  it('allows HUMAN to modify governance', () => {
    expect(guard.evaluate(ctx({ role: 'HUMAN', targetFiles: ['governance/rules.yaml'] })).decision).toBe('ALLOW');
  });

  it('escalates AI_AGENT modifying root files', () => {
    expect(guard.evaluate(ctx({ role: 'AI_AGENT', targetFiles: ['README.md'] })).decision).toBe('ESCALATE');
  });
});

// ─── Audit Trail Guard ────────────────────────────────────────────────

describe('AuditTrailGuard', () => {
  const guard = new AuditTrailGuard();

  it('allows when all fields present', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT', agentId: 'a1', riskLevel: 'R2', traceHash: 'h1' }));
    expect(r.decision).toBe('ALLOW');
  });

  it('blocks when requestId is empty', () => {
    expect(guard.evaluate(ctx({ requestId: '' })).decision).toBe('BLOCK');
  });

  it('escalates when AI_AGENT has no agentId', () => {
    expect(guard.evaluate(ctx({ role: 'AI_AGENT' })).decision).toBe('ESCALATE');
  });

  it('escalates when R2/R3 has no traceHash', () => {
    expect(guard.evaluate(ctx({ riskLevel: 'R2' })).decision).toBe('ESCALATE');
    expect(guard.evaluate(ctx({ riskLevel: 'R3' })).decision).toBe('ESCALATE');
  });

  it('allows R0/R1 without traceHash', () => {
    expect(guard.evaluate(ctx({ riskLevel: 'R0' })).decision).toBe('ALLOW');
    expect(guard.evaluate(ctx({ riskLevel: 'R1' })).decision).toBe('ALLOW');
  });
});
