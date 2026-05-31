import { describe, expect, it } from "vitest";

import {
  GRAPH_AUTHORITY_GATE_VERSION,
  evaluateGraphAuthorityGate,
} from "../src/knowledge/graph/authority/graph-authority-gate";
import type { GraphQueryResult } from "../src/knowledge/graph/schema/graph-schema";

function graphResult(overrides: Partial<GraphQueryResult> = {}): GraphQueryResult {
  return {
    queryId: "impact:routeWebProvider",
    queryType: "impact",
    inputScope: ["src/provider-router-adapter.ts"],
    resolvedNodes: [],
    resolvedEdges: [],
    affectedFiles: ["src/provider-router-adapter.ts", "src/route.ts"],
    confidenceSummary: "high",
    tokenBudgetEstimate: 900,
    warnings: ["graph_outputs_are_evidence_not_authority"],
    ...overrides,
  };
}

describe("graph authority gate", () => {
  it("allows bounded graph context only after governance policy already allows execution", () => {
    const result = evaluateGraphAuthorityGate({
      policyDecision: "ALLOW",
      graphResult: graphResult(),
      purpose: "bounded preview context",
    });

    expect(result.decision).toBe("allow_context");
    expect(result.allowGraphContext).toBe(true);
    expect(result.receipt).toMatchObject({
      contractVersion: GRAPH_AUTHORITY_GATE_VERSION,
      authorityModel: "advisory_graph_context_only",
      policyDominant: true,
      canBypassPolicy: false,
      policyDecision: "ALLOW",
      reason: "graph_context_within_authority_thresholds",
    });
  });

  it("denies graph context when governance policy blocks, even with high confidence graph evidence", () => {
    const result = evaluateGraphAuthorityGate({
      policyDecision: "BLOCK",
      graphResult: graphResult({ confidenceSummary: "high", tokenBudgetEstimate: 100 }),
    });

    expect(result.decision).toBe("deny_context");
    expect(result.allowGraphContext).toBe(false);
    expect(result.receipt.canBypassPolicy).toBe(false);
    expect(result.receipt.reason).toBe("policy_decision_dominates_graph_authority");
  });

  it("requires review when graph confidence is below threshold", () => {
    const result = evaluateGraphAuthorityGate({
      policyDecision: "ALLOW",
      graphResult: graphResult({ confidenceSummary: "low" }),
      thresholds: { minimumConfidenceScore: 0.7 },
    });

    expect(result.decision).toBe("require_review");
    expect(result.requiresHumanReview).toBe(true);
    expect(result.receipt.reason).toBe("graph_confidence_below_authority_threshold");
  });

  it("requires review when graph context exceeds token budget or blast radius thresholds", () => {
    const tokenBudget = evaluateGraphAuthorityGate({
      policyDecision: "ALLOW",
      graphResult: graphResult({ tokenBudgetEstimate: 2600 }),
    });
    const blastRadius = evaluateGraphAuthorityGate({
      policyDecision: "ALLOW",
      graphResult: graphResult({ affectedFiles: Array.from({ length: 13 }, (_, i) => `src/${i}.ts`) }),
    });

    expect(tokenBudget.receipt.reason).toBe("graph_context_exceeds_token_budget_threshold");
    expect(blastRadius.receipt.reason).toBe("graph_context_exceeds_blast_radius_threshold");
  });

  it("emits an auditable receipt with advisory-only warnings and affected files", () => {
    const result = evaluateGraphAuthorityGate({
      policyDecision: "ALLOW",
      graphResult: graphResult({ queryId: "impact:preview-harness" }),
    });

    expect(result.receipt.receiptId).toContain("graph-authority:impact:preview-harness");
    expect(result.receipt.affectedFiles).toEqual(["src/provider-router-adapter.ts", "src/route.ts"]);
    expect(result.receipt.evidenceWarnings).toEqual(expect.arrayContaining([
      "graph_outputs_are_evidence_not_authority",
      "graph_authority_is_advisory_context_only",
      "graph_authority_cannot_bypass_policy",
    ]));
  });
});
