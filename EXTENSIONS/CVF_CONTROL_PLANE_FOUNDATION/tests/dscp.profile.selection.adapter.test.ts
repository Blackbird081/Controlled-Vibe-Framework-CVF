import { describe, it, expect } from "vitest";
import { selectAndApplyDscpDomainProfile } from "../src/dscp.profile.selection.adapter";
import { createDscpDomainProfileRegistry } from "../src/dscp.domain.profile.registry";
import type { DscpDomainProfile } from "../src/dscp.domain.profile.contract";
import type { GovernedArtifactDescriptorInput } from "../src/dscp.governed.artifact.descriptor";

// --- DSCP-T11F Profile Selection Adapter Tests ---
// Tranche: DSCP-T11F
// Authorization: operator direction 2026-06-10
// Deterministic local harness only; no provider call, corpus ingestion, or external I/O.

// --- Profile fixtures ---

const legalPolicyProfile: DscpDomainProfile = {
  domainProfileId: "policylocal-vi-legal-policy-v1",
  domainFamily: "legal_policy",
  languageCodes: ["vi", "en"],
  commonFacetFields: { corpusType: "legal", sourceRegion: "Vietnam" },
  domainFacetFields: { jurisdiction: "VN", authorityLevel: "national" },
  domainGateKeys: ["ec02Gate", "t12EligibilityGate"],
  boundaryRules: { ec02Gate: "PASS", t12EligibilityGate: "CONDITIONAL" },
  defaultMetadata: { domainVersion: "1.0" },
};

const blockedLegalProfile: DscpDomainProfile = {
  domainProfileId: "legal-policy-blocked-v1",
  domainFamily: "legal_policy",
  languageCodes: ["vi"],
  commonFacetFields: { corpusType: "legal", sourceRegion: "Vietnam" },
  domainFacetFields: { jurisdiction: "VN" },
  domainGateKeys: ["ec02Gate"],
  boundaryRules: { ec02Gate: "BLOCKED_UNTIL_2026-07-01" },
  defaultMetadata: {},
};

const technicalProjectProfile: DscpDomainProfile = {
  domainProfileId: "technical-project-docs-v1",
  domainFamily: "technical_project",
  languageCodes: ["en"],
  commonFacetFields: { corpusType: "technical", artifactKind: "documentation" },
  domainFacetFields: { moduleId: "cvf-control-plane", runtimeVersion: "4.0.0" },
  domainGateKeys: ["stabilityGate", "breakingChangeGate"],
  boundaryRules: { stabilityGate: "PASS", breakingChangeGate: "PASS" },
  defaultMetadata: { reviewStatus: "approved" },
};

const companyDocsProfile: DscpDomainProfile = {
  domainProfileId: "company-docs-internal-v1",
  domainFamily: "company_docs",
  languageCodes: ["en"],
  commonFacetFields: { corpusType: "internal", accessLevel: "confidential" },
  domainFacetFields: { businessUnit: "engineering" },
  domainGateKeys: ["internalGate"],
  boundaryRules: { internalGate: "PASS" },
  defaultMetadata: { retentionPolicy: "7y" },
};

// Helper: minimal descriptor input.
function makeDescriptorInput(id: string): GovernedArtifactDescriptorInput {
  return {
    artifactId: id,
    sourceHash: `hash-${id}`,
    artifactRole: "corpus_candidate",
    contentClass: "source_document",
    governanceGates: {
      freshnessGate: "PASS",
      classificationGate: "PASS",
      eligibilityGate: "YES",
    },
    metadata: {},
  };
}

// --- Unique selection applies profile ---

