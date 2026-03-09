import {
  AgentAction,
  GovernanceDecision,
  ActionVerdict,
  SDKConfig,
  DEFAULT_SDK_CONFIG,
} from "./types";
import { RiskModule } from "./risk.module";
import { GuardModule } from "./guard.module";
import { SessionManager, resetSessionCounter } from "./session.manager";
import { AuditLogger, resetAuditCounter } from "./audit.logger";

export { resetSessionCounter, resetAuditCounter };

export class AgentGuard {
  private config: SDKConfig;
  private risk: RiskModule;
  private guard: GuardModule;
  private sessions: SessionManager;
  private audit: AuditLogger;

  constructor(config: Partial<SDKConfig> = {}) {
    this.config = { ...DEFAULT_SDK_CONFIG, ...config };
    this.risk = new RiskModule();
    this.guard = new GuardModule();
    this.sessions = new SessionManager();
    this.audit = new AuditLogger();
  }

  startSession(agentId: string): string {
    const session = this.sessions.startSession(agentId);
    return session.sessionId;
  }

  evaluate(sessionId: string, action: AgentAction): GovernanceDecision {
    const start = performance.now();
    const reasoning: string[] = [];
    const policyMatches: string[] = [];
    let verdict: ActionVerdict = "ALLOW";
    let riskScore = 0;
    let riskLevel: import("./types").RiskLevel = "R0";

    if (this.config.enableRiskScoring) {
      const riskResult = this.risk.evaluate(action);
      riskScore = riskResult.score;
      riskLevel = riskResult.level;
      reasoning.push(...riskResult.factors);

      if (riskLevel === this.config.autoEscalateAtRisk || riskLevel === "R3") {
        verdict = this.escalateVerdict(verdict, "ESCALATE");
        reasoning.push(`risk:auto-escalate(${riskLevel})`);
      }
    }

    let guardViolations: GovernanceDecision["violations"] = [];
    let guardWarnings: string[] = [];

    if (this.config.enableDomainGuards) {
      const guardResult = this.guard.evaluate(action);
      guardViolations = guardResult.violations;
      guardWarnings = guardResult.warnings;

      if (guardResult.verdict === "BLOCK") {
        verdict = "BLOCK";
        reasoning.push("guard:BLOCK");
      } else if (guardResult.verdict === "ESCALATE") {
        verdict = this.escalateVerdict(verdict, "ESCALATE");
        reasoning.push("guard:ESCALATE");
      } else if (guardResult.verdict === "WARN") {
        verdict = this.escalateVerdict(verdict, "WARN");
        reasoning.push("guard:WARN");
      }

      for (const v of guardViolations) {
        policyMatches.push(`${v.rule}:${v.severity}`);
      }
    }

    const session = this.sessions.getSession(sessionId);
    if (session && this.config.maxSessionActions > 0) {
      if (session.actionCount >= this.config.maxSessionActions) {
        verdict = "BLOCK";
        reasoning.push("session:max-actions-exceeded");
      }
    }

    const elapsed = performance.now() - start;

    const decision: GovernanceDecision = {
      action,
      verdict,
      riskLevel,
      riskScore,
      violations: guardViolations,
      warnings: guardWarnings,
      reasoning,
      policyMatches,
      timestamp: Date.now(),
      durationMs: elapsed,
    };

    this.sessions.recordDecision(sessionId, decision);

    if (this.config.enableAuditLog) {
      this.audit.log(sessionId, decision);
    }

    return decision;
  }

  endSession(sessionId: string) {
    return this.sessions.endSession(sessionId);
  }

  getSessionSummary(sessionId: string) {
    return this.sessions.getSessionSummary(sessionId);
  }

  getAuditLog() {
    return this.audit.getAll();
  }

  getAuditBySession(sessionId: string) {
    return this.audit.getBySession(sessionId);
  }

  getAuditCount(): number {
    return this.audit.count();
  }

  exportAudit(): string {
    return this.audit.exportJSON();
  }

  getGuardModule(): GuardModule {
    return this.guard;
  }

  getRiskModule(): RiskModule {
    return this.risk;
  }

  private escalateVerdict(current: ActionVerdict, next: ActionVerdict): ActionVerdict {
    const order: Record<ActionVerdict, number> = { ALLOW: 0, WARN: 1, ESCALATE: 2, BLOCK: 3 };
    return order[next] > order[current] ? next : current;
  }
}
