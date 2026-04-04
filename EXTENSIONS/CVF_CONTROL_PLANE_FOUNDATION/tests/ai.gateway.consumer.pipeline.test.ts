import { describe, it, expect } from "vitest";
import {
  AIGatewayConsumerPipelineContract,
  createAIGatewayConsumerPipelineContract,
} from "../src/ai.gateway.consumer.pipeline.contract";
import {
  AIGatewayConsumerPipelineBatchContract,
  createAIGatewayConsumerPipelineBatchContract,
} from "../src/ai.gateway.consumer.pipeline.batch.contract";
import type { GatewayProcessedRequest, GatewaySignalType } from "../src/ai.gateway.contract";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// Helper: create test gateway processed request
function makeGatewayProcessedRequest(options: {
  signalType?: GatewaySignalType;
  piiDetected?: boolean;
  envPlatform?: string;
  gatewayId?: string;
} = {}): GatewayProcessedRequest {
  const {
    signalType = "vibe",
    piiDetected = false,
    envPlatform = "cvf",
    gatewayId = "gateway-123",
  } = options;

  return {
    gatewayId,
    processedAt: FIXED_NOW,
    rawSignal: "test signal",
    normalizedSignal: "test signal",
    signalType,
    envMetadata: {
      platform: envPlatform,
      phase: "INTAKE",
      riskLevel: "R1",
      locale: "en",
      tags: [],
    },
    privacyReport: {
      filtered: piiDetected,
      maskedTokenCount: piiDetected ? 1 : 0,
      appliedPatterns: piiDetected ? ["[PII_EMAIL]"] : [],
    },
    sessionId: "session-123",
    agentId: "agent-456",
    consumerId: "consumer-789",
    gatewayHash: "gateway-hash-123",
    warnings: [],
  };
}

const vibeRequest = makeGatewayProcessedRequest({ signalType: "vibe" });
const commandRequest = makeGatewayProcessedRequest({ signalType: "command" });
const queryRequest = makeGatewayProcessedRequest({ signalType: "query" });
const eventRequest = makeGatewayProcessedRequest({ signalType: "event" });
const piiRequest = makeGatewayProcessedRequest({ signalType: "vibe", piiDetected: true });
const emptySignalRequest = makeGatewayProcessedRequest({ signalType: "" as GatewaySignalType });

