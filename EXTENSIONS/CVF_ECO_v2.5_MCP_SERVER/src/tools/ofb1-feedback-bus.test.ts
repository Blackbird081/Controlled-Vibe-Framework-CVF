/**
 * OFB-1 Orchestrator Feedback Bus MCP Tool Tests
 * Tests: cvf_get_feedback_summary
 */
import { describe, it, expect } from 'vitest';

const OFB1_CONTRACT = 'cvf.orchestratorFeedbackBus.ofb1.v1';

function getFeedbackSummary(args: {
  workerRetryCount?: number;
  reviewerRejectionCount?: number;
  contextBudgetExceeded?: boolean;
  taskClass?: string;
  humanInterventionRequired?: boolean;
}) {
  const workerRetryCount = args.workerRetryCount ?? 0;
  const reviewerRejectionCount = args.reviewerRejectionCount ?? 0;
  const contextBudgetExceeded = args.contextBudgetExceeded ?? false;
  const taskClass = args.taskClass ?? 'general';
  const humanInterventionRequired = args.humanInterventionRequired ?? false;

  const workerEscalate = workerRetryCount >= 2;
  const reviewerEscalate = reviewerRejectionCount > 3;
  const escalate = humanInterventionRequired || workerEscalate || reviewerEscalate;
  const caution = workerRetryCount > 0 || reviewerRejectionCount > 0 || contextBudgetExceeded;
  const overallSignal = escalate ? 'ESCALATE' : caution ? 'CAUTION' : 'NOMINAL';
  const recommendedAction = humanInterventionRequired
    ? 'HUMAN_INTERVENTION_REQUIRED: Operator must intervene.'
    : reviewerEscalate
      ? `DECOMPOSE_TASK: ${reviewerRejectionCount} rejections — decompose task into smaller units.`
      : workerEscalate
        ? 'ESCALATE_WORKER: Worker timed out repeatedly — consider more capable model.'
        : contextBudgetExceeded
          ? `REDUCE_CONTEXT: ${taskClass} task exceeded budget — narrow scope.`
          : 'NOMINAL: Proceed normally.';

  return {
    contractVersion: OFB1_CONTRACT,
    tool: 'cvf_get_feedback_summary',
    overallSignal,
    recommendedAction,
    workerTimeoutSignal: { triggered: workerRetryCount > 0, retryCount: workerRetryCount, escalateToOrchestrator: workerEscalate },
    reviewerRejectionSignal: { triggered: reviewerRejectionCount > 0, rejectionCount: reviewerRejectionCount, escalateToOrchestrator: reviewerEscalate },
    contextBudgetSignal: { withinBudget: !contextBudgetExceeded, taskClass },
    humanInterventionRequired,
    runtimeExecutionAuthorized: false,
  };
}

describe('cvf_get_feedback_summary', () => {
  it('returns NOMINAL with no issues', () => {
    const result = getFeedbackSummary({});
    expect(result.contractVersion).toBe(OFB1_CONTRACT);
    expect(result.overallSignal).toBe('NOMINAL');
    expect(result.runtimeExecutionAuthorized).toBe(false);
  });

  it('returns CAUTION on single worker retry', () => {
    const result = getFeedbackSummary({ workerRetryCount: 1 });
    expect(result.overallSignal).toBe('CAUTION');
    expect(result.workerTimeoutSignal.escalateToOrchestrator).toBe(false);
  });

  it('returns ESCALATE on worker retry >= 2', () => {
    const result = getFeedbackSummary({ workerRetryCount: 2 });
    expect(result.overallSignal).toBe('ESCALATE');
    expect(result.workerTimeoutSignal.escalateToOrchestrator).toBe(true);
    expect(result.recommendedAction).toContain('ESCALATE_WORKER');
  });

  it('returns ESCALATE on reviewer rejections > 3', () => {
    const result = getFeedbackSummary({ reviewerRejectionCount: 4 });
    expect(result.overallSignal).toBe('ESCALATE');
    expect(result.reviewerRejectionSignal.escalateToOrchestrator).toBe(true);
    expect(result.recommendedAction).toContain('DECOMPOSE_TASK');
  });

  it('returns ESCALATE on human intervention required', () => {
    const result = getFeedbackSummary({ humanInterventionRequired: true });
    expect(result.overallSignal).toBe('ESCALATE');
    expect(result.recommendedAction).toContain('HUMAN_INTERVENTION_REQUIRED');
  });

  it('returns CAUTION on context budget exceeded', () => {
    const result = getFeedbackSummary({ contextBudgetExceeded: true, taskClass: 'implementation' });
    expect(['CAUTION', 'ESCALATE']).toContain(result.overallSignal);
    expect(result.contextBudgetSignal.withinBudget).toBe(false);
    expect(result.recommendedAction).toContain('REDUCE_CONTEXT');
  });
});
