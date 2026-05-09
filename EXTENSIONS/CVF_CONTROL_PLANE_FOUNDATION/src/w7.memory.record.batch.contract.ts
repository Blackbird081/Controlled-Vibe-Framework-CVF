import {
  W7MemoryRecordContract,
  type W7MemoryRecordRequest,
  type W7MemoryRecord,
  type W7MemoryRecordContractDependencies,
} from "./w7.memory.record.contract";
import { createDeterministicBatchIdentity } from "./batch.contract.shared";

// --- Types ---

export interface W7MemoryRecordBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRecorded: number;
  records: W7MemoryRecord[];
}

export interface W7MemoryRecordBatchContractDependencies {
  contractDependencies?: W7MemoryRecordContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class W7MemoryRecordBatchContract {
  private readonly contract: W7MemoryRecordContract;
  private readonly now: () => string;

  constructor(dependencies: W7MemoryRecordBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.contract = new W7MemoryRecordContract({
      ...(dependencies.contractDependencies ?? {}),
      now: dependencies.contractDependencies?.now ?? this.now,
    });
  }

  batch(requests: W7MemoryRecordRequest[]): W7MemoryRecordBatch {
    const createdAt = this.now();
    const records: W7MemoryRecord[] = requests.map((req) =>
      this.contract.record(req),
    );

    const totalRecorded = records.length;
    const recordHashesSig = records.map((r) => r.memoryRecordHash).join(",");

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w73-t1-memory-record-batch",
      batchIdSeed: "w73-t1-memory-record-batch-id",
      hashParts: [
        `${createdAt}:total:${totalRecorded}`,
        `recordHashes:[${recordHashesSig}]`,
      ],
    });

    return { batchId, batchHash, createdAt, totalRecorded, records };
  }
}

export function createW7MemoryRecordBatchContract(
  dependencies?: W7MemoryRecordBatchContractDependencies,
): W7MemoryRecordBatchContract {
  return new W7MemoryRecordBatchContract(dependencies);
}
