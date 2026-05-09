import {
  SessionSnapshot,
  GovernanceMetrics,
  RiskLevel,
  Verdict,
} from "./types";

export class MetricsCollector {
  private sessions: SessionSnapshot[] = [];

  addSession(snapshot: SessionSnapshot): void {
    this.sessions.push(snapshot);
  }

  addSessions(snapshots: SessionSnapshot[]): void {
    this.sessions.push(...snapshots);
  }

  getSessions(): SessionSnapshot[] {
    return [...this.sessions];
  }

  compute(): GovernanceMetrics {
    const riskDistribution: Record<RiskLevel, number> = { R0: 0, R1: 0, R2: 0, R3: 0 };
    const verdictDistribution: Record<Verdict, number> = { ALLOW: 0, WARN: 0, ESCALATE: 0, BLOCK: 0 };
    const domainActivity: Record<string, number> = {};
    const violationCounts: Record<string, number> = {};

    let totalActions = 0;
    let totalBlocks = 0;
    let totalEscalations = 0;
    let riskSum = 0;

    for (const session of this.sessions) {
      totalActions += session.actionCount;
      riskSum += session.cumulativeRisk;

      riskDistribution[session.highestRisk]++;

      for (const [verdict, count] of Object.entries(session.verdictCounts)) {
        verdictDistribution[verdict as Verdict] += count;
      }

      totalBlocks += session.verdictCounts.BLOCK ?? 0;
      totalEscalations += session.verdictCounts.ESCALATE ?? 0;

      for (const [domain, count] of Object.entries(session.domainBreakdown)) {
        domainActivity[domain] = (domainActivity[domain] ?? 0) + count;
      }
    }

    const topViolations = Object.entries(violationCounts)
      .map(([rule, count]) => ({ rule, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalSessions: this.sessions.length,
      totalActions,
      totalBlocks,
      totalEscalations,
      avgRiskScore: totalActions > 0 ? riskSum / this.sessions.length : 0,
      riskDistribution,
      verdictDistribution,
      domainActivity,
      topViolations,
    };
  }

  clear(): void {
    this.sessions = [];
  }
}
