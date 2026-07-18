import { describe, it, expect } from "vitest";
import type { DscpDomainProfile } from "../src/dscp.domain.profile.contract";
import { applyDomainProfileToDescriptorInput } from "../src/dscp.domain.profile.contract";
import type { GovernedArtifactDescriptorInput } from "../src/dscp.governed.artifact.descriptor";

// --- DSCP-T10 Domain Profile Contract Tests ---
// Tranche: DSCP-T10
// Authorization: docs/baselines/CVF_GC018_DSCP_T10_DOMAIN_PROFILE_AND_SCAN_ADAPTER_CONTRACT_2026-06-10.md

// Shared base descriptor input for reuse across tests.
function makeBaseInput(
  artifactId = "TEST-001",
  overrides: Partial<GovernedArtifactDescriptorInput> = {},
): GovernedArtifactDescriptorInput {
  return {
    artifactId,
    sourceHash: "a".repeat(64),
    artifactRole: "corpus_candidate",
    contentClass: "source_document",
    governanceGates: {
      freshnessGate: "PASS",
      classificationGate: "PASS",
      eligibilityGate: "YES",
    },
    metadata: {},
    ...overrides,
  };
}

// --- Profile fixtures ---

// Fixture 1: PolicyLocal Vietnamese legal-policy profile.
// Language code includes "vi"; legal/policy fields are profile-owned, not global.
const legalPolicyProfile: DscpDomainProfile = {
  domainProfileId: "policylocal-vi-legal-policy-v1",
  domainFamily: "legal_policy",
  languageCodes: ["vi", "en"],
  commonFacetFields: {
    corpusType: "legal",
    sourceRegion: "Vietnam",
  },
  domainFacetFields: {
    jurisdiction: "VN",
    authorityLevel: "national",
    documentLanguage: "vi",
  },
  domainGateKeys: ["ec02Gate", "t12EligibilityGate"],
  boundaryRules: {
    ec02Gate: "PASS",
    t12EligibilityGate: "CONDITIONAL",
  },
  defaultMetadata: {
    domainVersion: "1.0",
    legalFramework: "Vietnamese administrative law",
  },
};

// Fixture 2: Company docs profile (business-unit / policy-owner metadata).
const companyDocsProfile: DscpDomainProfile = {
  domainProfileId: "company-docs-internal-v1",
  domainFamily: "company_docs",
  languageCodes: ["en"],
  commonFacetFields: {
    corpusType: "internal",
    accessLevel: "confidential",
  },
  domainFacetFields: {
    businessUnit: "engineering",
    policyOwner: "legal-ops",
    documentStatus: "approved",
  },
  domainGateKeys: ["internalGate", "complianceGate"],
  boundaryRules: {
    internalGate: "PASS",
    complianceGate: "PASS",
  },
  defaultMetadata: {
    retentionPolicy: "7y",
    classificationLabel: "internal-only",
  },
};

// Fixture 3: Technical/project docs profile (module/runtime/interface metadata).
const technicalProjectProfile: DscpDomainProfile = {
  domainProfileId: "technical-project-docs-v1",
  domainFamily: "technical_project",
  languageCodes: ["en"],
  commonFacetFields: {
    corpusType: "technical",
    artifactKind: "documentation",
  },
  domainFacetFields: {
    moduleId: "cvf-control-plane",
    runtimeVersion: "4.0.0",
    interfaceLayer: "L1",
  },
  domainGateKeys: ["stabilityGate", "breakingChangeGate"],
  boundaryRules: {
    stabilityGate: "PASS",
    breakingChangeGate: "PASS",
  },
  defaultMetadata: {
    reviewStatus: "approved",
    docType: "architecture",
  },
};

