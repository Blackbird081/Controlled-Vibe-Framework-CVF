import { describe, expect, it } from "vitest";

import {
  createExternalAssetIntakeProfileContract,
  type ExternalAssetIntakeProfile,
} from "../src/index";

function makeProfile(
  overrides: Partial<ExternalAssetIntakeProfile> = {},
): ExternalAssetIntakeProfile {
  return {
    source_ref: "docs/source.md",
    source_kind: "document_bundle",
    source_quality: "internal_design_draft",
    officially_verified: false,
    provenance_notes: "Promoted from bounded design intake.",
    candidate_asset_type: "W7SkillAsset",
    description_or_trigger: "Normalize external prompts into W7 candidate form.",
    instruction_body: "Use bounded intake, then normalize before registry review.",
    references: [" docs/reference/a.md ", "docs/reference/a.md"],
    examples: [" example-1 "],
    tools: [],
    templates: [" template-1 "],
    ...overrides,
  };
}

describe("ExternalAssetIntakeProfileContract", () => {
  it("normalizes additive intake fields and preserves a valid non-tool candidate", () => {
    const contract = createExternalAssetIntakeProfileContract();
    const result = contract.validate(makeProfile());

    expect(result.valid).toBe(true);
    expect(result.normalizedProfile.references).toEqual(["docs/reference/a.md"]);
    expect(result.normalizedProfile.examples).toEqual(["example-1"]);
    expect(result.normalizedProfile.templates).toEqual(["template-1"]);
  });

  it("requires execution_environment for W7SkillAsset intake with executable code blocks", () => {
    const contract = createExternalAssetIntakeProfileContract();
    const result = contract.validate(
      makeProfile({
        instruction_body:
          "Normalize this skill.\n```powershell\nGet-ChildItem -Force\n```",
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        field: "execution_environment",
        code: "REQUIRED_WHEN",
      }),
    );
  });

  it("accepts declared execution_environment and normalizes shell_version", () => {
    const contract = createExternalAssetIntakeProfileContract();
    const result = contract.validate(
      makeProfile({
        instruction_body:
          "Normalize this skill.\n```powershell\nGet-ChildItem -Force\n```",
        execution_environment: {
          os: "windows",
          shell: "powershell",
          shell_version: " 5.1+ ",
          script_type: "ps1",
          compatibility: "native",
        },
      }),
    );

    expect(result.valid).toBe(true);
    expect(result.normalizedProfile.execution_environment).toEqual({
      os: "windows",
      shell: "powershell",
      shell_version: "5.1+",
      script_type: "ps1",
      compatibility: "native",
    });
  });

  it("requires tools when candidate_asset_type is W7ToolAsset", () => {
    const contract = createExternalAssetIntakeProfileContract();
    const result = contract.validate(
      makeProfile({
        candidate_asset_type: "W7ToolAsset",
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        field: "tools",
        code: "REQUIRED_WHEN",
      }),
    );
  });

  it("rejects official_external when officially_verified is false", () => {
    const contract = createExternalAssetIntakeProfileContract();
    const result = contract.validate(
      makeProfile({
        source_quality: "official_external",
        officially_verified: false,
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        field: "officially_verified",
        code: "INVALID_COMBINATION",
      }),
    );
  });

  it("flags missing required text fields after normalization", () => {
    const contract = createExternalAssetIntakeProfileContract();
    const result = contract.validate(
      makeProfile({
        source_ref: "   ",
        provenance_notes: "",
        instruction_body: "  ",
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "source_ref", code: "REQUIRED" }),
        expect.objectContaining({
          field: "provenance_notes",
          code: "REQUIRED",
        }),
        expect.objectContaining({
          field: "instruction_body",
          code: "REQUIRED",
        }),
      ]),
    );
  });

  it("requires shell_version when execution_environment is declared", () => {
    const contract = createExternalAssetIntakeProfileContract();
    const result = contract.validate(
      makeProfile({
        execution_environment: {
          os: "windows",
          shell: "powershell",
          shell_version: "  ",
          script_type: "ps1",
          compatibility: "native",
        },
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        field: "execution_environment.shell_version",
        code: "REQUIRED",
      }),
    );
  });
});
