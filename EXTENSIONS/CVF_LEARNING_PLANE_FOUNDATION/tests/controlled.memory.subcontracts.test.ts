import { describe, expect, it } from "vitest";
import {
  applyMemoryPrivacyFilter,
  isApprovedMemoryCaptureSource,
  resolveMemoryRetention,
} from "../src/controlled.memory.subcontracts";
import { ControlledMemoryGatewayContract } from "../src/controlled.memory.gateway.contract";
import type { ControlledMemoryPolicyContext } from "../src/controlled.memory.gateway.contract";

const NOW = "2026-05-17T00:00:00.000Z";

describe("controlled memory subcontracts", () => {
  it("filters memory-specific secrets before storage", () => {
    const result = applyMemoryPrivacyFilter("Contact bob@example.com with password=hunter2 and sk-abcdefghijklmnop");

    expect(result.content).toContain("[PII_EMAIL]");
    expect(result.content).toContain("[SECRET_MASKED]");
    expect(result.content).not.toContain("bob@example.com");
    expect(result.report.filtered).toBe(true);
  });

  it("allows only approved memory capture sources", () => {
    expect(isApprovedMemoryCaptureSource("session_end")).toBe(true);
    expect(isApprovedMemoryCaptureSource("direct_clipboard_capture")).toBe(false);
  });

  it("computes default retention without making memory permanent by default", () => {
    expect(resolveMemoryRetention({ kind: "working", sensitivity: "internal", capturedAt: NOW }).expiresAt).toBe("2026-05-18T00:00:00.000Z");
    expect(resolveMemoryRetention({ kind: "episodic", sensitivity: "internal", capturedAt: NOW }).expiresAt).toBe("2026-08-15T00:00:00.000Z");
    expect(resolveMemoryRetention({ kind: "semantic", sensitivity: "restricted", capturedAt: NOW })).toMatchObject({
      expiresAt: undefined,
      reviewRequired: true,
      reason: "sensitive_memory_requires_review_gate",
    });
  });

  it("denies unapproved capture sources through the gateway", () => {
    const gateway = new ControlledMemoryGatewayContract({ now: () => NOW });
    const result = gateway.capture({
      sourceEvent: "direct_clipboard_capture",
      content: "copy this",
      kind: "episodic",
      scope: "project",
      policy: allowPolicy(),
      provenance: { sourceClass: "runtime_event", summary: "clipboard" },
    });

    expect(result.record).toBeUndefined();
    expect(result.receipt).toMatchObject({
      decision: "denied",
      reason: "memory_capture_source_not_approved",
    });
  });
});

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
