/**
 * Agent Handoff Validator — Tests
 * Track 4.1: Agent-to-agent handoff validation
 */

import { describe, test, expect } from 'vitest';
import {
  validateHandoff,
  validateWorkflowChain,
  isHandoffSafe,
  AGENT_CAPABILITIES,
  VALID_HANDOFF_SEQUENCES,
  type HandoffContext,
} from './agent-handoff-validator';

// ─── Helpers ──────────────────────────────────────────────────────────

function ctx(overrides: Partial<HandoffContext> = {}): HandoffContext {
  return {
    workflow: { id: 'wf-1', name: 'Test Workflow', status: 'running' },
    fromTask: {
      id: 'task-1',
      agentId: 'architect',
      output: 'Detailed architecture specification with API contracts and data models.',
      status: 'completed',
    },
    toAgentId: 'builder',
    toAgentRole: 'builder',
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// validateHandoff
// ═══════════════════════════════════════════════════════════════════════

describe('validateHandoff', () => {
  test('ALLOW for valid architect→builder handoff', () => {
    const r = validateHandoff(ctx());
    expect(r.decision).toBe('ALLOW');
    expect(r.issues.length).toBe(0);
    expect(r.contextCarried).toBe(true);
    expect(r.fromAgent).toBe('architect');
    expect(r.toAgent).toBe('builder');
  });

  test('BLOCK when task not completed', () => {
    const r = validateHandoff(ctx({
      fromTask: { id: 't', agentId: 'architect', output: 'some output', status: 'running' },
    }));
    expect(r.decision).toBe('BLOCK');
    expect(r.issues.some(i => i.code === 'TASK_NOT_COMPLETED')).toBe(true);
  });

  test('BLOCK when output is empty', () => {
    const r = validateHandoff(ctx({
      fromTask: { id: 't', agentId: 'architect', output: '', status: 'completed' },
    }));
    expect(r.decision).toBe('BLOCK');
    expect(r.issues.some(i => i.code === 'EMPTY_OUTPUT')).toBe(true);
  });

  test('BLOCK when output is undefined', () => {
    const r = validateHandoff(ctx({
      fromTask: { id: 't', agentId: 'architect', output: undefined, status: 'completed' },
    }));
    expect(r.decision).toBe('BLOCK');
    expect(r.issues.some(i => i.code === 'EMPTY_OUTPUT')).toBe(true);
  });

  test('WARN when output is very short', () => {
    const r = validateHandoff(ctx({
      fromTask: { id: 't', agentId: 'architect', output: 'short', status: 'completed' },
    }));
    expect(r.decision).toBe('WARN');
    expect(r.issues.some(i => i.code === 'OUTPUT_TOO_SHORT')).toBe(true);
  });

  test('BLOCK for invalid handoff sequence', () => {
    const r = validateHandoff(ctx({
      fromTask: { id: 't', agentId: 'builder', output: 'Implementation complete with full code.', status: 'completed' },
      toAgentId: 'architect',
      toAgentRole: 'architect',
    }));
    expect(r.decision).toBe('BLOCK');
    expect(r.issues.some(i => i.code === 'INVALID_SEQUENCE')).toBe(true);
  });

  test('ALLOW for valid builder→reviewer handoff', () => {
    const r = validateHandoff(ctx({
      fromTask: { id: 't', agentId: 'builder', output: 'Full implementation with tests and docs.', status: 'completed' },
      toAgentId: 'reviewer',
      toAgentRole: 'reviewer',
    }));
    expect(r.decision).toBe('ALLOW');
  });

  test('ALLOW for reviewer→builder (send back for fixes)', () => {
    const r = validateHandoff(ctx({
      fromTask: { id: 't', agentId: 'reviewer', output: 'Review feedback: fix these 3 issues in the code.', status: 'completed' },
      toAgentId: 'builder',
      toAgentRole: 'builder',
    }));
    expect(r.decision).toBe('ALLOW');
  });

  test('WARN when previous task had error', () => {
    const r = validateHandoff(ctx({
      fromTask: {
        id: 't',
        agentId: 'architect',
        output: 'Partial output before the error occurred in processing.',
        status: 'completed',
        error: 'Timeout during processing',
      },
    }));
    expect(r.decision).toBe('WARN');
    expect(r.issues.some(i => i.code === 'PREVIOUS_ERROR')).toBe(true);
  });

  test('BLOCK when workflow is in failed state', () => {
    const r = validateHandoff(ctx({
      workflow: { id: 'wf-1', name: 'Test', status: 'failed' },
    }));
    expect(r.decision).toBe('BLOCK');
    expect(r.issues.some(i => i.code === 'WORKFLOW_FAILED')).toBe(true);
  });

  test('outputSummary is truncated for long output', () => {
    const longOutput = 'A'.repeat(200);
    const r = validateHandoff(ctx({
      fromTask: { id: 't', agentId: 'architect', output: longOutput, status: 'completed' },
    }));
    expect(r.outputSummary.length).toBeLessThanOrEqual(103); // 100 + '...'
  });

  test('outputSummary for no output', () => {
    const r = validateHandoff(ctx({
      fromTask: { id: 't', agentId: 'architect', output: '', status: 'completed' },
    }));
    expect(r.outputSummary).toBe('(no output)');
  });

  test('friendly messages are present on all issues', () => {
    const r = validateHandoff(ctx({
      fromTask: { id: 't', agentId: 'architect', output: '', status: 'running' },
    }));
    for (const issue of r.issues) {
      expect(issue.friendlyMessage).toBeTruthy();
      expect(issue.friendlyMessageVi).toBeTruthy();
    }
  });

  test('contextCarried is false on BLOCK', () => {
    const r = validateHandoff(ctx({
      fromTask: { id: 't', agentId: 'architect', output: '', status: 'running' },
    }));
    expect(r.contextCarried).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// validateWorkflowChain
// ═══════════════════════════════════════════════════════════════════════

describe('validateWorkflowChain', () => {
  test('validates each handoff in sequence', () => {
    const workflow = {
      id: 'wf-1',
      name: 'Test Chain',
      description: 'test',
      status: 'running' as const,
      currentAgentIndex: 2,
      agents: [
        { id: 'orchestrator', name: 'Orchestrator', role: 'orchestrator' as const, systemPrompt: '', description: '', descriptionVi: '', icon: '', color: '' },
        { id: 'architect', name: 'Architect', role: 'architect' as const, systemPrompt: '', description: '', descriptionVi: '', icon: '', color: '' },
        { id: 'builder', name: 'Builder', role: 'builder' as const, systemPrompt: '', description: '', descriptionVi: '', icon: '', color: '' },
      ],
      tasks: [
        { id: 't1', agentId: 'orchestrator', input: 'req', output: 'Task breakdown: design the system architecture first.', status: 'completed' as const },
        { id: 't2', agentId: 'architect', input: 'spec', output: 'Full architecture spec with API contracts and data models.', status: 'completed' as const },
        { id: 't3', agentId: 'builder', input: 'build', status: 'pending' as const },
      ],
    };
    const results = validateWorkflowChain(workflow);
    expect(results.length).toBe(2); // 3 tasks = 2 handoffs
    expect(results[0].fromAgent).toBe('orchestrator');
    expect(results[0].toAgent).toBe('architect');
    expect(results[1].fromAgent).toBe('architect');
    expect(results[1].toAgent).toBe('builder');
  });

  test('returns empty for single-task workflow', () => {
    const workflow = {
      id: 'wf-1',
      name: 'Single',
      description: 'test',
      status: 'running' as const,
      currentAgentIndex: 0,
      agents: [
        { id: 'orchestrator', name: 'Orchestrator', role: 'orchestrator' as const, systemPrompt: '', description: '', descriptionVi: '', icon: '', color: '' },
      ],
      tasks: [
        { id: 't1', agentId: 'orchestrator', input: 'req', output: 'done', status: 'completed' as const },
      ],
    };
    expect(validateWorkflowChain(workflow)).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// isHandoffSafe
// ═══════════════════════════════════════════════════════════════════════

describe('isHandoffSafe', () => {
  test('true for valid handoff', () => {
    expect(isHandoffSafe(ctx())).toBe(true);
  });

  test('false for BLOCK handoff', () => {
    expect(isHandoffSafe(ctx({
      fromTask: { id: 't', agentId: 'architect', output: '', status: 'running' },
    }))).toBe(false);
  });

  test('true for WARN handoff (warnings allowed)', () => {
    expect(isHandoffSafe(ctx({
      fromTask: { id: 't', agentId: 'architect', output: 'short', status: 'completed' },
    }))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

describe('AGENT_CAPABILITIES', () => {
  test('all 4 roles defined', () => {
    expect(Object.keys(AGENT_CAPABILITIES)).toEqual(
      expect.arrayContaining(['orchestrator', 'architect', 'builder', 'reviewer']),
    );
  });

  test('each role has produces and consumes', () => {
    for (const [, cap] of Object.entries(AGENT_CAPABILITIES)) {
      expect(cap.produces.length).toBeGreaterThan(0);
      expect(cap.consumes.length).toBeGreaterThan(0);
    }
  });
});

describe('VALID_HANDOFF_SEQUENCES', () => {
  test('includes orchestrator→architect', () => {
    expect(VALID_HANDOFF_SEQUENCES).toContainEqual(['orchestrator', 'architect']);
  });

  test('includes architect→builder', () => {
    expect(VALID_HANDOFF_SEQUENCES).toContainEqual(['architect', 'builder']);
  });

  test('includes builder→reviewer', () => {
    expect(VALID_HANDOFF_SEQUENCES).toContainEqual(['builder', 'reviewer']);
  });

  test('includes reviewer→builder (send back)', () => {
    expect(VALID_HANDOFF_SEQUENCES).toContainEqual(['reviewer', 'builder']);
  });
});
