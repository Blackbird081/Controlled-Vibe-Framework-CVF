/**
 * CVF v1.2.2 Skill Governance Engine — Spec & Runtime Dedicated Tests (W6-T40)
 * =============================================================================
 * GC-023: dedicated file — never merge into v1.2.2.test.ts or skill.engine.internals.test.ts.
 *
 * Coverage:
 *   SkillRegistry (skill_system/spec/skill.registry.ts):
 *     - register + get → returns same skill
 *     - get unknown id → undefined
 *     - exists → true for registered, false for unknown
 *     - list → includes all registered skills
 *   SkillValidator (skill_system/spec/skill.validator.ts):
 *     - valid skill (id, name, execute function, riskLevel≤70) → validate() true
 *     - missing id → verifyStructure() false → validate() false
 *     - missing name → verifyStructure() false
 *     - execute not a function → verifyStructure() false
 *     - riskLevel > 70 → verifyRisk() false → validate() false
 *     - riskLevel = 70 → verifyRisk() true
 *     - riskLevel = 0 → verifyRisk() true
 *   SkillDiscovery (skill_system/spec/skill.discovery.ts):
 *     - findByDomain: returns only skills with matching domain
 *     - findByDomain: unknown domain → []
 *     - findLowestRisk: returns skill with lowest riskLevel in domain
 *     - findLowestRisk: empty domain → null
 *   CreativeController (runtime/creative.controller.ts):
 *     - default mode = "balanced"
 *     - setMode + getMode round-trip
 *     - adjustRisk in strict mode → baseRisk * 0.8
 *     - adjustRisk in balanced mode → baseRisk unchanged
 *     - adjustRisk in exploratory mode → baseRisk * 1.2
 */

import { describe, it, expect } from 'vitest';

import { SkillRegistry } from '../skill_system/spec/skill.registry.js';
import { SkillValidator } from '../skill_system/spec/skill.validator.js';
import { SkillDiscovery } from '../skill_system/spec/skill.discovery.js';
import { CreativeController } from '../runtime/creative.controller.js';
import type { Skill, SkillMetadata, SkillContext } from '../skill_system/spec/skill.interface.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

let _uniqueCounter = 0;

function makeSkillId(): string {
  return `spec-test-skill-${++_uniqueCounter}-${Date.now()}`;
}

function makeSkill(overrides: Partial<SkillMetadata> & { riskLevel?: number } = {}): Skill {
  const id = overrides.id ?? makeSkillId();
  return {
    metadata: {
      id,
      name: overrides.name ?? 'Test Skill',
      version: '1.0.0',
      domain: overrides.domain ?? 'test_domain',
      type: overrides.type ?? 'STATIC',
      riskLevel: overrides.riskLevel ?? 30,
    },
    execute: async (_ctx: SkillContext) => ({ success: true }),
  };
}

// ─── SkillRegistry ────────────────────────────────────────────────────────────

describe('SkillRegistry (spec)', () => {
  it('register + get → returns registered skill', () => {
    const skill = makeSkill();
    SkillRegistry.register(skill);
    const fetched = SkillRegistry.get(skill.metadata.id);
    expect(fetched).toBeDefined();
    expect(fetched!.metadata.id).toBe(skill.metadata.id);
  });

  it('get unknown id → undefined', () => {
    expect(SkillRegistry.get('non-existent-xyz-999')).toBeUndefined();
  });

  it('exists → true for registered skill', () => {
    const skill = makeSkill();
    SkillRegistry.register(skill);
    expect(SkillRegistry.exists(skill.metadata.id)).toBe(true);
  });

  it('exists → false for unknown id', () => {
    expect(SkillRegistry.exists('never-registered-abc-888')).toBe(false);
  });

  it('list → includes all registered skills', () => {
    const s1 = makeSkill();
    const s2 = makeSkill();
    SkillRegistry.register(s1);
    SkillRegistry.register(s2);
    const all = SkillRegistry.list();
    const ids = all.map((s) => s.metadata.id);
    expect(ids).toContain(s1.metadata.id);
    expect(ids).toContain(s2.metadata.id);
  });
});

// ─── SkillValidator ───────────────────────────────────────────────────────────

