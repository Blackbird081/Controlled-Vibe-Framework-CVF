import { describe, it, expect, beforeEach } from "vitest";
import { Retriever } from "../src/retriever";
import { DocumentStore, resetDocCounter } from "../src/document.store";
import { RAGDocument } from "../src/types";

describe("Retriever", () => {
  let store: DocumentStore;
  let retriever: Retriever;

  beforeEach(() => {
    store = new DocumentStore();
    retriever = new Retriever();
    resetDocCounter();

    store.add({
      title: "CVF Core Doctrine",
      content: "The Controlled Vibe Framework establishes governance principles for AI agent behavior.",
      tier: "T1_DOCTRINE",
      documentType: "doctrine",
      domain: "general",
      tags: ["core", "governance"],
      metadata: {},
    });
    store.add({
      title: "Financial Governance Policy",
      content: "All financial transactions above $5000 require human approval. Daily spending limits apply.",
      tier: "T2_POLICY",
      documentType: "policy",
      domain: "finance",
      tags: ["finance", "spending", "approval"],
      metadata: {},
    });
    store.add({
      title: "Privacy Data Protection Policy",
      content: "Personal data including email and phone must be anonymized before external transfer.",
      tier: "T2_POLICY",
      documentType: "policy",
      domain: "privacy",
      tags: ["privacy", "data", "anonymization"],
      metadata: {},
    });
    store.add({
      title: "Finance Transaction Guard Rule",
      content: "Block transactions to blocked recipients. Require invoice for payments over threshold.",
      tier: "T3_OPERATIONAL",
      documentType: "guard_rule",
      domain: "finance",
      tags: ["finance", "guard", "transaction"],
      metadata: {},
    });
    store.add({
      title: "Code Security Operational Guide",
      content: "Never execute rm -rf or drop table commands. Block eval and child_process patterns.",
      tier: "T3_OPERATIONAL",
      documentType: "guard_rule",
      domain: "code_security",
      tags: ["security", "commands", "patterns"],
      metadata: {},
    });
    store.add({
      title: "Recent Finance Activity Log",
      content: "Agent spent $3000 on vendor payments today. Approaching daily limit.",
      tier: "T4_CONTEXTUAL",
      documentType: "operational_log",
      domain: "finance",
      tags: ["finance", "log", "activity"],
      metadata: {},
    });
  });

  describe("basic retrieval", () => {
    it("retrieves documents matching query terms", () => {
      const results = retriever.retrieve(store, { query: "financial transactions approval" });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].score).toBeGreaterThan(0);
    });

    it("returns empty for unmatched query", () => {
      const results = retriever.retrieve(store, { query: "xyz123nonsense" });
      expect(results.length).toBe(0);
    });

    it("respects maxResults limit", () => {
      const results = retriever.retrieve(store, { query: "finance governance", maxResults: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe("tier filtering", () => {
    it("searches only specified tiers", () => {
      const results = retriever.retrieve(store, {
        query: "finance",
        tiers: ["T1_DOCTRINE"],
      });
      for (const doc of results) {
        expect(doc.tier).toBe("T1_DOCTRINE");
      }
    });

    it("boosts T1_DOCTRINE higher than T4_CONTEXTUAL", () => {
      store.add({
        title: "Doctrine Finance Reference",
        content: "Finance governance doctrine reference for all financial operations.",
        tier: "T1_DOCTRINE",
        documentType: "doctrine",
        domain: "finance",
        tags: ["finance", "doctrine"],
        metadata: {},
      });

      const results = retriever.retrieve(store, { query: "finance governance" });
      const t1Docs = results.filter((d) => d.tier === "T1_DOCTRINE");
      const t4Docs = results.filter((d) => d.tier === "T4_CONTEXTUAL");

      if (t1Docs.length > 0 && t4Docs.length > 0) {
        expect(t1Docs[0].score!).toBeGreaterThanOrEqual(t4Docs[0].score!);
      }
    });
  });

  describe("domain filtering", () => {
    it("prefers documents from specified domain", () => {
      const results = retriever.retrieve(store, {
        query: "governance policy",
        domain: "finance",
      });
      const financeDocs = results.filter((d) => d.domain === "finance");
      expect(financeDocs.length).toBeGreaterThan(0);
    });
  });

  describe("tag filtering", () => {
    it("boosts documents with matching tags", () => {
      const results = retriever.retrieve(store, {
        query: "policy governance",
        tags: ["finance"],
      });
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("scoring", () => {
    it("scores are between 0 and 1", () => {
      const results = retriever.retrieve(store, { query: "finance governance policy" });
      for (const doc of results) {
        expect(doc.score).toBeGreaterThanOrEqual(0);
        expect(doc.score).toBeLessThanOrEqual(1.0);
      }
    });

    it("returns results sorted by score descending", () => {
      const results = retriever.retrieve(store, { query: "finance transactions" });
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score!).toBeGreaterThanOrEqual(results[i].score!);
      }
    });
  });

  describe("total candidates", () => {
    it("counts all candidates in queried tiers", () => {
      const total = retriever.getTotalCandidates(store, { query: "test" });
      expect(total).toBe(6);
    });

    it("counts only specified tier candidates", () => {
      const total = retriever.getTotalCandidates(store, {
        query: "test",
        tiers: ["T2_POLICY"],
      });
      expect(total).toBe(2);
    });
  });
});
