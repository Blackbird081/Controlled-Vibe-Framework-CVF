import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { LearningRecordType, LearningStorageRecord } from "./learning.storage.contract";

// --- Types ---

export interface LearningStorageLog {
  logId: string;
  createdAt: string;
  totalRecords: number;
  dominantRecordType: LearningRecordType | null;
  summary: string;
  logHash: string;
}

export interface LearningStorageLogContractDependencies {
  now?: () => string;
}

// --- Dominant record type logic ---
// Most frequent record type wins; ties resolved by enum order.

const RECORD_TYPE_ORDER: LearningRecordType[] = [
  "FEEDBACK_LEDGER",
  "TRUTH_MODEL",
  "EVALUATION_RESULT",
  "THRESHOLD_ASSESSMENT",
  "GOVERNANCE_SIGNAL",
  "REINJECTION_RESULT",
  "LOOP_SUMMARY",
];

function computeDominant(records: LearningStorageRecord[]): LearningRecordType | null {
  if (records.length === 0) return null;

  const counts = new Map<LearningRecordType, number>();
  for (const r of records) {
    counts.set(r.recordType, (counts.get(r.recordType) ?? 0) + 1);
  }

  let maxCount = 0;
  let dominant: LearningRecordType = records[0].recordType;

  for (const rt of RECORD_TYPE_ORDER) {
    const count = counts.get(rt) ?? 0;
    if (count > maxCount) {
      maxCount = count;
      dominant = rt;
    }
  }

  return dominant;
}

// --- Contract ---

export class LearningStorageLogContract {
  private readonly now: () => string;

  constructor(dependencies: LearningStorageLogContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  log(records: LearningStorageRecord[]): LearningStorageLog {
    const createdAt = this.now();
    const totalRecords = records.length;
    const dominantRecordType = computeDominant(records);

    const summary =
      totalRecords === 0
        ? "No records in storage log."
        : `${totalRecords} record(s) stored. Dominant type: ${dominantRecordType}.`;

    const logHash = computeDeterministicHash(
      "w4-t6-cp2-log",
      `${createdAt}:total:${totalRecords}`,
      `dominant:${dominantRecordType ?? "none"}`,
    );

    const logId = computeDeterministicHash(
      "w4-t6-cp2-log-id",
      logHash,
      createdAt,
    );

    return {
      logId,
      createdAt,
      totalRecords,
      dominantRecordType,
      summary,
      logHash,
    };
  }
}

export function createLearningStorageLogContract(
  dependencies?: LearningStorageLogContractDependencies,
): LearningStorageLogContract {
  return new LearningStorageLogContract(dependencies);
}
