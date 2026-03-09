/**
 * Tests for all 6 individual guards
 */

import { describe, it, expect } from 'vitest';
import { PhaseGateGuard, PHASE_ROLE_MATRIX } from './phase-gate.guard.js';
import { RiskGateGuard } from './risk-gate.guard.js';
import { AuthorityGateGuard } from './authority-gate.guard.js';
import { MutationBudgetGuard, DEFAULT_MUTATION_BUDGETS } from './mutation-budget.guard.js';
import { ScopeGuard } from './scope.guard.js';
import { AuditTrailGuard } from './audit-trail.guard.js';
import type { GuardRequestContext } from './types.js';

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

// ─── Phase Gate Guard ─────────────────────────────────────────────────

describe('PhaseGateGuard', () => {
  const guard = new PhaseGateGuard();

  it('allows HUMAN in DISCOVERY', () => {
    const r = guard.evaluate(ctx({ phase: 'DISCOVERY', role: 'HUMAN' }));
    expect(r.decision).toBe('ALLOW');
  });

  it('allows HUMAN in DESIGN', () => {
    const r = guard.evaluate(ctx({ phase: 'DESIGN', role: 'HUMAN' }));
    expect(r.decision).toBe('ALLOW');
  });

  it('allows HUMAN in BUILD', () => {
    const r = guard.evaluate(ctx({ phase: 'BUILD', role: 'HUMAN' }));
    expect(r.decision).toBe('ALLOW');
  });

  it('allows HUMAN in REVIEW', () => {
    const r = guard.evaluate(ctx({ phase: 'REVIEW', role: 'HUMAN' }));
    expect(r.decision).toBe('ALLOW');
  });

  it('allows AI_AGENT in BUILD', () => {
    const r = guard.evaluate(ctx({ phase: 'BUILD', role: 'AI_AGENT' }));
    expect(r.decision).toBe('ALLOW');
  });

  it('blocks AI_AGENT in DISCOVERY', () => {
    const r = guard.evaluate(ctx({ phase: 'DISCOVERY', role: 'AI_AGENT' }));
    expect(r.decision).toBe('BLOCK');
    expect(r.agentGuidance).toBeDefined();
    expect(r.agentGuidance).toContain('AI_AGENT');
  });

  it('blocks AI_AGENT in DESIGN', () => {
    const r = guard.evaluate(ctx({ phase: 'DESIGN', role: 'AI_AGENT' }));
    expect(r.decision).toBe('BLOCK');
  });

  it('blocks AI_AGENT in REVIEW', () => {
    const r = guard.evaluate(ctx({ phase: 'REVIEW', role: 'AI_AGENT' }));
    expect(r.decision).toBe('BLOCK');
  });

  it('allows REVIEWER in REVIEW', () => {
    const r = guard.evaluate(ctx({ phase: 'REVIEW', role: 'REVIEWER' }));
    expect(r.decision).toBe('ALLOW');
  });

  it('blocks REVIEWER in BUILD', () => {
    const r = guard.evaluate(ctx({ phase: 'BUILD', role: 'REVIEWER' }));
    expect(r.decision).toBe('BLOCK');
  });

  it('allows OPERATOR in all phases', () => {
    for (const phase of ['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW'] as const) {
      const r = guard.evaluate(ctx({ phase, role: 'OPERATOR' }));
      expect(r.decision).toBe('ALLOW');
    }
  });

  it('blocks unknown phase', () => {
    const r = guard.evaluate(ctx({ phase: 'INVALID' as any }));
    expect(r.decision).toBe('BLOCK');
    expect(r.severity).toBe('CRITICAL');
  });

  it('provides suggestedAction on block', () => {
    const r = guard.evaluate(ctx({ phase: 'DISCOVERY', role: 'AI_AGENT' }));
    expect(r.suggestedAction).toBeDefined();
  });

  it('includes metadata on block', () => {
    const r = guard.evaluate(ctx({ phase: 'DISCOVERY', role: 'AI_AGENT' }));
    expect(r.metadata).toBeDefined();
    expect(r.metadata!.allowedPhases).toBeDefined();
  });
});

// ─── Risk Gate Guard ──────────────────────────────────────────────────