describe('SkillValidator (spec)', () => {
  it('valid skill → validate() returns true', () => {
    expect(SkillValidator.validate(makeSkill({ riskLevel: 50 }))).toBe(true);
  });

  it('missing id → verifyStructure() false', () => {
    const skill = makeSkill();
    (skill.metadata as any).id = '';
    expect(SkillValidator.verifyStructure(skill)).toBe(false);
  });

  it('missing name → verifyStructure() false', () => {
    const skill = makeSkill();
    (skill.metadata as any).name = '';
    expect(SkillValidator.verifyStructure(skill)).toBe(false);
  });

  it('execute not a function → verifyStructure() false', () => {
    const skill = makeSkill();
    (skill as any).execute = 'not_a_function';
    expect(SkillValidator.verifyStructure(skill)).toBe(false);
  });

  it('riskLevel = 70 → verifyRisk() true (at boundary)', () => {
    expect(SkillValidator.verifyRisk(makeSkill({ riskLevel: 70 }))).toBe(true);
  });

  it('riskLevel = 0 → verifyRisk() true', () => {
    expect(SkillValidator.verifyRisk(makeSkill({ riskLevel: 0 }))).toBe(true);
  });

  it('riskLevel = 71 → verifyRisk() false', () => {
    expect(SkillValidator.verifyRisk(makeSkill({ riskLevel: 71 }))).toBe(false);
  });

  it('riskLevel > 70 → validate() false', () => {
    expect(SkillValidator.validate(makeSkill({ riskLevel: 100 }))).toBe(false);
  });
});

// ─── SkillDiscovery ───────────────────────────────────────────────────────────

describe('SkillDiscovery (spec)', () => {
  it('findByDomain: returns only skills with matching domain', () => {
    const domain = `discovery-domain-${Date.now()}`;
    const s1 = makeSkill({ domain });
    const s2 = makeSkill({ domain });
    const other = makeSkill({ domain: 'other-domain-xyz' });
    SkillRegistry.register(s1);
    SkillRegistry.register(s2);
    SkillRegistry.register(other);
    const results = SkillDiscovery.findByDomain(domain);
    const ids = results.map((s) => s.metadata.id);
    expect(ids).toContain(s1.metadata.id);
    expect(ids).toContain(s2.metadata.id);
    expect(ids).not.toContain(other.metadata.id);
  });

  it('findByDomain: unknown domain → []', () => {
    expect(SkillDiscovery.findByDomain('definitely-nonexistent-domain-zzz')).toEqual([]);
  });

  it('findLowestRisk: returns skill with lowest riskLevel in domain', () => {
    const domain = `risk-domain-${Date.now()}`;
    const low = makeSkill({ domain, riskLevel: 10 });
    const high = makeSkill({ domain, riskLevel: 60 });
    SkillRegistry.register(low);
    SkillRegistry.register(high);
    const result = SkillDiscovery.findLowestRisk(domain);
    expect(result).not.toBeNull();
    expect(result!.metadata.id).toBe(low.metadata.id);
  });

  it('findLowestRisk: empty domain → null', () => {
    expect(SkillDiscovery.findLowestRisk('totally-empty-domain-000')).toBeNull();
  });
});

// ─── CreativeController ───────────────────────────────────────────────────────

describe('CreativeController', () => {
  it('default mode = "balanced"', () => {
    const ctrl = new CreativeController();
    expect(ctrl.getMode()).toBe('balanced');
  });

  it('setMode + getMode round-trip for "strict"', () => {
    const ctrl = new CreativeController();
    ctrl.setMode('strict');
    expect(ctrl.getMode()).toBe('strict');
  });

  it('setMode + getMode round-trip for "exploratory"', () => {
    const ctrl = new CreativeController();
    ctrl.setMode('exploratory');
    expect(ctrl.getMode()).toBe('exploratory');
  });

  it('adjustRisk in strict mode → baseRisk * 0.8', () => {
    const ctrl = new CreativeController();
    ctrl.setMode('strict');
    expect(ctrl.adjustRisk(100)).toBeCloseTo(80);
  });

  it('adjustRisk in balanced mode → baseRisk unchanged', () => {
    const ctrl = new CreativeController();
    ctrl.setMode('balanced');
    expect(ctrl.adjustRisk(50)).toBe(50);
  });

  it('adjustRisk in exploratory mode → baseRisk * 1.2', () => {
    const ctrl = new CreativeController();
    ctrl.setMode('exploratory');
    expect(ctrl.adjustRisk(50)).toBeCloseTo(60);
  });

  it('adjustRisk with zero base → always 0', () => {
    const ctrl = new CreativeController();
    ctrl.setMode('strict');
    expect(ctrl.adjustRisk(0)).toBe(0);
  });
});
