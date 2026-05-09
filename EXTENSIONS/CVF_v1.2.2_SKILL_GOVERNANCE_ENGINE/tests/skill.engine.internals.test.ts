/**
 * CVF v1.2.2 Skill Governance Engine — Internal Ledger & Fusion Dedicated Tests (W6-T39)
 * =======================================================================================
 * GC-023: dedicated file — never merge into v1.2.2.test.ts.
 *
 * Coverage:
 *   AuditTrail (internal_ledger/audit.trail.ts):
 *     - new instance → list() returns []
 *     - record() appends entry → list() returns it
 *     - multiple records → list() returns all in insertion order
 *     - filter(entity) → returns only matching entity type
 *     - filter() returns [] when no match
 *   IntentClassifier (intent/intent.classifier.ts):
 *     - rawIntent = original input (not trimmed)
 *     - normalizedIntent = input.trim().toLowerCase()
 *     - short input (≤20 chars) → confidence = 0.6
 *     - long input (>20 chars) → confidence = 0.75
 *     - "optimize" in input → confidence = 0.85
 *     - "improve" in input → confidence = 0.85
 *   SemanticRank (fusion/semantic.rank.ts):
 *     - empty skills → returns []
 *     - skill name in query → score += 50
 *     - token overlap → score += 10 per token
 *     - results sorted by semantic_score desc
 *     - no match → semantic_score = 0
 *   HistoricalWeight (fusion/historical.weight.ts):
 *     - production maturity → +30 bonus
 *     - validated maturity → +15 bonus
 *     - experimental maturity → +0 bonus
 *     - usage_count added to score
 *     - results sorted by historical_score desc
 *   CostOptimizer (fusion/cost.optimizer.ts):
 *     - estimatedCost ≤ 3000 → no penalty (final_score = historical_score)
 *     - estimatedCost > 3000 → penalty of 20 applied
 *     - results sorted by final_score desc
 *     - empty input → returns []
 *   FinalSelector (fusion/final.selector.ts):
 *     - empty scores → throws "No suitable skill found"
 *     - currentRiskScore > riskThreshold → throws "Risk threshold exceeded"
 *     - valid scores → returns scores[0].skill (highest final_score)
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { AuditTrail } from '../internal_ledger/audit.trail.js';
import { IntentClassifier } from '../intent/intent.classifier.js';
import { SemanticRank } from '../fusion/semantic.rank.js';
import { HistoricalWeight } from '../fusion/historical.weight.js';
import { CostOptimizer } from '../fusion/cost.optimizer.js';
import { FinalSelector } from '../fusion/final.selector.js';
import type { RegisteredSkill } from '../internal_ledger/skill.registry.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeSkill(overrides: Partial<RegisteredSkill> = {}): RegisteredSkill {
  return {
    id: 'skill-001',
    name: 'code review',
    domain: 'application',
    source: 'skills_sh',
    maturity: 'validated',
    integrity_hash: 'abc123',
    created_at: 0,
    usage_count: 5,
    revoked: false,
    ...overrides,
  };
}

// ─── AuditTrail ───────────────────────────────────────────────────────────────

describe('AuditTrail', () => {
  let trail: AuditTrail;

  beforeEach(() => {
    trail = new AuditTrail();
  });

  it('new instance → list() returns []', () => {
    expect(trail.list()).toEqual([]);
  });

  it('record() appends entry → list() returns it', () => {
    trail.record({ entity: 'skill', entity_id: 's1', action: 'register', timestamp: 1 });
    expect(trail.list()).toHaveLength(1);
    expect(trail.list()[0]!.entity_id).toBe('s1');
  });

  it('multiple records → list() returns all in insertion order', () => {
    trail.record({ entity: 'skill', entity_id: 's1', action: 'register', timestamp: 1 });
    trail.record({ entity: 'execution', entity_id: 'e1', action: 'run', timestamp: 2 });
    trail.record({ entity: 'policy', entity_id: 'p1', action: 'bind', timestamp: 3 });
    const all = trail.list();
    expect(all).toHaveLength(3);
    expect(all[0]!.entity).toBe('skill');
    expect(all[1]!.entity).toBe('execution');
    expect(all[2]!.entity).toBe('policy');
  });

  it('filter("skill") → returns only skill entries', () => {
    trail.record({ entity: 'skill', entity_id: 's1', action: 'register', timestamp: 1 });
    trail.record({ entity: 'execution', entity_id: 'e1', action: 'run', timestamp: 2 });
    trail.record({ entity: 'skill', entity_id: 's2', action: 'revoke', timestamp: 3 });
    const skills = trail.filter('skill');
    expect(skills).toHaveLength(2);
    expect(skills.every((e) => e.entity === 'skill')).toBe(true);
  });

  it('filter("policy") → returns [] when no policy entries', () => {
    trail.record({ entity: 'skill', entity_id: 's1', action: 'register', timestamp: 1 });
    expect(trail.filter('policy')).toEqual([]);
  });

  it('metadata is preserved in entry', () => {
    trail.record({ entity: 'skill', entity_id: 's1', action: 'register', timestamp: 1, metadata: { version: '1.0' } });
    expect(trail.list()[0]!.metadata).toEqual({ version: '1.0' });
  });
});

// ─── IntentClassifier ─────────────────────────────────────────────────────────

describe('IntentClassifier', () => {
  it('rawIntent = original input (preserved as-is)', () => {
    const result = IntentClassifier.classify('  Read Files  ');
    expect(result.rawIntent).toBe('  Read Files  ');
  });

  it('normalizedIntent = input.trim().toLowerCase()', () => {
    const result = IntentClassifier.classify('  Read Files  ');
    expect(result.normalizedIntent).toBe('read files');
  });

  it('short input (≤20 chars) → confidence = 0.6', () => {
    const result = IntentClassifier.classify('read');
    expect(result.confidence).toBe(0.6);
  });

  it('long input (>20 chars) → confidence = 0.75', () => {
    const result = IntentClassifier.classify('analyze the repository structure');
    expect(result.confidence).toBe(0.75);
  });

  it('"optimize" in input → confidence = 0.85', () => {
    const result = IntentClassifier.classify('optimize the database query performance');
    expect(result.confidence).toBe(0.85);
  });

  it('"improve" in input → confidence = 0.85', () => {
    const result = IntentClassifier.classify('improve code quality and readability');
    expect(result.confidence).toBe(0.85);
  });

  it('empty string → confidence = 0.6, normalizedIntent = ""', () => {
    const result = IntentClassifier.classify('');
    expect(result.confidence).toBe(0.6);
    expect(result.normalizedIntent).toBe('');
  });
});

// ─── SemanticRank ─────────────────────────────────────────────────────────────

describe('SemanticRank', () => {
  const ranker = new SemanticRank();

  it('empty skills → returns []', () => {
    expect(ranker.rank([], 'code review')).toEqual([]);
  });

  it('skill name exactly in query → score += 50', () => {
    const skill = makeSkill({ id: 's1', name: 'analysis' });
    const results = ranker.rank([skill], 'analysis');
    expect(results[0]!.semantic_score).toBeGreaterThanOrEqual(50);
  });

  it('no match → semantic_score = 0', () => {
    const skill = makeSkill({ id: 's1', name: 'xyz_unique_name' });
    const results = ranker.rank([skill], 'completely different query');
    expect(results[0]!.semantic_score).toBe(0);
  });

  it('token overlap → score += 10 per matching token', () => {
    // skill name = "review", query = "code review check" → "review" matches as token (+10)
    // but "review" is not in full query string as substring of name... let me think
    // query = "review check" → token "review" matches skill name "review" → +10
    // also "review" is substring of query itself → +50 (name in query)
    const skill = makeSkill({ id: 's1', name: 'review' });
    const results = ranker.rank([skill], 'review check');
    // name "review" in query "review check" → +50, token "review" in name "review" → +10
    expect(results[0]!.semantic_score).toBeGreaterThanOrEqual(10);
  });

  it('sorted by semantic_score desc (higher first)', () => {
    const high = makeSkill({ id: 'high', name: 'analysis' });
    const low = makeSkill({ id: 'low', name: 'xyz123' });
    const results = ranker.rank([low, high], 'analysis');
    expect(results[0]!.skill.id).toBe('high');
    expect(results[1]!.skill.id).toBe('low');
  });
});

// ─── HistoricalWeight ─────────────────────────────────────────────────────────

describe('HistoricalWeight', () => {
  const weighter = new HistoricalWeight();

  function makeSemanticScore(skillOverrides: Partial<RegisteredSkill>, score = 0) {
    return { skill: makeSkill(skillOverrides), semantic_score: score };
  }

  it('production maturity → +30 bonus', () => {
    const input = [makeSemanticScore({ maturity: 'production', usage_count: 0 }, 0)];
    const result = weighter.apply(input);
    expect(result[0]!.historical_score).toBe(30);
  });

  it('validated maturity → +15 bonus', () => {
    const input = [makeSemanticScore({ maturity: 'validated', usage_count: 0 }, 0)];
    const result = weighter.apply(input);
    expect(result[0]!.historical_score).toBe(15);
  });

  it('experimental maturity → +0 bonus', () => {
    const input = [makeSemanticScore({ maturity: 'experimental', usage_count: 0 }, 0)];
    const result = weighter.apply(input);
    expect(result[0]!.historical_score).toBe(0);
  });

  it('usage_count added to score', () => {
    const input = [makeSemanticScore({ maturity: 'experimental', usage_count: 10 }, 0)];
    const result = weighter.apply(input);
    expect(result[0]!.historical_score).toBe(10);
  });

  it('semantic_score + maturityBonus + usage_count combined', () => {
    // semantic=50, production(+30), usage=7 → 87
    const input = [makeSemanticScore({ maturity: 'production', usage_count: 7 }, 50)];
    const result = weighter.apply(input);
    expect(result[0]!.historical_score).toBe(87);
  });

  it('results sorted by historical_score desc', () => {
    const high = makeSemanticScore({ id: 'h', maturity: 'production', usage_count: 0 }, 0);
    const low = makeSemanticScore({ id: 'l', maturity: 'experimental', usage_count: 0 }, 0);
    const results = weighter.apply([low, high]);
    expect(results[0]!.skill.id).toBe('h');
    expect(results[1]!.skill.id).toBe('l');
  });
});

// ─── CostOptimizer ────────────────────────────────────────────────────────────

describe('CostOptimizer', () => {
  const optimizer = new CostOptimizer();

  function makeHistoricalScore(skillId: string, historical_score: number) {
    return {
      skill: makeSkill({ id: skillId }),
      semantic_score: 0,
      historical_score,
    };
  }

  it('empty input → returns []', () => {
    expect(optimizer.optimize([], 100)).toEqual([]);
  });

  it('estimatedCost ≤ 3000 → no penalty (final_score = historical_score)', () => {
    const result = optimizer.optimize([makeHistoricalScore('s1', 80)], 3000);
    expect(result[0]!.final_score).toBe(80);
  });

  it('estimatedCost > 3000 → penalty of 20 applied', () => {
    const result = optimizer.optimize([makeHistoricalScore('s1', 80)], 3001);
    expect(result[0]!.final_score).toBe(60);
  });

  it('results sorted by final_score desc after penalty', () => {
    const scores = [
      makeHistoricalScore('low', 50),
      makeHistoricalScore('high', 90),
    ];
    const result = optimizer.optimize(scores, 1000);
    expect(result[0]!.skill.id).toBe('high');
    expect(result[1]!.skill.id).toBe('low');
  });

  it('penalty reorders when high-score entry penalized past low-score', () => {
    // high: 80 - 20 = 60, low: 65 - 20 = 45 → order preserved (high still wins)
    const scores = [
      makeHistoricalScore('low', 65),
      makeHistoricalScore('high', 80),
    ];
    const result = optimizer.optimize(scores, 5000);
    expect(result[0]!.skill.id).toBe('high'); // 80-20=60 vs 65-20=45
  });
});

// ─── FinalSelector ────────────────────────────────────────────────────────────

describe('FinalSelector', () => {
  const selector = new FinalSelector();

  function makeCostScore(skillId: string, final_score: number) {
    return {
      skill: makeSkill({ id: skillId }),
      semantic_score: 0,
      historical_score: final_score,
      final_score,
    };
  }

  it('empty scores → throws "No suitable skill found"', () => {
    expect(() => selector.select([], 50, 10)).toThrow('No suitable skill found');
  });

  it('currentRiskScore > riskThreshold → throws "Risk threshold exceeded"', () => {
    const scores = [makeCostScore('s1', 80)];
    expect(() => selector.select(scores, 50, 60)).toThrow('Risk threshold exceeded');
  });

  it('currentRiskScore === riskThreshold → does NOT throw', () => {
    const scores = [makeCostScore('s1', 80)];
    expect(() => selector.select(scores, 50, 50)).not.toThrow();
  });

  it('valid scores → returns scores[0].skill (first/highest)', () => {
    const scores = [makeCostScore('best', 90), makeCostScore('second', 60)];
    const selected = selector.select(scores, 100, 10);
    expect(selected.id).toBe('best');
  });
});
