import { describe, it, expect } from "vitest";
import {
  ReversePromptingConsumerPipelineBatchContract,
  createReversePromptingConsumerPipelineBatchContract,
} from "../src/reverse.prompting.consumer.pipeline.batch.contract";
import { createReversePromptingConsumerPipelineContract } from "../src/reverse.prompting.consumer.pipeline.contract";
import type { ControlPlaneIntakeResult } from "../src/intake.contract";
import type { ValidatedIntent } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T10:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeValidatedIntent(
  domain: ValidatedIntent["intent"]["domain"],
  valid = true,
): ValidatedIntent {
  return {
    intent: {
      domain,
      action: "build",
      object: "feature",
      limits: {},
      requireApproval: false,
      confidence: valid ? 0.9 : 0.2,
      rawVibe: `build a ${domain} feature`,
    },
    rules: [],
    constraints: [],
    timestamp: 0,
    pipelineVersion: "1.0",
    valid,
    errors: valid ? [] : ["low confidence"],
  };
}

function makeIntakeResult(opts: {
  domain?: ValidatedIntent["intent"]["domain"];
  valid?: boolean;
  hasChunks?: boolean;
} = {}): ControlPlaneIntakeResult {
  const { domain = "finance", valid = true, hasChunks = true } = opts;
  const chunks = hasChunks
    ? [{ id: "c1", source: "s", content: "text", relevanceScore: 1.0 }]
    : [];
  return {
    requestId: `req-${domain}-${valid}`,
    createdAt: FIXED_NOW,
    intent: makeValidatedIntent(domain, valid),
    retrieval: {
      query: "build a feature",
      chunkCount: chunks.length,
      totalCandidates: chunks.length,
      retrievalTimeMs: 0,
      tiersSearched: [],
      chunks,
    },
    packagedContext: {
      chunks,
      totalTokens: chunks.length,
      tokenBudget: 256,
      truncated: false,
      snapshotHash: "a".repeat(32),
    },
    warnings: [],
  };
}

function makeResult(opts: {
  domain?: ValidatedIntent["intent"]["domain"];
  valid?: boolean;
  hasChunks?: boolean;
} = {}) {
  const pipeline = createReversePromptingConsumerPipelineContract({ now: fixedNow });
  return pipeline.execute({ intakeResult: makeIntakeResult(opts) });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ReversePromptingConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createReversePromptingConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(ReversePromptingConsumerPipelineBatchContract);
  });

  it("empty batch — dominantTokenBudget is 0, totalResults is 0", () => {
    const contract = createReversePromptingConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
  });

  it("empty batch — batchHash and batchId are valid non-empty strings", () => {
    const contract = createReversePromptingConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(typeof batch.batchHash).toBe("string");
    expect(batch.batchHash.length).toBeGreaterThan(0);
    expect(typeof batch.batchId).toBe("string");
    expect(batch.batchId.length).toBeGreaterThan(0);
  });

  it("batchId differs from batchHash", () => {
    const contract = createReversePromptingConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult()]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("highPriorityResultCount counts results with highPriorityCount > 0", () => {
    const contract = createReversePromptingConsumerPipelineBatchContract({ now: fixedNow });
    // invalid intent and no chunks → high-priority questions
    const withHighPriority = makeResult({ valid: false });
    const withoutHighPriority = makeResult({ domain: "finance", valid: true, hasChunks: true });
    const batch = contract.batch([withHighPriority, withoutHighPriority]);
    expect(batch.highPriorityResultCount).toBe(1);
  });

  it("totalQuestionsCount sums questions across results", () => {
    const contract = createReversePromptingConsumerPipelineBatchContract({ now: fixedNow });
    const r1 = makeResult({ valid: false });
    const r2 = makeResult({ domain: "finance", valid: true, hasChunks: true });
    const batch = contract.batch([r1, r2]);
    const expected = r1.reversePromptPacket.totalQuestions + r2.reversePromptPacket.totalQuestions;
    expect(batch.totalQuestionsCount).toBe(expected);
  });

  it("empty batch — highPriorityResultCount and totalQuestionsCount are 0", () => {
    const contract = createReversePromptingConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(batch.highPriorityResultCount).toBe(0);
    expect(batch.totalQuestionsCount).toBe(0);
  });

  it("dominantTokenBudget is the max estimatedTokens across results", () => {
    const contract = createReversePromptingConsumerPipelineBatchContract({ now: fixedNow });
    const r1 = makeResult({ domain: "finance" });
    const r2 = makeResult({ domain: "code_security" });
    const batch = contract.batch([r1, r2]);
    const expected = Math.max(
      r1.consumerPackage.typedContextPackage.estimatedTokens,
      r2.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("createdAt matches injected now", () => {
    const contract = createReversePromptingConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult()]);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });

  it("totalResults matches input length", () => {
    const contract = createReversePromptingConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult({ domain: "finance" }), makeResult({ domain: "code_security" }), makeResult({ domain: "data" })]);
    expect(batch.totalResults).toBe(3);
  });

  it("results array is preserved in batch output", () => {
    const contract = createReversePromptingConsumerPipelineBatchContract({ now: fixedNow });
    const input = [makeResult({ domain: "finance" }), makeResult({ valid: false })];
    const batch = contract.batch(input);
    expect(batch.results).toHaveLength(2);
  });
});
