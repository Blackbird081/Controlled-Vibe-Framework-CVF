/**
 * CVF Phase Governance Protocol — v1.1.2 Hardening
 *
 * Defines the deterministic lifecycle of a development phase.
 * This protocol ensures every component follows a verifiable
 * construction pipeline before entering the runtime system.
 *
 * v1.1.2 changes (De_xuat_07 — Capability Isolation):
 *   - PHASE_CAPABILITIES: maps each PhaseStage to allowed artifact operations.
 *   - canRegisterArtifact(): enforces phase boundary — rejects ops outside allowed set.
 *   - registerArtifact() now checks capability before delegating to registry.
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

// ─── Capability Isolation (De_xuat_07) ──────────────────────────────────────

/**
 * PHASE_CAPABILITIES
 *
 * Defines which artifact types an agent is ALLOWED to register in each PhaseStage.
 * Attempting to register an artifact not in the allowed set throws a CapabilityViolation.
 *
 * Rationale: prevents agents from injecting implementation artifacts during SPEC phase
 * (or vice versa), ensuring phase boundary integrity.
 */
export const PHASE_CAPABILITIES: Record<PhaseStage, string[]> = {
  SPEC: ["feature.spec"],
  STATE_MACHINE: ["state.machine"],
  STATE_DIAGRAM: ["state.diagram"],
  IMPLEMENTATION: ["implementation"],
  STATE_VALIDATION: ["state.validation.report"],
  UNIT_TESTING: ["unit.tests"],
  SCENARIO_SIMULATION: ["scenario.tests", "scenario.simulation.report"],
  PHASE_GATE: [],          // read-only phase — no new artifacts
  COMPLETE: [],            // terminal — no new artifacts
};

export class CapabilityViolationError extends Error {
  constructor(stage: PhaseStage, artifactType: string) {
    super(
      `[CapabilityViolation] Stage "${stage}" does not permit registering artifact type "${artifactType}". ` +
      `Allowed: [${(PHASE_CAPABILITIES[stage] ?? []).join(", ") || "none"}]`
    );
    this.name = "CapabilityViolationError";
  }
}

// ─── PhaseProtocol ───────────────────────────────────────────────────────────

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

  /**
   * registerArtifact — v1.1.2
   *
   * Enforces Capability Isolation before delegating to ArtifactRegistry.
   * @param type    Artifact type (must be in PHASE_CAPABILITIES[currentStage])
   * @param path    Filesystem path
   * @param content Optional raw content — passed to registry for SHA-256 hashing
   * @throws CapabilityViolationError if artifact type not allowed in current stage
   */
  public registerArtifact(type: string, path: string, content?: string): void {
    const currentStage = this.context.getStage();
    if (!this.canRegisterArtifact(currentStage, type)) {
      throw new CapabilityViolationError(currentStage, type);
    }
    this.artifacts.registerArtifact(type, path, content);
  }

  public getArtifacts() {
    return this.artifacts.getArtifacts();
  }

  public getArtifactRegistry(): ArtifactRegistry {
    return this.artifacts;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * canRegisterArtifact()
   *
   * Returns true if the given artifact type is in the capability list for the stage.
   * PHASE_GATE and COMPLETE stages have empty capability sets → always false.
   */
  private canRegisterArtifact(stage: PhaseStage, artifactType: string): boolean {
    const allowed = PHASE_CAPABILITIES[stage] ?? [];
    return allowed.includes(artifactType);
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