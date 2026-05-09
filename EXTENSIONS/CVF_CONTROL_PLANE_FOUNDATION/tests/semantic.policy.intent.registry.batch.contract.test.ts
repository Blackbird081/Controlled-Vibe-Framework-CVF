import { describe, expect, it } from "vitest";

import { createSemanticPolicyIntentRegistryBatchContract } from "../src/index";

describe("SemanticPolicyIntentRegistryBatchContract", () => {
  it("aggregates validity, unknowns, mismatches, and duplicates across requests", () => {
    const contract = createSemanticPolicyIntentRegistryBatchContract({
      now: () => "2026-04-12T15:00:00.000Z",
    });

    const result = contract.batch([
      {
        requestId: "req-1",
        request: {
          items: ["EXPLICIT_APPROVAL_REQUIRED", "REQUIRE_CLARIFICATION"],
        },
      },
      {
        requestId: "req-2",
        request: {
          items: [
            {
              semanticItem: "NO_UNRELATED_CHANGES",
              declaredClass: "guard_alias",
            },
            "UNKNOWN_RULE",
            "UNKNOWN_RULE",
          ],
        },
      },
    ]);

    expect(result.createdAt).toBe("2026-04-12T15:00:00.000Z");
    expect(result.totalRequests).toBe(2);
    expect(result.validCount).toBe(1);
    expect(result.invalidCount).toBe(1);
    expect(result.unknownItemCount).toBe(1);
    expect(result.mismatchCount).toBe(1);
    expect(result.duplicateItemCount).toBe(1);
    expect(result.batchId).toHaveLength(32);
    expect(result.batchHash).toHaveLength(32);
  });
});
