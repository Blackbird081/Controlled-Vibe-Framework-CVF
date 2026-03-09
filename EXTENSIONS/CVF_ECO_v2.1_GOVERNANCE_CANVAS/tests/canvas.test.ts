import { describe, it, expect, beforeEach } from "vitest";
import { GovernanceCanvas } from "../src/canvas";
import { SessionSnapshot } from "../src/types";

describe("GovernanceCanvas", () => {
  let canvas: GovernanceCanvas;

  function makeSnapshot(overrides: Partial<SessionSnapshot> = {}): SessionSnapshot {
    return {
      sessionId: "SES-001",
      agentId: "agent-1",
      actionCount: 5,
      cumulativeRisk: 1.2,
      highestRisk: "R1",
      verdictCounts: { ALLOW: 3, WARN: 1, ESCALATE: 1, BLOCK: 0 },
      domainBreakdown: { finance: 3, privacy: 2 },
      startedAt: Date.now(),
      ...overrides,
    };
  }

  beforeEach(() => {
    canvas = new GovernanceCanvas({ title: "Test Governance Report" });
  });

  it("generates complete report", () => {
    canvas.addSession(makeSnapshot());
    const report = canvas.generateReport();
    expect(report.title).toBe("Test Governance Report");
    expect(report.generatedAt).toBeGreaterThan(0);
    expect(report.metrics).toBeDefined();
    expect(report.sessions.length).toBe(1);
    expect(report.textReport.length).toBeGreaterThan(0);
    expect(report.markdownReport.length).toBeGreaterThan(0);
  });

  it("generates text report", () => {
    canvas.addSession(makeSnapshot());
    const text = canvas.getTextReport();
    expect(text).toContain("Test Governance Report");
    expect(text).toContain("SUMMARY");
  });

  it("generates markdown report", () => {
    canvas.addSession(makeSnapshot());
    const md = canvas.getMarkdownReport();
    expect(md).toContain("# Test Governance Report");
    expect(md).toContain("## Summary");
  });

  it("computes metrics from sessions", () => {
    canvas.addSessions([
      makeSnapshot({ actionCount: 5, cumulativeRisk: 1.0 }),
      makeSnapshot({ sessionId: "SES-002", actionCount: 3, cumulativeRisk: 2.0 }),
    ]);
    const metrics = canvas.getMetrics();
    expect(metrics.totalSessions).toBe(2);
    expect(metrics.totalActions).toBe(8);
  });

  it("handles empty canvas", () => {
    const report = canvas.generateReport();
    expect(report.metrics.totalSessions).toBe(0);
    expect(report.metrics.totalActions).toBe(0);
  });

  it("clears all data", () => {
    canvas.addSession(makeSnapshot());
    canvas.clear();
    const metrics = canvas.getMetrics();
    expect(metrics.totalSessions).toBe(0);
  });

  it("end-to-end multi-session report", () => {
    canvas.addSessions([
      makeSnapshot({
        sessionId: "SES-001", agentId: "finance-bot", actionCount: 10,
        cumulativeRisk: 3.5, highestRisk: "R2",
        verdictCounts: { ALLOW: 7, WARN: 1, ESCALATE: 1, BLOCK: 1 },
        domainBreakdown: { finance: 8, privacy: 2 },
      }),
      makeSnapshot({
        sessionId: "SES-002", agentId: "code-bot", actionCount: 6,
        cumulativeRisk: 1.0, highestRisk: "R1",
        verdictCounts: { ALLOW: 5, WARN: 1, ESCALATE: 0, BLOCK: 0 },
        domainBreakdown: { code_security: 4, general: 2 },
      }),
      makeSnapshot({
        sessionId: "SES-003", agentId: "data-bot", actionCount: 3,
        cumulativeRisk: 4.0, highestRisk: "R3",
        verdictCounts: { ALLOW: 0, WARN: 0, ESCALATE: 1, BLOCK: 2 },
        domainBreakdown: { privacy: 3 },
      }),
    ]);

    const report = canvas.generateReport();
    expect(report.metrics.totalSessions).toBe(3);
    expect(report.metrics.totalActions).toBe(19);
    expect(report.metrics.totalBlocks).toBe(3);
    expect(report.sessions.length).toBe(3);

    expect(report.textReport).toContain("finance-bot");
    expect(report.markdownReport).toContain("| SES-003 |");
  });
});
