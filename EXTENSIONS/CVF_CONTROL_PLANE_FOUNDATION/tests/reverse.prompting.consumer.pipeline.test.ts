import { describe, it, expect } from "vitest";
import {
  ReversePromptingConsumerPipelineContract,
  createReversePromptingConsumerPipelineContract,
} from "../src/reverse.prompting.consumer.pipeline.contract";
import type {
  ReversePromptingConsumerPipelineRequest,
} from "../src/reverse.prompting.consumer.pipeline.contract";
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
  truncated?: boolean;
  warnings?: string[];
  consumerId?: string;
} = {}): ControlPlaneIntakeResult {
  const {
    domain = "general",
    valid = true,
    hasChunks = false,
    truncated = false,
    warnings = [],
    consumerId,
  } = opts;
  const chunks = hasChunks
    ? [{ id: "c1", source: "s", content: "text", relevanceScore: 1.0 }]
    : [];
  return {
    requestId: `req-${domain}-${valid}`,
    createdAt: FIXED_NOW,
    consumerId,
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
      truncated,
      snapshotHash: "a".repeat(32),
    },
    warnings,
  };
}

function makeContract(): ReversePromptingConsumerPipelineContract {
  return createReversePromptingConsumerPipelineContract({ now: fixedNow });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ReversePromptingConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createReversePromptingConsumerPipelineContract();
    expect(contract).toBeInstanceOf(ReversePromptingConsumerPipelineContract);
  });

  it("execute returns a result with expected shape", () => {
    const result = makeContract().execute({ intakeResult: makeIntakeResult() });
    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("reversePromptPacket");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
  });

  it("createdAt matches injected now", () => {
    const result = makeContract().execute({ intakeResult: makeIntakeResult() });
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("valid intent with specific domain and chunks — no warnings", () => {
    // domain "finance" avoids the domain_specificity question triggered by "general"
    const result = makeContract().execute({
      intakeResult: makeIntakeResult({ domain: "finance", valid: true, hasChunks: true }),
    });
    expect(result.warnings).toHaveLength(0);
  });

  it("invalid intent — highPriorityCount > 0 — warnings contain reverse-prompting prefix", () => {
    const result = makeContract().execute({
      intakeResult: makeIntakeResult({ valid: false }),
    });
    expect(result.reversePromptPacket.highPriorityCount).toBeGreaterThan(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[reverse-prompting]");
  });

  it("empty retrieval — highPriorityCount > 0 — warnings present", () => {
    const result = makeContract().execute({
      intakeResult: makeIntakeResult({ hasChunks: false }),
    });
    expect(result.reversePromptPacket.highPriorityCount).toBeGreaterThan(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("high-priority");
  });

  it("warning message references clarification questions", () => {
    const result = makeContract().execute({
      intakeResult: makeIntakeResult({ valid: false }),
    });
    expect(result.warnings[0]).toContain("clarification questions");
  });

  it("query contains 'reverse-prompting'", () => {
    const result = makeContract().execute({ intakeResult: makeIntakeResult() });
    expect(result.consumerPackage.query).toContain("reverse-prompting");
  });

  it("query contains domain name", () => {
    const result = makeContract().execute({
      intakeResult: makeIntakeResult({ domain: "finance" }),
    });
    expect(result.consumerPackage.query).toContain("finance");
  });

  it("query length is at most 120 chars", () => {
    const result = makeContract().execute({ intakeResult: makeIntakeResult() });
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("consumerPackage contextId matches reversePromptPacket.packetId", () => {
    const result = makeContract().execute({ intakeResult: makeIntakeResult() });
    expect(result.consumerPackage.contextId).toBe(
      result.reversePromptPacket.packetId,
    );
  });

  it("pipelineHash and resultId are non-empty strings", () => {
    const result = makeContract().execute({ intakeResult: makeIntakeResult() });
    expect(typeof result.pipelineHash).toBe("string");
    expect(result.pipelineHash.length).toBeGreaterThan(0);
    expect(typeof result.resultId).toBe("string");
    expect(result.resultId.length).toBeGreaterThan(0);
  });

  it("pipelineHash differs from resultId", () => {
    const result = makeContract().execute({ intakeResult: makeIntakeResult() });
    expect(result.pipelineHash).not.toBe(result.resultId);
  });

  it("is deterministic — same input yields same hashes", () => {
    const contract = makeContract();
    const req: ReversePromptingConsumerPipelineRequest = {
      intakeResult: makeIntakeResult({ domain: "general" }),
    };
    const r1 = contract.execute(req);
    const r2 = contract.execute(req);
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different intakes produce different pipelineHash", () => {
    const contract = makeContract();
    const r1 = contract.execute({ intakeResult: makeIntakeResult({ domain: "finance" }) });
    const r2 = contract.execute({ intakeResult: makeIntakeResult({ domain: "code_security" }) });
    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("candidateItems accepted and reflected in rankedKnowledgeResult", () => {
    const result = makeContract().execute({
      intakeResult: makeIntakeResult(),
      candidateItems: [
        {
          itemId: "item-1",
          title: "Prompting Item",
          content: "prompting item",
          source: "reverse-prompting-test",
          relevanceScore: 0.9,
        },
      ],
    });
    expect(result.consumerPackage.rankedKnowledgeResult.totalRanked).toBe(1);
  });

  it("consumerId carried through to result", () => {
    const result = makeContract().execute({
      intakeResult: makeIntakeResult(),
      consumerId: "consumer-rp",
    });
    expect(result.consumerId).toBe("consumer-rp");
  });

  it("consumerId is undefined when not provided", () => {
    const result = makeContract().execute({ intakeResult: makeIntakeResult() });
    expect(result.consumerId).toBeUndefined();
  });
});
