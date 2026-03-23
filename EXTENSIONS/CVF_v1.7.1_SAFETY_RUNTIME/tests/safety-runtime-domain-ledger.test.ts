/**
 * CVF v1.7.1 Safety Runtime — Domain Registry, Ledger & Refusal Dedicated Tests (W6-T61)
 * ========================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (6 pure-logic contracts):
 *   kernel/01_domain_lock/domain.registry.ts:
 *     DomainRegistry bootstrap (6 domains), get/exists/list/register-dup-throws
 *   kernel/03_contamination_guard/risk_detector.ts:
 *     RiskDetector.detect — self_harm/legal/financial/no-risk flags
 *   kernel/03_contamination_guard/rollback_controller.ts:
 *     RollbackController.plan — R4→required/critical, drift→required/drift, normal→false
 *   kernel/03_contamination_guard/lineage_graph.ts:
 *     LineageGraph.addNode/addEdge/getSnapshot — accumulation + empty default
 *   internal_ledger/boundary_snapshot.ts:
 *     BoundarySnapshot.capture/getAll — state accumulation
 *   kernel/04_refusal_router/clarification_generator.ts:
 *     ClarificationGenerator.generate — returns standard clarification message
 */

import { describe, it, expect } from 'vitest';

import { DomainRegistry } from '../kernel-architecture/kernel/01_domain_lock/domain.registry';
import { RiskDetector } from '../kernel-architecture/kernel/03_contamination_guard/risk_detector';
import { RollbackController } from '../kernel-architecture/kernel/03_contamination_guard/rollback_controller';
import { LineageGraph } from '../kernel-architecture/kernel/03_contamination_guard/lineage_graph';
import { BoundarySnapshot } from '../kernel-architecture/internal_ledger/boundary_snapshot';
import { ClarificationGenerator } from '../kernel-architecture/kernel/04_refusal_router/clarification_generator';

// ─── DomainRegistry ───────────────────────────────────────────────────────────

describe('DomainRegistry', () => {
  it('bootstraps with 6 default domains on construction', () => {
    const registry = new DomainRegistry();
    expect(registry.list().length).toBe(6);
  });

  it('get("informational") → riskTolerance="low"', () => {
    const registry = new DomainRegistry();
    const domain = registry.get('informational');
    expect(domain).toBeDefined();
    expect(domain!.riskTolerance).toBe('low');
  });

  it('get("restricted") → riskTolerance="critical", empty allowedInputTypes', () => {
    const registry = new DomainRegistry();
    const domain = registry.get('restricted');
    expect(domain!.riskTolerance).toBe('critical');
    expect(domain!.allowedInputTypes).toHaveLength(0);
  });

  it('exists("creative") → true; exists("unknown") → false', () => {
    const registry = new DomainRegistry();
    expect(registry.exists('creative')).toBe(true);
    expect(registry.exists('nonexistent-domain')).toBe(false);
  });

  it('register duplicate domain name → throws "Domain already exists"', () => {
    const registry = new DomainRegistry();
    expect(() =>
      registry.register({ name: 'informational', description: 'dupe', allowedInputTypes: [], allowedOutputTypes: [], riskTolerance: 'low' })
    ).toThrow('Domain already exists: informational');
  });
});

// ─── RiskDetector ─────────────────────────────────────────────────────────────

describe('RiskDetector', () => {
  const detector = new RiskDetector();

  it('"suicide" → ["self_harm"]', () => {
    expect(detector.detect('I am thinking about suicide')).toContain('self_harm');
  });

  it('"legal advice" → ["legal"]', () => {
    expect(detector.detect('I need legal advice about my case')).toContain('legal');
  });

  it('"invest" → ["financial"]', () => {
    expect(detector.detect('Should I invest in ETFs?')).toContain('financial');
  });

  it('no risk keywords → empty array', () => {
    expect(detector.detect('What is the capital of France?')).toHaveLength(0);
  });
});

