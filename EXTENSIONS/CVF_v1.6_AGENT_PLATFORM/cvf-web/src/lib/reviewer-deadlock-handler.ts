// Advisory readout only — does not spawn processes or upgrade models automatically.
import {
  handleReviewDeadlock,
  REVIEW_DEADLOCK_MAX_RETRIES,
  createPipelineState,
} from './pipeline-chain-orchestrator';

export const REVIEWER_DEADLOCK_READOUT_VERSION =
  'cvf.reviewerDeadlockEscalation.el3.v1' as const;

export interface ReviewerDeadlockReadout {
  contractVersion: typeof REVIEWER_DEADLOCK_READOUT_VERSION;
  triggered: boolean;
  rejectionCount: number;
  nextAction: 'continue_review' | 'decompose' | 'escalate' | 'not_triggered';
  decomposedWorkOrders: string[];
  escalateToOrchestrator: boolean;
  runtimeExecutionAuthorized: false;
}

export function buildReviewerDeadlockReadout(
  reviewerRetryCount: number = 0,
  workOrderId: string = 'advisory-readout',
): ReviewerDeadlockReadout {
  if (reviewerRetryCount <= 0) {
    return {
      contractVersion: REVIEWER_DEADLOCK_READOUT_VERSION,
      triggered: false,
      rejectionCount: 0,
      nextAction: 'not_triggered',
      decomposedWorkOrders: [],
      escalateToOrchestrator: false,
      runtimeExecutionAuthorized: false,
    };
  }
  const state = { ...createPipelineState(''), reviewerRetryCount: reviewerRetryCount - 1 };
  const result = handleReviewDeadlock(state, workOrderId);
  return {
    contractVersion: REVIEWER_DEADLOCK_READOUT_VERSION,
    triggered: result.rejectionCount > REVIEW_DEADLOCK_MAX_RETRIES,
    rejectionCount: result.rejectionCount,
    nextAction: result.nextAction,
    decomposedWorkOrders: result.decomposedWorkOrders ?? [],
    escalateToOrchestrator: result.escalateToOrchestrator,
    runtimeExecutionAuthorized: false,
  };
}
