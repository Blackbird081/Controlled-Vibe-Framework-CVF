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
  rejectionReason: string | null;
}

export interface GovernDecision {
  decision: "approved" | "rejected";
  reason?: string;
}

export interface CompiledKnowledgeArtifactContractDependencies {
  now?: () => string;
}

function normalizeText(value: string): string {
  return value.trim();
}

function normalizeNonEmptyList(values: string[], fieldName: string): string[] {
  const normalized = values
    .map((value) => normalizeText(value))
    .filter((value) => value.length > 0);

  if (normalized.length === 0) {
    throw new Error(`CompiledKnowledgeArtifact compile requires a non-empty ${fieldName} list`);
  }

  return normalized;
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
    const contextId = normalizeText(request.contextId);
    if (contextId.length === 0) {
      throw new Error("CompiledKnowledgeArtifact compile requires contextId");
    }

    const sourceIds = normalizeNonEmptyList(request.sourceIds, "sourceIds");

    const citationRef = normalizeText(request.citationRef);
    if (citationRef.length === 0) {
      throw new Error("CompiledKnowledgeArtifact compile requires citationRef");
    }

    const citationTrail = normalizeNonEmptyList(request.citationTrail, "citationTrail");

    const compiledBy = normalizeText(request.compiledBy);
    if (compiledBy.length === 0) {
      throw new Error("CompiledKnowledgeArtifact compile requires compiledBy");
    }

    const content = normalizeText(request.content);
    if (content.length === 0) {
      throw new Error("CompiledKnowledgeArtifact compile requires content");
    }

    const compiledAt = this.now();

    // Deterministic structural content signatures
    const sourceIdsSig = [...sourceIds].sort().join(",");
    const citationTrailSig = citationTrail.join("|");

    const artifactHash = computeDeterministicHash(
      "w72-t4-cp2-compiled-artifact",
      `context:${contextId}`,
      `type:${request.artifactType}`,
      `sources:[${sourceIdsSig}]`,
      `citationRef:${citationRef}`,
      `citationTrail:[${citationTrailSig}]`,
      `compiledBy:${compiledBy}`,
      `content:${content}`,
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
      sourceIds,
      citationRef,
      citationTrail,
      contextId,
      compiledBy,
      content,
      artifactHash,
      governedAt: null,
      governanceStatus: "pending",
      rejectionReason: null,
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
      rejectionReason:
        govDecision.decision === "rejected"
          ? normalizeText(govDecision.reason ?? "") || "Govern step rejected artifact"
          : null,
    };
  }
}

export function createCompiledKnowledgeArtifactContract(
  dependencies?: CompiledKnowledgeArtifactContractDependencies,
): CompiledKnowledgeArtifactContract {
  return new CompiledKnowledgeArtifactContract(dependencies);
}
