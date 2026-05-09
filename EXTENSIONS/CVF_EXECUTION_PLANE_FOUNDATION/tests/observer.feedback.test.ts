/**
 * EPF Observer & Feedback — Dedicated Tests (W6-T20)
 * ====================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   ExecutionObserverContract.observe:
 *     - failedCount > 0 → FAILED outcome, confidenceSignal = 0.0
 *     - sandboxedCount > 0 AND executedCount === 0 → SANDBOXED outcome, confidence = 0.5
 *     - executedCount === 0 AND skippedCount > 0 (no failures) → GATED outcome, confidence = 0.3
 *     - executedCount > 0 AND skippedCount > 0 → PARTIAL outcome
 *     - executedCount > 0 AND sandboxedCount > 0 → PARTIAL outcome
 *     - all executed, no failures, no warnings → SUCCESS, confidence = 1.0
 *     - all executed, no failures, with warnings → SUCCESS, confidence = 0.8
 *     - PARTIAL confidence = max(0.1, executedRatio * 0.7)
 *     - notes always include execution_result note
 *     - failedCount > 0 adds risk_signal note
 *     - sandboxedCount > 0 adds gate_signal note
 *     - skippedCount > 0 adds gate_signal note
 *     - warnings.length > 0 adds warning_signal note
 *     - sourcePipelineId = receipt.pipelineReceiptId
 *     - all counts propagated (totalEntries, executedCount, failedCount, sandboxedCount, skippedCount)
 *     - custom classifyOutcome override respected
 *     - observationHash and observationId are deterministic
 *     - createdAt set to injected now()
 *     - factory createExecutionObserverContract returns working instance
 *
 *   ExecutionFeedbackContract.generate:
 *     - SUCCESS outcomeClass → ACCEPT feedbackClass, priority low
 *     - PARTIAL outcomeClass → RETRY feedbackClass
 *     - FAILED outcomeClass → ESCALATE feedbackClass
 *     - GATED outcomeClass → ESCALATE feedbackClass
 *     - SANDBOXED outcomeClass → RETRY feedbackClass
 *     - ESCALATE + confidenceSignal < 0.2 → priority critical
 *     - ESCALATE + confidenceSignal >= 0.2 → priority high
 *     - RETRY + confidenceSignal < 0.4 → priority high
 *     - RETRY + confidenceSignal >= 0.4 → priority medium
 *     - ACCEPT → confidenceBoost = (1.0 - confidenceSignal) * 0.5 rounded 2dp
 *     - RETRY → confidenceBoost = 0
 *     - ESCALATE → confidenceBoost = 0
 *     - ACCEPT rationale references "successfully"
 *     - RETRY rationale for SANDBOXED outcome references sandbox
 *     - ESCALATE rationale for FAILED outcome references failures
 *     - ESCALATE rationale for GATED outcome references gated/governance
 *     - custom mapFeedbackClass override respected
 *     - sourceObservationId and sourcePipelineId propagated from observation
 *     - feedbackHash and feedbackId are deterministic
 *     - createdAt set to injected now()
 *     - factory createExecutionFeedbackContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  ExecutionObserverContract,
  createExecutionObserverContract,
} from "../src/execution.observer.contract";
import type { ExecutionPipelineReceipt } from "../src/execution.pipeline.contract";

import {
  ExecutionFeedbackContract,
  createExecutionFeedbackContract,
} from "../src/execution.feedback.contract";
import type { ExecutionObservation } from "../src/execution.observer.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T00:00:00.000Z";
const fixedNow = () => FIXED_NOW;

let _pSeq = 0;
function makePipelineReceipt(overrides: Partial<ExecutionPipelineReceipt> = {}): ExecutionPipelineReceipt {
  const n = ++_pSeq;
  return {
    pipelineReceiptId: `pipe-${n}`,
    createdAt: FIXED_NOW,
    bridgeReceiptId: `bridge-${n}`,
    orchestrationId: `orch-${n}`,
    gateId: `gate-${n}`,
    runtimeId: `runtime-${n}`,
    commandRuntimeResult: {
      runtimeId: `runtime-${n}`,
      gateId: `gate-${n}`,
      executedAt: FIXED_NOW,
      records: [],
      executedCount: 0,
      sandboxedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      runtimeHash: `rhash-${n}`,
      summary: "test summary",
    },
    totalEntries: 0,
    executedCount: 0,
    sandboxedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    pipelineStages: [],
    pipelineHash: `phash-${n}`,
    warnings: [],
    ...overrides,
  };
}

let _oSeq = 0;
function makeObservation(
  overrides: Partial<ExecutionObservation> = {},
): ExecutionObservation {
  const n = ++_oSeq;
  return {
    observationId: `obs-${n}`,
    createdAt: FIXED_NOW,
    sourcePipelineId: `pipe-${n}`,
    outcomeClass: "SUCCESS",
    confidenceSignal: 1.0,
    totalEntries: 1,
    executedCount: 1,
    failedCount: 0,
    sandboxedCount: 0,
    skippedCount: 0,
    notes: [],
    observationHash: `ohash-${n}`,
    ...overrides,
  };
}

// ─── ExecutionObserverContract ────────────────────────────────────────────────

describe("ExecutionObserverContract.observe", () => {
  const contract = new ExecutionObserverContract({ now: fixedNow });

  describe("outcomeClass derivation", () => {
    it("failedCount > 0 → FAILED outcome", () => {
      const receipt = makePipelineReceipt({ failedCount: 1, totalEntries: 2, executedCount: 1 });
      expect(contract.observe(receipt).outcomeClass).toBe("FAILED");
    });

    it("sandboxedCount > 0 AND executedCount === 0 → SANDBOXED outcome", () => {
      const receipt = makePipelineReceipt({ sandboxedCount: 2, executedCount: 0, totalEntries: 2 });
      expect(contract.observe(receipt).outcomeClass).toBe("SANDBOXED");
    });

    it("executedCount === 0 AND skippedCount > 0 (no failures) → GATED outcome", () => {
      const receipt = makePipelineReceipt({ skippedCount: 3, executedCount: 0, totalEntries: 3 });
      expect(contract.observe(receipt).outcomeClass).toBe("GATED");
    });

    it("executedCount > 0 AND skippedCount > 0 → PARTIAL outcome", () => {
      const receipt = makePipelineReceipt({ executedCount: 1, skippedCount: 1, totalEntries: 2 });
      expect(contract.observe(receipt).outcomeClass).toBe("PARTIAL");
    });

    it("executedCount > 0 AND sandboxedCount > 0 → PARTIAL outcome", () => {
      const receipt = makePipelineReceipt({ executedCount: 1, sandboxedCount: 1, totalEntries: 2 });
      expect(contract.observe(receipt).outcomeClass).toBe("PARTIAL");
    });

    it("all executed, no failures, no warnings → SUCCESS", () => {
      const receipt = makePipelineReceipt({ executedCount: 3, totalEntries: 3, warnings: [] });
      expect(contract.observe(receipt).outcomeClass).toBe("SUCCESS");
    });
  });

  describe("confidenceSignal computation", () => {
    it("FAILED → confidenceSignal = 0.0", () => {
      const receipt = makePipelineReceipt({ failedCount: 1, totalEntries: 1 });
      expect(contract.observe(receipt).confidenceSignal).toBe(0.0);
    });

    it("SANDBOXED → confidenceSignal = 0.5", () => {
      const receipt = makePipelineReceipt({ sandboxedCount: 1, executedCount: 0, totalEntries: 1 });
      expect(contract.observe(receipt).confidenceSignal).toBe(0.5);
    });

    it("GATED → confidenceSignal = 0.3", () => {
      const receipt = makePipelineReceipt({ skippedCount: 2, executedCount: 0, totalEntries: 2 });
      expect(contract.observe(receipt).confidenceSignal).toBe(0.3);
    });

    it("SUCCESS with no warnings → confidenceSignal = 1.0", () => {
      const receipt = makePipelineReceipt({ executedCount: 2, totalEntries: 2, warnings: [] });
      expect(contract.observe(receipt).confidenceSignal).toBe(1.0);
    });

    it("SUCCESS with warnings → confidenceSignal = 0.8", () => {
      const receipt = makePipelineReceipt({ executedCount: 2, totalEntries: 2, warnings: ["w1"] });
      expect(contract.observe(receipt).confidenceSignal).toBe(0.8);
    });

    it("PARTIAL: 1 of 2 executed → confidence = max(0.1, 0.5 * 0.7) = 0.35", () => {
      const receipt = makePipelineReceipt({ executedCount: 1, skippedCount: 1, totalEntries: 2 });
      const confidence = contract.observe(receipt).confidenceSignal;
      expect(confidence).toBeCloseTo(0.35, 5);
    });
  });

  describe("notes", () => {
    it("always includes execution_result note", () => {
      const receipt = makePipelineReceipt({ executedCount: 1, totalEntries: 1 });
      const obs = contract.observe(receipt);
      expect(obs.notes.some((n) => n.category === "execution_result")).toBe(true);
    });

    it("failedCount > 0 adds risk_signal note", () => {
      const receipt = makePipelineReceipt({ failedCount: 1, totalEntries: 1 });
      const obs = contract.observe(receipt);
      expect(obs.notes.some((n) => n.category === "risk_signal")).toBe(true);
    });

    it("sandboxedCount > 0 adds gate_signal note", () => {
      const receipt = makePipelineReceipt({ sandboxedCount: 1, executedCount: 0, totalEntries: 1 });
      const obs = contract.observe(receipt);
      expect(obs.notes.some((n) => n.category === "gate_signal")).toBe(true);
    });

    it("skippedCount > 0 adds gate_signal note", () => {
      const receipt = makePipelineReceipt({ skippedCount: 1, executedCount: 0, totalEntries: 1 });
      const obs = contract.observe(receipt);
      expect(obs.notes.some((n) => n.category === "gate_signal")).toBe(true);
    });

    it("warnings.length > 0 adds warning_signal note", () => {
      const receipt = makePipelineReceipt({ executedCount: 1, totalEntries: 1, warnings: ["w1"] });
      const obs = contract.observe(receipt);
      expect(obs.notes.some((n) => n.category === "warning_signal")).toBe(true);
    });

    it("no notes of types other than execution_result for clean SUCCESS", () => {
      const receipt = makePipelineReceipt({ executedCount: 1, totalEntries: 1, warnings: [] });
      const obs = contract.observe(receipt);
      expect(obs.notes).toHaveLength(1);
      expect(obs.notes[0].category).toBe("execution_result");
    });
  });

  it("sourcePipelineId = receipt.pipelineReceiptId", () => {
    const receipt = makePipelineReceipt({ executedCount: 1, totalEntries: 1 });
    expect(contract.observe(receipt).sourcePipelineId).toBe(receipt.pipelineReceiptId);
  });

  it("counts propagated from receipt", () => {
    const receipt = makePipelineReceipt({
      totalEntries: 4,
      executedCount: 1,
      failedCount: 1,
      sandboxedCount: 1,
      skippedCount: 1,
    });
    const obs = contract.observe(receipt);
    expect(obs.totalEntries).toBe(4);
    expect(obs.executedCount).toBe(1);
    expect(obs.failedCount).toBe(1);
    expect(obs.sandboxedCount).toBe(1);
    expect(obs.skippedCount).toBe(1);
  });

  it("custom classifyOutcome override respected", () => {
    const custom = new ExecutionObserverContract({
      now: fixedNow,
      classifyOutcome: () => "GATED",
    });
    const receipt = makePipelineReceipt({ executedCount: 3, totalEntries: 3 });
    expect(custom.observe(receipt).outcomeClass).toBe("GATED");
  });

  it("observationHash and observationId are deterministic for same inputs and timestamp", () => {
    const receipt = makePipelineReceipt({ executedCount: 1, totalEntries: 1 });
    const r1 = contract.observe(receipt);
    const r2 = contract.observe(receipt);
    expect(r1.observationHash).toBe(r2.observationHash);
    expect(r1.observationId).toBe(r2.observationId);
  });

  it("createdAt set to injected now()", () => {
    const receipt = makePipelineReceipt({ executedCount: 1, totalEntries: 1 });
    expect(contract.observe(receipt).createdAt).toBe(FIXED_NOW);
  });

  it("factory createExecutionObserverContract returns working instance", () => {
    const c = createExecutionObserverContract({ now: fixedNow });
    const receipt = makePipelineReceipt({ executedCount: 1, totalEntries: 1 });
    const obs = c.observe(receipt);
    expect(obs.outcomeClass).toBe("SUCCESS");
    expect(obs.createdAt).toBe(FIXED_NOW);
  });
});

// ─── ExecutionFeedbackContract ────────────────────────────────────────────────

describe("ExecutionFeedbackContract.generate", () => {
  const contract = new ExecutionFeedbackContract({ now: fixedNow });

  describe("feedbackClass mapping", () => {
    it("SUCCESS → ACCEPT feedbackClass", () => {
      expect(contract.generate(makeObservation({ outcomeClass: "SUCCESS", confidenceSignal: 1.0 })).feedbackClass).toBe("ACCEPT");
    });

    it("PARTIAL → RETRY feedbackClass", () => {
      expect(contract.generate(makeObservation({ outcomeClass: "PARTIAL", confidenceSignal: 0.5 })).feedbackClass).toBe("RETRY");
    });

    it("FAILED → ESCALATE feedbackClass", () => {
      expect(contract.generate(makeObservation({ outcomeClass: "FAILED", confidenceSignal: 0.0 })).feedbackClass).toBe("ESCALATE");
    });

    it("GATED → ESCALATE feedbackClass", () => {
      expect(contract.generate(makeObservation({ outcomeClass: "GATED", confidenceSignal: 0.3 })).feedbackClass).toBe("ESCALATE");
    });

    it("SANDBOXED → RETRY feedbackClass", () => {
      expect(contract.generate(makeObservation({ outcomeClass: "SANDBOXED", confidenceSignal: 0.5 })).feedbackClass).toBe("RETRY");
    });
  });

  describe("priority derivation", () => {
    it("ACCEPT → priority low", () => {
      expect(contract.generate(makeObservation({ outcomeClass: "SUCCESS", confidenceSignal: 1.0 })).priority).toBe("low");
    });

    it("ESCALATE + confidenceSignal < 0.2 → priority critical", () => {
      expect(contract.generate(makeObservation({ outcomeClass: "FAILED", confidenceSignal: 0.0 })).priority).toBe("critical");
    });

    it("ESCALATE + confidenceSignal >= 0.2 → priority high", () => {
      expect(contract.generate(makeObservation({ outcomeClass: "GATED", confidenceSignal: 0.3 })).priority).toBe("high");
    });

    it("RETRY + confidenceSignal < 0.4 → priority high", () => {
      expect(contract.generate(makeObservation({ outcomeClass: "PARTIAL", confidenceSignal: 0.2 })).priority).toBe("high");
    });

    it("RETRY + confidenceSignal >= 0.4 → priority medium", () => {
      expect(contract.generate(makeObservation({ outcomeClass: "PARTIAL", confidenceSignal: 0.5 })).priority).toBe("medium");
    });
  });

  describe("confidenceBoost", () => {
    it("ACCEPT + confidence 1.0 → boost = 0", () => {
      expect(contract.generate(makeObservation({ outcomeClass: "SUCCESS", confidenceSignal: 1.0 })).confidenceBoost).toBe(0);
    });

    it("ACCEPT + confidence 0.8 → boost = (1.0 - 0.8) * 0.5 = 0.1", () => {
      expect(contract.generate(makeObservation({ outcomeClass: "SUCCESS", confidenceSignal: 0.8 })).confidenceBoost).toBeCloseTo(0.1, 5);
    });

    it("RETRY → confidenceBoost = 0", () => {
      expect(contract.generate(makeObservation({ outcomeClass: "PARTIAL", confidenceSignal: 0.5 })).confidenceBoost).toBe(0);
    });

    it("ESCALATE → confidenceBoost = 0", () => {
      expect(contract.generate(makeObservation({ outcomeClass: "FAILED", confidenceSignal: 0.0 })).confidenceBoost).toBe(0);
    });
  });

  describe("rationale content", () => {
    it("ACCEPT rationale references 'successfully'", () => {
      const signal = contract.generate(makeObservation({ outcomeClass: "SUCCESS", confidenceSignal: 1.0, executedCount: 2, totalEntries: 2 }));
      expect(signal.rationale).toContain("successfully");
    });

    it("RETRY rationale for SANDBOXED references sandbox", () => {
      const signal = contract.generate(makeObservation({ outcomeClass: "SANDBOXED", confidenceSignal: 0.5, sandboxedCount: 1, totalEntries: 1 }));
      expect(signal.rationale).toContain("sandbox");
    });

    it("ESCALATE rationale for FAILED references failures", () => {
      const signal = contract.generate(makeObservation({ outcomeClass: "FAILED", confidenceSignal: 0.0, failedCount: 1, totalEntries: 1 }));
      expect(signal.rationale).toContain("failure");
    });

    it("ESCALATE rationale for GATED references gated or governance", () => {
      const signal = contract.generate(makeObservation({ outcomeClass: "GATED", confidenceSignal: 0.3 }));
      expect(signal.rationale.toLowerCase()).toMatch(/gated|governance/);
    });
  });

  it("custom mapFeedbackClass override respected", () => {
    const custom = new ExecutionFeedbackContract({
      now: fixedNow,
      mapFeedbackClass: () => "REJECT",
    });
    const signal = custom.generate(makeObservation({ outcomeClass: "SUCCESS", confidenceSignal: 1.0 }));
    expect(signal.feedbackClass).toBe("REJECT");
    expect(signal.priority).toBe("critical");
  });

  it("sourceObservationId and sourcePipelineId propagated from observation", () => {
    const obs = makeObservation({ observationId: "obs-special", sourcePipelineId: "pipe-special" });
    const signal = contract.generate(obs);
    expect(signal.sourceObservationId).toBe("obs-special");
    expect(signal.sourcePipelineId).toBe("pipe-special");
  });

  it("feedbackHash and feedbackId are deterministic for same inputs and timestamp", () => {
    const obs = makeObservation({ outcomeClass: "SUCCESS", confidenceSignal: 1.0 });
    const r1 = contract.generate(obs);
    const r2 = contract.generate(obs);
    expect(r1.feedbackHash).toBe(r2.feedbackHash);
    expect(r1.feedbackId).toBe(r2.feedbackId);
  });

  it("createdAt set to injected now()", () => {
    expect(contract.generate(makeObservation()).createdAt).toBe(FIXED_NOW);
  });

  it("factory createExecutionFeedbackContract returns working instance", () => {
    const c = createExecutionFeedbackContract({ now: fixedNow });
    const signal = c.generate(makeObservation({ outcomeClass: "SUCCESS", confidenceSignal: 1.0 }));
    expect(signal.feedbackClass).toBe("ACCEPT");
    expect(signal.createdAt).toBe(FIXED_NOW);
  });
});
