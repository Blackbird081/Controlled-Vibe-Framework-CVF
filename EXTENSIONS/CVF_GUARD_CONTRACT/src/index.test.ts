/**
 * CVF Guard Contract — Canonical Test Suite
 *
 * Locks the hardened shared default path and canonical phase model.
 */

import { describe, expect, it } from 'vitest';
import {
  createGuardEngine,
  GuardRuntimeEngine,
  AUTHORITY_MATRIX,
  PhaseGateGuard,
  PHASE_ROLE_MATRIX,
  RiskGateGuard,
  AuthorityGateGuard,
  AiCommitGuard,
  MutationBudgetGuard,
  FileScopeGuard,
  ScopeGuard,
  AuditTrailGuard,
  PHASE_ORDER,
  classifyHandoffTransition,
  createHandoffCheckpoint,
  type GuardRequestContext,
} from './index';

function ctx(overrides?: Partial<GuardRequestContext>): GuardRequestContext {
  return {
    requestId: 'test-001',
    phase: 'BUILD',
    riskLevel: 'R0',
    role: 'HUMAN',
    action: 'analyze request',
    ...overrides,
  };
}

describe('createGuardEngine', () => {
  it('creates engine with 9 hardened default guards', () => {
    const engine = createGuardEngine();
    expect(engine.getGuardCount()).toBe(9);
  });

  it('registers all canonical guard IDs', () => {
    const engine = createGuardEngine();
    const ids = engine.getRegisteredGuards().map((guard) => guard.id);
    expect(ids).toEqual([
      'ai_commit',
      'phase_gate',
      'risk_gate',
      'authority_gate',
      'build_authority',
      'mutation_budget',
      'file_scope',
      'scope_guard',
      'audit_trail',
    ]);
  });

  it('allows safe read-only evaluation', () => {
    const engine = createGuardEngine();
    const result = engine.evaluate(ctx({ phase: 'REVIEW', role: 'REVIEWER', action: 'read report' }));
    expect(result.finalDecision).toBe('ALLOW');
    expect(result.results.length).toBe(9);
  });

  it('blocks modifying action without ai_commit', () => {
    const engine = createGuardEngine();
    const result = engine.evaluate(ctx({ role: 'AI_AGENT', action: 'write code' }));
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('ai_commit');
  });
});

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

  it('stores audit log entries', () => {
    const engine = createGuardEngine();
    engine.evaluate(ctx());
    expect(engine.getAuditLogSize()).toBe(1);
    expect(engine.getAuditEntry('test-001')).toBeDefined();
  });
});

