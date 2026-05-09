/**
 * CVF v1.7 Controlled Intelligence — Bugfix Protocol Dedicated Tests (W6-T43)
 * ============================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage:
 *   classifyBug (bug.classifier.ts):
 *     - "syntax"/"unexpected token" → SYNTAX
 *     - failingTestName present → FAILING_TEST
 *     - "null"/"undefined" → RUNTIME_ERROR
 *     - "logic"/"incorrect result" → LOGIC_FLAW
 *     - "security"/"injection"/"vulnerability" → SECURITY
 *     - "architecture"/"circular dependency" → ARCHITECTURE
 *     - unrecognized → UNKNOWN
 *   evaluateAutonomy (autonomy.matrix.ts):
 *     - R3 risk → always escalate regardless of bug type
 *     - SECURITY bug → escalate
 *     - ARCHITECTURE bug → escalate
 *     - SYNTAX bug, R1 → allowAutoFix=true
 *     - FAILING_TEST bug → allowAutoFix=true
 *     - RUNTIME_ERROR + R0 → allowAutoFix=true
 *     - RUNTIME_ERROR + R2 → escalate
 *     - LOGIC_FLAW + R1 → allowAutoFix=true
 *     - UNKNOWN bug → escalate
 *   evaluateFixScope (fix.scope.guard.ts):
 *     - modifiesArchitecture=true → not allowed
 *     - modifiesSchema=true → not allowed
 *     - changedModules has out-of-scope → not allowed with reason
 *     - all within scope, no arch/schema → allowed
 *     - multiple violations accumulate reasons
 *   evaluateEscalation (escalation.rules.ts):
 *     - autonomy.requireEscalation=false + scope.allowed=true → escalate=false
 *     - autonomy.requireEscalation=true → escalate=true with reason
 *     - scope.allowed=false → escalate=true with reasons
 *     - both fail → escalate=true with combined reasons
 *   calculateEleganceScore (elegance.scorer.ts):
 *     - no change → score=100, growth=0
 *     - complexity growth reduces score
 *     - LOC growth reduces score (×0.2 factor)
 *     - dependency increase reduces score (×5 per dep)
 *     - score clamped to 0 (never negative)
 */

import { describe, it, expect } from 'vitest';

import { classifyBug, BugType } from './bug.classifier.js';
import { evaluateAutonomy } from './autonomy.matrix.js';
import { evaluateFixScope } from './fix.scope.guard.js';
import { evaluateEscalation } from './escalation.rules.js';
import { calculateEleganceScore } from '../elegance_policy/elegance.scorer.js';

// ─── classifyBug ──────────────────────────────────────────────────────────────

describe('classifyBug', () => {
  it('"syntax" in message → SYNTAX', () => {
    expect(classifyBug({ message: 'syntax error in module' })).toBe(BugType.SYNTAX);
  });

  it('"unexpected token" in message → SYNTAX', () => {
    expect(classifyBug({ message: 'unexpected token at line 5' })).toBe(BugType.SYNTAX);
  });

  it('failingTestName present → FAILING_TEST', () => {
    expect(classifyBug({ message: 'something broke', failingTestName: 'it should do X' })).toBe(BugType.FAILING_TEST);
  });

  it('"null" in message → RUNTIME_ERROR', () => {
    expect(classifyBug({ message: 'cannot read property of null' })).toBe(BugType.RUNTIME_ERROR);
  });

  it('"undefined" in message → RUNTIME_ERROR', () => {
    expect(classifyBug({ message: 'value is undefined' })).toBe(BugType.RUNTIME_ERROR);
  });

  it('"logic" in message → LOGIC_FLAW', () => {
    expect(classifyBug({ message: 'logic error in condition' })).toBe(BugType.LOGIC_FLAW);
  });

  it('"incorrect result" in message → LOGIC_FLAW', () => {
    expect(classifyBug({ message: 'returns incorrect result' })).toBe(BugType.LOGIC_FLAW);
  });

  it('"security" in message → SECURITY', () => {
    expect(classifyBug({ message: 'security breach detected' })).toBe(BugType.SECURITY);
  });

  it('"injection" in message → SECURITY', () => {
    expect(classifyBug({ message: 'sql injection attempt' })).toBe(BugType.SECURITY);
  });

  it('"vulnerability" in message → SECURITY', () => {
    expect(classifyBug({ message: 'vulnerability in auth flow' })).toBe(BugType.SECURITY);
  });

  it('"architecture" in message → ARCHITECTURE', () => {
    expect(classifyBug({ message: 'architecture violation' })).toBe(BugType.ARCHITECTURE);
  });

  it('"circular dependency" in message → ARCHITECTURE', () => {
    expect(classifyBug({ message: 'circular dependency detected' })).toBe(BugType.ARCHITECTURE);
  });

  it('unrecognized message → UNKNOWN', () => {
    expect(classifyBug({ message: 'something completely different' })).toBe(BugType.UNKNOWN);
  });
});

