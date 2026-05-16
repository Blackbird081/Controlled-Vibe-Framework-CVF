import { describe, expect, it } from "vitest";

import {
  buildRuntimeDashboardSnapshot,
  type AgentSessionPanelRecord,
  type PortPanelRecord,
  type RateLimitPanelRecord,
  type TokenContextPanelRecord,
} from "../observability/runtime.dashboard.snapshot.js";

const now = "2026-05-17T00:00:00.000Z";

describe("runtime dashboard snapshot", () => {
  it("defaults to read-only mode and carries the intervention boundary", () => {
    const snapshot = buildRuntimeDashboardSnapshot({ generatedAt: now });

    expect(snapshot.mode).toBe("READ_ONLY_MODE");
    expect(snapshot.refreshPolicy.defaultRefreshIntervalMs).toBe(2000);
    expect(snapshot.refreshPolicy.readOnlySafe).toBe(true);
    expect(snapshot.allowedActions).toContain("observe");
    expect(snapshot.blockedInterventions).toContain("kill_process");
    expect(snapshot.blockedInterventions).toContain("reroute_provider");
    expect(snapshot.claimBoundary).toContain("Observability sees");
  });

  it("source-tags every emitted dashboard event", () => {
    const snapshot = buildRuntimeDashboardSnapshot({
      generatedAt: now,
      sessions: [session({ riskLevel: "NOTICE" })],
      tokenContext: [token({ contextWarningLevel: "WARNING" })],
      rateLimits: [rate({ quotaPressureLevel: "HIGH" })],
    });

    expect(snapshot.panels.events.length).toBeGreaterThanOrEqual(3);
    for (const event of snapshot.panels.events) {
      expect(event.source).toMatch(/^CVF_/);
      expect(event.correlationId).toBe("corr-1");
      expect(event.createdAt).toBe(now);
    }
  });

  it("generates receipts for high and critical alerts", () => {
    const snapshot = buildRuntimeDashboardSnapshot({
      generatedAt: now,
      rateLimits: [rate({ quotaPressureLevel: "HIGH" })],
      ports: [port({ orphanStatus: "TRUE", riskLevel: "CRITICAL" })],
    });

    const highOrCritical = snapshot.panels.alerts.filter((alert) =>
      alert.severity === "HIGH" || alert.severity === "CRITICAL"
    );

    expect(highOrCritical.length).toBe(2);
    expect(highOrCritical.every((alert) => alert.receiptId?.startsWith("obs-receipt"))).toBe(true);
    expect(snapshot.summary.policyRequiredCount).toBe(2);
    expect(snapshot.summary.highestSeverity).toBe("CRITICAL");
  });

  it("does not turn dashboard events into direct actions", () => {
    const snapshot = buildRuntimeDashboardSnapshot({
      generatedAt: now,
      ports: [port({ orphanStatus: "TRUE", riskLevel: "WARNING" })],
    });

    const alert = snapshot.panels.alerts[0];

    expect(alert.recommendedAction).toContain("governed review");
    expect(snapshot.blockedInterventions).toContain("close_port");
    expect(snapshot.blockedInterventions).toContain("delete_audit");
  });

  it("records unknown token availability as notice instead of guessing usage", () => {
    const snapshot = buildRuntimeDashboardSnapshot({
      generatedAt: now,
      tokenContext: [
        token({
          inputTokens: null,
          outputTokens: null,
          totalTokens: null,
          contextWindowSize: null,
          contextUsedPercent: null,
          contextWarningLevel: "UNKNOWN",
          verifiedSource: false,
        }),
      ],
    });

    expect(snapshot.panels.events[0].eventType).toBe("CONTEXT_USAGE_UNAVAILABLE");
    expect(snapshot.panels.events[0].severity).toBe("NOTICE");
    expect(snapshot.panels.alerts[0].message).toContain("No verified token metadata");
  });
});

function session(overrides: Partial<AgentSessionPanelRecord> = {}): AgentSessionPanelRecord {
  return {
    sessionId: "session-1",
    agentType: "CVF_MANAGED_SESSION",
    provider: "dashscope",
    projectPath: "/repo",
    status: "ACTIVE",
    startedAt: now,
    lastActivityAt: now,
    riskLevel: "INFO",
    source: "CVF_AGENT_SESSION_MONITOR",
    correlationId: "corr-1",
    observedAt: now,
    ...overrides,
  };
}

function token(overrides: Partial<TokenContextPanelRecord> = {}): TokenContextPanelRecord {
  return {
    sessionId: "session-1",
    provider: "dashscope",
    model: "qwen-turbo",
    inputTokens: 600,
    outputTokens: 200,
    totalTokens: 800,
    contextWindowSize: 1000,
    contextUsedPercent: 80,
    contextWarningLevel: "WARNING",
    estimatedCost: null,
    verifiedSource: true,
    source: "CVF_TOKEN_CONTEXT_METER",
    correlationId: "corr-1",
    observedAt: now,
    ...overrides,
  };
}

function rate(overrides: Partial<RateLimitPanelRecord> = {}): RateLimitPanelRecord {
  return {
    provider: "dashscope",
    model: "qwen-turbo",
    requestLimitStatus: "NORMAL",
    tokenLimitStatus: "NOTICE",
    resetWindow: null,
    quotaPressureLevel: "NOTICE",
    source: "CVF_RATE_LIMIT_WATCHER",
    correlationId: "corr-1",
    observedAt: now,
    ...overrides,
  };
}

function port(overrides: Partial<PortPanelRecord> = {}): PortPanelRecord {
  return {
    port: 3000,
    protocol: "tcp",
    pid: 123,
    sessionId: "session-1",
    status: "OPEN",
    ownerProcess: "next dev",
    orphanStatus: "FALSE",
    riskLevel: "INFO",
    source: "CVF_PROCESS_PORT_GUARD",
    correlationId: "corr-1",
    observedAt: now,
    ...overrides,
  };
}
