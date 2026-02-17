// src/core/execution-state-machine.ts
//
// NOTE: ExecutionState here maps to ExecutionPhase in execution-context.ts:
// INITIALIZED = INIT, RISK_CLASSIFIED = RISK_CLASSIFIED, GOVERNANCE_APPROVED = GOVERNANCE_APPROVED,
// EXECUTING = AI_EXECUTED (in-progress), VALIDATING = VALIDATED (in-progress),
// COMPLETED = COMPLETED, FAILED = REJECTED

export type ExecutionState =
  | "INITIALIZED"
  | "RISK_CLASSIFIED"
  | "GOVERNANCE_APPROVED"
  | "EXECUTING"
  | "VALIDATING"
  | "COMPLETED"
  | "FAILED";

export class ExecutionStateMachine {
  private current: ExecutionState = "INITIALIZED";

  transition(next: ExecutionState) {
    const allowedTransitions: Record<ExecutionState, ExecutionState[]> = {
      INITIALIZED: ["RISK_CLASSIFIED", "FAILED"],
      RISK_CLASSIFIED: ["GOVERNANCE_APPROVED", "FAILED"],
      GOVERNANCE_APPROVED: ["EXECUTING", "FAILED"],
      EXECUTING: ["VALIDATING", "FAILED"],
      VALIDATING: ["COMPLETED", "FAILED"],
      COMPLETED: [],
      FAILED: []
    };

    if (!allowedTransitions[this.current].includes(next)) {
      throw new Error(
        `Invalid state transition from ${this.current} to ${next}`
      );
    }

    this.current = next;
  }

  getState() {
    return this.current;
  }
}
