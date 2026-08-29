export type DelegationRiskCeiling = "R0" | "R1" | "R2" | "R3";
export type DelegationWriteScope = "append-only" | "modify-listed" | "create-only";
export type ProviderExecutionAuthority = "FORBIDDEN" | "ORCHESTRATOR_GRANT_REQUIRED";

export interface ProviderExecutionGrant {
  authority: ProviderExecutionAuthority;
  grantId: string | null;
  authorizedBy: "ORCHESTRATOR" | null;
  subjectAgentId: string;
  delegationId: string;
  allowedProviders: string[];
  maxCalls: number;
  expiresAt: string | null;
}

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
  providerExecution: ProviderExecutionGrant;
}

export interface DelegationValidationResult {
  valid: boolean;
  violations: string[];
}

export interface ProviderExecutionRequest {
  workerAgentId: string;
  delegationId: string;
  grantId: string;
  provider: string;
  consumedCalls: number;
  nowIso: string;
}

export function evaluateProviderExecutionAuthority(
  grant: ProviderExecutionGrant | undefined,
  request: ProviderExecutionRequest,
): { allowed: boolean; reason: string } {
  if (!grant || grant.authority === "FORBIDDEN") {
    return { allowed: false, reason: "provider execution is forbidden without an orchestrator grant" };
  }
  if (grant.authorizedBy !== "ORCHESTRATOR") {
    return { allowed: false, reason: "provider execution grant must be authorized by ORCHESTRATOR" };
  }
  if (!grant.grantId || grant.grantId !== request.grantId) {
    return { allowed: false, reason: "provider execution grant id mismatch" };
  }
  if (grant.subjectAgentId !== request.workerAgentId) {
    return { allowed: false, reason: "provider execution grant subject mismatch" };
  }
  if (grant.delegationId !== request.delegationId) {
    return { allowed: false, reason: "provider execution delegation mismatch" };
  }
  if (!grant.allowedProviders.includes(request.provider)) {
    return { allowed: false, reason: `provider ${request.provider} is outside the orchestrator grant` };
  }
  if (!Number.isInteger(request.consumedCalls) || request.consumedCalls < 0) {
    return { allowed: false, reason: "provider execution consumedCalls is invalid" };
  }
  if (!Number.isInteger(grant.maxCalls) || grant.maxCalls < 1 || request.consumedCalls >= grant.maxCalls) {
    return { allowed: false, reason: "provider execution call budget exhausted" };
  }
  const expiresAt = grant.expiresAt ? Date.parse(grant.expiresAt) : Number.NaN;
  const now = Date.parse(request.nowIso);
  if (!Number.isFinite(expiresAt) || !Number.isFinite(now) || expiresAt <= now) {
    return { allowed: false, reason: "provider execution grant is expired or malformed" };
  }
  return { allowed: true, reason: "provider execution allowed by bounded orchestrator grant" };
}

// EAFR-R10. Sibling contract to ProviderExecutionGrant/ProviderExecutionRequest/
// evaluateProviderExecutionAuthority above, scoped to external-store execution
// instead of provider execution. This is a contract-and-evaluator design only:
// no grant is issued and no runtime consumer wires it to a live external store.
export type ExternalStoreExecutionAuthority = "FORBIDDEN" | "ORCHESTRATOR_GRANT_REQUIRED";

export interface ExternalStoreExecutionGrant {
  authority: ExternalStoreExecutionAuthority;
  grantId: string | null;
  authorizedBy: "ORCHESTRATOR" | null;
  subjectAgentId: string;
  delegationId: string;
  allowedStores: string[];
  maxCalls: number;
  expiresAt: string | null;
}

export interface ExternalStoreExecutionRequest {
  workerAgentId: string;
  delegationId: string;
  grantId: string;
  store: string;
  consumedCalls: number;
  nowIso: string;
}

export function evaluateExternalStoreExecutionAuthority(
  grant: ExternalStoreExecutionGrant | undefined,
  request: ExternalStoreExecutionRequest,
): { allowed: boolean; reason: string } {
  if (!grant || grant.authority === "FORBIDDEN") {
    return { allowed: false, reason: "external-store execution is forbidden without an orchestrator grant" };
  }
  if (grant.authorizedBy !== "ORCHESTRATOR") {
    return { allowed: false, reason: "external-store execution grant must be authorized by ORCHESTRATOR" };
  }
  if (!grant.grantId || grant.grantId !== request.grantId) {
    return { allowed: false, reason: "external-store execution grant id mismatch" };
  }
  if (grant.subjectAgentId !== request.workerAgentId) {
    return { allowed: false, reason: "external-store execution grant subject mismatch" };
  }
  if (grant.delegationId !== request.delegationId) {
    return { allowed: false, reason: "external-store execution delegation mismatch" };
  }
  if (!grant.allowedStores.includes(request.store)) {
    return { allowed: false, reason: `store ${request.store} is outside the orchestrator grant` };
  }
  if (!Number.isInteger(request.consumedCalls) || request.consumedCalls < 0) {
    return { allowed: false, reason: "external-store execution consumedCalls is invalid" };
  }
  if (!Number.isInteger(grant.maxCalls) || grant.maxCalls < 1 || request.consumedCalls >= grant.maxCalls) {
    return { allowed: false, reason: "external-store execution call budget exhausted" };
  }
  const expiresAt = grant.expiresAt ? Date.parse(grant.expiresAt) : Number.NaN;
  const now = Date.parse(request.nowIso);
  if (!Number.isFinite(expiresAt) || !Number.isFinite(now) || expiresAt <= now) {
    return { allowed: false, reason: "external-store execution grant is expired or malformed" };
  }
  return { allowed: true, reason: "external-store execution allowed by bounded orchestrator grant" };
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

  if (!contract.providerExecution) {
    violations.push("providerExecution is required and defaults to FORBIDDEN");
  } else if (contract.providerExecution.authority === "FORBIDDEN") {
    if (
      contract.providerExecution.grantId !== null ||
      contract.providerExecution.authorizedBy !== null ||
      contract.providerExecution.allowedProviders.length !== 0 ||
      contract.providerExecution.maxCalls !== 0 ||
      contract.providerExecution.expiresAt !== null
    ) {
      violations.push("FORBIDDEN providerExecution must not carry grant capability");
    }
  } else if (contract.providerExecution.authority === "ORCHESTRATOR_GRANT_REQUIRED") {
    if (
      !isNonEmptyString(contract.providerExecution.grantId) ||
      contract.providerExecution.authorizedBy !== "ORCHESTRATOR" ||
      !isNonEmptyString(contract.providerExecution.subjectAgentId) ||
      !isNonEmptyString(contract.providerExecution.delegationId) ||
      contract.providerExecution.allowedProviders.length === 0 ||
      !Number.isInteger(contract.providerExecution.maxCalls) ||
      contract.providerExecution.maxCalls < 1 ||
      !isNonEmptyString(contract.providerExecution.expiresAt)
    ) {
      violations.push("ORCHESTRATOR_GRANT_REQUIRED providerExecution is malformed");
    }
  } else {
    violations.push("providerExecution.authority is invalid");
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
