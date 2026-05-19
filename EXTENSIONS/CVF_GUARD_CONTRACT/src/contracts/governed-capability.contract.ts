/**
 * CVF Phase 2.A — Provisional GovernedCapability and OutcomeWorkflow Contracts
 * =============================================================================
 * Defines the provisional capability chain contracts: GovernedCapability and
 * OutcomeWorkflow. Both contracts are PROVISIONAL — they are type sketches only,
 * with placeholder canonical owner bindings. No runtime behavior is changed.
 *
 * Authorized by: docs/baselines/CVF_GC018_PHASE_2A_CONTRACT_SKETCH_2026-05-18.md
 *
 * SCOPE: Type definition and outcome chain documentation only.
 *   No web execute route integration (Phase 2.B).
 *   No certified capability enforcement at runtime (Phase 2.B).
 *   No noncoder vertical slice (Phase 2.C).
 *   All contracts are marked PROVISIONAL until Phase 2.B wire-up.
 *
 * Existing baseline acknowledged: skill.meta.json is the current capability
 * metadata format. GovernedCapability extends that baseline without replacing it.
 *
 * Canonical owner bindings are PLACEHOLDER — from Phase 1.0 owner map.
 * Phase 2.B will confirm owners after Phase 1.P/1.I/1.R/1.M adapters are wired.
 */

// ─── Provisioning Marker ──────────────────────────────────────────────────────

/**
 * Marker type for Phase 2.A provisional contracts.
 * Remove this marker when Phase 2.B wire-up is complete.
 */
export type PROVISIONAL = 'PROVISIONAL_UNTIL_PHASE_2B';

// ─── GovernedCapability ───────────────────────────────────────────────────────

/**
 * PROVISIONAL: A governed capability registered in the CVF capability registry.
 * Extends the existing skill.meta.json baseline with governance metadata.
 *
 * Placeholder canonical owner: CVF_CONTROL_PLANE_FOUNDATION
 * (kernel surface #10 — capability composition: partially_owned)
 *
 * Phase 2.B obligation: bind this contract to the skill registry's canonical
 * owner; confirm via agent.governed.session.contract.ts capability slot.
 */
export interface GovernedCapability {
  readonly _provisional: PROVISIONAL;
  /** Capability identifier — must match skill.meta.json skillId where applicable. */
  readonly capabilityId: string;
  /** Human-readable capability name. */
  readonly name: string;
  /** Domain that owns this capability. */
  readonly domain: string;
  /** Minimum R-scale risk level required to invoke this capability. */
  readonly minimumRiskClearance: 'R0' | 'R1' | 'R2' | 'R3';
  /** Policy engine that governs invocation decisions for this capability. */
  readonly policyEngineId: string;
  /** Whether this capability requires an audit receipt on every invocation. */
  readonly requiresAuditReceipt: boolean;
  /** Outcomes this capability can produce (links to OutcomeWorkflow). */
  readonly outcomeWorkflowIds: ReadonlyArray<string>;
  /** Phase that makes this capability available at runtime. */
  readonly availableFrom: 'Phase-2B' | 'Phase-2C' | 'Phase-3E';
}

// ─── OutcomeWorkflow ──────────────────────────────────────────────────────────

/**
 * PROVISIONAL: A governed outcome workflow — the chain from trigger to deliverable.
 * Maps what a capability produces (outcome) to what it delivers (artifact).
 *
 * Placeholder canonical owner: CVF_EXECUTION_PLANE_FOUNDATION
 * (kernel surface #7 — execution plane: owned)
 *
 * Phase 2.B obligation: wire OutcomeWorkflow instances to the execution pipeline
 * so that execution.pipeline.contract.ts can resolve outcome → deliverable.
 *
 * Existing gap: OutcomeWorkflow has zero active runtime implementation as of
 * Phase 1.0 inventory. This contract is a pure sketch for Phase 2.B targeting.
 */
export interface OutcomeWorkflow {
  readonly _provisional: PROVISIONAL;
  /** Workflow identifier. */
  readonly workflowId: string;
  /** Human-readable workflow name. */
  readonly name: string;
  /** The capability that triggers this workflow. */
  readonly triggeredByCapabilityId: string;
  /** Ordered list of workflow steps. */
  readonly steps: ReadonlyArray<OutcomeWorkflowStep>;
  /** The deliverable this workflow produces when all steps complete. */
  readonly deliverable: OutcomeDeliverable;
  /** Phase that makes this workflow executable at runtime. */
  readonly executableFrom: 'Phase-2B' | 'Phase-2C';
}

export interface OutcomeWorkflowStep {
  readonly stepId: string;
  readonly description: string;
  readonly agentFunctionRole: string;
  readonly requiresMemoryTier: 'working' | 'task' | 'skill' | 'audit' | 'receipt';
}

export interface OutcomeDeliverable {
  /** Type of deliverable artifact. */
  readonly type: 'code' | 'document' | 'receipt' | 'audit-entry' | 'capability-output';
  /** Human-readable description of the deliverable. */
  readonly description: string;
  /** Whether this deliverable is governed by the receipt envelope (Phase 1.R). */
  readonly wrappedInReceiptEnvelope: boolean;
}

// ─── Outcome → Deliverable Chain Documentation ────────────────────────────────

/**
 * The canonical outcome → deliverable chain for Phase 2.A.
 * This documents the intended chain; runtime enforcement is Phase 2.B.
 *
 * Chain:
 *   Capability Invocation
 *     → GovernedCapability (policy clearance check via policyEngineId)
 *     → OutcomeWorkflow (step sequence via execution.pipeline.contract)
 *     → OutcomeDeliverable (artifact produced)
 *     → Receipt<OutcomeDeliverable> (wrapped per Phase 1.R if requiresAuditReceipt)
 *     → Audit Memory tier (immutable trace per Phase 1.M)
 */
export const OUTCOME_DELIVERABLE_CHAIN_DOC = {
  version: '2.A.0-provisional',
  chain: [
    'GovernedCapability (policy clearance)',
    'OutcomeWorkflow (step sequence)',
    'OutcomeDeliverable (artifact)',
    'Receipt<OutcomeDeliverable> (Phase 1.R envelope)',
    'Audit Memory (Phase 1.M immutable tier)',
  ],
  placeholderOwners: {
    GovernedCapability: 'CVF_CONTROL_PLANE_FOUNDATION (kernel #10)',
    OutcomeWorkflow: 'CVF_EXECUTION_PLANE_FOUNDATION (kernel #7)',
    PolicyEngine: 'CVF_GUARD_CONTRACT/src/contracts (Phase 1.P)',
    ReceiptEnvelope: 'CVF_GUARD_CONTRACT/src/contracts (Phase 1.R)',
    AuditMemory: 'CVF_GUARD_CONTRACT/src/audit (Phase 1.M)',
  },
  existingBaseline: 'skill.meta.json — existing capability metadata; GovernedCapability extends, does not replace',
} as const;