describe("DSCP-T10: DscpDomainProfile - legal_policy (PolicyLocal / Vietnamese)", () => {
  it("preserves all existing GovernedArtifactDescriptorInput fields", () => {
    const input = makeBaseInput("LP-001");
    const result = applyDomainProfileToDescriptorInput(legalPolicyProfile, input);
    expect(result.blocked).toBe(false);
    expect(result.enrichedInput).not.toBeNull();
    expect(result.enrichedInput!.artifactId).toBe("LP-001");
    expect(result.enrichedInput!.sourceHash).toBe("a".repeat(64));
    expect(result.enrichedInput!.artifactRole).toBe("corpus_candidate");
    expect(result.enrichedInput!.contentClass).toBe("source_document");
  });

  it("injects languageCodes including 'vi' into metadata", () => {
    const input = makeBaseInput("LP-002");
    const result = applyDomainProfileToDescriptorInput(legalPolicyProfile, input);
    expect(result.blocked).toBe(false);
    const meta = result.enrichedInput!.metadata!;
    expect(meta["languageCodes"]).toContain("vi");
  });

  it("injects legal/policy domain facet fields but does NOT promote them to global DSCP defaults", () => {
    const input = makeBaseInput("LP-003");
    const result = applyDomainProfileToDescriptorInput(legalPolicyProfile, input);
    expect(result.blocked).toBe(false);
    const meta = result.enrichedInput!.metadata!;
    // Profile-specific facet is present in the enriched result.
    expect(meta["jurisdiction"]).toBe("VN");
    expect(meta["authorityLevel"]).toBe("national");
    // domainFamily is recorded so routing is explicit.
    expect(meta["domainFamily"]).toBe("legal_policy");
    expect(meta["domainProfileId"]).toBe("policylocal-vi-legal-policy-v1");
  });

  it("copies only domainGateKeys into customGates", () => {
    const input = makeBaseInput("LP-004");
    const result = applyDomainProfileToDescriptorInput(legalPolicyProfile, input);
    expect(result.blocked).toBe(false);
    const customGates = result.enrichedInput!.governanceGates.customGates ?? {};
    expect(customGates["ec02Gate"]).toBe("PASS");
    expect(customGates["t12EligibilityGate"]).toBe("CONDITIONAL");
    expect(result.injectedGateKeys).toContain("ec02Gate");
    expect(result.injectedGateKeys).toContain("t12EligibilityGate");
  });

  it("caller-supplied metadata wins over profile defaultMetadata by default", () => {
    const input = makeBaseInput("LP-005", {
      metadata: { domainVersion: "caller-override" },
    });
    const result = applyDomainProfileToDescriptorInput(legalPolicyProfile, input);
    expect(result.blocked).toBe(false);
    expect(result.enrichedInput!.metadata!["domainVersion"]).toBe("caller-override");
  });

  it("profile defaultMetadata wins when overwriteCallerMetadata=true", () => {
    const input = makeBaseInput("LP-006", {
      metadata: { domainVersion: "caller-value" },
    });
    const result = applyDomainProfileToDescriptorInput(
      legalPolicyProfile,
      input,
      { overwriteCallerMetadata: true },
    );
    expect(result.blocked).toBe(false);
    expect(result.enrichedInput!.metadata!["domainVersion"]).toBe("1.0");
  });

  it("blocks when a boundary rule is BLOCKED_UNTIL_*", () => {
    const blockedProfile: DscpDomainProfile = {
      ...legalPolicyProfile,
      domainProfileId: "blocked-legal-v1",
      boundaryRules: {
        ec02Gate: "BLOCKED_UNTIL_2026-07-01",
      },
    };
    const input = makeBaseInput("LP-007");
    const result = applyDomainProfileToDescriptorInput(blockedProfile, input);
    expect(result.blocked).toBe(true);
    expect(result.enrichedInput).toBeNull();
    expect(result.blockReason).toMatch(/ec02Gate/);
    expect(result.blockReason).toMatch(/BLOCKED_UNTIL_2026-07-01/);
  });
});

