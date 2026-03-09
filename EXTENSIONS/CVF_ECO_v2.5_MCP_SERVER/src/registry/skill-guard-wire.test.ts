/**
 * Tests for Skill-Guard Wire
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SkillGuardWire, createDefaultSkillGuardWire } from './skill-guard-wire.js';

describe('SkillGuardWire', () => {
  let wire: SkillGuardWire;

  beforeEach(() => {
    wire = new SkillGuardWire();
  });

  describe('registration', () => {
    it('registers a skill', () => {
      wire.registerSkill({
        skillId: 'test_skill',
        skillName: 'Test Skill',
        domain: 'test',
        requiredPhase: 'BUILD',
        minimumRiskLevel: 'R1',
        requiredGuards: ['phase_gate'],
        recommendedRole: 'AI_AGENT',
        tags: ['test'],
      });
      expect(wire.count()).toBe(1);
    });

    it('throws on duplicate skill', () => {
      const mapping = {
        skillId: 'dup',
        skillName: 'Dup',
        domain: 'test',
        requiredPhase: 'BUILD' as const,
        minimumRiskLevel: 'R0' as const,
        requiredGuards: [],
        recommendedRole: 'HUMAN' as const,
        tags: [],
      };
      wire.registerSkill(mapping);
      expect(() => wire.registerSkill(mapping)).toThrow('already registered');
    });

    it('unregisters a skill', () => {
      wire.registerSkill({
        skillId: 'rm',
        skillName: 'Remove',
        domain: 'test',
        requiredPhase: 'BUILD',
        minimumRiskLevel: 'R0',
        requiredGuards: [],
        recommendedRole: 'HUMAN',
        tags: [],
      });
      expect(wire.unregisterSkill('rm')).toBe(true);
      expect(wire.count()).toBe(0);
    });

    it('returns false for non-existent unregister', () => {
      expect(wire.unregisterSkill('nope')).toBe(false);
    });
  });

  describe('retrieval', () => {
    beforeEach(() => {
      wire.registerSkill({
        skillId: 's1', skillName: 'S1', domain: 'app', requiredPhase: 'BUILD',
        minimumRiskLevel: 'R1', requiredGuards: ['phase_gate'], recommendedRole: 'AI_AGENT', tags: ['build', 'coding'],
      });
      wire.registerSkill({
        skillId: 's2', skillName: 'S2', domain: 'app', requiredPhase: 'DESIGN',
        minimumRiskLevel: 'R0', requiredGuards: ['phase_gate', 'risk_gate'], recommendedRole: 'HUMAN', tags: ['design'],
      });
      wire.registerSkill({
        skillId: 's3', skillName: 'S3', domain: 'ai', requiredPhase: 'BUILD',
        minimumRiskLevel: 'R2', requiredGuards: ['phase_gate', 'risk_gate', 'audit_trail'], recommendedRole: 'AI_AGENT', tags: ['ai', 'build'],
      });
    });

    it('gets by ID', () => {
      expect(wire.getSkill('s1')).toBeDefined();
      expect(wire.getSkill('s1')!.skillName).toBe('S1');
    });

    it('returns undefined for non-existent', () => {
      expect(wire.getSkill('nope')).toBeUndefined();
    });

    it('gets all', () => {
      expect(wire.getAllSkills()).toHaveLength(3);
    });

    it('filters by domain', () => {
      expect(wire.getSkillsByDomain('app')).toHaveLength(2);
      expect(wire.getSkillsByDomain('ai')).toHaveLength(1);
    });

    it('domain filter is case-insensitive', () => {
      expect(wire.getSkillsByDomain('APP')).toHaveLength(2);
    });

    it('filters by phase', () => {
      expect(wire.getSkillsByPhase('BUILD')).toHaveLength(2);
      expect(wire.getSkillsByPhase('DESIGN')).toHaveLength(1);
    });

    it('filters by tag', () => {
      expect(wire.getSkillsByTag('build')).toHaveLength(2);
      expect(wire.getSkillsByTag('design')).toHaveLength(1);
    });

    it('gets required guards for skill', () => {
      expect(wire.getRequiredGuardsForSkill('s3')).toEqual(['phase_gate', 'risk_gate', 'audit_trail']);
    });

    it('returns empty array for non-existent skill guards', () => {
      expect(wire.getRequiredGuardsForSkill('nope')).toEqual([]);
    });
  });

  describe('checkSkill', () => {
    beforeEach(() => {
      wire.registerSkill({
        skillId: 'build_code', skillName: 'Build Code', domain: 'app', requiredPhase: 'BUILD',
        minimumRiskLevel: 'R2', requiredGuards: ['phase_gate', 'risk_gate', 'audit_trail'],
        recommendedRole: 'AI_AGENT', tags: ['build'],
      });
    });

    it('allows when all conditions met', () => {
      const result = wire.checkSkill(
        'build_code', 'BUILD', 'R1', 'AI_AGENT',
        ['phase_gate', 'risk_gate', 'audit_trail'],
      );
      expect(result.allowed).toBe(true);
      expect(result.phaseMatch).toBe(true);
      expect(result.riskLevelSafe).toBe(true);
      expect(result.roleAuthorized).toBe(true);
      expect(result.missingGuards).toHaveLength(0);
    });

    it('blocks on wrong phase', () => {
      const result = wire.checkSkill(
        'build_code', 'DISCOVERY', 'R0', 'AI_AGENT',
        ['phase_gate', 'risk_gate', 'audit_trail'],
      );
      expect(result.allowed).toBe(false);
      expect(result.phaseMatch).toBe(false);
      expect(result.reasons.some((r) => r.includes('phase'))).toBe(true);
    });

    it('blocks on excessive risk', () => {
      const result = wire.checkSkill(
        'build_code', 'BUILD', 'R3', 'AI_AGENT',
        ['phase_gate', 'risk_gate', 'audit_trail'],
      );
      expect(result.allowed).toBe(false);
      expect(result.riskLevelSafe).toBe(false);
    });

    it('blocks on missing guards', () => {
      const result = wire.checkSkill(
        'build_code', 'BUILD', 'R0', 'AI_AGENT',
        ['phase_gate'],
      );
      expect(result.allowed).toBe(false);
      expect(result.missingGuards).toEqual(['risk_gate', 'audit_trail']);
    });

    it('blocks on unauthorized role', () => {
      const result = wire.checkSkill(
        'build_code', 'BUILD', 'R0', 'REVIEWER',
        ['phase_gate', 'risk_gate', 'audit_trail'],
      );
      expect(result.allowed).toBe(false);
      expect(result.roleAuthorized).toBe(false);
    });

    it('allows HUMAN for any skill', () => {
      const result = wire.checkSkill(
        'build_code', 'BUILD', 'R0', 'HUMAN',
        ['phase_gate', 'risk_gate', 'audit_trail'],
      );
      expect(result.roleAuthorized).toBe(true);
    });

    it('allows OPERATOR for any skill', () => {
      const result = wire.checkSkill(
        'build_code', 'BUILD', 'R0', 'OPERATOR',
        ['phase_gate', 'risk_gate', 'audit_trail'],
      );
      expect(result.roleAuthorized).toBe(true);
    });

    it('returns guidance on block', () => {
      const result = wire.checkSkill(
        'build_code', 'DISCOVERY', 'R3', 'REVIEWER', [],
      );
      expect(result.guidance).toContain('Cannot use');
      expect(result.guidance).toContain('advance to BUILD');
    });

    it('returns guidance on allow', () => {
      const result = wire.checkSkill(
        'build_code', 'BUILD', 'R0', 'AI_AGENT',
        ['phase_gate', 'risk_gate', 'audit_trail'],
      );
      expect(result.guidance).toContain('ready to use');
    });

    it('handles non-existent skill', () => {
      const result = wire.checkSkill('nope', 'BUILD', 'R0', 'HUMAN', []);
      expect(result.allowed).toBe(false);
      expect(result.reasons[0]).toContain('not found');
    });

    it('reports multiple reasons on multiple failures', () => {
      const result = wire.checkSkill(
        'build_code', 'DISCOVERY', 'R3', 'REVIEWER', [],
      );
      expect(result.reasons.length).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('createDefaultSkillGuardWire', () => {
  it('creates wire with default skills', () => {
    const wire = createDefaultSkillGuardWire();
    expect(wire.count()).toBeGreaterThanOrEqual(9);
  });

  it('has app_development skills', () => {
    const wire = createDefaultSkillGuardWire();
    const appSkills = wire.getSkillsByDomain('app_development');
    expect(appSkills.length).toBeGreaterThanOrEqual(4);
  });

  it('has ai_ml_evaluation skills', () => {
    const wire = createDefaultSkillGuardWire();
    const aiSkills = wire.getSkillsByDomain('ai_ml_evaluation');
    expect(aiSkills.length).toBeGreaterThanOrEqual(3);
  });

  it('has deployment skill', () => {
    const wire = createDefaultSkillGuardWire();
    expect(wire.getSkill('deployment')).toBeDefined();
    expect(wire.getSkill('deployment')!.minimumRiskLevel).toBe('R3');
  });

  it('deployment requires OPERATOR role', () => {
    const wire = createDefaultSkillGuardWire();
    expect(wire.getSkill('deployment')!.recommendedRole).toBe('OPERATOR');
  });

  it('skills span all phases', () => {
    const wire = createDefaultSkillGuardWire();
    expect(wire.getSkillsByPhase('DISCOVERY').length).toBeGreaterThanOrEqual(1);
    expect(wire.getSkillsByPhase('DESIGN').length).toBeGreaterThanOrEqual(2);
    expect(wire.getSkillsByPhase('BUILD').length).toBeGreaterThanOrEqual(2);
    expect(wire.getSkillsByPhase('REVIEW').length).toBeGreaterThanOrEqual(2);
  });
});
