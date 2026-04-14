import { describe, it, expect } from "vitest";
import {
  KnowledgeMaintenanceContract,
  createKnowledgeMaintenanceContract,
  type KnowledgeMaintenanceRequest,
} from "../src/knowledge.maintenance.contract";
import {
  CompiledKnowledgeArtifactContract,
} from "../src/knowledge.compiled.artifact.contract";
import type { CompiledKnowledgeArtifact } from "../src/knowledge.compiled.artifact.contract";

// ─── W73-T2: KnowledgeMaintenanceContract ────────────────────────────────────

const COMPILE_NOW = "2026-01-01T00:00:00.000Z";
const EVAL_NOW    = "2026-04-14T00:00:00.000Z";  // 103 days after COMPILE_NOW
const GOVERN_NOW  = "2026-01-02T00:00:00.000Z";

function makeApprovedArtifact(overrides: Partial<{
  content: string;
  sourceIds: string[];
  compiledAt: string;
}> = {}): CompiledKnowledgeArtifact {
  const compiler = new CompiledKnowledgeArtifactContract({ now: () => overrides.compiledAt ?? COMPILE_NOW });
  const artifact = compiler.compile({
    contextId: "ctx-test",
    artifactType: "concept",
    sourceIds: overrides.sourceIds ?? ["src-001"],
    citationRef: "Test citation",
    citationTrail: ["raw:src-001"],
    compiledBy: "test-agent",
    content: overrides.content ?? "This artifact covers governance and compliance topics.",
  });
  return new CompiledKnowledgeArtifactContract({ now: () => GOVERN_NOW })
    .govern(artifact, { decision: "approved" });
}

function makeContract(): KnowledgeMaintenanceContract {
  return new KnowledgeMaintenanceContract({ now: () => EVAL_NOW });
}

// --- factory ---

describe("KnowledgeMaintenanceContract — factory", () => {
  it("createKnowledgeMaintenanceContract returns an instance", () => {
    expect(createKnowledgeMaintenanceContract()).toBeInstanceOf(KnowledgeMaintenanceContract);
  });
});

// --- approve guard ---

describe("KnowledgeMaintenanceContract — approval guard", () => {
  it("throws when artifact is not approved (pending)", () => {
    const compiler = new CompiledKnowledgeArtifactContract({ now: () => COMPILE_NOW });
    const pending = compiler.compile({
      contextId: "ctx-test",
      artifactType: "concept",
      sourceIds: ["src-001"],
      citationRef: "Test",
      citationTrail: ["raw:src-001"],
      compiledBy: "test-agent",
      content: "content",
    });
    expect(() => makeContract().evaluate({ artifact: pending, checks: [] })).toThrow();
  });

  it("error message includes artifactId", () => {
    const compiler = new CompiledKnowledgeArtifactContract({ now: () => COMPILE_NOW });
    const pending = compiler.compile({
      contextId: "ctx-test",
      artifactType: "concept",
      sourceIds: ["src-001"],
      citationRef: "Test",
      citationTrail: ["raw:src-001"],
      compiledBy: "test-agent",
      content: "content",
    });
    expect(() => makeContract().evaluate({ artifact: pending, checks: [] }))
      .toThrowError(pending.artifactId);
  });
});

// --- output shape ---

describe("KnowledgeMaintenanceContract — output shape", () => {
  it("result has all required fields", () => {
    const r = makeContract().evaluate({ artifact: makeApprovedArtifact(), checks: [] });
    expect(r).toHaveProperty("artifactId");
    expect(r).toHaveProperty("evaluatedAt");
    expect(r).toHaveProperty("signals");
    expect(r).toHaveProperty("totalSignals");
    expect(r).toHaveProperty("hasIssues");
    expect(r).toHaveProperty("resultHash");
  });

  it("evaluatedAt matches injected timestamp", () => {
    const r = makeContract().evaluate({ artifact: makeApprovedArtifact(), checks: [] });
    expect(r.evaluatedAt).toBe(EVAL_NOW);
  });

  it("artifactId matches the input artifact", () => {
    const artifact = makeApprovedArtifact();
    const r = makeContract().evaluate({ artifact, checks: [] });
    expect(r.artifactId).toBe(artifact.artifactId);
  });

  it("no checks → 0 signals, hasIssues false", () => {
    const r = makeContract().evaluate({ artifact: makeApprovedArtifact(), checks: [] });
    expect(r.totalSignals).toBe(0);
    expect(r.signals).toHaveLength(0);
    expect(r.hasIssues).toBe(false);
  });
});

// --- lint check ---

