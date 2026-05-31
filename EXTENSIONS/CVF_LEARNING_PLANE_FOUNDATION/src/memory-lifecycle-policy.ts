export const MEMORY_LIFECYCLE_POLICY_VERSION =
  "cvf.memoryLifecyclePolicy.phase2a.v1";

export type MemoryLifecycleState =
  | "working"
  | "episodic"
  | "semantic"
  | "procedural"
  | "expired"
  | "disputed"
  | "forgotten";

export interface MemoryLifecycleTransitionInput {
  currentState: MemoryLifecycleState;
  ageDays: number;
  accessCount: number;
  reinforced?: boolean;
  auditConfirmed?: boolean;
  contradicted?: boolean;
  containsSecret?: boolean;
  userRequestedForget?: boolean;
  sessionEnded?: boolean;
}

export interface MemoryLifecycleTransition {
  contractVersion: typeof MEMORY_LIFECYCLE_POLICY_VERSION;
  from: MemoryLifecycleState;
  to: MemoryLifecycleState;
  reason: string;
  canReinject: boolean;
  durablePersistenceCreated: false;
}

function transition(
  input: MemoryLifecycleTransitionInput,
  to: MemoryLifecycleState,
  reason: string,
): MemoryLifecycleTransition {
  return {
    contractVersion: MEMORY_LIFECYCLE_POLICY_VERSION,
    from: input.currentState,
    to,
    reason,
    canReinject: to === "semantic" || to === "procedural",
    durablePersistenceCreated: false,
  };
}

export function evaluateLifecycleTransition(
  input: MemoryLifecycleTransitionInput,
): MemoryLifecycleTransition {
  if (input.containsSecret === true || input.userRequestedForget === true) {
    return transition(input, "forgotten", "forget_policy_takes_precedence");
  }

  if (input.contradicted === true) {
    return transition(input, "disputed", "contradiction_requires_review");
  }

  if (input.currentState === "working" && input.sessionEnded === true) {
    return transition(input, "episodic", "session_end_promotes_working_memory_to_episodic");
  }

  if (input.ageDays >= 90 && input.reinforced !== true) {
    return transition(input, "expired", "unreinforced_memory_expired");
  }

  if (input.currentState === "episodic" &&
    input.accessCount >= 3 &&
    input.reinforced === true &&
    input.auditConfirmed === true) {
    return transition(input, "semantic", "reinforced_audited_memory_promoted_to_semantic");
  }

  if (input.currentState === "semantic" &&
    input.accessCount >= 5 &&
    input.reinforced === true &&
    input.auditConfirmed === true) {
    return transition(input, "procedural", "repeated_audited_semantic_memory_promoted_to_procedural");
  }

  return transition(input, input.currentState, "memory_lifecycle_state_retained");
}
