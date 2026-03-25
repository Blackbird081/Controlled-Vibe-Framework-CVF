import { describe, it, expect } from "vitest";
import {
  BoardroomConsumerPipelineContract,
  createBoardroomConsumerPipelineContract,
} from "../src/boardroom.consumer.pipeline.contract";
import type {
  BoardroomConsumerPipelineRequest,
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

function makeContract(): BoardroomConsumerPipelineContract {
  return createBoardroomConsumerPipelineContract({ now: fixedNow });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("BoardroomConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createBoardroomConsumerPipelineContract();
    expect(contract).toBeInstanceOf(BoardroomConsumerPipelineContract);
  });

  it("execute returns a result with expected shape", () => {
    const result = makeContract().execute({ rounds: [] });
    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("multiRoundSummary");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
  });

  it("createdAt matches injected now", () => {
    const result = makeContract().execute({ rounds: [] });
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("empty rounds — PROCEED dominant — empty warnings", () => {
    const result = makeContract().execute({ rounds: [] });
    expect(result.multiRoundSummary.dominantDecision).toBe("PROCEED");
    expect(result.warnings).toHaveLength(0);
  });

  it("PROCEED rounds — empty warnings", () => {
    const result = makeContract().execute({
      rounds: [makeRound("PROCEED", 1), makeRound("PROCEED", 2)],
    });
    expect(result.multiRoundSummary.dominantDecision).toBe("PROCEED");
    expect(result.warnings).toHaveLength(0);
  });

  it("AMEND_PLAN round — warnings contain amend message", () => {
    const result = makeContract().execute({
      rounds: [makeRound("AMEND_PLAN", 1)],
    });
    expect(result.multiRoundSummary.dominantDecision).toBe("AMEND_PLAN");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[boardroom]");
    expect(result.warnings[0]).toContain("amend");
  });

  it("ESCALATE round — warnings contain escalation message", () => {
    const result = makeContract().execute({
      rounds: [makeRound("ESCALATE", 1)],
    });
    expect(result.multiRoundSummary.dominantDecision).toBe("ESCALATE");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[boardroom]");
    expect(result.warnings[0]).toContain("escalation");
  });

  it("REJECT round — warnings contain risk review message", () => {
    const result = makeContract().execute({
      rounds: [makeRound("REJECT", 1)],
    });
    expect(result.multiRoundSummary.dominantDecision).toBe("REJECT");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[boardroom]");
    expect(result.warnings[0]).toContain("reject");
  });

  it("REJECT takes precedence over ESCALATE in dominant decision", () => {
    const result = makeContract().execute({
      rounds: [makeRound("ESCALATE", 1), makeRound("REJECT", 2)],
    });
    expect(result.multiRoundSummary.dominantDecision).toBe("REJECT");
    expect(result.warnings[0]).toContain("reject");
  });

  it("multiRoundSummary totalRounds reflects input length", () => {
    const result = makeContract().execute({
      rounds: [makeRound("PROCEED", 1), makeRound("AMEND_PLAN", 2)],
    });
    expect(result.multiRoundSummary.totalRounds).toBe(2);
  });

  it("consumerPackage contextId matches multiRoundSummary.summaryId", () => {
    const result = makeContract().execute({ rounds: [] });
    expect(result.consumerPackage.contextId).toBe(
      result.multiRoundSummary.summaryId,
    );
  });

  it("consumerPackage query derived from summary text", () => {
    const result = makeContract().execute({
      rounds: [makeRound("PROCEED", 1)],
    });
    expect(result.consumerPackage.query).toBeTruthy();
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("pipelineHash and resultId are non-empty strings", () => {
    const result = makeContract().execute({ rounds: [] });
    expect(typeof result.pipelineHash).toBe("string");
    expect(result.pipelineHash.length).toBeGreaterThan(0);
    expect(typeof result.resultId).toBe("string");
    expect(result.resultId.length).toBeGreaterThan(0);
  });

  it("pipelineHash differs from resultId", () => {
    const result = makeContract().execute({ rounds: [] });
    expect(result.pipelineHash).not.toBe(result.resultId);
  });

  it("is deterministic — same input yields same hashes", () => {
    const contract = makeContract();
    const req: BoardroomConsumerPipelineRequest = {
      rounds: [makeRound("PROCEED", 1)],
    };
    const r1 = contract.execute(req);
    const r2 = contract.execute(req);
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different dominant decisions produce different pipelineHash", () => {
    const contract = makeContract();
    const r1 = contract.execute({ rounds: [makeRound("PROCEED", 1)] });
    const r2 = contract.execute({ rounds: [makeRound("REJECT", 1)] });
    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("candidateItems accepted and reflected in rankedKnowledgeResult", () => {
    const result = makeContract().execute({
      rounds: [makeRound("PROCEED", 1)],
      candidateItems: [
        {
          itemId: "item-1",
          title: "Boardroom Item",
          content: "boardroom item",
          source: "boardroom-test",
          relevanceScore: 0.8,
        },
      ],
    });
    expect(result.consumerPackage.rankedKnowledgeResult.totalRanked).toBe(1);
  });

  it("consumerId carried through to result", () => {
    const result = makeContract().execute({
      rounds: [],
      consumerId: "consumer-xyz",
    });
    expect(result.consumerId).toBe("consumer-xyz");
  });

  it("consumerId is undefined when not provided", () => {
    const result = makeContract().execute({ rounds: [] });
    expect(result.consumerId).toBeUndefined();
  });
});
