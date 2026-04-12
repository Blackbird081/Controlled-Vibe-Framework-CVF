import { describe, expect, it } from "vitest";

import { createWindowsCompatibilityConsumerPipelineContract } from "../src/index";

const FIXED_NOW = "2026-04-12T19:00:00.000Z";

describe("WindowsCompatibilityConsumerPipelineContract", () => {
  it("creates a review-ready pipeline result for a Windows-native skill", () => {
    const contract = createWindowsCompatibilityConsumerPipelineContract({
      now: () => FIXED_NOW,
    });

    const result = contract.execute({
      intakeValidation: {
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

    expect(result.createdAt).toBe(FIXED_NOW);
    expect(result.evaluationResult.classification).toBe("WINDOWS_NATIVE");
    expect(result.query).toContain("windows-compatibility:class:WINDOWS_NATIVE");
    expect(result.warnings).toEqual([]);
  });

  it("surfaces warnings for a rejected Windows target", () => {
    const contract = createWindowsCompatibilityConsumerPipelineContract({
      now: () => FIXED_NOW,
    });

    const result = contract.execute({
      intakeValidation: {
        stage: "external_intake_profile",
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
          source_ref: "skills/linux.skill.md",
          source_kind: "document_bundle",
          source_quality: "community_analysis",
          officially_verified: false,
          provenance_notes: "Linux draft.",
          candidate_asset_type: "W7SkillAsset",
          description_or_trigger: "Use shell execution.",
          instruction_body: "```bash\nls -la\n```",
          references: [],
          examples: [],
          tools: [],
          templates: [],
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

    expect(result.evaluationResult.classification).toBe(
      "REJECTED_FOR_WINDOWS_TARGET",
    );
    expect(result.warnings).toContain("MISSING_EXECUTION_ENVIRONMENT_DECLARATION");
    expect(result.warnings).toContain("WARNING_REJECTED_FOR_WINDOWS_TARGET");
  });
});
