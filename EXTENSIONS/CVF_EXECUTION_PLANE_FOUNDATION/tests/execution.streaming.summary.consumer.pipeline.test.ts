import { describe, it, expect } from "vitest";
import {
  StreamingExecutionSummaryConsumerPipelineContract,
  createStreamingExecutionSummaryConsumerPipelineContract,
} from "../src/execution.streaming.summary.consumer.pipeline.contract";
import type {
  StreamingExecutionSummaryConsumerPipelineRequest,
} from "../src/execution.streaming.summary.consumer.pipeline.contract";
import type { StreamingExecutionChunk } from "../src/execution.streaming.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T12:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeChunk(
  chunkStatus: "STREAMED" | "SKIPPED" | "FAILED",
  id: string = "chunk-001",
): StreamingExecutionChunk {
  return {
    chunkId: id,
    issuedAt: FIXED_NOW,
    sourceRuntimeId: "runtime-001",
    sequenceNumber: 0,
    assignmentId: "assign-001",
    taskId: "task-001",
    chunkStatus,
    recordStatus: chunkStatus === "STREAMED" ? "EXECUTED" : chunkStatus === "FAILED" ? "EXECUTION_FAILED" : "SKIPPED_DENIED",
    payload: "payload",
    chunkHash: `hash-${id}`,
  };
}

function makeRequest(
  chunks: StreamingExecutionChunk[],
  consumerId?: string,
): StreamingExecutionSummaryConsumerPipelineRequest {
  return { chunks, consumerId };
}

function makeContract(): StreamingExecutionSummaryConsumerPipelineContract {
  return createStreamingExecutionSummaryConsumerPipelineContract({ now: fixedNow });
}

const FAILED_CHUNKS = [makeChunk("FAILED", "chunk-f1"), makeChunk("STREAMED", "chunk-s1")];
const SKIPPED_CHUNKS = [makeChunk("SKIPPED", "chunk-sk1"), makeChunk("STREAMED", "chunk-s2")];
const STREAMED_CHUNKS = [makeChunk("STREAMED", "chunk-s3"), makeChunk("STREAMED", "chunk-s4")];
const EMPTY_CHUNKS: StreamingExecutionChunk[] = [];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("StreamingExecutionSummaryConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createStreamingExecutionSummaryConsumerPipelineContract();
    expect(contract).toBeInstanceOf(StreamingExecutionSummaryConsumerPipelineContract);
  });

  it("execute returns a result with expected shape", () => {
    const result = makeContract().execute(makeRequest(STREAMED_CHUNKS));
    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("streamingSummary");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
  });

  it("createdAt matches injected now", () => {
    const result = makeContract().execute(makeRequest(STREAMED_CHUNKS));
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("FAILED — warning contains [streaming] prefix", () => {
    const result = makeContract().execute(makeRequest(FAILED_CHUNKS));
    expect(result.streamingSummary.dominantChunkStatus).toBe("FAILED");
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("[streaming]");
  });

  it("FAILED — warning references 'failed execution chunks'", () => {
    const result = makeContract().execute(makeRequest(FAILED_CHUNKS));
    expect(result.warnings[0]).toContain("failed execution chunks");
  });

  it("FAILED — warning references 'review execution pipeline'", () => {
    const result = makeContract().execute(makeRequest(FAILED_CHUNKS));
    expect(result.warnings[0]).toContain("review execution pipeline");
  });

  it("SKIPPED — warning contains [streaming] prefix", () => {
    const result = makeContract().execute(makeRequest(SKIPPED_CHUNKS));
    expect(result.streamingSummary.dominantChunkStatus).toBe("SKIPPED");
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("[streaming]");
  });

  it("SKIPPED — warning references 'skipped execution chunks'", () => {
    const result = makeContract().execute(makeRequest(SKIPPED_CHUNKS));
    expect(result.warnings[0]).toContain("skipped execution chunks");
  });

  it("SKIPPED — warning references 'review execution policy'", () => {
    const result = makeContract().execute(makeRequest(SKIPPED_CHUNKS));
    expect(result.warnings[0]).toContain("review execution policy");
  });

  it("STREAMED — no warnings", () => {
    const result = makeContract().execute(makeRequest(STREAMED_CHUNKS));
    expect(result.streamingSummary.dominantChunkStatus).toBe("STREAMED");
    expect(result.warnings).toHaveLength(0);
  });

  it("empty chunks — no warnings", () => {
    const result = makeContract().execute(makeRequest(EMPTY_CHUNKS));
    expect(result.warnings).toHaveLength(0);
  });

  it("query contains dominantChunkStatus", () => {
    const result = makeContract().execute(makeRequest(FAILED_CHUNKS));
    expect(result.consumerPackage.query).toContain("FAILED");
  });

  it("query contains 'streaming'", () => {
    const result = makeContract().execute(makeRequest(STREAMED_CHUNKS));
    expect(result.consumerPackage.query).toContain("streaming");
  });

  it("query contains 'failed'", () => {
    const result = makeContract().execute(makeRequest(FAILED_CHUNKS));
    expect(result.consumerPackage.query).toContain("failed");
  });

  it("query length is at most 120 chars", () => {
    const result = makeContract().execute(makeRequest(STREAMED_CHUNKS));
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("consumerPackage contextId matches streamingSummary.summaryId", () => {
    const result = makeContract().execute(makeRequest(STREAMED_CHUNKS));
    expect(result.consumerPackage.contextId).toBe(result.streamingSummary.summaryId);
  });

  it("pipelineHash and resultId are non-empty strings", () => {
    const result = makeContract().execute(makeRequest(STREAMED_CHUNKS));
    expect(typeof result.pipelineHash).toBe("string");
    expect(result.pipelineHash.length).toBeGreaterThan(0);
    expect(typeof result.resultId).toBe("string");
    expect(result.resultId.length).toBeGreaterThan(0);
  });

  it("pipelineHash differs from resultId", () => {
    const result = makeContract().execute(makeRequest(STREAMED_CHUNKS));
    expect(result.pipelineHash).not.toBe(result.resultId);
  });

  it("is deterministic — same input yields same hashes", () => {
    const contract = makeContract();
    const r1 = contract.execute(makeRequest(STREAMED_CHUNKS));
    const r2 = contract.execute(makeRequest(STREAMED_CHUNKS));
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different inputs produce different pipelineHash", () => {
    const contract = makeContract();
    const r1 = contract.execute(makeRequest(FAILED_CHUNKS));
    const r2 = contract.execute(makeRequest(STREAMED_CHUNKS));
    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("streamingSummary.totalChunks matches input chunk count", () => {
    const result = makeContract().execute(makeRequest(STREAMED_CHUNKS));
    expect(result.streamingSummary.totalChunks).toBe(STREAMED_CHUNKS.length);
  });

  it("consumerId carried through to result", () => {
    const result = makeContract().execute(makeRequest(STREAMED_CHUNKS, "consumer-epf"));
    expect(result.consumerId).toBe("consumer-epf");
  });

  it("consumerId is undefined when not provided", () => {
    const result = makeContract().execute(makeRequest(STREAMED_CHUNKS));
    expect(result.consumerId).toBeUndefined();
  });
});
