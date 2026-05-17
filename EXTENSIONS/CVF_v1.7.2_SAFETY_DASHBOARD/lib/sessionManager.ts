// lib/sessionManager.ts — V2.0 (Audit + Lifecycle + EventEmitter)

import { RLevel, StrategyDecision } from "./strategy/governanceStrategy.types";
import { GovernanceStrategyAdapter } from "./strategy/governanceStrategy.adapter";

// ============================================================
// Types
// ============================================================

export type Phase =
  | "discovery"
  | "planning"
  | "execution"
  | "verification";

export type GovernanceEventType =
  | "PHASE_CHANGED"
  | "RISK_UPDATED"
  | "AUTONOMY_ADJUSTED"
  | "ESCALATED"
  | "REQUIRES_HUMAN"
  | "HARD_STOP"
  | "STEP_ADVANCED"
  | "SESSION_FROZEN";

export type SessionStatus = "ACTIVE" | "FROZEN";

// ============================================================
// Interfaces
// ============================================================

export interface SessionInfo {
  sessionId: string;
  cvfVersion: string;
  profile: string;
  startedAt: number;
}

export interface GovernanceEvent {
  id: string;
  sessionId: string;
  timestamp: number;
  step: number;
  phase: Phase;
  rLevel: RLevel;
  autonomy: number;
  type: GovernanceEventType;
  metadata?: Record<string, string | number | boolean>;
}

export interface SessionState {
  rLevel: RLevel;
  phase: Phase;
  autonomy: number;
  step: number;
  escalated: boolean;
  requireHuman: boolean;
  hardStop: boolean;
  warning: boolean;
  critical: boolean;
}

// ============================================================
// SessionManager
// ============================================================

export class SessionManager {
  private state: SessionState;
  private events: GovernanceEvent[] = [];
  private strategyAdapter?: GovernanceStrategyAdapter;
  private sessionInfo: SessionInfo;
  private status: SessionStatus = "ACTIVE";
  private listeners = new Set<() => void>();
  private snapshot: SessionState;

  constructor(
    initialAutonomy: number = 70,
    profile: string = "balanced",
    cvfVersion: string = "1.7.0"
  ) {
    if (initialAutonomy < 0 || initialAutonomy > 100) {
      throw new RangeError(
        `initialAutonomy must be between 0 and 100, got ${initialAutonomy}`
      );
    }

    const sessionId = crypto.randomUUID();

    this.sessionInfo = {
      sessionId,
      cvfVersion,
      profile,
      startedAt: Date.now(),
    };

    this.state = {
      rLevel: "R0",
      phase: "discovery",
      autonomy: initialAutonomy,
      step: 0,
      escalated: false,
      requireHuman: false,
      hardStop: false,
      warning: false,
      critical: false,
    };

    this.logEvent("STEP_ADVANCED");
    this.snapshot = { ...this.state };
  }

  // ---- Observer Pattern ----

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    this.snapshot = { ...this.state };
    this.listeners.forEach((fn) => fn());
  }

  /** Stable reference for useSyncExternalStore */
  public getSnapshot = (): SessionState => {
    return this.snapshot;
  };

  // ---- Lifecycle ----

  private isFrozen(): boolean {
    return this.status === "FROZEN";
  }

  public endSession() {
    if (this.isFrozen()) return;

    this.logEvent("SESSION_FROZEN", { note: "Session Frozen" });
    this.status = "FROZEN";
    this.notify();
  }

  public getStatus(): SessionStatus {
    return this.status;
  }

  // ---- Audit Log ----

  private logEvent(type: GovernanceEventType, metadata?: Record<string, string | number | boolean>) {
    if (this.isFrozen()) return;

    this.events.push({
      id: crypto.randomUUID(),
      sessionId: this.sessionInfo.sessionId,
      timestamp: Date.now(),
      step: this.state.step,
      phase: this.state.phase,
      rLevel: this.state.rLevel,
      autonomy: this.state.autonomy,
      type,
      metadata,
    });
  }

  public getEvents(): GovernanceEvent[] {
    return [...this.events];
  }

  public getSessionInfo(): SessionInfo {
    return { ...this.sessionInfo };
  }

  // ---- Strategy ----

  public attachStrategy(adapter: GovernanceStrategyAdapter, profile?: string) {
    if (this.isFrozen()) return;

    this.strategyAdapter = adapter;

    if (profile) {
      this.sessionInfo.profile = profile;
    }

    this.notify();
  }

  // ---- Phase ----

  public setPhase(phase: Phase) {
    if (this.isFrozen()) return;
    if (this.state.phase === phase) return;

    this.state.phase = phase;
    this.logEvent("PHASE_CHANGED", { newPhase: phase });
    this.notify();
  }

  // ---- Risk ----

  public updateRisk(rLevel: RLevel) {
    if (this.isFrozen()) return;
    if (this.state.rLevel === rLevel) return;

    this.state.rLevel = rLevel;
    this.logEvent("RISK_UPDATED", { newRisk: rLevel });

    this.evaluateCurrentStrategy();
    this.notify();
  }

  /**
   * Re-evaluate current risk with current strategy.
   * Called after updateRisk or after profile change.
   */
  public reEvaluateStrategy() {
    if (this.isFrozen()) return;
    this.evaluateCurrentStrategy();
    this.notify();
  }

  private evaluateCurrentStrategy() {
    if (this.strategyAdapter) {
      const decision = this.strategyAdapter.evaluate({
        rLevel: this.state.rLevel,
        currentAutonomy: this.state.autonomy,
        sessionStep: this.state.step,
      });

      this.applyStrategyDecision(decision);
    }
  }

  private applyStrategyDecision(decision: StrategyDecision) {
    if (this.isFrozen()) return;

    if (decision.newAutonomy !== this.state.autonomy) {
      this.state.autonomy = decision.newAutonomy;
      this.logEvent("AUTONOMY_ADJUSTED");
    }

    if (decision.escalate && !this.state.escalated) this.logEvent("ESCALATED");
    if (decision.requireHuman && !this.state.requireHuman) this.logEvent("REQUIRES_HUMAN");
    if (decision.hardStop && !this.state.hardStop) this.logEvent("HARD_STOP");

    this.state.escalated = decision.escalate;
    this.state.requireHuman = decision.requireHuman;
    this.state.hardStop = decision.hardStop;
    this.state.warning = decision.warning;
    this.state.critical = decision.critical;
  }

  // ---- Step ----

  public nextStep() {
    if (this.isFrozen()) return;

    this.state.step += 1;
    this.logEvent("STEP_ADVANCED");
    this.notify();
  }

  // ---- State ----

  public getState(): SessionState {
    return { ...this.state };
  }

  /**
   * Restore a session from serialized data (read-only replay).
   */
  public static restore(data: {
    sessionInfo: SessionInfo;
    state: SessionState;
    events: GovernanceEvent[];
    status: SessionStatus;
  }): SessionManager {
    const instance = new SessionManager(
      data.state.autonomy,
      data.sessionInfo.profile,
      data.sessionInfo.cvfVersion
    );
    // Overwrite auto-generated fields
    instance.sessionInfo = { ...data.sessionInfo };
    instance.state = { ...data.state };
    instance.events = data.events.map((e) => ({ ...e }));
    instance.status = data.status;
    instance.snapshot = { ...data.state };
    return instance;
  }
}