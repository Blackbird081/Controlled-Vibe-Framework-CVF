import { describe, expect, it } from "vitest";
import {
  GENERIC_AGENT_ADAPTER_VERSION,
  CONTROL_POINT_COVERAGE,
  mapAgentEventToCvf,
  mapAgentEventBatch,
  type AgentFrameworkEvent,
} from "./generic-agent-adapter";

const FIXED_NOW = "2026-05-31T00:00:00.000Z";

function makeEvent(eventType: AgentFrameworkEvent["eventType"], id = "evt-1"): AgentFrameworkEvent {
  return {
    eventId: id,
    eventType,
    agentId: "agent-test",
    frameworkName: "generic",
    payload: { test: true },
    timestamp: FIXED_NOW,
  };
}

describe("IS1 — Generic Agent Adapter", () => {
  it("INTENT event maps to CP1_INTENT", () => {
    const r = mapAgentEventToCvf(makeEvent("INTENT"));
    expect(r.controlPoint).toBe("CP1_INTENT");
    expect(r.controlPointStatus).toBe("IMPLEMENTED");
    expect(r.requiresGovernanceCheck).toBe(true);
  });

  it("PLAN event maps to CP2_PLAN (PARTIAL)", () => {
    const r = mapAgentEventToCvf(makeEvent("PLAN"));
    expect(r.controlPoint).toBe("CP2_PLAN");
    expect(r.controlPointStatus).toBe("PARTIAL");
    expect(r.advisoryAction).toContain("partial");
  });

  it("TOOL_CALL event maps to CP3_TOOL (IMPLEMENTED)", () => {
    const r = mapAgentEventToCvf(makeEvent("TOOL_CALL"));
    expect(r.controlPoint).toBe("CP3_TOOL");
    expect(r.controlPointStatus).toBe("IMPLEMENTED");
  });

  it("EXECUTION event maps to CP4_RUNTIME (IMPLEMENTED)", () => {
    const r = mapAgentEventToCvf(makeEvent("EXECUTION"));
    expect(r.controlPoint).toBe("CP4_RUNTIME");
    expect(r.controlPointStatus).toBe("IMPLEMENTED");
  });

  it("RESULT event maps to CP5_RESULT (IMPLEMENTED)", () => {
    const r = mapAgentEventToCvf(makeEvent("RESULT"));
    expect(r.controlPoint).toBe("CP5_RESULT");
    expect(r.controlPointStatus).toBe("IMPLEMENTED");
  });

  it("runtimeAdapterAuthorized is always false", () => {
    const types: AgentFrameworkEvent["eventType"][] = ["INTENT", "PLAN", "TOOL_CALL", "EXECUTION", "RESULT"];
    for (const t of types) {
      expect(mapAgentEventToCvf(makeEvent(t)).runtimeAdapterAuthorized).toBe(false);
    }
  });

  it("contractVersion matches GENERIC_AGENT_ADAPTER_VERSION", () => {
    const r = mapAgentEventToCvf(makeEvent("INTENT"));
    expect(r.contractVersion).toBe(GENERIC_AGENT_ADAPTER_VERSION);
    expect(r.contractVersion).toBe("cvf.genericAgentAdapter.is1.v1");
  });

  it("eventId is preserved in result", () => {
    const r = mapAgentEventToCvf(makeEvent("INTENT", "my-event-42"));
    expect(r.eventId).toBe("my-event-42");
  });

  it("eventType is preserved in result", () => {
    const r = mapAgentEventToCvf(makeEvent("TOOL_CALL"));
    expect(r.eventType).toBe("TOOL_CALL");
  });

  it("cvfIntakeRoute is non-empty for all event types", () => {
    const types: AgentFrameworkEvent["eventType"][] = ["INTENT", "PLAN", "TOOL_CALL", "EXECUTION", "RESULT"];
    for (const t of types) {
      expect(mapAgentEventToCvf(makeEvent(t)).cvfIntakeRoute.length).toBeGreaterThan(0);
    }
  });

  it("CONTROL_POINT_COVERAGE has 5 entries", () => {
    expect(Object.keys(CONTROL_POINT_COVERAGE)).toHaveLength(5);
  });

  it("mapAgentEventBatch maps all events in order", () => {
    const events = [makeEvent("INTENT", "e1"), makeEvent("PLAN", "e2"), makeEvent("RESULT", "e3")];
    const results = mapAgentEventBatch(events);
    expect(results).toHaveLength(3);
    expect(results[0].eventId).toBe("e1");
    expect(results[1].controlPoint).toBe("CP2_PLAN");
    expect(results[2].controlPoint).toBe("CP5_RESULT");
  });

  it("INTENT cvfIntakeRoute mentions INTENT_VALIDATION", () => {
    const r = mapAgentEventToCvf(makeEvent("INTENT"));
    expect(r.cvfIntakeRoute).toContain("INTENT_VALIDATION");
  });

  it("TOOL_CALL cvfIntakeRoute mentions MCP_SERVER", () => {
    const r = mapAgentEventToCvf(makeEvent("TOOL_CALL"));
    expect(r.cvfIntakeRoute).toContain("MCP_SERVER");
  });
});
