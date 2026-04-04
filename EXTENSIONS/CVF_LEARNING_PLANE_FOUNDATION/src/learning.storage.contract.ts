import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type LearningRecordType =
  | "FEEDBACK_LEDGER"
  | "TRUTH_MODEL"
  | "EVALUATION_RESULT"
  | "THRESHOLD_ASSESSMENT"
  | "GOVERNANCE_SIGNAL"
  | "REINJECTION_RESULT"
  | "LOOP_SUMMARY";

export interface LearningStorageRecord {
  recordId: string;
  recordType: LearningRecordType;
  storedAt: string;
  payloadSize: number;
  payloadHash: string;
  storageHash: string;
}

export interface LearningStorageContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class LearningStorageContract {
  private readonly now: () => string;

  constructor(dependencies: LearningStorageContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  store(artifact: object, recordType: LearningRecordType): LearningStorageRecord {
    const storedAt = this.now();
    const serialized = JSON.stringify(artifact);
    const payloadSize = serialized.length;

    const payloadHash = computeDeterministicHash(
      "w4-t6-cp1-payload",
      serialized,
      recordType,
    );

    const storageHash = computeDeterministicHash(
      "w4-t6-cp1-storage",
      `${storedAt}:${recordType}`,
      `size:${payloadSize}`,
      payloadHash,
    );

    const recordId = computeDeterministicHash(
      "w4-t6-cp1-record-id",
      storageHash,
      storedAt,
    );

    return {
      recordId,
      recordType,
      storedAt,
      payloadSize,
      payloadHash,
      storageHash,
    };
  }
}

export function createLearningStorageContract(
  dependencies?: LearningStorageContractDependencies,
): LearningStorageContract {
  return new LearningStorageContract(dependencies);
}
