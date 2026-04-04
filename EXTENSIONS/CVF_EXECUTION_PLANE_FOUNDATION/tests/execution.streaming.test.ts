import { describe, expect, it } from "vitest";
import {
  StreamingExecutionContract,
  createStreamingExecutionContract,
  StreamingExecutionAggregatorContract,
  createStreamingExecutionAggregatorContract,
} from "../src/index";
import type { StreamingExecutionChunk } from "../src/index";
import { createCommandRuntimeContract } from "../src/index";

// --- Shared helper ---

function makeCommandRuntimeResult(count: number) {
  const contract = createCommandRuntimeContract({
    now: () => "2026-03-23T10:00:00.000Z",
  });
  const entries = Array.from({ length: count }, (_, i) => ({
    assignmentId: `a${i + 1}`,
    taskId: `t${i + 1}`,
    guardDecision: "ALLOW" as const,
    riskLevel: "R0",
    gateDecision: "allow" as const,
    rationale: "test",
  }));
  const gate = {
    gateId: "gate-stream-001",
    dispatchId: "dispatch-stream-001",
    evaluatedAt: "2026-03-23T10:00:00.000Z",
    entries,
    allowedCount: count,
    deniedCount: 0,
    reviewRequiredCount: 0,
    sandboxedCount: 0,
    pendingCount: 0,
    gateHash: "gate-hash-stream",
    summary: "test gate",
  };
  return contract.execute(gate);
}

function makeChunk(
  status: "STREAMED" | "SKIPPED" | "FAILED",
  id: string,
): StreamingExecutionChunk {
  return {
    chunkId: `chunk-${id}`,
    issuedAt: "2026-03-23T10:00:00.000Z",
    sourceRuntimeId: "runtime-1",
    sequenceNumber: 0,
    assignmentId: `a-${id}`,
    taskId: `t-${id}`,
    chunkStatus: status,
    recordStatus: "EXECUTED",
    payload: `payload-${id}`,
    chunkHash: `hash-${id}`,
  };
}

// ---------------------------------------------------------------------------
// W6-T1 CP1 — StreamingExecutionContract
// ---------------------------------------------------------------------------

describe("W6-T1 CP1 — StreamingExecutionContract", () => {
  it("produces one chunk per record in CommandRuntimeResult", () => {
    const runtime = makeCommandRuntimeResult(3);
    const contract = createStreamingExecutionContract({ now: () => "2026-03-23T10:00:00.000Z" });
    const chunks = contract.stream(runtime);

    expect(chunks).toHaveLength(3);
  });

  it("maps EXECUTED records to STREAMED chunk status", () => {
    const runtime = makeCommandRuntimeResult(2);
    const contract = createStreamingExecutionContract({ now: () => "2026-03-23T10:00:00.000Z" });
    const chunks = contract.stream(runtime);

    expect(chunks.every((c) => c.chunkStatus === "STREAMED")).toBe(true);
  });

  it("assigns sequential sequenceNumbers starting from 0", () => {
    const runtime = makeCommandRuntimeResult(3);
    const contract = createStreamingExecutionContract({ now: () => "2026-03-23T10:00:00.000Z" });
    const chunks = contract.stream(runtime);

    expect(chunks[0].sequenceNumber).toBe(0);
    expect(chunks[1].sequenceNumber).toBe(1);
    expect(chunks[2].sequenceNumber).toBe(2);
  });

  it("each chunk carries sourceRuntimeId from the CommandRuntimeResult", () => {
    const runtime = makeCommandRuntimeResult(2);
    const contract = createStreamingExecutionContract({ now: () => "2026-03-23T10:00:00.000Z" });
    const chunks = contract.stream(runtime);

    expect(chunks.every((c) => c.sourceRuntimeId === runtime.runtimeId)).toBe(true);
  });

  it("produces stable chunkHash for identical inputs", () => {
    const runtime = makeCommandRuntimeResult(1);
    const c1 = createStreamingExecutionContract({ now: () => "2026-03-23T10:00:00.000Z" });
    const c2 = createStreamingExecutionContract({ now: () => "2026-03-23T10:00:00.000Z" });

    expect(c1.stream(runtime)[0].chunkHash).toBe(c2.stream(runtime)[0].chunkHash);
  });

  it("returns empty array when CommandRuntimeResult has no records", () => {
    const runtime = makeCommandRuntimeResult(0);
    const contract = createStreamingExecutionContract({ now: () => "2026-03-23T10:00:00.000Z" });
    const chunks = contract.stream(runtime);

    expect(chunks).toHaveLength(0);
  });

  it("chunkId is non-empty and differs from chunkHash", () => {
    const runtime = makeCommandRuntimeResult(1);
    const contract = createStreamingExecutionContract({ now: () => "2026-03-23T10:00:00.000Z" });
    const chunk = contract.stream(runtime)[0];

    expect(chunk.chunkId.length).toBeGreaterThan(0);
    expect(chunk.chunkId).not.toBe(chunk.chunkHash);
  });

  it("creates StreamingExecutionContract via class constructor", () => {
    const contract = new StreamingExecutionContract();
    expect(contract).toBeInstanceOf(StreamingExecutionContract);
  });
});

