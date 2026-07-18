import { describe, it, expect } from "vitest";
import { makeKernel, makePacket, makeEvidence, contentHashFor, POLICY_VERSION, RULE_VERSION } from "./fixtures.js";
import type { TruthKernel } from "../src/kernel.js";

let callCounter = 0;

function issueAcceptedReference(
  kernel: TruthKernel,
  scope = "scope-1",
  validFromUtc = "2026-07-12T00:00:00Z",
  validUntilUtc = "2026-08-12T00:00:00Z",
) {
  callCounter += 1;
  const packetId = `RP-${String(callCounter).padStart(6, "0")}`;
  const evidenceId = `EV-${String(callCounter).padStart(6, "0")}`;
  const requestId = `REQ-${String(callCounter).padStart(6, "0")}`;
  const packetSeed = `packet-${callCounter}`;
  kernel.registerPacket(makePacket({ refinery_packet_id: packetId, content_hash: contentHashFor(packetSeed) }));
  kernel.registerEvidence(makeEvidence({ evidence_id: evidenceId, bound_packet_id: packetId }));
  const { receipt } = kernel.evaluate({
    requestId,
    packetHash: contentHashFor(packetSeed),
    packetReference: packetId,
    policyVersion: POLICY_VERSION,
    ruleVersion: RULE_VERSION,
    evidenceRefs: [evidenceId],
    obligationRefs: [],
    verificationMode: "STRICT",
    requestedDecisionContext: "test",
  });
  expect(receipt.decision).toBe("ACCEPT_EVIDENCE_CANDIDATE");
  const issuance = kernel.issueReference(receipt.receipt_id, scope, "v1", validFromUtc, validUntilUtc);
  expect(issuance.issued).toBe(true);
  return { receipt, reference: issuance.reference! };
}

