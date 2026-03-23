/**
 * CPF Intake & Consumer — Dedicated Tests (W6-T26)
 * ==================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   ControlPlaneIntakeContract.execute:
 *     - createdAt set to injected now()
 *     - consumerId propagated from request
 *     - consumerId = undefined when not in request
 *     - requestId is a truthy deterministic string
 *     - retrieval.query = request.retrievalQuery when provided (explicit)
 *     - retrieval.query falls back to intent-derived value when not provided
 *     - warnings include "No retrieval chunks" when pipeline returns empty
 *     - intent field is present with valid/errors
 *     - factory createControlPlaneIntakeContract returns working instance
 *     - packageIntakeContext helper packages chunks by token budget
 *
 *   ConsumerContract.consume:
 *     - consumerId = request.consumerId
 *     - consumedAt set to injected now()
 *     - requestId present (truthy)
 *     - evidenceHash present (truthy)
 *     - intake field present (valid ControlPlaneIntakeResult)
 *     - freeze = undefined when no executionId
 *     - freeze.executionId set when executionId provided
 *     - getContext() returns injected context
 *     - factory createConsumerContract returns working instance
 *
 *   buildPipelineStages helper:
 *     - always includes "intent-validation" and "context-packaging"
 *     - includes "knowledge-retrieval" when chunkCount > 0
 *     - excludes "knowledge-retrieval" when chunkCount === 0
 *     - includes "deterministic-hashing" when snapshotHash.length === 32
 */

import { describe, it, expect } from "vitest";

import {
  ControlPlaneIntakeContract,
  createControlPlaneIntakeContract,
  packageIntakeContext,
} from "../src/intake.contract";
import type { ControlPlaneIntakeResult } from "../src/intake.contract";
import {
  ConsumerContract,
  createConsumerContract,
  buildPipelineStages,
} from "../src/consumer.contract";
import type { ValidatedIntent } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/types";
import { ContextFreezer } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/context.freezer";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T04:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeValidatedIntent(overrides: Partial<ValidatedIntent> = {}): ValidatedIntent {
  return {
    intent: {
      domain: "general",
      action: "build",
      object: "feature",
      limits: {},
      requireApproval: false,
      confidence: 0.8,
      rawVibe: "build a feature",
    },
    rules: [],
    constraints: [],
    timestamp: Date.now(),
    pipelineVersion: "1.0",
    valid: true,
    errors: [],
    ...overrides,
  };
}

function makeIntakeResult(
  chunkCount: number,
  snapshotHash = "a".repeat(32),
): ControlPlaneIntakeResult {
  return {
    requestId: "req-1",
    createdAt: FIXED_NOW,
    consumerId: "consumer-1",
    intent: makeValidatedIntent(),
    retrieval: {
      query: "test query",
      chunkCount,
      totalCandidates: chunkCount,
      retrievalTimeMs: 0,
      tiersSearched: [],
      chunks: Array.from({ length: chunkCount }, (_, i) => ({
        id: `chunk-${i}`,
        source: "src",
        content: "text",
        relevanceScore: 1.0,
      })),
    },
    packagedContext: {
      chunks: [],
      totalTokens: 0,
      tokenBudget: 256,
      truncated: false,
      snapshotHash,
    },
    warnings: [],
  };
}

// ─── ControlPlaneIntakeContract.execute ───────────────────────────────────────

