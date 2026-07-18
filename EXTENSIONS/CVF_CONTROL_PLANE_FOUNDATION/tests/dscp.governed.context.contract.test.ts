import { describe, it, expect } from "vitest";
import type {
  GovernanceGateSet,
  GovernedArtifactDescriptor,
  GovernanceContextEnvelope,
  GovernedContextPackRequest,
  GovernedContextPackageEvidence,
  GovernedContextPackage,
  ContentDeliveryClass,
  GovernedRetrievalReceipt,
} from "../src/dscp.governed.context.contract";
import type { ContextPackagerRequest, TypedContextPackage } from "../src/context.packager.contract";

// DSCP-T2: Governed Context Contract Shape Validation

// --- Fixtures ---

function makeGateSet(overrides: Partial<GovernanceGateSet> = {}): GovernanceGateSet {
  return {
    freshnessGate: "PASS",
    classificationGate: "PASS",
    eligibilityGate: "YES",
    ...overrides,
  };
}

function makeArtifactDescriptor(
  overrides: Partial<GovernedArtifactDescriptor> = {},
): GovernedArtifactDescriptor {
  return {
    artifactId: "DSCP-ART-001",
    sourceHash: "sha256:abc123",
    artifactRole: "corpus_candidate",
    contentClass: "policy_document",
    governanceGates: makeGateSet(),
    metadata: {},
    ...overrides,
  };
}

function makeContextEnvelope(
  overrides: Partial<GovernanceContextEnvelope> = {},
): GovernanceContextEnvelope {
  return {
    artifactDescriptors: [makeArtifactDescriptor()],
    classificationGate: "PASS",
    freshnessGate: "PASS",
    policyDecision: "Approved for context packaging under GC-018 DSCP-T2.",
    ...overrides,
  };
}

function makeInnerPackRequest(): ContextPackagerRequest {
  return {
    query: "What does the policy say about retention?",
    contextId: "ctx-dscp-001",
  };
}

function makeGovernedContextPackRequest(
  overrides: Partial<GovernedContextPackRequest> = {},
): GovernedContextPackRequest {
  return {
    packRequest: makeInnerPackRequest(),
    governanceEnvelope: makeContextEnvelope(),
    ...overrides,
  };
}

function makePackageEvidence(
  overrides: Partial<GovernedContextPackageEvidence> = {},
): GovernedContextPackageEvidence {
  return {
    classificationGate: "PASS",
    freshnessGate: "PASS",
    policyDecision: "Pack approved under GC-018 DSCP-T2.",
    sourceArtifactIds: ["DSCP-ART-001"],
    rawContentReleased: false,
    canBypassGovernance: false,
    ...overrides,
  };
}

function makeInnerPackage(): TypedContextPackage {
  return {
    packageId: "pkg-dscp-001",
    builtAt: "2026-06-07T00:00:00.000Z",
    contextId: "ctx-dscp-001",
    query: "What does the policy say about retention?",
    segments: [],
    totalSegments: 0,
    estimatedTokens: 0,
    perTypeTokens: { QUERY: 0, KNOWLEDGE: 0, CODE: 0, STRUCTURED: 0, METADATA: 0, SYSTEM: 0 },
    packageHash: "hash-abc",
  };
}

function makeGovernedPackage(
  overrides: Partial<GovernedContextPackage> = {},
): GovernedContextPackage {
  return {
    innerPackage: makeInnerPackage(),
    governanceEvidence: makePackageEvidence(),
    ...overrides,
  };
}

function makeRetrievalReceipt(
  overrides: Partial<GovernedRetrievalReceipt> = {},
): GovernedRetrievalReceipt {
  return {
    receiptId: "rcpt-dscp-001",
    query: "What does the policy say about retention?",
    queryTimestamp: "2026-06-07T00:00:00.000Z",
    contextPackageId: "pkg-dscp-001",
    governanceOutcome: "ANSWER_EMITTED",
    contentDeliveryClass: "DIRECT_ANSWER",
    freshnessDisclosureApplied: true,
    governanceGateResults: {},
    modelResponseHash: "resp-hash-xyz",
    sourceArtifactIds: ["DSCP-ART-001"],
    rawSourceReleased: false,
    ...overrides,
  };
}

// --- Tests ---

