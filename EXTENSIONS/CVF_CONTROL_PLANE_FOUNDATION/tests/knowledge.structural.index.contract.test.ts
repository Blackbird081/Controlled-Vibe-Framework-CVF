import { describe, it, expect } from "vitest";
import {
  StructuralIndexContract,
  createStructuralIndexContract,
  type StructuralIndexRequest,
  type StructuralEntity,
  type StructuralRelation,
} from "../src/knowledge.structural.index.contract";

// ─── W72-T1 CP1: StructuralIndexContract ─────────────────────────────────────

const FIXED_NOW = "2026-04-13T00:00:00.000Z";

function makeContract(): StructuralIndexContract {
  return new StructuralIndexContract({ now: () => FIXED_NOW });
}

function makeEntities(ids: string[]): StructuralEntity[] {
  return ids.map((id) => ({ entityId: id, label: `Label-${id}` }));
}

function makeRelation(
  fromId: string,
  toId: string,
  relationType: StructuralRelation["relationType"] = "depends_on",
): StructuralRelation {
  return { fromId, toId, relationType };
}

function makeRequest(overrides: Partial<StructuralIndexRequest> = {}): StructuralIndexRequest {
  return {
    contextId: "ctx-default",
    entities: makeEntities(["A", "B", "C"]),
    relations: [makeRelation("A", "B"), makeRelation("B", "C")],
    queryEntityId: "A",
    ...overrides,
  };
}

// --- factory ---

describe("W72-T1 CP1: StructuralIndexContract — factory", () => {
  it("createStructuralIndexContract returns a StructuralIndexContract instance", () => {
    expect(createStructuralIndexContract()).toBeInstanceOf(StructuralIndexContract);
  });

  it("factory with no args uses live timestamp", () => {
    const contract = createStructuralIndexContract();
    const result = contract.index(makeRequest());
    expect(result.indexedAt).toBeTruthy();
  });
});

// --- output shape ---

describe("W72-T1 CP1: StructuralIndexContract — output shape", () => {
  it("result has all required fields", () => {
    const result = makeContract().index(makeRequest());
    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("indexedAt");
    expect(result).toHaveProperty("contextId");
    expect(result).toHaveProperty("queryEntityId");
    expect(result).toHaveProperty("totalEntities");
    expect(result).toHaveProperty("totalRelations");
    expect(result).toHaveProperty("neighbors");
    expect(result).toHaveProperty("indexHash");
  });

  it("indexedAt matches injected timestamp", () => {
    const result = makeContract().index(makeRequest());
    expect(result.indexedAt).toBe(FIXED_NOW);
  });

  it("contextId matches request contextId", () => {
    const result = makeContract().index(makeRequest({ contextId: "ctx-shape" }));
    expect(result.contextId).toBe("ctx-shape");
  });

  it("queryEntityId matches request queryEntityId", () => {
    const result = makeContract().index(makeRequest({ queryEntityId: "A" }));
    expect(result.queryEntityId).toBe("A");
  });

  it("totalEntities matches entity count", () => {
    const result = makeContract().index(makeRequest());
    expect(result.totalEntities).toBe(3);
  });

  it("totalRelations matches relation count", () => {
    const result = makeContract().index(makeRequest());
    expect(result.totalRelations).toBe(2);
  });

  it("resultId is a non-empty string", () => {
    const result = makeContract().index(makeRequest());
    expect(typeof result.resultId).toBe("string");
    expect(result.resultId.length).toBeGreaterThan(0);
  });

  it("indexHash is a non-empty string", () => {
    const result = makeContract().index(makeRequest());
    expect(typeof result.indexHash).toBe("string");
    expect(result.indexHash.length).toBeGreaterThan(0);
  });

  it("resultId differs from indexHash", () => {
    const result = makeContract().index(makeRequest());
    expect(result.resultId).not.toBe(result.indexHash);
  });
});

