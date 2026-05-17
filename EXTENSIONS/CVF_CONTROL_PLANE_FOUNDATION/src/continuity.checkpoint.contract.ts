export type ContinuityArtifactRole = "input" | "output" | "evidence";
export type ReinjectionPolicy = "always" | "on-request" | "expired";

export interface ContinuityCheckpoint {
  checkpointId: string;
  taskId: string;
  agentId: string;
  phaseBoundary: string;
  closedDecisions: Array<{
    decisionId: string;
    decision: string;
    reasoning: string;
    irrevocable: boolean;
  }>;
  openItems: Array<{
    itemId: string;
    description: string;
    nextPhase: string;
  }>;
  artifactMemory: Array<{
    path: string;
    hash: string;
    role: ContinuityArtifactRole;
  }>;
  reinjectionPolicy: ReinjectionPolicy;
  evidenceReceiptIds: string[];
}

export interface ContinuityCheckpointValidation {
  valid: boolean;
  violations: string[];
}

export function validateCheckpoint(
  cp: ContinuityCheckpoint,
): ContinuityCheckpointValidation {
  const violations: string[] = [];

  for (const [field, value] of [
    ["checkpointId", cp.checkpointId],
    ["taskId", cp.taskId],
    ["agentId", cp.agentId],
    ["phaseBoundary", cp.phaseBoundary],
  ] as const) {
    if (!isNonEmptyString(value)) {
      violations.push(`${field} must be non-empty`);
    }
  }

  const closedDecisionIds = cp.closedDecisions.map((item) => item.decisionId);
  const openItemIds = cp.openItems.map((item) => item.itemId);
  const closedDecisionSet = new Set(closedDecisionIds);

  for (const openItemId of openItemIds) {
    if (closedDecisionSet.has(openItemId)) {
      violations.push(
        `closed decision ${openItemId} must not also appear in openItems`,
      );
    }
  }

  for (const duplicate of findDuplicates(closedDecisionIds)) {
    violations.push(`duplicate closed decision id ${duplicate}`);
  }

  for (const duplicate of findDuplicates(openItemIds)) {
    violations.push(`duplicate open item id ${duplicate}`);
  }

  if (cp.reinjectionPolicy === "expired" && cp.evidenceReceiptIds.length === 0) {
    violations.push(
      "expired reinjectionPolicy requires at least one evidenceReceiptId",
    );
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
