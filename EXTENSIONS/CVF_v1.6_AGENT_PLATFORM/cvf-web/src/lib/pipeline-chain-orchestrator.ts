/**
 * Pipeline Chain Orchestrator — EL-1 contract interface
 * =====================================================
 * Defines the canonical 5-stage CVF pipeline state machine:
 *   Intake Gate → Orchestrator → Worker (Draft/Execute) →
 *   Reviewer → Closure Gate
 *
 * This is the TypeScript interface implementing the EL-1 contract:
 *   docs/reference/CVF_EL1_PIPELINE_CHAIN_ORCHESTRATOR_CONTRACT_2026-05-29.md
 *
 * Contract version: cvf.pipelineChainOrchestrator.el1.v1
 *
 * @module lib/pipeline-chain-orchestrator
 */

import type { RiskLevel } from '@/lib/ai/provider-router-adapter';
import type { ExecutionDiagnostic, ExecutionDiagnosticClass } from '@/lib/execution-diagnostics';

// --- Pipeline stage enum ---

export type PipelineStage =
  | 'intake_gate'
  | 'orchestrator'
  | 'worker'
  | 'reviewer'
  | 'closure_gate';

export const PIPELINE_STAGE_ORDER: Record<PipelineStage, number> = {
  intake_gate: 1,
  orchestrator: 2,
  worker: 3,
  reviewer: 4,
  closure_gate: 5,
};

// --- MA1 role per stage ---

export type PipelineRole = 'Orchestrator' | 'Implementer' | 'Reviewer' | 'Auditor';

export const PIPELINE_STAGE_ROLE: Record<PipelineStage, PipelineRole> = {
  intake_gate: 'Orchestrator',
  orchestrator: 'Orchestrator',
  worker: 'Implementer',
  reviewer: 'Reviewer',
  closure_gate: 'Auditor',
};

// --- Stage-specific types ---

export interface IntakeResult {
  approved: boolean;
  riskLevel: RiskLevel;
  modelTierAdvisory?: string;
  guardContractResult: string;
}

export interface WorkOrder {
  id: string;
  task: string;
  scope: string;
  assignedRole: string;
}

export interface WorkerDraftResult {
  draftContent: string;
}

export interface WorkerExecutionResult {
  success: boolean;
  output: string;
  diagnostic?: ExecutionDiagnostic;
}

export type ReviewerDecisionValue = 'APPROVE' | 'REJECT' | 'HOLD';

export interface ReviewerDecision {
  decision: ReviewerDecisionValue;
  feedback?: string;
  retryCount: number;
}

export interface ClosureResult {
  evidenceReceiptId: string;
  chainComplete: boolean;
  allStagesPass: boolean;
}

// --- Receipt wrapper ---

export interface PipelineStageReceipt {
  stage: PipelineStage;
  receiptId: string;
  timestamp: string;
  evidenceMode: 'live' | 'mock';
}

export interface IntakeReceipt extends PipelineStageReceipt {
  stage: 'intake_gate';
  intakeResult: IntakeResult;
}

export interface OrchestrationReceipt extends PipelineStageReceipt {
  stage: 'orchestrator';
  workOrderCount: number;
  workOrderIds: string[];
}

export interface WorkerReceipt extends PipelineStageReceipt {
  stage: 'worker';
  draftResult: WorkerDraftResult;
  executionResult: WorkerExecutionResult;
}

export interface ReviewReceipt extends PipelineStageReceipt {
  stage: 'reviewer';
  reviewerDecision: ReviewerDecision;
}

export interface ClosureReceipt extends PipelineStageReceipt {
  stage: 'closure_gate';
  closureResult: ClosureResult;
}

export type AnyPipelineReceipt =
  | IntakeReceipt
  | OrchestrationReceipt
  | WorkerReceipt
  | ReviewReceipt
  | ClosureReceipt;

// --- Stage result with next-stage routing ---

export interface PipelineStageResult {
  stage: PipelineStage;
  output: Record<string, unknown>;
  receipt: AnyPipelineReceipt;
  nextStage: PipelineStage | 'complete' | 'stop';
  diagnostic?: ExecutionDiagnostic;
}

// --- MA1 handoff packet (simplified for pipeline) ---

export interface PipelineHandoffPacket {
  /** MA1 ##1 — stage authority chain */
  authorityChain: {
    priorStage: PipelineStage;
    priorReceiptId: string;
  };
  /** MA1 ##4 — role for next stage */
  nextRole: PipelineRole;
  /** MA1 ##8 — integration decision from current stage */
  integrationDecision: string;
}

// --- Human intervention signal ---

export type HumanInterventionReason =
  | 'policy_blocked'
  | 'worker_timeout_exhausted'
  | 'reviewer_deadlock_unresolved'
  | 'incomplete_receipt_chain';