// --- basic traversal ---

describe("W72-T1 CP1: StructuralIndexContract — basic traversal", () => {
  it("returns direct neighbor at depth 1 (default)", () => {
    const result = makeContract().index(makeRequest({ queryEntityId: "A" }));
    expect(result.neighbors).toHaveLength(1);
    expect(result.neighbors[0].entityId).toBe("B");
    expect(result.neighbors[0].depth).toBe(1);
  });

  it("returns two-hop neighbor at depth 2", () => {
    const result = makeContract().index(makeRequest({ queryEntityId: "A", maxDepth: 2 }));
    const ids = result.neighbors.map((n) => n.entityId);
    expect(ids).toContain("B");
    expect(ids).toContain("C");
    expect(result.neighbors).toHaveLength(2);
  });

  it("returns empty neighbors when maxDepth is 0", () => {
    const result = makeContract().index(makeRequest({ queryEntityId: "A", maxDepth: 0 }));
    expect(result.neighbors).toHaveLength(0);
  });

  it("returns empty neighbors when queryEntity has no outgoing edges", () => {
    const result = makeContract().index(makeRequest({ queryEntityId: "C" }));
    expect(result.neighbors).toHaveLength(0);
  });

  it("neighbor depth is 1 for direct connection", () => {
    const result = makeContract().index(makeRequest({ queryEntityId: "A" }));
    expect(result.neighbors[0].depth).toBe(1);
  });

  it("neighbor at depth 2 has depth = 2", () => {
    const result = makeContract().index(makeRequest({ queryEntityId: "A", maxDepth: 2 }));
    const c = result.neighbors.find((n) => n.entityId === "C");
    expect(c?.depth).toBe(2);
  });
});

// --- neighbor fields ---

describe("W72-T1 CP1: StructuralIndexContract — neighbor fields", () => {
  it("neighbor includes entityId, label, relationType, depth", () => {
    const result = makeContract().index(makeRequest({ queryEntityId: "A" }));
    const n = result.neighbors[0];
    expect(n).toHaveProperty("entityId");
    expect(n).toHaveProperty("label");
    expect(n).toHaveProperty("relationType");
    expect(n).toHaveProperty("depth");
  });

  it("neighbor label matches entity label", () => {
    const result = makeContract().index(makeRequest({ queryEntityId: "A" }));
    expect(result.neighbors[0].label).toBe("Label-B");
  });

  it("neighbor relationType matches the relation's relationType", () => {
    const request = makeRequest({
      queryEntityId: "A",
      relations: [makeRelation("A", "B", "extends")],
    });
    const result = makeContract().index(request);
    expect(result.neighbors[0].relationType).toBe("extends");
  });
});

// --- relation types ---

describe("W72-T1 CP1: StructuralIndexContract — relation types", () => {
  it("supports depends_on relation type", () => {
    const result = makeContract().index(
      makeRequest({ relations: [makeRelation("A", "B", "depends_on")] }),
    );
    expect(result.neighbors[0].relationType).toBe("depends_on");
  });

  it("supports related_to relation type", () => {
    const result = makeContract().index(
      makeRequest({ relations: [makeRelation("A", "B", "related_to")] }),
    );
    expect(result.neighbors[0].relationType).toBe("related_to");
  });

  it("supports extends relation type", () => {
    const result = makeContract().index(
      makeRequest({ relations: [makeRelation("A", "B", "extends")] }),
    );
    expect(result.neighbors[0].relationType).toBe("extends");
  });

  it("supports supersedes relation type", () => {
    const result = makeContract().index(
      makeRequest({ relations: [makeRelation("A", "B", "supersedes")] }),
    );
    expect(result.neighbors[0].relationType).toBe("supersedes");
  });
});

// --- edge cases ---

