/**
 * CVF Phase E — Workflow Binding Contract
 * =======================================
 * Typed workflow composition metadata for selected governed execution flows.
 *
 * Authorized by:
 * docs/baselines/CVF_GC018_PHASE_E_E3_WORKFLOW_BINDING_CONTRACT_2026-05-18.md
 *
 * SCOPE: Contract-local binding and deterministic validation only.
 * No route dispatch, provider execution, receipt persistence, or live behavior is changed.
 */

import type { CVFRole } from '../types';
import {
  ROLE_PERMISSION_OUTPUT_CLASSES,
  type RolePermissionOutputClass,
} from './role-permission.contract';
import {
  TOOL_ACTION_CLASSES,
  WORKFLOW_TRANSITIONS,
  type ToolActionClass,
  type WorkflowTransition,
} from './runtime-workflow.contract';

export const WORKFLOW_BINDING_CONTRACT_VERSION = 'phaseE.workflowBinding.v1' as const;

export type WorkflowBindingStatus = 'active' | 'deferred_until_reviewer_surface';

export type WorkflowStepDecision =
  | 'precondition_passed'
  | 'precondition_failed'
  | 'deferred'
  | 'skipped'
  | 'completed';

export type WorkflowStepTraceSource =
  | 'workflow_binding'
  | 'route_dispatch'
  | 'audit_event'
  | 'receipt_emitter';

export interface WorkflowStepRole {
  readonly role: CVFRole;
}

export interface WorkflowStep {
  readonly stepId: string;
  readonly label: string;
  readonly sequence: number;
  readonly role: WorkflowStepRole;
  readonly outputClass: RolePermissionOutputClass;
  readonly actionClass: ToolActionClass;
  readonly transition: WorkflowTransition;
  readonly receiptRequired: boolean;
  readonly status: WorkflowBindingStatus;
}

export interface WorkflowBinding {
  readonly workflowId: string;
  readonly version: string;
  readonly templateId: string;
  readonly capabilityId: string;
  readonly steps: readonly WorkflowStep[];
}

export interface WorkflowStepExecutionTrace {
  readonly stepId: string;
  readonly preconditionChecked: boolean;
  readonly decision: WorkflowStepDecision;
  readonly receiptId: string | null;
  readonly source: WorkflowStepTraceSource;
}

export interface WorkflowBindingValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

const CVF_ROLE_VALUES: readonly CVFRole[] = [
  'OBSERVER',
  'ANALYST',
  'BUILDER',
  'REVIEWER',
  'GOVERNOR',
  'HUMAN',
  'AI_AGENT',
  'OPERATOR',
  'SERVICE_AGENT',
] as const;

function includesReadonly<T extends string>(values: readonly T[], candidate: string): candidate is T {
  return values.includes(candidate as T);
}

function transitionMatchesKnownVocabulary(transition: WorkflowTransition): boolean {
  return WORKFLOW_TRANSITIONS.some(
    (candidate) =>
      candidate.fromState === transition.fromState &&
      candidate.toState === transition.toState &&
      candidate.trigger === transition.trigger &&
      candidate.receiptRequired === transition.receiptRequired,
  );
}

export function validateWorkflowBinding(
  binding: WorkflowBinding,
): WorkflowBindingValidationResult {
  const errors: string[] = [];

  if (!binding.workflowId.trim()) {
    errors.push('workflowId is required');
  }

  if (!binding.version.trim()) {
    errors.push('version is required');
  }

  if (!binding.templateId.trim()) {
    errors.push('templateId is required');
  }

  if (!binding.capabilityId.trim()) {
    errors.push('capabilityId is required');
  }

  if (binding.steps.length === 0) {
    errors.push('at least one workflow step is required');
  }

  const seenStepIds = new Set<string>();
  const seenSequences = new Set<number>();

  for (const step of binding.steps) {
    if (!step.stepId.trim()) {
      errors.push('stepId is required');
    }

    if (seenStepIds.has(step.stepId)) {
      errors.push(`duplicate stepId: ${step.stepId}`);
    }
    seenStepIds.add(step.stepId);

    if (seenSequences.has(step.sequence)) {
      errors.push(`duplicate sequence: ${step.sequence}`);
    }
    seenSequences.add(step.sequence);

    if (!Number.isInteger(step.sequence) || step.sequence < 1) {
      errors.push(`invalid sequence for ${step.stepId}`);
    }

    if (!includesReadonly(CVF_ROLE_VALUES, step.role.role)) {
      errors.push(`invalid role for ${step.stepId}: ${step.role.role}`);
    }

    if (!includesReadonly(ROLE_PERMISSION_OUTPUT_CLASSES, step.outputClass)) {
      errors.push(`invalid outputClass for ${step.stepId}: ${step.outputClass}`);
    }

    if (!includesReadonly(TOOL_ACTION_CLASSES, step.actionClass)) {
      errors.push(`invalid actionClass for ${step.stepId}: ${step.actionClass}`);
    }

    if (!['active', 'deferred_until_reviewer_surface'].includes(step.status)) {
      errors.push(`invalid status for ${step.stepId}: ${step.status}`);
    }

    if (step.status === 'deferred_until_reviewer_surface' && step.role.role !== 'REVIEWER') {
      errors.push(`deferred reviewer surface step must use REVIEWER role: ${step.stepId}`);
    }

    if (step.receiptRequired !== step.transition.receiptRequired) {
      errors.push(`receiptRequired mismatch for ${step.stepId}`);
    }

    if (!transitionMatchesKnownVocabulary(step.transition)) {
      errors.push(`unknown workflow transition for ${step.stepId}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getActiveWorkflowSteps(binding: WorkflowBinding): readonly WorkflowStep[] {
  return binding.steps.filter((step) => step.status === 'active');
}