describe("DSCP-T2: GovernanceGateSet", () => {
  it("constructs with all required fields", () => {
    const g = makeGateSet();
    expect(g.freshnessGate).toBe("PASS");
    expect(g.classificationGate).toBe("PASS");
    expect(g.eligibilityGate).toBe("YES");
  });

  it("accepts all freshnessGate values", () => {
    const values = ["PASS", "BLOCKED", "NOT_APPLICABLE", "UNKNOWN"] as const;
    for (const v of values) {
      const g = makeGateSet({ freshnessGate: v });
      expect(g.freshnessGate).toBe(v);
    }
  });

  it("accepts all classificationGate values", () => {
    const values = ["PASS", "BLOCKED", "CONDITIONAL", "UNKNOWN"] as const;
    for (const v of values) {
      const g = makeGateSet({ classificationGate: v });
      expect(g.classificationGate).toBe(v);
    }
  });

  it("accepts all eligibilityGate values", () => {
    const values = ["YES", "NO", "CONDITIONAL", "UNKNOWN"] as const;
    for (const v of values) {
      const g = makeGateSet({ eligibilityGate: v });
      expect(g.eligibilityGate).toBe(v);
    }
  });

  it("accepts domain-specific customGates open map", () => {
    const g = makeGateSet({
      customGates: { ec02Gate: "PASS", t12Eligible: "CONDITIONAL" },
    });
    expect(g.customGates?.["ec02Gate"]).toBe("PASS");
    expect(g.customGates?.["t12Eligible"]).toBe("CONDITIONAL");
  });

  it("omits customGates when not supplied", () => {
    const g = makeGateSet();
    expect(g.customGates).toBeUndefined();
  });
});

describe("DSCP-T2: GovernedArtifactDescriptor", () => {
  it("constructs with all required fields", () => {
    const d = makeArtifactDescriptor();
    expect(d.artifactId).toBe("DSCP-ART-001");
    expect(d.sourceHash).toBe("sha256:abc123");
    expect(d.artifactRole).toBe("corpus_candidate");
    expect(d.contentClass).toBe("policy_document");
  });

  it("accepts all artifactRole values", () => {
    const roles = ["corpus_candidate", "reference", "template", "operational"] as const;
    for (const role of roles) {
      const d = makeArtifactDescriptor({ artifactRole: role });
      expect(d.artifactRole).toBe(role);
    }
  });

  it("accepts domain-specific metadata bag", () => {
    const d = makeArtifactDescriptor({
      metadata: { jurisdiction: "VN", authorityLevel: "primary" },
    });
    expect(d.metadata["jurisdiction"]).toBe("VN");
    expect(d.metadata["authorityLevel"]).toBe("primary");
  });

  it("accepts empty metadata bag", () => {
    const d = makeArtifactDescriptor({ metadata: {} });
    expect(Object.keys(d.metadata)).toHaveLength(0);
  });
});

describe("DSCP-T2: GovernanceContextEnvelope", () => {
  it("constructs with all required fields", () => {
    const e = makeContextEnvelope();
    expect(e.artifactDescriptors).toHaveLength(1);
    expect(e.classificationGate).toBe("PASS");
    expect(e.freshnessGate).toBe("PASS");
    expect(typeof e.policyDecision).toBe("string");
  });

  it("accepts authorizationRef when supplied", () => {
    const e = makeContextEnvelope({
      authorizationRef: "docs/baselines/CVF_GC018_DSCP_T2_STANDARD_CONTRACT_AUTHORING_2026-06-07.md",
    });
    expect(e.authorizationRef).toContain("GC018_DSCP_T2");
  });

  it("omits authorizationRef when not supplied", () => {
    const e = makeContextEnvelope();
    expect(e.authorizationRef).toBeUndefined();
  });
});

describe("DSCP-T2: GovernedContextPackRequest", () => {
  it("wraps a valid ContextPackagerRequest", () => {
    const req = makeGovernedContextPackRequest();
    expect(req.packRequest.query).toBe("What does the policy say about retention?");
    expect(req.packRequest.contextId).toBe("ctx-dscp-001");
  });

  it("carries governance envelope alongside the inner request", () => {
    const req = makeGovernedContextPackRequest();
    expect(req.governanceEnvelope.classificationGate).toBe("PASS");
    expect(req.governanceEnvelope.policyDecision).toContain("GC-018");
  });
});

