/**
 * CVF Canonical Policy Decision Contract — Phase 1.P
 * ====================================================
 * Authoritative interface for all PolicyEngine surfaces in CVF.
 * Domain-specific implementations are adapters that satisfy this contract.
 *
 * Authorized by: docs/baselines/CVF_GC018_PHASE_1P_POLICY_RISK_GUARD_CONVERGENCE_2026-05-18.md
 * Owner: CVF_GUARD_CONTRACT (canonical home confirmed by Phase 1.0 owner map)
 *
 * SCOPE: Contract definition only. No runtime wire-up (Phase 2.B).
 */

// ─── Policy Decision ─────────────────────────────────────────────────────────

/** The outcome of a single policy evaluation. */
export type PolicyDecision = 'allow' | 'deny' | 'escalate' | 'defer';

/** Context supplied to a PolicyEngine for evaluation. */
export interface PolicyRequestContext {
  /** Identifier of the agent or actor making the request. */
  readonly agentId: string;
  /** The action being requested (e.g. "execute_skill", "modify_file"). */
  readonly action: string;
  /** Arbitrary domain payload — typed by the adapter. */
  readonly payload: Readonly<Record<string, unknown>>;
  /** Optional R-scale risk level pre-computed by a RiskEngine. */
  readonly riskLevel?: RiskLevel;
}

/** Result returned by a PolicyEngine evaluation. */
export interface PolicyDecisionResult {
  readonly decision: PolicyDecision;
  /** Human-readable rationale for the decision. */
  readonly rationale: string;
  /** Canonical R-scale level at which this decision was made. */
  readonly riskLevel: RiskLevel;
  /** ISO-8601 timestamp of evaluation. */
  readonly evaluatedAt: string;
  /** Optional structured evidence for the decision (GC-046 Rule 1). */
  readonly evidence?: PolicyEvidence;
}

/** Structured evidence block for a policy decision (GC-046). */
export interface PolicyEvidence {
  readonly rule: string;
  readonly source: string;
  readonly traceQuery?: string;
}

// ─── PolicyEngine Interface ───────────────────────────────────────────────────

/**
 * Canonical PolicyEngine contract.
 * All PolicyEngine implementations must satisfy this interface.
 * Domain implementations are adapters — they must not bypass this contract.
 */
export interface PolicyEngine {
  /** Unique identifier for this policy engine instance. */
  readonly engineId: string;
  /** Evaluate a policy request and return a decision. */
  evaluate(context: PolicyRequestContext): Promise<PolicyDecisionResult>;
  /** Return the set of action patterns this engine covers. */
  covers(): ReadonlyArray<string>;
}

// ─── Risk Level ──────────────────────────────────────────────────────────────

/**
 * CVF canonical R-scale risk level.
 * Defined here as it is required by both PolicyEngine and RiskEngine contracts.
 * Authoritative definition — import from this module.
 *
 * R0 — Safe:      no governance action required
 * R1 — Low:       log and monitor
 * R2 — Medium:    escalate or require approval
 * R3 — Dangerous: deny by default; requires explicit override
 */
export type RiskLevel = 'R0' | 'R1' | 'R2' | 'R3';

export const RISK_LEVEL_ORDER: Record<RiskLevel, number> = {
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
} as const;

/** Returns true if `a` is more severe than `b`. */
export function isMoreSevere(a: RiskLevel, b: RiskLevel): boolean {
  return RISK_LEVEL_ORDER[a] > RISK_LEVEL_ORDER[b];
}

/** Returns the more severe of two risk levels. */
export function maxRiskLevel(a: RiskLevel, b: RiskLevel): RiskLevel {
  return isMoreSevere(a, b) ? a : b;
}

// ─── Adapter Registration ─────────────────────────────────────────────────────

/**
 * Metadata for registering a PolicyEngine adapter.
 * Used by the adapter map (Phase 1.P) and the future adapter registry (Phase 2.B).
 */
export interface PolicyEngineAdapterMeta {
  /** Adapter identifier — must be unique across the registry. */
  readonly adapterId: string;
  /** The domain this adapter serves. */
  readonly domain: string;
  /** Source file path relative to repo root. */
  readonly sourcePath: string;
  /** Phase 1.0 inventory disposition for this surface. */
  readonly disposition: 'adapter' | 'canonical_contract' | 'legacy_reference' | 'deprecate_candidate';
  /** Whether this adapter has a Phase 1.P conformance test stub. */
  readonly hasConformanceStub: boolean;
}
