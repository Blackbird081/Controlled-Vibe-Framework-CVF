import { describe, it, expect } from "vitest";
import {
  AIGatewayBatchContract,
  createAIGatewayBatchContract,
} from "../src/ai.gateway.batch.contract";
import type {
  AIGatewayBatchDominantSignalType,
  AIGatewayBatch,
} from "../src/ai.gateway.batch.contract";
import { AIGatewayContract } from "../src/ai.gateway.contract";
import type { GatewaySignalRequest } from "../src/ai.gateway.contract";

// --- Fixed timestamp for deterministic tests ---

const FIXED_NOW = "2026-04-01T00:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

// --- Helpers ---

function makeGateway(): AIGatewayContract {
  return new AIGatewayContract({ now: fixedNow });
}

function makeBatchContract(): AIGatewayBatchContract {
  return new AIGatewayBatchContract({ now: fixedNow });
}

function makeVibeSignal(id = "c1"): GatewaySignalRequest {
  return {
    rawSignal: "build me a landing page",
    signalType: "vibe",
    consumerId: id,
  };
}

function makeCommandSignal(id = "c2"): GatewaySignalRequest {
  return {
    rawSignal: "execute deployment pipeline now",
    signalType: "command",
    consumerId: id,
  };
}

function makeQuerySignal(id = "c3"): GatewaySignalRequest {
  return {
    rawSignal: "what is the current system status",
    signalType: "query",
    consumerId: id,
  };
}

function makeEventSignal(id = "c4"): GatewaySignalRequest {
  return {
    rawSignal: "system health check triggered",
    signalType: "event",
    consumerId: id,
  };
}

function makePIISignal(id = "c5"): GatewaySignalRequest {
  return {
    rawSignal: "contact user at test@example.com for follow-up",
    signalType: "vibe",
    consumerId: id,
  };
}

function makeEmptySignal(id = "c6"): GatewaySignalRequest {
  return {
    rawSignal: "",
    signalType: "vibe",
    consumerId: id,
  };
}

// ─── Empty Batch ─────────────────────────────────────────────────────────────

describe("AIGatewayBatchContract — empty batch", () => {
  it("returns totalSignals 0 for empty input", () => {
    const batch = makeBatchContract().batch([], makeGateway());
    expect(batch.totalSignals).toBe(0);
  });

  it("returns EMPTY dominantSignalType for empty input", () => {
    const batch = makeBatchContract().batch([], makeGateway());
    expect(batch.dominantSignalType).toBe("EMPTY");
  });

  it("returns empty results array for empty input", () => {
    const batch = makeBatchContract().batch([], makeGateway());
    expect(batch.results).toHaveLength(0);
  });

  it("still produces batchHash and batchId for empty batch", () => {
    const batch = makeBatchContract().batch([], makeGateway());
    expect(batch.batchHash).toBeTruthy();
    expect(batch.batchId).toBeTruthy();
    expect(batch.batchHash).not.toBe(batch.batchId);
  });
});

// ─── Count Accuracy ───────────────────────────────────────────────────────────

describe("AIGatewayBatchContract — count accuracy", () => {
  it("counts vibeCount correctly", () => {
    const signals = [makeVibeSignal("c1"), makeVibeSignal("c2"), makeCommandSignal("c3")];
    const batch = makeBatchContract().batch(signals, makeGateway());
    expect(batch.vibeCount).toBe(2);
  });

  it("counts commandCount correctly", () => {
    const signals = [makeCommandSignal("c1"), makeCommandSignal("c2"), makeQuerySignal("c3")];
    const batch = makeBatchContract().batch(signals, makeGateway());
    expect(batch.commandCount).toBe(2);
  });

  it("counts queryCount correctly", () => {
    const signals = [makeQuerySignal("c1"), makeVibeSignal("c2"), makeQuerySignal("c3")];
    const batch = makeBatchContract().batch(signals, makeGateway());
    expect(batch.queryCount).toBe(2);
  });

  it("counts eventCount correctly", () => {
    const signals = [makeEventSignal("c1"), makeEventSignal("c2"), makeVibeSignal("c3")];
    const batch = makeBatchContract().batch(signals, makeGateway());
    expect(batch.eventCount).toBe(2);
  });

  it("counts filteredCount for PII signals", () => {
    const signals = [makePIISignal("c1"), makeVibeSignal("c2")];
    const batch = makeBatchContract().batch(signals, makeGateway());
    expect(batch.filteredCount).toBe(1);
  });

  it("counts warningCount from all results", () => {
    const signals = [makeEmptySignal("c1"), makeVibeSignal("c2")];
    const batch = makeBatchContract().batch(signals, makeGateway());
    expect(batch.warningCount).toBeGreaterThanOrEqual(1);
  });

  it("totalSignals matches input length", () => {
    const signals = [makeVibeSignal("c1"), makeCommandSignal("c2"), makeQuerySignal("c3"), makeEventSignal("c4")];
    const batch = makeBatchContract().batch(signals, makeGateway());
    expect(batch.totalSignals).toBe(4);
  });
});

// ─── Dominant Signal Type ─────────────────────────────────────────────────────

