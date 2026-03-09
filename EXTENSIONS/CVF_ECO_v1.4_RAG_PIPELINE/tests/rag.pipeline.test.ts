import { describe, it, expect, beforeEach } from "vitest";
import { RAGPipeline } from "../src/rag.pipeline";
import { resetDocCounter } from "../src/document.store";

describe("RAGPipeline", () => {
  let pipeline: RAGPipeline;

  beforeEach(() => {
    pipeline = new RAGPipeline();
    resetDocCounter();

    const store = pipeline.getStore();
    store.add({
      title: "CVF Governance Doctrine",
      content: "AI agents must follow governance rules. All actions are auditable.",
      tier: "T1_DOCTRINE",
      documentType: "doctrine",
      domain: "general",
      tags: ["governance", "core"],
      metadata: {},
    });
    store.add({
      title: "Finance Spending Policy",
      content: "Maximum daily spending limit is $20000. Transactions over $5000 need approval.",
      tier: "T2_POLICY",
      documentType: "policy",
      domain: "finance",
      tags: ["finance", "spending"],
      metadata: {},
    });
    store.add({
      title: "Privacy Export Rules",
      content: "Data export requires anonymization. PII fields like email and phone are protected.",
      tier: "T2_POLICY",
      documentType: "policy",
      domain: "privacy",
      tags: ["privacy", "export"],
      metadata: {},
    });
    store.add({
      title: "Transaction Guard Configuration",
      content: "Block payments to sanctioned entities. Log all transactions above $1000.",
      tier: "T3_OPERATIONAL",
      documentType: "guard_rule",
      domain: "finance",
      tags: ["finance", "guard"],
      metadata: {},
    });
  });

  describe("query", () => {
    it("returns RAGResult with documents", () => {
      const result = pipeline.query({ query: "spending limits finance" });
      expect(result.documents.length).toBeGreaterThan(0);
      expect(result.query).toBe("spending limits finance");
      expect(result.retrievalTimeMs).toBeGreaterThanOrEqual(0);
    });

    it("includes tiers searched", () => {
      const result = pipeline.query({ query: "governance rules" });
      expect(result.tiersSearched.length).toBeGreaterThan(0);
    });

    it("reports total candidates", () => {
      const result = pipeline.query({ query: "finance" });
      expect(result.totalCandidates).toBe(4);
    });

    it("filters by domain", () => {
      const result = pipeline.query({ query: "policy rules", domain: "privacy" });
      const privacyDocs = result.documents.filter((d) => d.domain === "privacy");
      expect(privacyDocs.length).toBeGreaterThan(0);
    });

    it("respects maxResults", () => {
      const result = pipeline.query({ query: "finance governance", maxResults: 1 });
      expect(result.documents.length).toBeLessThanOrEqual(1);
    });

    it("filters by tier", () => {
      const result = pipeline.query({
        query: "governance",
        tiers: ["T1_DOCTRINE"],
      });
      for (const doc of result.documents) {
        expect(doc.tier).toBe("T1_DOCTRINE");
      }
    });
  });

  describe("querySimple", () => {
    it("provides simplified query interface", () => {
      const result = pipeline.querySimple("finance spending");
      expect(result.documents.length).toBeGreaterThan(0);
    });

    it("accepts domain parameter", () => {
      const result = pipeline.querySimple("export rules", "privacy");
      expect(result.documents.length).toBeGreaterThan(0);
    });

    it("accepts maxResults parameter", () => {
      const result = pipeline.querySimple("governance", undefined, 2);
      expect(result.documents.length).toBeLessThanOrEqual(2);
    });
  });

  describe("end-to-end", () => {
    it("retrieves relevant documents across tiers", () => {
      const result = pipeline.query({
        query: "finance transactions spending limit approval",
        domain: "finance",
      });

      expect(result.documents.length).toBeGreaterThan(0);
      const hasPolicyDoc = result.documents.some((d) => d.tier === "T2_POLICY");
      expect(hasPolicyDoc).toBe(true);
    });

    it("empty store returns no documents", () => {
      const emptyPipeline = new RAGPipeline();
      const result = emptyPipeline.query({ query: "anything" });
      expect(result.documents.length).toBe(0);
      expect(result.totalCandidates).toBe(0);
    });
  });
});
