import { describe, it, expect } from "vitest";
import { buildGovernedRetrievalReceipt } from "../src/dscp.governed.retrieval.receipt";
import type { GovernedRetrievalReceiptInput } from "../src/dscp.governed.retrieval.receipt";
import type { GovernedContextPackage } from "../src/dscp.governed.context.contract";

// DSCP-T4: buildGovernedRetrievalReceipt Deterministic Tests

// --- Fixtures ---

const FIXED_NOW = "2026-06-07T00:00:00.000Z";

function makeContextPackage(
  packageId = "pkg-dscp-t4-001",
  classificationGate: "PASS" | "BLOCKED" | "CONDITIONAL" = "PASS",
  freshnessGate: "PASS" | "BLOCKED" | "NOT_APPLICABLE" = "PASS",
): GovernedContextPackage {
  return {
    innerPackage: {
      packageId,
      builtAt: FIXED_NOW,
      contextId: "ctx-dscp-t4-001",
      query: "What is the retrieval receipt standard?",
      segments: [],
      totalSegments: 0,
      estimatedTokens: 0,
      perTypeTokens: { QUERY: 0, KNOWLEDGE: 0, CODE: 0, STRUCTURED: 0, METADATA: 0, SYSTEM: 0 },
      packageHash: "deadbeef1234",
    },
    governanceEvidence: {
      classificationGate,
      freshnessGate,
      policyDecision: "All gates PASS; pack authorized.",
      sourceArtifactIds: ["art-dscp-001", "art-dscp-002"],
      rawContentReleased: false,
      canBypassGovernance: false,
      authorizationRef: "docs/baselines/CVF_GC018_DSCP_T4_RETRIEVAL_RECEIPT_RUNTIME_BOUNDARY_2026-06-07.md",
    },
  };
}

function makeInput(
  overrides: Partial<GovernedRetrievalReceiptInput> = {},
): GovernedRetrievalReceiptInput {
  return {
    receiptId: "rcpt-dscp-t4-001",
    query: "What is the retrieval receipt standard?",
    queryTimestamp: FIXED_NOW,
    contextPackage: makeContextPackage(),
    governanceOutcome: "ANSWER_EMITTED",
    contentDeliveryClass: "DIRECT_ANSWER",
    freshnessDisclosureApplied: true,
    modelResponseHash: "abc123modelresponsehash",
    ...overrides,
  };
}

// --- Static Metadata Tests ---

describe("DSCP-T4: buildGovernedRetrievalReceipt - static metadata", () => {
  it("maps receiptId from input", () => {
    const receipt = buildGovernedRetrievalReceipt(makeInput());
    expect(receipt.receiptId).toBe("rcpt-dscp-t4-001");
  });

  it("maps query from input", () => {
    const receipt = buildGovernedRetrievalReceipt(makeInput());
    expect(receipt.query).toBe("What is the retrieval receipt standard?");
  });

  it("maps queryTimestamp from input", () => {
    const receipt = buildGovernedRetrievalReceipt(makeInput());
    expect(receipt.queryTimestamp).toBe(FIXED_NOW);
  });

  it("maps governanceOutcome from input", () => {
    const receipt = buildGovernedRetrievalReceipt(makeInput());
    expect(receipt.governanceOutcome).toBe("ANSWER_EMITTED");
  });

  it("maps contentDeliveryClass from input", () => {
    const receipt = buildGovernedRetrievalReceipt(makeInput());
    expect(receipt.contentDeliveryClass).toBe("DIRECT_ANSWER");
  });

  it("maps freshnessDisclosureApplied from input", () => {
    const receipt = buildGovernedRetrievalReceipt(makeInput());
    expect(receipt.freshnessDisclosureApplied).toBe(true);
  });

  it("maps modelResponseHash from input without modification", () => {
    const receipt = buildGovernedRetrievalReceipt(makeInput());
    expect(receipt.modelResponseHash).toBe("abc123modelresponsehash");
  });
});

// --- Package ID Mapping ---

describe("DSCP-T4: buildGovernedRetrievalReceipt - contextPackageId mapping", () => {
  it("sets contextPackageId from contextPackage.innerPackage.packageId", () => {
    const receipt = buildGovernedRetrievalReceipt(makeInput());
    expect(receipt.contextPackageId).toBe("pkg-dscp-t4-001");
  });

  it("uses packageId from a custom package (not hardcoded)", () => {
    const input = makeInput({ contextPackage: makeContextPackage("pkg-custom-999") });
    const receipt = buildGovernedRetrievalReceipt(input);
    expect(receipt.contextPackageId).toBe("pkg-custom-999");
  });
});

// --- Source Artifact IDs ---

