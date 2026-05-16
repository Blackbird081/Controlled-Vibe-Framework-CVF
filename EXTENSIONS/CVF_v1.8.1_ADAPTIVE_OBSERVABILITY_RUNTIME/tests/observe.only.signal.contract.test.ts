import { describe, expect, it } from "vitest";

import {
  createObservabilityReceipt,
  measureTokenContext,
  validateProposedObservabilityAction,
  watchProcessPort,
  watchRateLimit,
} from "../observability/observe.only.signal.contract.js";

describe("observe-only signal contract", () => {
  it("classifies verified token context thresholds", () => {
    expect(
      measureTokenContext(baseTokenMeasurement({ inputTokens: 300, outputTokens: 290 })).severity,
    ).toBe("NORMAL");
    expect(
      measureTokenContext(baseTokenMeasurement({ inputTokens: 400, outputTokens: 200 })).severity,
    ).toBe("NOTICE");
    expect(
      measureTokenContext(baseTokenMeasurement({ inputTokens: 500, outputTokens: 250 })).severity,
    ).toBe("WARNING");
    expect(
      measureTokenContext(baseTokenMeasurement({ inputTokens: 600, outputTokens: 300 })).severity,
    ).toBe("HIGH");
    expect(
      measureTokenContext(baseTokenMeasurement({ inputTokens: 800, outputTokens: 180 })).severity,
    ).toBe("CRITICAL");
  });

  it("rejects untrusted token estimates as unverified observability input", () => {
    const signal = measureTokenContext(
      baseTokenMeasurement({
        inputTokens: 100,
        outputTokens: 100,
        source: "agent_self_report",
      }),
    );

    expect(signal.verifiedSource).toBe(false);
    expect(signal.severity).toBe("WARNING");
    expect(signal.reason).toContain("not trusted");
  });

  it("requires receipts for high and critical token pressure", () => {
    const high = measureTokenContext(
      baseTokenMeasurement({ inputTokens: 600, outputTokens: 300 }),
    );
    const critical = measureTokenContext(
      baseTokenMeasurement({ inputTokens: 800, outputTokens: 180 }),
    );

    expect(high.receiptRequired).toBe(true);
    expect(critical.receiptRequired).toBe(true);
    expect(high.recommendedAction).toBe("recommend_session_handoff");
    expect(critical.recommendedAction).toBe("recommend_new_controlled_session");
  });

  it("maps rate-limit pressure without rerouting providers", () => {
    expect(watchRateLimit(baseRateLimit("normal")).severity).toBe("NORMAL");
    expect(watchRateLimit(baseRateLimit("provider_warning")).severity).toBe("WARNING");
    expect(watchRateLimit(baseRateLimit("repeated_throttle")).severity).toBe("HIGH");
    expect(watchRateLimit(baseRateLimit("quota_exhausted")).severity).toBe("CRITICAL");

    const decision = validateProposedObservabilityAction("reroute_provider");
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("observe-only");
  });

  it("maps process and port anomalies to warning, high, and critical", () => {
    expect(
      watchProcessPort({
        sessionId: "s-1",
        knownProcess: false,
        orphanProcess: false,
        exposure: "local",
        port: 3000,
      }).severity,
    ).toBe("WARNING");
    expect(
      watchProcessPort({
        sessionId: "s-1",
        processId: 101,
        knownProcess: true,
        orphanProcess: true,
        exposure: "local",
      }).severity,
    ).toBe("HIGH");
    expect(
      watchProcessPort({
        sessionId: "s-1",
        processId: 101,
        knownProcess: true,
        orphanProcess: true,
        exposure: "external",
      }).severity,
    ).toBe("CRITICAL");
  });

  it("creates deterministic observe-only receipts", () => {
    const signal = watchRateLimit(baseRateLimit("repeated_throttle"));
    const first = createObservabilityReceipt(signal);
    const second = createObservabilityReceipt(signal);

    expect(first).toEqual(second);
    expect(first.receiptId).toContain(signal.id);
    expect(first.observed).toBe(true);
    expect(first.allowedActions).toContain("emit_receipt");
    expect(first.blockedInterventions).toContain("kill_process");
    expect(first.blockedInterventions).toContain("change_policy");
  });

  it("allows observe-only actions and blocks intervention actions", () => {
    expect(validateProposedObservabilityAction("observe").allowed).toBe(true);
    expect(validateProposedObservabilityAction("alert").allowed).toBe(true);
    expect(validateProposedObservabilityAction("approve").allowed).toBe(false);
    expect(validateProposedObservabilityAction("kill_process").allowed).toBe(false);
    expect(validateProposedObservabilityAction("truncate_context").allowed).toBe(false);
  });
});

function baseTokenMeasurement(overrides: {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly source?: "runtime_counter" | "provider_usage" | "billing_meter" | "agent_self_report";
}) {
  return {
    sessionId: "session-alpha",
    provider: "dashscope",
    model: "qwen-turbo",
    inputTokens: overrides.inputTokens ?? 100,
    outputTokens: overrides.outputTokens ?? 50,
    contextWindowSize: 1000,
    source: overrides.source ?? "runtime_counter",
  };
}

function baseRateLimit(state: "normal" | "provider_warning" | "repeated_throttle" | "quota_exhausted") {
  return {
    sessionId: "session-alpha",
    provider: "dashscope",
    state,
    occurrenceCount: state === "repeated_throttle" ? 3 : 1,
  };
}
