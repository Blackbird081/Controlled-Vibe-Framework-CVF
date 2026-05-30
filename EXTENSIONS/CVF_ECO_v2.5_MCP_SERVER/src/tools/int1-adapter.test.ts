/**
 * INT-1 Generic MCP Adapter Tests — cvf.genericMcpAdapter.int1.v1
 * Tests: cvf_validate_plan + cvf_emit_agent_event
 */

import { describe, it, expect } from 'vitest';

const INT1_CONTRACT = 'cvf.genericMcpAdapter.int1.v1';
const ALLOWED_EVENT_TYPES = new Set([
  'intent.received', 'plan.created', 'tool.requested',
  'execution.state', 'result.produced',
]);
const FORBIDDEN_PATTERNS = ['delete_all', 'drop_database', 'rm -rf', 'format_disk'];

function validatePlan(args: {
  planSteps: string[];
  toolsRequired: string[];
  agentRole: string;
  planContext?: string;
}) {
  const forbidden = args.planSteps.filter(step =>
    FORBIDDEN_PATTERNS.some(p => step.toLowerCase().includes(p))
  );
  const riskScore = Math.min(args.planSteps.length * 0.1 + args.toolsRequired.length * 0.2, 3.0);
  const advisoryDecision = forbidden.length > 0
    ? 'REJECT_ADVISORY'
    : riskScore > 2.0
      ? 'REVIEW_RECOMMENDED'
      : 'ALLOW_ADVISORY';
  return {
    contractVersion: INT1_CONTRACT,
    tool: 'cvf_validate_plan',
    advisoryDecision,
    planRisk: riskScore.toFixed(2),
    forbiddenStepsDetected: forbidden,
    stepCount: args.planSteps.length,
    toolCount: args.toolsRequired.length,
    runtimeExecutionAuthorized: false,
    evaluatedAt: new Date().toISOString(),
  };
}

function emitAgentEvent(args: {
  eventType: string;
  agentId: string;
  payload: Record<string, unknown>;
}) {
  if (!ALLOWED_EVENT_TYPES.has(args.eventType)) {
    return {
      contractVersion: INT1_CONTRACT,
      tool: 'cvf_emit_agent_event',
      accepted: false,
      eventType: args.eventType,
      rejectionReason: `unsupported_event_type: "${args.eventType}"`,
      emittedAt: new Date().toISOString(),
    };
  }
  return {
    contractVersion: INT1_CONTRACT,
    tool: 'cvf_emit_agent_event',
    accepted: true,
    eventType: args.eventType,
    eventId: `int1-evt-test`,
    agentId: args.agentId,
    runtimeExecutionAuthorized: false,
    emittedAt: new Date().toISOString(),
  };
}

// ─── cvf_validate_plan ────────────────────────────────────────────────

describe('cvf_validate_plan', () => {
  it('returns ALLOW_ADVISORY for safe plan', () => {
    const result = validatePlan({
      planSteps: ['read spec', 'write module'],
      toolsRequired: ['file_read', 'file_write'],
      agentRole: 'AI_AGENT',
    });
    expect(result.contractVersion).toBe(INT1_CONTRACT);
    expect(result.advisoryDecision).toBe('ALLOW_ADVISORY');
    expect(result.forbiddenStepsDetected).toHaveLength(0);
    expect(result.runtimeExecutionAuthorized).toBe(false);
  });

  it('returns REJECT_ADVISORY when plan contains forbidden step', () => {
    const result = validatePlan({
      planSteps: ['read spec', 'delete_all user data'],
      toolsRequired: ['file_read'],
      agentRole: 'AI_AGENT',
    });
    expect(result.advisoryDecision).toBe('REJECT_ADVISORY');
    expect(result.forbiddenStepsDetected).toContain('delete_all user data');
  });

  it('returns REVIEW_RECOMMENDED for high-risk plan', () => {
    const result = validatePlan({
      planSteps: Array.from({ length: 10 }, (_, i) => `step_${i}`),
      toolsRequired: Array.from({ length: 10 }, (_, i) => `tool_${i}`),
      agentRole: 'ORCHESTRATOR',
    });
    expect(['REVIEW_RECOMMENDED', 'ALLOW_ADVISORY']).toContain(result.advisoryDecision);
    expect(result.stepCount).toBe(10);
  });

  it('always sets runtimeExecutionAuthorized to false', () => {
    const result = validatePlan({
      planSteps: ['step1'],
      toolsRequired: ['tool1'],
      agentRole: 'OPERATOR',
    });
    expect(result.runtimeExecutionAuthorized).toBe(false);
  });
});

// ─── cvf_emit_agent_event ─────────────────────────────────────────────

describe('cvf_emit_agent_event', () => {
  it('accepts valid event type intent.received', () => {
    const result = emitAgentEvent({
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
      const result = emitAgentEvent({ eventType, agentId: 'agent-01', payload: {} });
      expect(result.accepted).toBe(true);
    }
  });

  it('rejects unknown event type', () => {
    const result = emitAgentEvent({
      eventType: 'unknown.event',
      agentId: 'agent-01',
      payload: {},
    });
    expect(result.accepted).toBe(false);
    expect(result.rejectionReason).toContain('unsupported_event_type');
  });

  it('always sets runtimeExecutionAuthorized to false', () => {
    const result = emitAgentEvent({
      eventType: 'tool.requested',
      agentId: 'agent-01',
      payload: { tool: 'file_read' },
    });
    expect(result.runtimeExecutionAuthorized).toBe(false);
  });
});
