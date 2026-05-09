import { describe, it, expect } from "vitest";
import {
  W7MemoryRecordBatchContract,
  createW7MemoryRecordBatchContract,
  type W7MemoryRecordBatch,
} from "../src/w7.memory.record.batch.contract";
import type { W7MemoryRecordRequest } from "../src/w7.memory.record.contract";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// ─── W73-T1: W7MemoryRecordBatchContract ─────────────────────────────────────

function makeBatchContract(): W7MemoryRecordBatchContract {
  return new W7MemoryRecordBatchContract({ now: () => FIXED_BATCH_NOW });
}

function makeRequest(suffix: string): W7MemoryRecordRequest {
  return {
    sourceRef: `src-${suffix}`,
    candidateId: `cand-${suffix}`,
    name: `Concept ${suffix}`,
    domain: "governance",
    content: `Content for ${suffix}`,
  };
}

// --- empty batch ---

describe("W7MemoryRecordBatchContract — empty batch", () => {
  it("returns totalRecorded = 0 for empty input", () => {
    expect(makeBatchContract().batch([]).totalRecorded).toBe(0);
  });

  it("returns empty records array for empty input", () => {
    expect(makeBatchContract().batch([]).records).toHaveLength(0);
  });

  it("batchId differs from batchHash for empty input", () => {
    const b = makeBatchContract().batch([]);
    expect(b.batchId).not.toBe(b.batchHash);
  });

  it("createdAt is injected timestamp", () => {
    expect(makeBatchContract().batch([]).createdAt).toBe(FIXED_BATCH_NOW);
  });

  it("empty batch has all required fields", () => {
    const b = makeBatchContract().batch([]);
    expect(b).toHaveProperty("batchId");
    expect(b).toHaveProperty("batchHash");
    expect(b).toHaveProperty("createdAt");
    expect(b).toHaveProperty("totalRecorded");
    expect(b).toHaveProperty("records");
  });
});

// --- single request ---

describe("W7MemoryRecordBatchContract — single request", () => {
  it("returns totalRecorded = 1", () => {
    expect(makeBatchContract().batch([makeRequest("a")]).totalRecorded).toBe(1);
  });

  it("record carries candidateId through", () => {
    const b = makeBatchContract().batch([makeRequest("a")]);
    expect(b.records[0].candidateId).toBe("cand-a");
  });

  it("record has stage w7_memory_record", () => {
    const b = makeBatchContract().batch([makeRequest("a")]);
    expect(b.records[0].stage).toBe("w7_memory_record");
  });
});

// --- multiple requests ---

describe("W7MemoryRecordBatchContract — multiple requests", () => {
  it("returns correct totalRecorded for multiple requests", () => {
    expect(
      makeBatchContract().batch([makeRequest("a"), makeRequest("b"), makeRequest("c")]).totalRecorded,
    ).toBe(3);
  });

  it("records are in request order", () => {
    const reqs = [makeRequest("a"), makeRequest("b"), makeRequest("c")];
    const b = makeBatchContract().batch(reqs);
    expect(b.records[0].candidateId).toBe("cand-a");
    expect(b.records[1].candidateId).toBe("cand-b");
    expect(b.records[2].candidateId).toBe("cand-c");
  });
});

// --- output shape ---

describe("W7MemoryRecordBatchContract — output shape", () => {
  it("batch result has all required fields", () => {
    const b: W7MemoryRecordBatch = makeBatchContract().batch([makeRequest("a")]);
    expect(b).toHaveProperty("batchId");
    expect(b).toHaveProperty("batchHash");
    expect(b).toHaveProperty("createdAt");
    expect(b).toHaveProperty("totalRecorded");
    expect(b).toHaveProperty("records");
  });
});

// --- determinism ---

describe("W7MemoryRecordBatchContract — determinism", () => {
  it("same requests + same timestamp → same batchHash", () => {
    const reqs = [makeRequest("a"), makeRequest("b")];
    const b1 = makeBatchContract().batch(reqs);
    const b2 = makeBatchContract().batch(reqs);
    expect(b1.batchHash).toBe(b2.batchHash);
  });

  it("different totalRecorded → different batchHash", () => {
    const b1 = makeBatchContract().batch([makeRequest("a")]);
    const b2 = makeBatchContract().batch([makeRequest("a"), makeRequest("b")]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("batchId always differs from batchHash", () => {
    const b = makeBatchContract().batch([makeRequest("a")]);
    expect(b.batchId).not.toBe(b.batchHash);
  });

  it("different timestamp → different batchHash", () => {
    const reqs = [makeRequest("a")];
    const b1 = new W7MemoryRecordBatchContract({ now: () => "2026-01-01T00:00:00.000Z" }).batch(reqs);
    const b2 = new W7MemoryRecordBatchContract({ now: () => "2026-06-01T00:00:00.000Z" }).batch(reqs);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });
});

// --- factory ---

describe("W7MemoryRecordBatchContract — factory", () => {
  it("createW7MemoryRecordBatchContract returns working instance", () => {
    const c = createW7MemoryRecordBatchContract({ now: () => FIXED_BATCH_NOW });
    expect(c.batch([makeRequest("x")]).totalRecorded).toBe(1);
  });

  it("factory with no args uses live timestamp", () => {
    const c = createW7MemoryRecordBatchContract();
    expect(c.batch([]).createdAt).toBeTruthy();
  });
});
