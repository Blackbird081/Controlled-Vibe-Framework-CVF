import { describe, expect, it } from "vitest";
import {
  createWorkingMemoryRuntimeStore,
  describeRuntimeMemoryTier,
  evaluateRuntimeMemoryAction,
  listRuntimeMemoryTierRules,
  RUNTIME_MEMORY_HIERARCHY_CONTRACT_VERSION,
} from "../src/runtime-memory-hierarchy";

describe("runtime memory hierarchy", () => {
  it("maps the frozen seven memory tiers without creating a new tier", () => {
    const tiers = listRuntimeMemoryTierRules().map((rule) => rule.tier).sort();

    expect(tiers).toEqual([
      "audit",
      "long-term",
      "organizational",
      "receipt",
      "skill",
      "task",
      "working",
    ]);
    expect(listRuntimeMemoryTierRules().every((rule) => rule.canReinject === false)).toBe(true);
  });

  it("describes working memory as the H2 ephemeral proof tier", () => {
    expect(describeRuntimeMemoryTier({ tier: "working" })).toMatchObject({
      tier: "working",
      privacyScope: "session",
      persistenceClass: "ephemeral",
      durablePersistenceAllowed: false,
      crossSessionAccessAllowed: false,
      canReinject: false,
      runtimeProof: "h2_working_ephemeral",
    });
  });

  it("allows same-execution working memory writes and reads for authorized actors", () => {
    const store = createWorkingMemoryRuntimeStore({ now: () => 1770000000000 });

    const written = store.write({
      executionId: "exec-1",
      actorId: "actor-1",
      actorRole: "BUILDER",
      payload: { draftIntent: "summarize customer interview" },
    });
    const retrieved = store.retrieve({
      executionId: "exec-1",
      actorId: "actor-1",
      actorRole: "BUILDER",
    });

    expect(written.decision).toMatchObject({
      contractVersion: RUNTIME_MEMORY_HIERARCHY_CONTRACT_VERSION,
      tier: "working",
      action: "write",
      decision: "allowed",
      reason: "runtime_memory_action_authorized",
      canReinject: false,
      durablePersistenceAllowed: false,
      persistentStoreCreated: false,
      newMemoryTierCreated: false,
    });
    expect(retrieved.entry).toMatchObject({
      executionId: "exec-1",
      actorId: "actor-1",
      payload: { draftIntent: "summarize customer interview" },
    });

    written.entry!.payload.draftIntent = "mutated outside";
    expect(store.retrieve({
      executionId: "exec-1",
      actorId: "actor-1",
      actorRole: "BUILDER",
    }).entry?.payload.draftIntent).toBe("summarize customer interview");
  });

  it("rejects observer writes with a deterministic actor reason", () => {
    const decision = evaluateRuntimeMemoryAction({
      tier: "working",
      action: "write",
      actorRole: "OBSERVER",
    });

    expect(decision).toMatchObject({
      decision: "denied",
      reason: "actor_not_allowed_for_memory_tier",
      canReinject: false,
    });
  });

  it("denies durable persistence requests for ephemeral working memory", () => {
    const store = createWorkingMemoryRuntimeStore();
    const result = store.write({
      executionId: "exec-2",
      actorId: "actor-1",
      actorRole: "OPERATOR",
      payload: { note: "must not persist" },
      durablePersistenceRequested: true,
    });

    expect(result.entry).toBeUndefined();
    expect(result.decision).toMatchObject({
      decision: "denied",
      reason: "durable_persistence_not_authorized",
      durablePersistenceAllowed: false,
      persistentStoreCreated: false,
    });
  });

  it("keeps injection and reinjection unavailable in H2", () => {
    const inject = evaluateRuntimeMemoryAction({
      tier: "working",
      action: "inject",
      actorRole: "OPERATOR",
    });
    const reinject = evaluateRuntimeMemoryAction({
      tier: "task",
      action: "reinject",
      actorRole: "OPERATOR",
      crossSession: true,
    });

    expect(inject).toMatchObject({
      decision: "denied",
      reason: "memory_injection_not_authorized_in_h2",
      canReinject: false,
    });
    expect(reinject).toMatchObject({
      decision: "denied",
      reason: "memory_reinjection_not_authorized_in_h2",
      canReinject: false,
    });
  });

  it("blocks cross-session working memory retrieval", () => {
    const decision = evaluateRuntimeMemoryAction({
      tier: "working",
      action: "retrieve",
      actorRole: "OPERATOR",
      crossSession: true,
    });

    expect(decision).toMatchObject({
      decision: "denied",
      reason: "cross_session_memory_access_not_authorized",
    });
  });

  it("requires privileged review for restricted memory", () => {
    const decision = evaluateRuntimeMemoryAction({
      tier: "working",
      action: "write",
      actorRole: "AI_AGENT",
      sensitivity: "restricted",
    });

    expect(decision).toMatchObject({
      decision: "requires_approval",
      reason: "restricted_memory_requires_review",
    });
  });

  it("blocks contaminated memory actions", () => {
    const decision = evaluateRuntimeMemoryAction({
      tier: "working",
      action: "write",
      actorRole: "OPERATOR",
      contaminationBoundary: "tainted",
    });

    expect(decision).toMatchObject({
      decision: "denied",
      reason: "contamination_boundary_blocks_memory_action",
    });
  });

  it("allows M1 long-term memory while keeping organizational memory policy-map-only", () => {
    const longTerm = evaluateRuntimeMemoryAction({
      tier: "long-term",
      action: "write",
      actorRole: "OPERATOR",
    });
    const organizational = evaluateRuntimeMemoryAction({
      tier: "organizational",
      action: "retrieve",
      actorRole: "GOVERNOR",
    });

    expect(longTerm).toMatchObject({
      decision: "allowed",
      reason: "runtime_memory_action_authorized",
      durablePersistenceAllowed: true,
      persistentStoreCreated: false,
      newMemoryTierCreated: false,
    });
    expect(organizational).toMatchObject({
      decision: "denied",
      reason: "organizational_memory_action_not_authorized",
      persistentStoreCreated: false,
      newMemoryTierCreated: false,
    });
  });

  it("denies cross-actor working memory retrieval within the same process", () => {
    const store = createWorkingMemoryRuntimeStore();
    store.write({
      executionId: "exec-3",
      actorId: "actor-1",
      actorRole: "OPERATOR",
      payload: { note: "private working draft" },
    });

    const result = store.retrieve({
      executionId: "exec-3",
      actorId: "actor-2",
      actorRole: "OPERATOR",
    });

    expect(result.entry).toBeUndefined();
    expect(result.decision).toMatchObject({
      decision: "denied",
      reason: "working_memory_actor_scope_mismatch",
    });
  });
});
