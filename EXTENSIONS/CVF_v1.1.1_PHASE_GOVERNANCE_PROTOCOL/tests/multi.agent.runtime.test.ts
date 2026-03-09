/**
 * Multi-Agent Runtime Tests -- Track IV Phase E
 *
 * Tests tenant management, agent lifecycle, resource locking,
 * conflict detection, message bus, session TTL, and health summary.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MultiAgentRuntime } from '../governance/guard_runtime/cloud/multi.agent.runtime.js';

describe('MultiAgentRuntime', () => {
  let runtime: MultiAgentRuntime;

  beforeEach(() => {
    runtime = new MultiAgentRuntime();
  });

  // --- Tenant Management ---

  describe('tenant management', () => {
    it('creates a tenant', () => {
      const t = runtime.createTenant({
        id: 'tenant-1', name: 'Acme Corp', maxAgents: 5,
        allowedRiskLevels: ['R0', 'R1', 'R2'], guardPreset: 'full',
      });
      expect(t.id).toBe('tenant-1');
      expect(t.createdAt).toBeDefined();
    });

    it('rejects duplicate tenant id', () => {
      runtime.createTenant({ id: 't1', name: 'A', maxAgents: 5, allowedRiskLevels: ['R0'], guardPreset: 'core' });
      expect(() => runtime.createTenant({ id: 't1', name: 'B', maxAgents: 5, allowedRiskLevels: ['R0'], guardPreset: 'core' }))
        .toThrow('already exists');
    });

    it('getTenant returns registered tenant', () => {
      runtime.createTenant({ id: 't1', name: 'A', maxAgents: 5, allowedRiskLevels: ['R0'], guardPreset: 'core' });
      expect(runtime.getTenant('t1')).toBeDefined();
      expect(runtime.getTenant('unknown')).toBeUndefined();
    });

    it('getAllTenants returns all', () => {
      runtime.createTenant({ id: 't1', name: 'A', maxAgents: 5, allowedRiskLevels: ['R0'], guardPreset: 'core' });
      runtime.createTenant({ id: 't2', name: 'B', maxAgents: 3, allowedRiskLevels: ['R0'], guardPreset: 'full' });
      expect(runtime.getAllTenants()).toHaveLength(2);
    });
  });

  // --- Agent Management ---

  describe('agent management', () => {
    beforeEach(() => {
      runtime.createTenant({ id: 't1', name: 'Acme', maxAgents: 3, allowedRiskLevels: ['R0', 'R1'], guardPreset: 'full' });
    });

    it('registers an agent', () => {
      const a = runtime.registerAgent({
        id: 'agent-1', name: 'Claude', role: 'AI_AGENT',
        capabilities: ['write_code', 'review'], maxRiskLevel: 'R1', tenantId: 't1',
      });
      expect(a.id).toBe('agent-1');
      expect(a.status).toBe('IDLE');
      expect(a.tenantId).toBe('t1');
    });

    it('rejects duplicate agent id', () => {
      runtime.registerAgent({ id: 'a1', name: 'A', role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 't1' });
      expect(() => runtime.registerAgent({ id: 'a1', name: 'B', role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 't1' }))
        .toThrow('already registered');
    });

    it('rejects agent for unknown tenant', () => {
      expect(() => runtime.registerAgent({ id: 'a1', name: 'A', role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 'unknown' }))
        .toThrow('not found');
    });

    it('enforces tenant max agent limit', () => {
      for (let i = 0; i < 3; i++) {
        runtime.registerAgent({ id: `a${i}`, name: `A${i}`, role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 't1' });
      }
      expect(() => runtime.registerAgent({ id: 'a3', name: 'A3', role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 't1' }))
        .toThrow('max agent limit');
    });

    it('getAgent and getAllAgents', () => {
      runtime.registerAgent({ id: 'a1', name: 'A', role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 't1' });
      expect(runtime.getAgent('a1')).toBeDefined();
      expect(runtime.getAgent('unknown')).toBeUndefined();
      expect(runtime.getAllAgents()).toHaveLength(1);
      expect(runtime.getAgentCount()).toBe(1);
    });

    it('getAgentsByTenant filters correctly', () => {
      runtime.createTenant({ id: 't2', name: 'B', maxAgents: 5, allowedRiskLevels: ['R0'], guardPreset: 'core' });
      runtime.registerAgent({ id: 'a1', name: 'A', role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 't1' });
      runtime.registerAgent({ id: 'a2', name: 'B', role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 't2' });
      expect(runtime.getAgentsByTenant('t1')).toHaveLength(1);
      expect(runtime.getAgentsByTenant('t2')).toHaveLength(1);
    });

    it('activates agent', () => {
      runtime.registerAgent({ id: 'a1', name: 'A', role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 't1' });
      expect(runtime.activateAgent('a1')).toBe(true);
      expect(runtime.getAgent('a1')!.status).toBe('ACTIVE');
    });

    it('suspends agent', () => {
      runtime.registerAgent({ id: 'a1', name: 'A', role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 't1' });
      runtime.activateAgent('a1');
      expect(runtime.suspendAgent('a1', 'policy violation')).toBe(true);
      expect(runtime.getAgent('a1')!.status).toBe('SUSPENDED');
    });

    it('terminates agent', () => {
      runtime.registerAgent({ id: 'a1', name: 'A', role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 't1' });
      expect(runtime.terminateAgent('a1')).toBe(true);
      expect(runtime.getAgent('a1')!.status).toBe('TERMINATED');
    });

    it('cannot activate terminated agent', () => {
      runtime.registerAgent({ id: 'a1', name: 'A', role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 't1' });
      runtime.terminateAgent('a1');
      expect(runtime.activateAgent('a1')).toBe(false);
    });

    it('returns false for unknown agent operations', () => {
      expect(runtime.activateAgent('unknown')).toBe(false);
      expect(runtime.suspendAgent('unknown')).toBe(false);
      expect(runtime.terminateAgent('unknown')).toBe(false);
    });
  });

  // --- Resource Locking ---

  describe('resource locking', () => {
    beforeEach(() => {
      runtime.createTenant({ id: 't1', name: 'A', maxAgents: 5, allowedRiskLevels: ['R0'], guardPreset: 'core' });
      runtime.registerAgent({ id: 'a1', name: 'A1', role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 't1' });
      runtime.registerAgent({ id: 'a2', name: 'A2', role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 't1' });
      runtime.activateAgent('a1');
      runtime.activateAgent('a2');
    });

    it('acquires lock on resource', () => {
      expect(runtime.acquireLock('a1', 'src/app.ts')).toBe(true);
      expect(runtime.getLockHolder('src/app.ts')).toBe('a1');
    });

    it('blocks lock acquisition by another agent', () => {
      runtime.acquireLock('a1', 'src/app.ts');
      expect(runtime.acquireLock('a2', 'src/app.ts')).toBe(false);
    });

    it('allows same agent to re-acquire own lock', () => {
      runtime.acquireLock('a1', 'src/app.ts');
      expect(runtime.acquireLock('a1', 'src/app.ts')).toBe(true);
    });

    it('releases lock', () => {
      runtime.acquireLock('a1', 'src/app.ts');
      expect(runtime.releaseLock('a1', 'src/app.ts')).toBe(true);
      expect(runtime.getLockHolder('src/app.ts')).toBeUndefined();
    });

    it('cannot release lock held by another agent', () => {
      runtime.acquireLock('a1', 'src/app.ts');
      expect(runtime.releaseLock('a2', 'src/app.ts')).toBe(false);
    });

    it('getLockedResources returns agent locks', () => {
      runtime.acquireLock('a1', 'src/a.ts');
      runtime.acquireLock('a1', 'src/b.ts');
      expect(runtime.getLockedResources('a1')).toHaveLength(2);
    });

    it('suspending agent releases all locks', () => {
      runtime.acquireLock('a1', 'src/a.ts');
      runtime.acquireLock('a1', 'src/b.ts');
      runtime.suspendAgent('a1');
      expect(runtime.getLockedResources('a1')).toHaveLength(0);
    });

    it('inactive agent cannot acquire lock', () => {
      runtime.suspendAgent('a1');
      expect(runtime.acquireLock('a1', 'src/app.ts')).toBe(false);
    });
  });

  // --- Conflict Detection ---

  describe('conflict detection', () => {
    beforeEach(() => {
      runtime.createTenant({ id: 't1', name: 'A', maxAgents: 5, allowedRiskLevels: ['R0'], guardPreset: 'core' });
      runtime.registerAgent({ id: 'a1', name: 'A1', role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 't1' });
      runtime.registerAgent({ id: 'a2', name: 'A2', role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 't1' });
      runtime.activateAgent('a1');
      runtime.activateAgent('a2');
    });

    it('records conflict when lock contention occurs', () => {
      runtime.acquireLock('a1', 'src/app.ts');
      runtime.acquireLock('a2', 'src/app.ts');
      const conflicts = runtime.getConflicts();
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]!.resource).toBe('src/app.ts');
      expect(conflicts[0]!.agentIds).toContain('a1');
      expect(conflicts[0]!.agentIds).toContain('a2');
    });

    it('resolves conflict', () => {
      runtime.acquireLock('a1', 'src/app.ts');
      runtime.acquireLock('a2', 'src/app.ts');
      const conflict = runtime.getConflicts()[0]!;
      expect(runtime.resolveConflict(conflict.id, 'a1 wins')).toBe(true);
      expect(runtime.getConflicts()).toHaveLength(0);
      expect(runtime.getConflicts(true)).toHaveLength(1);
    });

    it('cannot resolve already resolved conflict', () => {
      runtime.acquireLock('a1', 'src/app.ts');
      runtime.acquireLock('a2', 'src/app.ts');
      const conflict = runtime.getConflicts()[0]!;
      runtime.resolveConflict(conflict.id, 'resolved');
      expect(runtime.resolveConflict(conflict.id, 'again')).toBe(false);
    });
  });

  // --- Message Bus ---

  describe('message bus', () => {
    it('sends and receives messages', () => {
      const msg = runtime.sendMessage({
        fromAgentId: 'a1', toAgentId: 'a2', type: 'TASK_ASSIGN',
        payload: { task: 'write_code' },
      });
      expect(msg.id).toBeDefined();
      expect(msg.timestamp).toBeDefined();
      expect(runtime.getMessages('a2')).toHaveLength(1);
    });

    it('broadcasts to all agents', () => {
      runtime.sendMessage({
        fromAgentId: 'a1', toAgentId: '*', type: 'HEARTBEAT', payload: {},
      });
      expect(runtime.getMessages('a2')).toHaveLength(1);
      expect(runtime.getMessages('a3')).toHaveLength(1);
    });

    it('getAllMessages returns all', () => {
      runtime.sendMessage({ fromAgentId: 'a1', toAgentId: 'a2', type: 'TASK_ASSIGN', payload: {} });
      runtime.sendMessage({ fromAgentId: 'a2', toAgentId: 'a1', type: 'TASK_COMPLETE', payload: {} });
      expect(runtime.getAllMessages()).toHaveLength(2);
    });
  });

  // --- Session TTL ---

  describe('session TTL', () => {
    it('expires agents past TTL', () => {
      runtime.createTenant({ id: 't1', name: 'A', maxAgents: 5, allowedRiskLevels: ['R0'], guardPreset: 'core' });
      runtime.registerAgent({
        id: 'a1', name: 'A1', role: 'AI_AGENT', capabilities: [],
        maxRiskLevel: 'R0', tenantId: 't1', sessionTtlMs: 1,
      });
      runtime.activateAgent('a1');

      // Wait a tiny bit to ensure expiry
      const agent = runtime.getAgent('a1')!;
      // Manually backdate lastActiveAt
      agent.lastActiveAt = new Date(Date.now() - 100).toISOString();

      const expired = runtime.checkSessionExpiry();
      expect(expired).toHaveLength(1);
      expect(expired[0]!.id).toBe('a1');
      expect(runtime.getAgent('a1')!.status).toBe('SUSPENDED');
    });

    it('does not expire active agents within TTL', () => {
      runtime.createTenant({ id: 't1', name: 'A', maxAgents: 5, allowedRiskLevels: ['R0'], guardPreset: 'core' });
      runtime.registerAgent({
        id: 'a1', name: 'A1', role: 'AI_AGENT', capabilities: [],
        maxRiskLevel: 'R0', tenantId: 't1', sessionTtlMs: 3600000,
      });
      runtime.activateAgent('a1');
      const expired = runtime.checkSessionExpiry();
      expect(expired).toHaveLength(0);
    });
  });

  // --- Health Summary ---

  describe('health summary', () => {
    it('returns complete summary', () => {
      runtime.createTenant({ id: 't1', name: 'A', maxAgents: 5, allowedRiskLevels: ['R0'], guardPreset: 'core' });
      runtime.registerAgent({ id: 'a1', name: 'A', role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 't1' });
      runtime.registerAgent({ id: 'a2', name: 'B', role: 'AI_AGENT', capabilities: [], maxRiskLevel: 'R0', tenantId: 't1' });
      runtime.activateAgent('a1');
      runtime.suspendAgent('a2');

      const health = runtime.getHealthSummary();
      expect(health.totalAgents).toBe(2);
      expect(health.active).toBe(1);
      expect(health.suspended).toBe(1);
      expect(health.tenantCount).toBe(1);
    });
  });

  // --- E2E Integration ---

  describe('E2E: multi-tenant multi-agent workflow', () => {
    it('coordinates agents across tenants with conflict resolution', () => {
      // Setup tenants
      runtime.createTenant({ id: 'acme', name: 'Acme Corp', maxAgents: 3, allowedRiskLevels: ['R0', 'R1'], guardPreset: 'full' });
      runtime.createTenant({ id: 'beta', name: 'Beta Inc', maxAgents: 2, allowedRiskLevels: ['R0'], guardPreset: 'core' });

      // Register agents
      runtime.registerAgent({ id: 'claude-1', name: 'Claude', role: 'AI_AGENT', capabilities: ['write'], maxRiskLevel: 'R1', tenantId: 'acme' });
      runtime.registerAgent({ id: 'gpt-1', name: 'GPT', role: 'AI_AGENT', capabilities: ['review'], maxRiskLevel: 'R0', tenantId: 'beta' });

      // Activate
      runtime.activateAgent('claude-1');
      runtime.activateAgent('gpt-1');

      // Claude locks a file
      expect(runtime.acquireLock('claude-1', 'src/core.ts')).toBe(true);

      // GPT tries same file -> conflict
      expect(runtime.acquireLock('gpt-1', 'src/core.ts')).toBe(false);
      expect(runtime.getConflicts()).toHaveLength(1);

      // Send message to coordinate
      runtime.sendMessage({
        fromAgentId: 'gpt-1', toAgentId: 'claude-1',
        type: 'CONFLICT', payload: { resource: 'src/core.ts' },
      });

      // Resolve conflict
      const conflict = runtime.getConflicts()[0]!;
      runtime.resolveConflict(conflict.id, 'claude-1 finishes first');

      // Claude releases lock
      runtime.releaseLock('claude-1', 'src/core.ts');

      // GPT can now acquire
      expect(runtime.acquireLock('gpt-1', 'src/core.ts')).toBe(true);

      // Health check
      const health = runtime.getHealthSummary();
      expect(health.totalAgents).toBe(2);
      expect(health.active).toBe(2);
      expect(health.tenantCount).toBe(2);
      expect(health.unresolvedConflicts).toBe(0);
    });
  });
});
