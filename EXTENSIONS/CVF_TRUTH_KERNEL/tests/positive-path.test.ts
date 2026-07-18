import { describe, it, expect } from "vitest";
import { makeKernel, makePacket, makeEvidence, makeObligation, contentHashFor, POLICY_VERSION, RULE_VERSION } from "./fixtures.js";

describe("positive path", () => {
  it("clean single-source input reaches ACCEPT_EVIDENCE_CANDIDATE with an ISSUED receipt", () => {
    const kernel = makeKernel();
    kernel.registerPacket(makePacket());
    kernel.registerEvidence(makeEvidence());
    const { decision, receipt } = kernel.evaluate({
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
    expect(decision.decision).toBe("ACCEPT_EVIDENCE_CANDIDATE");
    expect(receipt.status).toBe("ISSUED");
    expect(receipt.decision).toBe("ACCEPT_EVIDENCE_CANDIDATE");
  });

  it("eligible receipt mints a TruthReference through full resolution", () => {
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
    const result = kernel.issueReference(
      receipt.receipt_id,
      "scope-1",
      "v1",
      "2026-07-12T00:00:00Z",
      "2026-08-12T00:00:00Z",
    );
    expect(result.issued).toBe(true);
    expect(result.reference?.reference_state).toBe("ACTIVE");
  });

  it("a satisfied HARD obligation does not block acceptance", () => {
    const kernel = makeKernel();
    kernel.registerPacket(makePacket());
    kernel.registerEvidence(makeEvidence());
    kernel.registerObligation(makeObligation({ hard_or_soft: "HARD", status: "ACTIVE" }));
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
    expect(decision.decision).toBe("ACCEPT_EVIDENCE_CANDIDATE");
    expect(decision.failed_obligations).toHaveLength(0);
  });

  it("a failed HARD obligation rejects and appears in failed_obligations", () => {
    const kernel = makeKernel();
    kernel.registerPacket(makePacket());
    kernel.registerEvidence(makeEvidence());
    kernel.registerObligation(makeObligation({ hard_or_soft: "HARD", status: "FAILED" }));
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
    expect(decision.decision).toBe("REJECT");
    expect(decision.failed_obligations).toContain("OB-000001");
  });

  it("stored records are not mutated by evaluate() (immutability proof)", () => {
    const kernel = makeKernel();
    const packet = makePacket();
    kernel.registerPacket(packet);
    kernel.registerEvidence(makeEvidence());
    const packetSnapshot = JSON.stringify(packet);
    kernel.evaluate({
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
    expect(JSON.stringify(packet)).toBe(packetSnapshot);
  });

  it("returned decision/receipt objects are deeply detached from internal store state", () => {
    const kernel = makeKernel();
    kernel.registerPacket(makePacket());
    kernel.registerEvidence(makeEvidence());
    const { decision, receipt } = kernel.evaluate({
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
    decision.reasons.push("MUTATED");
    receipt.evidence_refs.push("MUTATED");
    const { decision: decision2 } = kernel.evaluate({
      requestId: "REQ-2",
      packetHash: contentHashFor("packet-1"),
      packetReference: "RP-000001",
      policyVersion: POLICY_VERSION,
      ruleVersion: RULE_VERSION,
      evidenceRefs: ["EV-000001"],
      obligationRefs: [],
      verificationMode: "STRICT",
      requestedDecisionContext: "test",
    });
    expect(decision2.reasons).not.toContain("MUTATED");
  });
});
