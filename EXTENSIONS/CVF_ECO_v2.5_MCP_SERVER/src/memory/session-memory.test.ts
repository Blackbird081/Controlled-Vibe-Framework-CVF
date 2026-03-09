/**
 * Tests for Session Memory
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SessionMemory } from './session-memory.js';
import type { GuardPipelineResult } from '../guards/types.js';

describe('SessionMemory', () => {
  let mem: SessionMemory;

  beforeEach(() => {
    mem = new SessionMemory('test-session', { enableExpiry: false });
  });

  describe('core operations', () => {
    it('sets and gets a value', () => {
      mem.set('key1', 'value1');
      expect(mem.get('key1')).toBe('value1');
    });

    it('returns undefined for non-existent key', () => {
      expect(mem.get('nope')).toBeUndefined();
    });

    it('overwrites existing key', () => {
      mem.set('key1', 'a');
      mem.set('key1', 'b');
      expect(mem.get('key1')).toBe('b');
    });

    it('checks existence', () => {
      mem.set('exists', true);
      expect(mem.has('exists')).toBe(true);
      expect(mem.has('nope')).toBe(false);
    });

    it('deletes a key', () => {
      mem.set('del', 'bye');
      expect(mem.delete('del')).toBe(true);
      expect(mem.has('del')).toBe(false);
    });

    it('returns false deleting non-existent', () => {
      expect(mem.delete('nope')).toBe(false);
    });

    it('gets entry with metadata', () => {
      mem.set('meta', 42, 'custom');
      const entry = mem.getEntry('meta');
      expect(entry).toBeDefined();
      expect(entry!.type).toBe('custom');
      expect(entry!.value).toBe(42);
      expect(entry!.timestamp).toBeDefined();
    });

    it('gets entries by type', () => {
      mem.set('a', 1, 'context');
      mem.set('b', 2, 'custom');
      mem.set('c', 3, 'context');
      const ctx = mem.getByType('context');
      expect(ctx).toHaveLength(2);
    });

    it('gets all entries', () => {
      mem.set('a', 1);
      mem.set('b', 2);
      expect(mem.getAllEntries()).toHaveLength(2);
    });

    it('clears all entries', () => {
      mem.set('a', 1);
      mem.set('b', 2);
      mem.clear();
      expect(mem.size()).toBe(0);
    });

    it('tracks size', () => {
      expect(mem.size()).toBe(0);
      mem.set('a', 1);
      expect(mem.size()).toBe(1);
      mem.set('b', 2);
      expect(mem.size()).toBe(2);
    });

    it('stores complex objects', () => {
      const obj = { nested: { data: [1, 2, 3] } };
      mem.set('complex', obj);
      expect(mem.get('complex')).toEqual(obj);
    });
  });

  describe('max entries eviction', () => {
    it('evicts oldest when at max', () => {
      const small = new SessionMemory('small', { maxEntries: 3, enableExpiry: false });
      small.set('a', 1);
      small.set('b', 2);
      small.set('c', 3);
      small.set('d', 4); // should evict 'a'
      expect(small.has('a')).toBe(false);
      expect(small.has('d')).toBe(true);
      expect(small.size()).toBe(3);
    });
  });

  describe('TTL expiry', () => {
    it('expires entries after TTL', async () => {
      const expiring = new SessionMemory('exp', { enableExpiry: true, defaultTtlMs: 50 });
      expiring.set('temp', 'data');
      expect(expiring.get('temp')).toBe('data');
      await new Promise((r) => setTimeout(r, 80));
      expect(expiring.get('temp')).toBeUndefined();
    });

    it('custom TTL per entry', async () => {
      const expiring = new SessionMemory('exp2', { enableExpiry: true, defaultTtlMs: 10000 });
      expiring.set('short', 'data', 'custom', 50);
      expiring.set('long', 'data', 'custom', 10000);
      await new Promise((r) => setTimeout(r, 80));
      expect(expiring.get('short')).toBeUndefined();
      expect(expiring.get('long')).toBe('data');
    });
  });

  describe('phase tracking', () => {
    it('starts at DISCOVERY', () => {
      expect(mem.getPhase()).toBe('DISCOVERY');
    });

    it('advances phase', () => {
      mem.advancePhase('DESIGN');
      expect(mem.getPhase()).toBe('DESIGN');
    });

    it('tracks phase history', () => {
      mem.advancePhase('DESIGN');
      mem.advancePhase('BUILD');
      const history = mem.getPhaseHistory();
      expect(history).toHaveLength(3);
      expect(history[0].phase).toBe('DISCOVERY');
      expect(history[1].phase).toBe('DESIGN');
      expect(history[2].phase).toBe('BUILD');
    });

    it('stores phase transitions as entries', () => {
      mem.advancePhase('DESIGN');
      const transitions = mem.getByType('phase_transition');
      expect(transitions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('risk tracking', () => {
    it('defaults to R0', () => {
      expect(mem.getRisk()).toBe('R0');
    });

    it('sets risk level', () => {
      mem.setRisk('R2');
      expect(mem.getRisk()).toBe('R2');
    });
  });

  describe('mutation tracking', () => {
    it('starts at 0', () => {
      expect(mem.getMutationCount()).toBe(0);
    });

    it('increments by 1 default', () => {
      mem.incrementMutations();
      expect(mem.getMutationCount()).toBe(1);
    });

    it('increments by N', () => {
      mem.incrementMutations(5);
      expect(mem.getMutationCount()).toBe(5);
    });

    it('accumulates', () => {
      mem.incrementMutations(3);
      mem.incrementMutations(2);
      expect(mem.getMutationCount()).toBe(5);
    });

    it('resets', () => {
      mem.incrementMutations(10);
      mem.resetMutations();
      expect(mem.getMutationCount()).toBe(0);
    });
  });

  describe('decision tracking', () => {
    function makeResult(decision: 'ALLOW' | 'BLOCK' | 'ESCALATE'): GuardPipelineResult {
      return {
        requestId: `req-${Date.now()}`,
        finalDecision: decision,
        results: [],
        executedAt: new Date().toISOString(),
        durationMs: 1,
      };
    }

    it('starts with zero counts', () => {
      const counts = mem.getDecisionCounts();
      expect(counts.allowed).toBe(0);
      expect(counts.blocked).toBe(0);
      expect(counts.escalated).toBe(0);
    });

    it('records ALLOW', () => {
      mem.recordDecision(makeResult('ALLOW'));
      expect(mem.getDecisionCounts().allowed).toBe(1);
    });

    it('records BLOCK', () => {
      mem.recordDecision(makeResult('BLOCK'));
      expect(mem.getDecisionCounts().blocked).toBe(1);
    });

    it('records ESCALATE', () => {
      mem.recordDecision(makeResult('ESCALATE'));
      expect(mem.getDecisionCounts().escalated).toBe(1);
    });

    it('accumulates decisions', () => {
      mem.recordDecision(makeResult('ALLOW'));
      mem.recordDecision(makeResult('ALLOW'));
      mem.recordDecision(makeResult('BLOCK'));
      const counts = mem.getDecisionCounts();
      expect(counts.allowed).toBe(2);
      expect(counts.blocked).toBe(1);
    });

    it('stores decisions as entries', () => {
      mem.recordDecision(makeResult('ALLOW'));
      const decisions = mem.getByType('guard_decision');
      expect(decisions).toHaveLength(1);
    });
  });

  describe('user preferences', () => {
    it('sets and gets preference', () => {
      mem.setPreference('language', 'vi');
      expect(mem.getPreference('language')).toBe('vi');
    });

    it('returns undefined for non-existent', () => {
      expect(mem.getPreference('nope')).toBeUndefined();
    });
  });

  describe('context', () => {
    it('sets and gets context', () => {
      mem.setContext('project', 'CVF');
      expect(mem.getContext('project')).toBe('CVF');
    });
  });

  describe('constraints', () => {
    it('adds and gets constraints', () => {
      mem.addConstraint('budget', 'Max $100');
      mem.addConstraint('scope', 'Frontend only');
      const constraints = mem.getConstraints();
      expect(constraints).toHaveLength(2);
      expect(constraints[0].description).toBe('Max $100');
    });
  });

  describe('snapshot', () => {
    it('creates snapshot', () => {
      mem.advancePhase('BUILD');
      mem.setRisk('R1');
      mem.incrementMutations(5);
      mem.recordDecision({
        requestId: 'r1', finalDecision: 'ALLOW', results: [],
        executedAt: new Date().toISOString(), durationMs: 1,
      });

      const snap = mem.snapshot();
      expect(snap.sessionId).toBe('test-session');
      expect(snap.currentPhase).toBe('BUILD');
      expect(snap.currentRisk).toBe('R1');
      expect(snap.mutationCount).toBe(5);
      expect(snap.totalDecisions).toBe(1);
      expect(snap.allowedCount).toBe(1);
      expect(snap.phaseHistory).toHaveLength(2);
      expect(snap.createdAt).toBeDefined();
      expect(snap.lastActivityAt).toBeDefined();
    });

    it('includes entry count', () => {
      mem.set('a', 1);
      mem.set('b', 2);
      expect(mem.snapshot().entryCount).toBe(2);
    });
  });

  describe('session ID', () => {
    it('uses provided ID', () => {
      expect(mem.getSessionId()).toBe('test-session');
    });

    it('generates ID when not provided', () => {
      const auto = new SessionMemory();
      expect(auto.getSessionId()).toMatch(/^session-/);
    });
  });
});
