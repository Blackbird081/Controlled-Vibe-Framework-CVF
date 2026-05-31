import { describe, it, expect } from 'vitest';
import {
  buildOrchestratorFeedbackSummary,
  ORCHESTRATOR_FEEDBACK_BUS_VERSION,
} from '@/lib/orchestrator-feedback-bus';
import { buildWorkerTimeoutReadout } from '@/lib/worker-timeout-handler';
import { buildReviewerDeadlockReadout } from '@/lib/reviewer-deadlock-handler';
import { buildContextBudgetReadout } from '@/lib/context-budget-readout';

function nominalReadouts() {
  return {
    worker: buildWorkerTimeoutReadout(0),
    reviewer: buildReviewerDeadlockReadout(0),
    budget: buildContextBudgetReadout('OPERATOR'),
  };
}

describe('buildOrchestratorFeedbackSummary', () => {
  it('returns NOMINAL when all signals are within bounds', () => {
    const { worker, reviewer, budget } = nominalReadouts();
    const summary = buildOrchestratorFeedbackSummary(worker, reviewer, budget);
    expect(summary.contractVersion).toBe(ORCHESTRATOR_FEEDBACK_BUS_VERSION);
    expect(summary.overallSignal).toBe('NOMINAL');
    expect(summary.runtimeExecutionAuthorized).toBe(false);
    expect(summary.recommendedAction).toContain('NOMINAL');
  });

  it('returns non-NOMINAL when worker timed out (over 5-min threshold)', () => {
    const worker = buildWorkerTimeoutReadout(300_001); // over 300_000ms threshold
    const { reviewer, budget } = nominalReadouts();
    const summary = buildOrchestratorFeedbackSummary(worker, reviewer, budget);
    expect(summary.overallSignal).not.toBe('NOMINAL');
    expect(summary.workerTimeoutSignal.triggered).toBe(true);
  });

  it('surfaces reviewer rejection count correctly', () => {
    // buildReviewerDeadlockReadout(2) = state.reviewerRetryCount=1 → rejectionCount=2
    const reviewer = buildReviewerDeadlockReadout(2);
    const { worker, budget } = nominalReadouts();
    const summary = buildOrchestratorFeedbackSummary(worker, reviewer, budget);
    expect(summary.reviewerRejectionSignal.rejectionCount).toBeGreaterThan(0);
    expect(summary.reviewerRejectionSignal.triggered).toBe(false); // < REVIEW_DEADLOCK_MAX_RETRIES(3)
  });

  it('aggregates reviewer rejection count from deadlock readout', () => {
    // buildReviewerDeadlockReadout(5): state.reviewerRetryCount=4 → handleReviewDeadlock → rejectionCount=5
    const reviewer = buildReviewerDeadlockReadout(5);
    const { worker, budget } = nominalReadouts();
    const summary = buildOrchestratorFeedbackSummary(worker, reviewer, budget);
    // Regardless of ESCALATE/CAUTION, count must be surfaced
    expect(summary.reviewerRejectionSignal.rejectionCount).toBeGreaterThan(3);
    // overallSignal must not be NOMINAL when rejections > 3
    expect(summary.overallSignal).not.toBe('NOMINAL');
  });

  it('returns ESCALATE when human intervention required', () => {
    const { worker, reviewer, budget } = nominalReadouts();
    const summary = buildOrchestratorFeedbackSummary(worker, reviewer, budget, true);
    expect(summary.overallSignal).toBe('ESCALATE');
    expect(summary.humanInterventionRequired).toBe(true);
    expect(summary.recommendedAction).toContain('HUMAN_INTERVENTION_REQUIRED');
  });

  it('returns CAUTION when context budget exceeded', () => {
    const budget = buildContextBudgetReadout('REVIEWER', 10_000); // over 6k budget
    const { worker, reviewer } = nominalReadouts();
    const summary = buildOrchestratorFeedbackSummary(worker, reviewer, budget);
    expect(['CAUTION', 'ESCALATE']).toContain(summary.overallSignal);
    expect(summary.contextBudgetSignal.withinBudget).toBe(false);
  });

  it('always sets runtimeExecutionAuthorized to false', () => {
    const { worker, reviewer, budget } = nominalReadouts();
    const summary = buildOrchestratorFeedbackSummary(worker, reviewer, budget);
    expect(summary.runtimeExecutionAuthorized).toBe(false);
  });

  it('surfaces all three signal types in summary', () => {
    const { worker, reviewer, budget } = nominalReadouts();
    const summary = buildOrchestratorFeedbackSummary(worker, reviewer, budget);
    expect(summary.workerTimeoutSignal).toBeDefined();
    expect(summary.reviewerRejectionSignal).toBeDefined();
    expect(summary.contextBudgetSignal).toBeDefined();
  });
});
