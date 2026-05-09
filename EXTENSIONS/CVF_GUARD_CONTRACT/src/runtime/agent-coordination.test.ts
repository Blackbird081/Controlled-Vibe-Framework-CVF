/**
 * CVF Agent Coordination Bus — Tests (W6-T2)
 * ============================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   - Agent register / deregister / list
 *   - BROADCAST delivery (all agents except sender)
 *   - DIRECT delivery (specified recipients only)
 *   - Guard BLOCK stops delivery
 *   - QUORUM_REQUEST opens tracker (PENDING)
 *   - QUORUM_RESPONSE accumulates acks → QUORUM_MET
 *   - Unregistered sender is BLOCKED
 *   - Unknown recipient is silently excluded
 *   - Message log and result log
 *   - clearLogs
 *   - buildCoordinationMessage helper
 *   - createCoordinationBus factory
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AgentCoordinationBus,
  createCoordinationBus,
  buildCoordinationMessage,
} from './agent-coordination';
import { GuardRuntimeEngine } from '../engine';
import type { AgentRegistration, AgentCoordinationMessage } from '../types';

// ─── Fixtures ────────────────────────────────────────────────────────

function makeAgent(id: string, overrides: Partial<AgentRegistration> = {}): AgentRegistration {
  return {
    agentId: id,
    role: 'BUILDER',
    phase: 'BUILD',
    registeredAt: '2026-03-23T00:00:00.000Z',
    capabilities: ['write', 'read'],
    ...overrides,
  };
}

function makeMsg(
  overrides: Partial<AgentCoordinationMessage> & { fromAgentId: string },
): AgentCoordinationMessage {
  return buildCoordinationMessage({
    id: overrides.id ?? `msg-${Math.random().toString(36).slice(2)}`,
    type: overrides.type ?? 'BROADCAST',
    fromAgentId: overrides.fromAgentId,
    toAgentIds: overrides.toAgentIds,
    payload: overrides.payload ?? { data: 'test' },
    phase: overrides.phase ?? 'BUILD',
    riskLevel: overrides.riskLevel ?? 'R0',
    quorumRequired: overrides.quorumRequired,
  });
}

/** Build an engine that always ALLOWs (for isolation). */
function allowEngine(): GuardRuntimeEngine {
  return new GuardRuntimeEngine({ strictMode: false, enableAuditLog: false });
}

/** Build an engine that always BLOCKs (for guard-block tests). */
function blockEngine(): GuardRuntimeEngine {
  const engine = new GuardRuntimeEngine({ strictMode: true, enableAuditLog: false });
  // Register a guard that always blocks
  engine.registerGuard({
    id: 'always_block',
    name: 'Always Block',
    description: 'Test guard that always blocks',
    priority: 1,
    enabled: true,
    evaluate: (_ctx) => ({
      guardId: 'always_block',
      decision: 'BLOCK',
      severity: 'ERROR',
      reason: 'Forced block for test',
      timestamp: new Date().toISOString(),
    }),
  });
  return engine;
}

// ─── Suite ───────────────────────────────────────────────────────────

