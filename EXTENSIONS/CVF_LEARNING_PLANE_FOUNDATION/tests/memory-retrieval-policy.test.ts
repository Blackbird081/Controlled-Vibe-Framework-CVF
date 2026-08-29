import { describe, expect, it } from "vitest";
import {
  evaluateRetrievalRequest,
  MEMORY_RETRIEVAL_POLICY_VERSION,
  type MemoryRetrievalCandidate,
} from "../src/memory-retrieval-policy";
import { createInMemoryGraphKnowledgeService } from "../src/knowledge/graph/index/symbol-index";

const candidates: MemoryRetrievalCandidate[] = [
  {
    id: "mem-1",
    scope: "project-a",
    summary: "Qwen provider routing requires R1 payload",
    createdAt: 100,
    auditTrust: 0.9,
    lifecycleState: "semantic",
  },
  {
    id: "mem-2",
    scope: "project-b",
    summary: "different scope",
    createdAt: 200,
    auditTrust: 1,
    lifecycleState: "semantic",
  },
  {
    id: "mem-3",
    scope: "project-a",
    summary: "secret value",
    createdAt: 300,
    auditTrust: 1,
    lifecycleState: "semantic",
    containsSecret: true,
  },
];

describe("memory retrieval policy phase 2b", () => {
  it("filters by scope, privacy, and query before returning summaries", () => {
    const result = evaluateRetrievalRequest({
      method: "keyword",
      query: "qwen",
      scope: "project-a",
      actorAuthorized: true,
      candidates,
    });

    expect(result).toMatchObject({
      contractVersion: MEMORY_RETRIEVAL_POLICY_VERSION,
      status: "allowed",
      rawMemoryReleased: false,
    });
    expect(result.selected.map((item) => item.id)).toEqual(["mem-1"]);
    expect(result.excluded).toEqual([
      { id: "mem-2", reason: "out_of_scope" },
      { id: "mem-3", reason: "privacy_filtered" },
    ]);
  });

  it("denies unauthorized actors", () => {
    expect(evaluateRetrievalRequest({
      method: "recency",
      query: "",
      scope: "project-a",
      actorAuthorized: false,
      candidates,
    })).toMatchObject({
      status: "denied",
      reason: "actor_not_authorized_for_memory_retrieval",
      selected: [],
      rawMemoryReleased: false,
    });
  });

  it("keeps graph search deferred until a graph service is injected", () => {
    expect(evaluateRetrievalRequest({
      method: "graph_search",
      query: "routing",
      scope: "project-a",
      actorAuthorized: true,
      candidates,
    })).toMatchObject({
      status: "deferred",
      reason: "graph_search_requires_injected_graph_knowledge_service",
      selected: [],
    });
  });

  it("uses injected graph knowledge service for advisory graph_search results", () => {
    const graphKnowledgeService = createInMemoryGraphKnowledgeService([
      {
        filePath: "src/provider-router.ts",
        source: "export function routeWebProvider() { return true; }",
      },
    ]);

    const result = evaluateRetrievalRequest({
      method: "graph_search",
      query: "routeWebProvider",
      scope: "project-a",
      actorAuthorized: true,
      candidates,
      maxResults: 1,
    }, { graphKnowledgeService });

    expect(result).toMatchObject({
      contractVersion: MEMORY_RETRIEVAL_POLICY_VERSION,
      status: "allowed",
      reason: "graph_search_policy_applied_advisory_only",
      rawMemoryReleased: false,
    });
    expect(result.selected).toHaveLength(1);
    expect(result.selected[0]).toMatchObject({
      id: expect.stringContaining("graph:function:"),
      scope: "project-a",
      summary: expect.stringContaining("routeWebProvider"),
      lifecycleState: "semantic",
    });
    expect(result.selected[0].content).toContain("advisory evidence only");
    expect(result.excluded).toEqual([
      { id: "mem-2", reason: "out_of_scope" },
      { id: "mem-3", reason: "privacy_filtered" },
    ]);
  });
});

// EAFR-R5 adversarial proof: retrieval evidence semantics and admission boundary.
// A lexical match is relevance selection only; auditTrust is bounded ranking
// metadata only. Neither is authority, permission, truth, or hostility proof.

const ORDINARY_METHODS = ["keyword", "semantic", "recency", "audit_trust"] as const;

function candidateWithTrust(trust: unknown): MemoryRetrievalCandidate {
  return {
    id: "trust-candidate",
    scope: "project-a",
    summary: "qwen routing evidence",
    createdAt: 500,
    // Type assertion exercises malformed runtime values the public type excludes.
    auditTrust: trust as number,
    lifecycleState: "semantic",
  };
}

const INVALID_TRUST_VECTORS: readonly { label: string; value: unknown }[] = [
  { label: "omitted at runtime", value: undefined },
  { label: "null", value: null },
  { label: "string", value: "0.9" },
  { label: "NaN", value: Number.NaN },
  { label: "positive infinity", value: Number.POSITIVE_INFINITY },
  { label: "negative infinity", value: Number.NEGATIVE_INFINITY },
  { label: "below zero", value: -0.01 },
  { label: "above one", value: 1.01 },
];

