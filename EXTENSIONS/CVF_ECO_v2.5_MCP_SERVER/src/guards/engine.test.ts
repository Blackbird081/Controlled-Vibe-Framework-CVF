/**
 * Tests for GuardRuntimeEngine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GuardRuntimeEngine } from './engine.js';
import { createGuardEngine } from './index.js';
import type { Guard, GuardRequestContext, GuardResult } from './types.js';

function makeContext(overrides?: Partial<GuardRequestContext>): GuardRequestContext {
  return {
    requestId: 'test-req-001',
    phase: 'BUILD',
    riskLevel: 'R0',
    role: 'HUMAN',
    action: 'test_action',
    ...overrides,
  };
}

function makeGuard(overrides?: Partial<Guard>): Guard {
  return {
    id: 'test_guard',
    name: 'Test Guard',
    description: 'A test guard',
    priority: 10,
    enabled: true,
    evaluate: () => ({
      guardId: 'test_guard',
      decision: 'ALLOW',
      severity: 'INFO',
      reason: 'Test pass',
      timestamp: new Date().toISOString(),
    }),
    ...overrides,
  };
}

describe('GuardRuntimeEngine', () => {
  let engine: GuardRuntimeEngine;

  beforeEach(() => {
    engine = new GuardRuntimeEngine();
  });

  describe('guard registration', () => {
    it('registers a guard successfully', () => {
      engine.registerGuard(makeGuard());
      expect(engine.getGuardCount()).toBe(1);
    });

    it('throws on duplicate guard ID', () => {
      engine.registerGuard(makeGuard());
      expect(() => engine.registerGuard(makeGuard())).toThrow('already registered');
    });

    it('throws when exceeding max guards', () => {
      const small = new GuardRuntimeEngine({ maxGuardsPerPipeline: 1 });
      small.registerGuard(makeGuard({ id: 'g1' }));
      expect(() => small.registerGuard(makeGuard({ id: 'g2' }))).toThrow('limit reached');
    });

    it('unregisters a guard', () => {
      engine.registerGuard(makeGuard());
      expect(engine.unregisterGuard('test_guard')).toBe(true);
      expect(engine.getGuardCount()).toBe(0);
    });

    it('returns false for unregistering non-existent guard', () => {
      expect(engine.unregisterGuard('nonexistent')).toBe(false);
    });

    it('retrieves a guard by ID', () => {
      const guard = makeGuard();
      engine.registerGuard(guard);
      expect(engine.getGuard('test_guard')).toBe(guard);
    });

    it('returns undefined for non-existent guard', () => {
      expect(engine.getGuard('nonexistent')).toBeUndefined();
    });

    it('lists all registered guards', () => {
      engine.registerGuard(makeGuard({ id: 'a', priority: 2 }));
      engine.registerGuard(makeGuard({ id: 'b', priority: 1 }));
      expect(engine.getRegisteredGuards()).toHaveLength(2);
    });
  });

  describe('evaluate', () => {
    it('returns ALLOW when all guards allow', () => {
      engine.registerGuard(makeGuard({ id: 'g1' }));
      engine.registerGuard(makeGuard({ id: 'g2' }));
      const result = engine.evaluate(makeContext());
      expect(result.finalDecision).toBe('ALLOW');
      expect(result.results).toHaveLength(2);
    });

    it('returns BLOCK when a guard blocks', () => {
      engine.registerGuard(makeGuard({
        id: 'blocker',
        evaluate: () => ({
          guardId: 'blocker',
          decision: 'BLOCK',
          severity: 'ERROR',
          reason: 'Blocked',
          timestamp: new Date().toISOString(),
        }),
      }));
      const result = engine.evaluate(makeContext());
      expect(result.finalDecision).toBe('BLOCK');
      expect(result.blockedBy).toBe('blocker');
    });

    it('returns ESCALATE when a guard escalates', () => {
      engine.registerGuard(makeGuard({
        id: 'escalator',
        evaluate: () => ({
          guardId: 'escalator',
          decision: 'ESCALATE',
          severity: 'WARN',
          reason: 'Escalated',
          timestamp: new Date().toISOString(),
        }),
      }));
      const result = engine.evaluate(makeContext());
      expect(result.finalDecision).toBe('ESCALATE');
      expect(result.escalatedBy).toBe('escalator');
    });

    it('BLOCK overrides ESCALATE', () => {
      engine.registerGuard(makeGuard({
        id: 'escalator',
        priority: 1,
        evaluate: () => ({
          guardId: 'escalator',
          decision: 'ESCALATE',
          severity: 'WARN',
          reason: 'Escalated',
          timestamp: new Date().toISOString(),
        }),
      }));
      engine.registerGuard(makeGuard({
        id: 'blocker',
        priority: 2,
        evaluate: () => ({
          guardId: 'blocker',
          decision: 'BLOCK',
          severity: 'ERROR',
          reason: 'Blocked',
          timestamp: new Date().toISOString(),
        }),
      }));
      const result = engine.evaluate(makeContext());
      expect(result.finalDecision).toBe('BLOCK');
    });

    it('strict mode short-circuits on BLOCK', () => {
      const strictEngine = new GuardRuntimeEngine({ strictMode: true });
      let secondCalled = false;
      strictEngine.registerGuard(makeGuard({
        id: 'blocker',
        priority: 1,
        evaluate: () => ({
          guardId: 'blocker',
          decision: 'BLOCK',
          severity: 'ERROR',
          reason: 'Blocked',
          timestamp: new Date().toISOString(),
        }),
      }));
      strictEngine.registerGuard(makeGuard({
        id: 'second',
        priority: 2,
        evaluate: () => {
          secondCalled = true;
          return {
            guardId: 'second',
            decision: 'ALLOW',
            severity: 'INFO',
            reason: 'OK',
            timestamp: new Date().toISOString(),
          };
        },
      }));
      strictEngine.evaluate(makeContext());
      expect(secondCalled).toBe(false);
    });

    it('evaluates guards in priority order', () => {
      const order: string[] = [];
      engine.registerGuard(makeGuard({
        id: 'high',
        priority: 100,
        evaluate: () => {
          order.push('high');
          return { guardId: 'high', decision: 'ALLOW', severity: 'INFO', reason: 'OK', timestamp: new Date().toISOString() };
        },
      }));
      engine.registerGuard(makeGuard({
        id: 'low',
        priority: 1,
        evaluate: () => {
          order.push('low');
          return { guardId: 'low', decision: 'ALLOW', severity: 'INFO', reason: 'OK', timestamp: new Date().toISOString() };
        },
      }));
      engine.evaluate(makeContext());
      expect(order).toEqual(['low', 'high']);
    });

    it('skips disabled guards', () => {
      engine.registerGuard(makeGuard({
        id: 'disabled',
        enabled: false,
        evaluate: () => {
          throw new Error('Should not be called');
        },
      }));
      engine.registerGuard(makeGuard({ id: 'enabled' }));
      const result = engine.evaluate(makeContext());
      expect(result.results).toHaveLength(1);
    });

    it('includes agentGuidance in pipeline result', () => {
      engine.registerGuard(makeGuard({
        id: 'guided',
        evaluate: () => ({
          guardId: 'guided',
          decision: 'BLOCK',
          severity: 'ERROR',
          reason: 'Blocked',
          agentGuidance: 'Do X instead',
          timestamp: new Date().toISOString(),
        }),
      }));
      const result = engine.evaluate(makeContext());
      expect(result.agentGuidance).toContain('Do X instead');
    });

    it('records durationMs', () => {
      engine.registerGuard(makeGuard());
      const result = engine.evaluate(makeContext());
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('records executedAt as ISO string', () => {
      engine.registerGuard(makeGuard());
      const result = engine.evaluate(makeContext());
      expect(result.executedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('audit log', () => {
    it('records entries when audit log is enabled', () => {
      engine.registerGuard(makeGuard());
      engine.evaluate(makeContext());
      expect(engine.getAuditLog()).toHaveLength(1);
    });

    it('does not record when audit log is disabled', () => {
      const noAudit = new GuardRuntimeEngine({ enableAuditLog: false });
      noAudit.registerGuard(makeGuard());
      noAudit.evaluate(makeContext());
      expect(noAudit.getAuditLog()).toHaveLength(0);
    });

    it('retrieves entry by requestId', () => {
      engine.registerGuard(makeGuard());
      engine.evaluate(makeContext({ requestId: 'find-me' }));
      const entry = engine.getAuditEntry('find-me');
      expect(entry).toBeDefined();
      expect(entry!.requestId).toBe('find-me');
    });

    it('returns undefined for non-existent requestId', () => {
      expect(engine.getAuditEntry('nonexistent')).toBeUndefined();
    });

    it('clears audit log', () => {
      engine.registerGuard(makeGuard());
      engine.evaluate(makeContext());
      engine.clearAuditLog();
      expect(engine.getAuditLog()).toHaveLength(0);
    });

    it('returns audit log size', () => {
      engine.registerGuard(makeGuard());
      engine.evaluate(makeContext({ requestId: 'a' }));
      engine.evaluate(makeContext({ requestId: 'b' }));
      expect(engine.getAuditLogSize()).toBe(2);
    });
  });

  describe('config', () => {
    it('returns default config', () => {
      const config = engine.getConfig();
      expect(config.strictMode).toBe(true);
      expect(config.enableAuditLog).toBe(true);
    });

    it('updates config', () => {
      engine.updateConfig({ strictMode: false });
      expect(engine.getConfig().strictMode).toBe(false);
    });
  });

  describe('session phase', () => {
    it('defaults to DISCOVERY', () => {
      expect(engine.getSessionPhase()).toBe('DISCOVERY');
    });

    it('sets session phase', () => {
      engine.setSessionPhase('BUILD');
      expect(engine.getSessionPhase()).toBe('BUILD');
    });
  });

  describe('createGuardEngine factory', () => {
    it('creates engine with 6 guards', () => {
      const factoryEngine = createGuardEngine();
      expect(factoryEngine.getGuardCount()).toBe(6);
    });

    it('has all expected guard IDs', () => {
      const factoryEngine = createGuardEngine();
      const ids = factoryEngine.getRegisteredGuards().map((g) => g.id);
      expect(ids).toContain('phase_gate');
      expect(ids).toContain('risk_gate');
      expect(ids).toContain('authority_gate');
      expect(ids).toContain('mutation_budget');
      expect(ids).toContain('scope_guard');
      expect(ids).toContain('audit_trail');
    });

    it('accepts custom config', () => {
      const factoryEngine = createGuardEngine({ strictMode: false });
      expect(factoryEngine.getConfig().strictMode).toBe(false);
    });
  });
});