describe("ControlPlaneIntakeContract.execute", () => {
  const contract = new ControlPlaneIntakeContract({ now: fixedNow });

  it("createdAt set to injected now()", () => {
    const result = contract.execute({ vibe: "build a feature" });
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("consumerId propagated from request", () => {
    const result = contract.execute({ vibe: "build a feature", consumerId: "user-123" });
    expect(result.consumerId).toBe("user-123");
  });

  it("consumerId = undefined when not in request", () => {
    const result = contract.execute({ vibe: "build a feature" });
    expect(result.consumerId).toBeUndefined();
  });

  it("requestId is a truthy deterministic string", () => {
    const result = contract.execute({ vibe: "build a feature" });
    expect(typeof result.requestId).toBe("string");
    expect(result.requestId.length).toBeGreaterThan(0);
  });

  it("requestId is deterministic for same inputs and timestamp", () => {
    const r1 = contract.execute({ vibe: "build a feature", consumerId: "u1" });
    const r2 = contract.execute({ vibe: "build a feature", consumerId: "u1" });
    expect(r1.requestId).toBe(r2.requestId);
  });

  it("retrieval.query = request.retrievalQuery when provided", () => {
    const result = contract.execute({ vibe: "anything", retrievalQuery: "explicit query" });
    expect(result.retrieval.query).toBe("explicit query");
  });

  it("retrieval.query derived from intent when retrievalQuery not provided", () => {
    const result = contract.execute({ vibe: "build a feature" });
    expect(typeof result.retrieval.query).toBe("string");
    expect(result.retrieval.query.length).toBeGreaterThan(0);
  });

  it("warnings include 'No retrieval chunks' when pipeline returns empty", () => {
    // Default RAGPipeline has no documents → chunkCount = 0
    const result = contract.execute({ vibe: "build a feature" });
    expect(result.warnings.some((w) => w.includes("No retrieval chunks"))).toBe(true);
  });

  it("intent field is present with valid and errors fields", () => {
    const result = contract.execute({ vibe: "build a feature" });
    expect(result.intent).toBeDefined();
    expect(typeof result.intent.valid).toBe("boolean");
    expect(Array.isArray(result.intent.errors)).toBe(true);
  });

  it("factory createControlPlaneIntakeContract returns working instance", () => {
    const c = createControlPlaneIntakeContract({ now: fixedNow });
    const result = c.execute({ vibe: "build a feature" });
    expect(result.createdAt).toBe(FIXED_NOW);
    expect(result.intent).toBeDefined();
  });
});

// ─── packageIntakeContext helper ───────────────────────────────────────────────

describe("packageIntakeContext", () => {
  it("empty chunks → totalTokens=0, truncated=false", () => {
    const result = packageIntakeContext([], 100);
    expect(result.totalTokens).toBe(0);
    expect(result.truncated).toBe(false);
  });

  it("tokenBudget propagated", () => {
    const result = packageIntakeContext([], 512);
    expect(result.tokenBudget).toBe(512);
  });

  it("chunk exceeding budget → truncated=true", () => {
    const chunks = [
      { id: "a", source: "s", content: "x".repeat(100), relevanceScore: 1.0 }, // 25 tokens
      { id: "b", source: "s", content: "x".repeat(100), relevanceScore: 1.0 }, // 25 tokens
    ];
    // budget = 10 tokens → second chunk won't fit
    const result = packageIntakeContext(chunks, 10);
    expect(result.truncated).toBe(true);
  });
});

// ─── ConsumerContract.consume ─────────────────────────────────────────────────

describe("ConsumerContract.consume", () => {
  const contract = new ConsumerContract({ now: fixedNow });

  it("consumerId = request.consumerId", () => {
    const result = contract.consume({ vibe: "build a feature", consumerId: "cons-abc" });
    expect(result.consumerId).toBe("cons-abc");
  });

  it("consumedAt set to injected now()", () => {
    const result = contract.consume({ vibe: "build a feature", consumerId: "cons-1" });
    expect(result.consumedAt).toBe(FIXED_NOW);
  });

  it("requestId present (truthy)", () => {
    const result = contract.consume({ vibe: "build a feature", consumerId: "cons-1" });
    expect(result.requestId.length).toBeGreaterThan(0);
  });

  it("evidenceHash present (truthy)", () => {
    const result = contract.consume({ vibe: "build a feature", consumerId: "cons-1" });
    expect(result.evidenceHash.length).toBeGreaterThan(0);
  });

  it("intake field present with intent and retrieval", () => {
    const result = contract.consume({ vibe: "build a feature", consumerId: "cons-1" });
    expect(result.intake).toBeDefined();
    expect(result.intake.intent).toBeDefined();
    expect(result.intake.retrieval).toBeDefined();
  });

  it("freeze = undefined when no executionId", () => {
    const result = contract.consume({ vibe: "build a feature", consumerId: "cons-1" });
    expect(result.freeze).toBeUndefined();
  });

  it("freeze.executionId set when executionId provided", () => {
    const result = contract.consume({
      vibe: "build a feature",
      consumerId: "cons-1",
      executionId: "exec-42",
    });
    expect(result.freeze).toBeDefined();
    expect(result.freeze?.executionId).toBe("exec-42");
  });

  it("getContext() returns the injected context", () => {
    const ctx = new ContextFreezer();
    const c = new ConsumerContract({ context: ctx });
    expect(c.getContext()).toBe(ctx);
  });

  it("factory createConsumerContract returns working instance", () => {
    const c = createConsumerContract({ now: fixedNow });
    const result = c.consume({ vibe: "build a feature", consumerId: "u1" });
    expect(result.consumedAt).toBe(FIXED_NOW);
    expect(result.consumerId).toBe("u1");
  });
});

// ─── buildPipelineStages helper ───────────────────────────────────────────────

describe("buildPipelineStages", () => {
  it("always includes 'intent-validation'", () => {
    expect(buildPipelineStages(makeIntakeResult(0))).toContain("intent-validation");
  });

  it("always includes 'context-packaging'", () => {
    expect(buildPipelineStages(makeIntakeResult(0))).toContain("context-packaging");
  });

  it("includes 'knowledge-retrieval' when chunkCount > 0", () => {
    expect(buildPipelineStages(makeIntakeResult(1))).toContain("knowledge-retrieval");
  });

  it("excludes 'knowledge-retrieval' when chunkCount === 0", () => {
    expect(buildPipelineStages(makeIntakeResult(0))).not.toContain("knowledge-retrieval");
  });

  it("includes 'deterministic-hashing' when snapshotHash.length === 32", () => {
    const result = makeIntakeResult(0, "a".repeat(32));
    expect(buildPipelineStages(result)).toContain("deterministic-hashing");
  });

  it("excludes 'deterministic-hashing' when snapshotHash is short", () => {
    const result = makeIntakeResult(0, "short");
    expect(buildPipelineStages(result)).not.toContain("deterministic-hashing");
  });
});
