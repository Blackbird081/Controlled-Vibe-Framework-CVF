import { describe, it, expect, beforeEach } from "vitest";
import { PolicyStore } from "../src/policy.store";
import { PolicyDocument, PolicyRule } from "../src/types";

describe("PolicyStore", () => {
  let store: PolicyStore;

  function makePolicy(overrides: Partial<PolicyDocument> = {}): PolicyDocument {
    const now = Date.now();
    return {
      id: "PD-TEST-001",
      name: "Test Policy",
      version: 1,
      status: "active",
      createdAt: now,
      updatedAt: now,
      sourceVibes: ["test vibe"],
      rules: [
        {
          id: "PR-TEST-001",
          intentDomain: "finance",
          actionTrigger: "PAYMENT",
          constraints: { max_value: 500 },
          enforcement: "HARD_BLOCK",
          description: "Test rule",
        },
      ],
      metadata: { author: "test", tags: ["finance"], scope: "global" },
      ...overrides,
    };
  }

  beforeEach(() => {
    store = new PolicyStore();
  });

  describe("CRUD", () => {
    it("adds and retrieves a policy", () => {
      const policy = makePolicy();
      store.add(policy);
      expect(store.get("PD-TEST-001")).toBeDefined();
      expect(store.get("PD-TEST-001")!.name).toBe("Test Policy");
    });

    it("lists all policies", () => {
      store.add(makePolicy({ id: "PD-1" }));
      store.add(makePolicy({ id: "PD-2" }));
      expect(store.list().length).toBe(2);
    });

    it("lists only active policies", () => {
      store.add(makePolicy({ id: "PD-1", status: "active" }));
      store.add(makePolicy({ id: "PD-2", status: "draft" }));
      store.add(makePolicy({ id: "PD-3", status: "deprecated" }));
      expect(store.listActive().length).toBe(1);
    });

    it("removes a policy", () => {
      store.add(makePolicy());
      expect(store.remove("PD-TEST-001")).toBe(true);
      expect(store.get("PD-TEST-001")).toBeUndefined();
    });

    it("returns false for removing nonexistent policy", () => {
      expect(store.remove("nonexistent")).toBe(false);
    });
  });

  describe("versioning", () => {
    it("updates policy and increments version", () => {
      store.add(makePolicy());
      const updated = store.update("PD-TEST-001", { name: "Updated Policy" });

      expect(updated).toBeDefined();
      expect(updated!.name).toBe("Updated Policy");
      expect(updated!.version).toBe(2);
    });

    it("archives previous version on update", () => {
      store.add(makePolicy());
      store.update("PD-TEST-001", { name: "V2" });
      store.update("PD-TEST-001", { name: "V3" });

      const history = store.getHistory("PD-TEST-001");
      expect(history.length).toBe(2);
      expect(history[0].name).toBe("Test Policy");
      expect(history[1].name).toBe("V2");
    });

    it("returns undefined for updating nonexistent policy", () => {
      expect(store.update("nonexistent", { name: "X" })).toBeUndefined();
    });
  });

  describe("conflict detection", () => {
    it("detects contradiction between HARD_BLOCK and LOG_ONLY on same trigger", () => {
      store.add(makePolicy({
        id: "PD-A",
        rules: [{
          id: "PR-A1", intentDomain: "finance", actionTrigger: "PAYMENT",
          constraints: { max_value: 500 }, enforcement: "HARD_BLOCK",
          description: "Block payments",
        }],
      }));
      store.add(makePolicy({
        id: "PD-B",
        rules: [{
          id: "PR-B1", intentDomain: "finance", actionTrigger: "PAYMENT",
          constraints: { max_value: 1000 }, enforcement: "LOG_ONLY",
          description: "Log payments",
        }],
      }));

      const conflicts = store.detectConflicts();
      expect(conflicts.length).toBeGreaterThanOrEqual(1);
      expect(conflicts[0].conflictType).toBe("contradiction");
    });

    it("detects overlap between rules with shared constraints", () => {
      store.add(makePolicy({
        id: "PD-A",
        rules: [{
          id: "PR-A1", intentDomain: "finance", actionTrigger: "PAYMENT",
          constraints: { max_value: 500, currency: "USD" },
          enforcement: "HARD_BLOCK", description: "Rule A",
        }],
      }));
      store.add(makePolicy({
        id: "PD-B",
        rules: [{
          id: "PR-B1", intentDomain: "finance", actionTrigger: "PAYMENT",
          constraints: { max_value: 1000 },
          enforcement: "HARD_BLOCK", description: "Rule B",
        }],
      }));

      const conflicts = store.detectConflicts();
      const overlap = conflicts.find((c) => c.conflictType === "overlap" || c.conflictType === "subsumption");
      expect(overlap).toBeDefined();
    });

    it("returns no conflicts for unrelated policies", () => {
      store.add(makePolicy({
        id: "PD-A",
        rules: [{
          id: "PR-A1", intentDomain: "finance", actionTrigger: "PAYMENT",
          constraints: { max_value: 500 }, enforcement: "HARD_BLOCK",
          description: "Finance rule",
        }],
      }));
      store.add(makePolicy({
        id: "PD-B",
        rules: [{
          id: "PR-B1", intentDomain: "privacy", actionTrigger: "EXPORT_DATA",
          constraints: { scope: "external" }, enforcement: "HARD_BLOCK",
          description: "Privacy rule",
        }],
      }));

      const conflicts = store.detectConflicts();
      expect(conflicts.length).toBe(0);
    });

    it("deduplicates conflicts", () => {
      store.add(makePolicy({
        id: "PD-A",
        rules: [{
          id: "PR-A1", intentDomain: "finance", actionTrigger: "PAYMENT",
          constraints: { max_value: 500 }, enforcement: "HARD_BLOCK",
          description: "Block",
        }],
      }));
      store.add(makePolicy({
        id: "PD-B",
        rules: [{
          id: "PR-B1", intentDomain: "finance", actionTrigger: "PAYMENT",
          constraints: { max_value: 1000 }, enforcement: "LOG_ONLY",
          description: "Log",
        }],
      }));

      const conflicts = store.detectConflicts();
      const keys = conflicts.map((c) => [c.ruleA.id, c.ruleB.id].sort().join("|"));
      const unique = new Set(keys);
      expect(unique.size).toBe(keys.length);
    });
  });

  describe("clear", () => {
    it("removes all policies and history", () => {
      store.add(makePolicy());
      store.update("PD-TEST-001", { name: "V2" });
      store.clear();

      expect(store.list().length).toBe(0);
      expect(store.getHistory("PD-TEST-001").length).toBe(0);
    });
  });
});
