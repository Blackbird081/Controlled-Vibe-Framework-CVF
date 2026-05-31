import {
  bindStepReceipts,
  validateWorkflowBinding,
  type StepReceiptBindingResult,
  type StepReceiptObligation,
  type WorkflowBinding,
  type WorkflowStepDecision,
  type WorkflowStepExecutionTrace,
} from 'cvf-guard-contract';

import createProductBriefWorkflow from './workflow.product.create_product_brief.v1.json';
import strategyAnalysisWorkflow from './workflow.strategy.strategy_analysis.v1.json';
import marketingCampaignWorkflow from './workflow.marketing.create_campaign_brief.v1.json';
import brandVoiceWorkflow from './workflow.brand.brand_voice_review.v1.json';

export interface WorkflowStepReceipt {
  readonly stepId: string;
  readonly receiptId: string;
  readonly source: 'governance_evidence_receipt';
  readonly obligationId: string;
}

export interface WorkflowStateMachineStepDecision {
  readonly stepId: string;
  readonly sequence: number;
  readonly fromState: string;
  readonly trigger: string;
  readonly expectedToState: string;
  readonly enteredState: string;
  readonly decision: WorkflowStepDecision;
  readonly reason:
    | 'transition_completed'
    | 'configured_deferred'
    | 'from_state_unreachable';
  readonly receiptRequired: boolean;
  readonly receiptEmitted: boolean;
}

export interface WorkflowStateMachineProjection {
  readonly contractVersion: 'cvf.workflowStateMachineProjection.v1';
  readonly workflowId: string;
  readonly initialState: string;
  readonly finalState: string;
  readonly completedStepIds: readonly string[];
  readonly deferredStepIds: readonly string[];
  readonly waitingStepIds: readonly string[];
  readonly decisions: readonly WorkflowStateMachineStepDecision[];
}

export type WorkflowRecoveryAction =
  | 'resume_from_checkpoint'
  | 'hold_for_reviewer_gate'
  | 'escalate_to_governance'
  | 'request_human_review';

export type WorkflowRequestedTransitionDisposition =
  | 'valid_from_current_state'
  | 'invalid_from_current_state'
  | 'configured_deferred_gate'
  | 'no_requested_transition';

export interface WorkflowRequestedTransition {
  readonly trigger?: string;
  readonly fromState?: string;
  readonly toState?: string;
}

export interface WorkflowRecoveryCheckpoint {
  readonly checkpointType: 'POST_EXECUTION';
  readonly stepId: string;
  readonly state: string;
  readonly receiptId: string | null;
  readonly traceSource: 'state_machine_projection';
}

export interface WorkflowRequestedTransitionReadout {
  readonly requestedTrigger: string | null;
  readonly requestedFromState: string | null;
  readonly requestedToState: string | null;
  readonly disposition: WorkflowRequestedTransitionDisposition;
  readonly matchedStepId: string | null;
  readonly reason: string;
}

export interface WorkflowRecoveryReadout {
  readonly contractVersion: 'cvf.workflowRecoveryReadout.wr1.v1';
  readonly workflowId: string;
  readonly currentState: string;
  readonly lastRestorableCheckpoint: WorkflowRecoveryCheckpoint | null;
  readonly blockedStepIds: readonly string[];
  readonly validationGate: 'passed' | 'blocked';
  readonly recoveryAction: WorkflowRecoveryAction;
  readonly requestedTransition: WorkflowRequestedTransitionReadout;
  readonly recommendedNextAction: string;
  readonly boundaries: readonly string[];
}

export interface WorkflowExecutionProjection {
  readonly workflowId: string;
  readonly workflowVersion: string;
  readonly capabilityId: string;
  readonly templateId: string;
  readonly stepTraces: readonly WorkflowStepExecutionTrace[];
  readonly receipts: readonly WorkflowStepReceipt[];
  readonly receiptObligations: readonly StepReceiptObligation[];
  readonly receiptBinding: StepReceiptBindingResult;
  readonly deferredStepIds: readonly string[];
  readonly stateMachine: WorkflowStateMachineProjection;
  readonly recovery: WorkflowRecoveryReadout;
}

const WORKFLOW_BINDINGS: readonly WorkflowBinding[] = [
  createProductBriefWorkflow as WorkflowBinding,
  strategyAnalysisWorkflow as WorkflowBinding,
  marketingCampaignWorkflow as WorkflowBinding,
  brandVoiceWorkflow as WorkflowBinding,
];

export function resolveWorkflowBindingForExecution(templateId?: string): WorkflowBinding | undefined {
  if (!templateId) {
    return undefined;
  }

  const binding = WORKFLOW_BINDINGS.find((candidate) => candidate.templateId === templateId);
  if (!binding) {
    return undefined;
  }

  const validation = validateWorkflowBinding(binding);
  if (!validation.valid) {
    throw new Error(`Invalid workflow binding for ${templateId}: ${validation.errors.join('; ')}`);
  }

  return binding;
}

