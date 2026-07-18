// MEOR-RDA-T3 focused cross-domain conformance tests
// Authorization: docs/baselines/CVF_GC018_MEOR_RDA_T3_CROSS_DOMAIN_CONFORMANCE_2026-06-12.md

import { describe, expect, it } from "vitest";
import type {
  DscpDomainFamily,
  DscpDomainProfile,
} from "../src/control.plane.context.barrel";
import {
  REGULATED_DOMAIN_REQUIREMENT_MAPPINGS,
  buildDscpMetadataRequirementBridge,
  buildRegulatedDomainMetadataRequirements,
} from "../src/control.plane.context.barrel";

function makeProfile(
  domainFamily: DscpDomainFamily,
  supportsDocumentStatus?: boolean,
): DscpDomainProfile {
  return {
    domainProfileId: `${domainFamily}.synthetic`,
    domainFamily,
    languageCodes: ["en"],
    commonFacetFields: {},
    domainFacetFields: {},
    domainGateKeys: [],
    boundaryRules: {},
    defaultMetadata: {},
    supportsDocumentStatus,
  };
}

describe("MEOR-RDA-T3 regulated-domain cross-domain conformance", () => {
  it("generates exactly the four regulated requirements for an explicit legal-policy lifecycle profile", () => {
    const profile = makeProfile("legal_policy", true);
    const result = buildRegulatedDomainMetadataRequirements(profile);

    expect(result.eligible).toBe(true);
    expect(result.failureToken).toBeUndefined();
    expect(result.generatedRequirements).toHaveLength(4);

    const expectedKeys = REGULATED_DOMAIN_REQUIREMENT_MAPPINGS.map(
      (mapping) => mapping.metadataKey,
    ).sort();
    const actualKeys = result.generatedRequirements
      .map((requirement) => requirement.metadataKey)
      .sort();

    expect(actualKeys).toEqual(expectedKeys);
    expect(actualKeys).toEqual([
      "documentStatus",
      "effectiveDate",
      "jurisdiction",
      "promulgationDate",
    ]);
  });

  it.each([
    "company_docs",
    "technical_project",
    "governance_docs",
    "mixed_corpus",
  ] as const)(
    "does not generate regulated lifecycle requirements for %s by default",
    (domainFamily) => {
      const result = buildRegulatedDomainMetadataRequirements(
        makeProfile(domainFamily),
      );

      expect(result.eligible).toBe(false);
      expect(result.failureToken).toBe(
        "REGULATED_FIELD_ON_NON_REGULATORY_PROFILE",
      );
      expect(result.generatedRequirements).toHaveLength(0);
    },
  );

  it("does not generate regulated lifecycle requirements for legal-policy without the explicit support flag", () => {
    const result = buildRegulatedDomainMetadataRequirements(
      makeProfile("legal_policy"),
    );

    expect(result.eligible).toBe(false);
    expect(result.failureToken).toBe(
      "REGULATED_FIELD_ON_NON_REGULATORY_PROFILE",
    );
    expect(result.generatedRequirements).toHaveLength(0);
  });

  it("fails closed when legal-policy regulated requirements are attached to a foreign profile", () => {
    const legalProfile = makeProfile("legal_policy", true);
    const adapterResult = buildRegulatedDomainMetadataRequirements(legalProfile);
    expect(adapterResult.eligible).toBe(true);

    const foreignProfile: DscpDomainProfile = {
      ...makeProfile("technical_project"),
      metadataRequirements: adapterResult.generatedRequirements,
    };
    const bridgeResult = buildDscpMetadataRequirementBridge(foreignProfile);

    expect(bridgeResult.valid).toBe(false);
    expect(bridgeResult.failureToken).toBe("OWNER_PROFILE_MISMATCH");
    expect(bridgeResult.requirements).toHaveLength(0);
  });

  it("keeps regulated requirement ownership profile-scoped across two legal-policy profiles", () => {
    const profileA: DscpDomainProfile = {
      ...makeProfile("legal_policy", true),
      domainProfileId: "legal_policy.synthetic_a",
    };
    const profileB: DscpDomainProfile = {
      ...makeProfile("legal_policy", true),
      domainProfileId: "legal_policy.synthetic_b",
    };

    const resultA = buildRegulatedDomainMetadataRequirements(profileA);
    const resultB = buildRegulatedDomainMetadataRequirements(profileB);

    for (const requirement of resultA.generatedRequirements) {
      expect(requirement.ownerProfileId).toBe(profileA.domainProfileId);
      expect(requirement.ownerProfileId).not.toBe(profileB.domainProfileId);
    }
    for (const requirement of resultB.generatedRequirements) {
      expect(requirement.ownerProfileId).toBe(profileB.domainProfileId);
      expect(requirement.ownerProfileId).not.toBe(profileA.domainProfileId);
    }
  });
});