describe('RiskGateGuard', () => {
  const guard = new RiskGateGuard();

  it('allows R0 for any role', () => {
    expect(guard.evaluate(ctx({ riskLevel: 'R0', role: 'AI_AGENT' })).decision).toBe('ALLOW');
    expect(guard.evaluate(ctx({ riskLevel: 'R0', role: 'HUMAN' })).decision).toBe('ALLOW');
  });

  it('allows R1 for any role', () => {
    expect(guard.evaluate(ctx({ riskLevel: 'R1', role: 'AI_AGENT' })).decision).toBe('ALLOW');
    expect(guard.evaluate(ctx({ riskLevel: 'R1', role: 'HUMAN' })).decision).toBe('ALLOW');
  });

  it('allows R2 for HUMAN', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R2', role: 'HUMAN' }));
    expect(r.decision).toBe('ALLOW');
    expect(r.severity).toBe('WARN');
  });

  it('escalates R2 for AI_AGENT', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R2', role: 'AI_AGENT' }));
    expect(r.decision).toBe('ESCALATE');
    expect(r.agentGuidance).toContain('R2');
  });

  it('blocks R3 for AI_AGENT', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R3', role: 'AI_AGENT' }));
    expect(r.decision).toBe('BLOCK');
    expect(r.severity).toBe('CRITICAL');
    expect(r.agentGuidance).toContain('human approval');
  });

  it('escalates R3 for HUMAN', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R3', role: 'HUMAN' }));
    expect(r.decision).toBe('ESCALATE');
  });

  it('blocks unknown risk level', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R9' as any }));
    expect(r.decision).toBe('BLOCK');
    expect(r.severity).toBe('CRITICAL');
  });

  it('provides suggestedAction for R3 AI_AGENT', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R3', role: 'AI_AGENT' }));
    expect(r.suggestedAction).toBe('request_human_approval');
  });

  it('provides suggestedAction for R2 AI_AGENT', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R2', role: 'AI_AGENT' }));
    expect(r.suggestedAction).toBe('present_plan_for_approval');
  });
});

// ─── Authority Gate Guard ─────────────────────────────────────────────

describe('AuthorityGateGuard', () => {
  const guard = new AuthorityGateGuard();

  it('allows HUMAN for any action', () => {
    expect(guard.evaluate(ctx({ role: 'HUMAN', action: 'approve' })).decision).toBe('ALLOW');
    expect(guard.evaluate(ctx({ role: 'HUMAN', action: 'deploy' })).decision).toBe('ALLOW');
    expect(guard.evaluate(ctx({ role: 'HUMAN', action: 'delete_governance' })).decision).toBe('ALLOW');
  });

  it('allows OPERATOR for any action', () => {
    expect(guard.evaluate(ctx({ role: 'OPERATOR', action: 'deploy' })).decision).toBe('ALLOW');
  });

  it('blocks AI_AGENT from approve', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT', action: 'approve this PR' }));
    expect(r.decision).toBe('BLOCK');
    expect(r.agentGuidance).toContain('AI_AGENT');
  });

  it('blocks AI_AGENT from merge', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT', action: 'merge branch' }));
    expect(r.decision).toBe('BLOCK');
  });

  it('blocks AI_AGENT from deploy', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT', action: 'deploy to production' }));
    expect(r.decision).toBe('BLOCK');
  });

  it('blocks AI_AGENT from release', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT', action: 'release v2.0' }));
    expect(r.decision).toBe('BLOCK');
  });

  it('blocks AI_AGENT from delete_governance', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT', action: 'delete_governance rules' }));
    expect(r.decision).toBe('BLOCK');
  });

  it('blocks AI_AGENT from override_gate', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT', action: 'override_gate for testing' }));
    expect(r.decision).toBe('BLOCK');
  });

  it('allows AI_AGENT for safe actions', () => {
    expect(guard.evaluate(ctx({ role: 'AI_AGENT', action: 'write code' })).decision).toBe('ALLOW');
    expect(guard.evaluate(ctx({ role: 'AI_AGENT', action: 'analyze data' })).decision).toBe('ALLOW');
    expect(guard.evaluate(ctx({ role: 'AI_AGENT', action: 'generate report' })).decision).toBe('ALLOW');
  });

  it('blocks REVIEWER from build', () => {
    const r = guard.evaluate(ctx({ role: 'REVIEWER', action: 'build feature' }));
    expect(r.decision).toBe('BLOCK');
  });

  it('blocks unknown role', () => {
    const r = guard.evaluate(ctx({ role: 'HACKER' as any }));
    expect(r.decision).toBe('BLOCK');
    expect(r.severity).toBe('CRITICAL');
  });

  it('provides suggestedAction on block', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT', action: 'deploy' }));
    expect(r.suggestedAction).toBe('delegate_to_authorized_role');
  });

  it('is case-insensitive for action matching', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT', action: 'DEPLOY TO PROD' }));
    expect(r.decision).toBe('BLOCK');
  });
});

