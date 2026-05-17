export type AgentHandoffRiskCeiling = "R0" | "R1" | "R2" | "R3";

export interface AgentHandoffRecord {
  handoffId: string;
  sourceAgentId: string;
  targetAgentId: string;
  taskId: string;
  handoffPhase: string;
  contextSnapshot: {
    closedDecisions: string[];
    openItems: string[];
    artifactRefs: string[];
    evidenceReceiptIds: string[];
  };
  delegationContractRef?: string;
  policyContinuity: {
    inheritedPolicies: string[];
    riskCeiling: AgentHandoffRiskCeiling;
    sandboxTier: number;
  };
  acceptanceCriteria: {
    requiredFinalEvidence: string[];
    returnToSourceCondition?: string;
  };
  receiptId: string;
}

export interface AgentHandoffValidationResult {
  valid: boolean;
  violations: string[];
}

const RISK_ORDER: Record<AgentHandoffRiskCeiling, number> = {
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
};

export function createAgentHandoff(
  input: Omit<AgentHandoffRecord, "receiptId">,
): AgentHandoffRecord {
  return {
    ...input,
    receiptId: `agent-handoff-receipt:${input.handoffId}:${input.taskId}`,
  };
}

export function verifyPolicyContinuity(
  source: AgentHandoffRecord,
  targetRiskCeiling: string,
): boolean {
  if (!isRiskCeiling(targetRiskCeiling)) {
    return false;
  }
  return (
    RISK_ORDER[targetRiskCeiling] >=
    RISK_ORDER[source.policyContinuity.riskCeiling]
  );
}

export function validateAgentHandoff(
  record: Partial<AgentHandoffRecord>,
): AgentHandoffValidationResult {
  const violations: string[] = [];

  for (const field of [
    "handoffId",
    "sourceAgentId",
    "targetAgentId",
    "taskId",
    "handoffPhase",
    "receiptId",
  ] as const) {
    if (!isNonEmptyString(record[field])) {
      violations.push(`${field} must be non-empty`);
    }
  }

  if (!record.contextSnapshot) {
    violations.push("contextSnapshot is required");
  }

  if (!record.policyContinuity) {
    violations.push("policyContinuity is required");
  } else {
    if (!isRiskCeiling(record.policyContinuity.riskCeiling)) {
      violations.push("policyContinuity.riskCeiling must be R0, R1, R2, or R3");
    }
    if (
      !Number.isInteger(record.policyContinuity.sandboxTier) ||
      record.policyContinuity.sandboxTier < 0
    ) {
      violations.push("policyContinuity.sandboxTier must be a non-negative integer");
    }
  }

  if (!record.acceptanceCriteria) {
    violations.push("acceptanceCriteria is required");
  } else if (!Array.isArray(record.acceptanceCriteria.requiredFinalEvidence)) {
    violations.push("acceptanceCriteria.requiredFinalEvidence must be an array");
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

function isRiskCeiling(value: string): value is AgentHandoffRiskCeiling {
  return value === "R0" || value === "R1" || value === "R2" || value === "R3";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
