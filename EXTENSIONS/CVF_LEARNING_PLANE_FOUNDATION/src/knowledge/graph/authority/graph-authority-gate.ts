import type { GraphConfidence, GraphQueryResult } from "../schema/graph-schema";

export const GRAPH_AUTHORITY_GATE_VERSION =
  "cvf.graphAuthorityGate.v1";

export type GraphAuthorityPolicyDecision =
  | "ALLOW"
  | "BLOCK"
  | "CLARIFY"
  | "NEEDS_APPROVAL";

export type GraphAuthorityDecision =
  | "allow_context"
  | "require_review"
  | "deny_context";

export interface GraphAuthorityThresholds {
  minimumConfidenceScore?: number;
  maximumTokenBudgetEstimate?: number;
  maximumAffectedFiles?: number;
}

export interface GraphAuthorityGateInput {
  policyDecision: GraphAuthorityPolicyDecision;
  graphResult: GraphQueryResult;
  thresholds?: GraphAuthorityThresholds;
  purpose?: string;
}

export interface GraphAuthorityReceipt {
  receiptId: string;
  contractVersion: typeof GRAPH_AUTHORITY_GATE_VERSION;
  decision: GraphAuthorityDecision;
  authorityModel: "advisory_graph_context_only";
  policyDominant: true;
  canBypassPolicy: false;
  policyDecision: GraphAuthorityPolicyDecision;
  graphScore: number;
  thresholds: Required<GraphAuthorityThresholds>;
  queryId: string;
  affectedFiles: readonly string[];
  evidenceWarnings: readonly string[];
  reason: string;
}

export interface GraphAuthorityGateResult {
  decision: GraphAuthorityDecision;
  allowGraphContext: boolean;
  requiresHumanReview: boolean;
  receipt: GraphAuthorityReceipt;
}

const DEFAULT_THRESHOLDS: Required<GraphAuthorityThresholds> = {
  minimumConfidenceScore: 0.7,
  maximumTokenBudgetEstimate: 2500,
  maximumAffectedFiles: 12,
};

function scoreConfidence(confidence: GraphConfidence): number {
  if (confidence === "high") return 1;
  if (confidence === "medium") return 0.75;
  return 0.45;
}

function normalizeThresholds(
  thresholds: GraphAuthorityThresholds | undefined,
): Required<GraphAuthorityThresholds> {
  return {
    ...DEFAULT_THRESHOLDS,
    ...(thresholds ?? {}),
  };
}

function buildReceiptId(input: GraphAuthorityGateInput, decision: GraphAuthorityDecision): string {
  const raw = [
    "graph-authority",
    input.graphResult.queryId,
    input.policyDecision,
    decision,
    input.graphResult.affectedFiles.length,
    input.graphResult.tokenBudgetEstimate,
  ].join(":");
  return raw.replace(/[^A-Za-z0-9_.:/-]+/g, "_");
}

export function evaluateGraphAuthorityGate(
  input: GraphAuthorityGateInput,
): GraphAuthorityGateResult {
  const thresholds = normalizeThresholds(input.thresholds);
  const graphScore = scoreConfidence(input.graphResult.confidenceSummary);
  const warnings = [
    ...input.graphResult.warnings,
    "graph_authority_is_advisory_context_only",
    "graph_authority_cannot_bypass_policy",
  ];

  let decision: GraphAuthorityDecision = "allow_context";
  let reason = "graph_context_within_authority_thresholds";

  if (input.policyDecision !== "ALLOW") {
    decision = "deny_context";
    reason = "policy_decision_dominates_graph_authority";
  } else if (graphScore < thresholds.minimumConfidenceScore) {
    decision = "require_review";
    reason = "graph_confidence_below_authority_threshold";
  } else if (input.graphResult.tokenBudgetEstimate > thresholds.maximumTokenBudgetEstimate) {
    decision = "require_review";
    reason = "graph_context_exceeds_token_budget_threshold";
  } else if (input.graphResult.affectedFiles.length > thresholds.maximumAffectedFiles) {
    decision = "require_review";
    reason = "graph_context_exceeds_blast_radius_threshold";
  }

  return {
    decision,
    allowGraphContext: decision === "allow_context",
    requiresHumanReview: decision === "require_review",
    receipt: {
      receiptId: buildReceiptId(input, decision),
      contractVersion: GRAPH_AUTHORITY_GATE_VERSION,
      decision,
      authorityModel: "advisory_graph_context_only",
      policyDominant: true,
      canBypassPolicy: false,
      policyDecision: input.policyDecision,
      graphScore,
      thresholds,
      queryId: input.graphResult.queryId,
      affectedFiles: input.graphResult.affectedFiles,
      evidenceWarnings: warnings,
      reason,
    },
  };
}