describe("DSCP-T11F: selectAndApplyDscpDomainProfile - unique selection success", () => {
  it("selects legal-policy profile by unique criteria and applies metadata/gates", () => {
    const registry = createDscpDomainProfileRegistry([
      legalPolicyProfile,
      technicalProjectProfile,
      companyDocsProfile,
    ]);
    const result = selectAndApplyDscpDomainProfile({
      registry,
      criteria: { domainFamily: "legal_policy", languageCode: "vi" },
      descriptorInput: makeDescriptorInput("T11F-LP-001"),
    });
    expect(result.status).toBe("PROFILE_APPLIED");
    expect(result.selectedProfileId).toBe("policylocal-vi-legal-policy-v1");
    expect(result.matchCount).toBe(1);
    expect(result.enrichedDescriptorInput).not.toBeNull();
    const meta = result.enrichedDescriptorInput!.metadata!;
    expect(meta["domainFamily"]).toBe("legal_policy");
    expect(meta["jurisdiction"]).toBe("VN");
    expect(meta["languageCodes"]).toContain("vi");
    expect(result.enrichedDescriptorInput!.governanceGates.customGates?.["ec02Gate"]).toBe("PASS");
    expect(result.injectedGateKeys).toContain("ec02Gate");
  });

  it("selects technical-project profile and applies correct gates", () => {
    const registry = createDscpDomainProfileRegistry([
      legalPolicyProfile,
      technicalProjectProfile,
    ]);
    const result = selectAndApplyDscpDomainProfile({
      registry,
      criteria: { domainFamily: "technical_project" },
      descriptorInput: makeDescriptorInput("T11F-TP-001"),
    });
    expect(result.status).toBe("PROFILE_APPLIED");
    expect(result.selectedProfileId).toBe("technical-project-docs-v1");
    const gates = result.enrichedDescriptorInput!.governanceGates.customGates;
    expect(gates?.["stabilityGate"]).toBe("PASS");
    expect(gates?.["breakingChangeGate"]).toBe("PASS");
    expect(result.injectedGateKeys).toContain("stabilityGate");
    expect(result.injectedGateKeys).toContain("breakingChangeGate");
  });

  it("selects profile by exact domainProfileId", () => {
    const registry = createDscpDomainProfileRegistry([
      legalPolicyProfile,
      companyDocsProfile,
    ]);
    const result = selectAndApplyDscpDomainProfile({
      registry,
      criteria: { domainProfileId: "company-docs-internal-v1" },
      descriptorInput: makeDescriptorInput("T11F-CD-001"),
    });
    expect(result.status).toBe("PROFILE_APPLIED");
    expect(result.selectedProfileId).toBe("company-docs-internal-v1");
    expect(result.enrichedDescriptorInput!.metadata!["domainFamily"]).toBe("company_docs");
  });

  it("selects profile by requiredFacetKey in domainFacetFields", () => {
    const registry = createDscpDomainProfileRegistry([
      legalPolicyProfile,
      technicalProjectProfile,
    ]);
    // Only technicalProjectProfile has moduleId in domainFacetFields.
    const result = selectAndApplyDscpDomainProfile({
      registry,
      criteria: { requiredFacetKey: "moduleId" },
      descriptorInput: makeDescriptorInput("T11F-FK-001"),
    });
    expect(result.status).toBe("PROFILE_APPLIED");
    expect(result.selectedProfileId).toBe("technical-project-docs-v1");
  });
});

// --- No-match stop ---