export function buildWorkflowExecutionProjection(
  binding: WorkflowBinding,
  receiptId: string,
  requestedTransition?: WorkflowRequestedTransition,
): WorkflowExecutionProjection {
  const orderedSteps = [...binding.steps].sort((a, b) => a.sequence - b.sequence);
  const initialState = orderedSteps[0]?.transition.fromState ?? 'intake_pending';
  let currentState = initialState;
  let blockedByDeferredStep = false;

  const decisions: WorkflowStateMachineStepDecision[] = orderedSteps.map((step) => {
    const canEnter = !blockedByDeferredStep && step.transition.fromState === currentState;
    const isConfiguredDeferred = step.status === 'deferred_until_reviewer_surface';
    let decision: WorkflowStepDecision;
    let reason: WorkflowStateMachineStepDecision['reason'];
    let receiptEmitted = false;

    if (!canEnter) {
      decision = 'deferred';
      reason = 'from_state_unreachable';
      blockedByDeferredStep = true;
    } else if (isConfiguredDeferred) {
      decision = 'deferred';
      reason = 'configured_deferred';
      blockedByDeferredStep = true;
    } else {
      decision = 'completed';
      reason = 'transition_completed';
      receiptEmitted = step.receiptRequired;
      currentState = step.transition.toState;
    }

    return {
      stepId: step.stepId,
      sequence: step.sequence,
      fromState: step.transition.fromState,
      trigger: step.transition.trigger,
      expectedToState: step.transition.toState,
      enteredState: currentState,
      decision,
      reason,
      receiptRequired: step.receiptRequired,
      receiptEmitted,
    };
  });

  const stepTraces: WorkflowStepExecutionTrace[] = decisions.map((decision) => ({
    stepId: decision.stepId,
    preconditionChecked: true,
    decision: decision.decision,
    receiptId: decision.receiptEmitted ? receiptId : null,
    source: 'route_dispatch',
  }));
  const receiptBinding = bindStepReceipts(binding, stepTraces);
  const deferredStepIds = decisions
    .filter((decision) => decision.decision === 'deferred')
    .map((decision) => decision.stepId);
  const completedStepIds = decisions
    .filter((decision) => decision.decision === 'completed')
    .map((decision) => decision.stepId);
  const stateMachine: WorkflowStateMachineProjection = {
    contractVersion: 'cvf.workflowStateMachineProjection.v1',
    workflowId: binding.workflowId,
    initialState,
    finalState: currentState,
    completedStepIds,
    deferredStepIds,
    waitingStepIds: decisions
      .filter((decision) => decision.reason === 'from_state_unreachable')
      .map((decision) => decision.stepId),
    decisions,
  };
  const recovery = buildWorkflowRecoveryReadout(
    binding,
    stateMachine,
    stepTraces,
    requestedTransition,
  );

  return {
    workflowId: binding.workflowId,
    workflowVersion: binding.version,
    capabilityId: binding.capabilityId,
    templateId: binding.templateId,
    stepTraces,
    receipts: receiptBinding.emissions.map((emission) => ({
      stepId: emission.stepId,
      receiptId: emission.receiptId,
      source: 'governance_evidence_receipt',
      obligationId: emission.obligationId,
    })),
    receiptObligations: receiptBinding.obligations,
    receiptBinding,
    deferredStepIds,
    stateMachine,
    recovery,
  };
}

function buildWorkflowRecoveryReadout(
  binding: WorkflowBinding,
  stateMachine: WorkflowStateMachineProjection,
  stepTraces: readonly WorkflowStepExecutionTrace[],
  requestedTransition?: WorkflowRequestedTransition,
): WorkflowRecoveryReadout {
  const validationGate = stateMachine.deferredStepIds.length > 0 ? 'blocked' : 'passed';
  const requestedTransitionReadout = classifyRequestedTransition(
    binding,
    stateMachine.finalState,
    requestedTransition,
  );
  const recoveryAction = selectRecoveryAction(
    validationGate,
    requestedTransitionReadout.disposition,
  );

  return {
    contractVersion: 'cvf.workflowRecoveryReadout.wr1.v1',
    workflowId: binding.workflowId,
    currentState: stateMachine.finalState,
    lastRestorableCheckpoint: findLastRestorableCheckpoint(stateMachine, stepTraces),
    blockedStepIds: stateMachine.deferredStepIds,
    validationGate,
    recoveryAction,
    requestedTransition: requestedTransitionReadout,
    recommendedNextAction: recommendWorkflowRecoveryAction(
      recoveryAction,
      requestedTransitionReadout.disposition,
    ),
    boundaries: [
      'no_route_level_block',
      'no_broad_workflow_engine',
      'no_provider_call',
      'no_receipt_envelope_change',
      'no_worker_ticket_runtime',
    ],
  };
}

