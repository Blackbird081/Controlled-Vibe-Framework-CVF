import { describe, expect, it } from "vitest";
import {
  evaluateMemoryEventHook,
  MEMORY_EVENT_HOOKS_VERSION,
  type MemoryEventHookInput,
} from "../src/memory-event-hooks";

const baseEvent: MemoryEventHookInput = {
  eventId: "evt-1",
  sessionId: "session-1",
  actorId: "actor-1",
  projectId: "project-1",
  eventType: "user_prompt_submit",
  riskLevel: "R1",
  policyDecision: "allow",
};

describe("memory event hooks W2", () => {
  it("allows approved capture events with a secret-safe receipt", () => {
    expect(evaluateMemoryEventHook(baseEvent)).toMatchObject({
      contractVersion: MEMORY_EVENT_HOOKS_VERSION,
      decision: "allow_capture",
      allowed: true,
      receipt: {
        auditReceiptRequired: true,
        rawMemoryReleased: false,
        canReinject: false,
      },
    });
  });

  it("denies direct private capture events", () => {
    expect(evaluateMemoryEventHook({
      ...baseEvent,
      eventType: "direct_clipboard_capture",
    })).toMatchObject({
      decision: "deny",
      allowed: false,
      reason: "memory_event_hook_not_approved",
      receipt: {
        rawMemoryReleased: false,
        canReinject: false,
      },
    });
  });

  it("requires privacy filtering for sensitive events", () => {
    expect(evaluateMemoryEventHook({
      ...baseEvent,
      containsSensitiveData: true,
    })).toMatchObject({
      decision: "allow_redacted_capture",
      allowed: true,
      reason: "privacy_filter_required",
      receipt: { rawMemoryReleased: false },
    });
  });

  it("requires memory ids for context read and packaged context events", () => {
    expect(evaluateMemoryEventHook({
      ...baseEvent,
      eventType: "memory_context_packaged",
    })).toMatchObject({
      decision: "deny",
      reason: "memory_ids_required_for_context_event",
    });

    expect(evaluateMemoryEventHook({
      ...baseEvent,
      eventType: "memory_context_packaged",
      memoryIds: ["mem-1"],
    })).toMatchObject({
      decision: "allow_context_read",
      reason: "memory_context_event_authorized",
      receipt: {
        memoryIds: ["mem-1"],
        canReinject: false,
      },
    });
  });

  it("requires human review for high-risk memory events", () => {
    expect(evaluateMemoryEventHook({
      ...baseEvent,
      riskLevel: "R3",
    })).toMatchObject({
      decision: "require_human_approval",
      allowed: false,
      reason: "memory_event_requires_human_review",
    });
  });
});
