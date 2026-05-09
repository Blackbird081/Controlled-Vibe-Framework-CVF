import { describe, it, expect } from "vitest";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "../src/consumer.pipeline.contract";
import type { ControlPlaneConsumerRequest } from "../src";

// ─── W1-T13 CP1: ControlPlaneConsumerPipelineContract ────────────────────────

const FIXED_NOW = () => "2026-03-23T12:00:00.000Z";

function makeRequest(
  overrides: Partial<ControlPlaneConsumerRequest> = {},
): ControlPlaneConsumerRequest {
  return {
    rankingRequest: {
      query: "CVF governance patterns",
      contextId: "ctx-w1t13-test",
      candidateItems: [
        {
          itemId: "item-1",
          title: "Governance Control Docs",
          content: "Governance control documentation",
          source: "governance",
          relevanceScore: 0.9,
          tier: "T0",
          recencyScore: 0.85,
        },
        {
          itemId: "item-2",
          title: "Architecture Overview",
          content: "Architecture overview",
          source: "whitepaper",
          relevanceScore: 0.7,
          tier: "T1",
          recencyScore: 0.5,
        },
      ],
    },
    ...overrides,
  };
}

describe("W1-T13 CP1: ControlPlaneConsumerPipelineContract", () => {
  it("createControlPlaneConsumerPipelineContract returns an instance", () => {
    expect(createControlPlaneConsumerPipelineContract()).toBeInstanceOf(
      ControlPlaneConsumerPipelineContract,
    );
  });

  it("execute returns a ControlPlaneConsumerPackage with all required fields", () => {
    const contract = createControlPlaneConsumerPipelineContract({ now: FIXED_NOW });
    const pkg = contract.execute(makeRequest());
    expect(pkg.packageId).toBeTruthy();
    expect(pkg.createdAt).toBe(FIXED_NOW());
    expect(pkg.contextId).toBe("ctx-w1t13-test");
    expect(pkg.query).toBe("CVF governance patterns");
    expect(pkg.rankedKnowledgeResult).toBeDefined();
    expect(pkg.typedContextPackage).toBeDefined();
    expect(pkg.pipelineHash).toBeTruthy();
  });

  it("rankedKnowledgeResult contains ranked items", () => {
    const contract = createControlPlaneConsumerPipelineContract({ now: FIXED_NOW });
    const pkg = contract.execute(makeRequest());
    expect(pkg.rankedKnowledgeResult.items.length).toBe(2);
    expect(pkg.rankedKnowledgeResult.items[0].rank).toBe(1);
  });

  it("typedContextPackage is built from ranked knowledge items", () => {
    const contract = createControlPlaneConsumerPipelineContract({ now: FIXED_NOW });
    const pkg = contract.execute(makeRequest());
    expect(pkg.typedContextPackage.segments.length).toBeGreaterThan(0);
  });

  it("contextId and query propagate from rankingRequest", () => {
    const contract = createControlPlaneConsumerPipelineContract({ now: FIXED_NOW });
    const pkg = contract.execute(makeRequest());
    expect(pkg.contextId).toBe(pkg.rankedKnowledgeResult.contextId);
    expect(pkg.query).toBe(pkg.rankedKnowledgeResult.query);
  });

  it("pipelineHash is deterministic for the same inputs", () => {
    const contract = createControlPlaneConsumerPipelineContract({ now: FIXED_NOW });
    const req = makeRequest();
    const p1 = contract.execute(req);
    const p2 = contract.execute(req);
    expect(p1.pipelineHash).toBe(p2.pipelineHash);
    expect(p1.packageId).toBe(p2.packageId);
  });

  it("pipelineHash changes when candidate items change", () => {
    const contract = createControlPlaneConsumerPipelineContract({ now: FIXED_NOW });
    const r1 = contract.execute(makeRequest());
    const r2 = contract.execute(
      makeRequest({
        rankingRequest: {
          query: "CVF governance patterns",
          contextId: "ctx-w1t13-test",
          candidateItems: [
            { itemId: "item-x", title: "Different Item", content: "Different item", source: "other", relevanceScore: 0.5 },
          ],
        },
      }),
    );
    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("segmentTypeConstraints flow through to typedContextPackage", () => {
    const contract = createControlPlaneConsumerPipelineContract({ now: FIXED_NOW });
    const pkg = contract.execute(
      makeRequest({
        segmentTypeConstraints: { allowedTypes: ["KNOWLEDGE"] },
      }),
    );
    const types = new Set(pkg.typedContextPackage.segments.map((s) => s.segmentType));
    types.forEach((t) => expect(t).toBe("KNOWLEDGE"));
  });

  it("empty candidate items produces package with no knowledge segments", () => {
    const contract = createControlPlaneConsumerPipelineContract({ now: FIXED_NOW });
    const pkg = contract.execute(
      makeRequest({
        rankingRequest: {
          query: "empty",
          contextId: "ctx-empty",
          candidateItems: [],
        },
      }),
    );
    expect(pkg.rankedKnowledgeResult.totalRanked).toBe(0);
    expect(pkg.pipelineHash).toBeTruthy();
  });

  it("packageId is a non-empty string and differs from pipelineHash", () => {
    const contract = createControlPlaneConsumerPipelineContract({ now: FIXED_NOW });
    const pkg = contract.execute(makeRequest());
    expect(pkg.packageId).toBeTruthy();
    expect(pkg.packageId).not.toBe(pkg.pipelineHash);
  });
});
