import { describe, expect, it } from "vitest";

import {
  createExternalAssetIntakeProfileContract,
  createW7NormalizedAssetCandidateContract,
  type ExternalAssetIntakeProfile,
  type W7PalaceVocabulary,
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

// ─── W72-T6: Palace vocabulary enrichment ────────────────────────────────────

function makeValidIntake() {
  return createExternalAssetIntakeProfileContract().validate(makeProfile());
}

describe("W7NormalizedAssetCandidateEnrichment — palace vocabulary fields (W72-T6)", () => {
  it("wing is carried through when provided", () => {
    const result = createW7NormalizedAssetCandidateContract().compile({
      intakeValidation: makeValidIntake(),
      palaceVocabulary: { wing: "knowledge-wing" },
    });
    expect(result.valid).toBe(true);
    expect(result.normalizedCandidate?.enrichment.wing).toBe("knowledge-wing");
  });

  it("hall is carried through when provided", () => {
    const result = createW7NormalizedAssetCandidateContract().compile({
      intakeValidation: makeValidIntake(),
      palaceVocabulary: { hall: "compilation-hall" },
    });
    expect(result.normalizedCandidate?.enrichment.hall).toBe("compilation-hall");
  });

  it("room is carried through when provided", () => {
    const result = createW7NormalizedAssetCandidateContract().compile({
      intakeValidation: makeValidIntake(),
      palaceVocabulary: { room: "artifact-room" },
    });
    expect(result.normalizedCandidate?.enrichment.room).toBe("artifact-room");
  });

  it("drawer is carried through when provided", () => {
    const result = createW7NormalizedAssetCandidateContract().compile({
      intakeValidation: makeValidIntake(),
      palaceVocabulary: { drawer: "concept-drawer" },
    });
    expect(result.normalizedCandidate?.enrichment.drawer).toBe("concept-drawer");
  });

  it("closet_summary is carried through when provided", () => {
    const result = createW7NormalizedAssetCandidateContract().compile({
      intakeValidation: makeValidIntake(),
      palaceVocabulary: { closet_summary: "Summary of closet items." },
    });
    expect(result.normalizedCandidate?.enrichment.closet_summary).toBe(
      "Summary of closet items.",
    );
  });

  it("tunnel_links are carried through when provided", () => {
    const result = createW7NormalizedAssetCandidateContract().compile({
      intakeValidation: makeValidIntake(),
      palaceVocabulary: { tunnel_links: ["room:ctx-a", "room:ctx-b"] },
    });
    expect(result.normalizedCandidate?.enrichment.tunnel_links).toEqual([
      "room:ctx-a",
      "room:ctx-b",
    ]);
  });

  it("contradiction_flag is carried through when true", () => {
    const result = createW7NormalizedAssetCandidateContract().compile({
      intakeValidation: makeValidIntake(),
      palaceVocabulary: { contradiction_flag: true },
    });
    expect(result.normalizedCandidate?.enrichment.contradiction_flag).toBe(true);
  });

  it("palace fields are absent when palaceVocabulary not provided", () => {
    const result = createW7NormalizedAssetCandidateContract().compile({
      intakeValidation: makeValidIntake(),
    });
    expect(result.normalizedCandidate?.enrichment.wing).toBeUndefined();
    expect(result.normalizedCandidate?.enrichment.hall).toBeUndefined();
    expect(result.normalizedCandidate?.enrichment.room).toBeUndefined();
    expect(result.normalizedCandidate?.enrichment.drawer).toBeUndefined();
    expect(result.normalizedCandidate?.enrichment.closet_summary).toBeUndefined();
    expect(result.normalizedCandidate?.enrichment.tunnel_links).toBeUndefined();
    expect(result.normalizedCandidate?.enrichment.contradiction_flag).toBeUndefined();
  });
});
