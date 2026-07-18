import { describe, expect, it } from "vitest";
import { buildECOGovernedPackRequest } from "../src/dscp.eco.adapter";
import type { RAGDocument, RAGResult } from "../src/types";
import type { GovernanceContextEnvelope } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/dscp.governed.context.contract";

const baseDocument: RAGDocument = {
  id: "eco-doc-001",
  title: "ECO governance pattern",
  content: "Tiered retrieval evidence for governed context packing.",
  tier: "T2_POLICY",
  documentType: "policy",
  domain: "eco",
  tags: ["dscp", "eco"],
  score: 0.84,
  metadata: { sourcePath: "eco/policy.md" },
};

const baseEnvelope: GovernanceContextEnvelope = {
  artifactDescriptors: [
    {
      artifactId: "eco-artifact-001",
      sourceHash: "sha256:eco",
      artifactRole: "reference",
      contentClass: "eco_rag_document",
      governanceGates: {
        freshnessGate: "PASS",
        classificationGate: "PASS",
        eligibilityGate: "YES",
      },
      metadata: { domain: "eco" },
    },
  ],
  classificationGate: "PASS",
  freshnessGate: "PASS",
  policyDecision: "ALLOW_CONTEXT_PACK",
  authorizationRef: "docs/baselines/CVF_GC018_DSCP_T7_ECO_MULTI_DOMAIN_PILOT_2026-06-08.md",
};

function buildResult(documents: RAGDocument[]): RAGResult {
  return {
    query: "governed retrieval adapter",
    documents,
    tiersSearched: ["T2_POLICY"],
    totalCandidates: documents.length,
    retrievalTimeMs: 12,
  };
}

describe("buildECOGovernedPackRequest", () => {
  it("maps non-empty RAGResult documents to knowledgeItems", () => {
    const request = buildECOGovernedPackRequest(buildResult([baseDocument]), baseEnvelope);

    expect(request.packRequest.knowledgeItems).toHaveLength(1);
    expect(request.packRequest.knowledgeItems?.[0]).toEqual({
      itemId: "eco-doc-001",
      title: "ECO governance pattern",
      content: "Tiered retrieval evidence for governed context packing.",
      relevanceScore: 0.84,
      source: "eco",
    });
  });

  it("maps empty RAGResult to an empty knowledgeItems array", () => {
    const request = buildECOGovernedPackRequest(buildResult([]), baseEnvelope);

    expect(request.packRequest.knowledgeItems).toEqual([]);
  });

  it("preserves RAGDocument id, content, and source fields", () => {
    const request = buildECOGovernedPackRequest(buildResult([baseDocument]), baseEnvelope);
    const item = request.packRequest.knowledgeItems?.[0];

    expect(item?.itemId).toBe(baseDocument.id);
    expect(item?.content).toBe(baseDocument.content);
    expect(item?.source).toBe(baseDocument.domain);
  });

  it("passes GovernanceContextEnvelope through unchanged", () => {
    const request = buildECOGovernedPackRequest(buildResult([baseDocument]), baseEnvelope);

    expect(request.governanceEnvelope).toBe(baseEnvelope);
  });

  it("maps RAGResult.query to packRequest query and contextId", () => {
    const request = buildECOGovernedPackRequest(buildResult([baseDocument]), baseEnvelope);

    expect(request.packRequest.query).toBe("governed retrieval adapter");
    expect(request.packRequest.contextId).toBe("governed retrieval adapter");
  });

  it("falls back to documentType when RAGDocument domain is absent", () => {
    const { domain: _domain, ...documentWithoutDomain } = baseDocument;
    const request = buildECOGovernedPackRequest(
      buildResult([documentWithoutDomain]),
      baseEnvelope,
    );

    expect(request.packRequest.knowledgeItems?.[0]?.source).toBe("policy");
  });
});
