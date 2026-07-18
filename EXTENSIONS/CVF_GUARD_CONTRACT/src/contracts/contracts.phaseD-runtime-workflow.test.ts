import { describe, expect, it } from 'vitest';
import {
  GUARD_ENFORCEMENT_POINTS,
  OPERATIONAL_BENCHMARK_EXTENSIONS,
  RUNTIME_FAILURE_STATES,
  TOOL_ACTION_CLASSES,
  WORKFLOW_TRANSITIONS,
  evaluateRuntimeWorkflowEvent,
  runtimeWorkflowCoversFailureStates,
  runtimeWorkflowCoversGuardPoints,
  toolActionClassCovers,
} from './runtime-workflow.contract';

describe('Phase D Runtime workflow contract', () => {
  it('defines the required runtime failure state vocabulary', () => {
    expect([...RUNTIME_FAILURE_STATES].sort()).toEqual(
      [
        'gate_timeout',
        'memory_write_violation',
        'policy_denied',
        'provider_error',
        'receipt_missing',
        'worker_overreach',
      ].sort(),
    );
    expect(runtimeWorkflowCoversFailureStates()).toBe(true);
  });

  it('names all guard enforcement points and binds each to a phase', () => {
    expect(GUARD_ENFORCEMENT_POINTS.map((point) => point.point)).toEqual([
      'intake',
      'design',
      'build',
      'review',
      'freeze',
    ]);
    expect(runtimeWorkflowCoversGuardPoints()).toBe(true);

    for (const point of GUARD_ENFORCEMENT_POINTS) {
      expect(point.phase).toBeTruthy();
      expect(point.receiptRequired).toBe(true);
      expect(point.blocksOnFailure).toBe(true);
    }
  });

  it('covers current tool, MCP, command, database, provider, and artifact surfaces', () => {
    expect([...TOOL_ACTION_CLASSES].sort()).toEqual(
      [
        'artifact_export',
        'browser_navigation',
        'database_query',
        'file_read',
        'file_write',
        'mcp_call',
        'provider_call',
        'shell_command',
      ].sort(),
    );
    expect(
      toolActionClassCovers([
        'file_read',
        'file_write',
        'shell_command',
        'browser_navigation',
        'mcp_call',
        'database_query',
        'provider_call',
        'artifact_export',
      ]),
    ).toBe(true);
  });

  it('requires receipts for mutation and approval transitions', () => {
    const sensitiveTransitions = WORKFLOW_TRANSITIONS.filter((transition) =>
      ['mutation_requested', 'approval_granted'].includes(transition.trigger),
    );

    expect(sensitiveTransitions.length).toBeGreaterThan(0);
    for (const transition of sensitiveTransitions) {
      expect(transition.receiptRequired).toBe(true);
    }
  });

  it('routes worker_overreach failure simulation to denied state with receipt required', () => {
    expect(
      evaluateRuntimeWorkflowEvent({
        currentState: 'build_running',
        trigger: 'worker_overreach',
      }),
    ).toEqual({
      toState: 'denied',
      receiptRequired: true,
    });
  });

  it('routes memory_write_violation failure simulation to denied state with receipt required', () => {
    expect(
      evaluateRuntimeWorkflowEvent({
        currentState: 'build_running',
        trigger: 'memory_write_violation',
      }),
    ).toEqual({
      toState: 'denied',
      receiptRequired: true,
    });
  });

  it('defines operational benchmark extensions with only runtime_receipt_count live-wired', () => {
    expect(OPERATIONAL_BENCHMARK_EXTENSIONS.length).toBeGreaterThan(0);

    for (const metric of OPERATIONAL_BENCHMARK_EXTENSIONS) {
      expect(metric.metricId).toBeTruthy();
      expect(metric.receiptLinked).toBe(true);
      expect(typeof metric.liveEmissionWired).toBe('boolean');
    }

    const liveMetrics = OPERATIONAL_BENCHMARK_EXTENSIONS.filter((metric) => metric.liveEmissionWired);
    expect(liveMetrics.map((metric) => metric.metricId)).toEqual(['runtime_receipt_count']);
  });
});
