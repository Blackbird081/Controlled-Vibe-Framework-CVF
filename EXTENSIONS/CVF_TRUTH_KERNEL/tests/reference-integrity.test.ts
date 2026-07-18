import { describe, expect, it } from "vitest";
import { DeterministicClock, SequentialIdFactory } from "../src/deps.js";
import { issueReference } from "../src/engine/reference-issuer.js";
import { computeReceiptHash } from "../src/receipt/receipt-hash.js";
import { KernelStores } from "../src/stores/kernel-stores.js";

function setup(receiptHashOverride?: string, omitVerification = false) {
  const stores = new KernelStores();
  const request = {
    request_id: "REQ-1", packet_hash: "sha256:packet", packet_reference: "RP-1",
    policy_version: "p1", rule_version: "r1", evidence_refs: ["EV-1"],
    obligation_refs: [], verification_mode: "STRICT", requested_decision_context: "test",
    submitted_at_utc: "2026-07-12T00:00:00Z", status: "SUBMITTED" as const,
  };
  const decision = {
    decision_id: "KD-1", request_id: "REQ-1", packet_hash: "sha256:packet",
    decision: "ACCEPT_EVIDENCE_CANDIDATE" as const, reasons: [], failed_obligations: [],
    verification_result_refs: ["VR-1"], policy_version: "p1", rule_version: "r1",
    decided_at_utc: "2026-07-12T00:00:01Z",
  };
  const fields = {
    receipt_id: "RCPT-1", decision_id: "KD-1", decision: decision.decision,
    evaluated_content_hash: "sha256:packet", evidence_refs: ["EV-1"], obligation_refs: [],
    verification_result_refs: ["VR-1"], policy_version: "p1", rule_version: "r1",
    decided_at_utc: decision.decided_at_utc, issued_at_utc: "2026-07-12T00:00:02Z",
    predecessor_receipt_hash: null,
  };
  stores.requests.insert(request.request_id, request);
  stores.decisions.insert(decision.decision_id, decision);
  if (!omitVerification) {
    stores.verificationResults.insert("VR-1", {
      verification_result_id: "VR-1", method: "test", status: "PASS",
      checked_at_utc: "2026-07-12T00:00:00Z",
    });
  }
  stores.receipts.insert("RCPT-1", {
    ...fields,
    receipt_hash: receiptHashOverride ?? computeReceiptHash(fields),
    status: "ISSUED",
  });
  return stores;
}

const deps = {
  clock: new DeterministicClock("2026-07-12T00:00:03Z"),
  ids: new SequentialIdFactory(),
};

describe("TruthReference integrity resolution", () => {
  it("rejects a receipt whose canonical hash no longer matches", () => {
    const result = issueReference("RCPT-1", "scope", "v1", "2026-07-12T00:00:00Z", "2026-08-12T00:00:00Z", setup("tampered"), deps);
    expect(result).toEqual({ issued: false, reasons: ["RECEIPT_HASH_INVALID"] });
  });

  it("rejects a missing verification-result link", () => {
    const result = issueReference("RCPT-1", "scope", "v1", "2026-07-12T00:00:00Z", "2026-08-12T00:00:00Z", setup(undefined, true), deps);
    expect(result).toEqual({ issued: false, reasons: ["VERIFICATION_RESULT_NOT_FOUND"] });
  });
});
