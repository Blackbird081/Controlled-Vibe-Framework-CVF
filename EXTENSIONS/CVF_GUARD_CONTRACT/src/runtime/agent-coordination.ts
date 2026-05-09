/**
 * CVF Agent Coordination Bus (W6-T2)
 * ====================================
 * Multi-agent coordination layer — governed message routing between agents.
 *
 * Guarantees:
 *   - Every message is guard-evaluated before delivery.
 *   - BLOCKED messages are logged but not delivered.
 *   - QUORUM_REQUEST waits for enough QUORUM_RESPONSE acks before resolving.
 *   - Agents must be registered before they can send or receive.
 *
 * @module cvf-guard-contract/runtime/agent-coordination
 */

import type {
  CVFPhase,
  CVFRiskLevel,
  CVFRole,
  GuardDecision,
  AgentRegistration,
  AgentCoordinationMessage,
  AgentCoordinationMessageType,
  AgentCoordinationResult,
  AgentCoordinationStatus,
} from '../types';
import { GuardRuntimeEngine } from '../engine';
import { createGuardEngine } from '../index';

// ─── Internal ────────────────────────────────────────────────────────

interface QuorumTracker {
  messageId: string;
  required: number;
  acks: string[];
}

// ─── Bus ─────────────────────────────────────────────────────────────

/**
 * AgentCoordinationBus
 * ---------------------
 * Registry + governed message router for multiple CVF agents.
 * One bus per coordination scope (e.g. per session, per pipeline run).
 */
export class AgentCoordinationBus {
  private agents: Map<string, AgentRegistration> = new Map();
  private messageLog: AgentCoordinationMessage[] = [];
  private resultLog: AgentCoordinationResult[] = [];
  private quorumTrackers: Map<string, QuorumTracker> = new Map();
  private readonly engine: GuardRuntimeEngine;

  constructor(engine?: GuardRuntimeEngine) {
    this.engine = engine ?? createGuardEngine({ strictMode: false });
  }

  // ─── Registry ──────────────────────────────────────────────────────

  /**
   * Register an agent with the bus.
   * Replaces any existing registration for the same agentId.
   */
  register(agent: AgentRegistration): void {
    this.agents.set(agent.agentId, { ...agent });
  }

  /**
   * Remove an agent from the bus.
   * Silently no-ops if the agentId is not registered.
   */
  deregister(agentId: string): void {
    this.agents.delete(agentId);
  }

  /** Snapshot of all currently registered agents. */
  listAgents(): AgentRegistration[] {
    return Array.from(this.agents.values());
  }

