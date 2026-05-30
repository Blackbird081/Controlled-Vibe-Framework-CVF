export const CONTEXT_BUDGET_POLICY_VERSION =
  "cvf.contextBudgetPolicy.cbp1.v1";

export type ContextTaskClass =
  | "intake"
  | "orchestration"
  | "implementation"
  | "review"
  | "closure"
  | "general";

// Default token budgets per task class, derived from LHW18 T3 advisory
// (context management strategy: agent receives minimum necessary context).
// Units: estimated tokens. Callers use these to populate tokenBudget in
// MemoryContextPackageInput rather than picking arbitrary values.
const BUDGET_BY_TASK_CLASS: Record<ContextTaskClass, number> = {
  intake:         2_000,   // intent validation only — narrow context
  orchestration:  4_000,   // plan + work-order context
  implementation: 8_000,   // task spec + relevant module + architecture fragment
  review:         6_000,   // output + spec + review criteria
  closure:        3_000,   // receipt + completeness check
  general:        4_000,   // fallback when task class is unspecified
};

export interface ContextBudgetPolicy {
  contractVersion: typeof CONTEXT_BUDGET_POLICY_VERSION;
  taskClass: ContextTaskClass;
  budgetTokens: number;
  rationale: string;
}

export function getContextBudget(taskClass: ContextTaskClass): ContextBudgetPolicy {
  return {
    contractVersion: CONTEXT_BUDGET_POLICY_VERSION,
    taskClass,
    budgetTokens: BUDGET_BY_TASK_CLASS[taskClass],
    rationale: `Default budget for ${taskClass} task class per CVF context management advisory (LHW18 T3).`,
  };
}

export function resolveTaskClass(role: string): ContextTaskClass {
  switch (role) {
    case "OBSERVER":
    case "ANALYST":
      return "review";
    case "BUILDER":
    case "AI_AGENT":
    case "SERVICE_AGENT":
      return "implementation";
    case "REVIEWER":
      return "review";
    case "GOVERNOR":
    case "OPERATOR":
      return "orchestration";
    case "HUMAN":
      return "general";
    default:
      return "general";
  }
}
