import {
  KnowledgeContextAssemblyContract,
  type KnowledgeContextAssemblyRequest,
  type KnowledgeContextPacket,
  type KnowledgeContextAssemblyContractDependencies,
} from "./knowledge.context.assembly.contract";
import { createDeterministicBatchIdentity } from "./batch.contract.shared";

// --- Types ---

export interface KnowledgeContextAssemblyBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalAssembled: number;
  packets: KnowledgeContextPacket[];
}

export interface KnowledgeContextAssemblyBatchContractDependencies {
  contractDependencies?: KnowledgeContextAssemblyContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class KnowledgeContextAssemblyBatchContract {
  private readonly contract: KnowledgeContextAssemblyContract;
  private readonly now: () => string;

  constructor(dependencies: KnowledgeContextAssemblyBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.contract = new KnowledgeContextAssemblyContract({
      ...(dependencies.contractDependencies ?? {}),
      now: dependencies.contractDependencies?.now ?? this.now,
    });
  }

  batch(requests: KnowledgeContextAssemblyRequest[]): KnowledgeContextAssemblyBatch {
    const createdAt = this.now();
    const packets: KnowledgeContextPacket[] = requests.map((req) =>
      this.contract.assemble(req),
    );

    const totalAssembled = packets.length;
    const packetHashesSig = packets.map((p) => p.packetHash).join(",");

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w75-t1-context-assembly-batch",
      batchIdSeed: "w75-t1-context-assembly-batch-id",
      hashParts: [
        `${createdAt}:total:${totalAssembled}`,
        `packetHashes:[${packetHashesSig}]`,
      ],
    });

    return { batchId, batchHash, createdAt, totalAssembled, packets };
  }
}

export function createKnowledgeContextAssemblyBatchContract(
  dependencies?: KnowledgeContextAssemblyBatchContractDependencies,
): KnowledgeContextAssemblyBatchContract {
  return new KnowledgeContextAssemblyBatchContract(dependencies);
}
