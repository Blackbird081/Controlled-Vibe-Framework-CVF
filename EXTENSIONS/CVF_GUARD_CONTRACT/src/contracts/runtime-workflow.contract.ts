/**
 * CVF Phase D — Legacy Runtime Workflow Contract
 * ==============================================
 * Contract-local runtime workflow, failure, action, and benchmark metadata.
 *
 * Authorized by:
 * docs/baselines/CVF_GC018_LEGACY_RUNTIME_WORKFLOW_TRANCHE_2026-05-18.md
 *
 * SCOPE: Type metadata and deterministic helpers only.
 * No guard dispatch, provider routing, or tool execution is changed.
 * `runtime_receipt_count` is the first bounded live-wired metric.
 */

import type { CVFPhase } from '../types';

export const RUNTIME_WORKFLOW_CONTRACT_VERSION = 'phaseD.runtimeWorkflow.v1' as const;

export type RuntimeWorkflowState =
  | 'intake_pending'
  | 'design_ready'
  | 'build_running'
  | 'review_pending'
  | 'freeze_ready'
  | 'denied'
  | 'failed'
  | 'completed';

export type RuntimeFailureState =
  | 'policy_denied'
  | 'gate_timeout'
  | 'provider_error'
  | 'worker_overreach'
  | 'memory_write_violation'
  | 'receipt_missing';

export type GuardEnforcementPoint =
  | 'intake'
  | 'design'
  | 'build'
  | 'review'
  | 'freeze';

export type ToolActionClass =
  | 'file_read'
  | 'file_write'
  | 'shell_command'
  | 'browser_navigation'
  | 'mcp_call'
  | 'database_query'
  | 'provider_call'
  | 'artifact_export';

export type WorkflowTrigger =
  | 'input_accepted'
  | 'design_confirmed'
  | 'build_started'
  | 'review_requested'
  | 'freeze_requested'
  | 'approval_granted'
  | 'mutation_requested'
  | 'failure_detected'
  | RuntimeFailureState;

export type OperationalBenchmarkMetricKind =
  | 'latency_ms'
  | 'decision_count'
  | 'failure_count'
  | 'receipt_count'
  | 'export_count'
  | 'worker_transition_count';

export interface GuardEnforcementPointMeta {
  readonly point: GuardEnforcementPoint;
  readonly phase: CVFPhase;
  readonly receiptRequired: boolean;
  readonly blocksOnFailure: boolean;
}

export interface WorkflowTransition {
  readonly fromState: RuntimeWorkflowState;
  readonly toState: RuntimeWorkflowState;
  readonly trigger: WorkflowTrigger;
  readonly receiptRequired: boolean;
}

export interface OperationalBenchmarkExtension {
  readonly metricId: string;
  readonly kind: OperationalBenchmarkMetricKind;
  readonly emittedAtPoint: GuardEnforcementPoint;
  readonly receiptLinked: boolean;
  readonly liveEmissionWired: boolean;
}

export interface RuntimeWorkflowEvent {
  readonly currentState: RuntimeWorkflowState;
  readonly trigger: WorkflowTrigger;
}

export interface RuntimeWorkflowDecision {
  readonly toState: RuntimeWorkflowState;
  readonly receiptRequired: boolean;
}

export const RUNTIME_FAILURE_STATES: readonly RuntimeFailureState[] = [
  'policy_denied',
  'gate_timeout',
  'provider_error',
  'worker_overreach',
  'memory_write_violation',
  'receipt_missing',
] as const;

export const GUARD_ENFORCEMENT_POINTS: readonly GuardEnforcementPointMeta[] = [
  { point: 'intake', phase: 'INTAKE', receiptRequired: true, blocksOnFailure: true },
  { point: 'design', phase: 'DESIGN', receiptRequired: true, blocksOnFailure: true },
  { point: 'build', phase: 'BUILD', receiptRequired: true, blocksOnFailure: true },
  { point: 'review', phase: 'REVIEW', receiptRequired: true, blocksOnFailure: true },
  { point: 'freeze', phase: 'FREEZE', receiptRequired: true, blocksOnFailure: true },
] as const;

