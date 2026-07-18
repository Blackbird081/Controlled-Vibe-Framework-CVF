import { describe, expect, it } from "vitest";
import { buildLPFGovernedPackage } from "../src/dscp.lpf.adapter";
import type { GovernanceContextEnvelope } from "../src/dscp.governed.context.contract";
import type { MemoryContextBlock } from "../../CVF_LEARNING_PLANE_FOUNDATION/src/memory-context-packager";

const block: MemoryContextBlock = {
  contractVersion: "cvf.memoryContextPackager.phase2a.v1",
  text: "[MEMORY_CONTEXT]\napproved_memory:\n- mem-1: retained summary\n[/MEMORY_CONTEXT]",
  sourceMemoryIds: ["mem-1"],
  excludedMemory: [],
  tokenEstimate: 18,
  evidence: {
    contractVersion: "cvf.memoryContextPackager.phase2a.v1",
    policyDecision: "ALLOW_SUMMARY_MEMORY",
    sourceMemoryIds: ["mem-1"],
    includedMemoryCount: 1,
    excludedMemoryCount: 0,
    tokenBudget: 100,
    tokenEstimate: 18,
    tokenBudgetExceeded: false,
    rawMemoryReleased: false,
    canReinject: false,
  },
  rawMemoryReleased: false,
};

const envelope: GovernanceContextEnvelope = {
  artifactDescriptors: [
    {
      artifactId: "lpf-artifact-001",
      sourceHash: "sha256:lpf",
      artifactRole: "operational",
      contentClass: "memory_context_block",
      governanceGates: {
        freshnessGate: "NOT_APPLICABLE",
        classificationGate: "PASS",
        eligibilityGate: "YES",
      },
      metadata: { source: "LPF" },
    },
  ],
  classificationGate: "PASS",
  freshnessGate: "NOT_APPLICABLE",
  policyDecision: "ALLOW_CONTEXT_PACK",
  authorizationRef: "docs/baselines/CVF_GC018_DSCP_T8_MKE1_CROSS_LANE_WIREIN_2026-06-08.md",
};

describe("buildLPFGovernedPackage", () => {
  it("sets rawContentReleased to false in output evidence", () => {
    const result = buildLPFGovernedPackage(block, "lpf-artifact-001", envelope);

    expect(result.governanceEvidence.rawContentReleased).toBe(false);
  });

  it("sets canBypassGovernance to false in output evidence", () => {
    const result = buildLPFGovernedPackage(block, "lpf-artifact-001", envelope);

    expect(result.governanceEvidence.canBypassGovernance).toBe(false);
  });

  it("maps block text into the inner package knowledge segment", () => {
    const result = buildLPFGovernedPackage(block, "lpf-artifact-001", envelope);

    expect(result.innerPackage.segments).toHaveLength(1);
    expect(result.innerPackage.segments[0].segmentType).toBe("KNOWLEDGE");
    expect(result.innerPackage.segments[0].content).toBe(block.text);
    expect(result.innerPackage.estimatedTokens).toBe(block.tokenEstimate);
  });

  it("preserves GovernanceContextEnvelope classificationGate", () => {
    const result = buildLPFGovernedPackage(block, "lpf-artifact-001", envelope);

    expect(result.governanceEvidence.classificationGate).toBe("PASS");
  });

  it("preserves GovernanceContextEnvelope freshnessGate", () => {
    const result = buildLPFGovernedPackage(block, "lpf-artifact-001", envelope);

    expect(result.governanceEvidence.freshnessGate).toBe("NOT_APPLICABLE");
  });

  it("preserves GovernanceContextEnvelope policyDecision", () => {
    const result = buildLPFGovernedPackage(block, "lpf-artifact-001", envelope);

    expect(result.governanceEvidence.policyDecision).toBe("ALLOW_CONTEXT_PACK");
  });

  it("records artifactId in sourceArtifactIds", () => {
    const result = buildLPFGovernedPackage(block, "lpf-artifact-001", envelope);

    expect(result.governanceEvidence.sourceArtifactIds).toEqual(["lpf-artifact-001"]);
  });

  it("passes authorizationRef through when provided", () => {
    const result = buildLPFGovernedPackage(block, "lpf-artifact-001", envelope);

    expect(result.governanceEvidence.authorizationRef).toBe(
      "docs/baselines/CVF_GC018_DSCP_T8_MKE1_CROSS_LANE_WIREIN_2026-06-08.md",
    );
  });

  it("leaves authorizationRef undefined when envelope has none", () => {
    const { authorizationRef: _authorizationRef, ...withoutAuthorization } = envelope;
    const result = buildLPFGovernedPackage(
      block,
      "lpf-artifact-001",
      withoutAuthorization,
    );

    expect(result.governanceEvidence.authorizationRef).toBeUndefined();
  });
});
