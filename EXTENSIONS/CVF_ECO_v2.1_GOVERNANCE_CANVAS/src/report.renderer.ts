import {
  GovernanceMetrics,
  SessionSnapshot,
  CanvasConfig,
  DEFAULT_CANVAS_CONFIG,
  RiskLevel,
  Verdict,
} from "./types";

export class ReportRenderer {
  private config: CanvasConfig;

  constructor(config: Partial<CanvasConfig> = {}) {
    this.config = { ...DEFAULT_CANVAS_CONFIG, ...config };
  }

  renderText(metrics: GovernanceMetrics, sessions: SessionSnapshot[]): string {
    const lines: string[] = [];
    const w = this.config.riskBarWidth;

    lines.push("=".repeat(60));
    lines.push(`  ${this.config.title}`);
    lines.push(`  Generated: ${new Date().toISOString()}`);
    lines.push("=".repeat(60));
    lines.push("");

    lines.push("--- SUMMARY ---");
    lines.push(`Sessions:     ${metrics.totalSessions}`);
    lines.push(`Actions:      ${metrics.totalActions}`);
    lines.push(`Blocks:       ${metrics.totalBlocks}`);
    lines.push(`Escalations:  ${metrics.totalEscalations}`);
    lines.push(`Avg Risk:     ${metrics.avgRiskScore.toFixed(3)}`);
    lines.push("");

    lines.push("--- RISK DISTRIBUTION ---");
    const maxRisk = Math.max(...Object.values(metrics.riskDistribution), 1);
    for (const level of ["R0", "R1", "R2", "R3"] as RiskLevel[]) {
      const count = metrics.riskDistribution[level];
      const bar = this.bar(count, maxRisk, w);
      lines.push(`  ${level}: ${bar} ${count}`);
    }
    lines.push("");

    lines.push("--- VERDICT DISTRIBUTION ---");
    const maxVerdict = Math.max(...Object.values(metrics.verdictDistribution), 1);
    for (const v of ["ALLOW", "WARN", "ESCALATE", "BLOCK"] as Verdict[]) {
      const count = metrics.verdictDistribution[v];
      const bar = this.bar(count, maxVerdict, w);
      lines.push(`  ${v.padEnd(9)}: ${bar} ${count}`);
    }
    lines.push("");

    if (Object.keys(metrics.domainActivity).length > 0) {
      lines.push("--- DOMAIN ACTIVITY ---");
      const sorted = Object.entries(metrics.domainActivity).sort((a, b) => b[1] - a[1]);
      const maxDomain = Math.max(...sorted.map(([, c]) => c), 1);
      for (const [domain, count] of sorted) {
        const bar = this.bar(count, maxDomain, w);
        lines.push(`  ${domain.padEnd(15)}: ${bar} ${count}`);
      }
      lines.push("");
    }

    if (this.config.includeSessionDetails && sessions.length > 0) {
      lines.push("--- SESSION DETAILS ---");
      for (const s of sessions) {
        lines.push(`  [${s.sessionId}] agent=${s.agentId} actions=${s.actionCount} risk=${s.highestRisk} cumulative=${s.cumulativeRisk.toFixed(2)}`);
      }
      lines.push("");
    }

    lines.push("=".repeat(60));
    return lines.join("\n");
  }

  renderMarkdown(metrics: GovernanceMetrics, sessions: SessionSnapshot[]): string {
    const lines: string[] = [];

    lines.push(`# ${this.config.title}`);
    lines.push("");
    lines.push(`> Generated: ${new Date().toISOString()}`);
    lines.push("");

    lines.push("## Summary");
    lines.push("");
    lines.push("| Metric | Value |");
    lines.push("|--------|-------|");
    lines.push(`| Sessions | ${metrics.totalSessions} |`);
    lines.push(`| Total Actions | ${metrics.totalActions} |`);
    lines.push(`| Blocks | ${metrics.totalBlocks} |`);
    lines.push(`| Escalations | ${metrics.totalEscalations} |`);
    lines.push(`| Avg Risk Score | ${metrics.avgRiskScore.toFixed(3)} |`);
    lines.push("");

    lines.push("## Risk Distribution");
    lines.push("");
    lines.push("| Level | Count |");
    lines.push("|-------|-------|");
    for (const level of ["R0", "R1", "R2", "R3"] as RiskLevel[]) {
      lines.push(`| ${level} | ${metrics.riskDistribution[level]} |`);
    }
    lines.push("");

    lines.push("## Verdict Distribution");
    lines.push("");
    lines.push("| Verdict | Count |");
    lines.push("|---------|-------|");
    for (const v of ["ALLOW", "WARN", "ESCALATE", "BLOCK"] as Verdict[]) {
      lines.push(`| ${v} | ${metrics.verdictDistribution[v]} |`);
    }
    lines.push("");

    if (Object.keys(metrics.domainActivity).length > 0) {
      lines.push("## Domain Activity");
      lines.push("");
      lines.push("| Domain | Actions |");
      lines.push("|--------|---------|");
      const sorted = Object.entries(metrics.domainActivity).sort((a, b) => b[1] - a[1]);
      for (const [domain, count] of sorted) {
        lines.push(`| ${domain} | ${count} |`);
      }
      lines.push("");
    }

    if (this.config.includeSessionDetails && sessions.length > 0) {
      lines.push("## Sessions");
      lines.push("");
      lines.push("| Session | Agent | Actions | Risk | Cumulative |");
      lines.push("|---------|-------|---------|------|------------|");
      for (const s of sessions) {
        lines.push(`| ${s.sessionId} | ${s.agentId} | ${s.actionCount} | ${s.highestRisk} | ${s.cumulativeRisk.toFixed(2)} |`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }

  private bar(value: number, max: number, width: number): string {
    const filled = max > 0 ? Math.round((value / max) * width) : 0;
    return "\u2588".repeat(filled) + "\u2591".repeat(width - filled);
  }
}
