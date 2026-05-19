/**
 * CVF Phase E — Receipt Binding Contract
 * ======================================
 * Selected-flow receipt obligations for the Product Brief workflow.
 *
 * Authorized by:
 * docs/baselines/CVF_GC018_PHASE_E_E5_RECEIPT_BINDING_2026-05-18.md
 *
 * SCOPE: active role/action pairs used by workflow.product.create_product_brief.v1.
 * The full CVFRole x ToolActionClass matrix is deferred_with_reason because
 * Phase E proves one selected flow, not every possible agent/action pairing.
 */

import type { CVFRole } from '../types';
import type { RolePermissionOutputClass } from './role-permission.contract';
import type { ToolActionClass } from './runtime-workflow.contract';
import {
  getActiveWorkflowSteps,
  type WorkflowBinding,
  type WorkflowStepExecutionTrace,
} from './workflow-binding.contract';

export const RECEIPT_BINDING_CONTRACT_VERSION = 'phaseE.receiptBinding.v1' as const;

export const FULL_ROLE_ACTION_MATRIX_DEFERRED_REASON =
  'deferred_with_reason: full CVFRole x ToolActionClass receipt matrix is outside Phase E selected-flow scope';

export type ReceiptBindingDisposition = 'covered_selected_flow' | 'deferred_with_reason';
export type StepReceiptEmissionSource = 'workflow_step_trace';

export interface StepReceiptObligation {
  readonly obligationId: string;
  readonly workflowId: string;
  readonly stepId: string;
  readonly role: CVFRole;
  readonly actionClass: ToolActionClass;
  readonly outputClass: RolePermissionOutputClass;
  readonly receiptRequired: boolean;
  readonly disposition: ReceiptBindingDisposition;
}

export interface StepReceiptEmission {
  readonly obligationId: string;
  readonly workflowId: string;
  readonly stepId: string;
  readonly role: CVFRole;
  readonly actionClass: ToolActionClass;
  readonly receiptId: string;
  readonly emitted: true;
  readonly source: StepReceiptEmissionSource;
}

export interface StepReceiptBindingResult {
  readonly contractVersion: typeof RECEIPT_BINDING_CONTRACT_VERSION;
  readonly workflowId: string;
  readonly obligations: readonly StepReceiptObligation[];
  readonly emissions: readonly StepReceiptEmission[];
  readonly fullMatrixDisposition: ReceiptBindingDisposition;
  readonly fullMatrixDeferredReason: typeof FULL_ROLE_ACTION_MATRIX_DEFERRED_REASON;
}

function buildObligationId(input: {
  workflowId: string;
  stepId: string;
  role: CVFRole;
  actionClass: ToolActionClass;
}): string {
  return `${input.workflowId}:${input.stepId}:${input.role}:${input.actionClass}`;
}

export function buildSelectedFlowReceiptObligations(
  binding: WorkflowBinding,
): readonly StepReceiptObligation[] {
  return getActiveWorkflowSteps(binding).map((step) => ({
    obligationId: buildObligationId({
      workflowId: binding.workflowId,
      stepId: step.stepId,
      role: step.role.role,
      actionClass: step.actionClass,
    }),
    workflowId: binding.workflowId,
    stepId: step.stepId,
    role: step.role.role,
    actionClass: step.actionClass,
    outputClass: step.outputClass,
    receiptRequired: step.receiptRequired,
    disposition: 'covered_selected_flow',
  }));
}

export function emitStepReceipt(
  obligation: StepReceiptObligation,
  trace: WorkflowStepExecutionTrace,
): StepReceiptEmission | undefined {
  if (!obligation.receiptRequired || trace.stepId !== obligation.stepId || !trace.receiptId) {
    return undefined;
  }

  return {
    obligationId: obligation.obligationId,
    workflowId: obligation.workflowId,
    stepId: obligation.stepId,
    role: obligation.role,
    actionClass: obligation.actionClass,
    receiptId: trace.receiptId,
    emitted: true,
    source: 'workflow_step_trace',
  };
}

export function bindStepReceipts(
  binding: WorkflowBinding,
  traces: readonly WorkflowStepExecutionTrace[],
): StepReceiptBindingResult {
  const obligations = buildSelectedFlowReceiptObligations(binding);
  const emissions = obligations.flatMap((obligation) => {
    const trace = traces.find((candidate) => candidate.stepId === obligation.stepId);
    const emission = trace ? emitStepReceipt(obligation, trace) : undefined;
    return emission ? [emission] : [];
  });

  return {
    contractVersion: RECEIPT_BINDING_CONTRACT_VERSION,
    workflowId: binding.workflowId,
    obligations,
    emissions,
    fullMatrixDisposition: 'deferred_with_reason',
    fullMatrixDeferredReason: FULL_ROLE_ACTION_MATRIX_DEFERRED_REASON,
  };
}
