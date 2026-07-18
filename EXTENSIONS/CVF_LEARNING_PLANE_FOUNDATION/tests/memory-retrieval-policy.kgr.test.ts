import { describe, expect, it } from "vitest";
import {
  evaluateRetrievalRequest,
  kgrNodeToMemoryCandidate,
} from "../src/memory-retrieval-policy";
import {
  buildKgrStore,
  createKgrNode,
} from "../src/knowledge-graph-store";

const compliant = createKgrNode({
  kind: "concept",
  name: "providerRouting",
  sourcePath: "docs/CVF_ARCHITECTURE_DECISIONS.md",
  description: "Deterministic provider routing",
  confidence: 0.95,
  governanceTag: "CVF_COMPLIANT",
});

const helper = createKgrNode({
  kind: "skill",
  name: "providerRoutingHelper",
  sourcePath: "skills/provider-routing.ts",
  confidence: 0.85,
  governanceTag: "CVF_COMPLIANT",
});

const disputed = createKgrNode({
  kind: "policy",
  name: "providerRoutingDraft",
  sourcePath: "docs/draft.md",
  confidence: 0.99,
  governanceTag: "PENDING_REVIEW",
});

const store = buildKgrStore([helper, disputed, compliant], []);

describe("KGR memory retrieval integration", () => {
  it("maps KGR nodes to advisory memory candidates without raw release", () => {
    expect(kgrNodeToMemoryCandidate(compliant, "project")).toMatchObject({
      id: compliant.id,
      scope: "project",
      auditTrust: 0.95,
      lifecycleState: "semantic",
    });
  });

  it("queries an injected KgrStore and ranks exact compliant matches first", () => {
    const result = evaluateRetrievalRequest(
      {
        method: "graph_search",
        query: "providerRouting",
        scope: "project",
        actorAuthorized: true,
        candidates: [],
      },
      { kgrStore: store },
    );

    expect(result).toMatchObject({
      status: "allowed",
      reason: "kgr_graph_search_policy_applied_local_only",
      rawMemoryReleased: false,
    });
    expect(result.selected.map((candidate) => candidate.id)).toEqual([
      compliant.id,
      helper.id,
    ]);
    expect(result.excluded).toContainEqual({
      id: disputed.id,
      reason: "disputed",
    });
  });

  it("denies unauthorized graph search before reading the KgrStore", () => {
    const result = evaluateRetrievalRequest(
      {
        method: "graph_search",
        query: "providerRouting",
        scope: "project",
        actorAuthorized: false,
        candidates: [],
      },
      { kgrStore: store },
    );

    expect(result).toMatchObject({
      status: "denied",
      reason: "actor_not_authorized_for_memory_retrieval",
      selected: [],
    });
  });

  it("[G-GM-08 Compliance Guard] excludes non-compliant nodes as disputed", () => {
    // disputed node has governanceTag: "PENDING_REVIEW" → lifecycleState: "disputed" → excluded
    const result = evaluateRetrievalRequest(
      {
        method: "graph_search",
        query: "providerRoutingDraft",
        scope: "project",
        actorAuthorized: true,
        candidates: [],
      },
      { kgrStore: store },
    );
    expect(result.excluded).toContainEqual({ id: disputed.id, reason: "disputed" });
    expect(result.selected.map((c) => c.id)).not.toContain(disputed.id);
    expect(result.rawMemoryReleased).toBe(false);
  });

  it("[G-GM-06 Confidentiality Guard] excludes secret-bearing candidates from retrieval", () => {
    const secretCandidate = {
      id: "secret-node",
      scope: "project",
      summary: "secret summary",
      createdAt: 0,
      auditTrust: 0.8,
      lifecycleState: "semantic" as const,
      containsSecret: true,
    };
    const result = evaluateRetrievalRequest({
      method: "keyword",
      query: "",
      scope: "project",
      actorAuthorized: true,
      candidates: [secretCandidate],
    });
    expect(result.excluded).toContainEqual({ id: "secret-node", reason: "privacy_filtered" });
    expect(result.selected.map((c) => c.id)).not.toContain("secret-node");
    expect(result.rawMemoryReleased).toBe(false);
  });
});
