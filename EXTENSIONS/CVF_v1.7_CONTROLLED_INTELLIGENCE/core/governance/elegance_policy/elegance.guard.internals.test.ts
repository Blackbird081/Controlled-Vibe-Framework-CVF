/**
 * CVF v1.7 Controlled Intelligence — Elegance Guard + Risk Core Dedicated Tests (W6-T50)
 * =========================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage:
 *   DefaultRefactorThresholds (refactor.thresholds.ts):
 *     - maxComplexityGrowthPercent=15
 *     - maxLocGrowthPercent=25
 *     - maxDependencyIncrease=2
 *     - riskLevelAllowed includes R0, R1, R2
 *     - riskLevelAllowed does not include R3
 *   evaluateEleganceGuard (elegance.guard.ts):
 *     - risk not in allowed list → blockedByRisk=true, requireRefactor=false
 *     - complexity growth > threshold → requireRefactor=true
 *     - LOC growth > threshold → requireRefactor=true
 *     - dependency increase > threshold → requireRefactor=true
 *     - all within thresholds → requireRefactor=false, reasons=undefined
 *     - multiple violations → multiple reasons
 *     - blocked by risk → reasons list has explanation
 *   mapScoreToCategory (severity.matrix.ts):
 *     - score >= 0.85 → CRITICAL
 *     - score >= 0.7 < 0.85 → HIGH
 *     - score >= 0.4 < 0.7 → MEDIUM
 *     - score < 0.4 → LOW
 *     - boundary values: 0.85=CRITICAL, 0.7=HIGH, 0.4=MEDIUM, 0.39=LOW
 *   calculateRisk (risk.scorer.ts):
 *     - returns RiskAssessment with score and category
 *     - default complexityFactor=1 → score=baseScore
 *     - score capped at 1 (baseScore * factor > 1)
 *     - category derived from mapScoreToCategory
 */

import { describe, it, expect } from 'vitest';

import { evaluateEleganceGuard } from './elegance.guard.js';
import { DefaultRefactorThresholds } from './refactor.thresholds.js';
import { mapScoreToCategory } from '../../risk/severity.matrix.js';
import { calculateRisk } from '../../risk/risk.scorer.js';
import type { EleganceScoreResult } from './elegance.scorer.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function okScore(): EleganceScoreResult {
  return { score: 90, complexityGrowth: 0, locGrowth: 0, dependencyIncrease: 0 };
}

// ─── DefaultRefactorThresholds ────────────────────────────────────────────────

describe('DefaultRefactorThresholds', () => {
  it('maxComplexityGrowthPercent=15', () => {
    expect(DefaultRefactorThresholds.maxComplexityGrowthPercent).toBe(15);
  });

  it('maxLocGrowthPercent=25', () => {
    expect(DefaultRefactorThresholds.maxLocGrowthPercent).toBe(25);
  });

  it('maxDependencyIncrease=2', () => {
    expect(DefaultRefactorThresholds.maxDependencyIncrease).toBe(2);
  });

  it('riskLevelAllowed includes R0, R1, R2', () => {
    expect(DefaultRefactorThresholds.riskLevelAllowed).toContain('R0');
    expect(DefaultRefactorThresholds.riskLevelAllowed).toContain('R1');
    expect(DefaultRefactorThresholds.riskLevelAllowed).toContain('R2');
  });

  it('riskLevelAllowed does not include R3', () => {
    expect(DefaultRefactorThresholds.riskLevelAllowed).not.toContain('R3');
  });
});

// ─── evaluateEleganceGuard ────────────────────────────────────────────────────