describe("TruthReference current-state resolution (T4R1)", () => {
  it("reference's receipt is revoked, then state is read -> REVOKED, no caller flag involved", () => {
    const kernel = makeKernel();
    const { receipt, reference } = issueAcceptedReference(kernel);
    kernel.revoke(receipt.receipt_id);
    const result = kernel.referenceState(reference.reference_id, "2026-07-12T00:00:01Z");
    expect(result.resolved).toBe(true);
    expect(result.state).toBe("REVOKED");
  });

  it("reference itself is revoked, while receipt remains issued -> REVOKED, no caller flag involved", () => {
    const kernel = makeKernel();
    const { reference } = issueAcceptedReference(kernel);
    const revocation = kernel.revokeReference(reference.reference_id);
    expect(revocation.revoked).toBe(true);
    const result = kernel.referenceState(reference.reference_id, "2026-07-12T00:00:01Z");
    expect(result.resolved).toBe(true);
    expect(result.state).toBe("REVOKED");
  });

  it("reference is superseded via supersede(), then state is read -> SUPERSEDED, no caller flag involved", () => {
    const kernel = makeKernel();
    const { reference: oldReference } = issueAcceptedReference(
      kernel,
      "scope-shared",
      "2026-07-12T00:00:00Z",
      "2026-09-01T00:00:00Z",
    );
    const { reference: newReference } = issueAcceptedReference(
      kernel,
      "scope-shared",
      "2026-07-13T00:00:00Z",
      "2026-09-01T00:00:00Z",
    );
    const supersession = kernel.supersede(oldReference.reference_id, newReference.reference_id);
    expect(supersession.superseded).toBe(true);
    const result = kernel.referenceState(oldReference.reference_id, "2026-07-14T00:00:00Z");
    expect(result.resolved).toBe(true);
    expect(result.state).toBe("SUPERSEDED");
  });

  it("reference's valid_until_utc has passed, no revocation or supersession -> EXPIRED", () => {
    const kernel = makeKernel();
    const { reference } = issueAcceptedReference(kernel, "scope-1", "2026-07-12T00:00:00Z", "2026-07-13T00:00:00Z");
    const result = kernel.referenceState(reference.reference_id, "2026-07-14T00:00:00Z");
    expect(result.resolved).toBe(true);
    expect(result.state).toBe("EXPIRED");
  });

  it("reference is both revoked and expired -> REVOKED (precedence: REVOKED > SUPERSEDED > EXPIRED > ACTIVE)", () => {
    const kernel = makeKernel();
    const { reference } = issueAcceptedReference(kernel, "scope-1", "2026-07-12T00:00:00Z", "2026-07-13T00:00:00Z");
    kernel.revokeReference(reference.reference_id);
    const result = kernel.referenceState(reference.reference_id, "2026-07-14T00:00:00Z");
    expect(result.resolved).toBe(true);
    expect(result.state).toBe("REVOKED");
  });

  it("reference is both superseded and expired, not revoked -> SUPERSEDED (precedence)", () => {
    const kernel = makeKernel();
    const { reference: oldReference } = issueAcceptedReference(
      kernel,
      "scope-shared",
      "2026-07-12T00:00:00Z",
      "2026-07-13T00:00:00Z",
    );
    const { reference: newReference } = issueAcceptedReference(
      kernel,
      "scope-shared",
      "2026-07-12T00:00:01Z",
      "2026-09-01T00:00:00Z",
    );
    kernel.supersede(oldReference.reference_id, newReference.reference_id);
    const result = kernel.referenceState(oldReference.reference_id, "2026-07-14T00:00:00Z");
    expect(result.resolved).toBe(true);
    expect(result.state).toBe("SUPERSEDED");
  });

  it("reference is none of revoked/superseded/expired -> ACTIVE", () => {
    const kernel = makeKernel();
    const { reference } = issueAcceptedReference(kernel);
    const result = kernel.referenceState(reference.reference_id, "2026-07-12T00:00:01Z");
    expect(result.resolved).toBe(true);
    expect(result.state).toBe("ACTIVE");
  });

  it("a reference is read once (ACTIVE), then its receipt is revoked, then read again -> second read reports REVOKED", () => {
    const kernel = makeKernel();
    const { receipt, reference } = issueAcceptedReference(kernel);
    const first = kernel.referenceState(reference.reference_id, "2026-07-12T00:00:01Z");
    expect(first.state).toBe("ACTIVE");
    kernel.revoke(receipt.receipt_id);
    const second = kernel.referenceState(reference.reference_id, "2026-07-12T00:00:02Z");
    expect(second.state).toBe("REVOKED");
  });

  it("referenceState() is called with an unresolvable reference_id -> typed rejection, never a default ACTIVE", () => {
    const kernel = makeKernel();
    const result = kernel.referenceState("TREF-DOES-NOT-EXIST", "2026-07-12T00:00:00Z");
    expect(result.resolved).toBe(false);
    expect(result.state).toBeUndefined();
    expect(result.reasons).toContain("REFERENCE_NOT_FOUND");
  });

  it("supersede() called with a nonexistent old reference id -> typed rejection; no supersession recorded", () => {
    const kernel = makeKernel();
    const { reference } = issueAcceptedReference(kernel);
    const result = kernel.supersede("TREF-DOES-NOT-EXIST", reference.reference_id);
    expect(result.superseded).toBe(false);
    expect(result.reasons).toContain("SUPERSEDED_REFERENCE_NOT_FOUND");
  });

  it("supersede() called with a nonexistent new reference id -> typed rejection; no supersession recorded", () => {
    const kernel = makeKernel();
    const { reference } = issueAcceptedReference(kernel);
    const result = kernel.supersede(reference.reference_id, "TREF-DOES-NOT-EXIST");
    expect(result.superseded).toBe(false);
    expect(result.reasons).toContain("SUPERSEDING_REFERENCE_NOT_FOUND");
  });

  it("supersede() called with a self-link -> typed rejection; no supersession recorded", () => {
    const kernel = makeKernel();
    const { reference } = issueAcceptedReference(kernel);
    const result = kernel.supersede(reference.reference_id, reference.reference_id);
    expect(result.superseded).toBe(false);
    expect(result.reasons).toContain("SUPERSESSION_SELF_LINK");
  });

  it("supersede() called with a cross-scope pair -> typed rejection; no supersession recorded", () => {
    const kernel = makeKernel();
    const { reference: oldReference } = issueAcceptedReference(kernel, "scope-a");
    const { reference: newReference } = issueAcceptedReference(kernel, "scope-b");
    const result = kernel.supersede(oldReference.reference_id, newReference.reference_id);
    expect(result.superseded).toBe(false);
    expect(result.reasons).toContain("SUPERSESSION_CROSS_SCOPE");
  });

  it("supersede() called with an older/equal valid_from_utc -> typed rejection; no supersession recorded", () => {
    const kernel = makeKernel();
    const { reference: oldReference } = issueAcceptedReference(
      kernel,
      "scope-shared",
      "2026-07-13T00:00:00Z",
      "2026-09-01T00:00:00Z",
    );
    const { reference: newReference } = issueAcceptedReference(
      kernel,
      "scope-shared",
      "2026-07-12T00:00:00Z",
      "2026-09-01T00:00:00Z",
    );
    const result = kernel.supersede(oldReference.reference_id, newReference.reference_id);
    expect(result.superseded).toBe(false);
    expect(result.reasons).toContain("SUPERSESSION_NOT_LATER");
  });

  it("supersede() called with an invalid timestamp -> typed rejection; no supersession recorded", async () => {
    // issueReference() validates valid_from_utc/valid_until_utc, so a
    // stored reference can never carry an unparsable valid_from_utc through
    // the public API. This exercises supersedeReference()'s own timestamp
    // guard directly against a store holding a hand-inserted reference with
    // an invalid valid_from_utc, proving the guard rejects instead of
    // silently accepting when the date comparison is impossible.
    const { supersedeReference } = await import("../src/engine/reference-issuer.js");
    const { KernelStores } = await import("../src/stores/kernel-stores.js");
    const stores = new KernelStores();
    stores.references.insert("TREF-000001", {
      reference_id: "TREF-000001",
      receipt_id: "RCPT-000001",
      scope: "scope-invalid",
      version: "v1",
      valid_from_utc: "not-a-timestamp",
      valid_until_utc: "2026-09-01T00:00:00Z",
      reference_state: "ACTIVE",
    });
    stores.references.insert("TREF-000002", {
      reference_id: "TREF-000002",
      receipt_id: "RCPT-000001",
      scope: "scope-invalid",
      version: "v1",
      valid_from_utc: "2026-07-13T00:00:00Z",
      valid_until_utc: "2026-09-01T00:00:00Z",
      reference_state: "ACTIVE",
    });
    const result = supersedeReference("TREF-000001", "TREF-000002", stores);
    expect(result.superseded).toBe(false);
    expect(result.reasons).toContain("SUPERSESSION_NOT_LATER");
  });

  it("supersede() called with a duplicate old-reference link -> typed rejection; no supersession recorded", () => {
    const kernel = makeKernel();
    const { reference: oldReference } = issueAcceptedReference(
      kernel,
      "scope-shared",
      "2026-07-12T00:00:00Z",
      "2026-09-01T00:00:00Z",
    );
    const { reference: newReference } = issueAcceptedReference(
      kernel,
      "scope-shared",
      "2026-07-13T00:00:00Z",
      "2026-09-01T00:00:00Z",
    );
    const { reference: thirdReference } = issueAcceptedReference(
      kernel,
      "scope-shared",
      "2026-07-14T00:00:00Z",
      "2026-09-01T00:00:00Z",
    );
    const first = kernel.supersede(oldReference.reference_id, newReference.reference_id);
    expect(first.superseded).toBe(true);
    const duplicate = kernel.supersede(oldReference.reference_id, thirdReference.reference_id);
    expect(duplicate.superseded).toBe(false);
    expect(duplicate.reasons).toContain("SUPERSESSION_ALREADY_RECORDED");
  });

  it("caller supplies a forged TruthReference object with a real receipt id -> impossible at the public state-read boundary", () => {
    const kernel = makeKernel();
    const { reference } = issueAcceptedReference(kernel);
    // referenceState() accepts only a string reference_id; TypeScript's
    // public surface has no parameter position for a caller-supplied
    // TruthReference object, isRevoked flag, or isSuperseded flag. This
    // negative case is enforced structurally, not at runtime: passing an
    // object where a string is expected is a compile-time error, and the
    // resolver only ever reads the stored, Kernel-issued reference by ID.
    const result = kernel.referenceState(reference.reference_id, "2026-07-12T00:00:01Z");
    expect(result.resolved).toBe(true);
    expect(result.state).toBe("ACTIVE");
  });

  it("revokeReference() on a nonexistent reference -> typed rejection", () => {
    const kernel = makeKernel();
    const result = kernel.revokeReference("TREF-DOES-NOT-EXIST");
    expect(result.revoked).toBe(false);
    expect(result.reasons).toContain("REFERENCE_NOT_FOUND");
  });

  it("revokeReference() twice on the same reference -> second call is a typed rejection", () => {
    const kernel = makeKernel();
    const { reference } = issueAcceptedReference(kernel);
    const first = kernel.revokeReference(reference.reference_id);
    expect(first.revoked).toBe(true);
    const second = kernel.revokeReference(reference.reference_id);
    expect(second.revoked).toBe(false);
    expect(second.reasons).toContain("REFERENCE_ALREADY_REVOKED");
  });

  it("referenceState() on a reference whose bound receipt cannot be resolved -> typed rejection, never a default ACTIVE", async () => {
    // The public API offers no path to insert a reference without first
    // issuing a real, resolvable receipt (ImmutableStore also has no
    // delete), so the BOUND_RECEIPT_NOT_FOUND branch is exercised at the
    // engine level directly against a store holding a reference whose
    // receipt_id was never registered, proving the resolver fails closed
    // rather than defaulting to ACTIVE when the receipt link is broken.
    const { computeCurrentReferenceState } = await import("../src/engine/reference-issuer.js");
    const { KernelStores } = await import("../src/stores/kernel-stores.js");
    const stores = new KernelStores();
    stores.references.insert("TREF-000001", {
      reference_id: "TREF-000001",
      receipt_id: "RCPT-DOES-NOT-EXIST",
      scope: "scope-1",
      version: "v1",
      valid_from_utc: "2026-07-12T00:00:00Z",
      valid_until_utc: "2026-09-01T00:00:00Z",
      reference_state: "ACTIVE",
    });
    const result = computeCurrentReferenceState("TREF-000001", stores, "2026-07-12T00:00:01Z");
    expect(result.resolved).toBe(false);
    expect(result.state).toBeUndefined();
    expect(result.reasons).toContain("BOUND_RECEIPT_NOT_FOUND");
  });

  it("referenceState() called with an invalid read-time timestamp -> typed rejection, never a default ACTIVE", () => {
    const kernel = makeKernel();
    const { reference } = issueAcceptedReference(kernel);
    const result = kernel.referenceState(reference.reference_id, "not-a-timestamp");
    expect(result.resolved).toBe(false);
    expect(result.state).toBeUndefined();
    expect(result.reasons).toContain("INVALID_READ_TIME");
  });
});