describe('GuardRuntimeEngine -- F2 registered-guard immutability', () => {
  it('mutating the original guard object after registration does not change engine identity, priority, enabled state, or evaluation', () => {
    const engine = new GuardRuntimeEngine();
    const guard = new PhaseGateGuard();
    engine.registerGuard(guard);

    const originalEvaluate = guard.evaluate.bind(guard);
    guard.id = 'hijacked_id';
    guard.name = 'Hijacked';
    guard.priority = -999;
    guard.enabled = false;
    guard.evaluate = () => ({
      guardId: 'hijacked_id',
      decision: 'ALLOW',
      severity: 'INFO',
      reason: 'hijacked',
      timestamp: new Date().toISOString(),
    });

    const view = engine.getGuard('phase_gate');
    expect(view).toBeDefined();
    expect(view!.id).toBe('phase_gate');
    expect(view!.priority).toBe(10);
    expect(view!.enabled).toBe(true);

    const result = view!.evaluate(ctx({ phase: 'INTAKE', role: 'AI_AGENT' }));
    expect(result.guardId).toBe('phase_gate');
    expect(result.decision).toBe(originalEvaluate(ctx({ phase: 'INTAKE', role: 'AI_AGENT' })).decision);
    expect(result.reason).not.toBe('hijacked');
  });

  it('mutating a value returned by getGuard() does not change subsequent accessor results or evaluation ordering', () => {
    const engine = new GuardRuntimeEngine();
    engine.registerGuard(new PhaseGateGuard());
    engine.registerGuard(new RiskGateGuard());

    const firstView = engine.getGuard('phase_gate')!;
    expect(() => {
      (firstView as unknown as { id: string }).id = 'tampered';
    }).toThrow();
    expect(() => {
      (firstView as unknown as { priority: number }).priority = -1;
    }).toThrow();
    expect(() => {
      (firstView as unknown as { enabled: boolean }).enabled = false;
    }).toThrow();

    const secondView = engine.getGuard('phase_gate')!;
    expect(secondView.id).toBe('phase_gate');
    expect(secondView.priority).toBe(10);
    expect(secondView.enabled).toBe(true);

    const ids = engine.getRegisteredGuards().map((g) => g.id);
    expect(ids).toEqual(['phase_gate', 'risk_gate']);
  });

  it('mutating an entry returned by getRegisteredGuards() does not change the live pipeline', () => {
    const engine = new GuardRuntimeEngine();
    engine.registerGuard(new PhaseGateGuard());
    engine.registerGuard(new RiskGateGuard());

    const list = engine.getRegisteredGuards();
    const tampered = list.find((g) => g.id === 'phase_gate')!;
    expect(() => {
      (tampered as unknown as { enabled: boolean }).enabled = false;
      (tampered as unknown as { priority: number }).priority = 999;
    }).toThrow();

    const result = engine.evaluate(ctx({ phase: 'INTAKE', role: 'AI_AGENT' }));
    expect(result.blockedBy).toBe('phase_gate');
  });

  it('preserves evaluation ordering and mandatory protection after hostile mutation attempts', () => {
    const engine = createGuardEngine();
    const original = engine.getGuard('ai_commit')!;
    expect(() => {
      (original as unknown as { priority: number }).priority = 9999;
    }).toThrow();

    // Evaluation order is priority-ascending regardless of registration order;
    // a rejected mutation attempt on one accessor view must not perturb it.
    const result = engine.evaluate(ctx({ role: 'AI_AGENT', action: 'write code' }));
    const evaluationOrder = result.results.map((r) => r.guardId);
    expect(evaluationOrder[0]).toBe('ai_commit');
    expect(evaluationOrder).toEqual(
      [...evaluationOrder].sort(
        (a, b) => engine.getGuard(a)!.priority - engine.getGuard(b)!.priority,
      ),
    );

    expect(() => engine.disableGuard('ai_commit')).toThrow(/mandatory/i);
    expect(() => engine.unregisterGuard('phase_gate')).toThrow(/mandatory/i);
  });

  it('supports the documented non-mandatory disable transition through the engine API only', () => {
    const engine = new GuardRuntimeEngine();
    engine.registerGuard(new RiskGateGuard());

    expect(engine.getGuard('risk_gate')!.enabled).toBe(true);
    engine.disableGuard('risk_gate');
    expect(engine.getGuard('risk_gate')!.enabled).toBe(false);

    const result = engine.evaluate(ctx({ riskLevel: 'R3', role: 'AI_AGENT' }));
    expect(result.results.some((r) => r.guardId === 'risk_gate')).toBe(false);
  });
});