describe('evaluateEleganceGuard', () => {
  it('all within thresholds → requireRefactor=false, blockedByRisk=false', () => {
    const result = evaluateEleganceGuard(okScore(), 'R1');
    expect(result.requireRefactor).toBe(false);
    expect(result.blockedByRisk).toBe(false);
    expect(result.reasons).toBeUndefined();
  });

  it('risk level not in allowed → blockedByRisk=true, requireRefactor=false', () => {
    const result = evaluateEleganceGuard(okScore(), 'R3');
    expect(result.blockedByRisk).toBe(true);
    expect(result.requireRefactor).toBe(false);
  });

  it('blocked by risk → reasons provided', () => {
    const result = evaluateEleganceGuard(okScore(), 'R3');
    expect(result.reasons).toBeDefined();
    expect(result.reasons!.length).toBeGreaterThan(0);
  });

  it('complexity growth > threshold → requireRefactor=true', () => {
    const score: EleganceScoreResult = { ...okScore(), complexityGrowth: 20 };
    const result = evaluateEleganceGuard(score, 'R1');
    expect(result.requireRefactor).toBe(true);
    expect(result.reasons!.some((r) => r.includes('Complexity'))).toBe(true);
  });

  it('LOC growth > threshold → requireRefactor=true', () => {
    const score: EleganceScoreResult = { ...okScore(), locGrowth: 30 };
    const result = evaluateEleganceGuard(score, 'R1');
    expect(result.requireRefactor).toBe(true);
    expect(result.reasons!.some((r) => r.includes('LOC'))).toBe(true);
  });

  it('dependency increase > threshold → requireRefactor=true', () => {
    const score: EleganceScoreResult = { ...okScore(), dependencyIncrease: 3 };
    const result = evaluateEleganceGuard(score, 'R1');
    expect(result.requireRefactor).toBe(true);
    expect(result.reasons!.some((r) => r.includes('Dependency'))).toBe(true);
  });

  it('multiple violations → multiple reasons', () => {
    const score: EleganceScoreResult = {
      score: 0,
      complexityGrowth: 20,
      locGrowth: 30,
      dependencyIncrease: 3,
    };
    const result = evaluateEleganceGuard(score, 'R1');
    expect(result.reasons!.length).toBeGreaterThanOrEqual(3);
  });

  it('complexity exactly at threshold → no reason', () => {
    const score: EleganceScoreResult = { ...okScore(), complexityGrowth: 15 };
    const result = evaluateEleganceGuard(score, 'R1');
    expect(result.requireRefactor).toBe(false);
  });
});

// ─── mapScoreToCategory ───────────────────────────────────────────────────────

describe('mapScoreToCategory', () => {
  it('score >= 0.85 → CRITICAL', () => {
    expect(mapScoreToCategory(0.9)).toBe('CRITICAL');
    expect(mapScoreToCategory(1.0)).toBe('CRITICAL');
  });

  it('score = 0.85 → CRITICAL (boundary)', () => {
    expect(mapScoreToCategory(0.85)).toBe('CRITICAL');
  });

  it('score >= 0.7 < 0.85 → HIGH', () => {
    expect(mapScoreToCategory(0.75)).toBe('HIGH');
  });

  it('score = 0.7 → HIGH (boundary)', () => {
    expect(mapScoreToCategory(0.7)).toBe('HIGH');
  });

  it('score >= 0.4 < 0.7 → MEDIUM', () => {
    expect(mapScoreToCategory(0.5)).toBe('MEDIUM');
  });

  it('score = 0.4 → MEDIUM (boundary)', () => {
    expect(mapScoreToCategory(0.4)).toBe('MEDIUM');
  });

  it('score < 0.4 → LOW', () => {
    expect(mapScoreToCategory(0.2)).toBe('LOW');
    expect(mapScoreToCategory(0.0)).toBe('LOW');
  });
});

// ─── calculateRisk ────────────────────────────────────────────────────────────

describe('calculateRisk', () => {
  it('returns RiskAssessment with score and category', () => {
    const result = calculateRisk(0.5);
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('category');
  });

  it('default complexityFactor=1 → score=baseScore', () => {
    expect(calculateRisk(0.5).score).toBe(0.5);
  });

  it('score capped at 1 when product exceeds 1', () => {
    expect(calculateRisk(0.8, 2).score).toBe(1);
  });

  it('complexityFactor scales score', () => {
    expect(calculateRisk(0.4, 1.5).score).toBeCloseTo(0.6);
  });

  it('score=0.9 → category=CRITICAL', () => {
    expect(calculateRisk(0.9).category).toBe('CRITICAL');
  });

  it('score=0.75 → category=HIGH', () => {
    expect(calculateRisk(0.75).category).toBe('HIGH');
  });

  it('score=0.5 → category=MEDIUM', () => {
    expect(calculateRisk(0.5).category).toBe('MEDIUM');
  });

  it('score=0.1 → category=LOW', () => {
    expect(calculateRisk(0.1).category).toBe('LOW');
  });
});
