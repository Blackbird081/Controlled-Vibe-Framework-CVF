import { describe, it, expect } from "vitest";
import {
  buildGovernedArtifactDescriptor,
  type GovernedArtifactDescriptorInput,
} from "../src/dscp.governed.artifact.descriptor";

// --- DSCP-T6 Scan Descriptor Runtime Tests ---
// Authorization: docs/baselines/CVF_GC018_DSCP_T6_SCAN_DESCRIPTOR_RUNTIME_2026-06-08.md

const baseInput: GovernedArtifactDescriptorInput = {
  artifactId: "T6-ART-001",
  sourceHash: "sha256-abcdef1234567890",
  artifactRole: "corpus_candidate",
  contentClass: "policy_document",
  governanceGates: {
    freshnessGate: "PASS",
    classificationGate: "PASS",
    eligibilityGate: "YES",
  },
};

describe("buildGovernedArtifactDescriptor", () => {
  it("PASS path: returns non-null descriptor with correct fields", () => {
    const result = buildGovernedArtifactDescriptor(baseInput);

    expect(result.blocked).toBe(false);
    expect(result.blockReason).toBeUndefined();
    expect(result.descriptor).not.toBeNull();

    const d = result.descriptor!;
    expect(d.artifactId).toBe("T6-ART-001");
    expect(d.sourceHash).toBe("sha256-abcdef1234567890");
    expect(d.artifactRole).toBe("corpus_candidate");
    expect(d.contentClass).toBe("policy_document");
    expect(d.governanceGates.freshnessGate).toBe("PASS");
    expect(d.governanceGates.classificationGate).toBe("PASS");
  });

  it("BLOCKED classificationGate: returns blocked=true, descriptor=null", () => {
    const input: GovernedArtifactDescriptorInput = {
      ...baseInput,
      governanceGates: { ...baseInput.governanceGates, classificationGate: "BLOCKED" },
    };

    const result = buildGovernedArtifactDescriptor(input);

    expect(result.blocked).toBe(true);
    expect(result.descriptor).toBeNull();
    expect(result.blockReason).toBeDefined();
    expect(result.blockReason).toContain("classificationGate=BLOCKED");
    expect(result.blockReason).toContain("T6-ART-001");
  });

  it("BLOCKED freshnessGate: returns blocked=true, descriptor=null", () => {
    const input: GovernedArtifactDescriptorInput = {
      ...baseInput,
      governanceGates: { ...baseInput.governanceGates, freshnessGate: "BLOCKED" },
    };

    const result = buildGovernedArtifactDescriptor(input);

    expect(result.blocked).toBe(true);
    expect(result.descriptor).toBeNull();
    expect(result.blockReason).toBeDefined();
    expect(result.blockReason).toContain("freshnessGate=BLOCKED");
    expect(result.blockReason).toContain("T6-ART-001");
  });

  it("CONDITIONAL classificationGate: passes through, descriptor returned", () => {
    const input: GovernedArtifactDescriptorInput = {
      ...baseInput,
      governanceGates: { ...baseInput.governanceGates, classificationGate: "CONDITIONAL" },
    };

    const result = buildGovernedArtifactDescriptor(input);

    expect(result.blocked).toBe(false);
    expect(result.descriptor).not.toBeNull();
    expect(result.descriptor!.governanceGates.classificationGate).toBe("CONDITIONAL");
  });

  it("UNKNOWN freshnessGate: passes through, descriptor returned", () => {
    const input: GovernedArtifactDescriptorInput = {
      ...baseInput,
      governanceGates: { ...baseInput.governanceGates, freshnessGate: "UNKNOWN" },
    };

    const result = buildGovernedArtifactDescriptor(input);

    expect(result.blocked).toBe(false);
    expect(result.descriptor).not.toBeNull();
    expect(result.descriptor!.governanceGates.freshnessGate).toBe("UNKNOWN");
  });

  it("metadata default: omitting metadata yields descriptor.metadata={}", () => {
    const { metadata: _m, ...inputWithoutMeta } = baseInput;
    const result = buildGovernedArtifactDescriptor(inputWithoutMeta);

    expect(result.blocked).toBe(false);
    expect(result.descriptor!.metadata).toEqual({});
  });

  it("metadata provided: descriptor preserves provided metadata", () => {
    const input: GovernedArtifactDescriptorInput = {
      ...baseInput,
      metadata: { jurisdiction: "VN", authorityLevel: "3" },
    };

    const result = buildGovernedArtifactDescriptor(input);

    expect(result.descriptor!.metadata).toEqual({ jurisdiction: "VN", authorityLevel: "3" });
  });

  it("customGates preserved: governanceGates.customGates carried to descriptor", () => {
    const input: GovernedArtifactDescriptorInput = {
      ...baseInput,
      governanceGates: {
        ...baseInput.governanceGates,
        customGates: { ec02Gate: "PASS", t12Eligible: "NO" },
      },
    };

    const result = buildGovernedArtifactDescriptor(input);

    expect(result.blocked).toBe(false);
    expect(result.descriptor!.governanceGates.customGates).toEqual({
      ec02Gate: "PASS",
      t12Eligible: "NO",
    });
  });

  it("artifactRole: corpus_candidate", () => {
    const result = buildGovernedArtifactDescriptor({ ...baseInput, artifactRole: "corpus_candidate" });
    expect(result.descriptor!.artifactRole).toBe("corpus_candidate");
  });

  it("artifactRole: reference", () => {
    const result = buildGovernedArtifactDescriptor({ ...baseInput, artifactRole: "reference" });
    expect(result.descriptor!.artifactRole).toBe("reference");
  });

  it("artifactRole: template", () => {
    const result = buildGovernedArtifactDescriptor({ ...baseInput, artifactRole: "template" });
    expect(result.descriptor!.artifactRole).toBe("template");
  });

  it("artifactRole: operational", () => {
    const result = buildGovernedArtifactDescriptor({ ...baseInput, artifactRole: "operational" });
    expect(result.descriptor!.artifactRole).toBe("operational");
  });
});
