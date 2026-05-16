import { describe, expect, it } from "vitest";
import {
  ControlledMemoryGatewayContract,
  type ControlledMemoryPolicyContext,
} from "../src/controlled.memory.gateway.contract";

const NOW = "2026-05-16T00:00:00.000Z";

function allowPolicy(overrides: Partial<ControlledMemoryPolicyContext> = {}): ControlledMemoryPolicyContext {
  return {
    traceId: "trace-memory",
    policyResult: "allow",
    actorId: "operator-1",
    actorRole: "operator",
    allowedScopes: ["session", "project"],
    canWrite: true,
    canReadRestricted: false,
    canReinject: true,
    ...overrides,
  };
}

function makeGateway(now: string = NOW): ControlledMemoryGatewayContract {
  return new ControlledMemoryGatewayContract({
    now: () => now,
    estimateTokens: (content) => content.split(/\s+/).filter(Boolean).length,
  });
}

describe("ControlledMemoryGatewayContract", () => {
  it("captures memory only after policy allows write and privacy filtering runs", () => {
    const gateway = makeGateway();
    const result = gateway.capture({
      sourceEvent: "session_end",
      content: "Customer email alice@example.com used password=secret123 for setup.",
      kind: "episodic",
      scope: "project",
      projectId: "project-a",
      sensitivity: "internal",
      policy: allowPolicy(),
      provenance: { sourceClass: "runtime_event", summary: "session end summary" },
    });

    expect(result.receipt.decision).toBe("captured");
    expect(result.record?.content).toContain("[PII_EMAIL]");
    expect(result.record?.content).toContain("[SECRET_MASKED]");
    expect(result.receipt.maskedTokenCount).toBe(2);
    expect(JSON.stringify(result)).not.toContain("alice@example.com");
    expect(JSON.stringify(result)).not.toContain("password=secret123");
  });

  it("fails closed on denied or approval-required policy", () => {
    const gateway = makeGateway();
    const denied = gateway.capture({
      sourceEvent: "prompt_submit",
      content: "remember this",
      kind: "working",
      scope: "session",
      policy: allowPolicy({ policyResult: "deny", reason: "risk_block" }),
      provenance: { sourceClass: "runtime_event", summary: "prompt" },
    });
    const approval = gateway.retrieve({
      query: "remember",
      policy: allowPolicy({ policyResult: "requires_approval" }),
    });

    expect(denied.record).toBeUndefined();
    expect(denied.receipt).toMatchObject({ decision: "denied", reason: "risk_block" });
    expect(approval.records).toEqual([]);
    expect(approval.receipt.decision).toBe("requires_approval");
  });

  it("does not capture restricted memory without restricted approval", () => {
    const gateway = makeGateway();
    const result = gateway.capture({
      sourceEvent: "tool_result",
      content: "restricted account migration note",
      kind: "semantic",
      scope: "project",
      sensitivity: "restricted",
      policy: allowPolicy({ canReadRestricted: false }),
      provenance: { sourceClass: "runtime_event", summary: "tool result" },
    });

    expect(result.record).toBeUndefined();
    expect(result.receipt).toMatchObject({
      decision: "requires_approval",
      reason: "restricted_memory_requires_approval",
    });
  });

  it("retrieves by scope, kind, lifecycle, query, and token budget", () => {
    const gateway = makeGateway();
    const first = gateway.capture({
      sourceEvent: "session_end",
      content: "pricing roadmap should keep local-first deployment language",
      kind: "semantic",
      scope: "project",
      projectId: "project-a",
      policy: allowPolicy(),
      provenance: { sourceClass: "runtime_event", summary: "project memory" },
    }).record!;
    gateway.capture({
      sourceEvent: "session_end",
      content: "unrelated support note",
      kind: "episodic",
      scope: "session",
      sessionId: "session-b",
      policy: allowPolicy(),
      provenance: { sourceClass: "runtime_event", summary: "session memory" },
    });
    gateway.markLifecycle(first.memoryId, "stale");

    const staleResult = gateway.retrieve({
      query: "pricing",
      projectId: "project-a",
      includeKinds: ["semantic"],
      maxTokens: 20,
      policy: allowPolicy(),
    });

    expect(staleResult.records).toHaveLength(0);

    gateway.markLifecycle(first.memoryId, "active");
    const activeResult = gateway.retrieve({
      query: "pricing",
      projectId: "project-a",
      includeKinds: ["semantic"],
      maxTokens: 20,
      policy: allowPolicy(),
    });

    expect(activeResult.records.map((record) => record.memoryId)).toEqual([first.memoryId]);
    expect(activeResult.receipt.reason).toBe("memory_retrieved_after_access_lifecycle_budget");
  });

  it("expires ttl-bound memory without deleting the receipt lineage", () => {
    let now = NOW;
    const gateway = new ControlledMemoryGatewayContract({
      now: () => now,
      estimateTokens: (content) => content.length,
    });
    const record = gateway.capture({
      sourceEvent: "prompt_submit",
      content: "short lived working memory",
      kind: "working",
      scope: "session",
      ttlDays: 1,
      policy: allowPolicy(),
      provenance: { sourceClass: "runtime_event", summary: "prompt" },
    }).record!;

    now = "2026-05-18T00:00:00.000Z";
    const result = gateway.retrieve({ query: "working", policy: allowPolicy() });

    expect(result.records).toEqual([]);
    expect(gateway.listRecords().map((item) => item.memoryId)).toContain(record.memoryId);
  });

  it("packages reinjection segments with provenance and requires reinjection authorization", () => {
    const gateway = makeGateway();
    const record = gateway.capture({
      sourceEvent: "handoff",
      content: "Always preserve claim boundary wording in public docs",
      kind: "procedural",
      scope: "project",
      projectId: "project-a",
      policy: allowPolicy(),
      provenance: { sourceClass: "runtime_event", summary: "handoff rule" },
    }).record!;

    const blocked = gateway.reinject({
      query: "claim boundary",
      projectId: "project-a",
      policy: allowPolicy({ canReinject: false }),
    });
    const allowed = gateway.reinject({
      query: "claim boundary",
      projectId: "project-a",
      memoryIds: [record.memoryId],
      policy: allowPolicy(),
      maxTokens: 20,
    });

    expect(blocked.contextSegments).toEqual([]);
    expect(blocked.receipt).toMatchObject({ decision: "denied", reason: "memory_reinjection_not_authorized" });
    expect(allowed.contextSegments).toHaveLength(1);
    expect(allowed.contextSegments[0]).toMatchObject({
      memoryId: record.memoryId,
      provenanceSummary: "handoff rule",
      sensitivity: "internal",
    });
    expect(allowed.receipt.decision).toBe("reinjectable");
  });
});
