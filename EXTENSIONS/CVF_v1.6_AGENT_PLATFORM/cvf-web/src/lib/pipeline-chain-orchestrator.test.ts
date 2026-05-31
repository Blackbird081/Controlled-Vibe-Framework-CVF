import { describe, expect, it } from 'vitest';
import {
  advancePipelineStage,
  buildPipelineStageResult,
  createPipelineState,
  getStageDiagnosticClass,
  handleReviewDeadlock,
  handleWorkerTimeout,
  isValidStageTransition,
  PIPELINE_STAGE_ORDER,
  PIPELINE_STAGE_ROLE,
  WORKER_TIMEOUT_MAX_RETRIES,
  REVIEW_DEADLOCK_MAX_RETRIES,
} from './pipeline-chain-orchestrator';
import type { PipelineStage } from './pipeline-chain-orchestrator';

function makeIntakeReceipt(stageId = 'rcpt-intake-001') {
  return {
    stage: 'intake_gate' as const,
    receiptId: stageId,
    timestamp: new Date().toISOString(),
    evidenceMode: 'live' as const,
    intakeResult: {
      approved: true,
      riskLevel: 'R0' as const,
      guardContractResult: 'passed',
    },
  };
}

function makeOrchestrationReceipt(stageId = 'rcpt-orch-001') {
  return {
    stage: 'orchestrator' as const,
    receiptId: stageId,
    timestamp: new Date().toISOString(),
    evidenceMode: 'live' as const,
    workOrderCount: 2,
    workOrderIds: ['WO-001', 'WO-002'],
  };
}

function makeWorkerReceipt(stageId = 'rcpt-worker-001') {
  return {
    stage: 'worker' as const,
    receiptId: stageId,
    timestamp: new Date().toISOString(),
    evidenceMode: 'live' as const,
    draftResult: { draftContent: 'test output' },
    executionResult: { success: true, output: 'tests passed' },
  };
}

function makeReviewReceipt(stageId = 'rcpt-review-001') {
  return {
    stage: 'reviewer' as const,
    receiptId: stageId,
    timestamp: new Date().toISOString(),
    evidenceMode: 'live' as const,
    reviewerDecision: {
      decision: 'APPROVE' as const,
      retryCount: 1,
    },
  };
}

function makeClosureReceipt(stageId = 'rcpt-closure-001') {
  return {
    stage: 'closure_gate' as const,
    receiptId: stageId,
    timestamp: new Date().toISOString(),
    evidenceMode: 'live' as const,
    closureResult: {
      evidenceReceiptId: 'final-rcpt',
      chainComplete: true,
      allStagesPass: true,
    },
  };
}

