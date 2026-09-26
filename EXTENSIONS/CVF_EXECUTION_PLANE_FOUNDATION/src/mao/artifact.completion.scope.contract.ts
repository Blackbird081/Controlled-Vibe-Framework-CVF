import { computeDeterministicHash } from "../../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

export const MAO_ARTIFACT_COMPLETION_SCOPE_VERSION =
  "cvf.mao-artifact-completion-scope.v1" as const;

export type MaoArtifactCompletionStatus = "COMPLETE" | "INCOMPLETE";

export type MaoArtifactCompletionIssueCode =
  | "MISSING_IDENTITY"
  | "INVALID_CONCURRENCY_CAP"
  | "EMPTY_DECLARED_SCOPE"
  | "DUPLICATE_DECLARED_WORK_ITEM"
  | "DUPLICATE_SCHEDULED_WORK_ITEM"
  | "SCHEDULED_SCOPE_MISMATCH"
  | "EXPECTED_ARTIFACT_MAPPING_INVALID"
  | "DUPLICATE_EXPECTED_ARTIFACT_PATH"
  | "DUPLICATE_OBSERVED_ARTIFACT_PATH"
  | "MISSING_ARTIFACT"
  | "ARTIFACT_HASH_MISSING"
  | "WRITE_OWNER_MISMATCH"
  | "ASSEMBLY_VERIFIER_MISMATCH"
  | "UNEXPECTED_ARTIFACT";

export interface MaoExpectedArtifact {
  workItemId: string;
  path: string;
  assignedWriterId: string;
}

export interface MaoObservedArtifact {
  path: string;
  contentHash: string;
  writerId: string;
  verifiedBy: string;
}

export interface MaoWorkerCompletionNotification {
  workItemId: string;
  workerId: string;
  status: "COMPLETE" | "BLOCKED";
}

export interface MaoArtifactCompletionScopeInput {
  dispatchId: string;
  evaluatedAt: string;
  sourcePin: string;
  assemblyVerifierId: string;
  concurrencyCap: number;
  declaredWorkItemIds: readonly string[];
  scheduledWorkItemIds: readonly string[];
  expectedArtifacts: readonly MaoExpectedArtifact[];
  observedArtifacts: readonly MaoObservedArtifact[];
  workerNotifications?: readonly MaoWorkerCompletionNotification[];
}

export interface MaoArtifactCompletionScopeReceipt {
  schemaVersion: typeof MAO_ARTIFACT_COMPLETION_SCOPE_VERSION;
  dispatchId: string;
  evaluatedAt: string;
  sourcePin: string;
  concurrencyCap: number;
  declaredWorkItemIds: readonly string[];
  scheduledWorkItemIds: readonly string[];
  batches: readonly (readonly string[])[];
  scopePreserved: true;
  expectedArtifactCount: number;
  verifiedArtifactCount: number;
  workerNotificationCount: number;
  notificationAuthority: "NON_AUTHORITATIVE";
  completionAuthority: "ARTIFACT_AND_ASSEMBLY_VERIFICATION";
  status: MaoArtifactCompletionStatus;
  issues: readonly MaoArtifactCompletionIssueCode[];
  receiptHash: string;
}

export interface MaoArtifactCompletionScopeFailure {
  ok: false;
  issues: readonly MaoArtifactCompletionIssueCode[];
}

export interface MaoArtifactCompletionScopeSuccess {
  ok: true;
  receipt: MaoArtifactCompletionScopeReceipt;
}

export type MaoArtifactCompletionScopeResult =
  | MaoArtifactCompletionScopeFailure
  | MaoArtifactCompletionScopeSuccess;

function present(value: string): boolean {
  return value.trim().length > 0;
}

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

function uniqueIssues(
  issues: readonly MaoArtifactCompletionIssueCode[],
): MaoArtifactCompletionIssueCode[] {
  return [...new Set(issues)];
}

function buildBatches(
  scheduledWorkItemIds: readonly string[],
  concurrencyCap: number,
): readonly (readonly string[])[] {
  const batches: string[][] = [];
  for (let index = 0; index < scheduledWorkItemIds.length; index += concurrencyCap) {
    batches.push(scheduledWorkItemIds.slice(index, index + concurrencyCap));
  }
  return batches;
}

function canonicalExpected(artifacts: readonly MaoExpectedArtifact[]): string {
  return [...artifacts]
    .sort((left, right) => left.path.localeCompare(right.path))
    .map((artifact) => `${artifact.workItemId}:${artifact.path}:${artifact.assignedWriterId}`)
    .join("|");
}

function canonicalObserved(artifacts: readonly MaoObservedArtifact[]): string {
  return [...artifacts]
    .sort((left, right) => left.path.localeCompare(right.path))
    .map(
      (artifact) =>
        `${artifact.path}:${artifact.contentHash}:${artifact.writerId}:${artifact.verifiedBy}`,
    )
    .join("|");
}

