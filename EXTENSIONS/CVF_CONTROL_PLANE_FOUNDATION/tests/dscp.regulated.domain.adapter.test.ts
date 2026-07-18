// MEOR-RDA-T2 focused tests
// Authorization: docs/baselines/CVF_GC018_MEOR_RDA_T2_DETERMINISTIC_ADAPTER_IMPLEMENTATION_2026-06-12.md

import { describe, expect, it } from "vitest";
import type { DscpDomainProfile } from "../src/control.plane.context.barrel";
import {
  REGULATED_DOMAIN_REQUIREMENT_MAPPINGS,
  buildDscpMetadataRequirementBridge,
  buildRegulatedDomainMetadataRequirements,
} from "../src/control.plane.context.barrel";

function makeProfile(
  id: string,
  supportsDocumentStatus?: boolean,
): DscpDomainProfile {
  return {
    domainProfileId: id,
    domainFamily: supportsDocumentStatus === true ? "legal_policy" : "technical_project",
    languageCodes: ["en"],
    commonFacetFields: {},
    domainFacetFields: {},
    domainGateKeys: [],
    boundaryRules: {},
    defaultMetadata: {},
    supportsDocumentStatus,
  };
}

describe("MEOR-RDA-T2 buildRegulatedDomainMetadataRequirements", () => {
  it("returns eligible=false with REGULATED_FIELD_ON_NON_REGULATORY_PROFILE for profile without supportsDocumentStatus", () => {
    const result = buildRegulatedDomainMetadataRequirements(
      makeProfile("technical_project.software_delivery"),
    );
    expect(result.eligible).toBe(false);
    expect(result.failureToken).toBe("REGULATED_FIELD_ON_NON_REGULATORY_PROFILE");
    expect(result.generatedRequirements).toHaveLength(0);
  });

  it("returns eligible=false for profile with supportsDocumentStatus=false", () => {
    const result = buildRegulatedDomainMetadataRequirements(
      makeProfile("company_docs.internal", false),
    );
    expect(result.eligible).toBe(false);
    expect(result.failureToken).toBe("REGULATED_FIELD_ON_NON_REGULATORY_PROFILE");
    expect(result.generatedRequirements).toHaveLength(0);
  });

  it("returns eligible=false with REGULATED_PROFILE_ID_EMPTY for empty profile ID", () => {
    const result = buildRegulatedDomainMetadataRequirements(
      makeProfile("   ", true),
    );
    expect(result.eligible).toBe(false);
    expect(result.failureToken).toBe("REGULATED_PROFILE_ID_EMPTY");
    expect(result.generatedRequirements).toHaveLength(0);
  });

  it("returns eligible=true with all four regulated requirements for a regulated profile", () => {
    const result = buildRegulatedDomainMetadataRequirements(
      makeProfile("legal_policy.vn_regulatory", true),
    );
    expect(result.eligible).toBe(true);
    expect(result.failureToken).toBeUndefined();
    expect(result.generatedRequirements).toHaveLength(4);
  });

  it("generates requirements owned by the calling profile, not a global owner", () => {
    const profileId = "legal_policy.vn_regulatory";
    const result = buildRegulatedDomainMetadataRequirements(
      makeProfile(profileId, true),
    );
    for (const req of result.generatedRequirements) {
      expect(req.ownerProfileId).toBe(profileId);
    }
  });

  it("generated requirements use only SOURCE_EMBEDDED and OPERATOR_SUPPLIED evidence bases", () => {
    const result = buildRegulatedDomainMetadataRequirements(
      makeProfile("legal_policy.vn_regulatory", true),
    );
    for (const req of result.generatedRequirements) {
      expect(req.acceptableEvidenceBases).toContain("SOURCE_EMBEDDED");
      expect(req.acceptableEvidenceBases).toContain("OPERATOR_SUPPLIED");
      expect(req.acceptableEvidenceBases).not.toContain("DERIVED_HINT");
      expect(req.acceptableEvidenceBases).not.toContain("NONE");
    }
  });

  it("generated requirements cover all four regulated concept keys", () => {
    const result = buildRegulatedDomainMetadataRequirements(
      makeProfile("legal_policy.vn_regulatory", true),
    );
    const keys = result.generatedRequirements.map((r) => r.metadataKey);
    expect(keys).toContain("documentStatus");
    expect(keys).toContain("promulgationDate");
    expect(keys).toContain("effectiveDate");
    expect(keys).toContain("jurisdiction");
  });

  it("generated requirements use requirement IDs matching the RDA-T1 mapping table", () => {
    const result = buildRegulatedDomainMetadataRequirements(
      makeProfile("legal_policy.vn_regulatory", true),
    );
    const ids = result.generatedRequirements.map((r) => r.requirementId);
    for (const mapping of REGULATED_DOMAIN_REQUIREMENT_MAPPINGS) {
      expect(ids).toContain(mapping.requirementId);
    }
  });

  it("generated requirements each have required=true", () => {
    const result = buildRegulatedDomainMetadataRequirements(
      makeProfile("legal_policy.vn_regulatory", true),
    );
    for (const req of result.generatedRequirements) {
      expect(req.required).toBe(true);
    }
  });

  it("two regulated profiles do not share generated requirement ownership", () => {
    const profileA = "legal_policy.vn_regulatory";
    const profileB = "legal_policy.us_regulatory";
    const resultA = buildRegulatedDomainMetadataRequirements(makeProfile(profileA, true));
    const resultB = buildRegulatedDomainMetadataRequirements(makeProfile(profileB, true));
    for (const req of resultA.generatedRequirements) {
      expect(req.ownerProfileId).toBe(profileA);
    }
    for (const req of resultB.generatedRequirements) {
      expect(req.ownerProfileId).toBe(profileB);
    }
  });

  it("non-regulatory profile requirement IDs do not appear in a regulated profile result", () => {
    const techResult = buildRegulatedDomainMetadataRequirements(
      makeProfile("technical_project.software_delivery"),
    );
    // Non-regulatory profile produces no requirements; confirm no bleed from regulated
    expect(techResult.generatedRequirements).toHaveLength(0);
    expect(techResult.eligible).toBe(false);
  });

  it("bridge validation passes when generated requirements are attached to the same profile", () => {
    const profileId = "legal_policy.vn_regulatory";
    const adapterResult = buildRegulatedDomainMetadataRequirements(
      makeProfile(profileId, true),
    );
    expect(adapterResult.eligible).toBe(true);

    // Attach generated requirements to a profile and run through bridge
    const profileWithRequirements: DscpDomainProfile = {
      ...makeProfile(profileId, true),
      metadataRequirements: adapterResult.generatedRequirements,
    };
    const bridgeResult = buildDscpMetadataRequirementBridge(profileWithRequirements);
    expect(bridgeResult.valid).toBe(true);
    expect(bridgeResult.requirements).toHaveLength(4);
  });

  it("bridge fails with OWNER_PROFILE_MISMATCH when regulated requirements are attached to a different profile", () => {
    const regulatedProfileId = "legal_policy.vn_regulatory";
    const foreignProfileId = "technical_project.software_delivery";

    const adapterResult = buildRegulatedDomainMetadataRequirements(
      makeProfile(regulatedProfileId, true),
    );
    expect(adapterResult.eligible).toBe(true);

    // Attach regulated requirements (owned by regulatedProfileId) to a different profile
    const foreignProfile: DscpDomainProfile = {
      ...makeProfile(foreignProfileId, true),
      metadataRequirements: adapterResult.generatedRequirements,
    };
    const bridgeResult = buildDscpMetadataRequirementBridge(foreignProfile);
    expect(bridgeResult.valid).toBe(false);
    expect(bridgeResult.failureToken).toBe("OWNER_PROFILE_MISMATCH");
  });

  it("REGULATED_DOMAIN_REQUIREMENT_MAPPINGS is frozen and contains exactly four entries", () => {
    expect(REGULATED_DOMAIN_REQUIREMENT_MAPPINGS).toHaveLength(4);
    expect(Object.isFrozen(REGULATED_DOMAIN_REQUIREMENT_MAPPINGS)).toBe(true);
  });

  it("result is frozen and generatedRequirements are frozen", () => {
    const result = buildRegulatedDomainMetadataRequirements(
      makeProfile("legal_policy.vn_regulatory", true),
    );
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.generatedRequirements)).toBe(true);
  });

  it("no runtime gate activation occurs; QUERY_CLASS_GATED is not written", () => {
    const result = buildRegulatedDomainMetadataRequirements(
      makeProfile("legal_policy.vn_regulatory", true),
    );
    // Requirement IDs and keys must not contain gate activation tokens
    for (const req of result.generatedRequirements) {
      expect(req.requirementId).not.toContain("QUERY_CLASS_GATED");
      expect(req.metadataKey).not.toContain("QUERY_CLASS_GATED");
    }
    // eligible result must not carry a failureToken
    expect(result.failureToken).toBeUndefined();
  });
});
