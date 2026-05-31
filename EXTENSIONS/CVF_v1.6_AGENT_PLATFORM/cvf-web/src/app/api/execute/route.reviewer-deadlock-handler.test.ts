import { describe, it, expect } from 'vitest';
import {
  buildReviewerDeadlockReadout,
  REVIEWER_DEADLOCK_READOUT_VERSION,
  type ReviewerDeadlockReadout,
} from '@/lib/reviewer-deadlock-handler';
import { REVIEW_DEADLOCK_MAX_RETRIES } from '@/lib/pipeline-chain-orchestrator';

describe('buildReviewerDeadlockReadout', () => {
  it('returns not_triggered when reviewerRetryCount is 0', () => {
    const readout = buildReviewerDeadlockReadout(0);
    expect(readout.contractVersion).toBe(REVIEWER_DEADLOCK_READOUT_VERSION);
    expect(readout.triggered).toBe(false);
    expect(readout.nextAction).toBe('not_triggered');
    expect(readout.rejectionCount).toBe(0);
    expect(readout.decomposedWorkOrders).toEqual([]);
    expect(readout.escalateToOrchestrator).toBe(false);
    expect(readout.runtimeExecutionAuthorized).toBe(false);
  });

  it('returns not_triggered when no args provided (default)', () => {
    const readout = buildReviewerDeadlockReadout();
    expect(readout.triggered).toBe(false);
    expect(readout.nextAction).toBe('not_triggered');
    expect(readout.runtimeExecutionAuthorized).toBe(false);
  });

  it('returns continue_review when within retry window (count=1)', () => {
    const readout = buildReviewerDeadlockReadout(1);
    expect(readout.triggered).toBe(false);
    expect(readout.rejectionCount).toBe(1);
    expect(readout.nextAction).toBe('continue_review');
    expect(readout.escalateToOrchestrator).toBe(false);
    expect(readout.runtimeExecutionAuthorized).toBe(false);
  });

  it('returns continue_review at max retries exactly (count=REVIEW_DEADLOCK_MAX_RETRIES)', () => {
    const readout = buildReviewerDeadlockReadout(REVIEW_DEADLOCK_MAX_RETRIES);
    expect(readout.triggered).toBe(false);
    expect(readout.rejectionCount).toBe(REVIEW_DEADLOCK_MAX_RETRIES);
    expect(readout.nextAction).toBe('continue_review');
  });

  it('returns decompose when exceeding max retries (count=REVIEW_DEADLOCK_MAX_RETRIES+1)', () => {
    const readout = buildReviewerDeadlockReadout(REVIEW_DEADLOCK_MAX_RETRIES + 1);
    expect(readout.triggered).toBe(true);
    expect(readout.rejectionCount).toBe(REVIEW_DEADLOCK_MAX_RETRIES + 1);
    expect(readout.nextAction).toBe('decompose');
    expect(readout.decomposedWorkOrders.length).toBeGreaterThan(0);
    expect(readout.escalateToOrchestrator).toBe(false);
    expect(readout.runtimeExecutionAuthorized).toBe(false);
  });

  it('decomposedWorkOrders contains work order id based subtasks', () => {
    const readout = buildReviewerDeadlockReadout(REVIEW_DEADLOCK_MAX_RETRIES + 1, 'my-work-order');
    expect(readout.decomposedWorkOrders).toContain('my-work-order-subtask-1');
    expect(readout.decomposedWorkOrders).toContain('my-work-order-subtask-2');
  });

  it('runtimeExecutionAuthorized is always false — invariant across all paths', () => {
    const r0: ReviewerDeadlockReadout = buildReviewerDeadlockReadout(0);
    const r1: ReviewerDeadlockReadout = buildReviewerDeadlockReadout(1);
    const r2: ReviewerDeadlockReadout = buildReviewerDeadlockReadout(REVIEW_DEADLOCK_MAX_RETRIES + 1);
    expect(r0.runtimeExecutionAuthorized).toBe(false);
    expect(r1.runtimeExecutionAuthorized).toBe(false);
    expect(r2.runtimeExecutionAuthorized).toBe(false);
  });

  it('contractVersion is correct on every path', () => {
    const r0 = buildReviewerDeadlockReadout(0);
    const r1 = buildReviewerDeadlockReadout(1);
    const r2 = buildReviewerDeadlockReadout(REVIEW_DEADLOCK_MAX_RETRIES + 1);
    expect(r0.contractVersion).toBe('cvf.reviewerDeadlockEscalation.el3.v1');
    expect(r1.contractVersion).toBe('cvf.reviewerDeadlockEscalation.el3.v1');
    expect(r2.contractVersion).toBe('cvf.reviewerDeadlockEscalation.el3.v1');
  });

  it('decomposedWorkOrders is empty when not triggered', () => {
    expect(buildReviewerDeadlockReadout(0).decomposedWorkOrders).toEqual([]);
    expect(buildReviewerDeadlockReadout(1).decomposedWorkOrders).toEqual([]);
  });
});