export function evaluateArtifactCompletionScope(
  input: MaoArtifactCompletionScopeInput,
): MaoArtifactCompletionScopeResult {
  const structuralIssues: MaoArtifactCompletionIssueCode[] = [];
  if (
    !present(input.dispatchId) ||
    !present(input.evaluatedAt) ||
    !present(input.sourcePin) ||
    !present(input.assemblyVerifierId)
  ) {
    structuralIssues.push("MISSING_IDENTITY");
  }
  if (!Number.isInteger(input.concurrencyCap) || input.concurrencyCap < 1) {
    structuralIssues.push("INVALID_CONCURRENCY_CAP");
  }
  if (
    input.declaredWorkItemIds.length === 0 ||
    input.declaredWorkItemIds.some((workItemId) => !present(workItemId))
  ) {
    structuralIssues.push("EMPTY_DECLARED_SCOPE");
  }
  if (hasDuplicates(input.declaredWorkItemIds)) {
    structuralIssues.push("DUPLICATE_DECLARED_WORK_ITEM");
  }
  if (hasDuplicates(input.scheduledWorkItemIds)) {
    structuralIssues.push("DUPLICATE_SCHEDULED_WORK_ITEM");
  }
  if (!sameSet(input.declaredWorkItemIds, input.scheduledWorkItemIds)) {
    structuralIssues.push("SCHEDULED_SCOPE_MISMATCH");
  }

  const expectedWorkItemIds = input.expectedArtifacts.map((artifact) => artifact.workItemId);
  const expectedPaths = input.expectedArtifacts.map((artifact) => artifact.path);
  if (
    input.expectedArtifacts.some(
      (artifact) =>
        !present(artifact.workItemId) ||
        !present(artifact.path) ||
        !present(artifact.assignedWriterId),
    ) ||
    hasDuplicates(expectedWorkItemIds) ||
    !sameSet(input.declaredWorkItemIds, expectedWorkItemIds)
  ) {
    structuralIssues.push("EXPECTED_ARTIFACT_MAPPING_INVALID");
  }
  if (hasDuplicates(expectedPaths)) {
    structuralIssues.push("DUPLICATE_EXPECTED_ARTIFACT_PATH");
  }

  const observedPaths = input.observedArtifacts.map((artifact) => artifact.path);
  if (hasDuplicates(observedPaths)) {
    structuralIssues.push("DUPLICATE_OBSERVED_ARTIFACT_PATH");
  }
  if (structuralIssues.length > 0) {
    return { ok: false, issues: uniqueIssues(structuralIssues) };
  }

  const evidenceIssues: MaoArtifactCompletionIssueCode[] = [];
  const observedByPath = new Map(
    input.observedArtifacts.map((artifact) => [artifact.path, artifact] as const),
  );
  let verifiedArtifactCount = 0;

  for (const expected of input.expectedArtifacts) {
    const observed = observedByPath.get(expected.path);
    if (!observed) {
      evidenceIssues.push("MISSING_ARTIFACT");
      continue;
    }
    let verified = true;
    if (!present(observed.contentHash)) {
      evidenceIssues.push("ARTIFACT_HASH_MISSING");
      verified = false;
    }
    if (observed.writerId !== expected.assignedWriterId) {
      evidenceIssues.push("WRITE_OWNER_MISMATCH");
      verified = false;
    }
    if (observed.verifiedBy !== input.assemblyVerifierId) {
      evidenceIssues.push("ASSEMBLY_VERIFIER_MISMATCH");
      verified = false;
    }
    if (verified) verifiedArtifactCount += 1;
  }

  const expectedPathSet = new Set(expectedPaths);
  if (input.observedArtifacts.some((artifact) => !expectedPathSet.has(artifact.path))) {
    evidenceIssues.push("UNEXPECTED_ARTIFACT");
  }

  const issues = uniqueIssues(evidenceIssues);
  const status: MaoArtifactCompletionStatus = issues.length === 0 ? "COMPLETE" : "INCOMPLETE";
  const batches = buildBatches(input.scheduledWorkItemIds, input.concurrencyCap);
  const workerNotificationCount = input.workerNotifications?.length ?? 0;
  const receiptHash = computeDeterministicHash(
    MAO_ARTIFACT_COMPLETION_SCOPE_VERSION,
    input.dispatchId,
    input.evaluatedAt,
    input.sourcePin,
    input.assemblyVerifierId,
    `${input.concurrencyCap}`,
    input.declaredWorkItemIds.join("|"),
    input.scheduledWorkItemIds.join("|"),
    canonicalExpected(input.expectedArtifacts),
    canonicalObserved(input.observedArtifacts),
    `${workerNotificationCount}`,
    status,
    issues.join("|"),
  );

  return {
    ok: true,
    receipt: {
      schemaVersion: MAO_ARTIFACT_COMPLETION_SCOPE_VERSION,
      dispatchId: input.dispatchId,
      evaluatedAt: input.evaluatedAt,
      sourcePin: input.sourcePin,
      concurrencyCap: input.concurrencyCap,
      declaredWorkItemIds: [...input.declaredWorkItemIds],
      scheduledWorkItemIds: [...input.scheduledWorkItemIds],
      batches,
      scopePreserved: true,
      expectedArtifactCount: input.expectedArtifacts.length,
      verifiedArtifactCount,
      workerNotificationCount,
      notificationAuthority: "NON_AUTHORITATIVE",
      completionAuthority: "ARTIFACT_AND_ASSEMBLY_VERIFICATION",
      status,
      issues,
      receiptHash,
    },
  };
}
