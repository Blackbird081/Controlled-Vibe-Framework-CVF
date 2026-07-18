/**
 * INT-1 Generic MCP Adapter Tests — cvf.genericMcpAdapter.int1.v1
 * Tests: cvf_validate_plan + cvf_emit_agent_event
 */

import { describe, it, expect } from 'vitest';
import {
  emitInt1AgentEvent,
  INT1_CONTRACT,
  validateInt1Plan,
} from './int1-connection-point-policy';

// ─── cvf_validate_plan ────────────────────────────────────────────────

describe('cvf_validate_plan', () => {
  it('returns ALLOW_ADVISORY for safe plan', () => {
    const result = validateInt1Plan({
      planSteps: ['read spec', 'write module'],
      toolsRequired: ['file_read', 'file_write'],
      agentRole: 'AI_AGENT',
    });
    expect(result.contractVersion).toBe(INT1_CONTRACT);
    expect(result.advisoryDecision).toBe('ALLOW_ADVISORY');
    expect(result.forbiddenStepsDetected).toHaveLength(0);
    expect(result.runtimeExecutionAuthorized).toBe(false);
    expect(result.connectionPointMode).toBe('advisory');
    expect(result.connectionPointProgression.progressionDisposition).toBe('ADVISORY_ONLY');
    expect(result.connectionPointProgression.acceptedForProgression).toBe(false);
  });

  it('returns REJECT_ADVISORY when plan contains forbidden step', () => {
    const result = validateInt1Plan({
      planSteps: ['read spec', 'delete_all user data'],
      toolsRequired: ['file_read'],
      agentRole: 'AI_AGENT',
    });
    expect(result.advisoryDecision).toBe('REJECT_ADVISORY');
    expect(result.forbiddenStepsDetected).toContain('delete_all user data');
    expect(result.connectionPointMode).toBe('advisory');
    expect(result.connectionPointProgression.progressionDisposition).toBe('ADVISORY_ONLY');
    expect(result.connectionPointProgression.blocked).toBe(false);
  });

  it('returns REVIEW_RECOMMENDED for high-risk plan', () => {
    const result = validateInt1Plan({
      planSteps: Array.from({ length: 10 }, (_, i) => `step_${i}`),
      toolsRequired: Array.from({ length: 10 }, (_, i) => `tool_${i}`),
      agentRole: 'ORCHESTRATOR',
    });
    expect(['REVIEW_RECOMMENDED', 'ALLOW_ADVISORY']).toContain(result.advisoryDecision);
    expect(result.stepCount).toBe(10);
  });

  it('maps enforce mode allow to progression allow', () => {
    const result = validateInt1Plan({
      planSteps: ['step1'],
      toolsRequired: [],
      agentRole: 'AI_AGENT',
      connectionPointMode: 'enforce',
    });
    expect(result.connectionPointMode).toBe('enforce');
    expect(result.advisoryDecision).toBe('ALLOW_ADVISORY');
    expect(result.connectionPointProgression.progressionDisposition).toBe('ALLOW_PROGRESSION');
    expect(result.connectionPointProgression.acceptedForProgression).toBe(true);
    expect(result.connectionPointProgression.blocked).toBe(false);
  });

  it('maps enforce mode review to review hold', () => {
    const result = validateInt1Plan({
      planSteps: Array.from({ length: 10 }, (_, i) => `step_${i}`),
      toolsRequired: Array.from({ length: 10 }, (_, i) => `tool_${i}`),
      agentRole: 'AI_AGENT',
      connectionPointMode: 'enforce',
    });
    expect(result.connectionPointMode).toBe('enforce');
    expect(result.advisoryDecision).toBe('REVIEW_RECOMMENDED');
    expect(result.connectionPointProgression.progressionDisposition).toBe('REVIEW_HOLD');
    expect(result.connectionPointProgression.requiresReview).toBe(true);
    expect(result.connectionPointProgression.acceptedForProgression).toBe(false);
  });

  it('maps enforce mode reject to block progression', () => {
    const result = validateInt1Plan({
      planSteps: ['delete_all users'],
      toolsRequired: ['file_read'],
      agentRole: 'AI_AGENT',
      connectionPointMode: 'enforce',
    });
    expect(result.advisoryDecision).toBe('REJECT_ADVISORY');
    expect(result.connectionPointProgression.progressionDisposition).toBe('REJECT_BLOCK');
    expect(result.connectionPointProgression.blocked).toBe(true);
    expect(result.connectionPointProgression.acceptedForProgression).toBe(false);
  });

  it('falls back to advisory mode when an invalid mode is supplied', () => {
    const result = validateInt1Plan({
      planSteps: ['step1'],
      toolsRequired: ['tool1'],
      agentRole: 'AI_AGENT',
      connectionPointMode: 'invalid-mode',
    });
    expect(result.connectionPointMode).toBe('advisory');
    expect(result.connectionPointProgression.progressionDisposition).toBe('ADVISORY_ONLY');
    expect(result.connectionPointProgression.modeWarning).toContain('invalid_connection_point_mode');
  });

  it('always sets runtimeExecutionAuthorized to false', () => {
    const result = validateInt1Plan({
      planSteps: ['step1'],
      toolsRequired: ['tool1'],
      agentRole: 'OPERATOR',
      connectionPointMode: 'enforce',
    });
    expect(result.runtimeExecutionAuthorized).toBe(false);
    expect(result.connectionPointProgression.blocked || result.connectionPointProgression.acceptedForProgression).toBe(true);
  });
});

// ─── cvf_emit_agent_event ─────────────────────────────────────────────

describe('cvf_emit_agent_event', () => {
  it('accepts valid event type intent.received', () => {
    const result = emitInt1AgentEvent({
      eventType: 'intent.received',
      agentId: 'agent-01',
      payload: { intent: 'build feature' },
    });
    expect(result.accepted).toBe(true);
    expect(result.eventType).toBe('intent.received');
    expect(result.runtimeExecutionAuthorized).toBe(false);
  });

  it('accepts all 5 valid event types', () => {
    const events = ['intent.received', 'plan.created', 'tool.requested', 'execution.state', 'result.produced'];
    for (const eventType of events) {
      const result = emitInt1AgentEvent({ eventType, agentId: 'agent-01', payload: {} });
      expect(result.accepted).toBe(true);
    }
  });

  it('rejects unknown event type', () => {
    const result = emitInt1AgentEvent({
      eventType: 'unknown.event',
      agentId: 'agent-01',
      payload: {},
    });
    expect(result.accepted).toBe(false);
    expect(result.rejectionReason).toContain('unsupported_event_type');
  });

  it('always sets runtimeExecutionAuthorized to false', () => {
    const result = emitInt1AgentEvent({
      eventType: 'tool.requested',
      agentId: 'agent-01',
      payload: { tool: 'file_read' },
    });
    expect(result.runtimeExecutionAuthorized).toBe(false);
  });
});