describe("AIGatewayConsumerPipelineContract", () => {
  const contract = new AIGatewayConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new AIGatewayConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createAIGatewayConsumerPipelineContract();
      expect(c.execute({ gatewayProcessedRequest: vibeRequest })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ gatewayProcessedRequest: vibeRequest });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has gatewayProcessedRequest", () => {
      expect(result.gatewayProcessedRequest).toBeDefined();
      expect(result.gatewayProcessedRequest).toBe(vibeRequest);
    });

    it("has consumerPackage", () => {
      expect(result.consumerPackage).toBeDefined();
      expect(typeof result.consumerPackage.pipelineHash).toBe("string");
    });

    it("has query", () => {
      expect(typeof result.query).toBe("string");
      expect(result.query).toContain("AIGateway:");
    });

    it("has contextId", () => {
      expect(typeof result.contextId).toBe("string");
      expect(result.contextId).toBe(vibeRequest.gatewayId);
    });

    it("has warnings array", () => {
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("has pipelineHash", () => {
      expect(typeof result.pipelineHash).toBe("string");
      expect(result.pipelineHash.length).toBeGreaterThan(0);
    });

    it("resultId is distinct from pipelineHash", () => {
      expect(result.resultId).not.toBe(result.pipelineHash);
    });
  });

  describe("consumerId propagation", () => {
    it("propagates consumerId when provided", () => {
      const result = contract.execute({ gatewayProcessedRequest: vibeRequest, consumerId: "consumer-xyz" });
      expect(result.consumerId).toBe("consumer-xyz");
    });

    it("consumerId is undefined when not provided", () => {
      const result = contract.execute({ gatewayProcessedRequest: vibeRequest });
      expect(result.consumerId).toBeUndefined();
    });
  });

  describe("query derivation", () => {
    it("derives query with vibe signal", () => {
      const result = contract.execute({ gatewayProcessedRequest: vibeRequest });
      expect(result.query).toBe("AIGateway: signal=vibe, privacy=no, env=cvf");
    });

    it("derives query with command signal", () => {
      const result = contract.execute({ gatewayProcessedRequest: commandRequest });
      expect(result.query).toBe("AIGateway: signal=command, privacy=no, env=cvf");
    });

    it("derives query with query signal", () => {
      const result = contract.execute({ gatewayProcessedRequest: queryRequest });
      expect(result.query).toBe("AIGateway: signal=query, privacy=no, env=cvf");
    });

    it("derives query with event signal", () => {
      const result = contract.execute({ gatewayProcessedRequest: eventRequest });
      expect(result.query).toBe("AIGateway: signal=event, privacy=no, env=cvf");
    });

    it("derives query with PII detected", () => {
      const result = contract.execute({ gatewayProcessedRequest: piiRequest });
      expect(result.query).toBe("AIGateway: signal=vibe, privacy=yes, env=cvf");
    });
  });

  describe("contextId extraction", () => {
    it("extracts contextId from gatewayId", () => {
      const request = makeGatewayProcessedRequest({ gatewayId: "gateway-xyz-789" });
      const result = contract.execute({ gatewayProcessedRequest: request });
      expect(result.contextId).toBe("gateway-xyz-789");
    });
  });

  describe("warnings", () => {
    it("emits WARNING_PII_DETECTED when PII is detected", () => {
      const result = contract.execute({ gatewayProcessedRequest: piiRequest });
      expect(result.warnings).toContain("WARNING_PII_DETECTED");
    });

    it("does not emit WARNING_PII_DETECTED when no PII", () => {
      const result = contract.execute({ gatewayProcessedRequest: vibeRequest });
      expect(result.warnings).not.toContain("WARNING_PII_DETECTED");
    });

    it("emits WARNING_NO_SIGNAL when signal is empty", () => {
      const result = contract.execute({ gatewayProcessedRequest: emptySignalRequest });
      expect(result.warnings).toContain("WARNING_NO_SIGNAL");
    });

    it("emits no warnings for normal request", () => {
      const result = contract.execute({ gatewayProcessedRequest: vibeRequest });
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ gatewayProcessedRequest: vibeRequest });
      const r2 = contract.execute({ gatewayProcessedRequest: vibeRequest });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ gatewayProcessedRequest: vibeRequest });
      const r2 = contract.execute({ gatewayProcessedRequest: vibeRequest });
      expect(r1.resultId).toBe(r2.resultId);
    });
  });
});

