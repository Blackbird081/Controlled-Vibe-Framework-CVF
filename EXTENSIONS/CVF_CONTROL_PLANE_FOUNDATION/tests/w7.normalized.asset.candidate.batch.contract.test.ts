import { describe, expect, it } from "vitest";

import {
  createExternalAssetIntakeProfileContract,
  createW7NormalizedAssetCandidateBatchContract,
  type ExternalAssetIntakeProfile,
} from "../src/index";

function makeProfile(
  overrides: Partial<ExternalAssetIntakeProfile> = {},
): ExternalAssetIntakeProfile {
  return {
    source_ref: "assets/command.md",
    source_kind: "document_bundle",
    source_quality: "internal_design_draft",
    officially_verified: false,
    provenance_notes: "Curated packet",
    candidate_asset_type: "W7CommandAsset",
    description_or_trigger: "Create asset candidate",
    instruction_body: "Normalize command materials",
    ...overrides,
  };
}

describe("W7NormalizedAssetCandidateBatchContract", () => {
  it("aggregates valid and invalid compile requests", () => {
    const intakeContract = createExternalAssetIntakeProfileContract();
    const result = createW7NormalizedAssetCandidateBatchContract({
      now: () => "2026-04-12T16:00:00.000Z",
    }).batch([
      {
        requestId: "req-1",
        request: {
          intakeValidation: intakeContract.validate(makeProfile()),
        },
      },
      {
        requestId: "req-2",
        request: {
          intakeValidation: intakeContract.validate(
            makeProfile({
              description_or_trigger: "",
            }),
          ),
        },
      },
    ]);

    expect(result.totalRequests).toBe(2);
    expect(result.validCount).toBe(1);
    expect(result.invalidCount).toBe(1);
    expect(result.generatedCandidateCount).toBe(1);
    expect(result.batchId).toHaveLength(32);
    expect(result.batchHash).toHaveLength(32);
  });
});
