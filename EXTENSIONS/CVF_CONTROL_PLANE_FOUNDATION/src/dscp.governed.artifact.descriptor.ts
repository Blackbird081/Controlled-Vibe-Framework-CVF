import type {
  GovernedArtifactDescriptor,
  GovernanceGateSet,
} from "./dscp.governed.context.contract";

// --- DSCP-T6 Scan Descriptor Runtime ---
// Tranche: DSCP-T6
// Authorization: docs/baselines/CVF_GC018_DSCP_T6_SCAN_DESCRIPTOR_RUNTIME_2026-06-08.md

// Input for building a governed artifact descriptor.
export interface GovernedArtifactDescriptorInput {
  artifactId: string;
  sourceHash: string;
  artifactRole: GovernedArtifactDescriptor["artifactRole"];
  contentClass: string;
  governanceGates: GovernanceGateSet;
  metadata?: Record<string, string>;
}

// Result of buildGovernedArtifactDescriptor().
// blocked=true means at least one gate was BLOCKED; descriptor is null.
export interface GovernedArtifactDescriptorResult {
  descriptor: GovernedArtifactDescriptor | null;
  blocked: boolean;
  blockReason?: string;
}

// Build a GovernedArtifactDescriptor from caller-supplied scan metadata.
// Enforces classificationGate and freshnessGate before constructing.
// Deterministic local function; no provider call or external I/O.
export function buildGovernedArtifactDescriptor(
  input: GovernedArtifactDescriptorInput,
): GovernedArtifactDescriptorResult {
  if (input.governanceGates.classificationGate === "BLOCKED") {
    return {
      descriptor: null,
      blocked: true,
      blockReason: `classificationGate=BLOCKED for artifact ${input.artifactId}`,
    };
  }

  if (input.governanceGates.freshnessGate === "BLOCKED") {
    return {
      descriptor: null,
      blocked: true,
      blockReason: `freshnessGate=BLOCKED for artifact ${input.artifactId}`,
    };
  }

  const descriptor: GovernedArtifactDescriptor = {
    artifactId: input.artifactId,
    sourceHash: input.sourceHash,
    artifactRole: input.artifactRole,
    contentClass: input.contentClass,
    governanceGates: input.governanceGates,
    metadata: input.metadata ?? {},
  };

  return { descriptor, blocked: false };
}
