import {
  CompiledKnowledgeArtifactContract,
  type CompiledKnowledgeArtifactCompileRequest,
  type CompiledKnowledgeArtifact,
  type CompiledKnowledgeArtifactContractDependencies,
} from "./knowledge.compiled.artifact.contract";
import { createDeterministicBatchIdentity } from "./batch.contract.shared";

// --- Types ---

export interface CompiledKnowledgeArtifactBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalCompiled: number;
  artifacts: CompiledKnowledgeArtifact[];
}

export interface CompiledKnowledgeArtifactBatchContractDependencies {
  contractDependencies?: CompiledKnowledgeArtifactContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class CompiledKnowledgeArtifactBatchContract {
  private readonly contract: CompiledKnowledgeArtifactContract;
  private readonly now: () => string;

  constructor(dependencies: CompiledKnowledgeArtifactBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.contract = new CompiledKnowledgeArtifactContract({
      ...(dependencies.contractDependencies ?? {}),
      now: dependencies.contractDependencies?.now ?? this.now,
    });
  }

  batch(requests: CompiledKnowledgeArtifactCompileRequest[]): CompiledKnowledgeArtifactBatch {
    const createdAt = this.now();
    const artifacts: CompiledKnowledgeArtifact[] = requests.map((req) =>
      this.contract.compile(req),
    );

    const totalCompiled = artifacts.length;
    const artifactHashesSig = artifacts.map((a) => a.artifactHash).join(",");

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w72-t4-cp2-compiled-artifact-batch",
      batchIdSeed: "w72-t4-cp2-compiled-artifact-batch-id",
      hashParts: [
        `${createdAt}:total:${totalCompiled}`,
        `artifactHashes:[${artifactHashesSig}]`,
      ],
    });

    return {
      batchId,
      batchHash,
      createdAt,
      totalCompiled,
      artifacts,
    };
  }
}

export function createCompiledKnowledgeArtifactBatchContract(
  dependencies?: CompiledKnowledgeArtifactBatchContractDependencies,
): CompiledKnowledgeArtifactBatchContract {
  return new CompiledKnowledgeArtifactBatchContract(dependencies);
}
