import { describe, it, expect } from "vitest";
import { RefineryEngine } from "../src/pipeline/engine.js";
import { makeEnvelope, makeRuleManifest, makeDeps, contentHashFor } from "./fixtures.js";

describe("negative matrix", () => {
  it("zero configured/executed stages -> BLOCKED + REFINERY_NO_STAGES_EXECUTED", () => {
    const engine = new RefineryEngine(makeDeps().clock, makeDeps().ids);
    const { packet, completedStages } = engine.run({
      sourceEnvelopes: [],
      rawRecords: [],
      ruleManifest: makeRuleManifest(),
    });
    expect(completedStages).toHaveLength(0);
    expect(packet.status).toBe("BLOCKED");
    expect(packet.failure_tokens).toContain("REFINERY_NO_STAGES_EXECUTED");
  });

  it("missing source identity -> BLOCKED", () => {
    const engine = new RefineryEngine(makeDeps().clock, makeDeps().ids);
    const envelope = makeEnvelope({ owner: "" });
    const { packet } = engine.run({
      sourceEnvelopes: [envelope],
      rawRecords: [{ source_id: envelope.source_id, value: 1 }],
      ruleManifest: makeRuleManifest(),
    });
    expect(packet.status).toBe("BLOCKED");
  });

  it("schema failure -> BLOCKED + SCHEMA_VALIDATION_FAILED", () => {
    const engine = new RefineryEngine(makeDeps().clock, makeDeps().ids);
    const envelope = makeEnvelope();
    const { packet } = engine.run({
      sourceEnvelopes: [envelope],
      rawRecords: [{ source_id: envelope.source_id, value: 1 }],
      ruleManifest: { manifest_id: "", version: "" },
    });
    expect(packet.status).toBe("BLOCKED");
    expect(packet.failure_tokens).toContain("SCHEMA_VALIDATION_FAILED");
  });

  it("unresolved conflict finding -> REVIEW_REQUIRED or BLOCKED, never READY_FOR_KERNEL", () => {
    const envelopeA = makeEnvelope({ source_id: "SRC-A" });
    const envelopeB = makeEnvelope({ source_id: "SRC-B" });
    const rawA = [{ source_id: "SRC-A", amount: 100 }];
    const rawB = [{ source_id: "SRC-B", amount: 200 }];
    envelopeA.content_hash = contentHashFor(rawA);
    envelopeB.content_hash = contentHashFor(rawB);

    const engine = new RefineryEngine(makeDeps().clock, makeDeps().ids);
    const { packet } = engine.run({
      sourceEnvelopes: [envelopeA, envelopeB],
      rawRecords: [...rawA, ...rawB],
      ruleManifest: makeRuleManifest(),
      declaredScope: { organization: "cvf" },
      declaredOwner: "owner-team",
    });

    expect(packet.conflict_sets.length).toBeGreaterThan(0);
    expect(packet.status).not.toBe("READY_FOR_KERNEL");
    expect(["REVIEW_REQUIRED", "BLOCKED"]).toContain(packet.status);
    expect(packet.failure_tokens.length).toBeGreaterThan(0);
  });

  it("REVIEW_REQUIRED always carries at least one T2 failure token", () => {
    const envelopeA = makeEnvelope({ source_id: "SRC-A" });
    const envelopeB = makeEnvelope({ source_id: "SRC-B" });
    const rawA = [{ source_id: "SRC-A", amount: 100 }];
    const rawB = [{ source_id: "SRC-B", amount: 200 }];
    envelopeA.content_hash = contentHashFor(rawA);
    envelopeB.content_hash = contentHashFor(rawB);

    const engine = new RefineryEngine(makeDeps().clock, makeDeps().ids);
    const { packet } = engine.run({
      sourceEnvelopes: [envelopeA, envelopeB],
      rawRecords: [...rawA, ...rawB],
      ruleManifest: makeRuleManifest(),
    });

    expect(packet.status).toBe("REVIEW_REQUIRED");
    expect(packet.failure_tokens).toContain("QUALITY_CHECK_FAILED");
  });

  it("incomplete lineage/integrity -> not READY_FOR_KERNEL", () => {
    const envelope = makeEnvelope({ content_hash: "sha256:wrong" });
    const engine = new RefineryEngine(makeDeps().clock, makeDeps().ids);
    const { packet } = engine.run({
      sourceEnvelopes: [envelope],
      rawRecords: [{ source_id: envelope.source_id, value: 1 }],
      ruleManifest: makeRuleManifest(),
    });
    expect(packet.status).not.toBe("READY_FOR_KERNEL");
    expect(packet.failure_tokens).toContain("INTEGRITY_CHECK_FAILED");
  });

  it("different scope with same value is not silently exact duplicate/conflict", () => {
    const envelopeA = makeEnvelope({
      source_id: "SRC-A",
      scope: { organization: "org-a" },
    });
    const envelopeB = makeEnvelope({
      source_id: "SRC-B",
      scope: { organization: "org-b" },
    });
    const rawA = [{ source_id: "SRC-A", amount: 100 }];
    const rawB = [{ source_id: "SRC-B", amount: 100 }];
    envelopeA.content_hash = contentHashFor(rawA);
    envelopeB.content_hash = contentHashFor(rawB);

    const engine = new RefineryEngine(makeDeps().clock, makeDeps().ids);
    const { packet } = engine.run({
      sourceEnvelopes: [envelopeA, envelopeB],
      rawRecords: [...rawA, ...rawB],
      ruleManifest: makeRuleManifest(),
      declaredScope: { organization: "org-a" },
      declaredOwner: "owner-team",
    });

    expect(packet.duplicate_groups).toHaveLength(0);
    expect(packet.conflict_sets).toHaveLength(0);
  });

  it("same scope with conflicting value: conflict retained, no authoritative selection", () => {
    const envelopeA = makeEnvelope({ source_id: "SRC-A" });
    const envelopeB = makeEnvelope({ source_id: "SRC-B" });
    const rawA = [{ source_id: "SRC-A", amount: 100 }];
    const rawB = [{ source_id: "SRC-B", amount: 999 }];
    envelopeA.content_hash = contentHashFor(rawA);
    envelopeB.content_hash = contentHashFor(rawB);

    const engine = new RefineryEngine(makeDeps().clock, makeDeps().ids);
    const { packet } = engine.run({
      sourceEnvelopes: [envelopeA, envelopeB],
      rawRecords: [...rawA, ...rawB],
      ruleManifest: makeRuleManifest(),
      declaredScope: { organization: "cvf" },
      declaredOwner: "owner-team",
    });

    expect(packet.conflict_sets.length).toBeGreaterThan(0);
    for (const conflict of packet.conflict_sets) {
      expect(conflict.resolution_status).toBe("UNRESOLVED");
      expect(conflict.resolution_reference).toBeNull();
    }
  });

  it("same injected inputs twice -> byte-equivalent output", () => {
    const envelope = makeEnvelope();
    const raw = [{ source_id: envelope.source_id, amount: 42 }];
    envelope.content_hash = contentHashFor(raw);

    const deps1 = makeDeps();
    const engine1 = new RefineryEngine(deps1.clock, deps1.ids);
    const result1 = engine1.run({
      sourceEnvelopes: [envelope],
      rawRecords: raw,
      ruleManifest: makeRuleManifest(),
    });

    const deps2 = makeDeps();
    const engine2 = new RefineryEngine(deps2.clock, deps2.ids);
    const result2 = engine2.run({
      sourceEnvelopes: [envelope],
      rawRecords: raw,
      ruleManifest: makeRuleManifest(),
    });

    expect(JSON.stringify(result1.packet)).toBe(JSON.stringify(result2.packet));
  });

  it("forbidden truth status/token is never present on the packet", () => {
    const envelope = makeEnvelope();
    const raw = [{ source_id: envelope.source_id, amount: 1 }];
    envelope.content_hash = contentHashFor(raw);
    const engine = new RefineryEngine(makeDeps().clock, makeDeps().ids);
    const { packet } = engine.run({
      sourceEnvelopes: [envelope],
      rawRecords: raw,
      ruleManifest: makeRuleManifest(),
    });
    const serialized = JSON.stringify(packet);
    for (const forbidden of [
      "ACCEPT_EVIDENCE_CANDIDATE",
      "TruthReceipt",
      "TruthReference",
      "KernelDecision",
      "truth_approved",
      "canonical_truth",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
