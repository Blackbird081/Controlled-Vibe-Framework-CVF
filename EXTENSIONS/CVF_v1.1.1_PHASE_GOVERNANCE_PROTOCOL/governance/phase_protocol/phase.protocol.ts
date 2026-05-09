/**
 * CVF Phase Governance Protocol — v1.1.3 Governance Runtime Hardening
 *
 * Defines the deterministic lifecycle of a development phase.
 * This protocol ensures every component follows a verifiable
 * construction pipeline before entering the runtime system.
 *
 * v1.1.3 changes:
 *   - Added FAILURE states: REVIEW_FAILED, SPEC_CONFLICT, VALIDATION_FAILED
 *   - Replaced linear isValidTransition() with explicit VALID_TRANSITIONS map
 *   - Added RetryLimitExceededError with MAX_RETRY_COUNT = 3
 *   - Added recovery paths: failure → recovery target
 *   - PHASE_CAPABILITIES extended for failure states (read-only)
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
  | "COMPLETE"
  // v1.1.3: Failure states
  | "REVIEW_FAILED"
  | "SPEC_CONFLICT"
  | "VALIDATION_FAILED";

export interface PhaseProtocolConfig {
  componentName: string;
}

// ─── v1.1.3: Retry Limit ────────────────────────────────────────────────────

export const MAX_RETRY_COUNT = 3;

export class RetryLimitExceededError extends Error {
  constructor(from: PhaseStage, to: PhaseStage, count: number) {
    super(
      `[RetryLimitExceeded] Transition "${from}" → "${to}" has been attempted ${count} times ` +
      `(max: ${MAX_RETRY_COUNT}). Escalation to human required.`
    );
    this.name = "RetryLimitExceededError";
  }
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
  // v1.1.3: Failure states are read-only — no artifact production
  REVIEW_FAILED: [],
  SPEC_CONFLICT: [],
  VALIDATION_FAILED: [],
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

// ─── v1.1.3: Valid Transition Map ────────────────────────────────────────────

/**
 * VALID_TRANSITIONS
 *
 * Explicit map of all allowed state transitions.
 * Replaces linear index-based validation for full control.
 *
 * Forward path: SPEC → STATE_MACHINE → ... → PHASE_GATE → COMPLETE
 * Failure entries: PHASE_GATE → REVIEW_FAILED, STATE_VALIDATION → VALIDATION_FAILED, etc.
 * Recovery paths: REVIEW_FAILED → IMPLEMENTATION, SPEC_CONFLICT → SPEC, etc.
 */
export const VALID_TRANSITIONS: Record<PhaseStage, PhaseStage[]> = {
  SPEC: ["STATE_MACHINE", "SPEC_CONFLICT"],
  STATE_MACHINE: ["STATE_DIAGRAM"],
  STATE_DIAGRAM: ["IMPLEMENTATION"],
  IMPLEMENTATION: ["STATE_VALIDATION"],
  STATE_VALIDATION: ["UNIT_TESTING", "VALIDATION_FAILED"],
  UNIT_TESTING: ["SCENARIO_SIMULATION"],
  SCENARIO_SIMULATION: ["PHASE_GATE"],
  PHASE_GATE: ["COMPLETE", "REVIEW_FAILED"],
  COMPLETE: [],              // terminal — no outgoing transitions
  // Recovery paths from failure states
  REVIEW_FAILED: ["IMPLEMENTATION"],
  SPEC_CONFLICT: ["SPEC"],
  VALIDATION_FAILED: ["IMPLEMENTATION"],
};

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

    // v1.1.3: Check retry limit for recovery transitions
    const retryCount = this.context.getTransitionCount(current, nextStage);
    if (retryCount >= MAX_RETRY_COUNT) {
      throw new RetryLimitExceededError(current, nextStage, retryCount);
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

  /**
   * v1.1.3: Get full transition history from context for audit trail.
   */
  public getTransitionHistory() {
    return this.context.getTransitionHistory();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * canRegisterArtifact()
   *
   * Returns true if the given artifact type is in the capability list for the stage.
   * PHASE_GATE, COMPLETE, and failure stages have empty capability sets → always false.
   */
  private canRegisterArtifact(stage: PhaseStage, artifactType: string): boolean {
    const allowed = PHASE_CAPABILITIES[stage] ?? [];
    return allowed.includes(artifactType);
  }

  /**
   * isValidTransition — v1.1.3
   *
   * Uses explicit VALID_TRANSITIONS map instead of linear index.
   * Supports forward, failure, and recovery paths.
   */
  private isValidTransition(
    current: PhaseStage,
    next: PhaseStage
  ): boolean {
    const allowed = VALID_TRANSITIONS[current];
    if (!allowed) return false;
    return allowed.includes(next);
  }
}