describe("AIGatewayConsumerPipelineBatchContract", () => {
  const pipelineContract = new AIGatewayConsumerPipelineContract({ now: () => FIXED_NOW });
  const batchContract = new AIGatewayConsumerPipelineBatchContract({ now: () => FIXED_NOW });

  function makeResult(signalType: GatewaySignalType, piiDetected = false, envPlatform = "cvf") {
    const request = makeGatewayProcessedRequest({ signalType, piiDetected, envPlatform });
    return pipelineContract.execute({ gatewayProcessedRequest: request });
  }

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new AIGatewayConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createAIGatewayConsumerPipelineBatchContract();
      expect(c.batch([])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const results = [makeResult("vibe")];
    const batch = batchContract.batch(results);

    it("has batchId", () => {
      expect(typeof batch.batchId).toBe("string");
      expect(batch.batchId.length).toBeGreaterThan(0);
    });

    it("has batchHash", () => {
      expect(typeof batch.batchHash).toBe("string");
      expect(batch.batchHash.length).toBeGreaterThan(0);
    });

    it("has createdAt", () => {
      expect(batch.createdAt).toBe(FIXED_NOW);
    });

    it("has totalRequests", () => {
      expect(typeof batch.totalRequests).toBe("number");
      expect(batch.totalRequests).toBe(1);
    });

    it("has overallDominantSignal", () => {
      expect(typeof batch.overallDominantSignal).toBe("string");
      expect(["vibe", "command", "query", "event"]).toContain(batch.overallDominantSignal);
    });

    it("has totalPIIDetections", () => {
      expect(typeof batch.totalPIIDetections).toBe("number");
    });

    it("has dominantEnvType", () => {
      expect(typeof batch.dominantEnvType).toBe("string");
    });

    it("has dominantTokenBudget", () => {
      expect(typeof batch.dominantTokenBudget).toBe("number");
    });

    it("has results array", () => {
      expect(Array.isArray(batch.results)).toBe(true);
      expect(batch.results).toHaveLength(1);
    });

    it("batchId differs from batchHash", () => {
      expect(batch.batchId).not.toBe(batch.batchHash);
    });
  });

  describe("aggregation", () => {
    it("calculates totalRequests correctly", () => {
      const results = [makeResult("vibe"), makeResult("command"), makeResult("query")];
      const batch = batchContract.batch(results);
      expect(batch.totalRequests).toBe(3);
    });

    it("calculates totalPIIDetections correctly", () => {
      const results = [makeResult("vibe", true), makeResult("command", false), makeResult("query", true)];
      const batch = batchContract.batch(results);
      expect(batch.totalPIIDetections).toBe(2);
    });

    it("selects dominant signal based on frequency (vibe)", () => {
      const results = [makeResult("vibe"), makeResult("vibe"), makeResult("command")];
      const batch = batchContract.batch(results);
      expect(batch.overallDominantSignal).toBe("vibe");
    });

    it("selects dominant signal based on frequency (command)", () => {
      const results = [makeResult("command"), makeResult("command"), makeResult("vibe")];
      const batch = batchContract.batch(results);
      expect(batch.overallDominantSignal).toBe("command");
    });

    it("breaks ties using priority order (vibe > command)", () => {
      const results = [makeResult("vibe"), makeResult("command")];
      const batch = batchContract.batch(results);
      expect(batch.overallDominantSignal).toBe("vibe");
    });

    it("breaks ties using priority order (command > query)", () => {
      const results = [makeResult("command"), makeResult("query")];
      const batch = batchContract.batch(results);
      expect(batch.overallDominantSignal).toBe("command");
    });

    it("breaks ties using priority order (query > event)", () => {
      const results = [makeResult("query"), makeResult("event")];
      const batch = batchContract.batch(results);
      expect(batch.overallDominantSignal).toBe("query");
    });

    it("selects dominant env type based on frequency", () => {
      const results = [makeResult("vibe", false, "cvf"), makeResult("command", false, "cvf"), makeResult("query", false, "aws")];
      const batch = batchContract.batch(results);
      expect(batch.dominantEnvType).toBe("cvf");
    });

    it("calculates dominantTokenBudget as max", () => {
      const results = [makeResult("vibe"), makeResult("command"), makeResult("query")];
      const batch = batchContract.batch(results);
      expect(batch.dominantTokenBudget).toBeGreaterThan(0);
    });

    it("handles empty batch with dominantTokenBudget = 0", () => {
      const batch = batchContract.batch([]);
      expect(batch.totalRequests).toBe(0);
      expect(batch.totalPIIDetections).toBe(0);
      expect(batch.dominantTokenBudget).toBe(0);
      expect(batch.overallDominantSignal).toBe("vibe");
      expect(batch.dominantEnvType).toBe("cvf");
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic for same input", () => {
      const results = [makeResult("vibe")];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchHash).toBe(b2.batchHash);
    });

    it("batchId is deterministic for same input", () => {
      const results = [makeResult("vibe")];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchId).toBe(b2.batchId);
    });
  });
});
