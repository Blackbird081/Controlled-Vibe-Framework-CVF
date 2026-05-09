/**
 * CVF v1.7.1 Safety Runtime — Domain Guard, Refusal Router & Execution Gateway Dedicated Tests (W6-T68)
 * ======================================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (3 contracts):
 *   kernel/01_domain_lock/domain_guard.ts:
 *     DomainGuard.validate — no-domain; unknown-domain; disallowed-type; valid
 *     DomainGuard.enforce — missing domain throws; valid does not throw
 *   kernel/04_refusal_router/refusal.router.ts:
 *     RefusalRouter.evaluate — R0→allow(not blocked); R3→needs_approval(blocked);
 *     R4→block(blocked with alternative); R2+drift→clarify(blocked with clarification)
 *   kernel/04_refusal_router/refusal.execution.ts:
 *     ExecutionGate.authorize — allowed capability (read) passes; denied (execute) throws
 */

import { describe, it, expect } from 'vitest';

import { DomainGuard } from '../kernel-architecture/kernel/01_domain_lock/domain_guard';
import { RefusalRouter } from '../kernel-architecture/kernel/04_refusal_router/refusal.router';
import { ExecutionGate } from '../kernel-architecture/kernel/04_refusal_router/refusal.execution';
import type { RiskAssessment } from '../kernel-architecture/kernel/03_contamination_guard/risk.types';

// ─── DomainGuard ─────────────────────────────────────────────────────────────

describe('DomainGuard', () => {
  const guard = new DomainGuard();

  it('validate with no domain → {valid: false, reason: "Missing domain declaration"}', () => {
    const result = guard.validate({ type: 'text' });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Missing domain declaration');
  });

  it('validate with unknown domain → {valid: false, reason includes "Unknown domain"}', () => {
    const result = guard.validate({ domain: 'galaxy-brain', type: 'text' });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Unknown domain');
  });

  it('validate with disallowed input type → {valid: false, reason includes "not allowed"}', () => {
    // informational domain does not allow "numeric"
    const result = guard.validate({ domain: 'informational', type: 'numeric' });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("not allowed");
  });

  it('validate with valid domain + allowed type → {valid: true, domain: "informational"}', () => {
    // informational domain allows "question" and "clarification" input types
    const result = guard.validate({ domain: 'informational', type: 'question' });
    expect(result.valid).toBe(true);
    expect(result.domain).toBe('informational');
  });

  it('enforce with missing domain → throws "Domain violation: Missing domain declaration"', () => {
    expect(() => guard.enforce({ type: 'text' })).toThrow(
      'Domain violation: Missing domain declaration'
    );
  });

  it('enforce with valid domain + type → does not throw', () => {
    // informational domain allows "question" input type
    expect(() => guard.enforce({ domain: 'informational', type: 'question' })).not.toThrow();
  });
});

// ─── RefusalRouter ───────────────────────────────────────────────────────────

describe('RefusalRouter', () => {
  const router = new RefusalRouter();

  function makeRisk(
    cvfRiskLevel: RiskAssessment['cvfRiskLevel'],
    overrides: Partial<RiskAssessment> = {}
  ): RiskAssessment {
    return {
      level: 'low',
      cvfRiskLevel,
      score: 0,
      reasons: [],
      ...overrides,
    };
  }

  it('R0 risk → evaluate returns {blocked: false, action: "allow"}', () => {
    const decision = router.evaluate(makeRisk('R0'));
    expect(decision.blocked).toBe(false);
    expect(decision.action).toBe('allow');
  });

  it('R3 risk → evaluate returns {blocked: true, action: "needs_approval"}', () => {
    const decision = router.evaluate(makeRisk('R3', { level: 'high', score: 80 }));
    expect(decision.blocked).toBe(true);
    expect(decision.action).toBe('needs_approval');
    expect(decision.response?.message).toContain('approval');
  });

  it('R4 risk → evaluate returns {blocked: true, action: "block"} with alternative', () => {
    const decision = router.evaluate(makeRisk('R4', { level: 'critical', score: 95 }));
    expect(decision.blocked).toBe(true);
    expect(decision.action).toBe('block');
    expect(decision.response?.message).toContain('blocked');
    expect(decision.response?.alternative).toBeDefined();
  });

  it('R2 + driftDetected=true → evaluate returns {blocked: true, action: "clarify"}', () => {
    const decision = router.evaluate(
      makeRisk('R2', { level: 'medium', score: 55, driftDetected: true })
    );
    expect(decision.blocked).toBe(true);
    expect(decision.action).toBe('clarify');
    expect(decision.response?.message).toBeDefined();
  });

  it('policyVersion is returned in all decisions', () => {
    const decision = router.evaluate(makeRisk('R1'));
    expect(typeof decision.policyVersion).toBe('string');
    expect(decision.policyVersion.length).toBeGreaterThan(0);
  });
});

// ─── ExecutionGate ───────────────────────────────────────────────────────────

describe('ExecutionGate', () => {
  const gate = new ExecutionGate();

  it('authorize with "read" capability (allowed) → does not throw', () => {
    expect(() =>
      gate.authorize({ capability: 'read', source: 'test-component' })
    ).not.toThrow();
  });

  it('authorize with "execute" capability (denied) → throws "Capability denied: execute"', () => {
    expect(() =>
      gate.authorize({ capability: 'execute', source: 'test-component' })
    ).toThrow('Capability denied: execute');
  });

  it('authorize with "network" capability (denied) → throws "Capability denied: network"', () => {
    expect(() =>
      gate.authorize({ capability: 'network', source: 'test-component' })
    ).toThrow('Capability denied: network');
  });
});
