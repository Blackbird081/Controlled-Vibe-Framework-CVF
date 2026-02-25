import { DevAutomationInput, DevAutomationOutput, DevArtifact } from "./artifact.types";
import { RiskEngine } from "../../policy/risk.engine";
import { CostGuard } from "../../policy/cost.guard";
import { generateCodeArtifact } from "./code.generator";
import { assessRiskFromArtifact } from "./risk.scorer";
import { bindCostSnapshot } from "./cost.binding";

export interface DevSkillResult {
  artifact: DevArtifact;
  riskLevel: string;
  riskScore: number;
  costLevel: string;
  validationPassed: boolean;
  reasons: string[];
}

export class DevSkill {
  static async execute(
    input: DevAutomationInput,
    policyLimits: any,
    accumulatedUsage: any
  ): Promise<DevSkillResult> {
    // Step 1: Generate artifact
    const output: DevAutomationOutput = await generateCodeArtifact(input);

    const artifact = output.artifact;

    const reasons: string[] = [];

    // Step 2: Validate artifact integrity
    if (!artifact.fileChanges || artifact.fileChanges.length === 0) {
      throw new Error("Artifact contains no file changes");
    }

    if (artifact.metrics.filesGenerated !== artifact.fileChanges.length) {
      throw new Error("Mismatch between fileChanges and filesGenerated metric");
    }

    // Step 3: Risk assessment
    const riskInput = assessRiskFromArtifact(artifact);
    const riskResult = RiskEngine.assess(riskInput);

    // Step 4: Cost validation
    const costSnapshot = bindCostSnapshot(artifact);
    const costResult = CostGuard.validate({
      snapshot: costSnapshot,
      limits: policyLimits,
      accumulated: accumulatedUsage,
    });

    if (costResult.level === "LIMIT_EXCEEDED") {
      reasons.push(...costResult.reasons);
    }

    if (riskResult.level === "CRITICAL") {
      reasons.push("Critical risk detected");
    }

    const validationPassed =
      costResult.level !== "LIMIT_EXCEEDED";

    return {
      artifact,
      riskLevel: riskResult.level,
      riskScore: riskResult.score,
      costLevel: costResult.level,
      validationPassed,
      reasons,
    };
  }
}