describe("AIGatewayBatchContract — dominant signal type", () => {
  it("returns vibe when vibe has highest count", () => {
    const signals = [makeVibeSignal("c1"), makeVibeSignal("c2"), makeVibeSignal("c3"), makeCommandSignal("c4")];
    const batch = makeBatchContract().batch(signals, makeGateway());
    expect(batch.dominantSignalType).toBe("vibe");
  });

  it("returns command when command has highest count", () => {
    const signals = [makeCommandSignal("c1"), makeCommandSignal("c2"), makeCommandSignal("c3"), makeVibeSignal("c4")];
    const batch = makeBatchContract().batch(signals, makeGateway());
    expect(batch.dominantSignalType).toBe("command");
  });

  it("returns query when query has highest count", () => {
    const signals = [makeQuerySignal("c1"), makeQuerySignal("c2"), makeQuerySignal("c3"), makeVibeSignal("c4")];
    const batch = makeBatchContract().batch(signals, makeGateway());
    expect(batch.dominantSignalType).toBe("query");
  });

  it("returns event when event has highest count", () => {
    const signals = [makeEventSignal("c1"), makeEventSignal("c2"), makeEventSignal("c3"), makeVibeSignal("c4")];
    const batch = makeBatchContract().batch(signals, makeGateway());
    expect(batch.dominantSignalType).toBe("event");
  });

  it("tie-breaks event > vibe when equal count", () => {
    const signals = [makeEventSignal("c1"), makeVibeSignal("c2")];
    const batch = makeBatchContract().batch(signals, makeGateway());
    expect(batch.dominantSignalType).toBe("event");
  });

  it("tie-breaks command > vibe when equal count", () => {
    const signals = [makeCommandSignal("c1"), makeVibeSignal("c2")];
    const batch = makeBatchContract().batch(signals, makeGateway());
    expect(batch.dominantSignalType).toBe("command");
  });

  it("tie-breaks event > command when equal count", () => {
    const signals = [makeEventSignal("c1"), makeCommandSignal("c2")];
    const batch = makeBatchContract().batch(signals, makeGateway());
    expect(batch.dominantSignalType).toBe("event");
  });

  it("tie-breaks command > query when equal count", () => {
    const signals = [makeCommandSignal("c1"), makeQuerySignal("c2")];
    const batch = makeBatchContract().batch(signals, makeGateway());
    expect(batch.dominantSignalType).toBe("command");
  });
});

// ─── Determinism ──────────────────────────────────────────────────────────────

describe("AIGatewayBatchContract — determinism", () => {
  it("produces identical batchHash for identical inputs", () => {
    const signals = [makeVibeSignal("c1"), makeCommandSignal("c2")];
    const batch1 = makeBatchContract().batch(signals, makeGateway());
    const batch2 = makeBatchContract().batch(signals, makeGateway());
    expect(batch1.batchHash).toBe(batch2.batchHash);
  });

  it("produces identical batchId for identical inputs", () => {
    const signals = [makeVibeSignal("c1"), makeCommandSignal("c2")];
    const batch1 = makeBatchContract().batch(signals, makeGateway());
    const batch2 = makeBatchContract().batch(signals, makeGateway());
    expect(batch1.batchId).toBe(batch2.batchId);
  });

  it("batchHash differs for different inputs", () => {
    const batch1 = makeBatchContract().batch([makeVibeSignal("c1")], makeGateway());
    const batch2 = makeBatchContract().batch([makeCommandSignal("c1")], makeGateway());
    expect(batch1.batchHash).not.toBe(batch2.batchHash);
  });

  it("batchHash and batchId are distinct", () => {
    const batch = makeBatchContract().batch([makeVibeSignal("c1")], makeGateway());
    expect(batch.batchHash).not.toBe(batch.batchId);
  });
});

// ─── Factory ──────────────────────────────────────────────────────────────────

describe("AIGatewayBatchContract — factory", () => {
  it("createAIGatewayBatchContract returns an AIGatewayBatchContract instance", () => {
    const contract = createAIGatewayBatchContract({ now: fixedNow });
    expect(contract).toBeInstanceOf(AIGatewayBatchContract);
  });

  it("factory contract produces same output as direct instantiation", () => {
    const signals = [makeVibeSignal("c1"), makeEventSignal("c2")];
    const gateway = makeGateway();
    const direct = makeBatchContract().batch(signals, gateway);
    const factory = createAIGatewayBatchContract({ now: fixedNow }).batch(signals, gateway);
    expect(factory.batchHash).toBe(direct.batchHash);
    expect(factory.batchId).toBe(direct.batchId);
  });
});

// ─── Output Shape ─────────────────────────────────────────────────────────────

describe("AIGatewayBatchContract — output shape", () => {
  it("batch output contains all required fields", () => {
    const batch: AIGatewayBatch = makeBatchContract().batch(
      [makeVibeSignal("c1"), makeEventSignal("c2")],
      makeGateway(),
    );
    expect(batch).toHaveProperty("batchId");
    expect(batch).toHaveProperty("batchHash");
    expect(batch).toHaveProperty("createdAt");
    expect(batch).toHaveProperty("totalSignals");
    expect(batch).toHaveProperty("vibeCount");
    expect(batch).toHaveProperty("commandCount");
    expect(batch).toHaveProperty("queryCount");
    expect(batch).toHaveProperty("eventCount");
    expect(batch).toHaveProperty("filteredCount");
    expect(batch).toHaveProperty("warningCount");
    expect(batch).toHaveProperty("dominantSignalType");
    expect(batch).toHaveProperty("results");
  });

  it("results array contains GatewayProcessedRequest with gatewayHash", () => {
    const batch = makeBatchContract().batch([makeVibeSignal("c1")], makeGateway());
    expect(batch.results[0]).toHaveProperty("gatewayHash");
    expect(batch.results[0]).toHaveProperty("gatewayId");
    expect(batch.results[0]).toHaveProperty("normalizedSignal");
  });

  it("createdAt reflects fixed timestamp", () => {
    const batch = makeBatchContract().batch([], makeGateway());
    expect(batch.createdAt).toBe(FIXED_NOW);
  });
});