// ─── Mutation Budget Guard ────────────────────────────────────────────

describe('MutationBudgetGuard', () => {
  const guard = new MutationBudgetGuard();

  it('allows when within budget', () => {
    const r = guard.evaluate(ctx({ mutationCount: 5, riskLevel: 'R0' }));
    expect(r.decision).toBe('ALLOW');
  });

  it('blocks when over budget', () => {
    const r = guard.evaluate(ctx({ mutationCount: 51, riskLevel: 'R0' }));
    expect(r.decision).toBe('BLOCK');
    expect(r.agentGuidance).toContain('51');
  });

  it('escalates when approaching budget (>80%)', () => {
    const r = guard.evaluate(ctx({ mutationCount: 41, riskLevel: 'R0' }));
    expect(r.decision).toBe('ESCALATE');
  });

  it('uses R0 budget (50)', () => {
    expect(guard.evaluate(ctx({ mutationCount: 50, riskLevel: 'R0' })).decision).toBe('ESCALATE');
    expect(guard.evaluate(ctx({ mutationCount: 51, riskLevel: 'R0' })).decision).toBe('BLOCK');
  });

  it('uses R1 budget (20)', () => {
    expect(guard.evaluate(ctx({ mutationCount: 20, riskLevel: 'R1' })).decision).toBe('ESCALATE');
    expect(guard.evaluate(ctx({ mutationCount: 21, riskLevel: 'R1' })).decision).toBe('BLOCK');
  });

  it('uses R2 budget (10)', () => {
    expect(guard.evaluate(ctx({ mutationCount: 10, riskLevel: 'R2' })).decision).toBe('ESCALATE');
    expect(guard.evaluate(ctx({ mutationCount: 11, riskLevel: 'R2' })).decision).toBe('BLOCK');
  });

  it('uses R3 budget (3)', () => {
    expect(guard.evaluate(ctx({ mutationCount: 3, riskLevel: 'R3' })).decision).toBe('ESCALATE');
    expect(guard.evaluate(ctx({ mutationCount: 4, riskLevel: 'R3' })).decision).toBe('BLOCK');
  });

  it('uses custom mutation budget when provided', () => {
    const r = guard.evaluate(ctx({ mutationCount: 100, mutationBudget: 200 }));
    expect(r.decision).toBe('ALLOW');
  });

  it('defaults mutation count to 0', () => {
    const r = guard.evaluate(ctx());
    expect(r.decision).toBe('ALLOW');
  });

  it('provides suggestedAction on block', () => {
    const r = guard.evaluate(ctx({ mutationCount: 51, riskLevel: 'R0' }));
    expect(r.suggestedAction).toBe('stop_and_request_budget_increase');
  });

  it('provides suggestedAction on escalate', () => {
    const r = guard.evaluate(ctx({ mutationCount: 41, riskLevel: 'R0' }));
    expect(r.suggestedAction).toBe('prioritize_remaining_changes');
  });
});

// ─── Scope Guard ──────────────────────────────────────────────────────