describe("W72-T1 CP1: StructuralIndexContract — edge cases", () => {
  it("returns empty neighbors for empty entities and relations", () => {
    const result = makeContract().index({
      contextId: "ctx-empty",
      entities: [],
      relations: [],
      queryEntityId: "X",
    });
    expect(result.neighbors).toHaveLength(0);
    expect(result.totalEntities).toBe(0);
    expect(result.totalRelations).toBe(0);
  });

  it("ignores relations where fromId is not in entities", () => {
    const request: StructuralIndexRequest = {
      contextId: "ctx-orphan",
      entities: makeEntities(["A", "B"]),
      relations: [makeRelation("UNKNOWN", "B"), makeRelation("A", "B")],
      queryEntityId: "A",
    };
    const result = makeContract().index(request);
    expect(result.neighbors).toHaveLength(1);
    expect(result.neighbors[0].entityId).toBe("B");
  });

  it("ignores relations where toId is not in entities", () => {
    const request: StructuralIndexRequest = {
      contextId: "ctx-dead-end",
      entities: makeEntities(["A", "B"]),
      relations: [makeRelation("A", "UNKNOWN"), makeRelation("A", "B")],
      queryEntityId: "A",
    };
    const result = makeContract().index(request);
    expect(result.neighbors.map((n) => n.entityId)).toEqual(["B"]);
  });

  it("does not revisit already-visited nodes (no cycles)", () => {
    const request: StructuralIndexRequest = {
      contextId: "ctx-cycle",
      entities: makeEntities(["A", "B", "C"]),
      relations: [
        makeRelation("A", "B"),
        makeRelation("B", "C"),
        makeRelation("C", "A"), // cycle back
      ],
      queryEntityId: "A",
      maxDepth: 5,
    };
    const result = makeContract().index(request);
    const ids = result.neighbors.map((n) => n.entityId);
    // A is start node, should not appear as neighbor; each of B and C appear once
    expect(ids.filter((id) => id === "A")).toHaveLength(0);
    expect(ids.filter((id) => id === "B")).toHaveLength(1);
    expect(ids.filter((id) => id === "C")).toHaveLength(1);
  });

  it("returns neighbors sorted by depth then entityId", () => {
    const request: StructuralIndexRequest = {
      contextId: "ctx-sort",
      entities: makeEntities(["A", "B", "C", "D"]),
      relations: [
        makeRelation("A", "C"),
        makeRelation("A", "B"),
        makeRelation("B", "D"),
      ],
      queryEntityId: "A",
      maxDepth: 2,
    };
    const result = makeContract().index(request);
    const ids = result.neighbors.map((n) => n.entityId);
    // depth-1: B, C (sorted by id); depth-2: D
    expect(ids[0]).toBe("B");
    expect(ids[1]).toBe("C");
    expect(ids[2]).toBe("D");
  });
});

// --- determinism ---

describe("W72-T1 CP1: StructuralIndexContract — determinism", () => {
  it("produces same indexHash for same request and same timestamp", () => {
    const r1 = makeContract().index(makeRequest());
    const r2 = makeContract().index(makeRequest());
    expect(r1.indexHash).toBe(r2.indexHash);
  });

  it("produces same resultId for same request and same timestamp", () => {
    const r1 = makeContract().index(makeRequest());
    const r2 = makeContract().index(makeRequest());
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("produces different indexHash for different contextId", () => {
    const r1 = makeContract().index(makeRequest({ contextId: "ctx-a" }));
    const r2 = makeContract().index(makeRequest({ contextId: "ctx-b" }));
    expect(r1.indexHash).not.toBe(r2.indexHash);
  });

  it("produces different indexHash for different queryEntityId", () => {
    const r1 = makeContract().index(
      makeRequest({ queryEntityId: "A", maxDepth: 2 }),
    );
    const r2 = makeContract().index(
      makeRequest({ queryEntityId: "B", maxDepth: 2 }),
    );
    expect(r1.indexHash).not.toBe(r2.indexHash);
  });
});
