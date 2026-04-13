import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

/**
 * Artifact types per CVF_COMPILED_KNOWLEDGE_ARTIFACT_STANDARD_2026-04-14.md §3.
 * W72-T4: CompiledKnowledgeArtifact implementation — Knowledge Layer only.
 */
export type CompiledArtifactType = "concept" | "entity" | "summary";

/**
 * Governance lifecycle state per artifact standard §7.
 * pending: produced by Compile step; not yet passed Govern step.
 * approved: passed Govern step; may enter Query pool.
 * rejected: failed Govern step; must not enter Query pool.
 */
export type GovernanceStatus = "pending" | "approved" | "rejected";

export interface CompiledKnowledgeArtifactCompileRequest {
  contextId: string;
  artifactType: CompiledArtifactType;
  sourceIds: string[];     // 1+ raw source record IDs (Ingest step output)
  citationRef: string;     // human-readable citation of raw source(s)
  citationTrail: string[]; // ordered chain from raw ingest to this artifact
  compiledBy: string;      // agent or process identity performing compilation
  content: string;         // governed artifact content
}

export interface CompiledKnowledgeArtifact {
  artifactId: string;
  artifactType: CompiledArtifactType;
  compiledAt: string;
  sourceIds: string[];
  citationRef: string;
  citationTrail: string[];
  contextId: string;
  compiledBy: string;
  content: string;
  artifactHash: string;         // deterministic hash of content at compile time
  governedAt: string | null;    // null until Govern step runs
  governanceStatus: GovernanceStatus;
}

export interface GovernDecision {
  decision: "approved" | "rejected";
  reason?: string;
}

export interface CompiledKnowledgeArtifactContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class CompiledKnowledgeArtifactContract {
  private readonly now: () => string;

  constructor(dependencies: CompiledKnowledgeArtifactContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  /**
   * Compile step (Step 2 in lifecycle).
   * Produces a Compiled Knowledge Artifact with governanceStatus: "pending".
   * artifactHash is bound to actual content, sources, and citation trail.
   */
  compile(request: CompiledKnowledgeArtifactCompileRequest): CompiledKnowledgeArtifact {
    const compiledAt = this.now();

    // Deterministic structural content signatures
    const sourceIdsSig = [...request.sourceIds].sort().join(",");
    const citationTrailSig = request.citationTrail.join("|");

    const artifactHash = computeDeterministicHash(
      "w72-t4-cp2-compiled-artifact",
      `${compiledAt}:${request.contextId}`,
      `type:${request.artifactType}`,
      `sources:[${sourceIdsSig}]`,
      `citationTrail:[${citationTrailSig}]`,
      `compiledBy:${request.compiledBy}`,
      `content:${request.content}`,
    );

    const artifactId = computeDeterministicHash(
      "w72-t4-cp2-compiled-artifact-id",
      artifactHash,
      compiledAt,
    );

    return {
      artifactId,
      artifactType: request.artifactType,
      compiledAt,
      sourceIds: [...request.sourceIds],
      citationRef: request.citationRef,
      citationTrail: [...request.citationTrail],
      contextId: request.contextId,
      compiledBy: request.compiledBy,
      content: request.content,
      artifactHash,
      governedAt: null,
      governanceStatus: "pending",
    };
  }

  /**
   * Govern step (Step 3 in lifecycle).
   * Transitions a pending artifact to approved or rejected.
   * artifactHash is NOT changed — it was set at compile time and reflects content.
   * Throws if artifact is not in pending state.
   */
  govern(
    artifact: CompiledKnowledgeArtifact,
    govDecision: GovernDecision,
  ): CompiledKnowledgeArtifact {
    if (artifact.governanceStatus !== "pending") {
      throw new Error(
        `CompiledKnowledgeArtifact ${artifact.artifactId} cannot be governed from status "${artifact.governanceStatus}"`,
      );
    }

    const governedAt = this.now();

    return {
      ...artifact,
      governedAt,
      governanceStatus: govDecision.decision,
    };
  }
}

export function createCompiledKnowledgeArtifactContract(
  dependencies?: CompiledKnowledgeArtifactContractDependencies,
): CompiledKnowledgeArtifactContract {
  return new CompiledKnowledgeArtifactContract(dependencies);
}
