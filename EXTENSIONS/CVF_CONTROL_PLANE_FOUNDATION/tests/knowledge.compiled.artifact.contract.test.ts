import { describe, it, expect } from "vitest";
import {
  CompiledKnowledgeArtifactContract,
  createCompiledKnowledgeArtifactContract,
  type CompiledKnowledgeArtifactCompileRequest,
} from "../src/knowledge.compiled.artifact.contract";

// ─── W72-T4 CP2: CompiledKnowledgeArtifactContract ───────────────────────────

const FIXED_NOW = "2026-04-14T00:00:00.000Z";
const FIXED_GOVERN_NOW = "2026-04-14T01:00:00.000Z";

function makeContract(): CompiledKnowledgeArtifactContract {
  return new CompiledKnowledgeArtifactContract({ now: () => FIXED_NOW });
}

function makeRequest(
  overrides: Partial<CompiledKnowledgeArtifactCompileRequest> = {},
): CompiledKnowledgeArtifactCompileRequest {
  return {
    contextId: "ctx-default",
    artifactType: "concept",
    sourceIds: ["src-001"],
    citationRef: "Source: CVF test fixture",
    citationTrail: ["raw:src-001"],
    compiledBy: "test-agent",
    content: "This is the compiled artifact content.",
    ...overrides,
  };
}

// --- factory ---

describe("W72-T4 CP2: CompiledKnowledgeArtifactContract — factory", () => {
  it("createCompiledKnowledgeArtifactContract returns a contract instance", () => {
    expect(createCompiledKnowledgeArtifactContract()).toBeInstanceOf(
      CompiledKnowledgeArtifactContract,
    );
  });

  it("factory with no args uses live timestamp", () => {
    const contract = createCompiledKnowledgeArtifactContract();
    const result = contract.compile(makeRequest());
    expect(result.compiledAt).toBeTruthy();
  });
});

// --- compile: output shape ---

describe("W72-T4 CP2: CompiledKnowledgeArtifactContract — compile output shape", () => {
  it("result has all 13 required fields", () => {
    const result = makeContract().compile(makeRequest());
    expect(result).toHaveProperty("artifactId");
    expect(result).toHaveProperty("artifactType");
    expect(result).toHaveProperty("compiledAt");
    expect(result).toHaveProperty("sourceIds");
    expect(result).toHaveProperty("citationRef");
    expect(result).toHaveProperty("citationTrail");
    expect(result).toHaveProperty("contextId");
    expect(result).toHaveProperty("compiledBy");
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("artifactHash");
    expect(result).toHaveProperty("governedAt");
    expect(result).toHaveProperty("governanceStatus");
    expect(result).toHaveProperty("rejectionReason");
  });

  it("compiledAt matches injected timestamp", () => {
    const result = makeContract().compile(makeRequest());
    expect(result.compiledAt).toBe(FIXED_NOW);
  });

  it("contextId matches request contextId", () => {
    const result = makeContract().compile(makeRequest({ contextId: "ctx-shape" }));
    expect(result.contextId).toBe("ctx-shape");
  });

  it("artifactType matches request artifactType", () => {
    const result = makeContract().compile(makeRequest({ artifactType: "entity" }));
    expect(result.artifactType).toBe("entity");
  });

  it("sourceIds matches request sourceIds", () => {
    const result = makeContract().compile(makeRequest({ sourceIds: ["src-a", "src-b"] }));
    expect(result.sourceIds).toEqual(["src-a", "src-b"]);
  });

  it("citationRef matches request citationRef", () => {
    const result = makeContract().compile(makeRequest({ citationRef: "My citation" }));
    expect(result.citationRef).toBe("My citation");
  });

  it("citationTrail matches request citationTrail", () => {
    const trail = ["raw:src-001", "intermediate:step-1"];
    const result = makeContract().compile(makeRequest({ citationTrail: trail }));
    expect(result.citationTrail).toEqual(trail);
  });

  it("compiledBy matches request compiledBy", () => {
    const result = makeContract().compile(makeRequest({ compiledBy: "agent-x" }));
    expect(result.compiledBy).toBe("agent-x");
  });

  it("content matches request content", () => {
    const result = makeContract().compile(makeRequest({ content: "hello world" }));
    expect(result.content).toBe("hello world");
  });

  it("governanceStatus is 'pending' after compile", () => {
    const result = makeContract().compile(makeRequest());
    expect(result.governanceStatus).toBe("pending");
  });

  it("governedAt is null after compile", () => {
    const result = makeContract().compile(makeRequest());
    expect(result.governedAt).toBeNull();
  });

  it("rejectionReason is null after compile", () => {
    const result = makeContract().compile(makeRequest());
    expect(result.rejectionReason).toBeNull();
  });

  it("artifactId is a non-empty string", () => {
    const result = makeContract().compile(makeRequest());
    expect(typeof result.artifactId).toBe("string");
    expect(result.artifactId.length).toBeGreaterThan(0);
  });

  it("artifactHash is a non-empty string", () => {
    const result = makeContract().compile(makeRequest());
    expect(typeof result.artifactHash).toBe("string");
    expect(result.artifactHash.length).toBeGreaterThan(0);
  });

  it("artifactId differs from artifactHash", () => {
    const result = makeContract().compile(makeRequest());
    expect(result.artifactId).not.toBe(result.artifactHash);
  });
});

