import { describe, expect, it } from "vitest";

import {
  CONTROLLED_MEMORY_GATEWAY_ADAPTER_VERSION,
  ControlledMemoryGatewayContract,
  buildControlledMemoryGatewayAdapterSnapshot,
  type ControlledMemoryPolicyContext,
} from "../src";

const NOW = "2026-05-21T01:00:00.000Z";

function allowPolicy(overrides: Partial<ControlledMemoryPolicyContext> = {}): ControlledMemoryPolicyContext {
  return {
    traceId: "trace-memory-tail",
    policyResult: "allow",
    actorId: "operator-memory-tail",
    actorRole: "operator",
    allowedScopes: ["session", "project"],
    canWrite: true,
    canReadRestricted: false,
    canReinject: false,
    ...overrides,
  };
}

function makeGateway(): ControlledMemoryGatewayContract {
  return new ControlledMemoryGatewayContract({
    now: () => NOW,
    estimateTokens: (content) => content.split(/\s+/).filter(Boolean).length,
  });
}

describe("Phase 2.B controlled memory gateway adapter", () => {
  it("wraps capture result without creating persistence or new memory tiers", () => {
    const gateway = makeGateway();
    const wrapped = gateway.captureWithAdapter({
      sourceEvent: "session_end",
      content: "Remember email ada@example.com should be masked.",
      kind: "working",
      scope: "session",
      sessionId: "session-memory-tail",
      policy: allowPolicy(),
      provenance: { sourceClass: "runtime_event", summary: "session memory" },
    });

    expect(wrapped.adapter.version).toBe(CONTROLLED_MEMORY_GATEWAY_ADAPTER_VERSION);
    expect(wrapped.adapter.source).toBe("learning-plane:controlled-memory-gateway");
    expect(wrapped.adapter.decision).toBe("captured");
    expect(wrapped.adapter.recordCount).toBe(1);
    expect(wrapped.adapter.contextSegmentCount).toBe(0);
    expect(wrapped.adapter.maskedTokenCount).toBe(1);
    expect(wrapped.adapter.persistentStoreCreated).toBe(false);
    expect(wrapped.adapter.newMemoryTierCreated).toBe(false);
    expect(wrapped.result.record?.content).toContain("[PII_EMAIL]");
  });

  it("wraps retrieve and denied reinjection results through the same adapter contract", () => {
    const gateway = makeGateway();
    gateway.capture({
      sourceEvent: "handoff",
      content: "Keep memory adapter boundaries explicit.",
      kind: "procedural",
      scope: "project",
      projectId: "project-memory-tail",
      policy: allowPolicy(),
      provenance: { sourceClass: "runtime_event", summary: "handoff memory" },
    });

    const retrieved = gateway.retrieveWithAdapter({
      query: "boundaries",
      projectId: "project-memory-tail",
      policy: allowPolicy(),
    });
    const blockedReinjection = gateway.reinjectWithAdapter({
      query: "boundaries",
      projectId: "project-memory-tail",
      policy: allowPolicy({ canReinject: false }),
    });

    expect(retrieved.adapter.decision).toBe("retrieved");
    expect(retrieved.adapter.recordCount).toBe(1);
    expect(buildControlledMemoryGatewayAdapterSnapshot(retrieved.result)).toEqual(retrieved.adapter);
    expect(blockedReinjection.adapter.decision).toBe("denied");
    expect(blockedReinjection.adapter.reason).toBe("memory_reinjection_not_authorized");
    expect(blockedReinjection.adapter.contextSegmentCount).toBe(0);
  });
});