describe("KnowledgeMaintenanceContract — lint check", () => {
  it("emits no signal when all required keywords are present", () => {
    const r = makeContract().evaluate({
      artifact: makeApprovedArtifact({ content: "This covers governance and compliance." }),
      checks: [{ type: "lint", requiredKeywords: ["governance", "compliance"] }],
    });
    expect(r.totalSignals).toBe(0);
  });

  it("emits signal for each missing keyword", () => {
    const r = makeContract().evaluate({
      artifact: makeApprovedArtifact({ content: "This covers governance only." }),
      checks: [{ type: "lint", requiredKeywords: ["governance", "compliance", "audit"] }],
    });
    expect(r.totalSignals).toBe(2);
    expect(r.signals.every((s) => s.signalType === "lint")).toBe(true);
  });

  it("lint signal message mentions the missing keyword", () => {
    const r = makeContract().evaluate({
      artifact: makeApprovedArtifact({ content: "no match here" }),
      checks: [{ type: "lint", requiredKeywords: ["myKeyword"] }],
    });
    expect(r.signals[0].message).toContain("myKeyword");
  });

  it("empty requiredKeywords → no signals", () => {
    const r = makeContract().evaluate({
      artifact: makeApprovedArtifact(),
      checks: [{ type: "lint", requiredKeywords: [] }],
    });
    expect(r.totalSignals).toBe(0);
  });
});

// --- contradiction check ---

describe("KnowledgeMaintenanceContract — contradiction check", () => {
  it("emits one signal per conflicting artifact ID", () => {
    const r = makeContract().evaluate({
      artifact: makeApprovedArtifact(),
      checks: [{ type: "contradiction", conflictingArtifactIds: ["art-a", "art-b"] }],
    });
    expect(r.totalSignals).toBe(2);
    expect(r.signals.every((s) => s.signalType === "contradiction")).toBe(true);
  });

  it("empty conflictingArtifactIds → no signals", () => {
    const r = makeContract().evaluate({
      artifact: makeApprovedArtifact(),
      checks: [{ type: "contradiction", conflictingArtifactIds: [] }],
    });
    expect(r.totalSignals).toBe(0);
  });

  it("contradiction signal message mentions the conflicting ID", () => {
    const r = makeContract().evaluate({
      artifact: makeApprovedArtifact(),
      checks: [{ type: "contradiction", conflictingArtifactIds: ["art-xyz"] }],
    });
    expect(r.signals[0].message).toContain("art-xyz");
  });
});

// --- drift check ---

describe("KnowledgeMaintenanceContract — drift check", () => {
  it("emits signal when source was modified after compiledAt", () => {
    // compiledAt = 2026-01-01; source modified = 2026-02-01 → drift
    const r = makeContract().evaluate({
      artifact: makeApprovedArtifact(),
      checks: [{ type: "drift", sourceLastModifiedAt: "2026-02-01T00:00:00.000Z" }],
    });
    expect(r.totalSignals).toBe(1);
    expect(r.signals[0].signalType).toBe("drift");
  });

  it("emits no signal when source was modified before compiledAt", () => {
    // compiledAt = 2026-01-01; source modified = 2025-12-01 → no drift
    const r = makeContract().evaluate({
      artifact: makeApprovedArtifact(),
      checks: [{ type: "drift", sourceLastModifiedAt: "2025-12-01T00:00:00.000Z" }],
    });
    expect(r.totalSignals).toBe(0);
  });

  it("emits no signal when source modified exactly at compiledAt", () => {
    const r = makeContract().evaluate({
      artifact: makeApprovedArtifact(),
      checks: [{ type: "drift", sourceLastModifiedAt: COMPILE_NOW }],
    });
    expect(r.totalSignals).toBe(0);
  });
});

// --- orphan check ---

describe("KnowledgeMaintenanceContract — orphan check", () => {
  it("emits signal for each sourceId not in activeSourceIds", () => {
    const r = makeContract().evaluate({
      artifact: makeApprovedArtifact({ sourceIds: ["src-001", "src-002"] }),
      checks: [{ type: "orphan", activeSourceIds: ["src-001"] }],
    });
    expect(r.totalSignals).toBe(1);
    expect(r.signals[0].signalType).toBe("orphan");
    expect(r.signals[0].message).toContain("src-002");
  });

  it("emits no signal when all sourceIds are active", () => {
    const r = makeContract().evaluate({
      artifact: makeApprovedArtifact({ sourceIds: ["src-001"] }),
      checks: [{ type: "orphan", activeSourceIds: ["src-001", "src-002"] }],
    });
    expect(r.totalSignals).toBe(0);
  });
});

// --- staleness check ---

describe("KnowledgeMaintenanceContract — staleness check", () => {
  it("emits signal when artifact is older than maxAgeDays", () => {
    // compiledAt = 2026-01-01, evalAt = 2026-04-14 → ~103 days; maxAgeDays = 30
    const r = makeContract().evaluate({
      artifact: makeApprovedArtifact(),
      checks: [{ type: "staleness", maxAgeDays: 30 }],
    });
    expect(r.totalSignals).toBe(1);
    expect(r.signals[0].signalType).toBe("staleness");
  });

  it("emits no signal when artifact is within maxAgeDays", () => {
    // compiledAt = 2026-01-01, evalAt = 2026-04-14 → ~103 days; maxAgeDays = 200
    const r = makeContract().evaluate({
      artifact: makeApprovedArtifact(),
      checks: [{ type: "staleness", maxAgeDays: 200 }],
    });
    expect(r.totalSignals).toBe(0);
  });
});