function findLastRestorableCheckpoint(
  stateMachine: WorkflowStateMachineProjection,
  stepTraces: readonly WorkflowStepExecutionTrace[],
): WorkflowRecoveryCheckpoint | null {
  const completedDecisions = [...stateMachine.decisions]
    .filter((decision) => decision.decision === 'completed')
    .reverse();
  const checkpointDecision = completedDecisions[0];
  if (!checkpointDecision) {
    return null;
  }

  const trace = stepTraces.find((candidate) => candidate.stepId === checkpointDecision.stepId);
  return {
    checkpointType: 'POST_EXECUTION',
    stepId: checkpointDecision.stepId,
    state: checkpointDecision.enteredState,
    receiptId: trace?.receiptId ?? null,
    traceSource: 'state_machine_projection',
  };
}

function classifyRequestedTransition(
  binding: WorkflowBinding,
  currentState: string,
  requestedTransition?: WorkflowRequestedTransition,
): WorkflowRequestedTransitionReadout {
  const requestedTrigger = requestedTransition?.trigger ?? null;
  const requestedFromState = requestedTransition?.fromState ?? null;
  const requestedToState = requestedTransition?.toState ?? null;
  const hasRequestedTransition = Boolean(
    requestedTrigger || requestedFromState || requestedToState,
  );

  if (!hasRequestedTransition) {
    return {
      requestedTrigger,
      requestedFromState,
      requestedToState,
      disposition: 'no_requested_transition',
      matchedStepId: null,
      reason: 'no transition was requested; recovery is derived from the current projection',
    };
  }

  const matchedStep = findRequestedTransitionStep(binding, requestedTransition);
  if (!matchedStep) {
    return {
      requestedTrigger,
      requestedFromState,
      requestedToState,
      disposition: 'invalid_from_current_state',
      matchedStepId: null,
      reason: 'requested transition does not match a configured workflow step',
    };
  }

  if (
    requestedFromState
    && requestedFromState !== currentState
    && requestedFromState !== matchedStep.transition.fromState
  ) {
    return {
      requestedTrigger,
      requestedFromState,
      requestedToState,
      disposition: 'invalid_from_current_state',
      matchedStepId: matchedStep.stepId,
      reason: 'requested fromState does not match the current or configured source state',
    };
  }

  if (requestedToState && requestedToState !== matchedStep.transition.toState) {
    return {
      requestedTrigger,
      requestedFromState,
      requestedToState,
      disposition: 'invalid_from_current_state',
      matchedStepId: matchedStep.stepId,
      reason: 'requested toState does not match the configured target state',
    };
  }

  if (matchedStep.transition.fromState !== currentState) {
    return {
      requestedTrigger,
      requestedFromState,
      requestedToState,
      disposition: 'invalid_from_current_state',
      matchedStepId: matchedStep.stepId,
      reason: 'requested transition is not valid from the current state',
    };
  }

  if (matchedStep.status === 'deferred_until_reviewer_surface') {
    return {
      requestedTrigger,
      requestedFromState,
      requestedToState,
      disposition: 'configured_deferred_gate',
      matchedStepId: matchedStep.stepId,
      reason: 'requested transition is blocked by a configured reviewer gate',
    };
  }

  return {
    requestedTrigger,
    requestedFromState,
    requestedToState,
    disposition: 'valid_from_current_state',
    matchedStepId: matchedStep.stepId,
    reason: 'requested transition is valid from the current state',
  };
}

function findRequestedTransitionStep(
  binding: WorkflowBinding,
  requestedTransition?: WorkflowRequestedTransition,
): WorkflowBinding['steps'][number] | undefined {
  if (!requestedTransition) {
    return undefined;
  }

  if (requestedTransition.trigger) {
    return binding.steps.find((step) => step.transition.trigger === requestedTransition.trigger);
  }

  return binding.steps.find((step) => (
    (!requestedTransition.fromState || step.transition.fromState === requestedTransition.fromState)
    && (!requestedTransition.toState || step.transition.toState === requestedTransition.toState)
  ));
}

function selectRecoveryAction(
  validationGate: WorkflowRecoveryReadout['validationGate'],
  disposition: WorkflowRequestedTransitionDisposition,
): WorkflowRecoveryAction {
  if (disposition === 'invalid_from_current_state') {
    return 'escalate_to_governance';
  }

  if (disposition === 'configured_deferred_gate') {
    return 'hold_for_reviewer_gate';
  }

  if (validationGate === 'blocked') {
    return 'hold_for_reviewer_gate';
  }

  return 'resume_from_checkpoint';
}

function recommendWorkflowRecoveryAction(
  recoveryAction: WorkflowRecoveryAction,
  disposition: WorkflowRequestedTransitionDisposition,
): string {
  if (recoveryAction === 'escalate_to_governance') {
    return 'Block forward progress and escalate the invalid transition with the current checkpoint evidence.';
  }

  if (disposition === 'configured_deferred_gate') {
    return 'Hold execution at the configured reviewer gate until reviewer approval is available.';
  }

  if (recoveryAction === 'hold_for_reviewer_gate') {
    return 'Resume only after the deferred reviewer surface resolves the blocked workflow step.';
  }

  return 'Resume from the last restorable checkpoint using the projected current state.';
}
