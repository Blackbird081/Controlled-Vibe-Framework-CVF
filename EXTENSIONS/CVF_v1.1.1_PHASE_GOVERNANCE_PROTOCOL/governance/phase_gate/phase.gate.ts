/**
 * PhaseGate
 *
 * Enforces governance validation before a
 * development phase can be approved.
 */

import { ArtifactRegistry } from "../phase_protocol/artifact.registry";
import { GateRules } from "./gate.rules";
import {
  GateResult,
  createGateResult
} from "./gate.result";

export interface PhaseGateConfig {
  componentName: string;
}

export class PhaseGate {

  private component: string;
  private artifacts: ArtifactRegistry;

  constructor(
    config: PhaseGateConfig,
    artifacts: ArtifactRegistry
  ) {
    this.component = config.componentName;
    this.artifacts = artifacts;
  }

  public evaluate(): GateResult {

    const checks = [
      ...GateRules.validateArtifacts(this.artifacts)
    ];

    return createGateResult(
      this.component,
      checks
    );
  }

  public enforce(): void {

    const result = this.evaluate();

    if (result.status === "REJECTED") {

      const failed = result.checks
        .filter(c => !c.passed)
        .map(c => c.rule);

      throw new Error(
        `Phase gate rejected. Failed checks: ${failed.join(", ")}`
      );
    }

  }

}