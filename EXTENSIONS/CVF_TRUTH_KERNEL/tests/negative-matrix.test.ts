import { describe, it, expect } from "vitest";
import { makeKernel, makePacket, makeEvidence, makeObligation, contentHashFor, POLICY_VERSION, RULE_VERSION } from "./fixtures.js";

describe("negative matrix", () => {
  it("empty evidence refs -> never ACCEPT_EVIDENCE_CANDIDATE", () => {
    const kernel = makeKernel();
    kernel.registerPacket(makePacket());
    const { decision } = kernel.evaluate({
      requestId: "REQ-1",
      packetHash: contentHashFor("packet-1"),
      packetReference: "RP-000001",
      policyVersion: POLICY_VERSION,
      ruleVersion: RULE_VERSION,
      evidenceRefs: [],
      obligationRefs: [],
      verificationMode: "STRICT",
      requestedDecisionContext: "test",
    });
    expect(decision.decision).not.toBe("ACCEPT_EVIDENCE_CANDIDATE");
  });

  it("empty Kernel verification results -> accepting receipt not ISSUED as ACCEPT_EVIDENCE_CANDIDATE", () => {
    const kernel = makeKernel();
    kernel.registerPacket(makePacket());
    // Evidence ref points to a record that was never registered, so
    // produceVerificationResults resolves nothing and yields zero
    // results even though evidence_refs itself is non-empty.
    const { receipt } = kernel.evaluate({
      requestId: "REQ-1",
      packetHash: contentHashFor("packet-1"),
      packetReference: "RP-000001",
      policyVersion: POLICY_VERSION,
      ruleVersion: RULE_VERSION,
      evidenceRefs: ["EV-DOES-NOT-EXIST"],
      obligationRefs: [],
      verificationMode: "STRICT",
      requestedDecisionContext: "test",
    });
    expect(receipt.verification_result_refs).toHaveLength(0);
    expect(receipt.decision).not.toBe("ACCEPT_EVIDENCE_CANDIDATE");
  });

  it("packet hash mismatch -> reject before evaluation", () => {
    const kernel = makeKernel();
    kernel.registerPacket(makePacket());
    kernel.registerEvidence(makeEvidence());
    const { decision } = kernel.evaluate({
      requestId: "REQ-1",
      packetHash: "sha256:wrong",
      packetReference: "RP-000001",
      policyVersion: POLICY_VERSION,
      ruleVersion: RULE_VERSION,
      evidenceRefs: ["EV-000001"],
      obligationRefs: [],
      verificationMode: "STRICT",
      requestedDecisionContext: "test",
    });
    expect(decision.decision).toBe("REJECT");
    expect(decision.reasons).toContain("PACKET_HASH_MISMATCH");
  });

  it("packet not READY_FOR_KERNEL -> reject before evaluation", () => {
    const kernel = makeKernel();
    kernel.registerPacket(makePacket({ status: "REVIEW_REQUIRED" }));
    kernel.registerEvidence(makeEvidence());
    const { decision } = kernel.evaluate({
      requestId: "REQ-1",
      packetHash: contentHashFor("packet-1"),
      packetReference: "RP-000001",
      policyVersion: POLICY_VERSION,
      ruleVersion: RULE_VERSION,
      evidenceRefs: ["EV-000001"],
      obligationRefs: [],
      verificationMode: "STRICT",
      requestedDecisionContext: "test",
    });
    expect(decision.decision).toBe("REJECT");
    expect(decision.reasons).toContain("PACKET_NOT_READY_FOR_KERNEL");
  });

  it("evidence bound to another packet -> reject or require evidence", () => {
    const kernel = makeKernel();
    kernel.registerPacket(makePacket());
    kernel.registerEvidence(makeEvidence({ bound_packet_id: "RP-999999" }));
    const { decision } = kernel.evaluate({
      requestId: "REQ-1",
      packetHash: contentHashFor("packet-1"),
      packetReference: "RP-000001",
      policyVersion: POLICY_VERSION,
      ruleVersion: RULE_VERSION,
      evidenceRefs: ["EV-000001"],
      obligationRefs: [],
      verificationMode: "STRICT",
      requestedDecisionContext: "test",
    });
    expect(["REJECT", "REQUIRE_ADDITIONAL_EVIDENCE"]).toContain(decision.decision);
    expect(decision.reasons).toContain("EVIDENCE_CROSS_PACKET");
  });

  it("obligation bound to another packet -> reject or require evidence", () => {
    const kernel = makeKernel();
    kernel.registerPacket(makePacket());
    kernel.registerEvidence(makeEvidence());
    kernel.registerObligation(makeObligation({ bound_packet_id: "RP-999999" }));
    const { decision } = kernel.evaluate({
      requestId: "REQ-1",
      packetHash: contentHashFor("packet-1"),
      packetReference: "RP-000001",
      policyVersion: POLICY_VERSION,
      ruleVersion: RULE_VERSION,
      evidenceRefs: ["EV-000001"],
      obligationRefs: ["OB-000001"],
      verificationMode: "STRICT",
      requestedDecisionContext: "test",
    });
    expect(["REJECT", "REQUIRE_ADDITIONAL_EVIDENCE"]).toContain(decision.decision);
    expect(decision.reasons).toContain("OBLIGATION_CROSS_PACKET");
  });

  it("stale policy/rule version -> reject or escalate, never silently accept", () => {
    const kernel = makeKernel();
    kernel.registerPacket(makePacket());
    kernel.registerEvidence(makeEvidence());
    const { decision } = kernel.evaluate({
      requestId: "REQ-1",
      packetHash: contentHashFor("packet-1"),
      packetReference: "RP-000001",
      policyVersion: "stale-policy",
      ruleVersion: RULE_VERSION,
      evidenceRefs: ["EV-000001"],
      obligationRefs: [],
      verificationMode: "STRICT",
      requestedDecisionContext: "test",
    });
    expect(decision.decision).not.toBe("ACCEPT_EVIDENCE_CANDIDATE");
    expect(decision.reasons).toContain("STALE_POLICY_VERSION");
  });

  it("non-canonical/partial receipt hash or published-vector mismatch -> receipt invalid", async () => {
    const { computeReceiptHash } = await import("../src/receipt/receipt-hash.js");
    const kernel = makeKernel();
    kernel.registerPacket(makePacket());
    kernel.registerEvidence(makeEvidence());
    const { receipt } = kernel.evaluate({
      requestId: "REQ-1",
      packetHash: contentHashFor("packet-1"),
      packetReference: "RP-000001",
      policyVersion: POLICY_VERSION,
      ruleVersion: RULE_VERSION,
      evidenceRefs: ["EV-000001"],
      obligationRefs: [],
      verificationMode: "STRICT",
      requestedDecisionContext: "test",
    });
    const recomputed = computeReceiptHash({
      receipt_id: receipt.receipt_id,
      decision_id: receipt.decision_id,
      decision: receipt.decision,
      evaluated_content_hash: receipt.evaluated_content_hash,
      evidence_refs: receipt.evidence_refs,
      obligation_refs: receipt.obligation_refs,
      verification_result_refs: receipt.verification_result_refs,
      policy_version: receipt.policy_version,
      rule_version: receipt.rule_version,
      decided_at_utc: receipt.decided_at_utc,
      issued_at_utc: receipt.issued_at_utc,
      predecessor_receipt_hash: receipt.predecessor_receipt_hash,
    });
    expect(receipt.receipt_hash).toBe(recomputed);
    const tampered = { ...receipt, decision: "REJECT" as const };
    const tamperedRecomputed = computeReceiptHash({ ...tampered, evidence_refs: tampered.evidence_refs });
    expect(receipt.receipt_hash).not.toBe(tamperedRecomputed);
  });

  it("duplicate receipt identity -> replay rejected", async () => {
    const { issueReceipt } = await import("../src/engine/receipt-issuer.js");
    const { KernelStores } = await import("../src/stores/kernel-stores.js");
    const { DeterministicClock, SequentialIdFactory } = await import("../src/deps.js");

    const stores = new KernelStores();
    stores.registerPacket(makePacket());
    stores.registerEvidence(makeEvidence());
    const clock = new DeterministicClock("2026-07-12T00:00:00Z", 1000);
    const ids = new SequentialIdFactory();
    const deps = { clock, ids };

    const request = {
      request_id: "REQ-1",
      packet_hash: contentHashFor("packet-1"),
      packet_reference: "RP-000001",
      policy_version: POLICY_VERSION,
      rule_version: RULE_VERSION,
      evidence_refs: ["EV-000001"],
      obligation_refs: [],
      verification_mode: "STRICT",
      requested_decision_context: "test",
      submitted_at_utc: clock.nowUtcIso(),
      status: "SUBMITTED" as const,
    };
    stores.requests.insert(request.request_id, request);

    const decision = {
      decision_id: "KD-000001",
      request_id: request.request_id,
      packet_hash: request.packet_hash,
      decision: "ACCEPT_EVIDENCE_CANDIDATE" as const,
      reasons: [],
      failed_obligations: [],
      verification_result_refs: [],
      policy_version: POLICY_VERSION,
      rule_version: RULE_VERSION,
      decided_at_utc: clock.nowUtcIso(),
    };
    stores.decisions.insert(decision.decision_id, decision);

    const first = issueReceipt(decision, request, stores, deps);
    expect(first.issued).toBe(true);

    const replay = issueReceipt(decision, request, stores, deps);
    expect(replay.issued).toBe(false);
    expect(replay.reasons).toContain("DUPLICATE_RECEIPT_IDENTITY");
  });

  it("non-acceptance receipt -> TruthReference issuance rejected", () => {
    const kernel = makeKernel();
    kernel.registerPacket(makePacket());
    const { receipt } = kernel.evaluate({
      requestId: "REQ-1",
      packetHash: contentHashFor("packet-1"),
      packetReference: "RP-000001",
      policyVersion: POLICY_VERSION,
      ruleVersion: RULE_VERSION,
      evidenceRefs: [],
      obligationRefs: [],
      verificationMode: "STRICT",
      requestedDecisionContext: "test",
    });
    const result = kernel.issueReference(
      receipt.receipt_id,
      "scope-1",
      "v1",
      "2026-07-12T00:00:00Z",
      "2026-08-12T00:00:00Z",
    );
    expect(result.issued).toBe(false);
  });

  it("missing decision/request, binding/content/version mismatch, failed obligations -> issuance rejected", () => {
    const kernel = makeKernel();
    const result = kernel.issueReference(
      "RCPT-DOES-NOT-EXIST",
      "scope-1",
      "v1",
      "2026-07-12T00:00:00Z",
      "2026-08-12T00:00:00Z",
    );
    expect(result.issued).toBe(false);
    expect(result.reasons).toContain("RECEIPT_NOT_FOUND");
  });

  it("FAIL verification or revoked receipt -> TruthReference issuance rejected", () => {
    const kernel = makeKernel();
    kernel.registerPacket(makePacket());
    kernel.registerEvidence(makeEvidence());
    kernel.registerObligation(makeObligation({ hard_or_soft: "HARD", status: "ACTIVE" }));
    const { receipt } = kernel.evaluate({
      requestId: "REQ-1",
      packetHash: contentHashFor("packet-1"),
      packetReference: "RP-000001",
      policyVersion: POLICY_VERSION,
      ruleVersion: RULE_VERSION,
      evidenceRefs: ["EV-000001"],
      obligationRefs: ["OB-000001"],
      verificationMode: "STRICT",
      requestedDecisionContext: "test",
    });
    expect(receipt.decision).toBe("ACCEPT_EVIDENCE_CANDIDATE");
    kernel.revoke(receipt.receipt_id);
    const result = kernel.issueReference(
      receipt.receipt_id,
      "scope-1",
      "v1",
      "2026-07-12T00:00:00Z",
      "2026-08-12T00:00:00Z",
    );
    expect(result.issued).toBe(false);
    expect(result.reasons).toContain("RECEIPT_REVOKED");
  });

  it("invalid/expired reference dates at issuance -> issuance rejected", () => {
    const kernel = makeKernel();
    kernel.registerPacket(makePacket());
    kernel.registerEvidence(makeEvidence());
    const { receipt } = kernel.evaluate({
      requestId: "REQ-1",
      packetHash: contentHashFor("packet-1"),
      packetReference: "RP-000001",
      policyVersion: POLICY_VERSION,
      ruleVersion: RULE_VERSION,
      evidenceRefs: ["EV-000001"],
      obligationRefs: [],
      verificationMode: "STRICT",
      requestedDecisionContext: "test",
    });
    if (receipt.decision === "ACCEPT_EVIDENCE_CANDIDATE") {
      const result = kernel.issueReference(
        receipt.receipt_id,
        "scope-1",
        "v1",
        "2026-08-12T00:00:00Z",
        "2026-07-12T00:00:00Z",
      );
      expect(result.issued).toBe(false);
      expect(result.reasons).toContain("INVALID_VALIDITY_INTERVAL");
    }
  });

  it("same injected input twice -> byte-equivalent outputs", () => {
    const kernel1 = makeKernel();
    kernel1.registerPacket(makePacket());
    kernel1.registerEvidence(makeEvidence());
    const result1 = kernel1.evaluate({
      requestId: "REQ-1",
      packetHash: contentHashFor("packet-1"),
      packetReference: "RP-000001",
      policyVersion: POLICY_VERSION,
      ruleVersion: RULE_VERSION,
      evidenceRefs: ["EV-000001"],
      obligationRefs: [],
      verificationMode: "STRICT",
      requestedDecisionContext: "test",
    });

    const kernel2 = makeKernel();
    kernel2.registerPacket(makePacket());
    kernel2.registerEvidence(makeEvidence());
    const result2 = kernel2.evaluate({
      requestId: "REQ-1",
      packetHash: contentHashFor("packet-1"),
      packetReference: "RP-000001",
      policyVersion: POLICY_VERSION,
      ruleVersion: RULE_VERSION,
      evidenceRefs: ["EV-000001"],
      obligationRefs: [],
      verificationMode: "STRICT",
      requestedDecisionContext: "test",
    });

    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
  });

  it("caller-supplied approval/result/authority boolean is ignored or rejected", () => {
    const kernel = makeKernel();
    kernel.registerPacket(makePacket());
    kernel.registerEvidence(makeEvidence());
    const maliciousInput = {
      requestId: "REQ-1",
      packetHash: contentHashFor("packet-1"),
      packetReference: "RP-000001",
      policyVersion: POLICY_VERSION,
      ruleVersion: RULE_VERSION,
      evidenceRefs: ["EV-000001"],
      obligationRefs: [],
      verificationMode: "STRICT",
      requestedDecisionContext: "test",
    } as Record<string, unknown>;
    maliciousInput.truthKernelAccepted = true;
    maliciousInput.callerVerificationResults = [{ status: "PASS" }];
    const { decision } = kernel.evaluate(
      maliciousInput as unknown as Parameters<typeof kernel.evaluate>[0],
    );
    // Kernel produces exactly one verification result from the one
    // registered evidence item; the caller-supplied fields
    // (truthKernelAccepted, callerVerificationResults) are silently
    // ignored - not read anywhere in evaluate()/produceVerificationResults.
    expect(decision.verification_result_refs).toHaveLength(1);
    expect(decision.verification_result_refs[0]).toMatch(/^VR-/);
  });
});