// ─── RollbackController ───────────────────────────────────────────────────────

describe('RollbackController', () => {
  const controller = new RollbackController();

  it('R4 assessment → required=true, reason="critical_risk"', () => {
    const plan = controller.plan({ level: 'critical', cvfRiskLevel: 'R4', score: 95, reasons: [] });
    expect(plan.required).toBe(true);
    expect(plan.reason).toBe('critical_risk');
    expect(plan.safeMessage).toBeDefined();
  });

  it('driftDetected=true (non-R4) → required=true, reason="drift_detected"', () => {
    const plan = controller.plan({ level: 'medium', cvfRiskLevel: 'R2', score: 55, reasons: [], driftDetected: true });
    expect(plan.required).toBe(true);
    expect(plan.reason).toBe('drift_detected');
  });

  it('normal R1 with no drift → required=false', () => {
    const plan = controller.plan({ level: 'low', cvfRiskLevel: 'R1', score: 20, reasons: [] });
    expect(plan.required).toBe(false);
  });
});

// ─── LineageGraph ─────────────────────────────────────────────────────────────

describe('LineageGraph', () => {
  it('addNode + getSnapshot contains the node', () => {
    const graph = new LineageGraph();
    graph.addNode({ id: 'n1', domain: 'informational', risk: 'R0', timestamp: Date.now() });
    const { nodes } = graph.getSnapshot();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('n1');
  });

  it('addEdge + getSnapshot contains the edge', () => {
    const graph = new LineageGraph();
    graph.addNode({ id: 'a', domain: 'D', risk: 'R0', timestamp: 1 });
    graph.addNode({ id: 'b', domain: 'D', risk: 'R0', timestamp: 2 });
    graph.addEdge('a', 'b');
    const { edges } = graph.getSnapshot();
    expect(edges).toHaveLength(1);
    expect(edges[0].from).toBe('a');
    expect(edges[0].to).toBe('b');
  });

  it('empty graph → nodes=[], edges=[]', () => {
    const graph = new LineageGraph();
    const { nodes, edges } = graph.getSnapshot();
    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
  });
});

// ─── BoundarySnapshot ────────────────────────────────────────────────────────

describe('BoundarySnapshot', () => {
  it('capture + getAll returns the boundary state with all fields', () => {
    const snapshot = new BoundarySnapshot();
    snapshot.capture({
      requestId: 'req-001',
      policyVersion: 'v1',
      decisionCode: 'ALLOW',
      traceHash: 'hash-abc',
      domain: 'informational',
      contractValid: true,
      refusalTriggered: false,
      timestamp: Date.now(),
    });
    const states = snapshot.getAll();
    expect(states).toHaveLength(1);
    expect(states[0].requestId).toBe('req-001');
    expect(states[0].contractValid).toBe(true);
    expect(states[0].refusalTriggered).toBe(false);
  });

  it('multiple captures accumulate in insertion order', () => {
    const snapshot = new BoundarySnapshot();
    snapshot.capture({ requestId: 'r1', policyVersion: 'v1', decisionCode: 'A', traceHash: 'h1', domain: 'D', contractValid: true, refusalTriggered: false, timestamp: 1 });
    snapshot.capture({ requestId: 'r2', policyVersion: 'v1', decisionCode: 'B', traceHash: 'h2', domain: 'D', contractValid: false, refusalTriggered: true, timestamp: 2 });
    expect(snapshot.getAll()).toHaveLength(2);
    expect(snapshot.getAll()[1].refusalTriggered).toBe(true);
  });
});

// ─── ClarificationGenerator ───────────────────────────────────────────────────

describe('ClarificationGenerator', () => {
  it('generate() returns the standard clarification message string', () => {
    const gen = new ClarificationGenerator();
    const msg = gen.generate();
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
    expect(msg).toMatch(/clarify/i);
  });
});
