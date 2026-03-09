import { describe, it, expect, beforeEach } from "vitest";
import { DocumentStore, resetDocCounter } from "../src/document.store";
import { RAGDocument } from "../src/types";

describe("DocumentStore", () => {
  let store: DocumentStore;

  beforeEach(() => {
    store = new DocumentStore();
    resetDocCounter();
  });

  function makeDoc(overrides: Partial<RAGDocument> = {}): Omit<RAGDocument, "id"> {
    return {
      title: "Test Document",
      content: "This is a test document about finance governance policies.",
      tier: "T2_POLICY",
      documentType: "policy",
      domain: "finance",
      tags: ["finance", "governance"],
      metadata: {},
      ...overrides,
    };
  }

  describe("CRUD", () => {
    it("adds a document with auto-generated ID", () => {
      const doc = store.add(makeDoc());
      expect(doc.id).toMatch(/^DOC-/);
      expect(store.count()).toBe(1);
    });

    it("adds a document with custom ID", () => {
      const doc = store.add({ ...makeDoc(), id: "CUSTOM-001" });
      expect(doc.id).toBe("CUSTOM-001");
    });

    it("retrieves document by ID", () => {
      const added = store.add(makeDoc({ title: "Unique Title" }));
      const retrieved = store.get(added.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.title).toBe("Unique Title");
    });

    it("removes document", () => {
      const added = store.add(makeDoc());
      expect(store.remove(added.id)).toBe(true);
      expect(store.get(added.id)).toBeUndefined();
      expect(store.count()).toBe(0);
    });

    it("returns false for removing nonexistent doc", () => {
      expect(store.remove("nonexistent")).toBe(false);
    });

    it("adds batch of documents", () => {
      const docs = store.addBatch([makeDoc(), makeDoc(), makeDoc()]);
      expect(docs.length).toBe(3);
      expect(store.count()).toBe(3);
    });
  });

  describe("queries", () => {
    beforeEach(() => {
      store.add(makeDoc({ tier: "T1_DOCTRINE", documentType: "doctrine", domain: "general", tags: ["core"] }));
      store.add(makeDoc({ tier: "T2_POLICY", domain: "finance", tags: ["finance"] }));
      store.add(makeDoc({ tier: "T2_POLICY", domain: "privacy", tags: ["privacy"] }));
      store.add(makeDoc({ tier: "T3_OPERATIONAL", domain: "finance", tags: ["ops", "finance"] }));
      store.add(makeDoc({ tier: "T4_CONTEXTUAL", domain: "code_security", tags: ["security"] }));
    });

    it("finds documents by tier", () => {
      expect(store.findByTier("T2_POLICY").length).toBe(2);
      expect(store.findByTier("T1_DOCTRINE").length).toBe(1);
    });

    it("finds documents by domain", () => {
      expect(store.findByDomain("finance").length).toBe(2);
      expect(store.findByDomain("privacy").length).toBe(1);
    });

    it("finds documents by type", () => {
      expect(store.findByType("doctrine").length).toBe(1);
      expect(store.findByType("policy").length).toBe(4);
    });

    it("finds documents by tags", () => {
      expect(store.findByTags(["finance"]).length).toBe(2);
      expect(store.findByTags(["security"]).length).toBe(1);
      expect(store.findByTags(["core", "security"]).length).toBe(2);
    });

    it("lists all documents", () => {
      expect(store.listAll().length).toBe(5);
    });
  });

  describe("clear", () => {
    it("removes all documents", () => {
      store.add(makeDoc());
      store.add(makeDoc());
      store.clear();
      expect(store.count()).toBe(0);
    });
  });
});