describe("DSCP-T2: GovernedContextPackageEvidence - governance lock literals", () => {
  it("rawContentReleased is always false (literal type)", () => {
    const e = makePackageEvidence();
    expect(e.rawContentReleased).toBe(false);
    // TypeScript literal type: only `false` is assignable
    const lock: false = e.rawContentReleased;
    expect(lock).toBe(false);
  });

  it("canBypassGovernance is always false (literal type)", () => {
    const e = makePackageEvidence();
    expect(e.canBypassGovernance).toBe(false);
    const lock: false = e.canBypassGovernance;
    expect(lock).toBe(false);
  });

  it("carries sourceArtifactIds", () => {
    const e = makePackageEvidence({ sourceArtifactIds: ["DSCP-ART-001", "DSCP-ART-002"] });
    expect(e.sourceArtifactIds).toHaveLength(2);
  });

  it("accepts optional authorizationRef", () => {
    const e = makePackageEvidence({ authorizationRef: "docs/baselines/CVF_GC018_DSCP_T2_STANDARD_CONTRACT_AUTHORING_2026-06-07.md" });
    expect(e.authorizationRef).toContain("GC018_DSCP_T2");
  });
});

describe("DSCP-T2: GovernedContextPackage", () => {
  it("wraps a TypedContextPackage as innerPackage", () => {
    const pkg = makeGovernedPackage();
    expect(pkg.innerPackage.packageId).toBe("pkg-dscp-001");
    expect(pkg.innerPackage.contextId).toBe("ctx-dscp-001");
  });

  it("carries governance evidence block", () => {
    const pkg = makeGovernedPackage();
    expect(pkg.governanceEvidence.classificationGate).toBe("PASS");
    expect(pkg.governanceEvidence.rawContentReleased).toBe(false);
    expect(pkg.governanceEvidence.canBypassGovernance).toBe(false);
  });
});

describe("DSCP-T2: ContentDeliveryClass", () => {
  it("accepts all four ContentDeliveryClass values", () => {
    const values: ContentDeliveryClass[] = [
      "DIRECT_ANSWER",
      "SUMMARIZED_ANSWER",
      "GUIDED_RESPONSE",
      "ESCALATE_OR_ABSTAIN",
    ];
    for (const v of values) {
      expect(typeof v).toBe("string");
    }
    expect(values).toHaveLength(4);
  });
});

describe("DSCP-T2: GovernedRetrievalReceipt - governance lock and open maps", () => {
  it("constructs with all required fields", () => {
    const r = makeRetrievalReceipt();
    expect(r.receiptId).toBe("rcpt-dscp-001");
    expect(r.contextPackageId).toBe("pkg-dscp-001");
    expect(r.governanceOutcome).toBe("ANSWER_EMITTED");
    expect(r.contentDeliveryClass).toBe("DIRECT_ANSWER");
  });

  it("rawSourceReleased is always false (literal type)", () => {
    const r = makeRetrievalReceipt();
    expect(r.rawSourceReleased).toBe(false);
    const lock: false = r.rawSourceReleased;
    expect(lock).toBe(false);
  });

  it("accepts all governanceOutcome values", () => {
    const outcomes = ["ANSWER_EMITTED", "ABSTAINED", "ESCALATED", "BLOCKED"] as const;
    for (const o of outcomes) {
      const r = makeRetrievalReceipt({ governanceOutcome: o });
      expect(r.governanceOutcome).toBe(o);
    }
  });

  it("accepts ESCALATE_OR_ABSTAIN contentDeliveryClass", () => {
    const r = makeRetrievalReceipt({ contentDeliveryClass: "ESCALATE_OR_ABSTAIN" });
    expect(r.contentDeliveryClass).toBe("ESCALATE_OR_ABSTAIN");
  });

  it("accepts domain-specific governanceGateResults open map", () => {
    const r = makeRetrievalReceipt({
      governanceGateResults: {
        phase1ReceiptType: "NO_RESULTS",
        conflictFlag: "false",
        stalenessFlag: "true",
      },
    });
    expect(r.governanceGateResults["phase1ReceiptType"]).toBe("NO_RESULTS");
    expect(r.governanceGateResults["conflictFlag"]).toBe("false");
  });

  it("carries sourceArtifactIds", () => {
    const r = makeRetrievalReceipt({ sourceArtifactIds: ["DSCP-ART-001"] });
    expect(r.sourceArtifactIds).toContain("DSCP-ART-001");
  });

  it("records modelResponseHash", () => {
    const r = makeRetrievalReceipt({ modelResponseHash: "sha256:response-hash" });
    expect(r.modelResponseHash).toBe("sha256:response-hash");
  });

  it("freshnessDisclosureApplied is boolean", () => {
    const r1 = makeRetrievalReceipt({ freshnessDisclosureApplied: true });
    const r2 = makeRetrievalReceipt({ freshnessDisclosureApplied: false });
    expect(r1.freshnessDisclosureApplied).toBe(true);
    expect(r2.freshnessDisclosureApplied).toBe(false);
  });
});
