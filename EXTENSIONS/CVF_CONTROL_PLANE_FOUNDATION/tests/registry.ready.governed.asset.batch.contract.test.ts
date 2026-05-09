import { describe, expect, it } from "vitest";

import {
  createExternalAssetIntakeProfileContract,
  createRegistryReadyGovernedAssetBatchContract,
  createW7NormalizedAssetCandidateContract,
  type ExternalAssetIntakeProfile,
} from "../src/index";

function makeProfile(
  overrides: Partial<ExternalAssetIntakeProfile> = {},
): ExternalAssetIntakeProfile {
  return {
    source_ref: "assets/policy.md",
    source_kind: "document_bundle",
    source_quality: "internal_design_draft",
    officially_verified: false,
    provenance_notes: "Curated packet",
    candidate_asset_type: "W7PolicyAsset",
    description_or_trigger: "Apply policy boundary",
    instruction_body: "Separate hard policy from context guidance.",
    ...overrides,
  };
}

describe("RegistryReadyGovernedAssetBatchContract", () => {
  it("aggregates reviewed and approved governed asset preparation requests", () => {
    const intakeContract = createExternalAssetIntakeProfileContract();
    const compiler = createW7NormalizedAssetCandidateContract();

    const reviewed = compiler.compile({
      intakeValidation: intakeContract.validate(makeProfile()),
    });
    const approved = compiler.compile({
      intakeValidation: intakeContract.validate(
        makeProfile({
          source_ref: "assets/policy-approved.md",
        }),
      ),
    });

    const result = createRegistryReadyGovernedAssetBatchContract({
      now: () => "2026-04-12T17:00:00.000Z",
    }).batch([
      {
        requestId: "req-1",
        request: {
          compileResult: reviewed,
          governanceOwner: "cvf-governance",
          approvalState: "reviewed",
          riskLevel: "R1",
        },
      },
      {
        requestId: "req-2",
        request: {
          compileResult: approved,
          governanceOwner: "cvf-governance",
          approvalState: "approved",
          riskLevel: "R1",
          registryRefs: ["registry://policy/approved"],
        },
      },
    ]);

    expect(result.totalRequests).toBe(2);
    expect(result.validCount).toBe(2);
    expect(result.invalidCount).toBe(0);
    expect(result.approvedCount).toBe(1);
    expect(result.batchId).toHaveLength(32);
    expect(result.batchHash).toHaveLength(32);
  });
});