describe('ScopeGuard', () => {
  const guard = new ScopeGuard();

  it('allows when no target files', () => {
    const r = guard.evaluate(ctx({ targetFiles: [] }));
    expect(r.decision).toBe('ALLOW');
  });

  it('allows when targetFiles is undefined', () => {
    const r = guard.evaluate(ctx());
    expect(r.decision).toBe('ALLOW');
  });

  it('allows safe files for AI_AGENT', () => {
    const r = guard.evaluate(ctx({
      role: 'AI_AGENT',
      targetFiles: ['src/components/App.tsx', 'src/lib/utils.ts'],
    }));
    expect(r.decision).toBe('ALLOW');
  });

  it('blocks AI_AGENT from governance paths', () => {
    const r = guard.evaluate(ctx({
      role: 'AI_AGENT',
      targetFiles: ['governance/rules.yaml'],
    }));
    expect(r.decision).toBe('BLOCK');
    expect(r.agentGuidance).toContain('protected');
  });

  it('blocks AI_AGENT from CVF docs', () => {
    const r = guard.evaluate(ctx({
      role: 'AI_AGENT',
      targetFiles: ['docs/CVF_ASSESSMENT.md'],
    }));
    expect(r.decision).toBe('BLOCK');
  });

  it('blocks AI_AGENT from governance protocol', () => {
    const r = guard.evaluate(ctx({
      role: 'AI_AGENT',
      targetFiles: ['EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard.ts'],
    }));
    expect(r.decision).toBe('BLOCK');
  });

  it('allows HUMAN to modify governance paths', () => {
    const r = guard.evaluate(ctx({
      role: 'HUMAN',
      targetFiles: ['governance/rules.yaml'],
    }));
    expect(r.decision).toBe('ALLOW');
  });

  it('escalates AI_AGENT modifying root files', () => {
    const r = guard.evaluate(ctx({
      role: 'AI_AGENT',
      targetFiles: ['README.md'],
    }));
    expect(r.decision).toBe('ESCALATE');
  });

  it('escalates AI_AGENT modifying CHANGELOG', () => {
    const r = guard.evaluate(ctx({
      role: 'AI_AGENT',
      targetFiles: ['CHANGELOG.md'],
    }));
    expect(r.decision).toBe('ESCALATE');
  });

  it('allows HUMAN to modify root files', () => {
    const r = guard.evaluate(ctx({
      role: 'HUMAN',
      targetFiles: ['README.md'],
    }));
    expect(r.decision).toBe('ALLOW');
  });

  it('handles Windows paths', () => {
    const r = guard.evaluate(ctx({
      role: 'AI_AGENT',
      targetFiles: ['EXTENSIONS\\CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL\\governance\\test.ts'],
    }));
    expect(r.decision).toBe('BLOCK');
  });

  it('provides suggestedAction on block', () => {
    const r = guard.evaluate(ctx({
      role: 'AI_AGENT',
      targetFiles: ['governance/rules.yaml'],
    }));
    expect(r.suggestedAction).toBe('suggest_change_to_human');
  });
});

// ─── Audit Trail Guard ────────────────────────────────────────────────

describe('AuditTrailGuard', () => {
  const guard = new AuditTrailGuard();

  it('allows when all fields present', () => {
    const r = guard.evaluate(ctx({
      requestId: 'req-001',
      role: 'AI_AGENT',
      agentId: 'agent-001',
      riskLevel: 'R2',
      traceHash: 'abc123',
    }));
    expect(r.decision).toBe('ALLOW');
  });

  it('blocks when requestId is empty', () => {
    const r = guard.evaluate(ctx({ requestId: '' }));
    expect(r.decision).toBe('BLOCK');
    expect(r.severity).toBe('CRITICAL');
  });

  it('blocks when requestId is whitespace', () => {
    const r = guard.evaluate(ctx({ requestId: '   ' }));
    expect(r.decision).toBe('BLOCK');
  });

  it('escalates when AI_AGENT has no agentId', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT', agentId: undefined }));
    expect(r.decision).toBe('ESCALATE');
    expect(r.agentGuidance).toContain('agentId');
  });

  it('escalates when AI_AGENT has empty agentId', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT', agentId: '' }));
    expect(r.decision).toBe('ESCALATE');
  });

  it('escalates when R2 has no traceHash', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R2', traceHash: undefined }));
    expect(r.decision).toBe('ESCALATE');
    expect(r.agentGuidance).toContain('traceHash');
  });

  it('escalates when R3 has no traceHash', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R3', traceHash: undefined }));
    expect(r.decision).toBe('ESCALATE');
  });

  it('allows R0 without traceHash', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R0' }));
    expect(r.decision).toBe('ALLOW');
  });

  it('allows R1 without traceHash', () => {
    const r = guard.evaluate(ctx({ riskLevel: 'R1' }));
    expect(r.decision).toBe('ALLOW');
  });

  it('allows HUMAN without agentId', () => {
    const r = guard.evaluate(ctx({ role: 'HUMAN', agentId: undefined }));
    expect(r.decision).toBe('ALLOW');
  });

  it('provides suggestedAction on escalate', () => {
    const r = guard.evaluate(ctx({ role: 'AI_AGENT', agentId: undefined }));
    expect(r.suggestedAction).toBe('complete_audit_fields');
  });

  it('provides agentGuidance on block', () => {
    const r = guard.evaluate(ctx({ requestId: '' }));
    expect(r.agentGuidance).toContain('requestId');
  });
});
