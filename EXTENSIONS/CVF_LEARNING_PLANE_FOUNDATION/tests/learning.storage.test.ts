/**
 * LPF Learning Storage — Dedicated Tests (W6-T14)
 * =================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   LearningStorageContract.store:
 *     - recordType is propagated to result
 *     - storedAt is set to injected now()
 *     - payloadSize equals JSON.stringify(artifact).length
 *     - payloadHash is deterministic for same artifact and recordType
 *     - different recordType → different payloadHash (recordType part of payload hash)
 *     - storageHash is deterministic for same inputs and timestamp
 *     - recordId is deterministic for same inputs and timestamp
 *     - all 7 LearningRecordType values can be stored
 *     - empty object stores successfully
 *     - nested artifact stores and reports correct payloadSize
 *     - factory createLearningStorageContract returns working instance
 *
 *   LearningStorageLogContract.log:
 *     - empty input → null dominantRecordType, totalRecords 0
 *     - totalRecords equals input length
 *     - dominantRecordType: most frequent type wins
 *     - dominantRecordType: RECORD_TYPE_ORDER priority tiebreaks ties
 *       (FEEDBACK_LEDGER before TRUTH_MODEL on equal counts)
 *     - single record → dominantRecordType equals that record's type
 *     - summary for empty indicates no records
 *     - summary for non-empty contains totalRecords and dominantRecordType
 *     - logHash and logId are deterministic for same inputs and timestamp
 *     - createdAt is set to injected now()
 *     - factory createLearningStorageLogContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  LearningStorageContract,
  createLearningStorageContract,
} from "../src/learning.storage.contract";
import type { LearningRecordType, LearningStorageRecord } from "../src/learning.storage.contract";

import {
  LearningStorageLogContract,
  createLearningStorageLogContract,
} from "../src/learning.storage.log.contract";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-23T19:00:00.000Z";
const fixedNow = () => FIXED_NOW;

let _recordSeq = 0;
function makeRecord(recordType: LearningRecordType): LearningStorageRecord {
  const n = ++_recordSeq;
  return {
    recordId: `record-${n}`,
    recordType,
    storedAt: FIXED_NOW,
    payloadSize: 42,
    payloadHash: `hash-payload-${n}`,
    storageHash: `hash-storage-${n}`,
  };
}

const ALL_RECORD_TYPES: LearningRecordType[] = [
  "FEEDBACK_LEDGER",
  "TRUTH_MODEL",
  "EVALUATION_RESULT",
  "THRESHOLD_ASSESSMENT",
  "GOVERNANCE_SIGNAL",
  "REINJECTION_RESULT",
  "LOOP_SUMMARY",
];

// ─── LearningStorageContract ──────────────────────────────────────────────────

describe("LearningStorageContract.store", () => {
  const contract = new LearningStorageContract({ now: fixedNow });

  it("recordType is propagated to result", () => {
    const result = contract.store({ key: "value" }, "TRUTH_MODEL");
    expect(result.recordType).toBe("TRUTH_MODEL");
  });

  it("storedAt is set to injected now()", () => {
    const result = contract.store({ key: "value" }, "FEEDBACK_LEDGER");
    expect(result.storedAt).toBe(FIXED_NOW);
  });

  it("payloadSize equals JSON.stringify(artifact).length", () => {
    const artifact = { id: "abc", score: 42, active: true };
    const expected = JSON.stringify(artifact).length;
    const result = contract.store(artifact, "EVALUATION_RESULT");
    expect(result.payloadSize).toBe(expected);
  });

  it("payloadHash is deterministic for same artifact and recordType", () => {
    const artifact = { modelId: "m1", version: 2 };
    const r1 = contract.store(artifact, "TRUTH_MODEL");
    const r2 = contract.store(artifact, "TRUTH_MODEL");
    expect(r1.payloadHash).toBe(r2.payloadHash);
  });

  it("different recordType produces different payloadHash for same artifact", () => {
    const artifact = { data: "same" };
    const r1 = contract.store(artifact, "TRUTH_MODEL");
    const r2 = contract.store(artifact, "GOVERNANCE_SIGNAL");
    expect(r1.payloadHash).not.toBe(r2.payloadHash);
  });

  it("storageHash is deterministic for same inputs and timestamp", () => {
    const artifact = { x: 1 };
    const r1 = contract.store(artifact, "LOOP_SUMMARY");
    const r2 = contract.store(artifact, "LOOP_SUMMARY");
    expect(r1.storageHash).toBe(r2.storageHash);
  });

  it("recordId is deterministic for same inputs and timestamp", () => {
    const artifact = { y: 2 };
    const r1 = contract.store(artifact, "REINJECTION_RESULT");
    const r2 = contract.store(artifact, "REINJECTION_RESULT");
    expect(r1.recordId).toBe(r2.recordId);
  });

  it("empty object stores successfully with payloadSize > 0", () => {
    const result = contract.store({}, "THRESHOLD_ASSESSMENT");
    expect(result.payloadSize).toBe(2); // "{}"
    expect(result.recordType).toBe("THRESHOLD_ASSESSMENT");
    expect(result.storedAt).toBe(FIXED_NOW);
  });

  it("nested artifact stores and reports correct payloadSize", () => {
    const artifact = { nested: { a: [1, 2, 3] } };
    const result = contract.store(artifact, "EVALUATION_RESULT");
    expect(result.payloadSize).toBe(JSON.stringify(artifact).length);
  });

  it.each(ALL_RECORD_TYPES)("all LearningRecordType values can be stored: %s", (rt) => {
    const result = contract.store({ type: rt }, rt);
    expect(result.recordType).toBe(rt);
    expect(result.storedAt).toBe(FIXED_NOW);
  });

  it("factory createLearningStorageContract returns working instance", () => {
    const c = createLearningStorageContract({ now: fixedNow });
    const result = c.store({ id: "x" }, "TRUTH_MODEL");
    expect(result.recordType).toBe("TRUTH_MODEL");
    expect(result.storedAt).toBe(FIXED_NOW);
  });
});

// ─── LearningStorageLogContract ────────────────────────────────────────────────

describe("LearningStorageLogContract.log", () => {
  const contract = new LearningStorageLogContract({ now: fixedNow });

  it("empty input → null dominantRecordType, totalRecords 0", () => {
    const result = contract.log([]);
    expect(result.totalRecords).toBe(0);
    expect(result.dominantRecordType).toBeNull();
  });

  it("totalRecords equals input length", () => {
    const records = [makeRecord("TRUTH_MODEL"), makeRecord("TRUTH_MODEL"), makeRecord("LOOP_SUMMARY")];
    expect(contract.log(records).totalRecords).toBe(3);
  });

  it("dominantRecordType: most frequent type wins (TRUTH_MODEL wins 3 vs 1)", () => {
    const records = [
      makeRecord("TRUTH_MODEL"),
      makeRecord("TRUTH_MODEL"),
      makeRecord("TRUTH_MODEL"),
      makeRecord("FEEDBACK_LEDGER"),
    ];
    expect(contract.log(records).dominantRecordType).toBe("TRUTH_MODEL");
  });

  it("dominantRecordType: FEEDBACK_LEDGER before TRUTH_MODEL on equal counts (order priority)", () => {
    const records = [makeRecord("TRUTH_MODEL"), makeRecord("FEEDBACK_LEDGER")];
    // FEEDBACK_LEDGER is first in RECORD_TYPE_ORDER, so it wins on tie
    expect(contract.log(records).dominantRecordType).toBe("FEEDBACK_LEDGER");
  });

  it("dominantRecordType: EVALUATION_RESULT before THRESHOLD_ASSESSMENT on equal counts", () => {
    const records = [makeRecord("THRESHOLD_ASSESSMENT"), makeRecord("EVALUATION_RESULT")];
    expect(contract.log(records).dominantRecordType).toBe("EVALUATION_RESULT");
  });

  it("single record → dominantRecordType equals that record's type", () => {
    const records = [makeRecord("GOVERNANCE_SIGNAL")];
    expect(contract.log(records).dominantRecordType).toBe("GOVERNANCE_SIGNAL");
  });

  it("summary for empty indicates no records", () => {
    expect(contract.log([]).summary).toContain("No");
  });

  it("summary for non-empty contains totalRecords and dominantRecordType", () => {
    const records = [makeRecord("TRUTH_MODEL"), makeRecord("TRUTH_MODEL")];
    const result = contract.log(records);
    expect(result.summary).toContain("2");
    expect(result.summary).toContain("TRUTH_MODEL");
  });

  it("logHash and logId are deterministic for same inputs and timestamp", () => {
    const records = [makeRecord("LOOP_SUMMARY"), makeRecord("LOOP_SUMMARY")];
    const r1 = contract.log(records);
    const r2 = contract.log(records);
    expect(r1.logHash).toBe(r2.logHash);
    expect(r1.logId).toBe(r2.logId);
  });

  it("createdAt is set to injected now()", () => {
    expect(contract.log([]).createdAt).toBe(FIXED_NOW);
  });

  it("factory createLearningStorageLogContract returns working instance", () => {
    const c = createLearningStorageLogContract({ now: fixedNow });
    const result = c.log([]);
    expect(result.dominantRecordType).toBeNull();
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});
