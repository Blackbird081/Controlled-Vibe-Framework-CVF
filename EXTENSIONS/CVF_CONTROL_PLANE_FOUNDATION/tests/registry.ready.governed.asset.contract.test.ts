import { describe, expect, it } from "vitest";

import {
  createExternalAssetIntakeProfileContract,
  createRegistryReadyGovernedAssetContract,
  createW7NormalizedAssetCandidateContract,
  type ExternalAssetIntakeProfile,
} from "../src/index";

function makeProfile(
  overrides: Partial<ExternalAssetIntakeProfile> = {},
): ExternalAssetIntakeProfile {
  return {
    source_ref: "assets/tool.md",
    source_kind: "document_bundle",
    source_quality: "internal_design_draft",
    officially_verified: false,
    provenance_notes: "Curated packet",
    candidate_asset_type: "W7ToolAsset",
    description_or_trigger: "Register tool binding",
    instruction_body: "Normalize the tool binding before governed promotion.",
    tools: ["mcp://tool-a"],
    ...overrides,
  };
}

describe("RegistryReadyGovernedAssetContract", () => {
  it("prepares a registry-ready governed asset from a valid normalized candidate", () => {
    const intake = createExternalAssetIntakeProfileContract().validate(
      makeProfile(),
    );
    const candidate = createW7NormalizedAssetCandidateContract().compile({
      intakeValidation: intake,
      domain: "tooling",
    });
    const result = createRegistryReadyGovernedAssetContract().prepare({
      compileResult: candidate,
      governanceOwner: "cvf-governance",
      approvalState: "reviewed",
      riskLevel: "R1",
      evaluationEnabled: true,
      registryRefs: ["registry://candidate/tool-a"],
    });

    expect(result.valid).toBe(true);
    expect(result.governedAsset).toEqual(
      expect.objectContaining({
        asset_type: "W7ToolAsset",
        governance: expect.objectContaining({
          owner: "cvf-governance",
          approval_state: "reviewed",
        }),
        risk_level: "R1",
      }),
    );
  });

  it("fails approved assets that omit registry refs", () => {
    const intake = createExternalAssetIntakeProfileContract().validate(
      makeProfile(),
    );
    const candidate = createW7NormalizedAssetCandidateContract().compile({
      intakeValidation: intake,
    });
    const result = createRegistryReadyGovernedAssetContract().prepare({
      compileResult: candidate,
      governanceOwner: "cvf-governance",
      approvalState: "approved",
      riskLevel: "R1",
      traceRequired: true,
      registryRefs: [],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        field: "registryRefs",
        code: "REQUIRED_WHEN",
      }),
    );
  });
});
