/**
 * MinerU Python-to-TypeScript receipt bridge proof (MSEA-R34-T1).
 *
 * Bounded fixture/synthetic proof that a Python-receipt-writer-shaped payload
 * (matching the field set rendered by
 * mineru_durable_memory_write_adapter_candidate_payload) can be mapped into the
 * existing TypeScript MineruDurableStoreInvocationInput shape consumed by the
 * R33 internal harness chain.
 *
 * Fixture-only scope: this bridge does not spawn a Python process, read a file
 * produced by an actual Python run, execute MinerU, read private/generated
 * output content, or release any production route. It maps only an in-memory
 * fixture object supplied by the caller.
 */

import type { MineruDurableStoreInvocationInput } from "./mineru-durable-store-invocation";

// ---------------------------------------------------------------------------
// R34-T1 version and disposition tokens
// ---------------------------------------------------------------------------

export const MINERU_PYTHON_RECEIPT_BRIDGE_VERSION =
  "cvf.mineruPythonReceiptBridge.r34t1.v1";

export const MINERU_PYTHON_RECEIPT_BRIDGE_PROOF_FIXTURE_ONLY =
  "MINERU_PYTHON_RECEIPT_BRIDGE_PROOF_FIXTURE_ONLY";

export const PYTHON_RECEIPT_BRIDGE_PROOF_NOT_PRODUCTION_WIRED_BY_R34_T1 =
  "PYTHON_RECEIPT_BRIDGE_PROOF_NOT_PRODUCTION_WIRED_BY_R34_T1";

export const MINERU_PYTHON_RECEIPT_BRIDGE_FAIL_CLOSED =
  "MINERU_PYTHON_RECEIPT_BRIDGE_FAIL_CLOSED";

// ---------------------------------------------------------------------------
// Fixture-shaped input (mirrors mineru_durable_memory_write_adapter_candidate_payload)
// ---------------------------------------------------------------------------

/**
 * A fixture/synthetic object shaped exactly like the camelCase dict returned
 * by the Python receipt writer's
 * mineru_durable_memory_write_adapter_candidate_payload(candidate). This is
 * never produced by an actual Python process in R34-T1; it is an in-memory
 * fixture supplied by the caller (typically a test).
 */
export interface MineruPythonReceiptBridgeFixture {
  adapterCandidateId: unknown;
  adapterDisposition: unknown;
  adapterVersion: unknown;
  actorAuthorized: unknown;
  actorRole: unknown;
  canReinject: unknown;
  claimBoundary: unknown;
  durableStoreInvocationDisposition: unknown;
  memoryWriteAuthorized: unknown;
  outputContentRead: unknown;
  policyDecision: unknown;
  provenanceScore: unknown;
  r27ClaimBoundaryPrerequisite: unknown;
  r27DownstreamUsePrerequisite: unknown;
  r27QualityPrerequisite: unknown;
  r27ReceiptPrerequisite: unknown;
  r27SourcePointerPrerequisite: unknown;
  rawMemoryReleased: unknown;
  summary: unknown;
  summaryOnly: unknown;
  targetDurableTier: unknown;
  writeInputCandidateId: unknown;
}

export interface MineruPythonReceiptBridgeResult {
  disposition:
    | typeof MINERU_PYTHON_RECEIPT_BRIDGE_PROOF_FIXTURE_ONLY
    | typeof MINERU_PYTHON_RECEIPT_BRIDGE_FAIL_CLOSED;
  bridgeVersion: typeof MINERU_PYTHON_RECEIPT_BRIDGE_VERSION;
  productionWired: false;
  heldToken: typeof PYTHON_RECEIPT_BRIDGE_PROOF_NOT_PRODUCTION_WIRED_BY_R34_T1;
  mappedInput: MineruDurableStoreInvocationInput | null;
  preventedReason: string | null;
}

// ---------------------------------------------------------------------------
// Fail-closed fixture-shape validation
// ---------------------------------------------------------------------------

const REQUIRED_STRING_FIELDS: readonly (keyof MineruPythonReceiptBridgeFixture)[] = [
  "adapterCandidateId",
  "adapterDisposition",
  "adapterVersion",
  "actorRole",
  "claimBoundary",
  "durableStoreInvocationDisposition",
  "policyDecision",
  "summary",
  "targetDurableTier",
  "writeInputCandidateId",
];

const REQUIRED_BOOLEAN_FIELDS: readonly (keyof MineruPythonReceiptBridgeFixture)[] = [
  "actorAuthorized",
  "canReinject",
  "memoryWriteAuthorized",
  "outputContentRead",
  "r27ClaimBoundaryPrerequisite",
  "r27DownstreamUsePrerequisite",
  "r27QualityPrerequisite",
  "r27ReceiptPrerequisite",
  "r27SourcePointerPrerequisite",
  "rawMemoryReleased",
  "summaryOnly",
];