describe("DSCP-T10: DscpDomainProfile - company_docs", () => {
  it("preserves existing fields and injects company-docs facets", () => {
    const input = makeBaseInput("CD-001");
    const result = applyDomainProfileToDescriptorInput(companyDocsProfile, input);
    expect(result.blocked).toBe(false);
    const meta = result.enrichedInput!.metadata!;
    expect(meta["businessUnit"]).toBe("engineering");
    expect(meta["policyOwner"]).toBe("legal-ops");
    expect(meta["domainFamily"]).toBe("company_docs");
  });

  it("injects only allowed company-docs gate keys", () => {
    const input = makeBaseInput("CD-002");
    const result = applyDomainProfileToDescriptorInput(companyDocsProfile, input);
    expect(result.blocked).toBe(false);
    const customGates = result.enrichedInput!.governanceGates.customGates ?? {};
    expect(customGates["internalGate"]).toBe("PASS");
    expect(customGates["complianceGate"]).toBe("PASS");
    // Legal-policy gate keys must NOT appear for company-docs profile.
    expect(customGates["ec02Gate"]).toBeUndefined();
    expect(customGates["t12EligibilityGate"]).toBeUndefined();
  });

  it("existing caller customGates are preserved and extended, not replaced", () => {
    const input = makeBaseInput("CD-003", {
      governanceGates: {
        freshnessGate: "PASS",
        classificationGate: "PASS",
        eligibilityGate: "YES",
        customGates: { priorGate: "PRIOR_VALUE" },
      },
    });
    const result = applyDomainProfileToDescriptorInput(companyDocsProfile, input);
    expect(result.blocked).toBe(false);
    const customGates = result.enrichedInput!.governanceGates.customGates ?? {};
    expect(customGates["priorGate"]).toBe("PRIOR_VALUE");
    expect(customGates["internalGate"]).toBe("PASS");
  });

  it("rejectedGateKeys is empty when all domainFacetFields gate-like keys are in domainGateKeys", () => {
    const input = makeBaseInput("CD-004");
    const result = applyDomainProfileToDescriptorInput(companyDocsProfile, input);
    // companyDocsProfile has no gate-like key outside domainGateKeys.
    expect(result.rejectedGateKeys).toHaveLength(0);
  });
});

describe("DSCP-T10: DscpDomainProfile - technical_project", () => {
  it("preserves existing fields and injects technical-project facets", () => {
    const input = makeBaseInput("TP-001");
    const result = applyDomainProfileToDescriptorInput(technicalProjectProfile, input);
    expect(result.blocked).toBe(false);
    const meta = result.enrichedInput!.metadata!;
    expect(meta["moduleId"]).toBe("cvf-control-plane");
    expect(meta["runtimeVersion"]).toBe("4.0.0");
    expect(meta["interfaceLayer"]).toBe("L1");
    expect(meta["domainFamily"]).toBe("technical_project");
  });

  it("injects only allowed technical-project gate keys", () => {
    const input = makeBaseInput("TP-002");
    const result = applyDomainProfileToDescriptorInput(technicalProjectProfile, input);
    expect(result.blocked).toBe(false);
    const customGates = result.enrichedInput!.governanceGates.customGates ?? {};
    expect(customGates["stabilityGate"]).toBe("PASS");
    expect(customGates["breakingChangeGate"]).toBe("PASS");
    // Legal/company-only gate keys must not bleed across profiles.
    expect(customGates["ec02Gate"]).toBeUndefined();
    expect(customGates["internalGate"]).toBeUndefined();
  });

  it("languageCodes defaults to 'en' for technical-project profile", () => {
    const input = makeBaseInput("TP-003");
    const result = applyDomainProfileToDescriptorInput(technicalProjectProfile, input);
    expect(result.blocked).toBe(false);
    expect(result.enrichedInput!.metadata!["languageCodes"]).toBe("en");
  });

  it("blocks when boundary rule is PROHIBITED", () => {
    const blockedProfile: DscpDomainProfile = {
      ...technicalProjectProfile,
      domainProfileId: "blocked-tech-v1",
      domainGateKeys: ["breakingChangeGate"],
      boundaryRules: {
        breakingChangeGate: "PROHIBITED",
      },
    };
    const input = makeBaseInput("TP-004");
    const result = applyDomainProfileToDescriptorInput(blockedProfile, input);
    expect(result.blocked).toBe(true);
    expect(result.enrichedInput).toBeNull();
    expect(result.blockReason).toMatch(/PROHIBITED/);
  });
});