const VALID_TRUST_BOUNDARIES: readonly { label: string; value: number }[] = [
  { label: "zero", value: 0 },
  { label: "one", value: 1 },
];

describe("EAFR-R5 admitted evidence trust validity", () => {
  for (const method of ORDINARY_METHODS) {
    for (const vector of INVALID_TRUST_VECTORS) {
      it(`excludes ${vector.label} trust with invalid_audit_trust for ${method}`, () => {
        const result = evaluateRetrievalRequest({
          method,
          query: "qwen",
          scope: "project-a",
          actorAuthorized: true,
          candidates: [candidateWithTrust(vector.value)],
        });

        expect(result.status).toBe("allowed");
        expect(result.selected).toHaveLength(0);
        expect(result.excluded).toContainEqual({
          id: "trust-candidate",
          reason: "invalid_audit_trust",
        });
        expect(result.rawMemoryReleased).toBe(false);
      });
    }

    for (const boundary of VALID_TRUST_BOUNDARIES) {
      it(`admits closed-interval boundary trust ${boundary.label} for ${method}`, () => {
        const result = evaluateRetrievalRequest({
          method,
          query: "qwen",
          scope: "project-a",
          actorAuthorized: true,
          candidates: [candidateWithTrust(boundary.value)],
        });

        expect(result.selected.map((item) => item.id)).toEqual(["trust-candidate"]);
        expect(result.excluded).toEqual([]);
        expect(result.rawMemoryReleased).toBe(false);
      });
    }
  }

  it("keeps invalid trust out of audit_trust ordering entirely", () => {
    const result = evaluateRetrievalRequest({
      method: "audit_trust",
      query: "",
      scope: "project-a",
      actorAuthorized: true,
      candidates: [
        {
          id: "hostile",
          scope: "project-a",
          summary: "hostile",
          createdAt: 900,
          auditTrust: Number.POSITIVE_INFINITY,
          lifecycleState: "semantic",
        },
        {
          id: "ranked-high",
          scope: "project-a",
          summary: "ranked high",
          createdAt: 100,
          auditTrust: 0.9,
          lifecycleState: "semantic",
        },
        {
          id: "ranked-low",
          scope: "project-a",
          summary: "ranked low",
          createdAt: 200,
          auditTrust: 0.2,
          lifecycleState: "semantic",
        },
      ],
    });

    expect(result.selected.map((item) => item.id)).toEqual(["ranked-high", "ranked-low"]);
    expect(result.excluded).toContainEqual({ id: "hostile", reason: "invalid_audit_trust" });
  });

  it("orders valid audit_trust descending by trust then createdAt", () => {
    const result = evaluateRetrievalRequest({
      method: "audit_trust",
      query: "",
      scope: "project-a",
      actorAuthorized: true,
      candidates: [
        {
          id: "tie-older",
          scope: "project-a",
          summary: "tie older",
          createdAt: 100,
          auditTrust: 0.5,
          lifecycleState: "semantic",
        },
        {
          id: "tie-newer",
          scope: "project-a",
          summary: "tie newer",
          createdAt: 300,
          auditTrust: 0.5,
          lifecycleState: "semantic",
        },
        {
          id: "top",
          scope: "project-a",
          summary: "top",
          createdAt: 1,
          auditTrust: 1,
          lifecycleState: "semantic",
        },
      ],
    });

    expect(result.selected.map((item) => item.id)).toEqual(["top", "tie-newer", "tie-older"]);
  });
});

describe("EAFR-R5 lexical relevance semantics", () => {
  const lexicalCandidates: MemoryRetrievalCandidate[] = [
    {
      id: "summary-hit",
      scope: "project-a",
      summary: "Qwen Provider Routing",
      createdAt: 400,
      auditTrust: 0.8,
      lifecycleState: "semantic",
    },
    {
      id: "content-hit",
      scope: "project-a",
      summary: "unrelated heading",
      content: "deterministic ROUTING detail",
      createdAt: 300,
      auditTrust: 0.8,
      lifecycleState: "semantic",
    },
    {
      id: "no-hit",
      scope: "project-a",
      summary: "unrelated",
      createdAt: 200,
      auditTrust: 0.8,
      lifecycleState: "semantic",
    },
  ];

  it("matches case-insensitively on summary", () => {
    const result = evaluateRetrievalRequest({
      method: "keyword",
      query: "qWeN",
      scope: "project-a",
      actorAuthorized: true,
      candidates: lexicalCandidates,
    });
    expect(result.selected.map((item) => item.id)).toEqual(["summary-hit"]);
  });

  it("matches case-insensitively on content only", () => {
    const result = evaluateRetrievalRequest({
      method: "semantic",
      query: "deterministic routing",
      scope: "project-a",
      actorAuthorized: true,
      candidates: lexicalCandidates,
    });
    expect(result.selected.map((item) => item.id)).toEqual(["content-hit"]);
  });

  it("requires a contiguous substring rather than scattered tokens", () => {
    const result = evaluateRetrievalRequest({
      method: "keyword",
      query: "qwen routing detail",
      scope: "project-a",
      actorAuthorized: true,
      candidates: lexicalCandidates,
    });
    expect(result.selected).toHaveLength(0);
    expect(result.excluded.map((item) => item.reason)).toEqual([
      "low_relevance",
      "low_relevance",
      "low_relevance",
    ]);
  });

  it("treats a trimmed-empty query as matching every otherwise eligible candidate", () => {
    const result = evaluateRetrievalRequest({
      method: "keyword",
      query: "   ",
      scope: "project-a",
      actorAuthorized: true,
      candidates: lexicalCandidates,
    });
    expect(result.selected).toHaveLength(3);
    expect(result.excluded).toEqual([]);
  });
});