// --- compile: artifact types ---

describe("W72-T4 CP2: CompiledKnowledgeArtifactContract — artifact types", () => {
  it("supports concept artifact type", () => {
    const result = makeContract().compile(makeRequest({ artifactType: "concept" }));
    expect(result.artifactType).toBe("concept");
  });

  it("supports entity artifact type", () => {
    const result = makeContract().compile(makeRequest({ artifactType: "entity" }));
    expect(result.artifactType).toBe("entity");
  });

  it("supports summary artifact type", () => {
    const result = makeContract().compile(makeRequest({ artifactType: "summary" }));
    expect(result.artifactType).toBe("summary");
  });
});

// --- compile: determinism ---

describe("W72-T4 CP2: CompiledKnowledgeArtifactContract — compile determinism", () => {
  it("produces same artifactHash for same request and same timestamp", () => {
    const r1 = makeContract().compile(makeRequest());
    const r2 = makeContract().compile(makeRequest());
    expect(r1.artifactHash).toBe(r2.artifactHash);
  });

  it("produces same artifactId for same request and same timestamp", () => {
    const r1 = makeContract().compile(makeRequest());
    const r2 = makeContract().compile(makeRequest());
    expect(r1.artifactId).toBe(r2.artifactId);
  });

  it("keeps same artifactHash when only compile timestamp changes", () => {
    const r1 = new CompiledKnowledgeArtifactContract({ now: () => FIXED_NOW })
      .compile(makeRequest());
    const r2 = new CompiledKnowledgeArtifactContract({ now: () => FIXED_GOVERN_NOW })
      .compile(makeRequest());
    expect(r1.artifactHash).toBe(r2.artifactHash);
  });

  it("changes artifactId when compile timestamp changes", () => {
    const r1 = new CompiledKnowledgeArtifactContract({ now: () => FIXED_NOW })
      .compile(makeRequest());
    const r2 = new CompiledKnowledgeArtifactContract({ now: () => FIXED_GOVERN_NOW })
      .compile(makeRequest());
    expect(r1.artifactId).not.toBe(r2.artifactId);
  });

  it("produces different artifactHash for different contextId", () => {
    const r1 = makeContract().compile(makeRequest({ contextId: "ctx-a" }));
    const r2 = makeContract().compile(makeRequest({ contextId: "ctx-b" }));
    expect(r1.artifactHash).not.toBe(r2.artifactHash);
  });

  it("produces different artifactHash for different content", () => {
    const r1 = makeContract().compile(makeRequest({ content: "content alpha" }));
    const r2 = makeContract().compile(makeRequest({ content: "content beta" }));
    expect(r1.artifactHash).not.toBe(r2.artifactHash);
  });

  it("produces different artifactHash for different sourceIds (same count)", () => {
    const r1 = makeContract().compile(makeRequest({ sourceIds: ["src-001"] }));
    const r2 = makeContract().compile(makeRequest({ sourceIds: ["src-999"] }));
    expect(r1.artifactHash).not.toBe(r2.artifactHash);
  });

  it("produces different artifactHash for different citationTrail (same length)", () => {
    const r1 = makeContract().compile(makeRequest({ citationTrail: ["raw:src-001"] }));
    const r2 = makeContract().compile(makeRequest({ citationTrail: ["raw:src-999"] }));
    expect(r1.artifactHash).not.toBe(r2.artifactHash);
  });

  it("produces different artifactHash for different artifactType", () => {
    const r1 = makeContract().compile(makeRequest({ artifactType: "concept" }));
    const r2 = makeContract().compile(makeRequest({ artifactType: "entity" }));
    expect(r1.artifactHash).not.toBe(r2.artifactHash);
  });

  it("produces different artifactHash for different compiledBy", () => {
    const r1 = makeContract().compile(makeRequest({ compiledBy: "agent-a" }));
    const r2 = makeContract().compile(makeRequest({ compiledBy: "agent-b" }));
    expect(r1.artifactHash).not.toBe(r2.artifactHash);
  });
});

