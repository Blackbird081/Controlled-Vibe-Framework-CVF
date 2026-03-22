import type { DispatchResult, DispatchEntry } from "./dispatch.contract";
import type { GuardDecision } from "../../CVF_ECO_v2.5_MCP_SERVER/src/sdk";
import type { DesignTaskRisk } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/design.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type PolicyGateDecision = "allow" | "deny" | "review" | "sandbox" | "pending";

export interface PolicyGateEntry {
  assignmentId: string;
  taskId: string;
  guardDecision: GuardDecision;
  riskLevel: string;
  gateDecision: PolicyGateDecision;
  rationale: string;
}

export interface PolicyGateResult {
  gateId: string;
  dispatchId: string;
  evaluatedAt: string;
  entries: PolicyGateEntry[];
  allowedCount: number;
  deniedCount: number;
  reviewRequiredCount: number;
  sandboxedCount: number;
  pendingCount: number;
  gateHash: string;
  summary: string;
}

export interface PolicyGateContractDependencies {
  now?: () => string;
}

// --- Gate Decision Logic ---

function deriveGateDecision(
  guardDecision: GuardDecision,
  riskLevel: string,
): PolicyGateDecision {
  if (guardDecision === "BLOCK") return "deny";
  if (guardDecision === "ESCALATE") return "review";

  // guardDecision === "ALLOW" — apply risk-level policy
  if (riskLevel === "R3") return "sandbox";
  if (riskLevel === "R2") return "review";
  return "allow";
}

function buildRationale(
  guardDecision: GuardDecision,
  riskLevel: string,
  gateDecision: PolicyGateDecision,
): string {
  if (gateDecision === "deny") {
    return `Guard engine decision BLOCK — assignment denied at policy gate.`;
  }
  if (gateDecision === "sandbox") {
    return `Guard engine decision ALLOW but risk level ${riskLevel} — sandboxed execution required.`;
  }
  if (gateDecision === "review" && guardDecision === "ESCALATE") {
    return `Guard engine decision ESCALATE — human review required before execution.`;
  }
  if (gateDecision === "review" && riskLevel === "R2") {
    return `Guard engine decision ALLOW but risk level ${riskLevel} — peer review required before execution.`;
  }
  return `Guard engine decision ALLOW at risk level ${riskLevel} — cleared for execution.`;
}

// --- Contract ---

export class PolicyGateContract {
  private readonly now: () => string;

  constructor(dependencies: PolicyGateContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  evaluate(dispatchResult: DispatchResult): PolicyGateResult {
    const evaluatedAt = this.now();

    const entries: PolicyGateEntry[] = dispatchResult.entries.map((entry) => {
      // Extract riskLevel from pipelineResult context metadata
      const riskLevel = (entry.pipelineResult.results[0]?.context as any)?.riskLevel
        ?? this.inferRiskFromEntry(entry);

      const gateDecision = deriveGateDecision(entry.guardDecision, riskLevel);
      const rationale = buildRationale(entry.guardDecision, riskLevel, gateDecision);

      return {
        assignmentId: entry.assignmentId,
        taskId: entry.taskId,
        guardDecision: entry.guardDecision,
        riskLevel,
        gateDecision,
        rationale,
      };
    });

    const allowedCount = entries.filter((e) => e.gateDecision === "allow").length;
    const deniedCount = entries.filter((e) => e.gateDecision === "deny").length;
    const reviewRequiredCount = entries.filter((e) => e.gateDecision === "review").length;
    const sandboxedCount = entries.filter((e) => e.gateDecision === "sandbox").length;
    const pendingCount = entries.filter((e) => e.gateDecision === "pending").length;

    const gateHash = computeDeterministicHash(
      "w2-t2-cp2-policy-gate",
      `${evaluatedAt}:${dispatchResult.dispatchId}`,
      `evaluated:${entries.length}`,
      entries.map((e) => `${e.assignmentId}:${e.gateDecision}`).join(":"),
    );

    const summary = buildSummary(allowedCount, deniedCount, reviewRequiredCount, sandboxedCount, entries.length);

    return {
      gateId: gateHash,
      dispatchId: dispatchResult.dispatchId,
      evaluatedAt,
      entries,
      allowedCount,
      deniedCount,
      reviewRequiredCount,
      sandboxedCount,
      pendingCount,
      gateHash,
      summary,
    };
  }

  private inferRiskFromEntry(entry: DispatchEntry): string {
    // Fallback: infer risk from warnings if context metadata unavailable
    if (entry.guardDecision === "BLOCK") return "R3";
    if (entry.guardDecision === "ESCALATE") return "R2";
    return "R1";
  }
}

function buildSummary(
  allowed: number,
  denied: number,
  review: number,
  sandboxed: number,
  total: number,
): string {
  if (total === 0) return "Policy gate evaluated zero entries.";
  const parts: string[] = [];
  if (allowed > 0) parts.push(`${allowed} allowed`);
  if (denied > 0) parts.push(`${denied} denied`);
  if (review > 0) parts.push(`${review} require review`);
  if (sandboxed > 0) parts.push(`${sandboxed} sandboxed`);
  return `Policy gate result: ${parts.join(", ")}.`;
}

export function createPolicyGateContract(
  dependencies?: PolicyGateContractDependencies,
): PolicyGateContract {
  return new PolicyGateContract(dependencies);
}
