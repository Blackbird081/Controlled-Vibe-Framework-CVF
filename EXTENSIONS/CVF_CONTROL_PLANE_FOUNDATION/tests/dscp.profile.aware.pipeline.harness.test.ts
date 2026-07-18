import { describe, it, expect } from "vitest";
import { applyDomainProfileToDescriptorInput } from "../src/dscp.domain.profile.contract";
import type { DscpDomainProfile } from "../src/dscp.domain.profile.contract";
import { buildGovernedArtifactDescriptor } from "../src/dscp.governed.artifact.descriptor";
import type { GovernedArtifactDescriptorInput } from "../src/dscp.governed.artifact.descriptor";
import { createGovernedContextPackerContract } from "../src/dscp.governed.context.packer";
import { buildGovernedRetrievalReceipt } from "../src/dscp.governed.retrieval.receipt";
import { buildLPFGovernedPackage } from "../src/dscp.lpf.adapter";
import { buildECOGovernedPackRequest } from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/dscp.eco.adapter";
import { packageMemoryContext } from "../../CVF_LEARNING_PLANE_FOUNDATION/src/memory-context-packager";
import type { RAGDocument, RAGResult } from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/types";
import type {
  GovernanceContextEnvelope,
  GovernedArtifactDescriptor,
} from "../src/dscp.governed.context.contract";

// --- DSCP-T11: Profile-Aware Context Package Harness ---
// Tranche: DSCP-T11
// Authorization: docs/baselines/CVF_GC018_DSCP_T11_PROFILE_AWARE_PIPELINE_HARNESS_2026-06-10.md
// Deterministic local harness only; no provider call, corpus ingestion, or external I/O.

const DETERMINISTIC_NOW = () => "2026-06-10T00:00:00.000Z";
const DETERMINISTIC_TOKENS = (s: string) => s.length;

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

// Helper: build raw descriptor input with no profile applied.
function makeRawInput(
  artifactId: string,
  contentClass: string,
): GovernedArtifactDescriptorInput {
  return {
    artifactId,
    sourceHash: `hash-${artifactId}`,
    artifactRole: "corpus_candidate",
    contentClass,
    governanceGates: {
      freshnessGate: "PASS",
      classificationGate: "PASS",
      eligibilityGate: "YES",
    },
    metadata: {},
  };
}

// Helper: build governance envelope from a descriptor.
function makeEnvelope(
  descriptor: GovernedArtifactDescriptor,
  policyDecision: string,
): GovernanceContextEnvelope {
  return {
    artifactDescriptors: [descriptor],
    classificationGate: descriptor.governanceGates.classificationGate as
      | "PASS"
      | "BLOCKED"
      | "CONDITIONAL",
    freshnessGate: descriptor.governanceGates.freshnessGate as
      | "PASS"
      | "BLOCKED"
      | "NOT_APPLICABLE",
    policyDecision,
    authorizationRef:
      "docs/baselines/CVF_GC018_DSCP_T11_PROFILE_AWARE_PIPELINE_HARNESS_2026-06-10.md",
  };
}