const REQUIRED_BOOLEAN_VALUES: readonly {
  field: keyof MineruPythonReceiptBridgeFixture;
  value: boolean;
}[] = [
  { field: "canReinject", value: false },
  { field: "memoryWriteAuthorized", value: false },
  { field: "outputContentRead", value: false },
  { field: "rawMemoryReleased", value: false },
  { field: "summaryOnly", value: true },
];

function fail(preventedReason: string): MineruPythonReceiptBridgeResult {
  return {
    disposition: MINERU_PYTHON_RECEIPT_BRIDGE_FAIL_CLOSED,
    bridgeVersion: MINERU_PYTHON_RECEIPT_BRIDGE_VERSION,
    productionWired: false,
    heldToken: PYTHON_RECEIPT_BRIDGE_PROOF_NOT_PRODUCTION_WIRED_BY_R34_T1,
    mappedInput: null,
    preventedReason,
  };
}

/**
 * Validates that every required field is present with the correct primitive
 * type. Returns a list of validation failure reasons (empty when valid).
 * Fails closed rather than coercing or guessing a missing/mistyped value.
 */
function validateFixtureShape(
  fixture: MineruPythonReceiptBridgeFixture,
): string[] {
  const reasons: string[] = [];

  if (fixture === null || typeof fixture !== "object") {
    return ["fixture must be a non-null object"];
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    const value = fixture[field];
    if (typeof value !== "string" || value.trim() === "") {
      reasons.push(`${String(field)} must be a non-empty string`);
    }
  }

  for (const field of REQUIRED_BOOLEAN_FIELDS) {
    const value = fixture[field];
    if (typeof value !== "boolean") {
      reasons.push(`${String(field)} must be a boolean`);
    }
  }

  for (const { field, value } of REQUIRED_BOOLEAN_VALUES) {
    if (fixture[field] !== value) {
      reasons.push(`${String(field)} must be ${String(value)}`);
    }
  }

  const provenanceScore = fixture.provenanceScore;
  if (typeof provenanceScore !== "number" || !Number.isFinite(provenanceScore)) {
    reasons.push("provenanceScore must be a finite number");
  }

  return reasons;
}

// ---------------------------------------------------------------------------
// Main bridge mapping function
// ---------------------------------------------------------------------------

/**
 * Maps a fixture/synthetic Python-receipt-writer-shaped object into the
 * existing TypeScript MineruDurableStoreInvocationInput shape. Fails closed
 * on any missing or mistyped required field instead of coercing or guessing.
 *
 * This function performs no I/O: no process spawn, no file read, no network
 * call. It is a pure in-memory mapping over the caller-supplied fixture.
 */
export function mapMineruPythonReceiptFixtureToDurableStoreInvocationInput(
  fixture: MineruPythonReceiptBridgeFixture,
): MineruPythonReceiptBridgeResult {
  const validationFailures = validateFixtureShape(fixture);
  if (validationFailures.length > 0) {
    return fail(
      `malformed or incomplete fixture: ${validationFailures.join("; ")}`,
    );
  }

  const mappedInput: MineruDurableStoreInvocationInput = {
    adapterCandidateId: fixture.adapterCandidateId as string,
    adapterDisposition: fixture.adapterDisposition as string,
    adapterVersion: fixture.adapterVersion as string,
    actorAuthorized: fixture.actorAuthorized as boolean,
    actorRole: fixture.actorRole as string,
    canReinject: fixture.canReinject as boolean,
    claimBoundary: fixture.claimBoundary as string,
    durableStoreInvocationDisposition:
      fixture.durableStoreInvocationDisposition as string,
    memoryWriteAuthorized: fixture.memoryWriteAuthorized as boolean,
    outputContentRead: fixture.outputContentRead as boolean,
    policyDecision: fixture.policyDecision as string,
    provenanceScore: fixture.provenanceScore as number,
    r27ClaimBoundaryPrerequisite:
      fixture.r27ClaimBoundaryPrerequisite as boolean,
    r27DownstreamUsePrerequisite:
      fixture.r27DownstreamUsePrerequisite as boolean,
    r27QualityPrerequisite: fixture.r27QualityPrerequisite as boolean,
    r27ReceiptPrerequisite: fixture.r27ReceiptPrerequisite as boolean,
    r27SourcePointerPrerequisite:
      fixture.r27SourcePointerPrerequisite as boolean,
    rawMemoryReleased: fixture.rawMemoryReleased as boolean,
    summary: fixture.summary as string,
    summaryOnly: fixture.summaryOnly as boolean,
    targetDurableTier: fixture.targetDurableTier as string,
    writeInputCandidateId: fixture.writeInputCandidateId as string,
  };

  return {
    disposition: MINERU_PYTHON_RECEIPT_BRIDGE_PROOF_FIXTURE_ONLY,
    bridgeVersion: MINERU_PYTHON_RECEIPT_BRIDGE_VERSION,
    productionWired: false,
    heldToken: PYTHON_RECEIPT_BRIDGE_PROOF_NOT_PRODUCTION_WIRED_BY_R34_T1,
    mappedInput,
    preventedReason: null,
  };
}
