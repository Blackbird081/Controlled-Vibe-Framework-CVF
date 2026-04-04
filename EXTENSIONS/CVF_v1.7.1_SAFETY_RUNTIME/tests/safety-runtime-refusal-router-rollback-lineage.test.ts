/**
 * CVF v1.7.1 Safety Runtime — Refusal Router Utilities, Risk Gate,
 * Rollback Controller & Lineage Graph Tests (W6-T76)
 * ==============================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (8 contracts):
 *   kernel/04_refusal_router/alternative_route_engine.ts:
 *     AlternativeRouteEngine.suggest — returns standard guidance string
 *   kernel/04_refusal_router/clarification_generator.ts:
 *     ClarificationGenerator.generate — returns standard clarification string
 *   kernel/04_refusal_router/safe_rewrite_engine.ts:
 *     SafeRewriteEngine.rewrite — self-harm keywords redacted (case-insensitive); clean→unchanged
 *   kernel/04_refusal_router/refusal.authority.policy.ts:
 *     AuthorityPolicy.isAllowed — read→true; write→false (DefaultCapabilityProfile)
 *   kernel/04_refusal_router/capability.guard.ts:
 *     CapabilityGuard.validate — read→no throw; execute→throws with capability name
 *   kernel/04_refusal_router/refusal.risk.ts:
 *     RiskGate.evaluate — safe text→passthrough; R4→block JSON; R3→needs_approval JSON
 *   kernel/03_contamination_guard/rollback_controller.ts:
 *     RollbackController.plan — R4→required/critical_risk; driftDetected→required/drift_detected;
 *       clean assessment→required=false
 *   kernel/03_contamination_guard/lineage_graph.ts:
 *     LineageGraph.addNode/addEdge/getSnapshot — nodes and edges tracked independently
 */

import { describe, it, expect } from 'vitest';

import { AlternativeRouteEngine } from '../kernel-architecture/kernel/04_refusal_router/alternative_route_engine';
import { ClarificationGenerator } from '../kernel-architecture/kernel/04_refusal_router/clarification_generator';
import { SafeRewriteEngine } from '../kernel-architecture/kernel/04_refusal_router/safe_rewrite_engine';
import { AuthorityPolicy } from '../kernel-architecture/kernel/04_refusal_router/refusal.authority.policy';
import { CapabilityGuard } from '../kernel-architecture/kernel/04_refusal_router/capability.guard';
import { RiskGate } from '../kernel-architecture/kernel/04_refusal_router/refusal.risk';
import { RollbackController } from '../kernel-architecture/kernel/03_contamination_guard/rollback_controller';
import { LineageGraph } from '../kernel-architecture/kernel/03_contamination_guard/lineage_graph';
import type { RiskAssessment } from '../kernel-architecture/kernel/03_contamination_guard/risk.types';

// ─── AlternativeRouteEngine ───────────────────────────────────────────────────

describe('AlternativeRouteEngine', () => {
  it('suggest() returns non-empty alternative guidance string', () => {
    const engine = new AlternativeRouteEngine();
    const msg = engine.suggest();
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
    expect(msg.toLowerCase()).toContain('alternative');
  });
});

// ─── ClarificationGenerator ──────────────────────────────────────────────────

describe('ClarificationGenerator', () => {
  it('generate() returns non-empty clarification request string', () => {
    const gen = new ClarificationGenerator();
    const msg = gen.generate();
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
    expect(msg.toLowerCase()).toContain('clarify');
  });
});

// ─── SafeRewriteEngine ───────────────────────────────────────────────────────

describe('SafeRewriteEngine', () => {
  const engine = new SafeRewriteEngine();

  it('message containing "kill myself" → keyword is redacted', () => {
    const result = engine.rewrite('I want to kill myself today');
    expect(result).toContain('[self-harm redacted]');
    expect(result).not.toContain('kill myself');
  });

  it('rewrite is case-insensitive — "KILL MYSELF" is also redacted', () => {
    const result = engine.rewrite('I WILL KILL MYSELF');
    expect(result).toContain('[self-harm redacted]');
  });

  it('clean message without trigger words → unchanged', () => {
    const clean = 'Hello, how are you?';
    expect(engine.rewrite(clean)).toBe(clean);
  });
});

// ─── AuthorityPolicy ─────────────────────────────────────────────────────────

