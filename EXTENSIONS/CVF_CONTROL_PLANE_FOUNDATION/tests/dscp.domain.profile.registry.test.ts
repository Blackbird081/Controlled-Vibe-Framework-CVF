import { describe, it, expect } from "vitest";
import {
  createDscpDomainProfileRegistry,
  DscpDomainProfileRegistry,
} from "../src/dscp.domain.profile.registry";
import type { DscpDomainProfile } from "../src/dscp.domain.profile.contract";
import { applyDomainProfileToDescriptorInput } from "../src/dscp.domain.profile.contract";
import type { GovernedArtifactDescriptorInput } from "../src/dscp.governed.artifact.descriptor";

// --- DSCP-T11E Domain Profile Registry And Profile Selection Tests ---
// Tranche: DSCP-T11E
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

const companyDocsProfile: DscpDomainProfile = {
  domainProfileId: "company-docs-internal-v1",
  domainFamily: "company_docs",
  languageCodes: ["en"],
  commonFacetFields: { corpusType: "internal", accessLevel: "confidential" },
  domainFacetFields: { businessUnit: "engineering", policyOwner: "legal-ops" },
  domainGateKeys: ["internalGate", "complianceGate"],
  boundaryRules: { internalGate: "PASS", complianceGate: "PASS" },
  defaultMetadata: { retentionPolicy: "7y" },
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

const enOnlyLegalProfile: DscpDomainProfile = {
  domainProfileId: "legal-policy-en-only-v1",
  domainFamily: "legal_policy",
  languageCodes: ["en"],
  commonFacetFields: { corpusType: "legal", sourceRegion: "International" },
  domainFacetFields: { jurisdiction: "INTL", authorityLevel: "advisory" },
  domainGateKeys: ["ec02Gate"],
  boundaryRules: { ec02Gate: "PASS" },
  defaultMetadata: { domainVersion: "1.0" },
};

// Helper: minimal descriptor input.
function makeRawInput(id: string): GovernedArtifactDescriptorInput {
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

describe("DSCP-T11E: DscpDomainProfileRegistry - registration", () => {
  it("registers a profile and retrieves it by ID", () => {
    const registry = createDscpDomainProfileRegistry();
    const result = registry.register(legalPolicyProfile);
    expect(result.registered).toBe(true);
    expect(result.profileId).toBe("policylocal-vi-legal-policy-v1");

    const found = registry.getById("policylocal-vi-legal-policy-v1");
    expect(found).not.toBeNull();
    expect(found!.domainFamily).toBe("legal_policy");
  });

  it("rejects duplicate registration without replaceExisting=true", () => {
    const registry = createDscpDomainProfileRegistry([legalPolicyProfile]);
    const result = registry.register(legalPolicyProfile);
    expect(result.registered).toBe(false);
    expect(result.rejectionReason).toMatch(/already registered/);
  });

  it("allows overwrite with replaceExisting=true", () => {
    const registry = createDscpDomainProfileRegistry([legalPolicyProfile]);
    const updated: DscpDomainProfile = {
      ...legalPolicyProfile,
      defaultMetadata: { domainVersion: "2.0" },
    };
    const result = registry.register(updated, { replaceExisting: true });
    expect(result.registered).toBe(true);
    expect(registry.getById(legalPolicyProfile.domainProfileId)!.defaultMetadata["domainVersion"]).toBe("2.0");
  });

  it("unregisters a profile and confirms it is gone", () => {
    const registry = createDscpDomainProfileRegistry([legalPolicyProfile]);
    const removed = registry.unregister("policylocal-vi-legal-policy-v1");
    expect(removed).toBe(true);
    expect(registry.getById("policylocal-vi-legal-policy-v1")).toBeNull();
  });

  it("unregister returns false for unknown ID", () => {
    const registry = createDscpDomainProfileRegistry();
    expect(registry.unregister("non-existent-id")).toBe(false);
  });

  it("listAll returns all registered profiles", () => {
    const registry = createDscpDomainProfileRegistry([
      legalPolicyProfile,
      companyDocsProfile,
      technicalProjectProfile,
    ]);
    const all = registry.listAll();
    expect(all).toHaveLength(3);
    const ids = all.map((p) => p.domainProfileId);
    expect(ids).toContain("policylocal-vi-legal-policy-v1");
    expect(ids).toContain("company-docs-internal-v1");
    expect(ids).toContain("technical-project-docs-v1");
  });

  it("factory pre-populates registry with initial profiles", () => {
    const registry = createDscpDomainProfileRegistry([
      legalPolicyProfile,
      technicalProjectProfile,
    ]);
    expect(registry.listAll()).toHaveLength(2);
  });
});

describe("DSCP-T11E: DscpDomainProfileRegistry - selection by criteria", () => {
  const registry = createDscpDomainProfileRegistry([
    legalPolicyProfile,
    companyDocsProfile,
    technicalProjectProfile,
    enOnlyLegalProfile,
  ]);

  it("selects exactly one profile by domainProfileId", () => {
    const result = registry.select({ domainProfileId: "company-docs-internal-v1" });
    expect(result.matched).toBe(true);
    expect(result.matchCount).toBe(1);
    expect(result.profile!.domainFamily).toBe("company_docs");
  });

  it("selects unique profile by domainFamily + languageCode", () => {
    // Only legalPolicyProfile has domainFamily=legal_policy AND languageCode=vi.
    const result = registry.select({
      domainFamily: "legal_policy",
      languageCode: "vi",
    });
    expect(result.matched).toBe(true);
    expect(result.profile!.domainProfileId).toBe("policylocal-vi-legal-policy-v1");
  });

  it("returns ambiguous result when multiple profiles match", () => {
    // Both legalPolicyProfile and enOnlyLegalProfile have domainFamily=legal_policy.
    const result = registry.select({ domainFamily: "legal_policy" });
    expect(result.matched).toBe(false);
    expect(result.matchCount).toBe(2);
    expect(result.profile).toBeNull();
    expect(result.matchedIds).toContain("policylocal-vi-legal-policy-v1");
    expect(result.matchedIds).toContain("legal-policy-en-only-v1");
    expect(result.diagnostics.some((d) => d.includes("Ambiguous"))).toBe(true);
  });

  it("returns no-match result with diagnostic for unknown criteria", () => {
    const result = registry.select({ domainFamily: "governance_docs" });
    expect(result.matched).toBe(false);
    expect(result.matchCount).toBe(0);
    expect(result.profile).toBeNull();
    expect(result.diagnostics.some((d) => d.includes("No profile matched"))).toBe(true);
  });

  it("selects by requiredFacetKey present in commonFacetFields", () => {
    // Only legalPolicyProfile and enOnlyLegalProfile have sourceRegion in commonFacetFields.
    // Narrow with languageCode=vi to get exactly one.
    const result = registry.select({
      requiredFacetKey: "sourceRegion",
      languageCode: "vi",
    });
    expect(result.matched).toBe(true);
    expect(result.profile!.domainProfileId).toBe("policylocal-vi-legal-policy-v1");
  });

  it("selects by requiredFacetKey present in domainFacetFields", () => {
    // Only technicalProjectProfile has moduleId in domainFacetFields.
    const result = registry.select({ requiredFacetKey: "moduleId" });
    expect(result.matched).toBe(true);
    expect(result.profile!.domainFamily).toBe("technical_project");
  });

  it("returns no match when requiredFacetKey is absent from all profiles", () => {
    const result = registry.select({ requiredFacetKey: "nonExistentFacet" });
    expect(result.matched).toBe(false);
    expect(result.matchCount).toBe(0);
  });
});

describe("DSCP-T11E: DscpDomainProfileRegistry - select-then-apply pipeline integration", () => {
  it("selects PolicyLocal profile from registry and applies it to a descriptor input", () => {
    const registry = createDscpDomainProfileRegistry([
      legalPolicyProfile,
      companyDocsProfile,
      technicalProjectProfile,
    ]);

    // Scan layer selects profile by domain criteria - no hard-coded PolicyLocal reference.
    const selection = registry.select({
      domainFamily: "legal_policy",
      languageCode: "vi",
    });
    expect(selection.matched).toBe(true);

    const profile = selection.profile!;
    const rawInput = makeRawInput("REG-LP-001");
    const applyResult = applyDomainProfileToDescriptorInput(profile, rawInput);

    expect(applyResult.blocked).toBe(false);
    const meta = applyResult.enrichedInput!.metadata!;
    expect(meta["domainFamily"]).toBe("legal_policy");
    expect(meta["jurisdiction"]).toBe("VN");
    expect(meta["languageCodes"]).toContain("vi");
    expect(applyResult.enrichedInput!.governanceGates.customGates?.["ec02Gate"]).toBe("PASS");

    // Technical-project gate keys absent - profile isolation maintained.
    expect(applyResult.enrichedInput!.governanceGates.customGates?.["stabilityGate"]).toBeUndefined();
  });

  it("selects technical-project profile from registry and applies it - no legal-policy gate bleed", () => {
    const registry = createDscpDomainProfileRegistry([
      legalPolicyProfile,
      companyDocsProfile,
      technicalProjectProfile,
    ]);

    const selection = registry.select({ domainFamily: "technical_project" });
    expect(selection.matched).toBe(true);

    const applyResult = applyDomainProfileToDescriptorInput(
      selection.profile!,
      makeRawInput("REG-TP-001"),
    );
    expect(applyResult.blocked).toBe(false);
    expect(applyResult.enrichedInput!.metadata!["domainFamily"]).toBe("technical_project");
    expect(applyResult.enrichedInput!.governanceGates.customGates?.["stabilityGate"]).toBe("PASS");
    expect(applyResult.enrichedInput!.governanceGates.customGates?.["ec02Gate"]).toBeUndefined();
  });

  it("scan layer falls through to diagnostic when no profile matches - no raw descriptor is built", () => {
    const registry = createDscpDomainProfileRegistry([technicalProjectProfile]);

    const selection = registry.select({ domainFamily: "legal_policy" });
    expect(selection.matched).toBe(false);
    expect(selection.profile).toBeNull();

    // Caller must not proceed to descriptor build when selection.matched=false.
    // This is the correct governance stop - simulated here by asserting profile is null.
    if (!selection.matched) {
      // No descriptor, no package, no receipt: correct governance stop.
      expect(selection.diagnostics.length).toBeGreaterThan(0);
    }
  });

  it("empty registry returns no-match for any criteria", () => {
    const registry = new DscpDomainProfileRegistry();
    const result = registry.select({ domainFamily: "company_docs" });
    expect(result.matched).toBe(false);
    expect(result.matchCount).toBe(0);
    expect(result.diagnostics.some((d) => d.includes("No profile matched"))).toBe(true);
  });
});
