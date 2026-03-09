import { describe, it, expect, beforeEach } from 'vitest';
import {
  UnifiedStateResolver,
  createUnifiedStateResolver,
} from '../governance/control_plane/unified.state.resolver.js';
import { DEFAULT_GOVERNANCE_CONTROL_PLANE } from '../governance/control_plane/governance.control.plane.js';

describe('UnifiedStateResolver', () => {
  let resolver: UnifiedStateResolver;

  beforeEach(() => {
    resolver = new UnifiedStateResolver();
  });

  describe('initialization', () => {
    it('creates with default control plane', () => {
      const cp = resolver.getControlPlane();
      expect(cp.policyVersion).toBe('v1.1.2');
      expect(cp.auditPhase).toBe('PHASE_GATE');
    });

    it('uses canonical schema version', () => {
      const state = resolver.resolve();
      expect(state.schemaVersion).toBe('2026-03-09');
    });

    it('resolves policy version from control plane', () => {
      expect(resolver.getPolicyVersion()).toBe('v1.1.2');
    });
  });

  describe('source hierarchy', () => {
    it('returns 5 canonical sources sorted by priority', () => {
      const sources = resolver.getSourceHierarchy();
      expect(sources).toHaveLength(5);
      expect(sources[0].priority).toBe(1);
      expect(sources[0].sourceId).toBe('doctrine');
      expect(sources[4].priority).toBe(5);
      expect(sources[4].sourceId).toBe('extension-local');
    });

    it('validates known source IDs', () => {
      expect(resolver.isSourceValid('doctrine')).toBe(true);
      expect(resolver.isSourceValid('governance-contract')).toBe(true);
      expect(resolver.isSourceValid('control-plane-runtime')).toBe(true);
      expect(resolver.isSourceValid('state-registry')).toBe(true);
      expect(resolver.isSourceValid('extension-local')).toBe(true);
      expect(resolver.isSourceValid('unknown-source')).toBe(false);
    });
  });

  describe('agent management', () => {
    it('starts with no agents by default', () => {
      expect(resolver.getAgentCount()).toBe(0);
    });

    it('registers and retrieves agents', () => {
      resolver.registerAgent({
        agentId: 'AI_ASSISTANT_V1',
        certificationStatus: 'APPROVED_INTERNAL',
        approvedPhases: ['DESIGN', 'BUILD', 'REVIEW'],
        approvedSkills: ['code_generation', 'code_review'],
        lastSelfUatDate: '2026-03-07',
      });

      expect(resolver.getAgentCount()).toBe(1);
      const agent = resolver.getAgent('AI_ASSISTANT_V1');
      expect(agent).toBeDefined();
      expect(agent!.certificationStatus).toBe('APPROVED_INTERNAL');
      expect(agent!.approvedPhases).toEqual(['DESIGN', 'BUILD', 'REVIEW']);
    });

    it('normalizes agent ID to uppercase', () => {
      resolver.registerAgent({
        agentId: 'test_agent',
        certificationStatus: 'ACTIVE',
        approvedPhases: ['BUILD'],
        approvedSkills: [],
      });

      expect(resolver.getAgent('TEST_AGENT')).toBeDefined();
      expect(resolver.getAgent('test_agent')).toBeDefined();
    });

    it('accepts initial agent bindings via config', () => {
      const r = new UnifiedStateResolver({
        agentBindings: [
          {
            agentId: 'AGENT_1',
            certificationStatus: 'ACTIVE',
            approvedPhases: ['BUILD'],
            approvedSkills: [],
          },
          {
            agentId: 'AGENT_2',
            certificationStatus: 'PENDING',
            approvedPhases: [],
            approvedSkills: [],
          },
        ],
      });

      expect(r.getAgentCount()).toBe(2);
      expect(r.getAgent('AGENT_1')!.certificationStatus).toBe('ACTIVE');
    });
  });

  describe('conformance state', () => {
    it('returns default conformance state', () => {
      const conf = resolver.getConformance();
      expect(conf.scenarioCount).toBe(84);
      expect(conf.criticalAnchors).toBe(18);
      expect(conf.coverageGroups).toBe(17);
      expect(conf.overallResult).toBe('PASS');
    });

    it('accepts custom conformance config', () => {
      const r = new UnifiedStateResolver({
        conformance: { scenarioCount: 100, overallResult: 'FAIL' },
      });
      const conf = r.getConformance();
      expect(conf.scenarioCount).toBe(100);
      expect(conf.overallResult).toBe('FAIL');
      expect(conf.criticalAnchors).toBe(18);
    });
  });

  describe('pipeline validation', () => {
    it('validates correct pipeline order', () => {
      const canonical = [...DEFAULT_GOVERNANCE_CONTROL_PLANE.pipeline];
      expect(resolver.validatePipelineOrder(canonical)).toBe(true);
    });

    it('rejects wrong pipeline order', () => {
      expect(resolver.validatePipelineOrder(['wrong', 'order'])).toBe(false);
    });
  });

  describe('trace field validation', () => {
    it('returns missing fields for empty trace', () => {
      const missing = resolver.validateTraceFields({});
      expect(missing).toContain('requestId');
      expect(missing).toContain('policyVersion');
    });

    it('returns empty array for complete trace', () => {
      const missing = resolver.validateTraceFields({
        requestId: 'req-001',
        traceBatch: 'batch-001',
        traceHash: 'hash-001',
        policyVersion: 'v1.1.2',
      });
      expect(missing).toHaveLength(0);
    });

    it('detects partially missing fields', () => {
      const missing = resolver.validateTraceFields({
        requestId: 'req-001',
        policyVersion: 'v1.1.2',
      });
      expect(missing).toContain('traceBatch');
      expect(missing).toContain('traceHash');
      expect(missing).not.toContain('requestId');
    });
  });

  describe('drift detection', () => {
    it('reports no drift for default state', () => {
      expect(resolver.isDriftFree()).toBe(true);
      expect(resolver.detectDrift()).toHaveLength(0);
    });

    it('detects guard registry drift', () => {
      const r = new UnifiedStateResolver({ guardSyncStatus: 'DRIFT' });
      expect(r.isDriftFree()).toBe(false);
      const errors = r.detectDrift();
      expect(errors.some(e => e.includes('DRIFT'))).toBe(true);
    });

    it('detects conformance failure', () => {
      const r = new UnifiedStateResolver({
        conformance: { overallResult: 'FAIL' },
      });
      expect(r.isDriftFree()).toBe(false);
      const errors = r.detectDrift();
      expect(errors.some(e => e.includes('FAILING'))).toBe(true);
    });

    it('detects doctrine version mutation', () => {
      const r = new UnifiedStateResolver({
        ecosystem: { doctrineVersion: '2.0.0' },
      });
      expect(r.isDriftFree()).toBe(false);
      const errors = r.detectDrift();
      expect(errors.some(e => e.includes('FROZEN'))).toBe(true);
    });
  });

  describe('resolve()', () => {
    it('returns complete unified state', () => {
      resolver.registerAgent({
        agentId: 'TEST_AGENT',
        certificationStatus: 'ACTIVE',
        approvedPhases: ['BUILD'],
        approvedSkills: ['code_generation'],
      });

      const state = resolver.resolve();

      expect(state.schemaVersion).toBe('2026-03-09');
      expect(state.policyVersion).toBe('v1.1.2');
      expect(state.resolvedAt).toBeTruthy();
      expect(state.controlPlane).toBeDefined();
      expect(state.sources).toHaveLength(5);
      expect(state.agents.size).toBe(1);
      expect(state.conformance.overallResult).toBe('PASS');
      expect(state.guards.autoCheck).toContain('check_guard_registry');
      expect(state.ecosystem.doctrineVersion).toBe('1.0.0-FROZEN');
      expect(state.driftErrors).toHaveLength(0);
    });
  });

  describe('toJSON()', () => {
    it('produces serializable output', () => {
      resolver.registerAgent({
        agentId: 'AGENT_X',
        certificationStatus: 'ACTIVE',
        approvedPhases: ['BUILD'],
        approvedSkills: [],
      });

      const json = resolver.toJSON();
      const serialized = JSON.stringify(json);
      expect(serialized).toBeTruthy();

      const parsed = JSON.parse(serialized);
      expect(parsed.schemaVersion).toBe('2026-03-09');
      expect(parsed.agents['AGENT_X']).toBeDefined();
      expect(parsed.controlPlane.pipelineModules).toBeInstanceOf(Array);
    });
  });

  describe('createUnifiedStateResolver()', () => {
    it('creates resolver with factory function', () => {
      const r = createUnifiedStateResolver({
        guardSyncStatus: 'SYNCED',
      });
      expect(r.resolve().guards.syncStatus).toBe('SYNCED');
    });
  });
});