// --- multiple checks ---

describe("KnowledgeMaintenanceContract — multiple checks", () => {
  it("accumulates signals from multiple check types", () => {
    const r = makeContract().evaluate({
      artifact: makeApprovedArtifact({
        content: "governance only",
        sourceIds: ["src-001"],
      }),
      checks: [
        { type: "lint", requiredKeywords: ["missing-keyword"] },
        { type: "contradiction", conflictingArtifactIds: ["art-x"] },
        { type: "drift", sourceLastModifiedAt: "2026-03-01T00:00:00.000Z" },
      ],
    });
    expect(r.totalSignals).toBe(3);
    expect(r.hasIssues).toBe(true);
  });
});

// --- signal shape ---

describe("KnowledgeMaintenanceContract — signal shape", () => {
  it("each signal has all required fields", () => {
    const r = makeContract().evaluate({
      artifact: makeApprovedArtifact(),
      checks: [{ type: "contradiction", conflictingArtifactIds: ["art-1"] }],
    });
    const s = r.signals[0];
    expect(s).toHaveProperty("signalId");
    expect(s).toHaveProperty("signalHash");
    expect(s).toHaveProperty("signalType");
    expect(s).toHaveProperty("artifactId");
    expect(s).toHaveProperty("detectedAt");
    expect(s).toHaveProperty("message");
  });

  it("signalId differs from signalHash", () => {
    const r = makeContract().evaluate({
      artifact: makeApprovedArtifact(),
      checks: [{ type: "contradiction", conflictingArtifactIds: ["art-1"] }],
    });
    expect(r.signals[0].signalId).not.toBe(r.signals[0].signalHash);
  });

  it("signalHash is content-bound: same input → same hash", () => {
    const a = makeApprovedArtifact();
    const r1 = makeContract().evaluate({ artifact: a, checks: [{ type: "contradiction", conflictingArtifactIds: ["art-1"] }] });
    const r2 = makeContract().evaluate({ artifact: a, checks: [{ type: "contradiction", conflictingArtifactIds: ["art-1"] }] });
    expect(r1.signals[0].signalHash).toBe(r2.signals[0].signalHash);
  });

  it("signalId is time-variant: different eval times → different signalId", () => {
    const a = makeApprovedArtifact();
    const c1 = new KnowledgeMaintenanceContract({ now: () => "2026-04-14T00:00:00.000Z" });
    const c2 = new KnowledgeMaintenanceContract({ now: () => "2026-05-01T00:00:00.000Z" });
    const r1 = c1.evaluate({ artifact: a, checks: [{ type: "contradiction", conflictingArtifactIds: ["art-1"] }] });
    const r2 = c2.evaluate({ artifact: a, checks: [{ type: "contradiction", conflictingArtifactIds: ["art-1"] }] });
    expect(r1.signals[0].signalId).not.toBe(r2.signals[0].signalId);
  });
});

// --- determinism ---

describe("KnowledgeMaintenanceContract — result determinism", () => {
  it("produces same resultHash for same artifact and same checks and same timestamp", () => {
    const a = makeApprovedArtifact();
    const checks = [{ type: "contradiction" as const, conflictingArtifactIds: ["art-1"] }];
    const r1 = makeContract().evaluate({ artifact: a, checks });
    const r2 = makeContract().evaluate({ artifact: a, checks });
    expect(r1.resultHash).toBe(r2.resultHash);
  });

  it("produces different resultHash for different signals", () => {
    const a = makeApprovedArtifact();
    const r1 = makeContract().evaluate({ artifact: a, checks: [{ type: "contradiction", conflictingArtifactIds: ["art-1"] }] });
    const r2 = makeContract().evaluate({ artifact: a, checks: [{ type: "contradiction", conflictingArtifactIds: ["art-2"] }] });
    expect(r1.resultHash).not.toBe(r2.resultHash);
  });

  it("keeps same resultHash across different evaluation timestamps for same signals", () => {
    const a = makeApprovedArtifact();
    const c1 = new KnowledgeMaintenanceContract({ now: () => "2026-04-14T00:00:00.000Z" });
    const c2 = new KnowledgeMaintenanceContract({ now: () => "2026-05-01T00:00:00.000Z" });
    const checks = [{ type: "contradiction" as const, conflictingArtifactIds: ["art-1"] }];
    const r1 = c1.evaluate({ artifact: a, checks });
    const r2 = c2.evaluate({ artifact: a, checks });
    expect(r1.resultHash).toBe(r2.resultHash);
  });
});
