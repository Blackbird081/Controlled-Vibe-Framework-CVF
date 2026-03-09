/**
 * Workflow Monitor — Tests
 * Track 4.2: Workflow monitoring simplification
 */

import { describe, test, expect } from 'vitest';
import {
  getWorkflowStatus,
  getTaskStatuses,
  needsUserAttention,
  formatDuration,
} from './workflow-monitor';
import type { Workflow } from './multi-agent';

// ─── Helpers ──────────────────────────────────────────────────────────

function makeWorkflow(overrides: Partial<Workflow> = {}): Workflow {
  return {
    id: 'wf-1',
    name: 'Test Workflow',
    description: 'Test',
    status: 'running',
    currentAgentIndex: 1,
    agents: [
      { id: 'orchestrator', name: 'Orchestrator', role: 'orchestrator', systemPrompt: '', description: '', descriptionVi: '', icon: '🎯', color: 'purple' },
      { id: 'architect', name: 'Architect', role: 'architect', systemPrompt: '', description: '', descriptionVi: '', icon: '📐', color: 'blue' },
      { id: 'builder', name: 'Builder', role: 'builder', systemPrompt: '', description: '', descriptionVi: '', icon: '🔨', color: 'green' },
    ],
    tasks: [
      { id: 't1', agentId: 'orchestrator', input: 'req', output: 'breakdown', status: 'completed', startTime: new Date('2026-01-01T10:00:00'), endTime: new Date('2026-01-01T10:00:30') },
      { id: 't2', agentId: 'architect', input: 'spec', status: 'running', startTime: new Date('2026-01-01T10:00:31') },
      { id: 't3', agentId: 'builder', input: 'build', status: 'pending' },
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// formatDuration
// ═══════════════════════════════════════════════════════════════════════

describe('formatDuration', () => {
  test('null when no startTime', () => {
    expect(formatDuration(undefined)).toBeNull();
  });

  test('< 1s', () => {
    const start = new Date('2026-01-01T10:00:00.000Z');
    const end = new Date('2026-01-01T10:00:00.500Z');
    expect(formatDuration(start, end)).toBe('<1s');
  });

  test('seconds', () => {
    const start = new Date('2026-01-01T10:00:00Z');
    const end = new Date('2026-01-01T10:00:15Z');
    expect(formatDuration(start, end)).toBe('15s');
  });

  test('minutes and seconds', () => {
    const start = new Date('2026-01-01T10:00:00Z');
    const end = new Date('2026-01-01T10:02:30Z');
    expect(formatDuration(start, end)).toBe('2m 30s');
  });

  test('exact minutes', () => {
    const start = new Date('2026-01-01T10:00:00Z');
    const end = new Date('2026-01-01T10:03:00Z');
    expect(formatDuration(start, end)).toBe('3m');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// getWorkflowStatus
// ═══════════════════════════════════════════════════════════════════════

describe('getWorkflowStatus', () => {
  test('running workflow shows healthy', () => {
    const s = getWorkflowStatus(makeWorkflow());
    expect(s.health).toBe('healthy');
    expect(s.tasksCompleted).toBe(1);
    expect(s.tasksTotal).toBe(3);
    expect(s.overallPercent).toBe(33);
    expect(s.currentAgentName).toBe('Designer');
    expect(s.currentAgentIcon).toBe('📐');
  });

  test('idle workflow', () => {
    const s = getWorkflowStatus(makeWorkflow({ status: 'idle' }));
    expect(s.health).toBe('idle');
    expect(s.friendlyStatus).toContain('Ready');
    expect(s.friendlyStatusVi).toContain('Sẵn sàng');
  });

  test('completed workflow', () => {
    const s = getWorkflowStatus(makeWorkflow({
      status: 'completed',
      tasks: [
        { id: 't1', agentId: 'orchestrator', input: 'r', output: 'done', status: 'completed' },
      ],
    }));
    expect(s.overallPercent).toBe(100);
    expect(s.friendlyStatus).toContain('done');
  });

  test('failed workflow shows error health', () => {
    const s = getWorkflowStatus(makeWorkflow({ status: 'failed' }));
    expect(s.health).toBe('error');
    expect(s.actionRequired).toBe(true);
    expect(s.actionMessage).toContain('try again');
  });

  test('workflow with failed task shows warning', () => {
    const s = getWorkflowStatus(makeWorkflow({
      tasks: [
        { id: 't1', agentId: 'orchestrator', input: 'r', output: 'done', status: 'completed' },
        { id: 't2', agentId: 'architect', input: 's', status: 'failed', error: 'timeout' },
        { id: 't3', agentId: 'builder', input: 'b', status: 'pending' },
      ],
    }));
    expect(s.health).toBe('warning');
    expect(s.tasksFailed).toBe(1);
  });

  test('running workflow with failed task requires attention', () => {
    const s = getWorkflowStatus(makeWorkflow({
      tasks: [
        { id: 't1', agentId: 'orchestrator', input: 'r', output: 'ok', status: 'completed' },
        { id: 't2', agentId: 'architect', input: 's', status: 'failed', error: 'err' },
      ],
    }));
    expect(s.actionRequired).toBe(true);
    expect(s.actionMessage).toContain('issue');
  });

  test('estimatedTimeLeft is present', () => {
    const s = getWorkflowStatus(makeWorkflow());
    expect(s.estimatedTimeLeft).toBeTruthy();
    expect(s.estimatedTimeLeftVi).toBeTruthy();
  });

  test('empty tasks workflow', () => {
    const s = getWorkflowStatus(makeWorkflow({ tasks: [] }));
    expect(s.overallPercent).toBe(0);
    expect(s.tasksTotal).toBe(0);
  });

  test('friendlyStatusVi is in Vietnamese', () => {
    const s = getWorkflowStatus(makeWorkflow());
    expect(s.friendlyStatusVi).toMatch(/[àáảãạ]/);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// getTaskStatuses
// ═══════════════════════════════════════════════════════════════════════

describe('getTaskStatuses', () => {
  test('returns status for each task', () => {
    const statuses = getTaskStatuses(makeWorkflow());
    expect(statuses.length).toBe(3);
  });

  test('completed task has duration', () => {
    const statuses = getTaskStatuses(makeWorkflow());
    const completed = statuses.find(s => s.status === 'completed');
    expect(completed).toBeDefined();
    expect(completed!.duration).toBeTruthy();
  });

  test('pending task has null duration', () => {
    const statuses = getTaskStatuses(makeWorkflow());
    const pending = statuses.find(s => s.status === 'pending');
    expect(pending).toBeDefined();
    expect(pending!.duration).toBeNull();
  });

  test('friendly status labels', () => {
    const statuses = getTaskStatuses(makeWorkflow());
    expect(statuses[0].friendlyStatus).toBe('Done');
    expect(statuses[0].friendlyStatusVi).toBe('Hoàn thành');
    expect(statuses[1].friendlyStatus).toBe('Working...');
    expect(statuses[2].friendlyStatus).toBe('Waiting');
  });

  test('agent names are non-technical', () => {
    const statuses = getTaskStatuses(makeWorkflow());
    expect(statuses[0].agentName).toBe('Coordinator');
    expect(statuses[1].agentName).toBe('Designer');
    expect(statuses[2].agentName).toBe('Builder');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// needsUserAttention
// ═══════════════════════════════════════════════════════════════════════

describe('needsUserAttention', () => {
  test('false for healthy running workflow', () => {
    expect(needsUserAttention(makeWorkflow())).toBe(false);
  });

  test('true for failed workflow', () => {
    expect(needsUserAttention(makeWorkflow({ status: 'failed' }))).toBe(true);
  });

  test('true for running workflow with failed task', () => {
    expect(needsUserAttention(makeWorkflow({
      tasks: [
        { id: 't1', agentId: 'orchestrator', input: 'r', output: 'ok', status: 'completed' },
        { id: 't2', agentId: 'architect', input: 's', status: 'failed', error: 'err' },
      ],
    }))).toBe(true);
  });

  test('false for idle workflow', () => {
    expect(needsUserAttention(makeWorkflow({ status: 'idle' }))).toBe(false);
  });
});
