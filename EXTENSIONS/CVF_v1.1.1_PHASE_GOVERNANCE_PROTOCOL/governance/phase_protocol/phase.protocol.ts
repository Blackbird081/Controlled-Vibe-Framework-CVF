/**
 * CVF Phase Governance Protocol
 *
 * Defines the deterministic lifecycle of a development phase.
 * This protocol ensures every component follows a verifiable
 * construction pipeline before entering the runtime system.
 */

import { PhaseContext } from "./phase.context";
import { ArtifactRegistry } from "./artifact.registry";

export type PhaseStage =
  | "SPEC"
  | "STATE_MACHINE"
  | "STATE_DIAGRAM"
  | "IMPLEMENTATION"
  | "STATE_VALIDATION"
  | "UNIT_TESTING"
  | "SCENARIO_SIMULATION"
  | "PHASE_GATE"
  | "COMPLETE";

export interface PhaseProtocolConfig {
  componentName: string;
}

export class PhaseProtocol {
  private context: PhaseContext;
  private artifacts: ArtifactRegistry;

  constructor(config: PhaseProtocolConfig) {
    this.context = new PhaseContext(config.componentName);
    this.artifacts = new ArtifactRegistry(config.componentName);
  }

  public startPhase(): void {
    this.context.setStage("SPEC");
  }

  public advanceStage(nextStage: PhaseStage): void {
    const current = this.context.getStage();

    if (!this.isValidTransition(current, nextStage)) {
      throw new Error(
        `Invalid phase transition from ${current} to ${nextStage}`
      );
    }

    this.context.setStage(nextStage);
  }

  public getCurrentStage(): PhaseStage {
    return this.context.getStage();
  }

  public registerArtifact(type: string, path: string): void {
    this.artifacts.registerArtifact(type, path);
  }

  public getArtifacts() {
    return this.artifacts.getArtifacts();
  }

  private isValidTransition(
    current: PhaseStage,
    next: PhaseStage
  ): boolean {
    const order: PhaseStage[] = [
      "SPEC",
      "STATE_MACHINE",
      "STATE_DIAGRAM",
      "IMPLEMENTATION",
      "STATE_VALIDATION",
      "UNIT_TESTING",
      "SCENARIO_SIMULATION",
      "PHASE_GATE",
      "COMPLETE",
    ];

    const currentIndex = order.indexOf(current);
    const nextIndex = order.indexOf(next);

    return nextIndex === currentIndex + 1;
  }
}