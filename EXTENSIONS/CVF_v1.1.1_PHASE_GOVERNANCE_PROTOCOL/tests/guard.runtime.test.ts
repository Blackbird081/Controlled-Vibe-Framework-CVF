/**
 * Guard Runtime Tests — Track IV Phase A.1
 *
 * Comprehensive tests for GuardRuntimeEngine and all 6 core guards.
 * Covers: registration, pipeline execution, short-circuit, audit log,
 * phase gate, risk gate, authority gate, mutation budget, scope, audit trail,
 * and full integration pipeline.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GuardRuntimeEngine } from '../governance/guard_runtime/guard.runtime.engine.js';
import { PhaseGateGuard, PHASE_ROLE_MATRIX, PHASE_ORDER } from '../governance/guard_runtime/guards/phase.gate.guard.js';
import { RiskGateGuard, RISK_NUMERIC } from '../governance/guard_runtime/guards/risk.gate.guard.js';
import { AuthorityGateGuard, RESTRICTED_ACTIONS } from '../governance/guard_runtime/guards/authority.gate.guard.js';
import { MutationBudgetGuard, DEFAULT_MUTATION_BUDGETS, ESCALATION_THRESHOLD } from '../governance/guard_runtime/guards/mutation.budget.guard.js';
import { ScopeGuard, PROTECTED_PATHS, CVF_ROOT_INDICATORS } from '../governance/guard_runtime/guards/scope.guard.js';
import { AuditTrailGuard } from '../governance/guard_runtime/guards/audit.trail.guard.js';
import type { GuardRequestContext, Guard, GuardResult } from '../governance/guard_runtime/guard.runtime.types.js';

// --- Helpers ---

function makeContext(overrides: Partial<GuardRequestContext> = {}): GuardRequestContext {
  return {
    requestId: 'req-001',
    phase: 'BUILD',
    riskLevel: 'R1',
    role: 'AI_AGENT',
    agentId: 'agent-claude',
    action: 'write_code',
    ...overrides,
  };
}

// --- GuardRuntimeEngine ---

describe('GuardRuntimeEngine', () => {
  let engine: GuardRuntimeEngine;

  beforeEach(() => {
    engine = new GuardRuntimeEngine();
  });

  describe('guard registration', () => {
    it('registers a guard', () => {
      engine.registerGuard(new PhaseGateGuard());
      expect(engine.getGuardCount()).toBe(1);
    });

    it('rejects duplicate guard id', () => {
      engine.registerGuard(new PhaseGateGuard());
      expect(() => engine.registerGuard(new PhaseGateGuard())).toThrow('already registered');
    });

    it('enforces max guard limit', () => {
      const smallEngine = new GuardRuntimeEngine({ maxGuardsPerPipeline: 2 });
      smallEngine.registerGuard(new PhaseGateGuard());
      smallEngine.registerGuard(new RiskGateGuard());
      expect(() => smallEngine.registerGuard(new AuthorityGateGuard())).toThrow('limit reached');
    });

    it('unregisters a guard', () => {
      engine.registerGuard(new PhaseGateGuard());
      expect(engine.unregisterGuard('phase_gate')).toBe(true);
      expect(engine.getGuardCount()).toBe(0);
    });

    it('returns false for unregistering non-existent guard', () => {
      expect(engine.unregisterGuard('nonexistent')).toBe(false);
    });

    it('getGuard returns registered guard', () => {
      engine.registerGuard(new PhaseGateGuard());
      expect(engine.getGuard('phase_gate')).toBeDefined();
      expect(engine.getGuard('nonexistent')).toBeUndefined();
    });

    it('getRegisteredGuards returns all guards', () => {
      engine.registerGuard(new PhaseGateGuard());
      engine.registerGuard(new RiskGateGuard());
      expect(engine.getRegisteredGuards()).toHaveLength(2);
    });
  });

  describe('pipeline execution', () => {
    it('returns ALLOW when no guards registered', () => {
      const result = engine.evaluate(makeContext());
      expect(result.finalDecision).toBe('ALLOW');
      expect(result.results).toHaveLength(0);
    });

    it('executes guards in priority order', () => {
      engine.registerGuard(new MutationBudgetGuard()); // priority 40
      engine.registerGuard(new PhaseGateGuard());       // priority 10
      engine.registerGuard(new RiskGateGuard());         // priority 20

      const result = engine.evaluate(makeContext());
      expect(result.results[0]!.guardId).toBe('phase_gate');
      expect(result.results[1]!.guardId).toBe('risk_gate');
      expect(result.results[2]!.guardId).toBe('mutation_budget');
    });

    it('short-circuits on BLOCK in strict mode', () => {
      engine.registerGuard(new PhaseGateGuard());
      engine.registerGuard(new RiskGateGuard());
      engine.registerGuard(new AuthorityGateGuard());

      // AI_AGENT in DISCOVERY → BLOCK by PhaseGateGuard
      const result = engine.evaluate(makeContext({ phase: 'DISCOVERY' }));
      expect(result.finalDecision).toBe('BLOCK');
      expect(result.blockedBy).toBe('phase_gate');
      expect(result.results).toHaveLength(1); // short-circuited
    });

    it('does not short-circuit in non-strict mode', () => {
      const nonStrictEngine = new GuardRuntimeEngine({ strictMode: false });
      nonStrictEngine.registerGuard(new PhaseGateGuard());
      nonStrictEngine.registerGuard(new RiskGateGuard());

      const result = nonStrictEngine.evaluate(makeContext({ phase: 'DISCOVERY' }));
      expect(result.finalDecision).toBe('BLOCK');
      expect(result.results).toHaveLength(2); // both executed
    });

    it('skips disabled guards', () => {
      const disabledGuard = new PhaseGateGuard();
      disabledGuard.enabled = false;
      engine.registerGuard(disabledGuard);
      engine.registerGuard(new RiskGateGuard());

      const result = engine.evaluate(makeContext());
      expect(result.results).toHaveLength(1);
      expect(result.results[0]!.guardId).toBe('risk_gate');
    });

    it('ESCALATE wins over ALLOW but loses to BLOCK', () => {
      engine.registerGuard(new RiskGateGuard());         // R2 + AI_AGENT → ESCALATE
      engine.registerGuard(new MutationBudgetGuard());   // within budget → ALLOW

      const result = engine.evaluate(makeContext({ riskLevel: 'R2' }));
      expect(result.finalDecision).toBe('ESCALATE');
      expect(result.escalatedBy).toBe('risk_gate');
    });

    it('records requestId and timing', () => {
      engine.registerGuard(new PhaseGateGuard());
      const result = engine.evaluate(makeContext({ requestId: 'test-123' }));
      expect(result.requestId).toBe('test-123');
      expect(result.executedAt).toBeDefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('audit log', () => {
    it('records audit entries when enabled', () => {
      engine.registerGuard(new PhaseGateGuard());
      engine.evaluate(makeContext({ requestId: 'audit-1' }));
      engine.evaluate(makeContext({ requestId: 'audit-2' }));

      expect(engine.getAuditLog()).toHaveLength(2);
    });

    it('finds audit entry by requestId', () => {
      engine.registerGuard(new PhaseGateGuard());
      engine.evaluate(makeContext({ requestId: 'find-me' }));

      const entry = engine.getAuditEntry('find-me');
      expect(entry).toBeDefined();
      expect(entry!.requestId).toBe('find-me');
      expect(entry!.pipelineResult.finalDecision).toBe('ALLOW');
    });

    it('does not record when audit disabled', () => {
      const noAuditEngine = new GuardRuntimeEngine({ enableAuditLog: false });
      noAuditEngine.registerGuard(new PhaseGateGuard());
      noAuditEngine.evaluate(makeContext());

      expect(noAuditEngine.getAuditLog()).toHaveLength(0);
    });

    it('clears audit log', () => {
      engine.registerGuard(new PhaseGateGuard());
      engine.evaluate(makeContext());
      engine.clearAuditLog();
      expect(engine.getAuditLog()).toHaveLength(0);
    });
  });

  describe('configuration', () => {
    it('returns config copy', () => {
      const config = engine.getConfig();
      expect(config.strictMode).toBe(true);
      expect(config.enableAuditLog).toBe(true);
    });

    it('updates config', () => {
      engine.updateConfig({ strictMode: false });
      expect(engine.getConfig().strictMode).toBe(false);
      expect(engine.getConfig().enableAuditLog).toBe(true); // unchanged
    });
  });
});

// --- PhaseGateGuard ---

describe('PhaseGateGuard', () => {
  const guard = new PhaseGateGuard();

  it('allows AI_AGENT in BUILD phase', () => {
    const result = guard.evaluate(makeContext({ phase: 'BUILD', role: 'AI_AGENT' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks AI_AGENT in DISCOVERY phase', () => {
    const result = guard.evaluate(makeContext({ phase: 'DISCOVERY', role: 'AI_AGENT' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks AI_AGENT in DESIGN phase', () => {
    const result = guard.evaluate(makeContext({ phase: 'DESIGN', role: 'AI_AGENT' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks AI_AGENT in REVIEW phase', () => {
    const result = guard.evaluate(makeContext({ phase: 'REVIEW', role: 'AI_AGENT' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('allows HUMAN in all phases', () => {
    for (const phase of PHASE_ORDER) {
      const result = guard.evaluate(makeContext({ phase, role: 'HUMAN' }));
      expect(result.decision).toBe('ALLOW');
    }
  });

  it('allows REVIEWER in REVIEW phase', () => {
    const result = guard.evaluate(makeContext({ phase: 'REVIEW', role: 'REVIEWER' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks REVIEWER in BUILD phase', () => {
    const result = guard.evaluate(makeContext({ phase: 'BUILD', role: 'REVIEWER' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('allows OPERATOR in all phases', () => {
    for (const phase of PHASE_ORDER) {
      const result = guard.evaluate(makeContext({ phase, role: 'OPERATOR' }));
      expect(result.decision).toBe('ALLOW');
    }
  });

  it('exports correct PHASE_ORDER', () => {
    expect(PHASE_ORDER).toEqual(['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW']);
  });

  it('has correct PHASE_ROLE_MATRIX entries', () => {
    expect(PHASE_ROLE_MATRIX.DISCOVERY).toContain('HUMAN');
    expect(PHASE_ROLE_MATRIX.BUILD).toContain('AI_AGENT');
    expect(PHASE_ROLE_MATRIX.REVIEW).toContain('REVIEWER');
  });
});

// --- RiskGateGuard ---

describe('RiskGateGuard', () => {
  const guard = new RiskGateGuard();

  it('allows R0 for AI_AGENT', () => {
    const result = guard.evaluate(makeContext({ riskLevel: 'R0' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('allows R1 for AI_AGENT', () => {
    const result = guard.evaluate(makeContext({ riskLevel: 'R1' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('escalates R2 for AI_AGENT', () => {
    const result = guard.evaluate(makeContext({ riskLevel: 'R2', role: 'AI_AGENT' }));
    expect(result.decision).toBe('ESCALATE');
  });

  it('allows R2 for HUMAN', () => {
    const result = guard.evaluate(makeContext({ riskLevel: 'R2', role: 'HUMAN' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks R3 for AI_AGENT', () => {
    const result = guard.evaluate(makeContext({ riskLevel: 'R3', role: 'AI_AGENT' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('escalates R3 for HUMAN', () => {
    const result = guard.evaluate(makeContext({ riskLevel: 'R3', role: 'HUMAN' }));
    expect(result.decision).toBe('ESCALATE');
  });

  it('escalates R3 for OPERATOR', () => {
    const result = guard.evaluate(makeContext({ riskLevel: 'R3', role: 'OPERATOR' }));
    expect(result.decision).toBe('ESCALATE');
  });

  it('exports RISK_NUMERIC mapping', () => {
    expect(RISK_NUMERIC.R0).toBe(0);
    expect(RISK_NUMERIC.R3).toBe(3);
  });
});

// --- AuthorityGateGuard ---

describe('AuthorityGateGuard', () => {
  const guard = new AuthorityGateGuard();

  it('allows AI_AGENT for write_code', () => {
    const result = guard.evaluate(makeContext({ role: 'AI_AGENT', action: 'write_code' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks AI_AGENT for approve', () => {
    const result = guard.evaluate(makeContext({ role: 'AI_AGENT', action: 'approve' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks AI_AGENT for merge', () => {
    const result = guard.evaluate(makeContext({ role: 'AI_AGENT', action: 'merge' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks AI_AGENT for release', () => {
    const result = guard.evaluate(makeContext({ role: 'AI_AGENT', action: 'release' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks AI_AGENT for deploy', () => {
    const result = guard.evaluate(makeContext({ role: 'AI_AGENT', action: 'deploy' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks AI_AGENT for override_gate', () => {
    const result = guard.evaluate(makeContext({ role: 'AI_AGENT', action: 'override_gate' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('allows HUMAN for any action', () => {
    const result = guard.evaluate(makeContext({ role: 'HUMAN', action: 'deploy' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks REVIEWER for build', () => {
    const result = guard.evaluate(makeContext({ role: 'REVIEWER', action: 'build' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('allows REVIEWER for review action', () => {
    const result = guard.evaluate(makeContext({ role: 'REVIEWER', action: 'review_code' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('exports RESTRICTED_ACTIONS', () => {
    expect(RESTRICTED_ACTIONS.AI_AGENT).toContain('approve');
    expect(RESTRICTED_ACTIONS.HUMAN).toHaveLength(0);
  });
});

// --- MutationBudgetGuard ---

describe('MutationBudgetGuard', () => {
  const guard = new MutationBudgetGuard();

  it('allows when count is within budget', () => {
    const result = guard.evaluate(makeContext({ mutationCount: 5, mutationBudget: 20 }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks when count exceeds budget', () => {
    const result = guard.evaluate(makeContext({ mutationCount: 25, mutationBudget: 20 }));
    expect(result.decision).toBe('BLOCK');
  });

  it('escalates when count is above 80% of budget', () => {
    const result = guard.evaluate(makeContext({ mutationCount: 17, mutationBudget: 20 }));
    expect(result.decision).toBe('ESCALATE');
  });

  it('allows at exactly 80% threshold', () => {
    const result = guard.evaluate(makeContext({ mutationCount: 16, mutationBudget: 20 }));
    expect(result.decision).toBe('ALLOW');
  });

  it('uses default budget based on risk level when none specified', () => {
    const result = guard.evaluate(makeContext({ riskLevel: 'R3', mutationCount: 4 }));
    expect(result.decision).toBe('BLOCK'); // R3 default budget = 3
  });

  it('uses R0 default budget (50) correctly', () => {
    const result = guard.evaluate(makeContext({ riskLevel: 'R0', mutationCount: 30 }));
    expect(result.decision).toBe('ALLOW');
  });

  it('allows zero mutations', () => {
    const result = guard.evaluate(makeContext({ mutationCount: 0 }));
    expect(result.decision).toBe('ALLOW');
  });

  it('exports DEFAULT_MUTATION_BUDGETS', () => {
    expect(DEFAULT_MUTATION_BUDGETS.R0).toBe(50);
    expect(DEFAULT_MUTATION_BUDGETS.R3).toBe(3);
  });

  it('exports ESCALATION_THRESHOLD', () => {
    expect(ESCALATION_THRESHOLD).toBe(0.8);
  });
});

// --- ScopeGuard ---

describe('ScopeGuard', () => {
  const guard = new ScopeGuard();

  it('allows when no target files', () => {
    const result = guard.evaluate(makeContext({ targetFiles: [] }));
    expect(result.decision).toBe('ALLOW');
  });

  it('allows when target files are in allowed scope', () => {
    const result = guard.evaluate(makeContext({ targetFiles: ['src/components/Button.tsx'] }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks AI_AGENT modifying protected governance path', () => {
    const result = guard.evaluate(makeContext({
      role: 'AI_AGENT',
      targetFiles: ['governance/toolkit/05_OPERATION/guard.md'],
    }));
    expect(result.decision).toBe('BLOCK');
  });

  it('allows HUMAN modifying protected governance path', () => {
    const result = guard.evaluate(makeContext({
      role: 'HUMAN',
      targetFiles: ['governance/toolkit/05_OPERATION/guard.md'],
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks AI_AGENT modifying docs/CVF_ files', () => {
    const result = guard.evaluate(makeContext({
      role: 'AI_AGENT',
      targetFiles: ['docs/CVF_CORE_KNOWLEDGE_BASE.md'],
    }));
    expect(result.decision).toBe('BLOCK');
  });

  it('escalates AI_AGENT modifying CVF root files', () => {
    const result = guard.evaluate(makeContext({
      role: 'AI_AGENT',
      targetFiles: ['README.md'],
    }));
    expect(result.decision).toBe('ESCALATE');
  });

  it('allows HUMAN modifying root files', () => {
    const result = guard.evaluate(makeContext({
      role: 'HUMAN',
      targetFiles: ['README.md'],
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('handles backslash paths (Windows)', () => {
    const result = guard.evaluate(makeContext({
      role: 'AI_AGENT',
      targetFiles: ['governance\\toolkit\\05_OPERATION\\guard.md'],
    }));
    expect(result.decision).toBe('BLOCK');
  });

  it('exports PROTECTED_PATHS', () => {
    expect(PROTECTED_PATHS).toContain('governance/');
    expect(PROTECTED_PATHS.length).toBeGreaterThan(0);
  });

  it('exports CVF_ROOT_INDICATORS', () => {
    expect(CVF_ROOT_INDICATORS).toContain('README.md');
  });
});

// --- AuditTrailGuard ---

describe('AuditTrailGuard', () => {
  const guard = new AuditTrailGuard();

  it('allows when all trace fields present', () => {
    const result = guard.evaluate(makeContext({
      requestId: 'req-1',
      agentId: 'claude',
      riskLevel: 'R2',
      traceHash: 'abc123',
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks when requestId is missing', () => {
    const result = guard.evaluate(makeContext({ requestId: '' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('escalates when agentId missing for AI_AGENT', () => {
    const result = guard.evaluate(makeContext({ role: 'AI_AGENT', agentId: undefined }));
    expect(result.decision).toBe('ESCALATE');
  });

  it('allows when agentId missing for HUMAN', () => {
    const result = guard.evaluate(makeContext({ role: 'HUMAN', agentId: undefined }));
    expect(result.decision).toBe('ALLOW');
  });

  it('escalates when traceHash missing for R2', () => {
    const result = guard.evaluate(makeContext({
      riskLevel: 'R2',
      traceHash: undefined,
      agentId: 'claude',
    }));
    expect(result.decision).toBe('ESCALATE');
  });

  it('escalates when traceHash missing for R3', () => {
    const result = guard.evaluate(makeContext({
      riskLevel: 'R3',
      traceHash: undefined,
      agentId: 'claude',
    }));
    expect(result.decision).toBe('ESCALATE');
  });

  it('allows without traceHash for R0', () => {
    const result = guard.evaluate(makeContext({
      riskLevel: 'R0',
      traceHash: undefined,
      agentId: 'claude',
    }));
    expect(result.decision).toBe('ALLOW');
  });
});

// --- Full Integration Pipeline ---

describe('Guard Runtime Integration', () => {
  let engine: GuardRuntimeEngine;

  beforeEach(() => {
    engine = new GuardRuntimeEngine();
    engine.registerGuard(new PhaseGateGuard());
    engine.registerGuard(new RiskGateGuard());
    engine.registerGuard(new AuthorityGateGuard());
    engine.registerGuard(new MutationBudgetGuard());
    engine.registerGuard(new ScopeGuard());
    engine.registerGuard(new AuditTrailGuard());
  });

  it('allows valid AI_AGENT BUILD action', () => {
    const result = engine.evaluate(makeContext({
      phase: 'BUILD',
      riskLevel: 'R1',
      role: 'AI_AGENT',
      agentId: 'claude',
      action: 'write_code',
      mutationCount: 5,
      targetFiles: ['src/app.ts'],
    }));
    expect(result.finalDecision).toBe('ALLOW');
    expect(result.results).toHaveLength(6);
  });

  it('blocks AI_AGENT attempting DESIGN phase', () => {
    const result = engine.evaluate(makeContext({
      phase: 'DESIGN',
      role: 'AI_AGENT',
    }));
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('phase_gate');
  });

  it('blocks AI_AGENT attempting R3 action', () => {
    const result = engine.evaluate(makeContext({
      phase: 'BUILD',
      riskLevel: 'R3',
      role: 'AI_AGENT',
    }));
    // Phase gate passes (BUILD + AI_AGENT), but risk gate blocks R3
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('risk_gate');
  });

  it('blocks AI_AGENT attempting deploy', () => {
    const result = engine.evaluate(makeContext({
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'AI_AGENT',
      action: 'deploy',
    }));
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('authority_gate');
  });

  it('blocks excessive mutations', () => {
    const result = engine.evaluate(makeContext({
      phase: 'BUILD',
      riskLevel: 'R1',
      role: 'AI_AGENT',
      action: 'write_code',
      mutationCount: 100,
      mutationBudget: 20,
    }));
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('mutation_budget');
  });

  it('blocks AI_AGENT modifying governance files', () => {
    const result = engine.evaluate(makeContext({
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'AI_AGENT',
      action: 'write_code',
      targetFiles: ['governance/guard.md'],
    }));
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('scope_guard');
  });

  it('allows full HUMAN workflow', () => {
    for (const phase of PHASE_ORDER) {
      const result = engine.evaluate(makeContext({
        phase,
        riskLevel: 'R0',
        role: 'HUMAN',
        action: 'review',
        mutationCount: 2,
        targetFiles: ['src/app.ts'],
      }));
      expect(result.finalDecision).toBe('ALLOW');
    }
  });

  it('escalates R2 AI_AGENT action (risk gate)', () => {
    const nonStrictEngine = new GuardRuntimeEngine({ strictMode: false });
    nonStrictEngine.registerGuard(new PhaseGateGuard());
    nonStrictEngine.registerGuard(new RiskGateGuard());
    nonStrictEngine.registerGuard(new AuditTrailGuard());

    const result = nonStrictEngine.evaluate(makeContext({
      phase: 'BUILD',
      riskLevel: 'R2',
      role: 'AI_AGENT',
      agentId: 'claude',
      traceHash: 'hash123',
    }));
    expect(result.finalDecision).toBe('ESCALATE');
    expect(result.escalatedBy).toBe('risk_gate');
  });

  it('produces complete audit trail', () => {
    engine.evaluate(makeContext({ requestId: 'trace-1' }));
    engine.evaluate(makeContext({ requestId: 'trace-2' }));

    const log = engine.getAuditLog();
    expect(log).toHaveLength(2);
    expect(log[0]!.context.requestId).toBe('trace-1');
    expect(log[1]!.context.requestId).toBe('trace-2');
    expect(log[0]!.pipelineResult.results.length).toBeGreaterThan(0);
  });

  it('has all 6 guards registered', () => {
    expect(engine.getGuardCount()).toBe(6);
    const guards = engine.getRegisteredGuards();
    const ids = guards.map((g) => g.id).sort();
    expect(ids).toEqual([
      'audit_trail',
      'authority_gate',
      'mutation_budget',
      'phase_gate',
      'risk_gate',
      'scope_guard',
    ]);
  });
});