describe('AgentCoordinationBus', () => {
  let bus: AgentCoordinationBus;

  beforeEach(() => {
    bus = new AgentCoordinationBus(allowEngine());
  });

  // ── Registry ───────────────────────────────────────────────────────

  describe('register / deregister / listAgents', () => {
    it('registers a single agent', () => {
      bus.register(makeAgent('agent-1'));
      expect(bus.listAgents()).toHaveLength(1);
      expect(bus.isRegistered('agent-1')).toBe(true);
    });

    it('replaces registration for same agentId', () => {
      bus.register(makeAgent('agent-1', { phase: 'BUILD' }));
      bus.register(makeAgent('agent-1', { phase: 'REVIEW' }));
      const agents = bus.listAgents();
      expect(agents).toHaveLength(1);
      expect(agents[0].phase).toBe('REVIEW');
    });

    it('deregisters an agent', () => {
      bus.register(makeAgent('agent-1'));
      bus.deregister('agent-1');
      expect(bus.isRegistered('agent-1')).toBe(false);
      expect(bus.listAgents()).toHaveLength(0);
    });

    it('silently no-ops deregister of unknown agentId', () => {
      expect(() => bus.deregister('unknown')).not.toThrow();
    });

    it('returns snapshot — mutation of result does not affect bus', () => {
      bus.register(makeAgent('agent-1'));
      const snapshot = bus.listAgents();
      snapshot.push(makeAgent('intruder'));
      expect(bus.listAgents()).toHaveLength(1);
    });
  });

  // ── BROADCAST ──────────────────────────────────────────────────────

  describe('BROADCAST messages', () => {
    it('delivers to all agents except sender', () => {
      bus.register(makeAgent('agent-1'));
      bus.register(makeAgent('agent-2'));
      bus.register(makeAgent('agent-3'));

      const result = bus.send(makeMsg({ fromAgentId: 'agent-1', type: 'BROADCAST' }));

      expect(result.status).toBe('DELIVERED');
      expect(result.deliveredTo).toContain('agent-2');
      expect(result.deliveredTo).toContain('agent-3');
      expect(result.deliveredTo).not.toContain('agent-1');
    });

    it('delivers to empty list when sender is the only agent', () => {
      bus.register(makeAgent('agent-1'));
      const result = bus.send(makeMsg({ fromAgentId: 'agent-1', type: 'BROADCAST' }));
      expect(result.status).toBe('DELIVERED');
      expect(result.deliveredTo).toHaveLength(0);
    });
  });

  // ── DIRECT ─────────────────────────────────────────────────────────

  describe('DIRECT messages', () => {
    it('delivers only to specified registered recipients', () => {
      bus.register(makeAgent('agent-1'));
      bus.register(makeAgent('agent-2'));
      bus.register(makeAgent('agent-3'));

      const result = bus.send(
        makeMsg({ fromAgentId: 'agent-1', type: 'DIRECT', toAgentIds: ['agent-2'] }),
      );

      expect(result.status).toBe('DELIVERED');
      expect(result.deliveredTo).toEqual(['agent-2']);
    });

    it('excludes unregistered recipients from DIRECT delivery', () => {
      bus.register(makeAgent('agent-1'));
      bus.register(makeAgent('agent-2'));

      const result = bus.send(
        makeMsg({
          fromAgentId: 'agent-1',
          type: 'DIRECT',
          toAgentIds: ['agent-2', 'ghost-agent'],
        }),
      );

      expect(result.deliveredTo).toEqual(['agent-2']);
    });

    it('excludes sender from DIRECT recipients even if explicitly listed', () => {
      bus.register(makeAgent('agent-1'));
      bus.register(makeAgent('agent-2'));

      const result = bus.send(
        makeMsg({
          fromAgentId: 'agent-1',
          type: 'DIRECT',
          toAgentIds: ['agent-1', 'agent-2'],
        }),
      );

      expect(result.deliveredTo).not.toContain('agent-1');
      expect(result.deliveredTo).toContain('agent-2');
    });
  });

  // ── Guard Block ────────────────────────────────────────────────────

  describe('guard enforcement', () => {
    it('blocks delivery when guard returns BLOCK', () => {
      const blockedBus = new AgentCoordinationBus(blockEngine());
      blockedBus.register(makeAgent('agent-1'));
      blockedBus.register(makeAgent('agent-2'));

      const result = blockedBus.send(makeMsg({ fromAgentId: 'agent-1', type: 'BROADCAST' }));

      expect(result.status).toBe('BLOCKED');
      expect(result.deliveredTo).toHaveLength(0);
      expect(result.guardDecision).toBe('BLOCK');
    });

    it('records guard decision on successful delivery', () => {
      bus.register(makeAgent('agent-1'));
      bus.register(makeAgent('agent-2'));
      const result = bus.send(makeMsg({ fromAgentId: 'agent-1', type: 'BROADCAST' }));
      expect(result.guardDecision).toBe('ALLOW');
    });
  });

  // ── Unregistered Sender ────────────────────────────────────────────

  describe('unregistered sender', () => {
    it('blocks message from unregistered sender', () => {
      bus.register(makeAgent('agent-2'));
      const result = bus.send(makeMsg({ fromAgentId: 'ghost', type: 'BROADCAST' }));
      expect(result.status).toBe('BLOCKED');
      expect(result.blockedBy).toBe('sender_not_registered');
    });
  });

  // ── QUORUM_REQUEST ─────────────────────────────────────────────────

  describe('QUORUM_REQUEST', () => {
    it('opens a PENDING tracker when recipients > 0', () => {
      bus.register(makeAgent('agent-1'));
      bus.register(makeAgent('agent-2'));
      bus.register(makeAgent('agent-3'));

      const result = bus.send(
        makeMsg({ fromAgentId: 'agent-1', type: 'QUORUM_REQUEST', quorumRequired: 2 }),
      );

      expect(result.status).toBe('PENDING');
      expect(result.quorumRequired).toBe(2);
      expect(result.quorumAcks).toBe(0);
    });

    it('sets QUORUM_FAILED when no recipients', () => {
      bus.register(makeAgent('agent-1'));
      const result = bus.send(
        makeMsg({ fromAgentId: 'agent-1', type: 'QUORUM_REQUEST', quorumRequired: 1 }),
      );
      expect(result.status).toBe('QUORUM_FAILED');
    });
  });

  // ── QUORUM_RESPONSE ────────────────────────────────────────────────

  describe('QUORUM_RESPONSE', () => {
    it('reaches QUORUM_MET when enough acks arrive', () => {
      bus.register(makeAgent('agent-1'));
      bus.register(makeAgent('agent-2'));
      bus.register(makeAgent('agent-3'));

      // Open quorum request from agent-1 requiring 2 acks
      const reqMsg = makeMsg({
        id: 'req-001',
        fromAgentId: 'agent-1',
        type: 'QUORUM_REQUEST',
        quorumRequired: 2,
      });
      bus.send(reqMsg);

      // First ack from agent-2
      const ack1 = makeMsg({
        fromAgentId: 'agent-2',
        type: 'QUORUM_RESPONSE',
        payload: { quorumRequestId: 'req-001' },
      });
      const r1 = bus.send(ack1);
      expect(r1.status).toBe('DELIVERED'); // quorum not yet met

      // Second ack from agent-3 → quorum met
      const ack2 = makeMsg({
        fromAgentId: 'agent-3',
        type: 'QUORUM_RESPONSE',
        payload: { quorumRequestId: 'req-001' },
      });
      const r2 = bus.send(ack2);
      expect(r2.status).toBe('QUORUM_MET');
      expect(r2.quorumAcks).toBe(2);
    });

    it('does not double-count duplicate acks from same agent', () => {
      bus.register(makeAgent('agent-1'));
      bus.register(makeAgent('agent-2'));
      bus.register(makeAgent('agent-3'));

      bus.send(makeMsg({ id: 'req-002', fromAgentId: 'agent-1', type: 'QUORUM_REQUEST', quorumRequired: 2 }));

      const ack = makeMsg({
        fromAgentId: 'agent-2',
        type: 'QUORUM_RESPONSE',
        payload: { quorumRequestId: 'req-002' },
      });
      bus.send(ack);
      const r2 = bus.send(ack); // same agent sending again
      expect(r2.quorumAcks).toBe(1); // still 1, not 2
      expect(r2.status).toBe('DELIVERED'); // quorum not met
    });
  });

  // ── Logs ──────────────────────────────────────────────────────────

  describe('message log / result log', () => {
    it('logs every sent message including blocked ones', () => {
      bus.register(makeAgent('agent-1'));
      bus.send(makeMsg({ fromAgentId: 'agent-1', type: 'BROADCAST' }));
      bus.send(makeMsg({ fromAgentId: 'ghost', type: 'BROADCAST' })); // blocked

      expect(bus.getMessageLog()).toHaveLength(2);
    });

    it('getResultLog returns one result per send call', () => {
      bus.register(makeAgent('agent-1'));
      bus.send(makeMsg({ fromAgentId: 'agent-1', type: 'BROADCAST' }));
      expect(bus.getResultLog()).toHaveLength(1);
    });

    it('clearLogs resets both logs', () => {
      bus.register(makeAgent('agent-1'));
      bus.send(makeMsg({ fromAgentId: 'agent-1', type: 'BROADCAST' }));
      bus.clearLogs();
      expect(bus.getMessageLog()).toHaveLength(0);
      expect(bus.getResultLog()).toHaveLength(0);
    });

    it('getMessageLog returns a snapshot — mutation does not affect bus', () => {
      bus.register(makeAgent('agent-1'));
      bus.send(makeMsg({ fromAgentId: 'agent-1', type: 'BROADCAST' }));
      const snap = bus.getMessageLog();
      snap.push({} as AgentCoordinationMessage);
      expect(bus.getMessageLog()).toHaveLength(1);
    });
  });
});

