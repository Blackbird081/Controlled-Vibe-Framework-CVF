import { describe, expect, it } from "vitest";
import type {
  DscpDomainProfile,
  DscpMetadataRequirement,
} from "../src/dscp.domain.profile.contract";
import { buildDscpMetadataRequirementBridge } from "../src/dscp.metadata.requirement.bridge";

function profile(
  metadataRequirements?: readonly DscpMetadataRequirement[],
): DscpDomainProfile {
  return {
    domainProfileId: "generic.profile",
    domainFamily: "technical_project",
    languageCodes: ["en"],
    commonFacetFields: {},
    domainFacetFields: {},
    domainGateKeys: [],
    boundaryRules: {},
    defaultMetadata: {},
    metadataRequirements,
  };
}

const requirements: readonly DscpMetadataRequirement[] = [
  {
    requirementId: "generic.version",
    ownerProfileId: "generic.profile",
    metadataKey: "version",
    required: true,
    acceptableEvidenceBases: ["OPERATOR_SUPPLIED", "SOURCE_EMBEDDED"],
  },
  {
    requirementId: "generic.runtime",
    ownerProfileId: "generic.profile",
    metadataKey: "runtime",
    required: false,
    acceptableEvidenceBases: ["NONE", "DERIVED_HINT"],
  },
];

describe("MEOR-T3 DSCP metadata requirement bridge", () => {
  it("returns an empty valid bridge when requirements are omitted", () => {
    expect(buildDscpMetadataRequirementBridge(profile())).toEqual({
      valid: true,
      profileId: "generic.profile",
      requirements: [],
      requirementOwnerMap: {},
    });
  });

  it("normalizes declarations and produces a deterministic owner map", () => {
    const result = buildDscpMetadataRequirementBridge(profile(requirements));

    expect(result.valid).toBe(true);
    expect(result.requirements.map((item) => item.requirementId)).toEqual([
      "generic.runtime",
      "generic.version",
    ]);
    expect(result.requirements[1]?.acceptableEvidenceBases).toEqual([
      "SOURCE_EMBEDDED",
      "OPERATOR_SUPPLIED",
    ]);
    expect(result.requirementOwnerMap).toEqual({
      "generic.runtime": "generic.profile",
      "generic.version": "generic.profile",
    });
  });

  it("does not mutate profile declarations", () => {
    const input = profile(requirements);
    const before = structuredClone(input);

    const result = buildDscpMetadataRequirementBridge(input);

    expect(input).toEqual(before);
    expect(result.requirements).not.toBe(input.metadataRequirements);
    expect(Object.isFrozen(result.requirements)).toBe(true);
    expect(Object.isFrozen(result.requirementOwnerMap)).toBe(true);
  });

  it.each([
    ["", "INVALID_PROFILE_ID"],
    [" ", "INVALID_PROFILE_ID"],
  ])("rejects empty profile ID '%s'", (domainProfileId, failureToken) => {
    const input = { ...profile(), domainProfileId };
    expect(buildDscpMetadataRequirementBridge(input).failureToken).toBe(
      failureToken,
    );
  });

  it("rejects an empty requirement ID", () => {
    const input = profile([{ ...requirements[0]!, requirementId: "" }]);
    expect(buildDscpMetadataRequirementBridge(input).failureToken).toBe(
      "INVALID_REQUIREMENT_ID",
    );
  });

  it("rejects an empty metadata key", () => {
    const input = profile([{ ...requirements[0]!, metadataKey: " " }]);
    expect(buildDscpMetadataRequirementBridge(input).failureToken).toBe(
      "INVALID_METADATA_KEY",
    );
  });

  it("rejects an owner profile mismatch", () => {
    const input = profile([
      { ...requirements[0]!, ownerProfileId: "another.profile" },
    ]);
    expect(buildDscpMetadataRequirementBridge(input).failureToken).toBe(
      "OWNER_PROFILE_MISMATCH",
    );
  });

  it("rejects duplicate requirement IDs", () => {
    const input = profile([requirements[0]!, { ...requirements[0]! }]);
    expect(buildDscpMetadataRequirementBridge(input).failureToken).toBe(
      "DUPLICATE_REQUIREMENT_ID",
    );
  });

  it("rejects an empty acceptable evidence list", () => {
    const input = profile([
      { ...requirements[0]!, acceptableEvidenceBases: [] },
    ]);
    expect(buildDscpMetadataRequirementBridge(input).failureToken).toBe(
      "EMPTY_ACCEPTABLE_EVIDENCE",
    );
  });

  it("rejects an unsupported evidence basis at runtime", () => {
    const input = profile([
      {
        ...requirements[0]!,
        acceptableEvidenceBases: ["SOURCE_EMBEDDED", "UNVERIFIED"],
      } as unknown as DscpMetadataRequirement,
    ]);
    expect(buildDscpMetadataRequirementBridge(input).failureToken).toBe(
      "INVALID_EVIDENCE_BASIS",
    );
  });

  it("rejects a non-boolean required flag at runtime", () => {
    const input = profile([
      {
        ...requirements[0]!,
        required: "yes",
      } as unknown as DscpMetadataRequirement,
    ]);
    expect(buildDscpMetadataRequirementBridge(input).failureToken).toBe(
      "INVALID_REQUIRED_FLAG",
    );
  });
});
