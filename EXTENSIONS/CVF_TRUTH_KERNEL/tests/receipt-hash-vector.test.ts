import { describe, it, expect } from "vitest";
import {
  buildReceiptHashPreimage,
  computeReceiptHash,
  RECEIPT_HASH_PROFILE,
  RECEIPT_HASH_DIGEST_ALGORITHM,
} from "../src/receipt/receipt-hash.js";

const PUBLISHED_FIELDS = {
  receipt_id: "receipt-001",
  decision_id: "decision-001",
  decision: "ACCEPT_EVIDENCE_CANDIDATE",
  evaluated_content_hash: "sha256:abc123def456",
  evidence_refs: ["ev-001", "ev-002"],
  obligation_refs: ["ob-001"],
  verification_result_refs: ["vr-001", "vr-002"],
  policy_version: "policy-2026-07-12",
  rule_version: "rule-2026-07-12",
  decided_at_utc: "2026-07-12T10:00:00Z",
  issued_at_utc: "2026-07-12T10:00:01Z",
  predecessor_receipt_hash: null,
};

const PUBLISHED_PREIMAGE =
  '{"receipt_hash_profile":"cvf.sotThreeLayer.receiptHash.v1","digest_algorithm":"sha256","receipt_id":"receipt-001","decision_id":"decision-001","decision":"ACCEPT_EVIDENCE_CANDIDATE","evaluated_content_hash":"sha256:abc123def456","evidence_refs":["ev-001","ev-002"],"obligation_refs":["ob-001"],"verification_result_refs":["vr-001","vr-002"],"policy_version":"policy-2026-07-12","rule_version":"rule-2026-07-12","decided_at_utc":"2026-07-12T10:00:00Z","issued_at_utc":"2026-07-12T10:00:01Z","predecessor_receipt_hash":null}';

const PUBLISHED_DIGEST = "bc32424380bd483ca208edd8ee18bcaaa874b109584341e8febc01b5e46ab5a3";

describe("canonical receipt hash profile (cvf.sotThreeLayer.receiptHash.v1)", () => {
  it("reproduces the published 522-byte preimage byte-for-byte", () => {
    const preimage = buildReceiptHashPreimage(PUBLISHED_FIELDS);
    expect(preimage).toBe(PUBLISHED_PREIMAGE);
    expect(Buffer.byteLength(preimage, "utf8")).toBe(522);
  });

  it("reproduces the published SHA-256 digest", () => {
    expect(computeReceiptHash(PUBLISHED_FIELDS)).toBe(PUBLISHED_DIGEST);
  });

  it("binds the profile identifier and digest algorithm literally", () => {
    expect(RECEIPT_HASH_PROFILE).toBe("cvf.sotThreeLayer.receiptHash.v1");
    expect(RECEIPT_HASH_DIGEST_ALGORITHM).toBe("sha256");
  });

  it("sorts evidence/obligation/verification-result arrays lexicographically regardless of input order", () => {
    const reordered = {
      ...PUBLISHED_FIELDS,
      evidence_refs: ["ev-002", "ev-001"],
      verification_result_refs: ["vr-002", "vr-001"],
    };
    expect(computeReceiptHash(reordered)).toBe(PUBLISHED_DIGEST);
  });

  it("produces a different digest when any authority-bearing field changes", () => {
    const mutated = { ...PUBLISHED_FIELDS, decision: "REJECT" };
    expect(computeReceiptHash(mutated)).not.toBe(PUBLISHED_DIGEST);
  });

  it("produces a different digest when receipt_id changes (identity substitution detection)", () => {
    const mutated = { ...PUBLISHED_FIELDS, receipt_id: "receipt-999" };
    expect(computeReceiptHash(mutated)).not.toBe(PUBLISHED_DIGEST);
  });
});
