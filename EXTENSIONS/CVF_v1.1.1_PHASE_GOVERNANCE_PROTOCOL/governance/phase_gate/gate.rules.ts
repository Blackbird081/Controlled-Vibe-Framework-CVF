/**
 * Gate Rules
 *
 * Defines mandatory governance checks
 * required before a phase can be approved.
 */

import { ArtifactRegistry } from "../phase_protocol/artifact.registry";
import { GateCheckResult } from "./gate.result";

export class GateRules {

  public static validateArtifacts(
    artifacts: ArtifactRegistry
  ): GateCheckResult[] {

    const checks: GateCheckResult[] = [];

    checks.push({
      rule: "feature_spec_exists",
      passed: artifacts.hasArtifact("feature.spec")
    });

    checks.push({
      rule: "state_machine_exists",
      passed: artifacts.hasArtifact("state.machine")
    });

    checks.push({
      rule: "state_diagram_exists",
      passed: artifacts.hasArtifact("state.diagram")
    });

    checks.push({
      rule: "implementation_exists",
      passed: artifacts.hasArtifact("implementation")
    });

    checks.push({
      rule: "unit_tests_exist",
      passed: artifacts.hasArtifact("unit.tests")
    });

    checks.push({
      rule: "scenario_tests_exist",
      passed: artifacts.hasArtifact("scenario.tests")
    });

    return checks;
  }

}