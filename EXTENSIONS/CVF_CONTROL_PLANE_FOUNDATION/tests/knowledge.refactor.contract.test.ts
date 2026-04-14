import { describe, it, expect } from "vitest";
import {
  KnowledgeRefactorContract,
  createKnowledgeRefactorContract,
  type KnowledgeRefactorRequest,
} from "../src/knowledge.refactor.contract";
import type { KnowledgeMaintenanceResult } from "../src/knowledge.maintenance.contract";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// ─── W74-T1: KnowledgeRefactorContract ───────────────────────────────────────

const PROPOSE_NOW = FIXED_BATCH_NOW;

function makeContract(): KnowledgeRefactorContract {
  return new KnowledgeRefactorContract({ now: () => PROPOSE_NOW });
}

function makeResult(overrides: Partial<KnowledgeMaintenanceResult> = {}): KnowledgeMaintenanceResult {
  const signals = overrides.signals ?? [];
  return {
    artifactId: "art-test-001",
    evaluatedAt: "2026-04-14T00:00:00.000Z",
    signals,
    totalSignals: signals.length,
    hasIssues: signals.length > 0,
    resultHash: "hash-test",
    ...overrides,
  };
}

function makeSignal(type: KnowledgeMaintenanceResult["signals"][number]["signalType"]) {
  return {
    signalId: `sid-${type}`,
    signalHash: `shash-${type}`,
    signalType: type,
    artifactId: "art-test-001",
    detectedAt: "2026-04-14T00:00:00.000Z",
    message: `signal of type ${type}`,
  } as const;
}

function makeRequest(
  signalTypes: KnowledgeMaintenanceResult["signals"][number]["signalType"][],
): KnowledgeRefactorRequest {
  const signals = signalTypes.map(makeSignal);
  return {
    result: makeResult({
      signals,
      totalSignals: signals.length,
      hasIssues: signals.length > 0,
    }),
  };
}

// --- factory ---

describe("KnowledgeRefactorContract — factory", () => {
  it("createKnowledgeRefactorContract returns an instance", () => {
    expect(createKnowledgeRefactorContract()).toBeInstanceOf(KnowledgeRefactorContract);
  });
});

// --- guard: hasIssues must be true ---

describe("KnowledgeRefactorContract — guard", () => {
  it("throws when result.hasIssues is false", () => {
    const req: KnowledgeRefactorRequest = { result: makeResult({ hasIssues: false, signals: [], totalSignals: 0 }) };
    expect(() => makeContract().recommend(req)).toThrow();
  });

  it("error message includes artifactId", () => {
    const req: KnowledgeRefactorRequest = { result: makeResult({ hasIssues: false, signals: [], totalSignals: 0 }) };
    expect(() => makeContract().recommend(req)).toThrowError("art-test-001");
  });
});

// --- output shape ---

describe("KnowledgeRefactorContract — output shape", () => {
  it("result has all required fields", () => {
    const p = makeContract().recommend(makeRequest(["drift"]));
    expect(p).toHaveProperty("proposalId");
    expect(p).toHaveProperty("proposalHash");
    expect(p).toHaveProperty("proposedAt");
    expect(p).toHaveProperty("artifactId");
    expect(p).toHaveProperty("triggerTypes");
    expect(p).toHaveProperty("triggeredBySignalCount");
    expect(p).toHaveProperty("recommendedAction");
    expect(p).toHaveProperty("rationale");
  });

  it("proposedAt matches injected timestamp", () => {
    expect(makeContract().recommend(makeRequest(["drift"])).proposedAt).toBe(PROPOSE_NOW);
  });

  it("artifactId matches input result", () => {
    expect(makeContract().recommend(makeRequest(["drift"])).artifactId).toBe("art-test-001");
  });

  it("triggeredBySignalCount matches result.totalSignals", () => {
    const req = makeRequest(["drift", "staleness"]);
    expect(makeContract().recommend(req).triggeredBySignalCount).toBe(2);
  });

  it("proposalId differs from proposalHash", () => {
    const p = makeContract().recommend(makeRequest(["drift"]));
    expect(p.proposalId).not.toBe(p.proposalHash);
  });

  it("rationale is a non-empty string", () => {
    const p = makeContract().recommend(makeRequest(["drift"]));
    expect(typeof p.rationale).toBe("string");
    expect(p.rationale.length).toBeGreaterThan(0);
  });
});