describe("DSCP-T10: DscpDomainProfile - unknown gate key diagnostics", () => {
  it("surfaces gate-like domainFacetField not in domainGateKeys as rejectedGateKeys", () => {
    const profileWithOrphanGate: DscpDomainProfile = {
      ...legalPolicyProfile,
      domainProfileId: "orphan-gate-test-v1",
      domainFacetFields: {
        ...legalPolicyProfile.domainFacetFields,
        // orphanGate is a gate-like key NOT listed in domainGateKeys.
        orphanGate: "SOME_VALUE",
      },
      // domainGateKeys does NOT include orphanGate.
    };
    const input = makeBaseInput("GATE-001");
    const result = applyDomainProfileToDescriptorInput(profileWithOrphanGate, input);
    expect(result.blocked).toBe(false);
    expect(result.rejectedGateKeys).toContain("orphanGate");
    expect(result.diagnostics.some((d) => d.includes("orphanGate"))).toBe(true);
    // orphanGate must NOT appear in customGates.
    const customGates = result.enrichedInput!.governanceGates.customGates ?? {};
    expect(customGates["orphanGate"]).toBeUndefined();
  });

  it("injectedGateKeys reflects all domainGateKeys successfully injected", () => {
    const input = makeBaseInput("GATE-002");
    const result = applyDomainProfileToDescriptorInput(legalPolicyProfile, input);
    expect(result.blocked).toBe(false);
    expect(result.injectedGateKeys).toEqual(
      expect.arrayContaining(["ec02Gate", "t12EligibilityGate"]),
    );
  });

  it("surfaces allowed gate keys without values through an UNKNOWN diagnostic", () => {
    const profileWithMissingGateValue: DscpDomainProfile = {
      ...legalPolicyProfile,
      domainProfileId: "missing-gate-value-v1",
      domainGateKeys: ["ec02Gate", "missingGate"],
      boundaryRules: {
        ec02Gate: "PASS",
      },
    };
    const input = makeBaseInput("GATE-003");
    const result = applyDomainProfileToDescriptorInput(
      profileWithMissingGateValue,
      input,
    );
    expect(result.blocked).toBe(false);
    expect(result.injectedGateKeys).toContain("missingGate");
    expect(result.enrichedInput!.governanceGates.customGates!["missingGate"]).toBe(
      "UNKNOWN",
    );
    expect(result.diagnostics.some((d) => d.includes("missingGate"))).toBe(true);
  });
});

describe("EC-T3: DscpDomainProfile supportsDocumentStatus flag", () => {
  it("accepts supportsDocumentStatus true for legal-policy profiles", () => {
    const profile: DscpDomainProfile = {
      ...legalPolicyProfile,
      supportsDocumentStatus: true,
    };
    expect(profile.supportsDocumentStatus).toBe(true);
  });

  it("accepts supportsDocumentStatus false for non-regulatory profiles", () => {
    const profile: DscpDomainProfile = {
      ...companyDocsProfile,
      supportsDocumentStatus: false,
    };
    expect(profile.supportsDocumentStatus).toBe(false);
  });

  it("accepts omitted supportsDocumentStatus as undefined default false posture", () => {
    const profile: DscpDomainProfile = {
      ...technicalProjectProfile,
    };
    expect(profile.supportsDocumentStatus).toBeUndefined();
  });
});