describe("DSCP-T4: buildGovernedRetrievalReceipt - sourceArtifactIds", () => {
  it("copies sourceArtifactIds from package governanceEvidence", () => {
    const receipt = buildGovernedRetrievalReceipt(makeInput());
    expect(receipt.sourceArtifactIds).toEqual(["art-dscp-001", "art-dscp-002"]);
  });

  it("uses sourceArtifactIds from custom package (not hardcoded)", () => {
    const pkg = makeContextPackage();
    pkg.governanceEvidence.sourceArtifactIds = ["custom-art-X"];
    const receipt = buildGovernedRetrievalReceipt(makeInput({ contextPackage: pkg }));
    expect(receipt.sourceArtifactIds).toEqual(["custom-art-X"]);
  });

  it("snapshots sourceArtifactIds instead of retaining the package array reference", () => {
    const pkg = makeContextPackage();
    const receipt = buildGovernedRetrievalReceipt(makeInput({ contextPackage: pkg }));
    pkg.governanceEvidence.sourceArtifactIds.push("late-artifact");
    expect(receipt.sourceArtifactIds).toEqual(["art-dscp-001", "art-dscp-002"]);
  });
});

// --- Package Gate Results Preservation ---

describe("DSCP-T4: buildGovernedRetrievalReceipt - gate results from package evidence", () => {
  it("copies classificationGate from package evidence", () => {
    const receipt = buildGovernedRetrievalReceipt(makeInput());
    expect(receipt.governanceGateResults["classificationGate"]).toBe("PASS");
  });

  it("copies freshnessGate from package evidence", () => {
    const receipt = buildGovernedRetrievalReceipt(makeInput());
    expect(receipt.governanceGateResults["freshnessGate"]).toBe("PASS");
  });

  it("reflects BLOCKED classificationGate from package evidence", () => {
    const input = makeInput({ contextPackage: makeContextPackage("pkg-blk-001", "BLOCKED") });
    const receipt = buildGovernedRetrievalReceipt(input);
    expect(receipt.governanceGateResults["classificationGate"]).toBe("BLOCKED");
  });

  it("reflects BLOCKED freshnessGate from package evidence", () => {
    const input = makeInput({
      contextPackage: makeContextPackage("pkg-blk-002", "PASS", "BLOCKED"),
    });
    const receipt = buildGovernedRetrievalReceipt(input);
    expect(receipt.governanceGateResults["freshnessGate"]).toBe("BLOCKED");
  });
});

// --- Caller Gate Override Prevention ---

describe("DSCP-T4: buildGovernedRetrievalReceipt - caller cannot override package gates", () => {
  it("package classificationGate wins over caller-supplied value for same key", () => {
    const input = makeInput({
      governanceGateResults: { classificationGate: "CONDITIONAL" },
    });
    const receipt = buildGovernedRetrievalReceipt(input);
    expect(receipt.governanceGateResults["classificationGate"]).toBe("PASS");
  });

  it("package freshnessGate wins over caller-supplied value for same key", () => {
    const input = makeInput({
      governanceGateResults: { freshnessGate: "NOT_APPLICABLE" },
    });
    const receipt = buildGovernedRetrievalReceipt(input);
    expect(receipt.governanceGateResults["freshnessGate"]).toBe("PASS");
  });

  it("retains additional caller governanceGateResults keys that do not conflict", () => {
    const input = makeInput({
      governanceGateResults: { customDomainGate: "DOMAIN_PASS" },
    });
    const receipt = buildGovernedRetrievalReceipt(input);
    expect(receipt.governanceGateResults["customDomainGate"]).toBe("DOMAIN_PASS");
  });

  it("has both package gates and additional caller keys in final map", () => {
    const input = makeInput({
      governanceGateResults: { extraGate: "EXTRA_PASS" },
    });
    const receipt = buildGovernedRetrievalReceipt(input);
    expect(Object.keys(receipt.governanceGateResults)).toContain("classificationGate");
    expect(Object.keys(receipt.governanceGateResults)).toContain("freshnessGate");
    expect(Object.keys(receipt.governanceGateResults)).toContain("extraGate");
  });
});

// --- Governance Lock ---

describe("DSCP-T4: buildGovernedRetrievalReceipt - rawSourceReleased lock", () => {
  it("rawSourceReleased is always literal false", () => {
    const receipt = buildGovernedRetrievalReceipt(makeInput());
    expect(receipt.rawSourceReleased).toBe(false);
  });

  it("rawSourceReleased is false even with different package and outcome", () => {
    const input = makeInput({
      contextPackage: makeContextPackage("pkg-variant-001", "CONDITIONAL"),
      governanceOutcome: "ABSTAINED",
    });
    const receipt = buildGovernedRetrievalReceipt(input);
    expect(receipt.rawSourceReleased).toBe(false);
  });
});

// --- modelResponseHash caller-supply ---

describe("DSCP-T4: buildGovernedRetrievalReceipt - modelResponseHash", () => {
  it("carries caller-supplied modelResponseHash unchanged", () => {
    const input = makeInput({ modelResponseHash: "sha256-caller-supplied-value" });
    const receipt = buildGovernedRetrievalReceipt(input);
    expect(receipt.modelResponseHash).toBe("sha256-caller-supplied-value");
  });

  it("does not produce a hash when input hash is empty string (caller-supplied)", () => {
    const input = makeInput({ modelResponseHash: "" });
    const receipt = buildGovernedRetrievalReceipt(input);
    expect(receipt.modelResponseHash).toBe("");
  });
});