describe('pipeline-chain-orchestrator', () => {
  // --- Stage order ---

  it('defines correct stage order', () => {
    expect(PIPELINE_STAGE_ORDER.intake_gate).toBe(1);
    expect(PIPELINE_STAGE_ORDER.orchestrator).toBe(2);
    expect(PIPELINE_STAGE_ORDER.worker).toBe(3);
    expect(PIPELINE_STAGE_ORDER.reviewer).toBe(4);
    expect(PIPELINE_STAGE_ORDER.closure_gate).toBe(5);
  });

  // --- Role assignment ---

  it('assigns correct MA1 role per stage', () => {
    expect(PIPELINE_STAGE_ROLE.intake_gate).toBe('Orchestrator');
    expect(PIPELINE_STAGE_ROLE.orchestrator).toBe('Orchestrator');
    expect(PIPELINE_STAGE_ROLE.worker).toBe('Implementer');
    expect(PIPELINE_STAGE_ROLE.reviewer).toBe('Reviewer');
    expect(PIPELINE_STAGE_ROLE.closure_gate).toBe('Auditor');
  });

  // --- Stage transitions ---

  it.each([
    ['intake_gate', 'orchestrator', true],
    ['orchestrator', 'worker', true],
    ['worker', 'reviewer', true],
    ['reviewer', 'closure_gate', true],
    ['closure_gate', 'complete', true],
    ['intake_gate', 'worker', false], // skip
    ['intake_gate', 'closure_gate', false], // skip
    ['worker', 'intake_gate', false], // backward
    ['reviewer', 'worker', false], // backward
    ['intake_gate', 'stop', true],
    ['orchestrator', 'stop', true],
  ] as const)('validates transition %s → %s as %s', (from, to, expected) => {
    expect(isValidStageTransition(from as PipelineStage, to)).toBe(expected);
  });

  // --- State creation ---

  it('creates initial pipeline state', () => {
    const state = createPipelineState('build a login form');
    expect(state.currentStage).toBe('intake_gate');
    expect(state.running).toBe(true);
    expect(state.receipts).toHaveLength(0);
    expect(state.workerRetryCount).toBe(0);
    expect(state.reviewerRetryCount).toBe(0);
    expect(state.humanInterventionRequired).toBe(false);
  });

  // --- Stage result building ---

  it('builds a valid stage result with next stage routing', () => {
    const result = buildPipelineStageResult({
      stage: 'intake_gate',
      output: { approved: true },
      receipt: makeIntakeReceipt(),
      nextStage: 'orchestrator',
    });
    expect(result.stage).toBe('intake_gate');
    expect(result.nextStage).toBe('orchestrator');
    expect(result.receipt.stage).toBe('intake_gate');
  });

  // --- Full pipeline flow ---

  it('advances through all 5 stages accumulating receipts', () => {
    let state = createPipelineState('build a login form');

    // Stage 1: Intake
    const intakeResult = buildPipelineStageResult({
      stage: 'intake_gate',
      output: { approved: true, riskLevel: 'R0' },
      receipt: makeIntakeReceipt(),
      nextStage: 'orchestrator',
    });
    state = advancePipelineStage(state, intakeResult);
    expect(state.currentStage).toBe('orchestrator');
    expect(state.receipts).toHaveLength(1);

    // Stage 2: Orchestrator
    const orchResult = buildPipelineStageResult({
      stage: 'orchestrator',
      output: { workOrderCount: 2 },
      receipt: makeOrchestrationReceipt(),
      nextStage: 'worker',
    });
    state = advancePipelineStage(state, orchResult);
    expect(state.currentStage).toBe('worker');
    expect(state.receipts).toHaveLength(2);

    // Stage 3: Worker
    const workerResult = buildPipelineStageResult({
      stage: 'worker',
      output: { success: true },
      receipt: makeWorkerReceipt(),
      nextStage: 'reviewer',
    });
    state = advancePipelineStage(state, workerResult);
    expect(state.currentStage).toBe('reviewer');
    expect(state.receipts).toHaveLength(3);

    // Stage 4: Reviewer
    const reviewResult = buildPipelineStageResult({
      stage: 'reviewer',
      output: { decision: 'APPROVE' },
      receipt: makeReviewReceipt(),
      nextStage: 'closure_gate',
    });
    state = advancePipelineStage(state, reviewResult);
    expect(state.currentStage).toBe('closure_gate');
    expect(state.receipts).toHaveLength(4);

    // Stage 5: Closure
    const closureResult = buildPipelineStageResult({
      stage: 'closure_gate',
      output: { evidenceReceiptId: 'final-rcpt' },
      receipt: makeClosureReceipt(),
      nextStage: 'complete',
    });
    state = advancePipelineStage(state, closureResult);
    expect(state.running).toBe(false);
    expect(state.receipts).toHaveLength(5);
    expect(state.humanInterventionRequired).toBe(false);
  });

  // --- Stop signal ---

  it('sets humanInterventionRequired when nextStage is stop', () => {
    let state = createPipelineState('hack the server');
    const intakeResult = buildPipelineStageResult({
      stage: 'intake_gate',
      output: { approved: false },
      receipt: makeIntakeReceipt(),
      nextStage: 'stop',
      diagnostic: {
        contractVersion: 'cvf.executionDiagnostic.v1',
        stage: 'governance',
        class: 'policy_blocked',
        retryable: false,
        userAction: 'revise_request',
        safeMessage: 'Policy blocked',
      },
    });
    state = advancePipelineStage(state, intakeResult);
    expect(state.humanInterventionRequired).toBe(true);
    expect(state.running).toBe(false);
  });

  // --- Diagnostic class mapping ---

  it('maps intake policy_blocked to correct diagnostic class', () => {
    expect(getStageDiagnosticClass('intake_gate', 'policy_blocked')).toBe('policy_blocked');
  });

  it('maps intake invalid_input to correct diagnostic class', () => {
    expect(getStageDiagnosticClass('intake_gate', 'invalid_input')).toBe('invalid_input');
  });

  it('maps worker timeout to worker_timeout diagnostic class', () => {
    expect(getStageDiagnosticClass('worker', 'timeout')).toBe('worker_timeout');
  });

  it('maps reviewer deadlock to review_deadlock diagnostic class', () => {
    expect(getStageDiagnosticClass('reviewer', 'deadlock')).toBe('review_deadlock');
  });

  it('maps closure incomplete_receipt_chain to receipt_missing', () => {
    expect(getStageDiagnosticClass('closure_gate', 'incomplete_receipt_chain')).toBe('receipt_missing');
  });

  it('returns null for unknown stage/reason combination', () => {
    expect(getStageDiagnosticClass('intake_gate' as PipelineStage, 'unknown')).toBeNull();
  });

  // --- EL-2: WorkerTimeoutHandler ---

  it('recovers worker timeout on first retry', () => {
    const state = createPipelineState('test');
    const result = handleWorkerTimeout(state);
    expect(result.recovered).toBe(true);
    expect(result.retryCount).toBe(1);
    expect(result.nextAction).toBe('retry');
    expect(result.diagnostic.class).toBe('worker_timeout_recovered');
    expect(result.escalateToOrchestrator).toBe(false);
  });

  it('recovers worker timeout on second retry (max allowed)', () => {
    const state = { ...createPipelineState('test'), workerRetryCount: 1 } as ReturnType<typeof createPipelineState>;
    const result = handleWorkerTimeout(state);
    expect(result.recovered).toBe(true);
    expect(result.retryCount).toBe(2);
    expect(result.nextAction).toBe('retry');
    expect(result.diagnostic.class).toBe('worker_timeout_recovered');
  });

  it('escalates after max retries (3rd attempt)', () => {
    const state = { ...createPipelineState('test'), workerRetryCount: WORKER_TIMEOUT_MAX_RETRIES } as ReturnType<typeof createPipelineState>;
    const result = handleWorkerTimeout(state);
    expect(result.recovered).toBe(false);
    expect(result.retryCount).toBe(WORKER_TIMEOUT_MAX_RETRIES + 1);
    expect(result.nextAction).toBe('escalate');
    expect(result.diagnostic.class).toBe('worker_timeout');
    expect(result.escalateToOrchestrator).toBe(true);
  });

  it('validates max retries constant is 2', () => {
    expect(WORKER_TIMEOUT_MAX_RETRIES).toBe(2);
  });

  // --- EL-3: ReviewDeadlockHandler ---

  it('allows continued review within retry window (rejection 1)', () => {
    const state = createPipelineState('test');
    const result = handleReviewDeadlock(state, 'WO-001');
    expect(result.decomposed).toBe(false);
    expect(result.rejectionCount).toBe(1);
    expect(result.nextAction).toBe('continue_review');
    expect(result.diagnostic.class).toBe('review_deadlock');
  });

  it('allows continued review at rejection 3 (last within window)', () => {
    const state = { ...createPipelineState('test'), reviewerRetryCount: 2 } as ReturnType<typeof createPipelineState>;
    const result = handleReviewDeadlock(state, 'WO-001');
    expect(result.decomposed).toBe(false);
    expect(result.rejectionCount).toBe(3);
    expect(result.nextAction).toBe('continue_review');
  });

  it('decomposes after exceeding max retries (rejection 4)', () => {
    const state = { ...createPipelineState('test'), reviewerRetryCount: REVIEW_DEADLOCK_MAX_RETRIES } as ReturnType<typeof createPipelineState>;
    const result = handleReviewDeadlock(state, 'WO-001');
    expect(result.decomposed).toBe(true);
    expect(result.rejectionCount).toBe(REVIEW_DEADLOCK_MAX_RETRIES + 1);
    expect(result.nextAction).toBe('decompose');
    expect(result.diagnostic.class).toBe('review_deadlock_decomposed');
    expect(result.decomposedWorkOrders).toHaveLength(3);
    expect(result.decomposedWorkOrders![0]).toContain('WO-001-subtask');
  });

  it('validates deadlock max retries constant is 3', () => {
    expect(REVIEW_DEADLOCK_MAX_RETRIES).toBe(3);
  });
});