export interface HumanInterventionRequired {
  escalated: true;
  stage: PipelineStage;
  reason: HumanInterventionReason;
  lastReceiptId: string;
  recommendedOperatorAction: string;
}

// --- Pipeline chain state ---

export interface PipelineChainState {
  /** Active stage */
  currentStage: PipelineStage;

  /** Whether the pipeline is running */
  running: boolean;

  /** All receipts collected across stages */
  receipts: AnyPipelineReceipt[];

  /** Worker timeout retry counter (EL-2) */
  workerRetryCount: number;

  /** Reviewer retry counter (EL-3) */
  reviewerRetryCount: number;

  /** Human intervention flag */
  humanInterventionRequired: boolean;

  /** Human intervention detail */
  interventionDetail?: HumanInterventionRequired;

  /** Final closure result */
  closureResult?: ClosureResult;
}

// --- Pipeline Chain Orchestrator interface ---

export interface PipelineChainOrchestrator {
  /** Initialize pipeline state */
  initialize(operatorPrompt: string): PipelineChainState;

  /** Advance pipeline from one stage to the next */
  advance(
    state: PipelineChainState,
    stageResult: PipelineStageResult,
  ): PipelineChainState;

  /** Check whether the pipeline can proceed to the next stage */
  canAdvance(state: PipelineChainState): boolean;

  /** Get the current MA1 handoff packet for the next stage */
  buildHandoffPacket(state: PipelineChainState): PipelineHandoffPacket;

  /** Check for human intervention conditions */
  checkHumanIntervention(state: PipelineChainState): HumanInterventionRequired | null;

  /** Finalize pipeline — build closure result */
  finalize(state: PipelineChainState): ClosureResult;
}

// --- Helper: build pipeline stage result ---

export function buildPipelineStageResult(params: {
  stage: PipelineStage;
  output: Record<string, unknown>;
  receipt: AnyPipelineReceipt;
  nextStage: PipelineStage | 'complete' | 'stop';
  diagnostic?: ExecutionDiagnostic;
}): PipelineStageResult {
  return {
    stage: params.stage,
    output: params.output,
    receipt: params.receipt,
    nextStage: params.nextStage,
    diagnostic: params.diagnostic,
  };
}

// --- Helper: create empty pipeline state ---

export function createPipelineState(operatorPrompt: string): PipelineChainState {
  return {
    currentStage: 'intake_gate',
    running: true,
    receipts: [],
    workerRetryCount: 0,
    reviewerRetryCount: 0,
    humanInterventionRequired: false,
  };
}

// --- Helper: advance stage ---

export function advancePipelineStage(
  state: PipelineChainState,
  stageResult: PipelineStageResult,
): PipelineChainState {
  if (
    stageResult.nextStage !== 'complete' &&
    stageResult.nextStage !== 'stop' &&
    !isValidStageTransition(state.currentStage, stageResult.nextStage)
  ) {
    throw new Error(
      `Invalid pipeline stage transition: ${state.currentStage} → ${stageResult.nextStage}`,
    );
  }

  const receipts = [...state.receipts, stageResult.receipt];
  const nextStage =
    stageResult.nextStage === 'complete' || stageResult.nextStage === 'stop'
      ? state.currentStage
      : stageResult.nextStage;

  return {
    ...state,
    currentStage: nextStage as PipelineStage,
    running: stageResult.nextStage !== 'complete' && stageResult.nextStage !== 'stop',
    receipts,
    humanInterventionRequired: stageResult.nextStage === 'stop',
  };
}

// --- Helper: check if stage transition is valid ---

export function isValidStageTransition(
  from: PipelineStage,
  to: PipelineStage | 'complete' | 'stop',
): boolean {
  if (to === 'complete' || to === 'stop') return true;
  const fromOrder = PIPELINE_STAGE_ORDER[from];
  const toOrder = PIPELINE_STAGE_ORDER[to];
  // Must advance forward (not backward, not same stage)
  return toOrder === fromOrder + 1;
}

// --- Helper: get stage diagnostic class ---

export function getStageDiagnosticClass(
  stage: PipelineStage,
  reason: string,
): ExecutionDiagnosticClass | null {
  switch (stage) {
    case 'intake_gate':
      if (reason === 'policy_blocked') return 'policy_blocked';
      if (reason === 'invalid_input') return 'invalid_input';
      break;
    case 'worker':
      if (reason === 'timeout') return 'worker_timeout';
      break;
    case 'reviewer':
      if (reason === 'deadlock') return 'review_deadlock';
      break;
    case 'closure_gate':
      if (reason === 'incomplete_receipt_chain') return 'receipt_missing';
      break;
  }
  return null;
}

// --- EL-2: WorkerTimeoutHandler ---

export const WORKER_TIMEOUT_DEFAULT_MS = 300_000; // 5 minutes
export const WORKER_TIMEOUT_MAX_RETRIES = 2;