// --- compile: validation ---

describe("W72-T4 CP2: CompiledKnowledgeArtifactContract — compile validation", () => {
  it("throws when contextId is blank", () => {
    expect(() => makeContract().compile(makeRequest({ contextId: "   " }))).toThrowError(
      "contextId",
    );
  });

  it("throws when sourceIds is empty", () => {
    expect(() => makeContract().compile(makeRequest({ sourceIds: [] }))).toThrowError(
      "sourceIds",
    );
  });

  it("throws when sourceIds only contains blanks", () => {
    expect(() => makeContract().compile(makeRequest({ sourceIds: [" ", "   "] }))).toThrowError(
      "sourceIds",
    );
  });

  it("throws when citationRef is blank", () => {
    expect(() => makeContract().compile(makeRequest({ citationRef: "   " }))).toThrowError(
      "citationRef",
    );
  });

  it("throws when citationTrail is empty", () => {
    expect(() => makeContract().compile(makeRequest({ citationTrail: [] }))).toThrowError(
      "citationTrail",
    );
  });

  it("throws when compiledBy is blank", () => {
    expect(() => makeContract().compile(makeRequest({ compiledBy: "   " }))).toThrowError(
      "compiledBy",
    );
  });

  it("throws when content is blank", () => {
    expect(() => makeContract().compile(makeRequest({ content: "   " }))).toThrowError(
      "content",
    );
  });
});

// --- govern: output shape ---

