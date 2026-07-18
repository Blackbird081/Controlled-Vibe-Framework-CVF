import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type {
  DscpDomainFamily,
  DscpDomainProfile,
  DscpMetadataRequirement,
} from "../src/dscp.domain.profile.contract";
import { buildDscpMetadataRequirementBridge } from "../src/dscp.metadata.requirement.bridge";

interface FixtureProfile {
  domainProfileId: string;
  domainFamily: DscpDomainFamily;
  requirements: DscpMetadataRequirement[];
}

interface ConformanceFixture {
  fixtureVersion: string;
  contractVersion: string;
  profiles: FixtureProfile[];
  cases: unknown[];
}

const fixturePath = resolve(
  process.cwd(),
  "../../docs/reference/CVF_MEOR_T4_CROSS_DOMAIN_CONFORMANCE_FIXTURES_2026-06-12.json",
);
const fixture = JSON.parse(
  readFileSync(fixturePath, "utf8"),
) as ConformanceFixture;

function toProfile(input: FixtureProfile): DscpDomainProfile {
  return {
    domainProfileId: input.domainProfileId,
    domainFamily: input.domainFamily,
    languageCodes: ["en"],
    commonFacetFields: {},
    domainFacetFields: {},
    domainGateKeys: [],
    boundaryRules: {},
    defaultMetadata: {},
    metadataRequirements: input.requirements,
  };
}

describe("MEOR-T4 cross-domain DSCP conformance", () => {
  it("loads the canonical T1 contract fixture", () => {
    expect(fixture.fixtureVersion).toBe(
      "cvf.meorCrossDomainConformance.t4.v1",
    );
    expect(fixture.contractVersion).toBe(
      "cvf.metadataEvidenceResolution.meor.t1.v1",
    );
    expect(fixture.profiles).toHaveLength(2);
    expect(fixture.cases).toHaveLength(4);
  });

  it("keeps legal and technical requirement sets disjoint", () => {
    const results = Object.fromEntries(
      fixture.profiles.map((profile) => [
        profile.domainFamily,
        buildDscpMetadataRequirementBridge(toProfile(profile)),
      ]),
    );
    const legalIds = results.legal_policy.requirements.map(
      (item) => item.requirementId,
    );
    const technicalIds = results.technical_project.requirements.map(
      (item) => item.requirementId,
    );

    expect(results.legal_policy.valid).toBe(true);
    expect(results.technical_project.valid).toBe(true);
    expect(legalIds).toEqual([
      "legal_policy.current_status",
      "legal_policy.jurisdiction",
    ]);
    expect(technicalIds).toEqual([
      "technical_project.repository_ref",
      "technical_project.target_runtime",
    ]);
    expect(legalIds.some((id) => id.startsWith("technical_project."))).toBe(
      false,
    );
    expect(technicalIds.some((id) => id.startsWith("legal_policy."))).toBe(
      false,
    );
  });

  it("rejects a requirement injected into another owner profile", () => {
    const [legal, technical] = fixture.profiles;
    const injected = toProfile({
      ...technical!,
      requirements: [
        ...technical!.requirements,
        { ...legal!.requirements[0]!, ownerProfileId: legal!.domainProfileId },
      ],
    });

    expect(buildDscpMetadataRequirementBridge(injected).failureToken).toBe(
      "OWNER_PROFILE_MISMATCH",
    );
  });

  it("contains only synthetic, bounded fixture references", () => {
    const serialized = JSON.stringify(fixture).toLowerCase();

    expect(serialized).not.toContain("policy_local");
    expect(serialized).not.toContain("cand-");
    expect(serialized).not.toContain("raw:");
    expect(serialized).not.toContain("ocr:");
    expect(serialized).not.toContain("content:");
  });
});