// ─── evaluateAutonomy ─────────────────────────────────────────────────────────

describe('evaluateAutonomy', () => {
  it('R3 risk + SYNTAX → escalate (risk override)', () => {
    const result = evaluateAutonomy(BugType.SYNTAX, 'R3');
    expect(result.allowAutoFix).toBe(false);
    expect(result.requireEscalation).toBe(true);
  });

  it('SECURITY bug + R0 → escalate', () => {
    const result = evaluateAutonomy(BugType.SECURITY, 'R0');
    expect(result.requireEscalation).toBe(true);
    expect(result.allowAutoFix).toBe(false);
  });

  it('ARCHITECTURE bug + R1 → escalate', () => {
    const result = evaluateAutonomy(BugType.ARCHITECTURE, 'R1');
    expect(result.requireEscalation).toBe(true);
  });

  it('SYNTAX bug + R1 → allowAutoFix=true', () => {
    const result = evaluateAutonomy(BugType.SYNTAX, 'R1');
    expect(result.allowAutoFix).toBe(true);
    expect(result.requireEscalation).toBe(false);
  });

  it('FAILING_TEST bug + R2 → allowAutoFix=true', () => {
    const result = evaluateAutonomy(BugType.FAILING_TEST, 'R2');
    expect(result.allowAutoFix).toBe(true);
    expect(result.requireEscalation).toBe(false);
  });

  it('RUNTIME_ERROR + R0 → allowAutoFix=true', () => {
    const result = evaluateAutonomy(BugType.RUNTIME_ERROR, 'R0');
    expect(result.allowAutoFix).toBe(true);
  });

  it('RUNTIME_ERROR + R2 → escalate', () => {
    const result = evaluateAutonomy(BugType.RUNTIME_ERROR, 'R2');
    expect(result.requireEscalation).toBe(true);
    expect(result.allowAutoFix).toBe(false);
  });

  it('LOGIC_FLAW + R1 → allowAutoFix=true', () => {
    const result = evaluateAutonomy(BugType.LOGIC_FLAW, 'R1');
    expect(result.allowAutoFix).toBe(true);
  });

  it('UNKNOWN bug → escalate', () => {
    const result = evaluateAutonomy(BugType.UNKNOWN, 'R1');
    expect(result.requireEscalation).toBe(true);
  });
});

// ─── evaluateFixScope ─────────────────────────────────────────────────────────

