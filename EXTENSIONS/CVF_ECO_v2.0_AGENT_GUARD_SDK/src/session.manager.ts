import { AgentSession, GovernanceDecision, RiskLevel } from "./types";

let sessionCounter = 0;

function nextSessionId(): string {
  sessionCounter++;
  return `SDK-SES-${String(sessionCounter).padStart(4, "0")}`;
}

export function resetSessionCounter(): void {
  sessionCounter = 0;
}

const RISK_ORDER: Record<RiskLevel, number> = { R0: 0, R1: 1, R2: 2, R3: 3 };

function higherRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RISK_ORDER[a] >= RISK_ORDER[b] ? a : b;
}

export class SessionManager {
  private sessions: Map<string, AgentSession> = new Map();

  startSession(agentId: string): AgentSession {
    const session: AgentSession = {
      sessionId: nextSessionId(),
      agentId,
      startedAt: Date.now(),
      decisions: [],
      cumulativeRisk: 0,
      highestRisk: "R0",
      actionCount: 0,
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  recordDecision(sessionId: string, decision: GovernanceDecision): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.decisions.push(decision);
    session.cumulativeRisk += decision.riskScore;
    session.highestRisk = higherRisk(session.highestRisk, decision.riskLevel);
    session.actionCount++;
  }

  getSession(sessionId: string): AgentSession | undefined {
    return this.sessions.get(sessionId);
  }

  endSession(sessionId: string): AgentSession | undefined {
    const session = this.sessions.get(sessionId);
    this.sessions.delete(sessionId);
    return session;
  }

  listSessions(): AgentSession[] {
    return [...this.sessions.values()];
  }

  getSessionSummary(sessionId: string): {
    actionCount: number;
    cumulativeRisk: number;
    highestRisk: RiskLevel;
    blockCount: number;
    escalateCount: number;
  } | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    return {
      actionCount: session.actionCount,
      cumulativeRisk: session.cumulativeRisk,
      highestRisk: session.highestRisk,
      blockCount: session.decisions.filter((d) => d.verdict === "BLOCK").length,
      escalateCount: session.decisions.filter((d) => d.verdict === "ESCALATE").length,
    };
  }

  clearAll(): void {
    this.sessions.clear();
  }
}