// ─── Factory ─────────────────────────────────────────────────────────

describe('createCoordinationBus', () => {
  it('returns a working AgentCoordinationBus with default engine', () => {
    const bus = createCoordinationBus();
    bus.register(makeAgent('agent-1'));
    expect(bus.isRegistered('agent-1')).toBe(true);
  });

  it('accepts a custom engine', () => {
    const bus = createCoordinationBus(allowEngine());
    bus.register(makeAgent('agent-1'));
    bus.register(makeAgent('agent-2'));
    const result = bus.send(makeMsg({ fromAgentId: 'agent-1', type: 'BROADCAST' }));
    expect(result.status).toBe('DELIVERED');
  });
});

// ─── buildCoordinationMessage ─────────────────────────────────────────

describe('buildCoordinationMessage', () => {
  it('fills defaults for id, phase, riskLevel, payload', () => {
    const msg = buildCoordinationMessage({ fromAgentId: 'agent-1', type: 'BROADCAST' });
    expect(msg.fromAgentId).toBe('agent-1');
    expect(msg.type).toBe('BROADCAST');
    expect(msg.phase).toBe('BUILD');
    expect(msg.riskLevel).toBe('R1');
    expect(msg.payload).toEqual({});
    expect(msg.id).toBeTruthy();
  });

  it('respects explicit overrides', () => {
    const msg = buildCoordinationMessage({
      id: 'custom-id',
      fromAgentId: 'agent-x',
      type: 'DIRECT',
      phase: 'REVIEW',
      riskLevel: 'R2',
      payload: { key: 'value' },
    });
    expect(msg.id).toBe('custom-id');
    expect(msg.phase).toBe('REVIEW');
    expect(msg.riskLevel).toBe('R2');
    expect(msg.payload).toEqual({ key: 'value' });
  });
});
