import {
  ContextPackagerContract,
  createContextPackagerContract,
  type ContextPackagerContractDependencies,
} from "./context.packager.contract";
import type {
  GovernedContextPackRequest,
  GovernedContextPackage,
  GovernedContextPackageEvidence,
} from "./dscp.governed.context.contract";

// --- DSCP-T3: Governed Context Packer ---
// Tranche: DSCP-T3 (CPF Internal Runtime Pilot)
// Authorization: docs/baselines/CVF_GC018_DSCP_T3_RUNTIME_PILOT_CPF_INTERNAL_2026-06-07.md

// --- Blocked Package Helper ---

function makeBlockedPackage(
  envelope: GovernedContextPackRequest["governanceEnvelope"],
  reason: string,
): GovernedContextPackage {
  const evidence: GovernedContextPackageEvidence = {
    classificationGate: envelope.classificationGate,
    freshnessGate: envelope.freshnessGate,
    policyDecision: reason,
    sourceArtifactIds: [],
    rawContentReleased: false,
    canBypassGovernance: false,
  };
  return {
    innerPackage: {
      packageId: "BLOCKED",
      builtAt: "",
      contextId: "",
      query: "",
      segments: [],
      totalSegments: 0,
      estimatedTokens: 0,
      perTypeTokens: { QUERY: 0, KNOWLEDGE: 0, CODE: 0, STRUCTURED: 0, METADATA: 0, SYSTEM: 0 },
      packageHash: "",
    },
    governanceEvidence: evidence,
  };
}

// --- Contract ---

export interface GovernedContextPackerContractDependencies {
  packagerDependencies?: ContextPackagerContractDependencies;
}

export class GovernedContextPackerContract {
  private readonly packager: ContextPackagerContract;

  constructor(dependencies: GovernedContextPackerContractDependencies = {}) {
    this.packager = createContextPackagerContract(
      dependencies.packagerDependencies,
    );
  }

  pack(request: GovernedContextPackRequest): GovernedContextPackage {
    const envelope = request.governanceEnvelope;

    // Gate enforcement: classificationGate and freshnessGate must both be PASS
    if (
      envelope.classificationGate !== "PASS" ||
      envelope.freshnessGate !== "PASS"
    ) {
      return makeBlockedPackage(
        envelope,
        `BLOCKED: governance gate not PASS (classificationGate=${envelope.classificationGate}, freshnessGate=${envelope.freshnessGate})`,
      );
    }

    // Gates PASS: call inner packager
    const innerPackage = this.packager.pack(request.packRequest);

    const evidence: GovernedContextPackageEvidence = {
      classificationGate: envelope.classificationGate,
      freshnessGate: envelope.freshnessGate,
      policyDecision: envelope.policyDecision,
      sourceArtifactIds: envelope.artifactDescriptors.map(
        (a) => a.artifactId,
      ),
      rawContentReleased: false,
      canBypassGovernance: false,
      ...(envelope.authorizationRef !== undefined
        ? { authorizationRef: envelope.authorizationRef }
        : {}),
    };

    return {
      innerPackage,
      governanceEvidence: evidence,
    };
  }
}

// --- Factory ---

export function createGovernedContextPackerContract(
  dependencies?: GovernedContextPackerContractDependencies,
): GovernedContextPackerContract {
  return new GovernedContextPackerContract(dependencies);
}
