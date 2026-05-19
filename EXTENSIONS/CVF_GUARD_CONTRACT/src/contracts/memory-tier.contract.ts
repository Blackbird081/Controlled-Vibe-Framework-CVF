/**
 * CVF Phase 1.M — Memory-Home Tier Map Contract
 * ================================================
 * Defines the canonical 5-tier memory model: working / task / skill /
 * audit / receipt. Maps each tier to its home, lifecycle, and scope.
 *
 * Authorized by: docs/baselines/CVF_GC018_PHASE_1M_MEMORY_HOME_TIER_MAP_2026-05-18.md
 *
 * SCOPE: Tier model definition and surface classification only.
 *   No existing memory reference or store renamed or deleted (Phase 2.B).
 *   No runtime memory access path changed.
 *   Long-term and organizational memory are explicitly deferred.
 *
 * Extends: docs/reviews/CVF_17_05_KERNEL_TERMINOLOGY_ALIAS_TABLE_2026-05-17.md
 *   (WorkingMemory/TaskMemory/SkillMemory/AuditMemory/ReceiptMemory all
 *    marked `adopt` — this contract adopts them with formal tier specs.)
 *
 * Background: Phase 1.0 inventory found 0 canonical memory-tier implementations.
 *   Kernel surface #9 (memory model) is not_owned with zero conflicting home —
 *   making Phase 1.M a pure definition pass with no migration conflict risk.
 */

// ─── Tier Identifiers ─────────────────────────────────────────────────────────

/**
 * The five canonical memory tier identifiers.
 * Each tier is an independent scope — memory does not automatically
 * escalate between tiers. Promotion requires explicit governance action.
 */
export type MemoryTierId =
  | 'working'   // Active session context — ephemeral, in-process
  | 'task'      // Task-scoped state — lives for the task duration
  | 'skill'     // Skill output records — persisted after skill execution
  | 'audit'     // Governance audit trail — immutable once written
  | 'receipt';  // Receipt store — aligned with Phase 1.R Receipt<TPayload>

// ─── Tier Definitions ─────────────────────────────────────────────────────────

export interface MemoryTierSpec {
  /** Canonical tier identifier. */
  readonly tierId: MemoryTierId;
  /** Human-readable tier name. */
  readonly name: string;
  /** Lifecycle: how long contents live. */
  readonly lifecycle: 'ephemeral' | 'task-scoped' | 'session-persistent' | 'immutable';
  /** Scope: who can read/write this tier. */
  readonly scope: 'in-process' | 'agent-local' | 'cross-agent' | 'audit-only';
  /** Whether this tier is write-once / immutable after first write. */
  readonly immutable: boolean;
  /** Phase 2.B wire-up target — which foundation module will own this tier. */
  readonly phase2BOwner: string;
  /** Out-of-scope concerns for this tier. */
  readonly outOfScope: ReadonlyArray<string>;
}

/** The five canonical tier specifications. */
export const MEMORY_TIER_SPECS: ReadonlyArray<MemoryTierSpec> = [
  {
    tierId: 'working',
    name: 'Working Memory',
    lifecycle: 'ephemeral',
    scope: 'in-process',
    immutable: false,
    phase2BOwner: 'CVF_CONTROL_PLANE_FOUNDATION (agent.governed.session.contract)',
    outOfScope: ['cross-session persistence', 'multi-agent sharing', 'audit trail'],
  },
  {
    tierId: 'task',
    name: 'Task Memory',
    lifecycle: 'task-scoped',
    scope: 'agent-local',
    immutable: false,
    phase2BOwner: 'CVF_EXECUTION_PLANE_FOUNDATION (execution.pipeline.contract)',
    outOfScope: ['cross-task rollup', 'org-level memory', 'indefinite retention'],
  },
  {
    tierId: 'skill',
    name: 'Skill Memory',
    lifecycle: 'session-persistent',
    scope: 'agent-local',
    immutable: false,
    phase2BOwner: 'CVF_LEARNING_PLANE_FOUNDATION (controlled.memory.gateway.contract)',
    outOfScope: ['cross-agent sharing without explicit gate', 'long-term archiving'],
  },
  {
    tierId: 'audit',
    name: 'Audit Memory',
    lifecycle: 'immutable',
    scope: 'audit-only',
    immutable: true,
    phase2BOwner: 'CVF_GUARD_CONTRACT (audit/trace-emitter)',
    outOfScope: ['mutation after write', 'non-governance access', 'organizational rollup'],
  },
  {
    tierId: 'receipt',
    name: 'Receipt Memory',
    lifecycle: 'immutable',
    scope: 'cross-agent',
    immutable: true,
    phase2BOwner: 'CVF_GUARD_CONTRACT (receipt envelope — Phase 1.R)',
    outOfScope: [
      'mutation after issuance',
      'long-term archiving (beyond session)',
      'multi-tenant receipt aggregation',
    ],
  },
] as const;

// ─── Deferred Tiers ───────────────────────────────────────────────────────────

/**
 * Memory tiers explicitly deferred from Phase 1.M.
 * These require a separate GC-018 before adoption.
 */
export const DEFERRED_MEMORY_TIERS = [
  {
    tierId: 'long-term',
    reason: 'Requires persistent store (Postgres/Supabase) — deferred in GA decision',
    deferredUntil: 'Track M (Postgres/Supabase) — requires fresh GC-018',
  },
  {
    tierId: 'organizational',
    reason: 'Multi-tenant memory scope — outside current platform boundary',
    deferredUntil: 'Separate organizational scoping GC-018',
  },
] as const;

// ─── Tier Assignment Helpers ──────────────────────────────────────────────────

/** Check if a tier ID is one of the five canonical tiers. */
export function isCanonicalTier(tierId: string): tierId is MemoryTierId {
  return ['working', 'task', 'skill', 'audit', 'receipt'].includes(tierId);
}

/** Check if a tier is immutable (audit or receipt). */
export function isTierImmutable(tierId: MemoryTierId): boolean {
  return tierId === 'audit' || tierId === 'receipt';
}

// ─── Memory Surface Adapter Meta ─────────────────────────────────────────────

export interface MemoryTierAdapterMeta {
  readonly adapterId: string;
  readonly domain: string;
  readonly sourcePath: string;
  readonly assignedTier: MemoryTierId | 'false-positive' | 'multi-tier';
  readonly disposition: 'canonical_contract' | 'adapter' | 'legacy_reference' | 'deprecate_candidate';
  readonly hasConformanceStub: boolean;
  readonly migrationNote?: string;
}
