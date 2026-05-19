/**
 * CVF Canonical RiskEngine Contract — Phase 1.P
 * ==============================================
 * Authoritative interface for all RiskEngine / RiskScorer surfaces in CVF.
 * Domain-specific implementations are adapters that satisfy this contract.
 *
 * Authorized by: docs/baselines/CVF_GC018_PHASE_1P_POLICY_RISK_GUARD_CONVERGENCE_2026-05-18.md
 * Owner: CVF_GUARD_CONTRACT (canonical home confirmed by Phase 1.0 owner map)
 *
 * SCOPE: Contract definition only. No runtime wire-up (Phase 2.B).
 */

import type { RiskLevel } from './policy-decision.contract';

// ─── Risk Assessment ──────────────────────────────────────────────────────────

/** Context supplied to a RiskEngine for assessment. */
export interface RiskAssessmentContext {
  /** Identifier of the agent or actor being assessed. */
  readonly agentId: string;
  /** The action being assessed. */
  readonly action: string;
  /** Arbitrary domain payload — typed by the adapter. */
  readonly payload: Readonly<Record<string, unknown>>;
  /** Optional prior risk signals from upstream assessors. */
  readonly priorSignals?: ReadonlyArray<RiskSignal>;
}

/** A single risk signal contributed by one assessor or detector. */
export interface RiskSignal {
  /** Source of this signal (e.g. "contamination_guard", "refusal_router"). */
  readonly source: string;
  readonly level: RiskLevel;
  readonly reason: string;
}

/** Result returned by a RiskEngine assessment. */
export interface RiskAssessmentResult {
  /** Aggregated canonical R-scale level. */
  readonly level: RiskLevel;
  /** Human-readable summary of the assessment. */
  readonly summary: string;
  /** All contributing signals (for audit trail). */
  readonly signals: ReadonlyArray<RiskSignal>;
  /** ISO-8601 timestamp of assessment. */
  readonly assessedAt: string;
}

// ─── RiskEngine Interface ─────────────────────────────────────────────────────

/**
 * Canonical RiskEngine contract.
 * All RiskEngine / RiskScorer implementations must satisfy this interface.
 * Domain implementations are adapters — they must not bypass this contract.
 */
export interface RiskEngine {
  /** Unique identifier for this risk engine instance. */
  readonly engineId: string;
  /** Assess the risk of a request context and return an aggregated result. */
  assess(context: RiskAssessmentContext): Promise<RiskAssessmentResult>;
  /** Return the set of action patterns this engine covers. */
  covers(): ReadonlyArray<string>;
}

// ─── R-Scale Binding ─────────────────────────────────────────────────────────

/**
 * Canonical R-scale policy binding.
 * Maps each RiskLevel to the default governance response.
 * PolicyEngines and GuardEngines must respect this binding unless an
 * explicit domain override is registered.
 *
 * R0 → allow       (no action required)
 * R1 → log         (record and continue)
 * R2 → escalate    (require approval or human review)
 * R3 → deny        (block by default; explicit override required)
 */
export const R_SCALE_POLICY_BINDING: Record<RiskLevel, 'allow' | 'log' | 'escalate' | 'deny'> = {
  R0: 'allow',
  R1: 'log',
  R2: 'escalate',
  R3: 'deny',
} as const;

export type RScaleDefaultAction = (typeof R_SCALE_POLICY_BINDING)[RiskLevel];

// ─── Adapter Registration ─────────────────────────────────────────────────────

/**
 * Metadata for registering a RiskEngine adapter.
 * Used by the adapter map (Phase 1.P) and the future adapter registry (Phase 2.B).
 */
export interface RiskEngineAdapterMeta {
  readonly adapterId: string;
  readonly domain: string;
  readonly sourcePath: string;
  readonly disposition: 'adapter' | 'canonical_contract' | 'legacy_reference' | 'deprecate_candidate';
  readonly hasConformanceStub: boolean;
}
