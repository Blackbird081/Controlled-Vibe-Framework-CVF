import { BudgetPolicy } from "./budget.types";

export const defaultBudgetPolicies: BudgetPolicy[] = [
  {
    scope: "EXECUTION",
    hardLimitUsd: 3,
    softLimitUsd: 2,
    maxTokens: 150000,
  },
  {
    scope: "USER_DAILY",
    hardLimitUsd: 20,
  },
  {
    scope: "ORG_MONTHLY",
    hardLimitUsd: 500,
  },
  {
    scope: "SESSION_LOOP",
    hardLimitUsd: 10,
    maxTokens: 400000,
  },
];