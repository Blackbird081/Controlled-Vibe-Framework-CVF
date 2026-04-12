import { describe, expect, it } from "vitest";

import {
  createExternalAssetIntakeProfileContract,
  createW7NormalizedAssetCandidateContract,
  type ExternalAssetIntakeProfile,
} from "../src/index";

function makeProfile(
  overrides: Partial<ExternalAssetIntakeProfile> = {},
): ExternalAssetIntakeProfile {
  return {
    source_ref: "skills/windows/review.md",
    source_kind: "document_bundle",
    source_quality: "internal_design_draft",
    officially_verified: false,
    provenance_notes: "Promoted from curated adding-new packet.",
    candidate_asset_type: "W7SkillAsset",
    description_or_trigger: "Review Windows skill normalization flow",
    instruction_body: "Normalize skill content before governed review.",
    references: ["docs/reference/a.md"],
    examples: [],
    tools: [],
    templates: [],
    ...overrides,
  };
}

describe("W7NormalizedAssetCandidateContract", () => {
  it("compiles a valid intake profile into a normalized candidate", () => {
    const intake = createExternalAssetIntakeProfileContract().validate(
      makeProfile({
        execution_environment: {
          os: "windows",
          shell: "powershell",
          shell_version: "7.5",
          script_type: "ps1",
          compatibility: "native",
        },
      }),
    );
    const result = createW7NormalizedAssetCandidateContract().compile({
      intakeValidation: intake,
      triggers: ["windows skill", "normalize skill"],
      domain: "skill_ops",
    });

    expect(result.valid).toBe(true);
    expect(result.normalizedCandidate).toEqual(
      expect.objectContaining({
        candidate_asset_type: "W7SkillAsset",
        source_ref: "skills/windows/review.md",
        normalized_header: expect.objectContaining({
          name: "Review",
          version_hint: "draft",
        }),
        routing_metadata: {
          triggers: ["windows skill", "normalize skill"],
          domain: "skill_ops",
          phase_hints: ["BUILD", "REVIEW", "RUN"],
        },
      }),
    );
    expect(
      result.normalizedCandidate?.enrichment.execution_environment?.shell,
    ).toBe("powershell");
  });

  it("fails when stage 1 intake validation is invalid", () => {
    const intake = createExternalAssetIntakeProfileContract().validate(
      makeProfile({
        instruction_body: "",
      }),
    );
    const result = createW7NormalizedAssetCandidateContract().compile({
      intakeValidation: intake,
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        field: "intakeValidation",
        code: "STAGE1_INVALID",
      }),
    );
  });
});
