/**
 * Gate Rules — v1.1.2 Hardening
 *
 * Defines mandatory governance checks
 * required before a phase can be approved.
 *
 * v1.1.2 changes (De_xuat_02):
 *   - Added GOVERNANCE_PIPELINE: deterministic fixed execution order.
 *     All runners MUST execute modules in this exact sequence.
 */

import { ArtifactRegistry } from "../phase_protocol/artifact.registry";
import { GateCheckResult } from "./gate.result";

/**
 * GOVERNANCE_PIPELINE — Canonical execution order for all governance modules.
 *
 * Enforcement: every runner MUST iterate this array in order — no reordering.
 * Rationale: different execution orders can produce inconsistent results,
 * undermining the deterministic guarantee of CVF governance.
 *
 *  1. artifact_integrity  — hash-based trust boundary check / fail-fast trust boundary
 *  2. state_enforcement   — state machine validity (cycles + dead-ends)
 *  3. diagram_validation  — diagram-state consistency
 *  4. structural_diff     — architecture drift detection
 *  5. scenario_simulator  — behavioral path simulation
 *  6. reports             — audit log + governance report generation
 */
export const GOVERNANCE_PIPELINE = [
  "artifact_integrity",
  "state_enforcement",
  "diagram_validation",
  "structural_diff",
  "scenario_simulator",
  "reports",
] as const;

export type GovernanceModule = (typeof GOVERNANCE_PIPELINE)[number];

export class GateRules {

  public static validateArtifacts(
    artifacts: ArtifactRegistry
  ): GateCheckResult[] {

    const checks: GateCheckResult[] = [];

    checks.push({
      rule: "feature_spec_exists",
      passed: artifacts.hasArtifact("feature.spec"),
      critical: true,
    });

    checks.push({
      rule: "state_machine_exists",
      passed: artifacts.hasArtifact("state.machine"),
      critical: true,
    });

    checks.push({
      rule: "state_diagram_exists",
      passed: artifacts.hasArtifact("state.diagram"),
    });

    checks.push({
      rule: "implementation_exists",
      passed: artifacts.hasArtifact("implementation"),
      critical: true,
    });

    checks.push({
      rule: "unit_tests_exist",
      passed: artifacts.hasArtifact("unit.tests"),
      critical: true,
    });

    checks.push({
      rule: "scenario_tests_exist",
      passed: artifacts.hasArtifact("scenario.tests"),
    });

    // v1.1.2: artifact integrity check (Trust Boundary — De_xuat_06)
    checks.push({
      rule: "artifact_hashes_verified",
      passed: artifacts.verifyAllHashes(),
      critical: true,
    });

    return checks;
  }

}
