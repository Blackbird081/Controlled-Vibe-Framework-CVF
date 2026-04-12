import { describe, expect, it } from "vitest";

import { createExternalAssetIntakeConsumerPipelineContract } from "../src/index";

const FIXED_NOW = "2026-04-12T11:00:00.000Z";

describe("ExternalAssetIntakeConsumerPipelineContract", () => {
  it("packages a valid external asset intake profile into a consumer-pipeline result", () => {
    const contract = createExternalAssetIntakeConsumerPipelineContract({
      now: () => FIXED_NOW,
    });

    const result = contract.execute({
      profile: {
        source_ref: "docs/reference/CVF_W7_EXTERNAL_ASSET_INTAKE_PROFILE.md",
        source_kind: "document_bundle",
        source_quality: "internal_design_draft",
        officially_verified: false,
        provenance_notes: "Promoted from bounded design intake.",
        candidate_asset_type: "W7SkillAsset",
        description_or_trigger: "Normalize intake before registry.",
        instruction_body: "Use intake stage before governed registration.",
      },
    });

    expect(result.createdAt).toBe(FIXED_NOW);
    expect(result.validationResult.valid).toBe(true);
    expect(result.query).toContain("external-asset-intake:type:W7SkillAsset");
    expect(result.query).toContain("env:unspecified");
    expect(result.consumerPackage.pipelineHash.length).toBeGreaterThan(0);
    expect(result.warnings).toEqual([]);
  });

  it("surfaces validation warnings for invalid tool-asset intake", () => {
    const contract = createExternalAssetIntakeConsumerPipelineContract({
      now: () => FIXED_NOW,
    });

    const result = contract.execute({
      profile: {
        source_ref: "skills/tooling.md",
        source_kind: "document_bundle",
        source_quality: "community_analysis",
        officially_verified: false,
        provenance_notes: "Community-derived notes.",
        candidate_asset_type: "W7ToolAsset",
        description_or_trigger: "Tool binding candidate",
        instruction_body: "Compile into tool asset.",
      },
    });

    expect(result.validationResult.valid).toBe(false);
    expect(result.warnings).toContain("WARNING_REQUIRED_WHEN_TOOLS");
    expect(result.warnings).toContain("WARNING_EXTERNAL_ASSET_INTAKE_INVALID");
  });

  it("includes declared execution_environment in the query and validates executable skill input", () => {
    const contract = createExternalAssetIntakeConsumerPipelineContract({
      now: () => FIXED_NOW,
    });

    const result = contract.execute({
      profile: {
        source_ref: "skills/windows.skill.md",
        source_kind: "document_bundle",
        source_quality: "internal_design_draft",
        officially_verified: false,
        provenance_notes: "Windows skill normalization draft.",
        candidate_asset_type: "W7SkillAsset",
        description_or_trigger: "Use Windows-native file inspection.",
        instruction_body:
          "```powershell\nGet-ChildItem -Force\nif ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }\n```",
        execution_environment: {
          os: "windows",
          shell: "powershell",
          shell_version: "5.1+",
          script_type: "ps1",
          compatibility: "native",
        },
      },
    });

    expect(result.validationResult.valid).toBe(true);
    expect(result.query).toContain("env:windows:powershell");
  });
});