describe("EAFR-R5 lexical hit cannot bypass admission gates", () => {
  const perfectMatch = (
    overrides: Partial<MemoryRetrievalCandidate>,
  ): MemoryRetrievalCandidate => ({
    id: "perfect",
    scope: "project-a",
    summary: "qwen",
    createdAt: 100,
    auditTrust: 1,
    lifecycleState: "semantic",
    ...overrides,
  });

  it("cannot bypass actor denial", () => {
    const result = evaluateRetrievalRequest({
      method: "keyword",
      query: "qwen",
      scope: "project-a",
      actorAuthorized: false,
      candidates: [perfectMatch({})],
    });
    expect(result.status).toBe("denied");
    expect(result.reason).toBe("actor_not_authorized_for_memory_retrieval");
    expect(result.selected).toEqual([]);
    expect(result.excluded).toEqual([{ id: "perfect", reason: "policy_denied" }]);
    expect(result.rawMemoryReleased).toBe(false);
  });

  const gateVectors: readonly {
    label: string;
    overrides: Partial<MemoryRetrievalCandidate>;
    reason: string;
  }[] = [
    { label: "scope mismatch", overrides: { scope: "project-b" }, reason: "out_of_scope" },
    { label: "secret bearing", overrides: { containsSecret: true }, reason: "privacy_filtered" },
    { label: "expired lifecycle", overrides: { lifecycleState: "expired" }, reason: "expired" },
    { label: "disputed lifecycle", overrides: { lifecycleState: "disputed" }, reason: "disputed" },
    { label: "invalid trust", overrides: { auditTrust: Number.NaN }, reason: "invalid_audit_trust" },
  ];

  for (const vector of gateVectors) {
    it(`cannot bypass the ${vector.label} gate`, () => {
      const result = evaluateRetrievalRequest({
        method: "keyword",
        query: "qwen",
        scope: "project-a",
        actorAuthorized: true,
        candidates: [perfectMatch(vector.overrides)],
      });
      expect(result.selected).toHaveLength(0);
      expect(result.excluded).toEqual([{ id: "perfect", reason: vector.reason }]);
      expect(result.rawMemoryReleased).toBe(false);
    });
  }
});

describe("EAFR-R5 graph-derived evidence trust admission", () => {
  it("excludes a local KGR node whose numeric confidence is out of range", () => {
    const invalidNode = {
      id: "kgr-invalid",
      kind: "concept",
      name: "providerRouting",
      sourcePath: "docs/draft.md",
      description: "out-of-range confidence",
      confidence: 1.5,
      governanceTag: "CVF_COMPLIANT",
      createdAt: new Date(0).toISOString(),
    };

    const result = evaluateRetrievalRequest(
      {
        method: "graph_search",
        query: "providerRouting",
        scope: "project-a",
        actorAuthorized: true,
        candidates: [],
      },
      // Type assertion exercises a malformed runtime store the public type excludes.
      { kgrStore: { nodes: [invalidNode], edges: [] } as never },
    );

    expect(result.status).toBe("allowed");
    expect(result.reason).toBe("kgr_graph_search_policy_applied_local_only");
    expect(result.selected).toHaveLength(0);
    expect(result.excluded).toContainEqual({
      id: "kgr-invalid",
      reason: "invalid_audit_trust",
    });
    expect(result.rawMemoryReleased).toBe(false);
  });

  it("keeps injected graph enum confidence mapped to a valid bounded trust value", () => {
    const graphKnowledgeService = createInMemoryGraphKnowledgeService([
      {
        filePath: "src/provider-router.ts",
        source: "export function routeWebProvider() { return true; }",
      },
    ]);

    const result = evaluateRetrievalRequest(
      {
        method: "graph_search",
        query: "routeWebProvider",
        scope: "project-a",
        actorAuthorized: true,
        candidates: [],
        maxResults: 1,
      },
      { graphKnowledgeService },
    );

    expect(result.selected).toHaveLength(1);
    const trust = result.selected[0].auditTrust;
    expect(Number.isFinite(trust)).toBe(true);
    expect(trust).toBeGreaterThanOrEqual(0);
    expect(trust).toBeLessThanOrEqual(1);
    expect(result.excluded).not.toContainEqual(
      expect.objectContaining({ reason: "invalid_audit_trust" }),
    );
    expect(result.rawMemoryReleased).toBe(false);
  });
});