// ---------------------------------------------------------------------------
// W6-T1 CP2 — StreamingExecutionAggregatorContract
// ---------------------------------------------------------------------------

describe("W6-T1 CP2 — StreamingExecutionAggregatorContract", () => {
  it("returns STREAMED dominantChunkStatus for all-STREAMED chunks", () => {
    const contract = createStreamingExecutionAggregatorContract({ now: () => "2026-03-23T10:00:00.000Z" });
    const summary = contract.aggregate([makeChunk("STREAMED", "1"), makeChunk("STREAMED", "2")]);

    expect(summary.dominantChunkStatus).toBe("STREAMED");
    expect(summary.streamedCount).toBe(2);
  });

  it("returns FAILED dominantChunkStatus when any chunk is FAILED", () => {
    const contract = createStreamingExecutionAggregatorContract({ now: () => "2026-03-23T10:00:00.000Z" });
    const summary = contract.aggregate([
      makeChunk("STREAMED", "1"),
      makeChunk("FAILED", "2"),
      makeChunk("SKIPPED", "3"),
    ]);

    expect(summary.dominantChunkStatus).toBe("FAILED");
    expect(summary.failedCount).toBe(1);
  });

  it("returns SKIPPED dominantChunkStatus when no FAILED but some SKIPPED", () => {
    const contract = createStreamingExecutionAggregatorContract({ now: () => "2026-03-23T10:00:00.000Z" });
    const summary = contract.aggregate([
      makeChunk("STREAMED", "1"),
      makeChunk("SKIPPED", "2"),
    ]);

    expect(summary.dominantChunkStatus).toBe("SKIPPED");
    expect(summary.skippedCount).toBe(1);
  });

  it("returns STREAMED dominantChunkStatus for empty chunk list", () => {
    const contract = createStreamingExecutionAggregatorContract({ now: () => "2026-03-23T10:00:00.000Z" });
    const summary = contract.aggregate([]);

    expect(summary.totalChunks).toBe(0);
    expect(summary.dominantChunkStatus).toBe("STREAMED");
    expect(summary.streamedCount).toBe(0);
  });

  it("counts are correct for mixed status chunks", () => {
    const contract = createStreamingExecutionAggregatorContract({ now: () => "2026-03-23T10:00:00.000Z" });
    const summary = contract.aggregate([
      makeChunk("STREAMED", "1"),
      makeChunk("STREAMED", "2"),
      makeChunk("SKIPPED", "3"),
      makeChunk("FAILED", "4"),
    ]);

    expect(summary.totalChunks).toBe(4);
    expect(summary.streamedCount).toBe(2);
    expect(summary.skippedCount).toBe(1);
    expect(summary.failedCount).toBe(1);
  });

  it("produces stable aggregatorHash for identical inputs", () => {
    const chunks = [makeChunk("STREAMED", "1"), makeChunk("SKIPPED", "2")];
    const c1 = createStreamingExecutionAggregatorContract({ now: () => "2026-03-23T10:00:00.000Z" });
    const c2 = createStreamingExecutionAggregatorContract({ now: () => "2026-03-23T10:00:00.000Z" });

    expect(c1.aggregate(chunks).aggregatorHash).toBe(c2.aggregate(chunks).aggregatorHash);
  });

  it("summaryId is non-empty and differs from aggregatorHash", () => {
    const contract = createStreamingExecutionAggregatorContract({ now: () => "2026-03-23T10:00:00.000Z" });
    const summary = contract.aggregate([makeChunk("STREAMED", "1")]);

    expect(summary.summaryId.length).toBeGreaterThan(0);
    expect(summary.summaryId).not.toBe(summary.aggregatorHash);
  });

  it("creates StreamingExecutionAggregatorContract via class constructor", () => {
    const contract = new StreamingExecutionAggregatorContract();
    expect(contract).toBeInstanceOf(StreamingExecutionAggregatorContract);
  });
});
