import type { MemoryLifecycleState } from "./memory-lifecycle-policy";
import type { RuntimeMemoryActorRole } from "./runtime-memory-hierarchy";

export const MEMORY_READOUT_ELIGIBILITY_POLICY_VERSION =
  "cvf.memoryReadoutEligibilityPolicy.mkg7.t2.v1";

export type MemoryReadoutEligibilityState =
  | "READOUT_ALLOWED"
  | "READOUT_DENIED"
  | "STALE_NEEDS_REFRESH"
  | "REVOKED"
  | "NO_AUTHORITY_SOURCE"
  | "OUT_OF_SCOPE_FOR_ACTOR";

export interface MemoryReadoutEligibilityInput {
  actorRole: RuntimeMemoryActorRole;
  scope: string;
  lifecycleState: MemoryLifecycleState;
  ageDays: number;
  stale: boolean;
  revoked: boolean;
  authoritySourcePresent: boolean;
}

export interface MemoryReadoutEligibilityResult {
  contractVersion: typeof MEMORY_READOUT_ELIGIBILITY_POLICY_VERSION;
  state: MemoryReadoutEligibilityState;
  reason: string;
  rawMemoryReleased: false;
  canReinject: false;
}

const READOUT_AUTHORIZED_ACTORS: ReadonlySet<RuntimeMemoryActorRole> = new Set([
  "OPERATOR",
  "GOVERNOR",
  "HUMAN",
  "BUILDER",
  "AI_AGENT",
  "REVIEWER",
  "SERVICE_AGENT",
  "OBSERVER",
  "ANALYST",
]);

const BLOCKED_LIFECYCLE_STATES: ReadonlySet<MemoryLifecycleState> = new Set([
  "expired",
  "disputed",
  "forgotten",
]);

const STALE_AGE_THRESHOLD_DAYS = 45;

export function evaluateReadoutEligibility(
  input: MemoryReadoutEligibilityInput,
): MemoryReadoutEligibilityResult {
  if (!input.authoritySourcePresent) {
    return buildResult("NO_AUTHORITY_SOURCE", "authority_source_missing_for_readout");
  }

  if (input.revoked) {
    return buildResult("REVOKED", "memory_readout_access_revoked");
  }

  if (!READOUT_AUTHORIZED_ACTORS.has(input.actorRole)) {
    return buildResult(
      "OUT_OF_SCOPE_FOR_ACTOR",
      "actor_role_not_authorized_for_memory_readout",
    );
  }

  if (BLOCKED_LIFECYCLE_STATES.has(input.lifecycleState)) {
    return buildResult(
      "READOUT_DENIED",
      `lifecycle_state_blocks_readout:${input.lifecycleState}`,
    );
  }

  if (input.stale || input.ageDays >= STALE_AGE_THRESHOLD_DAYS) {
    return buildResult(
      "STALE_NEEDS_REFRESH",
      input.stale
        ? "memory_entry_marked_stale"
        : "memory_entry_age_exceeds_stale_threshold",
    );
  }

  return buildResult("READOUT_ALLOWED", "memory_readout_permitted");
}

function buildResult(
  state: MemoryReadoutEligibilityState,
  reason: string,
): MemoryReadoutEligibilityResult {
  return {
    contractVersion: MEMORY_READOUT_ELIGIBILITY_POLICY_VERSION,
    state,
    reason,
    rawMemoryReleased: false,
    canReinject: false,
  };
}