describe("DSCP-T11 Profile-Aware Pipeline Harness - legal_policy ECO path", () => {
  it("profile metadata and gate keys flow through descriptor to ECO pack without content release", () => {
    // Step 1: Apply legal-policy profile to raw descriptor input.
    const rawInput = makeRawInput("LP-T11-001", "policy");
    const applyResult = applyDomainProfileToDescriptorInput(
      legalPolicyProfile,
      rawInput,
    );
    expect(applyResult.blocked).toBe(false);
    expect(applyResult.enrichedInput).not.toBeNull();

    // Step 2: Build governed artifact descriptor from enriched input.
    const descResult = buildGovernedArtifactDescriptor(applyResult.enrichedInput!);
    expect(descResult.blocked).toBe(false);
    const descriptor = descResult.descriptor!;

    // Profile metadata embedded in descriptor.
    expect(descriptor.metadata["domainFamily"]).toBe("legal_policy");
    expect(descriptor.metadata["jurisdiction"]).toBe("VN");
    expect(descriptor.metadata["languageCodes"]).toContain("vi");

    // Profile gate keys injected into customGates.
    expect(descriptor.governanceGates.customGates?.["ec02Gate"]).toBe("PASS");
    expect(descriptor.governanceGates.customGates?.["t12EligibilityGate"]).toBe(
      "CONDITIONAL",
    );

    // Technical-project gate keys must NOT appear on a legal-policy descriptor.
    expect(descriptor.governanceGates.customGates?.["stabilityGate"]).toBeUndefined();
    expect(descriptor.governanceGates.customGates?.["breakingChangeGate"]).toBeUndefined();

    // Step 3: Build ECO governed pack request.
    const ragDoc: RAGDocument = {
      id: descriptor.artifactId,
      title: "Vietnamese Administrative Law Overview",
      content: "summary of legal corpus - not raw source",
      tier: "T2_POLICY",
      documentType: "policy",
      domain: "legal",
      tags: ["vi", "law"],
      score: 0.9,
      metadata: {},
    };
    const ragResult: RAGResult = {
      query: "administrative law overview",
      documents: [ragDoc],
      tiersSearched: ["T2_POLICY"],
      totalCandidates: 1,
      retrievalTimeMs: 1,
    };

    const envelope = makeEnvelope(
      descriptor,
      "legal-policy corpus candidate; ec02Gate PASS",
    );
    const packRequest = buildECOGovernedPackRequest(ragResult, envelope);

    // Governance envelope preserved.
    expect(packRequest.governanceEnvelope.classificationGate).toBe("PASS");
    expect(packRequest.governanceEnvelope.policyDecision).toContain("ec02Gate");
    expect(
      packRequest.governanceEnvelope.artifactDescriptors[0].metadata["domainFamily"],
    ).toBe("legal_policy");

    // Step 4: Pack context via governed packer.
    const packer = createGovernedContextPackerContract({
      packagerDependencies: {
        now: DETERMINISTIC_NOW,
        estimateTokens: DETERMINISTIC_TOKENS,
      },
    });
    const govPackage = packer.pack(packRequest);

    expect(govPackage.innerPackage.packageId).not.toBe("BLOCKED");
    expect(govPackage.governanceEvidence.classificationGate).toBe("PASS");
    expect(govPackage.governanceEvidence.rawContentReleased).toBe(false);
    expect(govPackage.governanceEvidence.canBypassGovernance).toBe(false);
    expect(govPackage.governanceEvidence.policyDecision).toContain("ec02Gate");

    // Step 5: Build governed retrieval receipt.
    const receipt = buildGovernedRetrievalReceipt({
      receiptId: "T11-LP-RECEIPT-001",
      query: "administrative law overview",
      queryTimestamp: DETERMINISTIC_NOW(),
      contextPackage: govPackage,
      governanceOutcome: "ANSWER_EMITTED",
      contentDeliveryClass: "SUMMARIZED_ANSWER",
      freshnessDisclosureApplied: false,
      modelResponseHash: "b".repeat(64),
      governanceGateResults: {
        ec02Gate: "PASS",
        t12EligibilityGate: "CONDITIONAL",
      },
    });

    expect(receipt.governanceOutcome).toBe("ANSWER_EMITTED");
    expect(receipt.rawSourceReleased).toBe(false);
    expect(receipt.governanceGateResults["ec02Gate"]).toBe("PASS");
    // Technical-project gate keys must NOT appear in a legal-policy receipt.
    expect(receipt.governanceGateResults["stabilityGate"]).toBeUndefined();
  });
});

