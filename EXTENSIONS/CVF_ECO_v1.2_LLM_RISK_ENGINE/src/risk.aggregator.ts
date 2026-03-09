import { RiskAssessment, SessionRisk, RiskLevel } from "./types";
import { scoreToLevel } from "./risk.scorer";

const RISK_ORDER: Record<RiskLevel, number> = { R0: 0, R1: 1, R2: 2, R3: 3 };
const ESCALATION_THRESHOLD = 5.0;
const MAX_SESSION_HISTORY = 100;

let sessionCounter = 0;

function nextSessionId(): string {
  sessionCounter++;
  return `SES-${String(sessionCounter).padStart(4, "0")}`;
}

export function resetSessionCounter(): void {
  sessionCounter = 0;
}

export class RiskAggregator {
  private sessions: Map<string, SessionRisk> = new Map();
  private activeSessionId: string | null = null;

  startSession(): string {
    const id = nextSessionId();
    this.sessions.set(id, {
      sessionId: id,
      totalActions: 0,
      cumulativeScore: 0,
      highestLevel: "R0",
      assessments: [],
      escalated: false,
      startedAt: Date.now(),
    });
    this.activeSessionId = id;
    return id;
  }

  record(assessment: RiskAssessment, sessionId?: string): SessionRisk {
    const sid = sessionId ?? this.activeSessionId;
    if (!sid || !this.sessions.has(sid)) {
      const newId = this.startSession();
      return this.recordToSession(newId, assessment);
    }
    return this.recordToSession(sid, assessment);
  }

  getSessionRisk(sessionId?: string): SessionRisk | undefined {
    const sid = sessionId ?? this.activeSessionId;
    if (!sid) return undefined;
    return this.sessions.get(sid);
  }

  getSessionLevel(sessionId?: string): RiskLevel {
    const session = this.getSessionRisk(sessionId);
    if (!session) return "R0";

    const avgScore = session.totalActions > 0
      ? session.cumulativeScore / session.totalActions
      : 0;

    const avgLevel = scoreToLevel(avgScore);
    return this.maxLevel(avgLevel, session.highestLevel);
  }

  isEscalated(sessionId?: string): boolean {
    const session = this.getSessionRisk(sessionId);
    return session?.escalated ?? false;
  }

  endSession(sessionId?: string): SessionRisk | undefined {
    const sid = sessionId ?? this.activeSessionId;
    if (!sid) return undefined;

    const session = this.sessions.get(sid);
    if (sid === this.activeSessionId) {
      this.activeSessionId = null;
    }
    return session;
  }

  listSessions(): SessionRisk[] {
    return [...this.sessions.values()];
  }

  clearAll(): void {
    this.sessions.clear();
    this.activeSessionId = null;
  }

  private recordToSession(sessionId: string, assessment: RiskAssessment): SessionRisk {
    const session = this.sessions.get(sessionId)!;

    session.totalActions++;
    session.cumulativeScore += assessment.finalScore;
    session.highestLevel = this.maxLevel(session.highestLevel, assessment.finalLevel);

    if (session.assessments.length < MAX_SESSION_HISTORY) {
      session.assessments.push(assessment);
    }

    if (session.cumulativeScore >= ESCALATION_THRESHOLD) {
      session.escalated = true;
    }

    if (assessment.finalLevel === "R3") {
      session.escalated = true;
    }

    return session;
  }

  private maxLevel(a: RiskLevel, b: RiskLevel): RiskLevel {
    return RISK_ORDER[a] >= RISK_ORDER[b] ? a : b;
  }
}