describe('evaluateFixScope', () => {
  it('modifiesArchitecture=true → not allowed', () => {
    const result = evaluateFixScope({
      changedModules: ['moduleA'],
      approvedModules: ['moduleA'],
      modifiesArchitecture: true,
      modifiesSchema: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain('Architecture modification is not allowed in autonomous fix.');
  });

  it('modifiesSchema=true → not allowed', () => {
    const result = evaluateFixScope({
      changedModules: [],
      approvedModules: [],
      modifiesArchitecture: false,
      modifiesSchema: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons!.some((r) => r.includes('Schema'))).toBe(true);
  });

  it('out-of-scope module → not allowed with reason', () => {
    const result = evaluateFixScope({
      changedModules: ['moduleA', 'moduleB'],
      approvedModules: ['moduleA'],
      modifiesArchitecture: false,
      modifiesSchema: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons!.some((r) => r.includes('moduleB'))).toBe(true);
  });

  it('all in scope, no arch/schema → allowed', () => {
    const result = evaluateFixScope({
      changedModules: ['moduleA'],
      approvedModules: ['moduleA', 'moduleB'],
      modifiesArchitecture: false,
      modifiesSchema: false,
    });
    expect(result.allowed).toBe(true);
    expect(result.reasons).toBeUndefined();
  });

  it('multiple violations → multiple reasons', () => {
    const result = evaluateFixScope({
      changedModules: ['moduleX'],
      approvedModules: [],
      modifiesArchitecture: true,
      modifiesSchema: true,
    });
    expect(result.reasons!.length).toBeGreaterThanOrEqual(3);
  });
});

// ─── evaluateEscalation ───────────────────────────────────────────────────────

describe('evaluateEscalation', () => {
  it('autonomy ok + scope ok → escalate=false', () => {
    const result = evaluateEscalation(
      { allowAutoFix: true, requireEscalation: false },
      { allowed: true }
    );
    expect(result.escalate).toBe(false);
    expect(result.reasons).toBeUndefined();
  });

  it('autonomy.requireEscalation=true → escalate=true with reason', () => {
    const result = evaluateEscalation(
      { allowAutoFix: false, requireEscalation: true, reason: 'High risk' },
      { allowed: true }
    );
    expect(result.escalate).toBe(true);
    expect(result.reasons).toContain('High risk');
  });

  it('scope.allowed=false → escalate=true with reasons', () => {
    const result = evaluateEscalation(
      { allowAutoFix: true, requireEscalation: false },
      { allowed: false, reasons: ['Out of scope'] }
    );
    expect(result.escalate).toBe(true);
    expect(result.reasons).toContain('Out of scope');
  });

  it('both fail → combined reasons', () => {
    const result = evaluateEscalation(
      { allowAutoFix: false, requireEscalation: true, reason: 'R3 risk' },
      { allowed: false, reasons: ['Architecture violation'] }
    );
    expect(result.escalate).toBe(true);
    expect(result.reasons!.length).toBe(2);
  });
});

// ─── calculateEleganceScore ───────────────────────────────────────────────────

describe('calculateEleganceScore', () => {
  it('no change → score=100, all growth=0', () => {
    const result = calculateEleganceScore({
      previousComplexity: 10, currentComplexity: 10,
      previousLOC: 100, currentLOC: 100,
      previousDependencies: 5, currentDependencies: 5,
    });
    expect(result.score).toBe(100);
    expect(result.complexityGrowth).toBe(0);
    expect(result.locGrowth).toBe(0);
    expect(result.dependencyIncrease).toBe(0);
  });

  it('complexity growth reduces score by growth * 0.5', () => {
    // previous=10, current=20 → growth=100% → score -= 50 → score=50
    const result = calculateEleganceScore({
      previousComplexity: 10, currentComplexity: 20,
      previousLOC: 100, currentLOC: 100,
      previousDependencies: 5, currentDependencies: 5,
    });
    expect(result.score).toBe(50);
    expect(result.complexityGrowth).toBe(100);
  });

  it('LOC growth reduces score by growth * 0.2', () => {
    // previous=100, current=200 → growth=100% → score -= 20 → score=80
    const result = calculateEleganceScore({
      previousComplexity: 10, currentComplexity: 10,
      previousLOC: 100, currentLOC: 200,
      previousDependencies: 5, currentDependencies: 5,
    });
    expect(result.score).toBe(80);
    expect(result.locGrowth).toBe(100);
  });

  it('dependency increase reduces score by depIncrease * 5', () => {
    // +3 dependencies → score -= 15 → score=85
    const result = calculateEleganceScore({
      previousComplexity: 10, currentComplexity: 10,
      previousLOC: 100, currentLOC: 100,
      previousDependencies: 5, currentDependencies: 8,
    });
    expect(result.score).toBe(85);
    expect(result.dependencyIncrease).toBe(3);
  });

  it('score clamped to 0 (never negative)', () => {
    // massive growth → would be negative
    const result = calculateEleganceScore({
      previousComplexity: 1, currentComplexity: 1000,
      previousLOC: 10, currentLOC: 10000,
      previousDependencies: 0, currentDependencies: 100,
    });
    expect(result.score).toBe(0);
  });
});
