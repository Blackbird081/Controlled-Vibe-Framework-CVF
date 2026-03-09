import { describe, it, expect, beforeEach } from 'vitest';
import { SkillRolloutEngine } from '../skill_lifecycle/skill.rollout.engine.js';

describe('SkillRolloutEngine', () => {
  let engine: SkillRolloutEngine;

  beforeEach(() => {
    engine = new SkillRolloutEngine();
  });

  describe('initiateRollout', () => {
    it('creates a new rollout at DRAFT_REVIEW stage', () => {
      const record = engine.initiateRollout('test-skill');
      expect(record.skillId).toBe('test-skill');
      expect(record.currentStage).toBe('DRAFT_REVIEW');
      expect(record.history).toHaveLength(1);
      expect(record.history[0].stage).toBe('DRAFT_REVIEW');
    });

    it('throws if rollout already exists', () => {
      engine.initiateRollout('dup-skill');
      expect(() => engine.initiateRollout('dup-skill')).toThrow('already exists');
    });
  });

  describe('getRollout', () => {
    it('returns undefined for unknown skill', () => {
      expect(engine.getRollout('nonexistent')).toBeUndefined();
    });

    it('returns existing rollout', () => {
      engine.initiateRollout('my-skill');
      expect(engine.getRollout('my-skill')).toBeDefined();
    });
  });

  describe('Stage 1 → 2: DRAFT_REVIEW → CANARY', () => {
    it('promotes to CANARY with valid config', () => {
      engine.initiateRollout('skill-a');
      const result = engine.promoteToCanary('skill-a', {
        allowedAgents: ['AGENT_1'],
        allowedProjects: ['PROJECT_1'],
      });

      expect(result.success).toBe(true);
      expect(result.from).toBe('DRAFT_REVIEW');
      expect(result.to).toBe('CANARY');

      const record = engine.getRollout('skill-a')!;
      expect(record.currentStage).toBe('CANARY');
      expect(record.canaryConfig).toBeDefined();
      expect(record.canaryConfig!.allowedAgents).toEqual(['AGENT_1']);
      expect(record.canaryConfig!.currentCycles).toBe(0);
    });

    it('fails if not in DRAFT_REVIEW', () => {
      engine.initiateRollout('skill-b');
      engine.promoteToCanary('skill-b', { allowedAgents: [], allowedProjects: [] });

      const result = engine.promoteToCanary('skill-b', { allowedAgents: [], allowedProjects: [] });
      expect(result.success).toBe(false);
      expect(result.reason).toContain('DRAFT_REVIEW');
    });
  });

  describe('Stage 2 → 3: CANARY → GENERAL_AVAILABILITY', () => {
    it('promotes to GA after canary cycles pass with no anomalies', () => {
      engine.initiateRollout('skill-c');
      engine.promoteToCanary('skill-c', { allowedAgents: ['A1'], allowedProjects: ['P1'] });
      engine.recordCanaryCycle('skill-c', false);

      const result = engine.promoteToGA('skill-c');
      expect(result.success).toBe(true);
      expect(result.to).toBe('GENERAL_AVAILABILITY');
    });

    it('fails if canary cycles not met', () => {
      engine.initiateRollout('skill-d');
      engine.promoteToCanary('skill-d', { allowedAgents: ['A1'], allowedProjects: ['P1'], minCycles: 3 });
      engine.recordCanaryCycle('skill-d', false);

      const result = engine.promoteToGA('skill-d');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Canary cycles');
    });

    it('fails if anomalies detected during canary', () => {
      engine.initiateRollout('skill-e');
      engine.promoteToCanary('skill-e', { allowedAgents: ['A1'], allowedProjects: ['P1'] });
      engine.recordCanaryCycle('skill-e', true);

      const result = engine.promoteToGA('skill-e');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('anomalies');
    });

    it('fails if not in CANARY stage', () => {
      engine.initiateRollout('skill-f');
      const result = engine.promoteToGA('skill-f');
      expect(result.success).toBe(false);
    });
  });

  describe('Stage 3 → 4: GENERAL_AVAILABILITY → DEPRECATION', () => {
    it('deprecates when successor is at GA', () => {
      engine.initiateRollout('old-skill');
      engine.promoteToCanary('old-skill', { allowedAgents: ['A'], allowedProjects: ['P'] });
      engine.recordCanaryCycle('old-skill', false);
      engine.promoteToGA('old-skill');

      engine.initiateRollout('new-skill');
      engine.promoteToCanary('new-skill', { allowedAgents: ['A'], allowedProjects: ['P'] });
      engine.recordCanaryCycle('new-skill', false);
      engine.promoteToGA('new-skill');

      const result = engine.deprecate('old-skill', { successorId: 'new-skill' });
      expect(result.success).toBe(true);
      expect(result.to).toBe('DEPRECATION');

      const record = engine.getRollout('old-skill')!;
      expect(record.deprecationConfig).toBeDefined();
      expect(record.deprecationConfig!.successorId).toBe('new-skill');
      expect(record.successorId).toBe('new-skill');
    });

    it('fails if successor is not at GA', () => {
      engine.initiateRollout('old2');
      engine.promoteToCanary('old2', { allowedAgents: ['A'], allowedProjects: ['P'] });
      engine.recordCanaryCycle('old2', false);
      engine.promoteToGA('old2');

      engine.initiateRollout('new2');

      const result = engine.deprecate('old2', { successorId: 'new2' });
      expect(result.success).toBe(false);
      expect(result.reason).toContain('GENERAL_AVAILABILITY');
    });

    it('fails if successor does not exist', () => {
      engine.initiateRollout('old3');
      engine.promoteToCanary('old3', { allowedAgents: ['A'], allowedProjects: ['P'] });
      engine.recordCanaryCycle('old3', false);
      engine.promoteToGA('old3');

      const result = engine.deprecate('old3', { successorId: 'nonexistent' });
      expect(result.success).toBe(false);
    });
  });

  describe('Stage 4 → 5: DEPRECATION → REVOCATION', () => {
    function setupDeprecated(): void {
      engine.initiateRollout('dep-old');
      engine.promoteToCanary('dep-old', { allowedAgents: ['A'], allowedProjects: ['P'] });
      engine.recordCanaryCycle('dep-old', false);
      engine.promoteToGA('dep-old');

      engine.initiateRollout('dep-new');
      engine.promoteToCanary('dep-new', { allowedAgents: ['A'], allowedProjects: ['P'] });
      engine.recordCanaryCycle('dep-new', false);
      engine.promoteToGA('dep-new');

      engine.deprecate('dep-old', { successorId: 'dep-new' });
    }

    it('revokes after grace period expires', () => {
      setupDeprecated();
      engine.expireGracePeriod('dep-old');

      const result = engine.revoke('dep-old', 'End of life');
      expect(result.success).toBe(true);
      expect(result.to).toBe('REVOCATION');
    });

    it('revokes immediately for security issues', () => {
      setupDeprecated();

      const result = engine.revoke('dep-old', 'Critical security vulnerability');
      expect(result.success).toBe(true);
      expect(result.to).toBe('REVOCATION');
    });

    it('fails revocation if grace period not expired and no security reason', () => {
      setupDeprecated();

      const result = engine.revoke('dep-old', 'Just want to remove it');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Grace period');
    });
  });

  describe('history tracking', () => {
    it('records full stage history through lifecycle', () => {
      engine.initiateRollout('hist-skill');
      engine.promoteToCanary('hist-skill', { allowedAgents: ['A'], allowedProjects: ['P'] });
      engine.recordCanaryCycle('hist-skill', false);
      engine.promoteToGA('hist-skill');

      const record = engine.getRollout('hist-skill')!;
      expect(record.history).toHaveLength(3);
      expect(record.history[0].stage).toBe('DRAFT_REVIEW');
      expect(record.history[0].exitedAt).toBeDefined();
      expect(record.history[1].stage).toBe('CANARY');
      expect(record.history[1].exitedAt).toBeDefined();
      expect(record.history[2].stage).toBe('GENERAL_AVAILABILITY');
      expect(record.history[2].exitedAt).toBeUndefined();
    });
  });

  describe('gate tracking', () => {
    it('records gates at each transition', () => {
      engine.initiateRollout('gate-skill');
      engine.promoteToCanary('gate-skill', { allowedAgents: ['A'], allowedProjects: ['P'] });
      engine.recordCanaryCycle('gate-skill', false);
      engine.promoteToGA('gate-skill');

      const record = engine.getRollout('gate-skill')!;
      expect(record.gates.length).toBeGreaterThanOrEqual(2);
      expect(record.gates.every(g => g.result === 'PASS')).toBe(true);
    });
  });

  describe('query methods', () => {
    it('getAllRollouts returns all rollouts', () => {
      engine.initiateRollout('s1');
      engine.initiateRollout('s2');
      expect(engine.getAllRollouts()).toHaveLength(2);
    });

    it('getRolloutsByStage filters correctly', () => {
      engine.initiateRollout('draft1');
      engine.initiateRollout('canary1');
      engine.promoteToCanary('canary1', { allowedAgents: ['A'], allowedProjects: ['P'] });

      expect(engine.getRolloutsByStage('DRAFT_REVIEW')).toHaveLength(1);
      expect(engine.getRolloutsByStage('CANARY')).toHaveLength(1);
    });
  });

  describe('lifecycle state mapping', () => {
    it('maps rollout stages to lifecycle states', () => {
      expect(engine.getLifecycleState('DRAFT_REVIEW')).toBe('PROPOSED');
      expect(engine.getLifecycleState('CANARY')).toBe('ACTIVE');
      expect(engine.getLifecycleState('GENERAL_AVAILABILITY')).toBe('ACTIVE');
      expect(engine.getLifecycleState('DEPRECATION')).toBe('DEPRECATED');
      expect(engine.getLifecycleState('REVOCATION')).toBe('REVOKED');
    });

    it('returns correct stage index', () => {
      expect(engine.getStageIndex('DRAFT_REVIEW')).toBe(0);
      expect(engine.getStageIndex('CANARY')).toBe(1);
      expect(engine.getStageIndex('GENERAL_AVAILABILITY')).toBe(2);
      expect(engine.getStageIndex('DEPRECATION')).toBe(3);
      expect(engine.getStageIndex('REVOCATION')).toBe(4);
    });
  });

  describe('canary cycle recording', () => {
    it('tracks cycles and anomalies', () => {
      engine.initiateRollout('canary-test');
      engine.promoteToCanary('canary-test', { allowedAgents: ['A'], allowedProjects: ['P'] });

      engine.recordCanaryCycle('canary-test', false);
      engine.recordCanaryCycle('canary-test', true);
      engine.recordCanaryCycle('canary-test', false);

      const record = engine.getRollout('canary-test')!;
      expect(record.canaryConfig!.currentCycles).toBe(3);
      expect(record.canaryConfig!.anomalyCount).toBe(1);
    });
  });
});