  isRegistered(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  // ─── Messaging ─────────────────────────────────────────────────────

  /**
   * Send a coordination message.
   *
   * Flow:
   *   1. Validate sender is registered.
   *   2. Guard-evaluate the message context.
   *   3. If BLOCK → return BLOCKED result; message is logged but not delivered.
   *   4. Resolve recipients (BROADCAST = all agents except sender).
   *   5. For QUORUM_REQUEST → open a tracker; resolve immediately if quorum already met.
   *   6. For QUORUM_RESPONSE → close matching tracker if ack threshold reached.
   *   7. Log and return result.
   */
  send(message: AgentCoordinationMessage): AgentCoordinationResult {
    this.messageLog.push({ ...message });

    // ── 1. Sender must be registered ──
    if (!this.agents.has(message.fromAgentId)) {
      const result = this.buildResult(message, 'BLOCKED', [], 'sender_not_registered', 'BLOCK');
      this.resultLog.push(result);
      return result;
    }

    // ── 2. Guard evaluation ──
    const guardResult = this.engine.evaluate({
      requestId: message.id,
      phase: message.phase,
      riskLevel: message.riskLevel,
      role: this.agents.get(message.fromAgentId)!.role,
      agentId: message.fromAgentId,
      action: `agent_coordination:${message.type}`,
      channel: 'api',
      metadata: { coordinationMessageType: message.type },
    });

    if (guardResult.finalDecision === 'BLOCK') {
      const result = this.buildResult(
        message,
        'BLOCKED',
        [],
        guardResult.blockedBy ?? 'guard_block',
        'BLOCK',
      );
      this.resultLog.push(result);
      return result;
    }

    // ── 3. Resolve recipients ──
    const recipients = this.resolveRecipients(message);

    // ── 4. Handle QUORUM_REQUEST ──
    if (message.type === 'QUORUM_REQUEST') {
      return this.handleQuorumRequest(message, recipients, guardResult.finalDecision);
    }

    // ── 5. Handle QUORUM_RESPONSE ──
    if (message.type === 'QUORUM_RESPONSE') {
      return this.handleQuorumResponse(message, recipients, guardResult.finalDecision);
    }

    // ── 6. BROADCAST / DIRECT ──
    const result = this.buildResult(
      message,
      'DELIVERED',
      recipients,
      undefined,
      guardResult.finalDecision,
    );
    this.resultLog.push(result);
    return result;
  }

  // ─── Logs ──────────────────────────────────────────────────────────

  getMessageLog(): AgentCoordinationMessage[] {
    return [...this.messageLog];
  }

  getResultLog(): AgentCoordinationResult[] {
    return [...this.resultLog];
  }

  clearLogs(): void {
    this.messageLog = [];
    this.resultLog = [];
  }

  // ─── Internal Helpers ──────────────────────────────────────────────

  private resolveRecipients(message: AgentCoordinationMessage): string[] {
    if (message.toAgentIds && message.toAgentIds.length > 0) {
      // DIRECT: filter to registered agents only (excluding sender)
      return message.toAgentIds.filter(
        (id) => id !== message.fromAgentId && this.agents.has(id),
      );
    }
    // BROADCAST: all agents except sender
    return Array.from(this.agents.keys()).filter((id) => id !== message.fromAgentId);
  }

  private handleQuorumRequest(
    message: AgentCoordinationMessage,
    recipients: string[],
    guardDecision: GuardDecision,
  ): AgentCoordinationResult {
    const required = message.quorumRequired ?? Math.ceil(recipients.length / 2) + 1;
    this.quorumTrackers.set(message.id, { messageId: message.id, required, acks: [] });

    const status: AgentCoordinationStatus =
      recipients.length === 0 ? 'QUORUM_FAILED' : 'PENDING';

    const result = this.buildResult(message, status, recipients, undefined, guardDecision, {
      quorumAcks: 0,
      quorumRequired: required,
    });
    this.resultLog.push(result);
    return result;
  }

  private handleQuorumResponse(
    message: AgentCoordinationMessage,
    recipients: string[],
    guardDecision: GuardDecision,
  ): AgentCoordinationResult {
    // payload.quorumRequestId links this response to its request
    const requestId = message.payload['quorumRequestId'] as string | undefined;
    const tracker = requestId ? this.quorumTrackers.get(requestId) : undefined;

    if (tracker && !tracker.acks.includes(message.fromAgentId)) {
      tracker.acks.push(message.fromAgentId);
    }

    const quorumMet = tracker ? tracker.acks.length >= tracker.required : false;
    if (quorumMet && tracker) {
      this.quorumTrackers.delete(requestId!);
    }

    const status: AgentCoordinationStatus = quorumMet ? 'QUORUM_MET' : 'DELIVERED';
    const result = this.buildResult(message, status, recipients, undefined, guardDecision, {
      quorumAcks: tracker?.acks.length ?? 0,
      quorumRequired: tracker?.required,
    });
    this.resultLog.push(result);
    return result;
  }

  private buildResult(
    message: AgentCoordinationMessage,
    status: AgentCoordinationStatus,
    deliveredTo: string[],
    blockedBy?: string,
    guardDecision?: GuardDecision,
    extra?: { quorumAcks?: number; quorumRequired?: number },
  ): AgentCoordinationResult {
    return {
      messageId: message.id,
      status,
      deliveredTo,
      blockedBy,
      guardDecision,
      quorumAcks: extra?.quorumAcks,
      quorumRequired: extra?.quorumRequired,
      processedAt: new Date().toISOString(),
    };
  }
}

// ─── Factory ─────────────────────────────────────────────────────────

/**
 * Create an AgentCoordinationBus with the default governed guard engine.
 * Pass a custom engine to override guard behaviour in tests.
 */
export function createCoordinationBus(engine?: GuardRuntimeEngine): AgentCoordinationBus {
  return new AgentCoordinationBus(engine);
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Build a minimal AgentCoordinationMessage with sensible defaults. */
export function buildCoordinationMessage(
  overrides: Partial<AgentCoordinationMessage> & {
    fromAgentId: string;
    type: AgentCoordinationMessageType;
  },
): AgentCoordinationMessage {
  return {
    id: overrides.id ?? `coord-${Date.now()}`,
    type: overrides.type,
    fromAgentId: overrides.fromAgentId,
    toAgentIds: overrides.toAgentIds,
    payload: overrides.payload ?? {},
    sentAt: overrides.sentAt ?? new Date().toISOString(),
    phase: overrides.phase ?? 'BUILD',
    riskLevel: overrides.riskLevel ?? 'R1',
    quorumRequired: overrides.quorumRequired,
  };
}