describe('PhaseGateGuard', () => {
  const guard = new PhaseGateGuard();

  it('uses canonical 5-phase order', () => {
    expect(PHASE_ORDER).toEqual(['INTAKE', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE']);
  });

  it('keeps DISCOVERY out of the internal phase-role matrix', () => {
    expect(Object.keys(PHASE_ROLE_MATRIX)).toEqual(PHASE_ORDER);
  });

  it('allows HUMAN in canonical phases', () => {
    for (const phase of PHASE_ORDER) {
      expect(guard.evaluate(ctx({ phase, role: 'HUMAN' })).decision).toBe('ALLOW');
    }
  });

  it('blocks AI_AGENT in INTAKE', () => {
    const result = guard.evaluate(ctx({ phase: 'INTAKE', role: 'AI_AGENT' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('allows AI_AGENT in BUILD', () => {
    const result = guard.evaluate(ctx({ phase: 'BUILD', role: 'AI_AGENT' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('treats DISCOVERY as legacy alias input', () => {
    const result = guard.evaluate(ctx({ phase: 'DISCOVERY', role: 'AI_AGENT' }));
    expect(result.decision).toBe('BLOCK');
  });
});

describe('RiskGateGuard', () => {
  const guard = new RiskGateGuard();

  it('allows R0 for AI_AGENT in BUILD', () => {
    const result = guard.evaluate(ctx({ riskLevel: 'R0', role: 'AI_AGENT' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('escalates R2 for builder-class roles', () => {
    const result = guard.evaluate(ctx({ riskLevel: 'R2', role: 'AI_AGENT' }));
    expect(result.decision).toBe('ESCALATE');
  });

  it('blocks R3 for AI_AGENT', () => {
    const result = guard.evaluate(ctx({ riskLevel: 'R3', role: 'AI_AGENT' }));
    expect(result.decision).toBe('BLOCK');
  });
});

describe('AuthorityGateGuard', () => {
  const guard = new AuthorityGateGuard();

  it('allows AI_AGENT write action in BUILD', () => {
    const result = guard.evaluate(ctx({ phase: 'BUILD', role: 'AI_AGENT', riskLevel: 'R1', action: 'write component' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks AI_AGENT in INTAKE', () => {
    const result = guard.evaluate(ctx({ phase: 'INTAKE', role: 'AI_AGENT', action: 'analyze requirements' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks risk above authority cell limit', () => {
    const result = guard.evaluate(ctx({ phase: 'BUILD', role: 'AI_AGENT', riskLevel: 'R3', action: 'write component' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('keeps DISCOVERY out of the internal authority matrix while preserving alias input', () => {
    for (const cells of Object.values(AUTHORITY_MATRIX)) {
      expect(Object.keys(cells)).toEqual(PHASE_ORDER);
    }
    const result = guard.evaluate(ctx({ phase: 'DISCOVERY', role: 'ANALYST', riskLevel: 'R1', action: 'analyze scope' }));
    expect(result.decision).toBe('ALLOW');
  });
});

describe('AiCommitGuard', () => {
  const guard = new AiCommitGuard();

  it('allows read-only action without ai_commit', () => {
    const result = guard.evaluate(ctx({ action: 'read docs', role: 'AI_AGENT' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks modifying action without ai_commit', () => {
    const result = guard.evaluate(ctx({ action: 'write code', role: 'AI_AGENT' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('does not misclassify README as read-only', () => {
    const result = guard.evaluate(ctx({ action: 'modify README.md', role: 'AI_AGENT' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('allows valid ai_commit metadata', () => {
    const result = guard.evaluate(ctx({
      action: 'write code',
      role: 'AI_AGENT',
      metadata: {
        ai_commit: {
          commitId: 'cmp-1',
          agentId: 'agent-1',
          timestamp: Date.now(),
        },
      },
    }));
    expect(result.decision).toBe('ALLOW');
  });
});

describe('MutationBudgetGuard', () => {
  const guard = new MutationBudgetGuard();

  it('allows within budget', () => {
    expect(guard.evaluate(ctx({ mutationCount: 5, riskLevel: 'R0' })).decision).toBe('ALLOW');
  });

  it('blocks over budget', () => {
    expect(guard.evaluate(ctx({ mutationCount: 51, riskLevel: 'R0' })).decision).toBe('BLOCK');
  });
});

describe('FileScopeGuard', () => {
  const guard = new FileScopeGuard();

  it('allows in-scope builder changes', () => {
    const result = guard.evaluate(ctx({
      role: 'AI_AGENT',
      action: 'write code',
      targetFiles: ['src/app.ts'],
      fileScope: ['src/'],
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks out-of-scope changes', () => {
    const result = guard.evaluate(ctx({
      role: 'AI_AGENT',
      action: 'write code',
      targetFiles: ['docs/guide.md'],
      fileScope: ['src/'],
    }));
    expect(result.decision).toBe('BLOCK');
  });
});

describe('ScopeGuard', () => {
  const guard = new ScopeGuard();

  it('blocks builder-class roles from protected paths', () => {
    const result = guard.evaluate(ctx({ role: 'AI_AGENT', targetFiles: ['governance/rules.yaml'] }));
    expect(result.decision).toBe('BLOCK');
  });

  it('escalates builder-class roles touching root files', () => {
    const result = guard.evaluate(ctx({ role: 'AI_AGENT', targetFiles: ['README.md'] }));
    expect(result.decision).toBe('ESCALATE');
  });
});

describe('handoff runtime exports', () => {
  it('exports runtime handoff helpers from the canonical barrel', () => {
    const transition = classifyHandoffTransition({
      approvalOrDecisionPending: true,
      meaningfulStatePresent: true,
    });
    expect(transition).toBe('ESCALATION_HANDOFF');

    const checkpoint = createHandoffCheckpoint({
      transition,
      reason: 'Approval required before execution continues.',
    });
    expect(checkpoint.formalHandoffRequired).toBe(true);
  });
});

describe('AuditTrailGuard', () => {
  const guard = new AuditTrailGuard();

  it('allows when required fields are present', () => {
    const result = guard.evaluate(ctx({ role: 'AI_AGENT', agentId: 'a1', riskLevel: 'R2', traceHash: 'h1' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks empty requestId', () => {
    const result = guard.evaluate(ctx({ requestId: '' }));
    expect(result.decision).toBe('BLOCK');
  });
});
