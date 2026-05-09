import { describe, it, expect } from "vitest";
import {
  GatewayConsumerPipelineContract,
  createGatewayConsumerPipelineContract,
} from "../src/gateway.consumer.pipeline.contract";

// ─── W1-T14 CP1: GatewayConsumerPipelineContract ─────────────────────────────

const FIXED_NOW = () => "2026-03-24T05:00:00.000Z";

const CANDIDATE_ITEMS = [
  {
    itemId: "item-1",
    title: "TypeScript Best Practices",
    content: "Use strict mode and proper typing for all functions.",
    source: "docs",
    relevanceScore: 0.9,
    tier: "T1" as const,
    recencyScore: 0.8,
  },
  {
    itemId: "item-2",
    title: "CVF Architecture Overview",
    content: "CVF is a governance-first, contract-based AI framework.",
    source: "whitepaper",
    relevanceScore: 0.75,
    tier: "T2" as const,
    recencyScore: 0.7,
  },
];

describe("W1-T14 CP1: GatewayConsumerPipelineContract", () => {
  it("createGatewayConsumerPipelineContract returns an instance", () => {
    expect(createGatewayConsumerPipelineContract()).toBeInstanceOf(
      GatewayConsumerPipelineContract,
    );
  });

  it("execute returns a GatewayConsumerPipelineResult with all required fields", () => {
    const contract = createGatewayConsumerPipelineContract({ now: FIXED_NOW });
    const result = contract.execute({
      rawSignal: "How does CVF handle knowledge ranking?",
      candidateItems: CANDIDATE_ITEMS,
    });
    expect(result.resultId).toBeTruthy();
    expect(result.createdAt).toBe(FIXED_NOW());
    expect(result.pipelineGatewayHash).toBeTruthy();
    expect(result.gatewayRequest).toBeDefined();
    expect(result.consumerPackage).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("gatewayRequest contains normalizedSignal derived from rawSignal", () => {
    const contract = createGatewayConsumerPipelineContract({ now: FIXED_NOW });
    const result = contract.execute({
      rawSignal: "Explain CVF control plane architecture",
      candidateItems: CANDIDATE_ITEMS,
    });
    expect(result.gatewayRequest.normalizedSignal).toBe(
      "Explain CVF control plane architecture",
    );
    expect(result.gatewayRequest.rawSignal).toBe(
      "Explain CVF control plane architecture",
    );
  });

  it("consumerPackage contains rankedKnowledgeResult and typedContextPackage", () => {
    const contract = createGatewayConsumerPipelineContract({ now: FIXED_NOW });
    const result = contract.execute({
      rawSignal: "CVF knowledge layer",
      candidateItems: CANDIDATE_ITEMS,
    });
    expect(result.consumerPackage.rankedKnowledgeResult).toBeDefined();
    expect(result.consumerPackage.typedContextPackage).toBeDefined();
    expect(result.consumerPackage.pipelineHash).toBeTruthy();
  });

  it("contextId in consumer package matches gatewayId", () => {
    const contract = createGatewayConsumerPipelineContract({ now: FIXED_NOW });
    const result = contract.execute({
      rawSignal: "query for context id test",
      candidateItems: CANDIDATE_ITEMS,
    });
    expect(result.consumerPackage.contextId).toBe(
      result.gatewayRequest.gatewayId,
    );
  });

  it("pipelineGatewayHash is deterministic for the same inputs", () => {
    const contract = createGatewayConsumerPipelineContract({ now: FIXED_NOW });
    const r1 = contract.execute({
      rawSignal: "determinism check",
      candidateItems: CANDIDATE_ITEMS,
    });
    const r2 = contract.execute({
      rawSignal: "determinism check",
      candidateItems: CANDIDATE_ITEMS,
    });
    expect(r1.pipelineGatewayHash).toBe(r2.pipelineGatewayHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("pipelineGatewayHash changes when rawSignal changes", () => {
    const contract = createGatewayConsumerPipelineContract({ now: FIXED_NOW });
    const r1 = contract.execute({ rawSignal: "signal alpha", candidateItems: CANDIDATE_ITEMS });
    const r2 = contract.execute({ rawSignal: "signal beta", candidateItems: CANDIDATE_ITEMS });
    expect(r1.pipelineGatewayHash).not.toBe(r2.pipelineGatewayHash);
  });

  it("gateway privacy masking is applied and reflected in warnings", () => {
    const contract = createGatewayConsumerPipelineContract({ now: FIXED_NOW });
    const result = contract.execute({
      rawSignal: "Contact me at user@example.com for details",
      candidateItems: CANDIDATE_ITEMS,
    });
    expect(result.gatewayRequest.privacyReport.maskedTokenCount).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.startsWith("[gateway]"))).toBe(true);
  });

  it("consumerId and sessionId are propagated to result", () => {
    const contract = createGatewayConsumerPipelineContract({ now: FIXED_NOW });
    const result = contract.execute({
      rawSignal: "CVF architecture",
      candidateItems: CANDIDATE_ITEMS,
      consumerId: "consumer-xyz",
      sessionId: "session-abc",
    });
    expect(result.consumerId).toBe("consumer-xyz");
    expect(result.sessionId).toBe("session-abc");
  });

  it("empty candidateItems produces valid result with zero ranked items", () => {
    const contract = createGatewayConsumerPipelineContract({ now: FIXED_NOW });
    const result = contract.execute({
      rawSignal: "CVF empty knowledge test",
      candidateItems: [],
    });
    expect(result.resultId).toBeTruthy();
    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  it("resultId differs from pipelineGatewayHash", () => {
    const contract = createGatewayConsumerPipelineContract({ now: FIXED_NOW });
    const result = contract.execute({
      rawSignal: "id uniqueness check",
      candidateItems: CANDIDATE_ITEMS,
    });
    expect(result.resultId).not.toBe(result.pipelineGatewayHash);
  });
});
