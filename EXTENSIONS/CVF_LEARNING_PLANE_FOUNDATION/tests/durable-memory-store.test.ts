import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  createFileBackedDurableMemoryStore,
  createInProcessDurableMemoryStore,
  DURABLE_MEMORY_STORE_VERSION,
} from "../src/durable-memory-store";
import {
  describeRuntimeMemoryTier,
  evaluateRuntimeMemoryAction,
} from "../src/runtime-memory-hierarchy";

let tempDir: string | undefined;

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe("durable memory store m1", () => {
  it("allows policy-gated skill memory write/read receipts without reinjection", () => {
    const store = createInProcessDurableMemoryStore({ now: () => 1770000000000 });

    const written = store.write({
      id: "skill-memory-1",
      tier: "skill",
      scope: "project-a",
      actorId: "builder-1",
      actorRole: "BUILDER",
      summary: "Use strategy_analysis for small-team planning briefs.",
      policyDecision: "allow",
      actorAuthorized: true,
      provenanceScore: 0.91,
    });

    const read = store.read({
      tier: "skill",
      scope: "project-a",
      actorId: "builder-1",
      actorRole: "BUILDER",
      actorAuthorized: true,
      query: "strategy_analysis",
    });

    expect(written.receipt).toMatchObject({
      contractVersion: DURABLE_MEMORY_STORE_VERSION,
      operation: "write",
      decision: "allowed",
      reason: "durable_memory_write_authorized",
      memoryIds: ["skill-memory-1"],
      durablePersistence: true,
      crossSession: true,
      canReinject: false,
      rawMemoryReleased: false,
    });
    expect(read.receipt).toMatchObject({
      operation: "read",
      decision: "allowed",
      memoryIds: ["skill-memory-1"],
      summaryOnly: true,
      canReinject: false,
      rawMemoryReleased: false,
    });
    expect(read.records[0]).toMatchObject({
      id: "skill-memory-1",
      summary: "Use strategy_analysis for small-team planning briefs.",
    });
  });

  it("persists long-term memory across store instances using the file backend", () => {
    tempDir = mkdtempSync(join(tmpdir(), "cvf-m1-memory-"));
    const filePath = join(tempDir, "durable-memory.json");
    const firstSession = createFileBackedDurableMemoryStore(filePath, {
      now: () => 1770000000100,
    });

    const write = firstSession.write({
      id: "long-term-1",
      tier: "long-term",
      scope: "global:operator",
      actorId: "operator-1",
      actorRole: "OPERATOR",
      summary: "Small-team production claim remains bounded to one proven path.",
      policyDecision: "allow",
      actorAuthorized: true,
      lifecycleState: "procedural",
    });

    const secondSession = createFileBackedDurableMemoryStore(filePath);
    const read = secondSession.read({
      tier: "long-term",
      scope: "global:operator",
      actorId: "operator-1",
      actorRole: "REVIEWER",
      actorAuthorized: true,
      query: "bounded",
    });

    expect(write.receipt.decision).toBe("allowed");
    expect(read.records.map((record) => record.id)).toEqual(["long-term-1"]);
    expect(read.receipt).toMatchObject({
      decision: "allowed",
      reason: "durable_memory_read_authorized",
      memoryIds: ["long-term-1"],
      crossSession: true,
    });
  });

  it("handles corrupt file-backed JSON without throwing", () => {
    tempDir = mkdtempSync(join(tmpdir(), "cvf-m1-memory-corrupt-"));
    const filePath = join(tempDir, "durable-memory.json");
    writeFileSync(filePath, "{not-json", "utf8");

    const store = createFileBackedDurableMemoryStore(filePath);
    const read = store.read({
      tier: "skill",
      scope: "project-a",
      actorId: "reviewer-1",
      actorRole: "REVIEWER",
      actorAuthorized: true,
    });

    expect(store.list()).toEqual([]);
    expect(read).toMatchObject({
      records: [],
      receipt: {
        decision: "allowed",
        reason: "durable_memory_read_authorized",
        memoryIds: [],
        crossSession: true,
        canReinject: false,
      },
    });
  });

  it("filters malformed records from file-backed storage", () => {
    tempDir = mkdtempSync(join(tmpdir(), "cvf-m1-memory-malformed-"));
    const filePath = join(tempDir, "durable-memory.json");
    writeFileSync(filePath, JSON.stringify([
      { id: "bad-record", tier: "working", summary: "not durable" },
      {
        id: "skill-memory-valid",
        tier: "skill",
        scope: "project-a",
        actorId: "builder-1",
        summary: "Only valid durable records are listed.",
        lifecycleState: "semantic",
        provenanceScore: 0.91,
        createdAt: 1770000000300,
        updatedAt: 1770000000300,
      },
    ]), "utf8");

    const store = createFileBackedDurableMemoryStore(filePath);

    expect(store.list().map((record) => record.id)).toEqual(["skill-memory-valid"]);
  });

  it("emits unique receipt ids for repeated operations", () => {
    const store = createInProcessDurableMemoryStore({ now: () => 1770000000200 });

    const first = store.write({
      id: "skill-memory-unique",
      tier: "skill",
      scope: "project-a",
      actorId: "builder-1",
      actorRole: "BUILDER",
      summary: "Use a short planning memo.",
      policyDecision: "allow",
      actorAuthorized: true,
    });
    const second = store.read({
      tier: "skill",
      scope: "project-a",
      actorId: "builder-1",
      actorRole: "BUILDER",
      actorAuthorized: true,
    });
    const third = store.read({
      tier: "skill",
      scope: "project-a",
      actorId: "builder-1",
      actorRole: "BUILDER",
      actorAuthorized: true,
    });

    expect(first.receipt.receiptId).toMatch(/^m1-write-/);
    expect(second.receipt.receiptId).toMatch(/^m1-read-/);
    expect(third.receipt.receiptId).toMatch(/^m1-read-/);
    expect(new Set([
      first.receipt.receiptId,
      second.receipt.receiptId,
      third.receipt.receiptId,
    ]).size).toBe(3);
  });

  it("filters secrets, blocked lifecycle states, low provenance, and raw payloads at write time", () => {
    const store = createInProcessDurableMemoryStore();

    const secret = store.write({
      id: "secret-1",
      tier: "skill",
      scope: "project-a",
      actorId: "operator-1",
      actorRole: "OPERATOR",
      summary: "contains key",
      policyDecision: "allow",
      actorAuthorized: true,
      containsSecret: true,
    });
    const expired = store.write({
      id: "expired-1",
      tier: "skill",
      scope: "project-a",
      actorId: "operator-1",
      actorRole: "OPERATOR",
      summary: "old note",
      policyDecision: "allow",
      actorAuthorized: true,
      lifecycleState: "expired",
    });
    const lowTrust = store.write({
      id: "low-trust-1",
      tier: "long-term",
      scope: "project-a",
      actorId: "operator-1",
      actorRole: "OPERATOR",
      summary: "maybe useful",
      policyDecision: "allow",
      actorAuthorized: true,
      provenanceScore: 0.2,
    });
    const raw = store.write(({
      id: "raw-1",
      tier: "skill",
      scope: "project-a",
      actorId: "operator-1",
      actorRole: "OPERATOR",
      summary: "has raw payload",
      policyDecision: "allow",
      actorAuthorized: true,
      content: "raw memory must not persist",
    }) as Parameters<typeof store.write>[0]);

    expect(secret.receipt.excluded).toEqual([{ id: "secret-1", reason: "privacy_filtered" }]);
    expect(expired.receipt.excluded).toEqual([{ id: "expired-1", reason: "lifecycle_expired" }]);
    expect(lowTrust.receipt.excluded).toEqual([{ id: "low-trust-1", reason: "low_provenance_score" }]);
    expect(raw.receipt.excluded).toEqual([{ id: "raw-1", reason: "raw_memory_payload_rejected" }]);
    expect(store.list()).toEqual([]);
  });

  it("denies non-M1 tiers and unauthorized actors", () => {
    const store = createInProcessDurableMemoryStore();

    const task = store.write({
      id: "task-1",
      tier: "task",
      scope: "project-a",
      actorId: "operator-1",
      actorRole: "OPERATOR",
      summary: "task memory must stay ephemeral",
      policyDecision: "allow",
      actorAuthorized: true,
    });
    const humanLongTerm = store.write({
      id: "long-term-human-1",
      tier: "long-term",
      scope: "global:operator",
      actorId: "human-1",
      actorRole: "HUMAN",
      summary: "human cannot write long-term durable memory",
      policyDecision: "allow",
      actorAuthorized: true,
    });

    expect(task.receipt).toMatchObject({
      decision: "denied",
      reason: "durable_memory_tier_not_authorized",
    });
    expect(humanLongTerm.receipt).toMatchObject({
      decision: "denied",
      reason: "actor_not_allowed_for_memory_tier",
    });
  });

  it("keeps canReinject false while releasing durable persistence for skill and long-term tiers", () => {
    expect(describeRuntimeMemoryTier({ tier: "skill" })).toMatchObject({
      durablePersistenceAllowed: true,
      crossSessionAccessAllowed: true,
      canReinject: false,
      runtimeProof: "m1_durable_cross_session",
    });
    expect(describeRuntimeMemoryTier({ tier: "long-term" })).toMatchObject({
      durablePersistenceAllowed: true,
      crossSessionAccessAllowed: true,
      canReinject: false,
      runtimeProof: "m1_durable_cross_session",
    });
    expect(evaluateRuntimeMemoryAction({
      tier: "skill",
      action: "reinject",
      actorRole: "OPERATOR",
      crossSession: true,
    })).toMatchObject({
      decision: "denied",
      reason: "memory_reinjection_not_authorized_in_h2",
      canReinject: false,
    });
  });
});