export const TOOL_ACTION_CLASSES: readonly ToolActionClass[] = [
  'file_read',
  'file_write',
  'shell_command',
  'browser_navigation',
  'mcp_call',
  'database_query',
  'provider_call',
  'artifact_export',
] as const;

export const WORKFLOW_TRANSITIONS: readonly WorkflowTransition[] = [
  {
    fromState: 'intake_pending',
    toState: 'design_ready',
    trigger: 'input_accepted',
    receiptRequired: true,
  },
  {
    fromState: 'design_ready',
    toState: 'build_running',
    trigger: 'design_confirmed',
    receiptRequired: true,
  },
  {
    fromState: 'build_running',
    toState: 'review_pending',
    trigger: 'review_requested',
    receiptRequired: true,
  },
  {
    fromState: 'review_pending',
    toState: 'freeze_ready',
    trigger: 'approval_granted',
    receiptRequired: true,
  },
  {
    fromState: 'freeze_ready',
    toState: 'completed',
    trigger: 'freeze_requested',
    receiptRequired: true,
  },
  {
    fromState: 'design_ready',
    toState: 'build_running',
    trigger: 'mutation_requested',
    receiptRequired: true,
  },
  {
    fromState: 'build_running',
    toState: 'denied',
    trigger: 'worker_overreach',
    receiptRequired: true,
  },
  {
    fromState: 'build_running',
    toState: 'denied',
    trigger: 'memory_write_violation',
    receiptRequired: true,
  },
  {
    fromState: 'build_running',
    toState: 'denied',
    trigger: 'policy_denied',
    receiptRequired: true,
  },
  {
    fromState: 'build_running',
    toState: 'failed',
    trigger: 'gate_timeout',
    receiptRequired: true,
  },
  {
    fromState: 'build_running',
    toState: 'failed',
    trigger: 'provider_error',
    receiptRequired: true,
  },
  {
    fromState: 'review_pending',
    toState: 'failed',
    trigger: 'receipt_missing',
    receiptRequired: true,
  },
] as const;

export const OPERATIONAL_BENCHMARK_EXTENSIONS: readonly OperationalBenchmarkExtension[] = [
  {
    metricId: 'runtime_failure_count',
    kind: 'failure_count',
    emittedAtPoint: 'build',
    receiptLinked: true,
    liveEmissionWired: false,
  },
  {
    metricId: 'worker_transition_count',
    kind: 'worker_transition_count',
    emittedAtPoint: 'build',
    receiptLinked: true,
    liveEmissionWired: false,
  },
  {
    metricId: 'runtime_receipt_count',
    kind: 'receipt_count',
    emittedAtPoint: 'review',
    receiptLinked: true,
    liveEmissionWired: true,
  },
] as const;

export function runtimeWorkflowCoversFailureStates(
  requiredStates: readonly RuntimeFailureState[] = RUNTIME_FAILURE_STATES,
): boolean {
  const vocabulary = new Set(RUNTIME_FAILURE_STATES);
  return requiredStates.every((state) => vocabulary.has(state));
}

export function runtimeWorkflowCoversGuardPoints(
  requiredPoints: readonly GuardEnforcementPoint[] = [
    'intake',
    'design',
    'build',
    'review',
    'freeze',
  ],
): boolean {
  const points = new Set(GUARD_ENFORCEMENT_POINTS.map((point) => point.point));
  return requiredPoints.every((point) => points.has(point));
}

export function toolActionClassCovers(
  requiredClasses: readonly ToolActionClass[],
): boolean {
  const classes = new Set(TOOL_ACTION_CLASSES);
  return requiredClasses.every((actionClass) => classes.has(actionClass));
}

export function evaluateRuntimeWorkflowEvent(
  event: RuntimeWorkflowEvent,
): RuntimeWorkflowDecision {
  const transition = WORKFLOW_TRANSITIONS.find(
    (candidate) =>
      candidate.fromState === event.currentState && candidate.trigger === event.trigger,
  );

  if (transition) {
    return {
      toState: transition.toState,
      receiptRequired: transition.receiptRequired,
    };
  }

  if (RUNTIME_FAILURE_STATES.includes(event.trigger as RuntimeFailureState)) {
    return {
      toState: 'failed',
      receiptRequired: true,
    };
  }

  return {
    toState: event.currentState,
    receiptRequired: false,
  };
}
