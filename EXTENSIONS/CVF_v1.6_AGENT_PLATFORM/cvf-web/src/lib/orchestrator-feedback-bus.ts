// Advisory aggregation only — surfaces subagent signals to Orchestrator.
// runtimeExecutionAuthorized: false — CVF does not make routing decisions.
import type { WorkerTimeoutReadout } from './worker-timeout-handler';
import type { ReviewerDeadlockReadout } from './reviewer-deadlock-handler';
import type { ContextBudgetReadout } from './context-budget-readout';

export const ORCHESTRATOR_FEEDBACK_BUS_VERSION =
  'cvf.orchestratorFeedbackBus.ofb1.v1' as const;

export type OverallSignal = 'NOMINAL' | 'CAUTION' | 'ESCALATE';

export interface OrchestratorFeedbackSummary {
  contractVersion: typeof ORCHESTRATOR_FEEDBACK_BUS_VERSION;
  overallSignal: OverallSignal;
  recommendedAction: string;
  workerTimeoutSignal: {
    triggered: boolean;
    retryCount: number;
    escalateToOrchestrator: boolean;
  };
  reviewerRejectionSignal: {
    triggered: boolean;
    rejectionCount: number;
    decomposedWorkOrders: string[];
    escalateToOrchestrator: boolean;
  };
  contextBudgetSignal: {
    withinBudget: boolean;
    taskClass: string;
    budgetTokens: number;
  };
  humanInterventionRequired: boolean;
  runtimeExecutionAuthorized: false;
}

export function buildOrchestratorFeedbackSummary(
  workerTimeout: WorkerTimeoutReadout,
  reviewerDeadlock: ReviewerDeadlockReadout,
  contextBudget: ContextBudgetReadout,
  humanInterventionRequired: boolean = false,
): OrchestratorFeedbackSummary {
  const escalate =
    humanInterventionRequired ||
    workerTimeout.escalateToOrchestrator ||
    reviewerDeadlock.escalateToOrchestrator ||
    reviewerDeadlock.triggered;
  const caution =
    workerTimeout.triggered ||
    reviewerDeadlock.triggered ||
    !contextBudget.withinBudget;

  const overallSignal: OverallSignal = escalate
    ? 'ESCALATE'
    : caution
      ? 'CAUTION'
      : 'NOMINAL';

  const recommendedAction = resolveRecommendedAction(
    overallSignal,
    workerTimeout,
    reviewerDeadlock,
    contextBudget,
    humanInterventionRequired,
  );

  return {
    contractVersion: ORCHESTRATOR_FEEDBACK_BUS_VERSION,
    overallSignal,
    recommendedAction,
    workerTimeoutSignal: {
      triggered: workerTimeout.triggered,
      retryCount: workerTimeout.retryCount,
      escalateToOrchestrator: workerTimeout.escalateToOrchestrator,
    },
    reviewerRejectionSignal: {
      triggered: reviewerDeadlock.triggered,
      rejectionCount: reviewerDeadlock.rejectionCount,
      decomposedWorkOrders: reviewerDeadlock.decomposedWorkOrders,
      escalateToOrchestrator: reviewerDeadlock.escalateToOrchestrator,
    },
    contextBudgetSignal: {
      withinBudget: contextBudget.withinBudget,
      taskClass: contextBudget.taskClass,
      budgetTokens: contextBudget.budgetTokens,
    },
    humanInterventionRequired,
    runtimeExecutionAuthorized: false,
  };
}

function resolveRecommendedAction(
  signal: OverallSignal,
  workerTimeout: WorkerTimeoutReadout,
  reviewerDeadlock: ReviewerDeadlockReadout,
  contextBudget: ContextBudgetReadout,
  humanInterventionRequired: boolean,
): string {
  if (humanInterventionRequired) {
    return 'HUMAN_INTERVENTION_REQUIRED: Pipeline deadlocked — operator must review and restart.';
  }
  if ((reviewerDeadlock.escalateToOrchestrator || reviewerDeadlock.triggered) && reviewerDeadlock.decomposedWorkOrders.length > 0) {
    return `DECOMPOSE_TASK: Reviewer rejected ${reviewerDeadlock.rejectionCount} times. Use decomposed work orders: [${reviewerDeadlock.decomposedWorkOrders.join(', ')}].`;
  }
  if (workerTimeout.escalateToOrchestrator) {
    return `ESCALATE_WORKER: Worker timed out after ${workerTimeout.retryCount} retries. Consider switching to a more capable model or simplifying the task.`;
  }
  if (reviewerDeadlock.triggered) {
    return `REVIEW_LOOP_DETECTED: ${reviewerDeadlock.rejectionCount} rejections. Orchestrator should decompose or clarify requirements before re-dispatching.`;
  }
  if (!contextBudget.withinBudget) {
    return `REDUCE_CONTEXT: Task class "${contextBudget.taskClass}" exceeded ${contextBudget.budgetTokens} token budget. Narrow task scope before next dispatch.`;
  }
  if (workerTimeout.triggered) {
    return `WORKER_SLOW: Worker timed out once (${workerTimeout.retryCount} retries). Monitor next execution.`;
  }
  return 'NOMINAL: All subagent signals within expected bounds. Proceed normally.';
}
