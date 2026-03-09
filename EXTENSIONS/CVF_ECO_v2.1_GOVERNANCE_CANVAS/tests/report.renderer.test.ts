import { describe, it, expect } from "vitest";
import { ReportRenderer } from "../src/report.renderer";
import { GovernanceMetrics, SessionSnapshot } from "../src/types";

describe("ReportRenderer", () => {
  const renderer = new ReportRenderer({ title: "Test Canvas" });

  const metrics: GovernanceMetrics = {
    totalSessions: 2,
    totalActions: 8,
    totalBlocks: 1,
    totalEscalations: 2,
    avgRiskScore: 1.75,
    riskDistribution: { R0: 0, R1: 1, R2: 0, R3: 1 },
    verdictDistribution: { ALLOW: 4, WARN: 1, ESCALATE: 2, BLOCK: 1 },
    domainActivity: { finance: 4, privacy: 2, code_security: 2 },
    topViolations: [],
  };

  const sessions: SessionSnapshot[] = [
    {
      sessionId: "SES-001",
      agentId: "agent-1",
      actionCount: 5,
      cumulativeRisk: 1.0,
      highestRisk: "R1",
      verdictCounts: { ALLOW: 3, WARN: 1, ESCALATE: 1, BLOCK: 0 },
      domainBreakdown: { finance: 3, privacy: 2 },
      startedAt: Date.now(),
    },
    {
      sessionId: "SES-002",
      agentId: "agent-2",
      actionCount: 3,
      cumulativeRisk: 2.5,
      highestRisk: "R3",
      verdictCounts: { ALLOW: 1, WARN: 0, ESCALATE: 1, BLOCK: 1 },
      domainBreakdown: { finance: 1, code_security: 2 },
      startedAt: Date.now(),
    },
  ];

  describe("text report", () => {
    it("includes title", () => {
      const text = renderer.renderText(metrics, sessions);
      expect(text).toContain("Test Canvas");
    });

    it("includes summary metrics", () => {
      const text = renderer.renderText(metrics, sessions);
      expect(text).toContain("Sessions:     2");
      expect(text).toContain("Actions:      8");
      expect(text).toContain("Blocks:       1");
    });

    it("includes risk distribution", () => {
      const text = renderer.renderText(metrics, sessions);
      expect(text).toContain("R0:");
      expect(text).toContain("R3:");
    });

    it("includes verdict distribution", () => {
      const text = renderer.renderText(metrics, sessions);
      expect(text).toContain("ALLOW");
      expect(text).toContain("BLOCK");
    });

    it("includes session details", () => {
      const text = renderer.renderText(metrics, sessions);
      expect(text).toContain("SES-001");
      expect(text).toContain("agent-1");
    });

    it("includes domain activity", () => {
      const text = renderer.renderText(metrics, sessions);
      expect(text).toContain("finance");
    });
  });

  describe("markdown report", () => {
    it("starts with heading", () => {
      const md = renderer.renderMarkdown(metrics, sessions);
      expect(md).toContain("# Test Canvas");
    });

    it("includes summary table", () => {
      const md = renderer.renderMarkdown(metrics, sessions);
      expect(md).toContain("| Sessions | 2 |");
      expect(md).toContain("| Total Actions | 8 |");
    });

    it("includes risk distribution table", () => {
      const md = renderer.renderMarkdown(metrics, sessions);
      expect(md).toContain("| R0 |");
      expect(md).toContain("| R3 |");
    });

    it("includes session details table", () => {
      const md = renderer.renderMarkdown(metrics, sessions);
      expect(md).toContain("| SES-001 |");
      expect(md).toContain("| SES-002 |");
    });

    it("includes domain activity table", () => {
      const md = renderer.renderMarkdown(metrics, sessions);
      expect(md).toContain("| finance |");
    });
  });

  describe("configuration", () => {
    it("hides session details when configured", () => {
      const noDetails = new ReportRenderer({ includeSessionDetails: false });
      const text = noDetails.renderText(metrics, sessions);
      expect(text).not.toContain("SESSION DETAILS");
    });
  });
});
