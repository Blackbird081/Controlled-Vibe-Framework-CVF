import { describe, expect, it } from "vitest";

import {
  createWindowsCompatibilityEvaluationContract,
  type ExternalAssetIntakeValidationResult,
} from "../src/index";

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

describe("WindowsCompatibilityEvaluationContract", () => {
  it("classifies a fully aligned profile as WINDOWS_NATIVE", () => {
    const result = createWindowsCompatibilityEvaluationContract().evaluate({
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
      sandboxOverclaimPresent: false,
    });

    expect(result.classification).toBe("WINDOWS_NATIVE");
    expect(result.score).toBe(100);
    expect(result.blockers).toEqual([]);
  });

  it("rejects a shell-dependent skill that is missing execution-environment declaration", () => {
    const result = createWindowsCompatibilityEvaluationContract().evaluate({
      intakeValidation: {
        ...intakeBase,
        valid: false,
        issues: [
          {
            field: "execution_environment",
            code: "REQUIRED_WHEN",
            message:
              "execution_environment is required when candidate_asset_type is W7SkillAsset and executable code blocks are present.",
          },
        ],
        normalizedProfile: {
          ...intakeBase.normalizedProfile,
          execution_environment: undefined,
        },
      },
      governanceFitPassed: true,
      existingIntakePolicyPassed: true,
      commandsValidated: false,
      unsupportedOperatorsRemoved: false,
      exitCodeHandlingExplicit: false,
      deterministicExecution: false,
    });

    expect(result.classification).toBe("REJECTED_FOR_WINDOWS_TARGET");
    expect(result.blockers).toContain("MISSING_EXECUTION_ENVIRONMENT_DECLARATION");
    expect(result.blockers).toContain("WINDOWS_TARGET_MISMATCH");
  });

  it("marks a cross-platform profile as COMPATIBLE with caveat note", () => {
    const result = createWindowsCompatibilityEvaluationContract().evaluate({
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
      sandboxOverclaimPresent: false,
    });

    expect(result.classification).toBe("COMPATIBLE");
    expect(result.notes).toContain("CROSS_PLATFORM_CLAIM_REQUIRES_TARGET_VALIDATION");
  });

  it("requires refactor when governance gates pass but execution readiness is weak", () => {
    const result = createWindowsCompatibilityEvaluationContract().evaluate({
      intakeValidation: intakeBase,
      governanceFitPassed: true,
      existingIntakePolicyPassed: true,
      commandsValidated: false,
      unsupportedOperatorsRemoved: false,
      exitCodeHandlingExplicit: false,
      deterministicExecution: true,
      w7RecordsGeneratable: true,
      guardPolicyCompatible: true,
      noUnauthorizedAccessPath: true,
      scopeBoundedCommands: true,
      sandboxOverclaimPresent: false,
    });

    expect(result.classification).toBe("REQUIRES_REFACTOR");
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThan(70);
  });
});