describe("W72-T4 CP2: CompiledKnowledgeArtifactContract — govern output shape", () => {
  it("govern approved sets governanceStatus to 'approved'", () => {
    const artifact = makeContract().compile(makeRequest());
    const governed = new CompiledKnowledgeArtifactContract({ now: () => FIXED_GOVERN_NOW })
      .govern(artifact, { decision: "approved" });
    expect(governed.governanceStatus).toBe("approved");
  });

  it("govern rejected sets governanceStatus to 'rejected'", () => {
    const artifact = makeContract().compile(makeRequest());
    const governed = new CompiledKnowledgeArtifactContract({ now: () => FIXED_GOVERN_NOW })
      .govern(artifact, { decision: "rejected", reason: "failed citation check" });
    expect(governed.governanceStatus).toBe("rejected");
  });

  it("govern rejected preserves rejectionReason", () => {
    const artifact = makeContract().compile(makeRequest());
    const governed = new CompiledKnowledgeArtifactContract({ now: () => FIXED_GOVERN_NOW })
      .govern(artifact, { decision: "rejected", reason: "failed citation check" });
    expect(governed.rejectionReason).toBe("failed citation check");
  });

  it("govern approved clears rejectionReason", () => {
    const artifact = makeContract().compile(makeRequest());
    const governed = new CompiledKnowledgeArtifactContract({ now: () => FIXED_GOVERN_NOW })
      .govern(artifact, { decision: "approved" });
    expect(governed.rejectionReason).toBeNull();
  });

  it("govern rejected uses default rejectionReason when none is supplied", () => {
    const artifact = makeContract().compile(makeRequest());
    const governed = new CompiledKnowledgeArtifactContract({ now: () => FIXED_GOVERN_NOW })
      .govern(artifact, { decision: "rejected" });
    expect(governed.rejectionReason).toBe("Govern step rejected artifact");
  });

  it("govern sets governedAt to injected timestamp", () => {
    const artifact = makeContract().compile(makeRequest());
    const governed = new CompiledKnowledgeArtifactContract({ now: () => FIXED_GOVERN_NOW })
      .govern(artifact, { decision: "approved" });
    expect(governed.governedAt).toBe(FIXED_GOVERN_NOW);
  });

  it("govern does NOT change artifactHash", () => {
    const artifact = makeContract().compile(makeRequest());
    const governed = new CompiledKnowledgeArtifactContract({ now: () => FIXED_GOVERN_NOW })
      .govern(artifact, { decision: "approved" });
    expect(governed.artifactHash).toBe(artifact.artifactHash);
  });

  it("govern does NOT change artifactId", () => {
    const artifact = makeContract().compile(makeRequest());
    const governed = new CompiledKnowledgeArtifactContract({ now: () => FIXED_GOVERN_NOW })
      .govern(artifact, { decision: "approved" });
    expect(governed.artifactId).toBe(artifact.artifactId);
  });

  it("govern does NOT change content", () => {
    const artifact = makeContract().compile(makeRequest());
    const governed = new CompiledKnowledgeArtifactContract({ now: () => FIXED_GOVERN_NOW })
      .govern(artifact, { decision: "approved" });
    expect(governed.content).toBe(artifact.content);
  });

  it("govern does NOT change citationTrail", () => {
    const artifact = makeContract().compile(makeRequest());
    const governed = new CompiledKnowledgeArtifactContract({ now: () => FIXED_GOVERN_NOW })
      .govern(artifact, { decision: "approved" });
    expect(governed.citationTrail).toEqual(artifact.citationTrail);
  });
});

// --- govern: state machine ---

describe("W72-T4 CP2: CompiledKnowledgeArtifactContract — govern state machine", () => {
  it("throws when governing an already-approved artifact", () => {
    const artifact = makeContract().compile(makeRequest());
    const govContract = new CompiledKnowledgeArtifactContract({ now: () => FIXED_GOVERN_NOW });
    const approved = govContract.govern(artifact, { decision: "approved" });
    expect(() => govContract.govern(approved, { decision: "approved" })).toThrow();
  });

  it("throws when governing an already-rejected artifact", () => {
    const artifact = makeContract().compile(makeRequest());
    const govContract = new CompiledKnowledgeArtifactContract({ now: () => FIXED_GOVERN_NOW });
    const rejected = govContract.govern(artifact, { decision: "rejected" });
    expect(() => govContract.govern(rejected, { decision: "approved" })).toThrow();
  });

  it("error message includes artifactId", () => {
    const artifact = makeContract().compile(makeRequest());
    const govContract = new CompiledKnowledgeArtifactContract({ now: () => FIXED_GOVERN_NOW });
    const approved = govContract.govern(artifact, { decision: "approved" });
    expect(() => govContract.govern(approved, { decision: "rejected" })).toThrowError(
      artifact.artifactId,
    );
  });
});
