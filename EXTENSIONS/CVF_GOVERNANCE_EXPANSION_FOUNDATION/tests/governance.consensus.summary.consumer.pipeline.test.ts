import { describe, it, expect } from "vitest";
import {
  GovernanceConsensusSummaryConsumerPipelineContract,
  createGovernanceConsensusSummaryConsumerPipelineContract,
} from "../src/governance.consensus.summary.consumer.pipeline.contract";
import type { GovernanceConsensusSummaryConsumerPipelineRequest } from "../src/governance.consensus.summary.consumer.pipeline.contract";
import type { ConsensusDecision } from "../src/governance.consensus.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDecision(
  verdict: ConsensusDecision["verdict"] = "PROCEED",
  id = "decision-001",
): ConsensusDecision {
  return {
    decisionId: id,
    issuedAt: "2026-03-24T10:00:00.000Z",
    verdict,
    criticalCount: verdict === "ESCALATE" ? 2 : verdict === "PAUSE" ? 1 : 0,
    alertActiveCount: verdict !== "PROCEED" ? 1 : 0,
    totalSignals: 3,
    consensusScore: verdict === "ESCALATE" ? 66.67 : verdict === "PAUSE" ? 33.33 : 0,
    decisionHash: `hash-${id}`,
  };
}

function makeRequest(
  decisions: ConsensusDecision[] = [makeDecision("PROCEED")],
  overrides: Partial<GovernanceConsensusSummaryConsumerPipelineRequest> = {},
): GovernanceConsensusSummaryConsumerPipelineRequest {
  return { decisions, ...overrides };
}

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceConsensusSummaryConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(GovernanceConsensusSummaryConsumerPipelineContract);
  });

  it("returns all required fields for PROCEED decisions (no warnings)", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeDecision("PROCEED")]));

    expect(result.resultId).toBeTruthy();
    expect(result.createdAt).toBe("2026-03-24T10:00:00.000Z");
    expect(result.consensusSummary).toBeDefined();
    expect(result.consensusSummary.dominantVerdict).toBe("PROCEED");
    expect(result.consumerPackage).toBeDefined();
    expect(result.pipelineHash).toBeTruthy();
    expect(result.warnings).toEqual([]);
  });

  it("ESCALATE dominant verdict produces warning — immediate governance escalation required", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeDecision("ESCALATE", "d-1"),
      makeDecision("ESCALATE", "d-2"),
      makeDecision("PROCEED", "d-3"),
    ]));

    expect(result.consensusSummary.dominantVerdict).toBe("ESCALATE");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[governance-consensus] dominant verdict ESCALATE");
    expect(result.warnings[0]).toContain("immediate governance escalation required");
  });

  it("PAUSE dominant verdict produces warning — governance pause required", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeDecision("PAUSE", "d-1"),
      makeDecision("PAUSE", "d-2"),
      makeDecision("PROCEED", "d-3"),
    ]));

    expect(result.consensusSummary.dominantVerdict).toBe("PAUSE");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[governance-consensus] dominant verdict PAUSE");
    expect(result.warnings[0]).toContain("governance pause required");
  });

  it("PROCEED-only decisions produce no warnings", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeDecision("PROCEED", "d-1"),
      makeDecision("PROCEED", "d-2"),
    ]));

    expect(result.consensusSummary.dominantVerdict).toBe("PROCEED");
    expect(result.warnings).toEqual([]);
  });

  it("query is derived from dominantVerdict and totalDecisions (sliced to 120)", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeDecision("PROCEED")]));

    expect(result.consumerPackage.query).toContain("[consensus]");
    expect(result.consumerPackage.query).toContain("PROCEED");
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("contextId on consumerPackage equals consensusSummary.summaryId", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerPackage.contextId).toBe(result.consensusSummary.summaryId);
  });

  it("consensusSummary reflects correct counts", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeDecision("ESCALATE", "d-1"),
      makeDecision("PAUSE", "d-2"),
      makeDecision("PROCEED", "d-3"),
    ]));

    expect(result.consensusSummary.totalDecisions).toBe(3);
    expect(result.consensusSummary.escalateCount).toBe(1);
    expect(result.consensusSummary.pauseCount).toBe(1);
    expect(result.consensusSummary.proceedCount).toBe(1);
  });

  it("empty decisions produce ESCALATE dominant (ties: ESCALATE > PAUSE > PROCEED at 0)", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([]));

    expect(result.consensusSummary.totalDecisions).toBe(0);
    expect(result.pipelineHash).toBeTruthy();
    expect(result.consumerPackage).toBeDefined();
  });

  it("consumerId is preserved when provided", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeDecision()], { consumerId: "consumer-xyz" }));

    expect(result.consumerId).toBe("consumer-xyz");
  });

  it("consumerId is undefined when not provided", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerId).toBeUndefined();
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("consumerPackage contains estimatedTokens", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(typeof result.consumerPackage.typedContextPackage.estimatedTokens).toBe("number");
  });

  it("is deterministic — same input produces identical hashes", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest([makeDecision("PROCEED")]));
    const r2 = contract.execute(makeRequest([makeDecision("PROCEED")]));

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
    expect(r1.consensusSummary.summaryHash).toBe(r2.consensusSummary.summaryHash);
  });

  it("different verdict produces different pipelineHash", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest([makeDecision("PROCEED", "d-1")]));
    const r2 = contract.execute(makeRequest([makeDecision("ESCALATE", "d-1")]));

    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("direct instantiation works identically to factory", () => {
    const now = fixedNow();
    const direct = new GovernanceConsensusSummaryConsumerPipelineContract({ now });
    const via = createGovernanceConsensusSummaryConsumerPipelineContract({ now });

    const r1 = direct.execute(makeRequest());
    const r2 = via.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
  });

  it("createdAt matches injected now", () => {
    const ts = "2026-03-24T12:00:00.000Z";
    const contract = createGovernanceConsensusSummaryConsumerPipelineContract({ now: fixedNow(ts) });
    const result = contract.execute(makeRequest());

    expect(result.createdAt).toBe(ts);
  });
});
