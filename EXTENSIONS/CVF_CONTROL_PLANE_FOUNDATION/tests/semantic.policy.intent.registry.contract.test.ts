import { describe, expect, it } from "vitest";

import { createSemanticPolicyIntentRegistryContract } from "../src/index";

describe("SemanticPolicyIntentRegistryContract", () => {
  it("classifies canonical semantic items by their CVF-native class", () => {
    const contract = createSemanticPolicyIntentRegistryContract();
    const result = contract.classify({
      items: [
        "explicit approval required",
        "require clarification",
        "complete output required",
        "input validation required",
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.classifiedItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          semanticItem: "EXPLICIT_APPROVAL_REQUIRED",
          semanticClass: "guard_alias",
        }),
        expect.objectContaining({
          semanticItem: "REQUIRE_CLARIFICATION",
          semanticClass: "policy_intent",
        }),
        expect.objectContaining({
          semanticItem: "COMPLETE_OUTPUT_REQUIRED",
          semanticClass: "output_contract",
        }),
        expect.objectContaining({
          semanticItem: "INPUT_VALIDATION_REQUIRED",
          semanticClass: "eval_signal",
        }),
      ]),
    );
  });

  it("reports class mismatches when declaredClass conflicts with canon", () => {
    const contract = createSemanticPolicyIntentRegistryContract();
    const result = contract.classify({
      items: [
        {
          semanticItem: "NO_UNRELATED_CHANGES",
          declaredClass: "guard_alias",
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.classMismatches).toEqual([
      {
        semanticItem: "NO_UNRELATED_CHANGES",
        declaredClass: "guard_alias",
        canonicalClass: "output_contract",
      },
    ]);
  });

  it("reports unknown semantic items without polluting the classified set", () => {
    const contract = createSemanticPolicyIntentRegistryContract();
    const result = contract.classify({
      items: ["UNKNOWN_RULE", "SECURITY_FIRST_POLICY"],
    });

    expect(result.valid).toBe(false);
    expect(result.unknownItems).toEqual(["UNKNOWN_RULE"]);
    expect(result.classifiedItems).toEqual([
      expect.objectContaining({
        semanticItem: "SECURITY_FIRST_POLICY",
        semanticClass: "policy_intent",
      }),
    ]);
  });

  it("collapses duplicates after normalization and records them separately", () => {
    const contract = createSemanticPolicyIntentRegistryContract();
    const result = contract.classify({
      items: [
        "workspace hygiene required",
        "WORKSPACE_HYGIENE_REQUIRED",
        " workspace   hygiene required ",
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.classifiedItems).toHaveLength(1);
    expect(result.duplicateItems).toEqual(["WORKSPACE_HYGIENE_REQUIRED"]);
  });

  it("ignores empty items after normalization", () => {
    const contract = createSemanticPolicyIntentRegistryContract();
    const result = contract.classify({
      items: ["   ", "xss prevention"],
    });

    expect(result.valid).toBe(true);
    expect(result.classifiedItems).toEqual([
      expect.objectContaining({
        semanticItem: "XSS_PREVENTION",
        semanticClass: "eval_signal",
      }),
    ]);
  });
});
