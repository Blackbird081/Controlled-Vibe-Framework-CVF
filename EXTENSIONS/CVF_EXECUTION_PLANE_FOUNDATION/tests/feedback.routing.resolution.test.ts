/**
 * EPF Feedback Routing & Resolution — Dedicated Tests (W6-T21)
 * =============================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   FeedbackRoutingContract.route:
 *     - routingAction = signal.feedbackClass (direct passthrough for all 4 classes)
 *     - REJECT feedbackClass → routingPriority critical
 *     - ESCALATE feedbackClass → routingPriority high
 *     - RETRY + confidenceBoost === 0 → routingPriority high
 *     - RETRY + confidenceBoost > 0 → routingPriority medium
 *     - ACCEPT feedbackClass → routingPriority low
 *     - ACCEPT rationale references sourcePipelineId
 *     - RETRY rationale references "retry"
 *     - ESCALATE rationale references "escalation" or "governance"
 *     - REJECT rationale references "replanning"
 *     - sourceFeedbackId = signal.feedbackId
 *     - sourcePipelineId = signal.sourcePipelineId
 *     - decisionHash and decisionId are deterministic for same inputs and timestamp
 *     - createdAt set to injected now()
 *     - factory createFeedbackRoutingContract returns working instance
 *
 *   FeedbackResolutionContract.resolve:
 *     - empty decisions → 0 counts, NORMAL urgency, "No routing decisions" summary
 *     - escalateCount > 0 → CRITICAL urgency
 *     - rejectCount > 0 → CRITICAL urgency (even without escalate)
 *     - retryCount > 0 (no escalate/reject) → HIGH urgency
 *     - all ACCEPT → NORMAL urgency
 *     - counts accurate: acceptCount, retryCount, escalateCount, rejectCount
 *     - totalDecisions equals input length
 *     - summary contains accepted/retry/escalated/rejected for non-zero buckets
 *     - summary contains urgency level
 *     - summaryHash and summaryId are deterministic for same inputs and timestamp
 *     - resolvedAt set to injected now()
 *     - factory createFeedbackResolutionContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  FeedbackRoutingContract,
  createFeedbackRoutingContract,
} from "../src/feedback.routing.contract";
import type { FeedbackRoutingDecision } from "../src/feedback.routing.contract";

import {
  FeedbackResolutionContract,
  createFeedbackResolutionContract,
} from "../src/feedback.resolution.contract";

import type { ExecutionFeedbackSignal, FeedbackClass } from "../src/execution.feedback.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T00:30:00.000Z";
const fixedNow = () => FIXED_NOW;

let _fSeq = 0;
function makeSignal(
  feedbackClass: FeedbackClass,
  confidenceBoost = 0,
): ExecutionFeedbackSignal {
  const n = ++_fSeq;
  return {
    feedbackId: `fb-${n}`,
    createdAt: FIXED_NOW,
    sourceObservationId: `obs-${n}`,
    sourcePipelineId: `pipe-${n}`,
    feedbackClass,
    priority: "low",
    rationale: `rationale for ${feedbackClass}-${n}`,
    confidenceBoost,
    feedbackHash: `fhash-${n}`,
  };
}

let _dSeq = 0;
function makeDecision(routingAction: FeedbackRoutingDecision["routingAction"]): FeedbackRoutingDecision {
  const n = ++_dSeq;
  return {
    decisionId: `dec-${n}`,
    createdAt: FIXED_NOW,
    sourceFeedbackId: `fb-${n}`,
    sourcePipelineId: `pipe-${n}`,
    routingAction,
    routingPriority: "low",
    rationale: `routing rationale ${n}`,
    decisionHash: `dhash-${n}`,
  };
}

// ─── FeedbackRoutingContract ──────────────────────────────────────────────────

describe("FeedbackRoutingContract.route", () => {
  const contract = new FeedbackRoutingContract({ now: fixedNow });

  describe("routingAction passthrough", () => {
    it("ACCEPT feedbackClass → routingAction ACCEPT", () => {
      expect(contract.route(makeSignal("ACCEPT")).routingAction).toBe("ACCEPT");
    });

    it("RETRY feedbackClass → routingAction RETRY", () => {
      expect(contract.route(makeSignal("RETRY")).routingAction).toBe("RETRY");
    });

    it("ESCALATE feedbackClass → routingAction ESCALATE", () => {
      expect(contract.route(makeSignal("ESCALATE")).routingAction).toBe("ESCALATE");
    });

    it("REJECT feedbackClass → routingAction REJECT", () => {
      expect(contract.route(makeSignal("REJECT")).routingAction).toBe("REJECT");
    });
  });

  describe("routingPriority derivation", () => {
    it("REJECT → priority critical", () => {
      expect(contract.route(makeSignal("REJECT")).routingPriority).toBe("critical");
    });

    it("ESCALATE → priority high", () => {
      expect(contract.route(makeSignal("ESCALATE")).routingPriority).toBe("high");
    });

    it("RETRY + confidenceBoost === 0 → priority high", () => {
      expect(contract.route(makeSignal("RETRY", 0)).routingPriority).toBe("high");
    });

    it("RETRY + confidenceBoost > 0 → priority medium", () => {
      expect(contract.route(makeSignal("RETRY", 0.1)).routingPriority).toBe("medium");
    });

    it("ACCEPT → priority low", () => {
      expect(contract.route(makeSignal("ACCEPT")).routingPriority).toBe("low");
    });
  });

  describe("rationale content", () => {
    it("ACCEPT rationale references sourcePipelineId", () => {
      const signal = makeSignal("ACCEPT");
      const decision = contract.route(signal);
      expect(decision.rationale).toContain(signal.sourcePipelineId);
    });

    it("RETRY rationale references retry", () => {
      const decision = contract.route(makeSignal("RETRY"));
      expect(decision.rationale.toLowerCase()).toContain("retry");
    });

    it("ESCALATE rationale references escalation or governance", () => {
      const decision = contract.route(makeSignal("ESCALATE"));
      expect(decision.rationale.toLowerCase()).toMatch(/escalation|governance/);
    });

    it("REJECT rationale references replanning", () => {
      const decision = contract.route(makeSignal("REJECT"));
      expect(decision.rationale.toLowerCase()).toContain("replanning");
    });
  });

  it("sourceFeedbackId = signal.feedbackId", () => {
    const signal = makeSignal("ACCEPT");
    expect(contract.route(signal).sourceFeedbackId).toBe(signal.feedbackId);
  });

  it("sourcePipelineId = signal.sourcePipelineId", () => {
    const signal = makeSignal("RETRY");
    expect(contract.route(signal).sourcePipelineId).toBe(signal.sourcePipelineId);
  });

  it("decisionHash and decisionId are deterministic for same inputs and timestamp", () => {
    const signal = makeSignal("ESCALATE");
    const r1 = contract.route(signal);
    const r2 = contract.route(signal);
    expect(r1.decisionHash).toBe(r2.decisionHash);
    expect(r1.decisionId).toBe(r2.decisionId);
  });

  it("createdAt set to injected now()", () => {
    expect(contract.route(makeSignal("ACCEPT")).createdAt).toBe(FIXED_NOW);
  });

  it("factory createFeedbackRoutingContract returns working instance", () => {
    const c = createFeedbackRoutingContract({ now: fixedNow });
    const decision = c.route(makeSignal("ACCEPT"));
    expect(decision.routingAction).toBe("ACCEPT");
    expect(decision.createdAt).toBe(FIXED_NOW);
  });
});

// ─── FeedbackResolutionContract ───────────────────────────────────────────────

describe("FeedbackResolutionContract.resolve", () => {
  const contract = new FeedbackResolutionContract({ now: fixedNow });

  it("empty decisions → 0 counts, NORMAL urgency, 'No routing decisions' summary", () => {
    const result = contract.resolve([]);
    expect(result.totalDecisions).toBe(0);
    expect(result.acceptCount).toBe(0);
    expect(result.retryCount).toBe(0);
    expect(result.escalateCount).toBe(0);
    expect(result.rejectCount).toBe(0);
    expect(result.urgencyLevel).toBe("NORMAL");
    expect(result.summary).toContain("No routing decisions");
  });

  describe("urgencyLevel derivation", () => {
    it("escalateCount > 0 → CRITICAL urgency", () => {
      expect(contract.resolve([makeDecision("ESCALATE")]).urgencyLevel).toBe("CRITICAL");
    });

    it("rejectCount > 0 → CRITICAL urgency (even without escalate)", () => {
      expect(contract.resolve([makeDecision("REJECT")]).urgencyLevel).toBe("CRITICAL");
    });

    it("escalate + reject together → CRITICAL urgency", () => {
      expect(contract.resolve([makeDecision("ESCALATE"), makeDecision("REJECT")]).urgencyLevel).toBe("CRITICAL");
    });

    it("retryCount > 0 (no escalate/reject) → HIGH urgency", () => {
      expect(contract.resolve([makeDecision("RETRY")]).urgencyLevel).toBe("HIGH");
    });

    it("all ACCEPT → NORMAL urgency", () => {
      expect(contract.resolve([makeDecision("ACCEPT"), makeDecision("ACCEPT")]).urgencyLevel).toBe("NORMAL");
    });
  });

  it("counts each routingAction correctly", () => {
    const decisions = [
      makeDecision("ACCEPT"),
      makeDecision("RETRY"),
      makeDecision("RETRY"),
      makeDecision("ESCALATE"),
      makeDecision("REJECT"),
    ];
    const result = contract.resolve(decisions);
    expect(result.acceptCount).toBe(1);
    expect(result.retryCount).toBe(2);
    expect(result.escalateCount).toBe(1);
    expect(result.rejectCount).toBe(1);
  });

  it("totalDecisions equals input length", () => {
    const decisions = [makeDecision("ACCEPT"), makeDecision("RETRY"), makeDecision("ESCALATE")];
    expect(contract.resolve(decisions).totalDecisions).toBe(3);
  });

  it("summary contains accepted bucket for non-zero acceptCount", () => {
    expect(contract.resolve([makeDecision("ACCEPT")]).summary).toContain("accepted");
  });

  it("summary contains retry bucket for non-zero retryCount", () => {
    expect(contract.resolve([makeDecision("RETRY")]).summary).toContain("retry");
  });

  it("summary contains escalated bucket for non-zero escalateCount", () => {
    expect(contract.resolve([makeDecision("ESCALATE")]).summary).toContain("escalated");
  });

  it("summary contains rejected bucket for non-zero rejectCount", () => {
    expect(contract.resolve([makeDecision("REJECT")]).summary).toContain("rejected");
  });

  it("summary contains urgency level", () => {
    const result = contract.resolve([makeDecision("RETRY")]);
    expect(result.summary).toContain("HIGH");
  });

  it("summaryHash and summaryId are deterministic for same inputs and timestamp", () => {
    const decisions = [makeDecision("ACCEPT"), makeDecision("ESCALATE")];
    const r1 = contract.resolve(decisions);
    const r2 = contract.resolve(decisions);
    expect(r1.summaryHash).toBe(r2.summaryHash);
    expect(r1.summaryId).toBe(r2.summaryId);
  });

  it("resolvedAt set to injected now()", () => {
    expect(contract.resolve([]).resolvedAt).toBe(FIXED_NOW);
  });

  it("factory createFeedbackResolutionContract returns working instance", () => {
    const c = createFeedbackResolutionContract({ now: fixedNow });
    const result = c.resolve([]);
    expect(result.urgencyLevel).toBe("NORMAL");
    expect(result.resolvedAt).toBe(FIXED_NOW);
  });
});
