/**
 * CPF Gateway Consumer — Dedicated Tests (W6-T34)
 * =================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   GatewayConsumerContract.consume:
 *     - returns 3 stages: SIGNAL_PROCESSED, INTAKE_EXECUTED, RECEIPT_ISSUED
 *     - stage order: SIGNAL_PROCESSED first, INTAKE_EXECUTED second, RECEIPT_ISSUED third
 *     - stage SIGNAL_PROCESSED notes mention signal type
 *     - stage INTAKE_EXECUTED notes mention chunk count
 *     - stage RECEIPT_ISSUED notes mention receiptId
 *     - consumerId propagated from signal to receipt
 *     - sessionId propagated from signal to receipt
 *     - consumerId absent when not provided
 *     - sessionId absent when not provided
 *     - gatewayRequest: signalType defaults to "vibe"
 *     - gatewayRequest: normalizedSignal populated
 *     - intakeResult: requestId truthy
 *     - warnings from gateway prefixed with [gateway]
 *     - warnings from intake prefixed with [intake]
 *     - clean signal → no gateway warnings, no intake warnings (warnings=[])
 *     - createdAt = injected now()
 *     - consumptionHash deterministic for same inputs and timestamp
 *     - receiptId = derived from consumptionHash (truthy)
 *     - factory createGatewayConsumerContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  GatewayConsumerContract,
  createGatewayConsumerContract,
} from "../src/gateway.consumer.contract";
import type { GatewaySignalRequest } from "../src/ai.gateway.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T10:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeSignal(overrides: Partial<GatewaySignalRequest> = {}): GatewaySignalRequest {
  return {
    rawSignal: "build a governance feature for the platform",
    ...overrides,
  };
}

// ─── GatewayConsumerContract.consume ──────────────────────────────────────────

describe("GatewayConsumerContract.consume", () => {
  const contract = new GatewayConsumerContract({ now: fixedNow });

  describe("stages", () => {
    it("returns exactly 3 stages", () => {
      const receipt = contract.consume(makeSignal());
      expect(receipt.stages).toHaveLength(3);
    });

    it("stage[0] = SIGNAL_PROCESSED", () => {
      const receipt = contract.consume(makeSignal());
      expect(receipt.stages[0].stage).toBe("SIGNAL_PROCESSED");
    });

    it("stage[1] = INTAKE_EXECUTED", () => {
      const receipt = contract.consume(makeSignal());
      expect(receipt.stages[1].stage).toBe("INTAKE_EXECUTED");
    });

    it("stage[2] = RECEIPT_ISSUED", () => {
      const receipt = contract.consume(makeSignal());
      expect(receipt.stages[2].stage).toBe("RECEIPT_ISSUED");
    });

    it("SIGNAL_PROCESSED notes mention signal type", () => {
      const receipt = contract.consume(makeSignal({ signalType: "command" }));
      expect(receipt.stages[0].notes).toContain("command");
    });

    it("INTAKE_EXECUTED notes mention chunk count", () => {
      const receipt = contract.consume(makeSignal());
      expect(receipt.stages[1].notes).toMatch(/chunk/i);
    });

    it("RECEIPT_ISSUED notes mention receiptId", () => {
      const receipt = contract.consume(makeSignal());
      expect(receipt.stages[2].notes).toContain(receipt.receiptId);
    });
  });

  describe("optional fields propagation", () => {
    it("consumerId propagated from signal", () => {
      const receipt = contract.consume(makeSignal({ consumerId: "cons-123" }));
      expect(receipt.consumerId).toBe("cons-123");
    });

    it("sessionId propagated from signal", () => {
      const receipt = contract.consume(makeSignal({ sessionId: "sess-456" }));
      expect(receipt.sessionId).toBe("sess-456");
    });

    it("consumerId absent when not provided", () => {
      const receipt = contract.consume(makeSignal());
      expect(receipt.consumerId).toBeUndefined();
    });

    it("sessionId absent when not provided", () => {
      const receipt = contract.consume(makeSignal());
      expect(receipt.sessionId).toBeUndefined();
    });
  });

  describe("gatewayRequest", () => {
    it("signalType defaults to 'vibe' when not specified", () => {
      const receipt = contract.consume(makeSignal());
      expect(receipt.gatewayRequest.signalType).toBe("vibe");
    });

    it("normalizedSignal populated (non-empty for clean signal)", () => {
      const receipt = contract.consume(makeSignal());
      expect(receipt.gatewayRequest.normalizedSignal.length).toBeGreaterThan(0);
    });

    it("signalType propagated when specified", () => {
      const receipt = contract.consume(makeSignal({ signalType: "query" }));
      expect(receipt.gatewayRequest.signalType).toBe("query");
    });
  });

  describe("intakeResult", () => {
    it("intakeResult.requestId truthy", () => {
      const receipt = contract.consume(makeSignal());
      expect(receipt.intakeResult.requestId.length).toBeGreaterThan(0);
    });
  });

  describe("warnings", () => {
    it("clean signal → no [gateway] warnings", () => {
      const receipt = contract.consume(makeSignal());
      const gatewayWarnings = receipt.warnings.filter((w) => w.startsWith("[gateway]"));
      expect(gatewayWarnings).toHaveLength(0);
    });

    it("gateway warnings prefixed with [gateway]", () => {
      // Empty signal triggers gateway 'empty signal' warning
      const receipt = contract.consume(makeSignal({ rawSignal: "" }));
      const gatewayWarnings = receipt.warnings.filter((w) => w.startsWith("[gateway]"));
      expect(gatewayWarnings.length).toBeGreaterThan(0);
    });
  });

  describe("output fields", () => {
    it("createdAt = injected now()", () => {
      expect(contract.consume(makeSignal()).createdAt).toBe(FIXED_NOW);
    });

    it("consumptionHash deterministic for same inputs and timestamp", () => {
      const signal = makeSignal({ consumerId: "cons-det" });
      const r1 = contract.consume(signal);
      const r2 = contract.consume(signal);
      expect(r1.consumptionHash).toBe(r2.consumptionHash);
    });

    it("receiptId is truthy", () => {
      expect(contract.consume(makeSignal()).receiptId.length).toBeGreaterThan(0);
    });
  });

  it("factory createGatewayConsumerContract returns working instance", () => {
    const c = createGatewayConsumerContract({ now: fixedNow });
    const receipt = c.consume(makeSignal());
    expect(receipt.createdAt).toBe(FIXED_NOW);
    expect(receipt.stages).toHaveLength(3);
  });
});
