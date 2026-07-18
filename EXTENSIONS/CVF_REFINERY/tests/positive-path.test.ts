import { describe, it, expect } from "vitest";
import { RefineryEngine, REQUIRED_STAGE_CHAIN } from "../src/pipeline/engine.js";
import { makeEnvelope, makeRuleManifest, makeDeps, contentHashFor } from "./fixtures.js";

describe("positive path", () => {
  it("clean single-source input reaches READY_FOR_KERNEL with empty failure_tokens", () => {
    const envelope = makeEnvelope();
    const raw = [{ source_id: envelope.source_id, amount: 42 }];
    envelope.content_hash = contentHashFor(raw);

    const engine = new RefineryEngine(makeDeps().clock, makeDeps().ids);
    const { packet, completedStages } = engine.run({
      sourceEnvelopes: [envelope],
      rawRecords: raw,
      ruleManifest: makeRuleManifest(),
    });

    expect(completedStages).toEqual(REQUIRED_STAGE_CHAIN.map((stage) => stage.id));
    expect(packet.status).toBe("READY_FOR_KERNEL");
    expect(packet.failure_tokens).toEqual([]);
    expect(packet.transformation_lineage.length).toBeGreaterThan(0);
  });

  it("required stage chain matches the contract-required 9 stages in order", () => {
    expect(REQUIRED_STAGE_CHAIN.map((stage) => stage.id)).toEqual([
      "intake",
      "normalize",
      "schema",
      "duplicate",
      "conflict",
      "quality",
      "integrity",
      "lineage",
      "packet",
    ]);
  });

  it("input source envelopes and raw records are not mutated by run()", () => {
    const envelope = makeEnvelope();
    const raw = [{ source_id: envelope.source_id, amount: 42 }];
    envelope.content_hash = contentHashFor(raw);
    const envelopeSnapshot = JSON.stringify(envelope);
    const rawSnapshot = JSON.stringify(raw);

    const engine = new RefineryEngine(makeDeps().clock, makeDeps().ids);
    engine.run({
      sourceEnvelopes: [envelope],
      rawRecords: raw,
      ruleManifest: makeRuleManifest(),
    });

    expect(JSON.stringify(envelope)).toBe(envelopeSnapshot);
    expect(JSON.stringify(raw)).toBe(rawSnapshot);
  });

  it("packet output is deeply detached from input references", () => {
    const envelope = makeEnvelope();
    const raw = [{ source_id: envelope.source_id, amount: 42 }];
    envelope.content_hash = contentHashFor(raw);

    const engine = new RefineryEngine(makeDeps().clock, makeDeps().ids);
    const { packet } = engine.run({
      sourceEnvelopes: [envelope],
      rawRecords: raw,
      ruleManifest: makeRuleManifest(),
    });

    packet.source_envelopes[0]!.owner = "MUTATED";
    packet.declared_scope.organization = "MUTATED";

    expect(envelope.owner).not.toBe("MUTATED");

    const engine2 = new RefineryEngine(makeDeps().clock, makeDeps().ids);
    const { packet: packet2 } = engine2.run({
      sourceEnvelopes: [envelope],
      rawRecords: raw,
      ruleManifest: makeRuleManifest(),
    });
    expect(packet2.source_envelopes[0]!.owner).not.toBe("MUTATED");
    expect(packet2.declared_scope.organization).not.toBe("MUTATED");
  });

  it("caller cannot bypass required stages: run() accepts no stage-list parameter", () => {
    const engine = new RefineryEngine(makeDeps().clock, makeDeps().ids);
    const runInput = {
      sourceEnvelopes: [makeEnvelope()],
      rawRecords: [{ source_id: "SRC-001", amount: 1 }],
      ruleManifest: makeRuleManifest(),
    } as Record<string, unknown>;
    runInput.stages = [];
    const { completedStages } = engine.run(
      runInput as unknown as Parameters<RefineryEngine["run"]>[0],
    );
    expect(completedStages).toEqual(REQUIRED_STAGE_CHAIN.map((stage) => stage.id));
  });
});
