// Advisory readout only — does not kill processes or cancel providers.
import {
  handleWorkerTimeout,
  WORKER_TIMEOUT_DEFAULT_MS,
  createPipelineState,
} from './pipeline-chain-orchestrator';

export const WORKER_TIMEOUT_READOUT_VERSION =
  'cvf.workerTimeoutEnforcement.el2.v1' as const;

export interface WorkerTimeoutReadout {
  contractVersion: typeof WORKER_TIMEOUT_READOUT_VERSION;
  triggered: boolean;
  retryCount: number;
  nextAction: 'retry' | 'escalate' | 'stop' | 'not_triggered';
  escalateToOrchestrator: boolean;
  runtimeExecutionAuthorized: false;
}

export function buildWorkerTimeoutReadout(
  elapsedMs: number,
  workerRetryCount: number = 0,
): WorkerTimeoutReadout {
  if (elapsedMs < WORKER_TIMEOUT_DEFAULT_MS) {
    return {
      contractVersion: WORKER_TIMEOUT_READOUT_VERSION,
      triggered: false,
      retryCount: workerRetryCount,
      nextAction: 'not_triggered',
      escalateToOrchestrator: false,
      runtimeExecutionAuthorized: false,
    };
  }
  const state = { ...createPipelineState(''), workerRetryCount };
  const result = handleWorkerTimeout(state, elapsedMs);
  return {
    contractVersion: WORKER_TIMEOUT_READOUT_VERSION,
    triggered: true,
    retryCount: result.retryCount,
    nextAction: result.nextAction,
    escalateToOrchestrator: result.escalateToOrchestrator,
    runtimeExecutionAuthorized: false,
  };
}
