/**
 * PhaseContext — v1.1.3 Governance Runtime Hardening
 *
 * Maintains runtime context for a development phase.
 * Tracks current stage, component identity, and transition history.
 *
 * v1.1.3 changes:
 *   - Added transitionHistory tracking for audit and retry counting
 *   - Added getTransitionCount() for retry limit enforcement
 *   - Added getTransitionHistory() for full audit trail
 */

import { PhaseStage } from "./phase.protocol";

export interface TransitionRecord {
  from: PhaseStage;
  to: PhaseStage;
  timestamp: number;
}

export class PhaseContext {
  private componentName: string;
  private stage: PhaseStage;
  private transitionHistory: TransitionRecord[] = [];

  constructor(componentName: string) {
    this.componentName = componentName;
    this.stage = "SPEC";
  }

  public getComponent(): string {
    return this.componentName;
  }

  public getStage(): PhaseStage {
    return this.stage;
  }

  public setStage(stage: PhaseStage): void {
    const from = this.stage;
    this.transitionHistory.push({
      from,
      to: stage,
      timestamp: Date.now(),
    });
    this.stage = stage;
  }

  /**
   * Count how many times a specific transition has occurred.
   * Used by PhaseProtocol for retry limit enforcement.
   */
  public getTransitionCount(from: PhaseStage, to: PhaseStage): number {
    return this.transitionHistory.filter(
      (r) => r.from === from && r.to === to
    ).length;
  }

  /**
   * Full transition history for audit trail.
   */
  public getTransitionHistory(): readonly TransitionRecord[] {
    return this.transitionHistory;
  }

  public reset(): void {
    this.stage = "SPEC";
    this.transitionHistory = [];
  }
}