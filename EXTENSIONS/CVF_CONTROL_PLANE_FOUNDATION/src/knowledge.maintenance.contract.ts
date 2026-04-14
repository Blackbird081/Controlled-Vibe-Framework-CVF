import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { CompiledKnowledgeArtifact } from "./knowledge.compiled.artifact.contract";

// --- Signal types ---

/**
 * W73-T2 — Knowledge Maintenance Contract (Lifecycle Step 5)
 * Emits quality signal events for governed artifacts.
 * Signals feed the Learning Plane (FeedbackLedger → PatternInsight → TruthModel).
 * This contract only emits signals — it does NOT write to the Learning Plane.
 * Authorization: CVF_GC018_W73_T2_KNOWLEDGE_MAINTENANCE_CONTRACT_AUTHORIZATION_2026-04-14.md
 */
export type KnowledgeMaintenanceSignalType =
  | "lint"
  | "contradiction"
  | "drift"
  | "orphan"
  | "staleness";

export interface KnowledgeMaintenanceSignal {
  signalId: string;        // time-variant: hash(signalHash + detectedAt)
  signalHash: string;      // content-bound: hash(artifactId + type + message)
  signalType: KnowledgeMaintenanceSignalType;
  artifactId: string;
  detectedAt: string;
  message: string;
}

// --- Check specs (discriminated union) ---

export interface KnowledgeLintCheck {
  type: "lint";
  requiredKeywords: string[];  // keywords that must appear in artifact content
}

export interface KnowledgeContradictionCheck {
  type: "contradiction";
  conflictingArtifactIds: string[];  // externally declared contradicting artifact IDs
}

export interface KnowledgeDriftCheck {
  type: "drift";
  sourceLastModifiedAt: string;  // ISO timestamp of raw source's last modification
}

export interface KnowledgeOrphanCheck {
  type: "orphan";
  activeSourceIds: string[];  // currently active raw source IDs
}

export interface KnowledgeStalenessCheck {
  type: "staleness";
  maxAgeDays: number;  // max allowed age since compiledAt relative to evaluation time
}

export type KnowledgeMaintenanceCheck =
  | KnowledgeLintCheck
  | KnowledgeContradictionCheck
  | KnowledgeDriftCheck
  | KnowledgeOrphanCheck
  | KnowledgeStalenessCheck;

// --- Request / Result ---

export interface KnowledgeMaintenanceRequest {
  artifact: CompiledKnowledgeArtifact;  // must have governanceStatus: "approved"
  checks: KnowledgeMaintenanceCheck[];
}

export interface KnowledgeMaintenanceResult {
  artifactId: string;
  evaluatedAt: string;
  signals: KnowledgeMaintenanceSignal[];
  totalSignals: number;
  hasIssues: boolean;
  resultHash: string;  // bound to artifactId + evaluatedAt + signalHashes
}

export interface KnowledgeMaintenanceContractDependencies {
  now?: () => string;
}

// --- Contract ---

const MS_PER_DAY = 86_400_000;

export class KnowledgeMaintenanceContract {
  private readonly now: () => string;

  constructor(dependencies: KnowledgeMaintenanceContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  evaluate(request: KnowledgeMaintenanceRequest): KnowledgeMaintenanceResult {
    const { artifact, checks } = request;

    if (artifact.governanceStatus !== "approved") {
      throw new Error(
        `KnowledgeMaintenance: artifact ${artifact.artifactId} must be approved ` +
        `(status: "${artifact.governanceStatus}")`,
      );
    }

    const evaluatedAt = this.now();
    const signals: KnowledgeMaintenanceSignal[] = [];

    for (const check of checks) {
      signals.push(...this.runCheck(artifact, check, evaluatedAt));
    }

    const signalHashesSig = signals.map((s) => s.signalHash).join(",");
    const resultHash = computeDeterministicHash(
      "w73-t2-maintenance-result",
      `${artifact.artifactId}:${evaluatedAt}`,
      `signals:[${signalHashesSig}]`,
    );

    return {
      artifactId: artifact.artifactId,
      evaluatedAt,
      signals,
      totalSignals: signals.length,
      hasIssues: signals.length > 0,
      resultHash,
    };
  }

  private makeSignal(
    artifact: CompiledKnowledgeArtifact,
    type: KnowledgeMaintenanceSignalType,
    message: string,
    detectedAt: string,
  ): KnowledgeMaintenanceSignal {
    const signalHash = computeDeterministicHash(
      "w73-t2-signal",
      `${artifact.artifactId}:${type}`,
      `message:${message}`,
    );
    const signalId = computeDeterministicHash(
      "w73-t2-signal-id",
      signalHash,
      detectedAt,
    );
    return { signalId, signalHash, signalType: type, artifactId: artifact.artifactId, detectedAt, message };
  }

  private runCheck(
    artifact: CompiledKnowledgeArtifact,
    check: KnowledgeMaintenanceCheck,
    detectedAt: string,
  ): KnowledgeMaintenanceSignal[] {
    switch (check.type) {
      case "lint": {
        return check.requiredKeywords
          .filter((kw) => !artifact.content.includes(kw))
          .map((kw) =>
            this.makeSignal(artifact, "lint", `Required keyword missing: "${kw}"`, detectedAt),
          );
      }
      case "contradiction": {
        return check.conflictingArtifactIds.map((id) =>
          this.makeSignal(artifact, "contradiction", `Contradicts artifact: ${id}`, detectedAt),
        );
      }
      case "drift": {
        const sourceMs = new Date(check.sourceLastModifiedAt).getTime();
        const compiledMs = new Date(artifact.compiledAt).getTime();
        if (sourceMs > compiledMs) {
          return [this.makeSignal(
            artifact, "drift",
            `Raw source modified at ${check.sourceLastModifiedAt} after compiledAt ${artifact.compiledAt}`,
            detectedAt,
          )];
        }
        return [];
      }
      case "orphan": {
        const active = new Set(check.activeSourceIds);
        return artifact.sourceIds
          .filter((id) => !active.has(id))
          .map((id) =>
            this.makeSignal(artifact, "orphan", `Source ID no longer active: ${id}`, detectedAt),
          );
      }
      case "staleness": {
        const compiledMs = new Date(artifact.compiledAt).getTime();
        const evalMs = new Date(detectedAt).getTime();
        const ageDays = (evalMs - compiledMs) / MS_PER_DAY;
        if (ageDays > check.maxAgeDays) {
          return [this.makeSignal(
            artifact, "staleness",
            `Artifact age ${ageDays.toFixed(1)} days exceeds maxAgeDays ${check.maxAgeDays}`,
            detectedAt,
          )];
        }
        return [];
      }
    }
  }
}

export function createKnowledgeMaintenanceContract(
  dependencies?: KnowledgeMaintenanceContractDependencies,
): KnowledgeMaintenanceContract {
  return new KnowledgeMaintenanceContract(dependencies);
}
