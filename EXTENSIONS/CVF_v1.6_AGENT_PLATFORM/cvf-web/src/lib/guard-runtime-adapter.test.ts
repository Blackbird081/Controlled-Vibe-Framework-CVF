/**
 * Guard Runtime Adapter — Tests
 * Track 1.1: WebGuardRuntimeEngine + 6 core guards + helpers
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  WebGuardRuntimeEngine,
  PhaseGateGuard,
  RiskGateGuard,
  AuthorityGateGuard,
  MutationBudgetGuard,
  ScopeGuard,
  AuditTrailGuard,
  createWebGuardEngine,
  buildWebGuardContext,
  DEFAULT_GUARD_RUNTIME_CONFIG,
  PHASE_ORDER,
  RISK_NUMERIC,
  RESTRICTED_ACTIONS,
  DEFAULT_MUTATION_BUDGETS,
  ESCALATION_THRESHOLD,
  PROTECTED_PATHS,
  CVF_ROOT_INDICATORS,
  type GuardRequestContext,
  type CVFPhase,
  type CVFRiskLevel,
} from './guard-runtime-adapter';

// ─── Helper ───────────────────────────────────────────────────────────

function ctx(overrides: Partial<GuardRequestContext> = {}): GuardRequestContext {
  return {
    requestId: 'test-req-001',
    phase: 'BUILD',
    riskLevel: 'R0',
    role: 'HUMAN',
    action: 'execute_template',
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// WebGuardRuntimeEngine
// ═══════════════════════════════════════════════════════════════════════

describe('WebGuardRuntimeEngine', () => {
  let engine: InstanceType<typeof WebGuardRuntimeEngine>;

  beforeEach(() => {
    engine = new WebGuardRuntimeEngine();
  });

  test('initializes with default config', () => {
    const config = engine.getConfig();
    expect(config.strictMode).toBe(true);
    expect(config.enableAuditLog).toBe(true);
    expect(config.maxGuardsPerPipeline).toBe(20);
    expect(config.defaultDecision).toBe('ALLOW');
  });

  test('accepts partial config override', () => {
    const e = new WebGuardRuntimeEngine({ strictMode: false });
    expect(e.getConfig().strictMode).toBe(false);
    expect(e.getConfig().enableAuditLog).toBe(true);
  });

  test('registers and retrieves guards', () => {
    engine.registerGuard(new PhaseGateGuard());
    expect(engine.getGuardCount()).toBe(1);
    expect(engine.getGuard('phase_gate')).toBeDefined();
  });

  test('rejects duplicate guard registration', () => {
    engine.registerGuard(new PhaseGateGuard());
    expect(() => engine.registerGuard(new PhaseGateGuard())).toThrow(/already registered/);
  });

  test('rejects registration beyond pipeline limit', () => {
    const small = new WebGuardRuntimeEngine({ maxGuardsPerPipeline: 1 });
    small.registerGuard(new PhaseGateGuard());
    expect(() => small.registerGuard(new RiskGateGuard())).toThrow(/pipeline limit/);
  });

  test('unregisters guard', () => {
    // PhaseGateGuard is mandatory and cannot be unregistered, use a non-mandatory guard instead
    engine.registerGuard(new MutationBudgetGuard());
    expect(engine.unregisterGuard('mutation_budget')).toBe(true);
    expect(engine.getGuardCount()).toBe(0);
  });

  test('unregister returns false for unknown guard', () => {
    expect(engine.unregisterGuard('nonexistent')).toBe(false);
  });

  test('evaluate returns ALLOW with no guards', () => {
    const result = engine.evaluate(ctx());
    expect(result.finalDecision).toBe('ALLOW');
    expect(result.results).toHaveLength(0);
  });

  test('evaluate runs guards in priority order', () => {
    engine.registerGuard(new AuditTrailGuard()); // priority 60
    engine.registerGuard(new PhaseGateGuard());  // priority 10
    const result = engine.evaluate(ctx());
    expect(result.results[0].guardId).toBe('phase_gate');
    expect(result.results[1].guardId).toBe('audit_trail');
  });

  test('strict mode short-circuits on BLOCK', () => {
    engine.registerGuard(new PhaseGateGuard());
    engine.registerGuard(new RiskGateGuard());
    // DISCOVERY phase blocks AI_AGENT at PhaseGateGuard (priority 10)
    const result = engine.evaluate(ctx({ phase: 'DISCOVERY', role: 'AI_AGENT' }));
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('phase_gate');
    expect(result.results).toHaveLength(1); // short-circuited
  });

  test('non-strict mode evaluates all guards', () => {
    const e = new WebGuardRuntimeEngine({ strictMode: false });
    e.registerGuard(new PhaseGateGuard());
    e.registerGuard(new RiskGateGuard());
    const result = e.evaluate(ctx({ phase: 'DISCOVERY', role: 'AI_AGENT' }));
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.results.length).toBeGreaterThan(1);
  });

  test('disabled guards are skipped', () => {
    const guard = new PhaseGateGuard();
    guard.enabled = false;
    engine.registerGuard(guard);
    const result = engine.evaluate(ctx());
    expect(result.results).toHaveLength(0);
  });

  test('audit log records entries', () => {
    engine.registerGuard(new PhaseGateGuard());
    engine.evaluate(ctx());
    expect(engine.getAuditLog()).toHaveLength(1);
    expect(engine.getAuditEntry('test-req-001')).toBeDefined();
  });

  test('audit log disabled when config says so', () => {
    const e = new WebGuardRuntimeEngine({ enableAuditLog: false });
    e.registerGuard(new PhaseGateGuard());
    e.evaluate(ctx());
    expect(e.getAuditLog()).toHaveLength(0);
  });

  test('clearAuditLog empties log', () => {
    engine.registerGuard(new PhaseGateGuard());
    engine.evaluate(ctx());
    engine.clearAuditLog();
    expect(engine.getAuditLog()).toHaveLength(0);
  });

  test('updateConfig merges partial', () => {
    engine.updateConfig({ strictMode: false });
    expect(engine.getConfig().strictMode).toBe(false);
    expect(engine.getConfig().enableAuditLog).toBe(true);
  });

  test('pipeline result includes durationMs', () => {
    engine.registerGuard(new PhaseGateGuard());
    const result = engine.evaluate(ctx());
    expect(typeof result.durationMs).toBe('number');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  test('getRegisteredGuards returns array', () => {
    engine.registerGuard(new PhaseGateGuard());
    engine.registerGuard(new RiskGateGuard());
    expect(engine.getRegisteredGuards()).toHaveLength(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// PhaseGateGuard
// ═══════════════════════════════════════════════════════════════════════

describe('PhaseGateGuard', () => {
  const guard = new PhaseGateGuard();

  test('ALLOW HUMAN in DISCOVERY', () => {
    const r = guard.evaluate(ctx({ phase: 'DISCOVERY', role: 'HUMAN' }));
    expect(r.decision).toBe('ALLOW');
  });

  test('BLOCK AI_AGENT in DISCOVERY', () => {
    const r = guard.evaluate(ctx({ phase: 'DISCOVERY', role: 'AI_AGENT' }));
    expect(r.decision).toBe('BLOCK');
  });

  test('ALLOW AI_AGENT in BUILD', () => {
    const r = guard.evaluate(ctx({ phase: 'BUILD', role: 'AI_AGENT' }));
    expect(r.decision).toBe('ALLOW');
  });

  test('BLOCK AI_AGENT in DESIGN', () => {
    const r = guard.evaluate(ctx({ phase: 'DESIGN', role: 'AI_AGENT' }));
    expect(r.decision).toBe('BLOCK');
  });

  test('ALLOW REVIEWER in REVIEW', () => {
    const r = guard.evaluate(ctx({ phase: 'REVIEW', role: 'REVIEWER' }));
    expect(r.decision).toBe('ALLOW');
  });

  test('BLOCK REVIEWER in BUILD', () => {
    const r = guard.evaluate(ctx({ phase: 'BUILD', role: 'REVIEWER' }));
    expect(r.decision).toBe('BLOCK');
  });

  test('BLOCK unknown phase', () => {
    const r = guard.evaluate(ctx({ phase: 'INVALID' as CVFPhase }));
    expect(r.decision).toBe('BLOCK');
    expect(r.severity).toBe('CRITICAL');
  });

  test('OPERATOR allowed in all phases', () => {
    for (const phase of PHASE_ORDER) {
      const r = guard.evaluate(ctx({ phase, role: 'OPERATOR' }));
      expect(r.decision).toBe(phase === 'FREEZE' ? 'BLOCK' : 'ALLOW');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// RiskGateGuard
// ═══════════════════════════════════════════════════════════════════════

describe('RiskGateGuard', () => {
  const guard = new RiskGateGuard();

  test('ALLOW R0 for any role', () => {
    expect(guard.evaluate(ctx({ riskLevel: 'R0', role: 'AI_AGENT' })).decision).toBe('ALLOW');
    expect(guard.evaluate(ctx({ riskLevel: 'R0', role: 'HUMAN' })).decision).toBe('ALLOW');
  });

  test('ALLOW R1 for any role', () => {
    expect(guard.evaluate(ctx({ riskLevel: 'R1', role: 'AI_AGENT' })).decision).toBe('ALLOW');
  });

  test('ESCALATE R2 for AI_AGENT', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R2', role: 'AI_AGENT' }));
    expect(r.decision).toBe('ESCALATE');
  });

  test('ALLOW R2 for HUMAN', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R2', role: 'HUMAN' }));
    expect(r.decision).toBe('ALLOW');
  });

  test('BLOCK R3 for AI_AGENT', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R3', role: 'AI_AGENT' }));
    expect(r.decision).toBe('BLOCK');
  });

  test('ESCALATE R3 for HUMAN', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R3', role: 'HUMAN' }));
    expect(r.decision).toBe('ESCALATE');
  });

  test('BLOCK unknown risk level', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R9' as CVFRiskLevel }));
    expect(r.decision).toBe('BLOCK');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// AuthorityGateGuard
// ═══════════════════════════════════════════════════════════════════════

describe('AuthorityGateGuard', () => {
  const guard = new AuthorityGateGuard();

  test('BLOCK AI_AGENT for approve action', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT', action: 'approve changes' }));
    expect(r.decision).toBe('BLOCK');
  });

  test('BLOCK AI_AGENT for deploy action', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT', action: 'deploy to production' }));
    expect(r.decision).toBe('BLOCK');
  });

  test('ALLOW AI_AGENT for write action', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT', action: 'write component' }));
    expect(r.decision).toBe('ALLOW');
  });

  test('BLOCK REVIEWER for build action', () => {
    const r = guard.evaluate(ctx({ role: 'REVIEWER', action: 'build feature' }));
    expect(r.decision).toBe('BLOCK');
  });

  test('ALLOW HUMAN for any action', () => {
    const r = guard.evaluate(ctx({ role: 'HUMAN', action: 'approve deploy merge release' }));
    expect(r.decision).toBe('ALLOW');
  });

  test('ALLOW OPERATOR for any action', () => {
    const r = guard.evaluate(ctx({ role: 'OPERATOR', action: 'deploy release' }));
    expect(r.decision).toBe('ALLOW');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// MutationBudgetGuard
// ═══════════════════════════════════════════════════════════════════════

describe('MutationBudgetGuard', () => {
  const guard = new MutationBudgetGuard();

  test('ALLOW when count is 0', () => {
    const r = guard.evaluate(ctx({ mutationCount: 0 }));
    expect(r.decision).toBe('ALLOW');
  });

  test('ALLOW when within budget', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R0', mutationCount: 30 }));
    expect(r.decision).toBe('ALLOW');
  });

  test('ESCALATE when approaching budget', () => {
    // R0 budget = 50, 80% = 40, so 41 triggers escalation
    const r = guard.evaluate(ctx({ riskLevel: 'R0', mutationCount: 41 }));
    expect(r.decision).toBe('ESCALATE');
  });

  test('BLOCK when exceeding budget', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R0', mutationCount: 51 }));
    expect(r.decision).toBe('BLOCK');
  });

  test('uses risk-level default budgets', () => {
    // R3 budget = 3
    const r = guard.evaluate(ctx({ riskLevel: 'R3', mutationCount: 4 }));
    expect(r.decision).toBe('BLOCK');
  });

  test('respects explicit mutationBudget override', () => {
    const r = guard.evaluate(ctx({ mutationBudget: 100, mutationCount: 90 }));
    expect(r.decision).toBe('ESCALATE');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// ScopeGuard
// ═══════════════════════════════════════════════════════════════════════

describe('ScopeGuard', () => {
  const guard = new ScopeGuard();

  test('ALLOW when no target files', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT' }));
    expect(r.decision).toBe('ALLOW');
  });

  test('BLOCK AI_AGENT targeting protected path', () => {
    const r = guard.evaluate(ctx({
      role: 'AI_AGENT',
      targetFiles: ['governance/toolkit/policy.md'],
    }));
    expect(r.decision).toBe('BLOCK');
  });

  test('ALLOW HUMAN targeting protected path', () => {
    const r = guard.evaluate(ctx({
      role: 'HUMAN',
      targetFiles: ['governance/toolkit/policy.md'],
    }));
    expect(r.decision).toBe('ALLOW');
  });

  test('ESCALATE AI_AGENT targeting root file', () => {
    const r = guard.evaluate(ctx({
      role: 'AI_AGENT',
      targetFiles: ['project/README.md'],
    }));
    expect(r.decision).toBe('ESCALATE');
  });

  test('ALLOW AI_AGENT targeting normal file', () => {
    const r = guard.evaluate(ctx({
      role: 'AI_AGENT',
      targetFiles: ['src/components/Button.tsx'],
    }));
    expect(r.decision).toBe('ALLOW');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// AuditTrailGuard
// ═══════════════════════════════════════════════════════════════════════

describe('AuditTrailGuard', () => {
  const guard = new AuditTrailGuard();

  test('BLOCK when requestId is missing', () => {
    const r = guard.evaluate(ctx({ requestId: '' }));
    expect(r.decision).toBe('BLOCK');
  });

  test('ALLOW when all fields present', () => {
    const r = guard.evaluate(ctx({ agentId: 'a1', traceHash: 'hash1' }));
    expect(r.decision).toBe('ALLOW');
  });

  test('ESCALATE AI_AGENT without agentId', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT' }));
    expect(r.decision).toBe('ESCALATE');
  });

  test('ESCALATE R2 without traceHash', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R2' }));
    expect(r.decision).toBe('ESCALATE');
  });

  test('ALLOW HUMAN without agentId', () => {
    const r = guard.evaluate(ctx({ role: 'HUMAN' }));
    expect(r.decision).toBe('ALLOW');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// createWebGuardEngine factory
// ═══════════════════════════════════════════════════════════════════════

describe('createWebGuardEngine', () => {
  test('creates engine with 8 guards', () => {
    const engine = createWebGuardEngine();
    expect(engine.getGuardCount()).toBe(8);
  });

  test('all guards have unique IDs', () => {
    const engine = createWebGuardEngine();
    const ids = engine.getRegisteredGuards().map((g) => g.id);
    expect(new Set(ids).size).toBe(8);
  });

  test('full pipeline ALLOW for safe HUMAN request', () => {
    const engine = createWebGuardEngine();
    const result = engine.evaluate(ctx({ phase: 'INTAKE', action: 'analyze request' }));
    expect(result.finalDecision).toBe('ALLOW');
    expect(result.results).toHaveLength(8);
  });

  test('full pipeline BLOCK for AI in DISCOVERY', () => {
    const engine = createWebGuardEngine();
    const result = engine.evaluate(ctx({ role: 'AI_AGENT', phase: 'DISCOVERY', agentId: 'a1' }));
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('phase_gate');
  });

  test('accepts custom config', () => {
    const engine = createWebGuardEngine({ strictMode: false });
    expect(engine.getConfig().strictMode).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// buildWebGuardContext helper
// ═══════════════════════════════════════════════════════════════════════

describe('buildWebGuardContext', () => {
  test('provides sensible defaults for empty input', () => {
    const c = buildWebGuardContext({});
    expect(c.phase).toBe('INTAKE');
    expect(c.riskLevel).toBe('R0');
    expect(c.role).toBe('HUMAN');
    expect(c.action).toBe('execute_template');
    expect(c.requestId).toMatch(/^web-/);
  });

  test('normalizes phase aliases', () => {
    expect(buildWebGuardContext({ phase: 'Phase A' }).phase).toBe('INTAKE');
    expect(buildWebGuardContext({ phase: 'B' }).phase).toBe('DESIGN');
    expect(buildWebGuardContext({ phase: 'build' }).phase).toBe('BUILD');
    expect(buildWebGuardContext({ phase: 'D' }).phase).toBe('REVIEW');
    expect(buildWebGuardContext({ phase: 'E' }).phase).toBe('FREEZE');
    expect(buildWebGuardContext({ phase: 'unknown' }).phase).toBe('INTAKE');
  });

  test('normalizes risk level aliases', () => {
    expect(buildWebGuardContext({ riskLevel: 'low' }).riskLevel).toBe('R0');
    expect(buildWebGuardContext({ riskLevel: 'medium' }).riskLevel).toBe('R1');
    expect(buildWebGuardContext({ riskLevel: 'elevated' }).riskLevel).toBe('R2');
    expect(buildWebGuardContext({ riskLevel: 'critical' }).riskLevel).toBe('R3');
    expect(buildWebGuardContext({ riskLevel: 'R1' }).riskLevel).toBe('R1');
  });

  test('normalizes role aliases', () => {
    expect(buildWebGuardContext({ role: 'ai' }).role).toBe('AI_AGENT');
    expect(buildWebGuardContext({ role: 'agent' }).role).toBe('AI_AGENT');
    expect(buildWebGuardContext({ role: 'reviewer' }).role).toBe('REVIEWER');
    expect(buildWebGuardContext({ role: 'unknown' }).role).toBe('HUMAN');
  });

  test('uses intent as action when provided', () => {
    const c = buildWebGuardContext({ intent: 'build a website' });
    expect(c.action).toBe('build a website');
  });

  test('preserves explicit requestId', () => {
    const c = buildWebGuardContext({ requestId: 'my-id-123' });
    expect(c.requestId).toBe('my-id-123');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Constants sanity
// ═══════════════════════════════════════════════════════════════════════

describe('Constants', () => {
  test('DEFAULT_GUARD_RUNTIME_CONFIG is valid', () => {
    expect(DEFAULT_GUARD_RUNTIME_CONFIG.strictMode).toBe(true);
  });

  test('PHASE_ORDER has 5 phases', () => {
    expect(PHASE_ORDER).toHaveLength(5);
  });

  test('RISK_NUMERIC covers R0-R3', () => {
    expect(Object.keys(RISK_NUMERIC)).toHaveLength(4);
  });

  test('RESTRICTED_ACTIONS covers all roles', () => {
    expect(Object.keys(RESTRICTED_ACTIONS)).toHaveLength(8);
  });

  test('DEFAULT_MUTATION_BUDGETS R3 is smallest', () => {
    expect(DEFAULT_MUTATION_BUDGETS.R3).toBeLessThan(DEFAULT_MUTATION_BUDGETS.R0);
  });

  test('ESCALATION_THRESHOLD is 0.8', () => {
    expect(ESCALATION_THRESHOLD).toBe(0.8);
  });

  test('PROTECTED_PATHS includes governance/', () => {
    expect(PROTECTED_PATHS).toContain('governance/');
  });

  test('CVF_ROOT_INDICATORS includes README.md', () => {
    expect(CVF_ROOT_INDICATORS).toContain('README.md');
  });
});