export interface WorkerTimeoutResult {
  /** Whether the timeout was recovered */
  recovered: boolean;
  /** Number of retries attempted */
  retryCount: number;
  /** Diagnostic for the timeout event */
  diagnostic: ExecutionDiagnostic;
  /** Whether escalation to human intervention is required */
  escalateToOrchestrator: boolean;
  /** Action to take */
  nextAction: 'retry' | 'escalate' | 'stop';
  /** Updated pipeline state with workerRetryCount incremented — caller must apply this */
  updatedState: PipelineChainState;
}

/**
 * Handle a worker timeout event in the pipeline.
 * EL-2: after timeout, clear sandbox context, restart, re-dispatch.
 * After max retries (2), escalate to Orchestrator for human intervention.
 */
export function handleWorkerTimeout(
  state: PipelineChainState,
  timeoutMs: number = WORKER_TIMEOUT_DEFAULT_MS,
): WorkerTimeoutResult {
  const retryCount = (state.workerRetryCount || 0) + 1;
  const canRetry = retryCount <= WORKER_TIMEOUT_MAX_RETRIES;

  const updatedState: PipelineChainState = { ...state, workerRetryCount: retryCount };

  if (canRetry) {
    return {
      recovered: true,
      retryCount,
      diagnostic: {
        contractVersion: 'cvf.executionDiagnostic.v1',
        stage: 'provider',
        class: 'worker_timeout_recovered',
        retryable: false,
        userAction: 'none',
        safeMessage: `Worker timeout recovered after ${retryCount} retry(ies): sandbox cleared and task re-dispatched.`,
      },
      escalateToOrchestrator: false,
      nextAction: 'retry',
      updatedState,
    };
  }

  // Max retries exhausted — escalate
  return {
    recovered: false,
    retryCount,
    diagnostic: {
      contractVersion: 'cvf.executionDiagnostic.v1',
      stage: 'provider',
      class: 'worker_timeout',
      retryable: false,
      userAction: 'contact_admin',
      safeMessage: `Worker timeout unrecovered after ${retryCount} retries — escalation to Orchestrator required.`,
    },
    escalateToOrchestrator: true,
    nextAction: 'escalate',
    updatedState,
  };
}

// --- EL-3: ReviewDeadlockHandler ---

export const REVIEW_DEADLOCK_MAX_RETRIES = 3;

export interface ReviewDeadlockResult {
  /** Whether decomposition was successful */
  decomposed: boolean;
  /** Number of reviewer rejections */
  rejectionCount: number;
  /** Whether escalation to human intervention is required */
  escalateToOrchestrator: boolean;
  /** Decomposed work orders if applicable */
  decomposedWorkOrders?: string[];
  /** Diagnostic */
  diagnostic: ExecutionDiagnostic;
  /** Action to take */
  nextAction: 'continue_review' | 'decompose' | 'escalate';
  /** Updated pipeline state with reviewerRetryCount incremented — caller must apply this */
  updatedState: PipelineChainState;
}

/**
 * Handle reviewer deadlock detection.
 * EL-3: after 3 reviewer rejections, decompose work order into micro-tasks
 * or upgrade model tier. If decomposition fails, emit HumanInterventionRequired.
 */
export function handleReviewDeadlock(
  state: PipelineChainState,
  currentWorkOrderId: string,
): ReviewDeadlockResult {
  const rejectionCount = (state.reviewerRetryCount || 0) + 1;
  const updatedState: PipelineChainState = { ...state, reviewerRetryCount: rejectionCount };

  if (rejectionCount <= REVIEW_DEADLOCK_MAX_RETRIES) {
    // Still within retry window — reviewer can continue
    return {
      decomposed: false,
      rejectionCount,
      escalateToOrchestrator: false,
      diagnostic: {
        contractVersion: 'cvf.executionDiagnostic.v1',
        stage: 'governance',
        class: 'review_deadlock',
        retryable: true,
        userAction: 'wait_and_retry',
        safeMessage: `Reviewer rejected output ${rejectionCount} time(s) — worker should revise and re-submit.`,
      },
      nextAction: 'continue_review',
      updatedState,
    };
  }

  // Exceeded max rejections — try decomposition
  const decomposedTasks = [
    `${currentWorkOrderId}-subtask-1`,
    `${currentWorkOrderId}-subtask-2`,
    `${currentWorkOrderId}-subtask-3`,
  ];

  return {
    decomposed: true,
    rejectionCount,
    escalateToOrchestrator: false,
    decomposedWorkOrders: decomposedTasks,
    diagnostic: {
      contractVersion: 'cvf.executionDiagnostic.v1',
      stage: 'governance',
      class: 'review_deadlock_decomposed',
      retryable: false,
      userAction: 'none',
      safeMessage: `Review deadlock detected after ${rejectionCount} rejections — work order decomposed into ${decomposedTasks.length} micro-tasks. If decomposition also fails, human intervention is required.`,
    },
    nextAction: 'decompose',
    updatedState,
  };
}
