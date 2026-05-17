export type DelegationRiskCeiling = "R0" | "R1" | "R2" | "R3";
export type DelegationWriteScope = "append-only" | "modify-listed" | "create-only";

export interface DelegationContract {
  parentTaskId: string;
  workerAgentId: string;
  delegationId: string;
  ownership: {
    ownedFiles: string[];
    ownedModules: string[];
    forbiddenPaths: string[];
    writeScope: DelegationWriteScope;
  };
  inheritedBoundaries: {
    riskCeiling: DelegationRiskCeiling;
    policyIds: string[];
    sandboxTier: number;
  };
  reportRequirement: {
    finalChangedFiles: "required";
    finalEvidenceReceipts: "required";
    interimCheckpoints: "optional";
  };
  blockedActions: Array<{
    action: string;
    reason: string;
  }>;
}

export interface DelegationValidationResult {
  valid: boolean;
  violations: string[];
}

export function validateWriteScope(
  path: string,
  contract: DelegationContract,
): { allowed: boolean; reason: string } {
  const normalizedPath = normalizePath(path);

  if (!normalizedPath) {
    return { allowed: false, reason: "path is required" };
  }

  const forbiddenPath = contract.ownership.forbiddenPaths.find((candidate) =>
    pathMatches(normalizedPath, candidate),
  );
  if (forbiddenPath) {
    return {
      allowed: false,
      reason: `path ${normalizedPath} is forbidden by ${forbiddenPath}`,
    };
  }

  if (contract.ownership.ownedFiles.some((candidate) => pathMatches(normalizedPath, candidate))) {
    return {
      allowed: true,
      reason: `path ${normalizedPath} is explicitly owned`,
    };
  }

  if (contract.ownership.ownedModules.some((candidate) => pathWithin(normalizedPath, candidate))) {
    return {
      allowed: true,
      reason: `path ${normalizedPath} is within an owned module`,
    };
  }

  return {
    allowed: false,
    reason: `path ${normalizedPath} is outside delegated ownership`,
  };
}

export function validateClosureReport(
  contract: DelegationContract,
  changedFiles: string[],
  evidenceReceipts: string[],
): DelegationValidationResult {
  const violations: string[] = [];

  if (
    contract.reportRequirement.finalChangedFiles === "required" &&
    changedFiles.length === 0
  ) {
    violations.push("finalChangedFiles are required for delegation closure");
  }

  if (
    contract.reportRequirement.finalEvidenceReceipts === "required" &&
    evidenceReceipts.length === 0
  ) {
    violations.push("finalEvidenceReceipts are required for delegation closure");
  }

  for (const changedFile of changedFiles) {
    const writeResult = validateWriteScope(changedFile, contract);
    if (!writeResult.allowed) {
      violations.push(writeResult.reason);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

export function validateDelegationContract(
  contract: Partial<DelegationContract>,
): DelegationValidationResult {
  const violations: string[] = [];

  for (const [field, value] of [
    ["parentTaskId", contract.parentTaskId],
    ["workerAgentId", contract.workerAgentId],
    ["delegationId", contract.delegationId],
  ] as const) {
    if (!isNonEmptyString(value)) {
      violations.push(`${field} must be non-empty`);
    }
  }

  if (!contract.ownership) {
    violations.push("ownership is required");
  } else {
    if (!isWriteScope(contract.ownership.writeScope)) {
      violations.push("ownership.writeScope is invalid");
    }
    for (const forbiddenPath of contract.ownership.forbiddenPaths) {
      if (
        contract.ownership.ownedFiles.some((ownedFile) => pathMatches(ownedFile, forbiddenPath))
      ) {
        violations.push(`forbidden path ${forbiddenPath} overlaps delegated ownership`);
      }
    }
  }

  if (!contract.inheritedBoundaries) {
    violations.push("inheritedBoundaries is required");
  } else {
    if (!isRiskCeiling(contract.inheritedBoundaries.riskCeiling)) {
      violations.push("inheritedBoundaries.riskCeiling is invalid");
    }
    if (
      !Number.isInteger(contract.inheritedBoundaries.sandboxTier) ||
      contract.inheritedBoundaries.sandboxTier < 0
    ) {
      violations.push("inheritedBoundaries.sandboxTier must be a non-negative integer");
    }
  }

  if (!contract.reportRequirement) {
    violations.push("reportRequirement is required");
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

function isRiskCeiling(value: unknown): value is DelegationRiskCeiling {
  return value === "R0" || value === "R1" || value === "R2" || value === "R3";
}

function isWriteScope(value: unknown): value is DelegationWriteScope {
  return value === "append-only" || value === "modify-listed" || value === "create-only";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizePath(path: string): string {
  return path.trim().replace(/\\/g, "/").replace(/^\.\/+/, "");
}

function pathMatches(path: string, candidate: string): boolean {
  const normalizedCandidate = normalizePath(candidate);
  return path === normalizedCandidate || pathWithin(path, normalizedCandidate);
}

function pathWithin(path: string, directory: string): boolean {
  const normalizedDirectory = normalizePath(directory).replace(/\/+$/, "");
  return path === normalizedDirectory || path.startsWith(`${normalizedDirectory}/`);
}