describe("DSCP-T11F: selectAndApplyDscpDomainProfile - no-match stop", () => {
  it("returns PROFILE_SELECTION_NO_MATCH when no profiles match criteria", () => {
    const registry = createDscpDomainProfileRegistry([technicalProjectProfile]);
    const result = selectAndApplyDscpDomainProfile({
      registry,
      criteria: { domainFamily: "legal_policy" },
      descriptorInput: makeDescriptorInput("T11F-NM-001"),
    });
    expect(result.status).toBe("PROFILE_SELECTION_NO_MATCH");
    expect(result.selectedProfileId).toBeNull();
    expect(result.matchCount).toBe(0);
    expect(result.enrichedDescriptorInput).toBeNull();
    expect(result.injectedGateKeys).toHaveLength(0);
    expect(result.diagnostics.some((d) => d.includes("No profile matched"))).toBe(true);
  });

  it("returns PROFILE_SELECTION_NO_MATCH for unknown requiredFacetKey", () => {
    const registry = createDscpDomainProfileRegistry([legalPolicyProfile]);
    const result = selectAndApplyDscpDomainProfile({
      registry,
      criteria: { requiredFacetKey: "nonExistentKey" },
      descriptorInput: makeDescriptorInput("T11F-NM-002"),
    });
    expect(result.status).toBe("PROFILE_SELECTION_NO_MATCH");
    expect(result.enrichedDescriptorInput).toBeNull();
  });

  it("returns PROFILE_SELECTION_NO_MATCH on empty registry", () => {
    const registry = createDscpDomainProfileRegistry([]);
    const result = selectAndApplyDscpDomainProfile({
      registry,
      criteria: { domainFamily: "governance_docs" },
      descriptorInput: makeDescriptorInput("T11F-NM-003"),
    });
    expect(result.status).toBe("PROFILE_SELECTION_NO_MATCH");
    expect(result.matchCount).toBe(0);
    expect(result.enrichedDescriptorInput).toBeNull();
  });
});

// --- Ambiguous stop ---

describe("DSCP-T11F: selectAndApplyDscpDomainProfile - ambiguous stop", () => {
  it("returns PROFILE_SELECTION_AMBIGUOUS when multiple profiles match", () => {
    const secondLegalProfile: DscpDomainProfile = {
      ...legalPolicyProfile,
      domainProfileId: "legal-policy-en-only-v1",
      languageCodes: ["en"],
    };
    const registry = createDscpDomainProfileRegistry([
      legalPolicyProfile,
      secondLegalProfile,
    ]);
    const result = selectAndApplyDscpDomainProfile({
      registry,
      criteria: { domainFamily: "legal_policy" },
      descriptorInput: makeDescriptorInput("T11F-AMB-001"),
    });
    expect(result.status).toBe("PROFILE_SELECTION_AMBIGUOUS");
    expect(result.selectedProfileId).toBeNull();
    expect(result.matchCount).toBe(2);
    expect(result.matchedIds).toContain("policylocal-vi-legal-policy-v1");
    expect(result.matchedIds).toContain("legal-policy-en-only-v1");
    expect(result.enrichedDescriptorInput).toBeNull();
    expect(result.diagnostics.some((d) => d.includes("Ambiguous"))).toBe(true);
  });

  it("does not proceed to profile application on ambiguous match", () => {
    const secondTechProfile: DscpDomainProfile = {
      ...technicalProjectProfile,
      domainProfileId: "technical-project-docs-v2",
    };
    const registry = createDscpDomainProfileRegistry([
      technicalProjectProfile,
      secondTechProfile,
    ]);
    const result = selectAndApplyDscpDomainProfile({
      registry,
      criteria: { domainFamily: "technical_project" },
      descriptorInput: makeDescriptorInput("T11F-AMB-002"),
    });
    expect(result.status).toBe("PROFILE_SELECTION_AMBIGUOUS");
    expect(result.injectedGateKeys).toHaveLength(0);
  });
});

// --- Blocked profile application stop ---

