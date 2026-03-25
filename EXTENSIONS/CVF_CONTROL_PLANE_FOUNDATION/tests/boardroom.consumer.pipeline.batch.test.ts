import { describe, it, expect } from "vitest";
import {
  BoardroomConsumerPipelineBatchContract,
  createBoardroomConsumerPipelineBatchContract,
} from "../src/boardroom.consumer.pipeline.batch.contract";
import {
  createBoardroomConsumerPipelineContract,
} from "../src/boardroom.consumer.pipeline.contract";
import type { BoardroomRound } from "../src/boardroom.round.contract";
import type { BoardroomDecision } from "../src/boardroom.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T10:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeRound(
  decision: BoardroomDecision,
  roundNumber = 1,
): BoardroomRound {
  return {
    roundId: `round-${roundNumber}`,
    roundNumber,
    createdAt: FIXED_NOW,
    sourceSessionId: "session-1",
    sourceDecision: decision,
    refinementFocus: "CLARIFICATION",
    refinementNote: `note for ${decision}`,
    roundHash: `hash-round-${roundNumber}`,
  };
}

function makePipelineResult(decision: BoardroomDecision, idx = 0) {
  const pipeline = createBoardroomConsumerPipelineContract({ now: fixedNow });
  return pipeline.execute({
    rounds: [makeRound(decision, idx + 1)],
    candidateItems: [
      {
        itemId: `item-${idx}`,
        title: `title-${idx}`,
        content: `content-${idx}`,
        source: `source-${idx}`,
        relevanceScore: 0.5 + idx * 0.1,
      },
    ],
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("BoardroomConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createBoardroomConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(BoardroomConsumerPipelineBatchContract);
  });

  it("empty batch — valid result with dominantTokenBudget = 0", () => {
    const contract = createBoardroomConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(typeof batch.batchHash).toBe("string");
    expect(batch.batchHash.length).toBeGreaterThan(0);
  });

  it("single result batch — totalResults = 1", () => {
    const contract = createBoardroomConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([makePipelineResult("PROCEED", 0)]);
    expect(batch.totalResults).toBe(1);
    expect(batch.results).toHaveLength(1);
  });

  it("multi-result batch — totalResults matches input", () => {
    const contract = createBoardroomConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [
      makePipelineResult("PROCEED", 0),
      makePipelineResult("REJECT", 1),
      makePipelineResult("ESCALATE", 2),
    ];
    const batch = contract.batch(results);
    expect(batch.totalResults).toBe(3);
  });

  it("dominantTokenBudget is the max estimatedTokens across results", () => {
    const contract = createBoardroomConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [
      makePipelineResult("PROCEED", 0),
      makePipelineResult("AMEND_PLAN", 1),
    ];
    const expected = Math.max(
      ...results.map(
        (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
      ),
    );
    const batch = contract.batch(results);
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("rejectCount counts REJECT dominant decisions", () => {
    const contract = createBoardroomConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [
      makePipelineResult("REJECT", 0),
      makePipelineResult("REJECT", 1),
      makePipelineResult("PROCEED", 2),
    ];
    const batch = contract.batch(results);
    expect(batch.rejectCount).toBe(2);
  });

  it("escalateCount counts ESCALATE dominant decisions", () => {
    const contract = createBoardroomConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [
      makePipelineResult("ESCALATE", 0),
      makePipelineResult("PROCEED", 1),
    ];
    const batch = contract.batch(results);
    expect(batch.escalateCount).toBe(1);
  });

  it("batchId differs from batchHash", () => {
    const contract = createBoardroomConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([makePipelineResult("PROCEED", 0)]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("is deterministic — same results yield same batchHash", () => {
    const contract = createBoardroomConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [makePipelineResult("PROCEED", 0)];
    const b1 = contract.batch(results);
    const b2 = contract.batch(results);
    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("createdAt matches injected now", () => {
    const contract = createBoardroomConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([]);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });
});
