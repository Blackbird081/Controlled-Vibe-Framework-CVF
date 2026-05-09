import { describe, expect, it } from "vitest";

import {
  createWindowsCompatibilityEvaluationBatchContract,
  createWindowsCompatibilityEvaluationContract,
  type ExternalAssetIntakeValidationResult,
} from "../src/index";

const FIXED_NOW = "2026-04-12T18:30:00.000Z";

const intakeBase: ExternalAssetIntakeValidationResult = {
  stage: "external_intake_profile",
  valid: true,
  issues: [],
  normalizedProfile: {
    source_ref: "skills/windows.skill.md",
    source_kind: "document_bundle",
    source_quality: "internal_design_draft",
    officially_verified: false,
    provenance_notes: "Windows skill draft.",
    candidate_asset_type: "W7SkillAsset",
    description_or_trigger: "Use Windows-native execution.",
    instruction_body: "```powershell\nGet-ChildItem -Force\n```",
    references: [],
    examples: [],
    tools: [],
    templates: [],
    execution_environment: {
      os: "windows",
      shell: "powershell",
      shell_version: "5.1+",
      script_type: "ps1",
      compatibility: "native",
    },
  },
};

const evaluator = createWindowsCompatibilityEvaluationContract();

const nativeResult = evaluator.evaluate({
  intakeValidation: intakeBase,
  governanceFitPassed: true,
  existingIntakePolicyPassed: true,
  commandsValidated: true,
  unsupportedOperatorsRemoved: true,
  exitCodeHandlingExplicit: true,
  deterministicExecution: true,
  w7RecordsGeneratable: true,
  guardPolicyCompatible: true,
  noUnauthorizedAccessPath: true,
  scopeBoundedCommands: true,
});

const compatibleResult = evaluator.evaluate({
  intakeValidation: {
    ...intakeBase,
    normalizedProfile: {
      ...intakeBase.normalizedProfile,
      execution_environment: {
        os: "linux",
        shell: "powershell",
        shell_version: "7+",
        script_type: "ps1",
        compatibility: "cross-platform",
      },
    },
  },
  governanceFitPassed: true,
  existingIntakePolicyPassed: true,
  commandsValidated: true,
  unsupportedOperatorsRemoved: true,
  exitCodeHandlingExplicit: true,
  deterministicExecution: true,
  w7RecordsGeneratable: true,
  guardPolicyCompatible: true,
  noUnauthorizedAccessPath: true,
  scopeBoundedCommands: true,
});

describe("WindowsCompatibilityEvaluationBatchContract", () => {
  it("aggregates classification counts and average score", () => {
    const batch = createWindowsCompatibilityEvaluationBatchContract({
      now: () => FIXED_NOW,
    }).batch([nativeResult, compatibleResult]);

    expect(batch.totalResults).toBe(2);
    expect(batch.classificationCounts.WINDOWS_NATIVE).toBe(1);
    expect(batch.classificationCounts.COMPATIBLE).toBe(1);
    expect(batch.averageScore).toBeGreaterThan(0);
    expect(batch.createdAt).toBe(FIXED_NOW);
    expect(batch.dominantClassification).toBe("WINDOWS_NATIVE");
  });
});
