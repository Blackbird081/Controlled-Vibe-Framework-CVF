import { describe, it, expect, vi } from "vitest";
import {
  GovernedContextPackerContract,
  createGovernedContextPackerContract,
} from "../src/dscp.governed.context.packer";
import type { GovernedContextPackRequest } from "../src/dscp.governed.context.contract";
import type { ContextPackagerRequest } from "../src/context.packager.contract";

// DSCP-T3: GovernedContextPackerContract Deterministic Tests

// --- Fixtures ---

const FIXED_NOW = "2026-06-07T00:00:00.000Z";

function makeInnerRequest(): ContextPackagerRequest {
  return {
    query: "What is the governed pack standard?",
    contextId: "dscp-t3-test-ctx-001",
    knowledgeItems: [
      {
        itemId: "k-001",
        title: "DSCP Standard",
        content: "The DSCP standard defines a domain-agnostic governance pack standard.",
        relevanceScore: 0.9,
        source: "docs/reference/CVF_DSCP_T1_SCHEMA_PROPOSAL_2026-06-07.md",
      },
    ],
    maxTokens: 512,
  };
}

function makePassRequest(): GovernedContextPackRequest {
  return {
    packRequest: makeInnerRequest(),
    governanceEnvelope: {
      artifactDescriptors: [
        {
          artifactId: "art-dscp-001",
          sourceHash: "abc123",
          artifactRole: "reference",
          contentClass: "governance_standard",
          governanceGates: {
            freshnessGate: "PASS",
            classificationGate: "PASS",
            eligibilityGate: "YES",
          },
          metadata: {},
        },
      ],
      classificationGate: "PASS",
      freshnessGate: "PASS",
      policyDecision: "All gates PASS; pack authorized.",
      authorizationRef: "docs/baselines/CVF_GC018_DSCP_T3_RUNTIME_PILOT_CPF_INTERNAL_2026-06-07.md",
    },
  };
}

function makeBlockedClassificationRequest(): GovernedContextPackRequest {
  const r = makePassRequest();
  return {
    ...r,
    governanceEnvelope: {
      ...r.governanceEnvelope,
      classificationGate: "BLOCKED",
    },
  };
}

function makeBlockedFreshnessRequest(): GovernedContextPackRequest {
  const r = makePassRequest();
  return {
    ...r,
    governanceEnvelope: {
      ...r.governanceEnvelope,
      freshnessGate: "BLOCKED",
    },
  };
}

function makeConditionalClassificationRequest(): GovernedContextPackRequest {
  const r = makePassRequest();
  return {
    ...r,
    governanceEnvelope: {
      ...r.governanceEnvelope,
      classificationGate: "CONDITIONAL",
    },
  };
}

// --- PASS Path Tests ---

describe("DSCP-T3: GovernedContextPackerContract - PASS path", () => {
  it("returns a GovernedContextPackage on all-PASS gates", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makePassRequest());
    expect(result).toBeDefined();
    expect(result.innerPackage).toBeDefined();
    expect(result.governanceEvidence).toBeDefined();
  });

  it("innerPackage.contextId matches the inner request contextId", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makePassRequest());
    expect(result.innerPackage.contextId).toBe("dscp-t3-test-ctx-001");
  });

  it("innerPackage.query matches the inner request query", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makePassRequest());
    expect(result.innerPackage.query).toBe("What is the governed pack standard?");
  });

  it("innerPackage is not the BLOCKED placeholder when gates are PASS", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makePassRequest());
    expect(result.innerPackage.packageId).not.toBe("BLOCKED");
  });

  it("innerPackage has non-empty packageHash on PASS", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makePassRequest());
    expect(result.innerPackage.packageHash.length).toBeGreaterThan(0);
  });
});

// --- Governance Evidence on PASS Path ---

describe("DSCP-T3: GovernedContextPackerContract - governance evidence on PASS", () => {
  it("governanceEvidence.rawContentReleased is always false (literal)", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makePassRequest());
    expect(result.governanceEvidence.rawContentReleased).toBe(false);
  });

  it("governanceEvidence.canBypassGovernance is always false (literal)", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makePassRequest());
    expect(result.governanceEvidence.canBypassGovernance).toBe(false);
  });

  it("governanceEvidence.classificationGate reflects envelope value on PASS", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makePassRequest());
    expect(result.governanceEvidence.classificationGate).toBe("PASS");
  });

  it("governanceEvidence.freshnessGate reflects envelope value on PASS", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makePassRequest());
    expect(result.governanceEvidence.freshnessGate).toBe("PASS");
  });

  it("governanceEvidence.policyDecision matches envelope policyDecision", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makePassRequest());
    expect(result.governanceEvidence.policyDecision).toBe(
      "All gates PASS; pack authorized.",
    );
  });

  it("governanceEvidence.sourceArtifactIds contains envelope artifact IDs", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makePassRequest());
    expect(result.governanceEvidence.sourceArtifactIds).toEqual(["art-dscp-001"]);
  });

  it("governanceEvidence.authorizationRef carries envelope authorizationRef", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makePassRequest());
    expect(result.governanceEvidence.authorizationRef).toBe(
      "docs/baselines/CVF_GC018_DSCP_T3_RUNTIME_PILOT_CPF_INTERNAL_2026-06-07.md",
    );
  });
});

// --- BLOCKED Path Tests ---

describe("DSCP-T3: GovernedContextPackerContract - BLOCKED gate enforcement", () => {
  it("returns BLOCKED package when classificationGate is BLOCKED", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makeBlockedClassificationRequest());
    expect(result.innerPackage.packageId).toBe("BLOCKED");
  });

  it("does NOT call inner packager when classificationGate is BLOCKED", () => {
    const mockPack = vi.fn();
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    // Inject spy by replacing the packager's pack method
    (packer as unknown as { packager: { pack: typeof mockPack } }).packager.pack = mockPack;
    packer.pack(makeBlockedClassificationRequest());
    expect(mockPack).not.toHaveBeenCalled();
  });

  it("returns BLOCKED package when freshnessGate is BLOCKED", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makeBlockedFreshnessRequest());
    expect(result.innerPackage.packageId).toBe("BLOCKED");
  });

  it("returns BLOCKED package when classificationGate is CONDITIONAL (not PASS)", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makeConditionalClassificationRequest());
    expect(result.innerPackage.packageId).toBe("BLOCKED");
  });

  it("blocked evidence.rawContentReleased is false even when blocked", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makeBlockedClassificationRequest());
    expect(result.governanceEvidence.rawContentReleased).toBe(false);
  });

  it("blocked evidence.canBypassGovernance is false even when blocked", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makeBlockedClassificationRequest());
    expect(result.governanceEvidence.canBypassGovernance).toBe(false);
  });

  it("blocked evidence.classificationGate reflects the actual blocked gate value", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makeBlockedClassificationRequest());
    expect(result.governanceEvidence.classificationGate).toBe("BLOCKED");
  });

  it("blocked evidence.sourceArtifactIds is empty array", () => {
    const packer = createGovernedContextPackerContract({
      packagerDependencies: { now: () => FIXED_NOW },
    });
    const result = packer.pack(makeBlockedClassificationRequest());
    expect(result.governanceEvidence.sourceArtifactIds).toEqual([]);
  });
});

// --- Factory Test ---

describe("DSCP-T3: createGovernedContextPackerContract factory", () => {
  it("returns a GovernedContextPackerContract instance", () => {
    const packer = createGovernedContextPackerContract();
    expect(packer).toBeInstanceOf(GovernedContextPackerContract);
  });
});