describe("DSCP-T11 Profile-Aware Pipeline Harness - technical_project LPF path", () => {
  it("profile metadata and gate keys flow through descriptor to LPF package without content release", () => {
    // Step 1: Apply technical-project profile.
    const rawInput = makeRawInput("TP-T11-001", "context_snippet");
    const applyResult = applyDomainProfileToDescriptorInput(
      technicalProjectProfile,
      rawInput,
    );
    expect(applyResult.blocked).toBe(false);

    // Step 2: Build descriptor.
    const descResult = buildGovernedArtifactDescriptor(applyResult.enrichedInput!);
    expect(descResult.blocked).toBe(false);
    const descriptor = descResult.descriptor!;

    expect(descriptor.metadata["domainFamily"]).toBe("technical_project");
    expect(descriptor.metadata["moduleId"]).toBe("cvf-control-plane");
    expect(descriptor.governanceGates.customGates?.["stabilityGate"]).toBe("PASS");

    // Legal-policy gate keys must NOT appear on a technical-project descriptor.
    expect(descriptor.governanceGates.customGates?.["ec02Gate"]).toBeUndefined();
    expect(descriptor.governanceGates.customGates?.["t12EligibilityGate"]).toBeUndefined();

    // Step 3: Build LPF memory block and governed package.
    const memBlock = packageMemoryContext({
      purpose: "dscp-t11 technical-project harness test",
      scope: "dscp-lpf-pipeline",
      riskLevel: "low",
      approvedMemory: [
        {
          id: descriptor.artifactId,
          summary: "architecture documentation summary",
          scope: "dscp",
          tokenEstimate: 40,
        },
      ],
      excludedMemory: [],
      policyDecision: "approved for dscp-t11 lpf harness test",
      tokenBudget: 200,
    });
    expect(memBlock.rawMemoryReleased).toBe(false);
    expect(memBlock.evidence.rawMemoryReleased).toBe(false);

    const envelope = makeEnvelope(
      descriptor,
      "technical-project corpus candidate; stabilityGate PASS",
    );
    const lpfPackage = buildLPFGovernedPackage(
      memBlock,
      descriptor.artifactId,
      envelope,
    );

    expect(lpfPackage.governanceEvidence.classificationGate).toBe("PASS");
    expect(lpfPackage.governanceEvidence.rawContentReleased).toBe(false);
    expect(lpfPackage.governanceEvidence.canBypassGovernance).toBe(false);
    expect(lpfPackage.governanceEvidence.policyDecision).toContain("stabilityGate");

    // Step 4: Build retrieval receipt.
    const receipt = buildGovernedRetrievalReceipt({
      receiptId: "T11-TP-RECEIPT-001",
      query: "architecture documentation",
      queryTimestamp: DETERMINISTIC_NOW(),
      contextPackage: lpfPackage,
      governanceOutcome: "ANSWER_EMITTED",
      contentDeliveryClass: "DIRECT_ANSWER",
      freshnessDisclosureApplied: false,
      modelResponseHash: "c".repeat(64),
      governanceGateResults: {
        stabilityGate: "PASS",
        breakingChangeGate: "PASS",
      },
    });

    expect(receipt.rawSourceReleased).toBe(false);
    expect(receipt.governanceGateResults["stabilityGate"]).toBe("PASS");
    // Legal-policy gate keys must NOT appear in a technical-project receipt.
    expect(receipt.governanceGateResults["ec02Gate"]).toBeUndefined();
  });
});

describe("DSCP-T11 Profile-Aware Pipeline Harness - blocked profile boundary", () => {
  it("blocked profile short-circuits before descriptor build; no package or receipt produced", () => {
    const blockedProfile: DscpDomainProfile = {
      ...legalPolicyProfile,
      domainProfileId: "blocked-legal-t11-v1",
      boundaryRules: {
        ec02Gate: "BLOCKED_UNTIL_2026-07-01",
        t12EligibilityGate: "CONDITIONAL",
      },
    };

    const rawInput = makeRawInput("LP-T11-BLOCKED", "policy");
    const applyResult = applyDomainProfileToDescriptorInput(blockedProfile, rawInput);

    // Pipeline stops at profile application; exact boundary reason surfaced.
    expect(applyResult.blocked).toBe(true);
    expect(applyResult.enrichedInput).toBeNull();
    expect(applyResult.blockReason).toMatch(/ec02Gate/);
    expect(applyResult.blockReason).toMatch(/BLOCKED_UNTIL_2026-07-01/);
  });
});

describe("DSCP-T11 Profile-Aware Pipeline Harness - cross-profile gate isolation", () => {
  it("legal-policy and technical-project gate keys never bleed across pipeline runs", () => {
    const lpInput = makeRawInput("CROSS-LP-001", "policy");
    const tpInput = makeRawInput("CROSS-TP-001", "context_snippet");

    const lpApply = applyDomainProfileToDescriptorInput(legalPolicyProfile, lpInput);
    const tpApply = applyDomainProfileToDescriptorInput(
      technicalProjectProfile,
      tpInput,
    );

    expect(lpApply.blocked).toBe(false);
    expect(tpApply.blocked).toBe(false);

    const lpDesc = buildGovernedArtifactDescriptor(lpApply.enrichedInput!).descriptor!;
    const tpDesc = buildGovernedArtifactDescriptor(tpApply.enrichedInput!).descriptor!;

    // Legal-policy descriptor: has ec02Gate, NOT stabilityGate.
    expect(lpDesc.governanceGates.customGates?.["ec02Gate"]).toBe("PASS");
    expect(lpDesc.governanceGates.customGates?.["stabilityGate"]).toBeUndefined();

    // Technical-project descriptor: has stabilityGate, NOT ec02Gate.
    expect(tpDesc.governanceGates.customGates?.["stabilityGate"]).toBe("PASS");
    expect(tpDesc.governanceGates.customGates?.["ec02Gate"]).toBeUndefined();

    // domainFamily correct per descriptor, not swapped.
    expect(lpDesc.metadata["domainFamily"]).toBe("legal_policy");
    expect(tpDesc.metadata["domainFamily"]).toBe("technical_project");

    // Domain-specific facet fields do not bleed across descriptors.
    expect(lpDesc.metadata["moduleId"]).toBeUndefined();
    expect(tpDesc.metadata["jurisdiction"]).toBeUndefined();
  });
});
