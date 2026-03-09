import { describe, it, expect } from "vitest";
import { PolicySerializer } from "../src/policy.serializer";
import { PolicyDocument } from "../src/types";

describe("PolicySerializer", () => {
  const serializer = new PolicySerializer();

  function makePolicy(): PolicyDocument {
    return {
      id: "PD-SER-001",
      name: "Serializer Test",
      version: 1,
      status: "active",
      createdAt: 1710000000000,
      updatedAt: 1710000000000,
      sourceVibes: ["Never spend more than $500"],
      rules: [
        {
          id: "PR-SER-001",
          intentDomain: "finance",
          actionTrigger: "WITHDRAW_FUNDS",
          constraints: { max_value: 500, currency: "USD" },
          enforcement: "HARD_BLOCK",
          description: "Block withdrawals over $500",
        },
        {
          id: "PR-SER-002",
          intentDomain: "privacy",
          actionTrigger: "EXPORT_DATA",
          constraints: { scope: "external" },
          enforcement: "HUMAN_IN_THE_LOOP",
          description: "Require approval for data export",
        },
      ],
      metadata: {
        author: "test",
        templateId: "financial_governance",
        tags: ["finance", "privacy"],
        scope: "global",
      },
    };
  }

  describe("serialize", () => {
    it("produces valid SerializedPolicy structure", () => {
      const result = serializer.serialize(makePolicy());

      expect(result.schema).toBe("cvf-policy-v1");
      expect(result.version).toBe(1);
      expect(result.governance_rules).toHaveLength(2);
      expect(result.metadata).toBeDefined();
    });

    it("converts rule fields to snake_case", () => {
      const result = serializer.serialize(makePolicy());
      const rule = result.governance_rules[0];

      expect(rule).toHaveProperty("intent_domain", "finance");
      expect(rule).toHaveProperty("action_trigger", "WITHDRAW_FUNDS");
      expect(rule).toHaveProperty("enforcement", "HARD_BLOCK");
      expect(rule).toHaveProperty("constraints");
    });

    it("includes metadata fields", () => {
      const result = serializer.serialize(makePolicy());
      const meta = result.metadata as Record<string, unknown>;

      expect(meta).toHaveProperty("id", "PD-SER-001");
      expect(meta).toHaveProperty("name", "Serializer Test");
      expect(meta).toHaveProperty("author", "test");
      expect(meta).toHaveProperty("template_id", "financial_governance");
      expect(meta).toHaveProperty("tags");
      expect(meta).toHaveProperty("scope", "global");
    });
  });

  describe("serializeToJSON", () => {
    it("produces valid JSON string (pretty)", () => {
      const json = serializer.serializeToJSON(makePolicy());
      const parsed = JSON.parse(json);

      expect(parsed.schema).toBe("cvf-policy-v1");
      expect(parsed.governance_rules).toHaveLength(2);
    });

    it("produces compact JSON when pretty=false", () => {
      const json = serializer.serializeToJSON(makePolicy(), false);
      expect(json).not.toContain("\n");
    });
  });

  describe("deserialize", () => {
    it("round-trips through serialize/deserialize", () => {
      const original = makePolicy();
      const serialized = serializer.serialize(original);
      const restored = serializer.deserialize(serialized);

      expect(restored.id).toBe(original.id);
      expect(restored.name).toBe(original.name);
      expect(restored.version).toBe(original.version);
      expect(restored.rules).toHaveLength(2);
      expect(restored.rules[0].intentDomain).toBe("finance");
      expect(restored.rules[0].actionTrigger).toBe("WITHDRAW_FUNDS");
    });

    it("throws for unsupported schema version", () => {
      expect(() =>
        serializer.deserialize({
          schema: "unknown-v99",
          version: 1,
          governance_rules: [],
          metadata: {},
        })
      ).toThrow("Unsupported schema");
    });
  });

  describe("deserializeFromJSON", () => {
    it("round-trips through JSON string", () => {
      const original = makePolicy();
      const json = serializer.serializeToJSON(original);
      const restored = serializer.deserializeFromJSON(json);

      expect(restored.id).toBe(original.id);
      expect(restored.rules).toHaveLength(2);
    });
  });
});