// --- action heuristic ---

describe("KnowledgeRefactorContract — action heuristic", () => {
  it("orphan-only → archive", () => {
    expect(makeContract().recommend(makeRequest(["orphan"])).recommendedAction).toBe("archive");
  });

  it("drift → recompile", () => {
    expect(makeContract().recommend(makeRequest(["drift"])).recommendedAction).toBe("recompile");
  });

  it("staleness → recompile", () => {
    expect(makeContract().recommend(makeRequest(["staleness"])).recommendedAction).toBe("recompile");
  });

  it("drift + orphan → recompile (not archive, because drift is present)", () => {
    expect(makeContract().recommend(makeRequest(["drift", "orphan"])).recommendedAction).toBe("recompile");
  });

  it("staleness + orphan → recompile", () => {
    expect(makeContract().recommend(makeRequest(["staleness", "orphan"])).recommendedAction).toBe("recompile");
  });

  it("contradiction → review", () => {
    expect(makeContract().recommend(makeRequest(["contradiction"])).recommendedAction).toBe("review");
  });

  it("lint → review", () => {
    expect(makeContract().recommend(makeRequest(["lint"])).recommendedAction).toBe("review");
  });

  it("lint + contradiction → review", () => {
    expect(makeContract().recommend(makeRequest(["lint", "contradiction"])).recommendedAction).toBe("review");
  });

  it("orphan + lint → review (not archive, because lint is present)", () => {
    expect(makeContract().recommend(makeRequest(["orphan", "lint"])).recommendedAction).toBe("review");
  });
});

// --- triggerTypes deduplication ---

describe("KnowledgeRefactorContract — triggerTypes deduplication", () => {
  it("duplicate signal types appear only once in triggerTypes", () => {
    const signals = [makeSignal("drift"), makeSignal("drift")];
    const req: KnowledgeRefactorRequest = {
      result: makeResult({ signals, totalSignals: 2, hasIssues: true }),
    };
    const p = makeContract().recommend(req);
    expect(p.triggerTypes.filter((t) => t === "drift")).toHaveLength(1);
  });

  it("mixed signal types all appear in triggerTypes", () => {
    const p = makeContract().recommend(makeRequest(["drift", "lint", "contradiction"]));
    expect(p.triggerTypes).toContain("drift");
    expect(p.triggerTypes).toContain("lint");
    expect(p.triggerTypes).toContain("contradiction");
  });
});

// --- determinism ---

describe("KnowledgeRefactorContract — determinism", () => {
  it("same input + same timestamp → same proposalHash", () => {
    const req = makeRequest(["drift"]);
    const p1 = makeContract().recommend(req);
    const p2 = makeContract().recommend(req);
    expect(p1.proposalHash).toBe(p2.proposalHash);
  });

  it("proposalHash is time-independent", () => {
    const req = makeRequest(["drift"]);
    const c1 = new KnowledgeRefactorContract({ now: () => "2026-01-01T00:00:00.000Z" });
    const c2 = new KnowledgeRefactorContract({ now: () => "2026-06-01T00:00:00.000Z" });
    expect(c1.recommend(req).proposalHash).toBe(c2.recommend(req).proposalHash);
  });

  it("different timestamps → different proposalId", () => {
    const req = makeRequest(["drift"]);
    const c1 = new KnowledgeRefactorContract({ now: () => "2026-01-01T00:00:00.000Z" });
    const c2 = new KnowledgeRefactorContract({ now: () => "2026-06-01T00:00:00.000Z" });
    expect(c1.recommend(req).proposalId).not.toBe(c2.recommend(req).proposalId);
  });

  it("different signal types → different proposalHash", () => {
    const p1 = makeContract().recommend(makeRequest(["drift"]));
    const p2 = makeContract().recommend(makeRequest(["orphan"]));
    expect(p1.proposalHash).not.toBe(p2.proposalHash);
  });

  it("different action → different proposalHash", () => {
    // drift → recompile; contradiction → review
    const p1 = makeContract().recommend(makeRequest(["drift"]));
    const p2 = makeContract().recommend(makeRequest(["contradiction"]));
    expect(p1.proposalHash).not.toBe(p2.proposalHash);
  });
});
