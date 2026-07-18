import { describe, expect, it, beforeEach } from "vitest";

import {
  ECO_RISK_SCORER_ADAPTER_VERSION,
  RiskScorer,
} from "../src/risk.scorer";
import {
  ECO_RISK_AGGREGATOR_ADAPTER_VERSION,
  RiskAggregator,
  resetSessionCounter,
} from "../src/risk.aggregator";
import { ContextAnalyzer } from "../src/context.analyzer";

describe("Phase 2.B ECO risk fanout adapters", () => {
  beforeEach(() => {
    resetSessionCounter();
  });

  it("RiskScorer.scoreWithAdapter preserves base score semantics", () => {
    const scorer = new RiskScorer();
    const context = {
      domain: "privacy" as const,
      action: "export data",
      target: "crm",
      targetScope: "external" as const,
      dataClassification: "confidential" as const,
    };
    const wrapped = scorer.scoreWithAdapter(context);

    expect(wrapped.version).toBe(ECO_RISK_SCORER_ADAPTER_VERSION);
    expect(wrapped.source).toBe("eco-v1.2:llm-risk-scorer");
    expect(wrapped.score).toEqual(scorer.score(context));
    expect(wrapped.context.domain).toBe("privacy");
  });

  it("RiskAggregator.recordWithAdapter exposes cumulative session posture", () => {
    const scorer = new RiskScorer();
    const analyzer = new ContextAnalyzer();
    const aggregator = new RiskAggregator();
    const base = scorer.score({
      domain: "infrastructure",
      action: "execute",
      target: "server",
      targetScope: "external",
    });
    const wrapped = aggregator.recordWithAdapter(analyzer.analyze(base, {}));

    expect(wrapped.adapter.version).toBe(ECO_RISK_AGGREGATOR_ADAPTER_VERSION);
    expect(wrapped.adapter.source).toBe("eco-v1.2:risk-aggregator");
    expect(wrapped.adapter.sessionId).toBe(wrapped.session.sessionId);
    expect(wrapped.adapter.totalActions).toBe(1);
    expect(wrapped.adapter.highestLevel).toBe("R3");
    expect(wrapped.adapter.escalated).toBe(true);
  });
});
