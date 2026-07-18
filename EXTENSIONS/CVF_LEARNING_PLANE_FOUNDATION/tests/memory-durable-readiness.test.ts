import { describe, expect, it } from "vitest";
import { readMemory } from "../src/memory-durable-readiness";
import {
  createInProcessDurableMemoryStore,
  DURABLE_MEMORY_STORE_VERSION,
} from "../src/durable-memory-store";

function baseWriteInput(overrides: Record<string, unknown> = {}) {
  return {
    id: "mem-1",
    scope: "team-alpha",
    actorId: "actor-1",
    actorRole: "OPERATOR" as const,
    summary: "durable summary",
    policyDecision: "allow" as const,
    actorAuthorized: true,
    tier: "skill",
    ...overrides,
  };
}

describe("memory durable readiness", () => {
  it("denies writes when unauthorized", () => {
    const store = createInProcessDurableMemoryStore();

    const result = store.write(baseWriteInput({ actorAuthorized: false, policyDecision: "deny" }));

    expect(result.receipt).toMatchObject({
      contractVersion: DURABLE_MEMORY_STORE_VERSION,
      operation: "write",
      decision: "denied",
      reason: "durable_memory_policy_denied",
      summaryOnly: true,
      canReinject: false,
      rawMemoryReleased: false,
    });
    expect(result.record).toBeUndefined();
  });

  it("denies writes when policy decision is not allow", () => {
    const store = createInProcessDurableMemoryStore();

    const result = store.write(baseWriteInput({ policyDecision: "deny" }));

    expect(result.receipt.decision).toBe("denied");
    expect(result.receipt.reason).toBe("durable_memory_policy_denied");
    expect(result.record).toBeUndefined();
  });

  it("denies writes below provenance floor", () => {
    const store = createInProcessDurableMemoryStore();

    const result = store.write(baseWriteInput({ provenanceScore: 0.5 }));

    expect(result.receipt).toMatchObject({
      decision: "denied",
      reason: "low_provenance_score",
      summaryOnly: true,
      canReinject: false,
      rawMemoryReleased: false,
    });
    expect(result.record).toBeUndefined();
  });

  it("denies reads when unauthorized", () => {
    const store = createInProcessDurableMemoryStore();

    const readiness = readMemory(store, {
      scope: "team-alpha",
      actorId: "actor-1",
      actorRole: "OPERATOR",
      actorAuthorized: false,
    });

    expect(readiness.receipt).toMatchObject({
      decision: "denied",
      reason: "durable_memory_policy_denied",
      summaryOnly: true,
      rawMemoryReleased: false,
      canReinject: false,
    });
    expect(readiness.records).toHaveLength(0);
  });

  it("allows reads for authorized actor and preserves receipt invariants", () => {
    const store = createInProcessDurableMemoryStore();

    const writeResult = store.write(
      baseWriteInput({ id: "mem-allowed", policyDecision: "allow", provenanceScore: 0.9 }),
    );
    expect(writeResult.receipt.decision).toBe("allowed");

    const readiness = readMemory(store, {
      scope: "team-alpha",
      actorId: "actor-1",
      actorRole: "OPERATOR",
      tier: "skill",
      actorAuthorized: true,
    });

    expect(readiness.receipt).toMatchObject({
      contractVersion: DURABLE_MEMORY_STORE_VERSION,
      operation: "read",
      decision: "allowed",
      reason: "durable_memory_read_authorized",
      summaryOnly: true,
      rawMemoryReleased: false,
      canReinject: false,
    });
    expect(readiness.records).toHaveLength(1);
    expect(readiness.records[0]).toMatchObject({
      id: "mem-allowed",
      scope: "team-alpha",
      actorId: "actor-1",
      tier: "skill",
      summary: "durable summary",
    });
  });
});
