/**
 * Tests for Unified Guard Registry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UnifiedGuardRegistry, createUnifiedRegistry } from './guard-registry.js';
import type { Guard, GuardRequestContext } from '../guards/types.js';

function makeGuard(overrides?: Partial<Guard>): Guard {
  return {
    id: 'test_guard',
    name: 'Test Guard',
    description: 'A test guard',
    priority: 10,
    enabled: true,
    evaluate: () => ({
      guardId: 'test_guard',
      decision: 'ALLOW' as const,
      severity: 'INFO' as const,
      reason: 'OK',
      timestamp: new Date().toISOString(),
    }),
    ...overrides,
  };
}

describe('UnifiedGuardRegistry', () => {
  let registry: UnifiedGuardRegistry;

  beforeEach(() => {
    registry = new UnifiedGuardRegistry();
  });

  describe('registration', () => {
    it('registers a guard with metadata', () => {
      registry.register(makeGuard(), {
        version: '1.7.0',
        source: 'v1.7',
        category: 'phase',
        phases: ['BUILD'],
        minRiskLevel: 'R0',
        tags: ['core'],
      });
      expect(registry.count()).toBe(1);
    });

    it('throws on duplicate registration', () => {
      const guard = makeGuard();
      registry.register(guard, { version: '1.7.0', source: 'v1.7', category: 'phase', phases: ['BUILD'], minRiskLevel: 'R0', tags: [] });
      expect(() => registry.register(guard, { version: '1.7.0', source: 'v1.7', category: 'phase', phases: ['BUILD'], minRiskLevel: 'R0', tags: [] }))
        .toThrow('already registered');
    });

    it('unregisters a guard', () => {
      registry.register(makeGuard(), { version: '1.7.0', source: 'v1.7', category: 'phase', phases: ['BUILD'], minRiskLevel: 'R0', tags: [] });
      expect(registry.unregister('test_guard')).toBe(true);
      expect(registry.count()).toBe(0);
    });

    it('returns false for unregistering non-existent', () => {
      expect(registry.unregister('nonexistent')).toBe(false);
    });
  });

  describe('retrieval', () => {
    beforeEach(() => {
      registry.register(makeGuard({ id: 'g1', priority: 10 }), {
        version: '1.7.0', source: 'v1.7', category: 'phase', phases: ['BUILD', 'REVIEW'], minRiskLevel: 'R0', tags: ['core', 'mandatory'],
      });
      registry.register(makeGuard({ id: 'g2', priority: 20 }), {
        version: '1.6.0', source: 'v1.6', category: 'risk', phases: ['BUILD'], minRiskLevel: 'R1', tags: ['core'],
      });
      registry.register(makeGuard({ id: 'g3', priority: 30, enabled: false }), {
        version: '1.7.0', source: 'v1.7', category: 'scope', phases: ['DISCOVERY', 'DESIGN'], minRiskLevel: 'R0', tags: ['protection'],
      });
    });

    it('gets by ID', () => {
      const entry = registry.get('g1');
      expect(entry).toBeDefined();
      expect(entry!.metadata.id).toBe('g1');
    });

    it('returns undefined for non-existent ID', () => {
      expect(registry.get('nonexistent')).toBeUndefined();
    });

    it('gets all guards', () => {
      expect(registry.getAll()).toHaveLength(3);
    });

    it('gets enabled guards only', () => {
      expect(registry.getEnabled()).toHaveLength(2);
    });

    it('filters by category', () => {
      expect(registry.getByCategory('phase')).toHaveLength(1);
      expect(registry.getByCategory('risk')).toHaveLength(1);
      expect(registry.getByCategory('scope')).toHaveLength(1);
    });

    it('filters by source', () => {
      expect(registry.getBySource('v1.7')).toHaveLength(2);
      expect(registry.getBySource('v1.6')).toHaveLength(1);
    });

    it('filters by phase', () => {
      expect(registry.getByPhase('BUILD')).toHaveLength(2);
      expect(registry.getByPhase('REVIEW')).toHaveLength(1);
      expect(registry.getByPhase('DISCOVERY')).toHaveLength(1);
    });

    it('filters by tag', () => {
      expect(registry.getByTag('core')).toHaveLength(2);
      expect(registry.getByTag('mandatory')).toHaveLength(1);
      expect(registry.getByTag('protection')).toHaveLength(1);
    });

    it('gets guards for context (phase + risk)', () => {
      const guards = registry.getForContext('BUILD', 'R1');
      expect(guards.length).toBeGreaterThanOrEqual(1);
      // Should be sorted by priority
      for (let i = 1; i < guards.length; i++) {
        expect(guards[i].guard.priority).toBeGreaterThanOrEqual(guards[i - 1].guard.priority);
      }
    });

    it('excludes disabled guards from context query', () => {
      const guards = registry.getForContext('DISCOVERY', 'R0');
      expect(guards.every((g) => g.enabled)).toBe(true);
    });
  });

  describe('enable/disable', () => {
    it('disables a guard', () => {
      registry.register(makeGuard(), { version: '1.7.0', source: 'v1.7', category: 'phase', phases: ['BUILD'], minRiskLevel: 'R0', tags: [] });
      expect(registry.disable('test_guard')).toBe(true);
      expect(registry.get('test_guard')!.enabled).toBe(false);
    });

    it('enables a guard', () => {
      registry.register(makeGuard({ enabled: false }), { version: '1.7.0', source: 'v1.7', category: 'phase', phases: ['BUILD'], minRiskLevel: 'R0', tags: [] });
      expect(registry.enable('test_guard')).toBe(true);
      expect(registry.get('test_guard')!.enabled).toBe(true);
    });

    it('returns false for non-existent guard', () => {
      expect(registry.enable('nonexistent')).toBe(false);
      expect(registry.disable('nonexistent')).toBe(false);
    });
  });

  describe('stats', () => {
    it('returns correct stats', () => {
      registry.register(makeGuard({ id: 'g1' }), { version: '1.7.0', source: 'v1.7', category: 'phase', phases: ['BUILD'], minRiskLevel: 'R0', tags: [] });
      registry.register(makeGuard({ id: 'g2', enabled: false }), { version: '1.6.0', source: 'v1.6', category: 'risk', phases: ['BUILD', 'REVIEW'], minRiskLevel: 'R0', tags: [] });

      const stats = registry.getStats();
      expect(stats.totalGuards).toBe(2);
      expect(stats.enabledGuards).toBe(1);
      expect(stats.byCategory.phase).toBe(1);
      expect(stats.byCategory.risk).toBe(1);
      expect(stats.bySource['v1.7']).toBe(1);
      expect(stats.bySource['v1.6']).toBe(1);
      expect(stats.byPhase.BUILD).toBe(2);
      expect(stats.byPhase.REVIEW).toBe(1);
    });
  });

  describe('toJSON', () => {
    it('serializes correctly', () => {
      registry.register(makeGuard(), { version: '1.7.0', source: 'v1.7', category: 'phase', phases: ['BUILD'], minRiskLevel: 'R0', tags: ['core'] });
      const json = registry.toJSON() as any;
      expect(json.guards).toHaveLength(1);
      expect(json.guards[0].id).toBe('test_guard');
      expect(json.stats.totalGuards).toBe(1);
    });
  });
});

describe('createUnifiedRegistry', () => {
  it('creates registry with 6 default guards', () => {
    const registry = createUnifiedRegistry();
    expect(registry.count()).toBe(6);
  });

  it('has all expected guard IDs', () => {
    const registry = createUnifiedRegistry();
    const ids = registry.getAll().map((g) => g.metadata.id);
    expect(ids).toContain('phase_gate');
    expect(ids).toContain('risk_gate');
    expect(ids).toContain('authority_gate');
    expect(ids).toContain('mutation_budget');
    expect(ids).toContain('scope_guard');
    expect(ids).toContain('audit_trail');
  });

  it('all guards are from v1.7', () => {
    const registry = createUnifiedRegistry();
    expect(registry.getBySource('v1.7')).toHaveLength(6);
  });

  it('core guards are tagged mandatory', () => {
    const registry = createUnifiedRegistry();
    const mandatory = registry.getByTag('mandatory');
    expect(mandatory.length).toBeGreaterThanOrEqual(3);
  });

  it('returns correct stats', () => {
    const registry = createUnifiedRegistry();
    const stats = registry.getStats();
    expect(stats.totalGuards).toBe(6);
    expect(stats.enabledGuards).toBe(6);
  });
});