describe('AuthorityPolicy', () => {
  const policy = new AuthorityPolicy();

  it('capability "read" is allowed by DefaultCapabilityProfile', () => {
    expect(policy.isAllowed({ capability: 'read', source: 'test' })).toBe(true);
  });

  it('capability "write" is blocked by DefaultCapabilityProfile', () => {
    expect(policy.isAllowed({ capability: 'write', source: 'test' })).toBe(false);
  });
});

// ─── CapabilityGuard ─────────────────────────────────────────────────────────

describe('CapabilityGuard', () => {
  const guard = new CapabilityGuard();

  it('allowed capability "read" → validate() does not throw', () => {
    expect(() => guard.validate({ capability: 'read', source: 'agent' })).not.toThrow();
  });

  it('blocked capability "execute" → validate() throws with capability name', () => {
    expect(() => guard.validate({ capability: 'execute', source: 'agent' })).toThrow('execute');
  });
});

// ─── RiskGate ────────────────────────────────────────────────────────────────

describe('RiskGate.evaluate', () => {
  const gate = new RiskGate();

  it('clean text (no risk flags) → R0 → returns original output unchanged', () => {
    const text = 'describe the weather today';
    expect(gate.evaluate(text)).toBe(text);
  });

  it('"kill myself" (self_harm=95 → R4) → returns JSON with blocked message', () => {
    const result = gate.evaluate('I want to kill myself');
    const parsed = JSON.parse(result);
    expect(parsed.answer).toContain('blocked');
    expect(parsed.risk_level).toBe('R4');
  });

  it('"legal advice" (legal=75 → R3) → returns JSON with needs_approval message', () => {
    const result = gate.evaluate('please give me legal advice on this lawsuit');
    const parsed = JSON.parse(result);
    expect(parsed.answer.toLowerCase()).toContain('approval');
    expect(parsed.risk_level).toBe('R3');
  });
});

// ─── RollbackController ──────────────────────────────────────────────────────

describe('RollbackController.plan', () => {
  const ctrl = new RollbackController();

  function makeAssessment(overrides: Partial<RiskAssessment> = {}): RiskAssessment {
    return {
      level: 'low',
      cvfRiskLevel: 'R0',
      score: 0,
      reasons: [],
      ...overrides,
    };
  }

  it('R4 risk level → required=true, reason="critical_risk"', () => {
    const plan = ctrl.plan(makeAssessment({ cvfRiskLevel: 'R4', level: 'critical', score: 95 }));
    expect(plan.required).toBe(true);
    expect(plan.reason).toBe('critical_risk');
  });

  it('driftDetected=true → required=true, reason="drift_detected"', () => {
    const plan = ctrl.plan(makeAssessment({ cvfRiskLevel: 'R2', driftDetected: true }));
    expect(plan.required).toBe(true);
    expect(plan.reason).toBe('drift_detected');
  });

  it('clean assessment (R0, no drift) → required=false', () => {
    const plan = ctrl.plan(makeAssessment());
    expect(plan.required).toBe(false);
  });
});

// ─── LineageGraph ─────────────────────────────────────────────────────────────

describe('LineageGraph', () => {
  it('addNode + getSnapshot contains the node', () => {
    const graph = new LineageGraph();
    graph.addNode({ id: 'n1', domain: 'finance', risk: 'R0', timestamp: 1 });
    const snap = graph.getSnapshot();
    expect(snap.nodes.some((n) => n.id === 'n1')).toBe(true);
    expect(snap.edges.length).toBe(0);
  });

  it('addEdge + getSnapshot contains the edge', () => {
    const graph = new LineageGraph();
    graph.addNode({ id: 'a', domain: 'd', risk: 'R0', timestamp: 1 });
    graph.addNode({ id: 'b', domain: 'd', risk: 'R0', timestamp: 2 });
    graph.addEdge('a', 'b');
    const snap = graph.getSnapshot();
    expect(snap.edges.some((e) => e.from === 'a' && e.to === 'b')).toBe(true);
  });

  it('getSnapshot returns copies — mutating result does not affect graph state', () => {
    const graph = new LineageGraph();
    graph.addNode({ id: 'x', domain: 'd', risk: 'R0', timestamp: 1 });
    const snap1 = graph.getSnapshot();
    snap1.nodes.push({ id: 'injected', domain: 'x', risk: 'R4', timestamp: 0 });
    const snap2 = graph.getSnapshot();
    expect(snap2.nodes.length).toBe(1); // original unchanged
  });
});
