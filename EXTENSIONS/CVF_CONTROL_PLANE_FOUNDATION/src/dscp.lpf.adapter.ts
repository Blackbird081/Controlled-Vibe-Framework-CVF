import type { MemoryContextBlock } from "../../CVF_LEARNING_PLANE_FOUNDATION/src/memory-context-packager";
import type { TypedContextPackage } from "./context.packager.contract";
import type {
  GovernedContextPackage,
  GovernedContextPackageEvidence,
  GovernanceContextEnvelope,
} from "./dscp.governed.context.contract";

function buildTypedContextPackageStub(
  block: MemoryContextBlock,
  artifactId: string,
): TypedContextPackage {
  return {
    packageId: `dscp-lpf-${artifactId}`,
    builtAt: block.evidence.contractVersion,
    contextId: artifactId,
    query: block.text,
    segments: [
      {
        segmentId: `dscp-lpf-segment-${artifactId}`,
        segmentType: "KNOWLEDGE",
        content: block.text,
        tokenEstimate: block.tokenEstimate,
        priorityRank: 1,
        source: artifactId,
      },
    ],
    totalSegments: 1,
    estimatedTokens: block.tokenEstimate,
    perTypeTokens: {
      QUERY: 0,
      KNOWLEDGE: block.tokenEstimate,
      CODE: 0,
      STRUCTURED: 0,
      METADATA: 0,
      SYSTEM: 0,
    },
    packageHash: `dscp-lpf-hash-${artifactId}-${block.tokenEstimate}`,
  };
}

export function buildLPFGovernedPackage(
  block: MemoryContextBlock,
  artifactId: string,
  envelope: GovernanceContextEnvelope,
): GovernedContextPackage {
  const governanceEvidence: GovernedContextPackageEvidence = {
    classificationGate: envelope.classificationGate,
    freshnessGate: envelope.freshnessGate,
    policyDecision: envelope.policyDecision,
    sourceArtifactIds: [artifactId],
    rawContentReleased: false,
    canBypassGovernance: false,
    authorizationRef: envelope.authorizationRef,
  };

  return {
    innerPackage: buildTypedContextPackageStub(block, artifactId),
    governanceEvidence,
  };
}