describe("DSCP-T11F: selectAndApplyDscpDomainProfile - blocked profile application stop", () => {
  it("returns PROFILE_APPLICATION_BLOCKED when boundary rule is BLOCKED_UNTIL_*", () => {
    const registry = createDscpDomainProfileRegistry([blockedLegalProfile]);
    const result = selectAndApplyDscpDomainProfile({
      registry,
      criteria: { domainProfileId: "legal-policy-blocked-v1" },
      descriptorInput: makeDescriptorInput("T11F-BLK-001"),
    });
    expect(result.status).toBe("PROFILE_APPLICATION_BLOCKED");
    expect(result.selectedProfileId).toBe("legal-policy-blocked-v1");
    expect(result.matchCount).toBe(1);
    expect(result.enrichedDescriptorInput).toBeNull();
    expect(result.injectedGateKeys).toHaveLength(0);
    expect(result.diagnostics.some((d) => d.includes("blocked"))).toBe(true);
  });

  it("returns PROFILE_APPLICATION_BLOCKED when boundary rule is PROHIBITED", () => {
    const prohibitedProfile: DscpDomainProfile = {
      ...companyDocsProfile,
      domainProfileId: "company-docs-prohibited-v1",
      boundaryRules: { internalGate: "PROHIBITED" },
    };
    const registry = createDscpDomainProfileRegistry([prohibitedProfile]);
    const result = selectAndApplyDscpDomainProfile({
      registry,
      criteria: { domainProfileId: "company-docs-prohibited-v1" },
      descriptorInput: makeDescriptorInput("T11F-BLK-002"),
    });
    expect(result.status).toBe("PROFILE_APPLICATION_BLOCKED");
    expect(result.enrichedDescriptorInput).toBeNull();
  });
});

// --- Profile isolation: no gate bleed ---

describe("DSCP-T11F: selectAndApplyDscpDomainProfile - profile isolation and no gate bleed", () => {
  it("legal-policy gates absent from technical-project result", () => {
    const registry = createDscpDomainProfileRegistry([
      legalPolicyProfile,
      technicalProjectProfile,
    ]);
    const result = selectAndApplyDscpDomainProfile({
      registry,
      criteria: { domainFamily: "technical_project" },
      descriptorInput: makeDescriptorInput("T11F-ISO-001"),
    });
    expect(result.status).toBe("PROFILE_APPLIED");
    const gates = result.enrichedDescriptorInput!.governanceGates.customGates;
    // ec02Gate and t12EligibilityGate belong only to legal-policy profile.
    expect(gates?.["ec02Gate"]).toBeUndefined();
    expect(gates?.["t12EligibilityGate"]).toBeUndefined();
    // technical-project gates present.
    expect(gates?.["stabilityGate"]).toBe("PASS");
  });

  it("technical-project gates absent from legal-policy result", () => {
    const registry = createDscpDomainProfileRegistry([
      legalPolicyProfile,
      technicalProjectProfile,
    ]);
    const result = selectAndApplyDscpDomainProfile({
      registry,
      criteria: { domainFamily: "legal_policy", languageCode: "vi" },
      descriptorInput: makeDescriptorInput("T11F-ISO-002"),
    });
    expect(result.status).toBe("PROFILE_APPLIED");
    const gates = result.enrichedDescriptorInput!.governanceGates.customGates;
    // stabilityGate and breakingChangeGate belong only to technical-project profile.
    expect(gates?.["stabilityGate"]).toBeUndefined();
    expect(gates?.["breakingChangeGate"]).toBeUndefined();
    // legal-policy gates present.
    expect(gates?.["ec02Gate"]).toBe("PASS");
  });

  it("enrichedDescriptorInput preserves original caller fields", () => {
    const registry = createDscpDomainProfileRegistry([technicalProjectProfile]);
    const inputWithExistingMeta: GovernedArtifactDescriptorInput = {
      ...makeDescriptorInput("T11F-ISO-003"),
      metadata: { callerKey: "callerValue" },
    };
    const result = selectAndApplyDscpDomainProfile({
      registry,
      criteria: { domainFamily: "technical_project" },
      descriptorInput: inputWithExistingMeta,
    });
    expect(result.status).toBe("PROFILE_APPLIED");
    const meta = result.enrichedDescriptorInput!.metadata!;
    // Caller metadata preserved.
    expect(meta["callerKey"]).toBe("callerValue");
    // Profile metadata also present.
    expect(meta["domainFamily"]).toBe("technical_project");
  });
});
