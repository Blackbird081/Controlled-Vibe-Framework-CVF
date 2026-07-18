// CVF MAO-OA-T5 - Operational Operator Readout And Workspace Session Projection
//
// Implements one bounded pure local composition owner that builds a
// deterministic operator readout from the existing MAO-T7 evidence ledger
// (`buildEvidenceReadout`, `classifyReadoutFreshness`,
// `projectWorkspaceMilestones`) plus explicit caller-supplied session/
// workspace/guard snapshots, per
// docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md,
// docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPERATOR_VIEW_PLAN.md, and
// docs/work_orders/CVF_AGENT_WORK_ORDER_MAO_OA_T5_OPERATIONAL_OPERATOR_READOUT_AND_WORKSPACE_SESSION_PROJECTION_2026-07-17.md.
//
// This module never reads or writes any filesystem path, generated
// workspace/session state file, UI, queue, provider, network, process, or
// git owner. Every input is caller-supplied; the readout is a pure function
// of its arguments. An optional `MaoSessionSyncProjection` is carried
// through exactly as supplied and is never built or applied here. Local
// execution-plane module only; no CLI/MCP/UI/runtime caller.

import {
  buildEvidenceReadout,
  classifyReadoutFreshness,
  projectWorkspaceMilestones,
} from "./evidence.readout.contract";
import type {
  MaoEvidenceLedger,
  MaoEvidenceReadout,
  MaoFreshnessClass,
  MaoWorkspaceMilestoneProjection,
} from "./evidence.readout.contract";
import type { MaoSessionSyncProjection } from "./closer.interlock.contract";

// --- Canonical workspace lane vocabulary (docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_LANE_TAXONOMY.md) ---

export const MAO_OPERATIONAL_CANONICAL_LANES = [
  "intake",
  "dispatch",
  "execution",
  "worker_return",
  "review",
  "accepted_material",
  "session_sync",
  "parked",
  "blocked",
  "archive_ready",
] as const;

export type MaoOperationalWorkspaceLane = (typeof MAO_OPERATIONAL_CANONICAL_LANES)[number];

const CANONICAL_LANE_SET: ReadonlySet<string> = new Set(MAO_OPERATIONAL_CANONICAL_LANES);

// --- Types ---

export interface MaoOperationalWorkspaceItemSnapshot {
  readonly itemId: string;
  readonly lane: MaoOperationalWorkspaceLane;
  readonly status: string;
  readonly evidencePaths: readonly string[];
}

export type MaoOperationalGuardStatus = "PASS" | "FAIL" | "BLOCKED";

export interface MaoOperationalGuardSnapshot {
  readonly checker: string;
  readonly status: MaoOperationalGuardStatus;
  readonly evidencePath: string | null;
}

export interface MaoOperationalOperatorProjectionInput {
  currentMode: string;
  activeHandoff: string;
  nextAllowedMove: string;
  ledger: MaoEvidenceLedger;
  terminalOutcomeEvidenceIds: ReadonlySet<string>;
  generatedAt: string;
  evaluatedAt: string;
  staleAfterMs: number;
  workspaceItems: readonly MaoOperationalWorkspaceItemSnapshot[];
  guardSnapshots: readonly MaoOperationalGuardSnapshot[];
  sessionProjection?: MaoSessionSyncProjection | null;
}

export type MaoOperationalOperatorProjectionFailureReason =
  | "INVALID_SESSION_FACTS"
  | "UNSUPPORTED_LANE"
  | "UNBACKED_GUARD_PASS";

export interface MaoOperationalOperatorProjectionFailure {
  ok: false;
  reason: MaoOperationalOperatorProjectionFailureReason;
  detail: string;
}

export interface MaoOperationalOperatorReadout {
  readonly readModelOnly: true;
  readonly currentMode: string;
  readonly activeHandoff: string;
  readonly nextAllowedMove: string;
  readonly evidenceReadout: MaoEvidenceReadout;
  readonly freshness: MaoFreshnessClass;
  readonly milestones: readonly MaoWorkspaceMilestoneProjection[];
  readonly laneCounts: Readonly<Record<MaoOperationalWorkspaceLane, number>>;
  readonly blockedAndParkedItems: readonly MaoOperationalWorkspaceItemSnapshot[];
  readonly acceptedMaterialItems: readonly MaoOperationalWorkspaceItemSnapshot[];
  readonly guardSnapshots: readonly MaoOperationalGuardSnapshot[];
  readonly sessionProjection: MaoSessionSyncProjection | null;
}

export interface MaoOperationalOperatorProjectionSuccess {
  ok: true;
  readout: MaoOperationalOperatorReadout;
}

export type MaoOperationalOperatorProjectionResult =
  | MaoOperationalOperatorProjectionFailure
  | MaoOperationalOperatorProjectionSuccess;

// --- Deterministic sorting helpers (never mutate caller arrays) ---

function sortedStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...values].sort());
}

function sortedItems(items: readonly MaoOperationalWorkspaceItemSnapshot[]): MaoOperationalWorkspaceItemSnapshot[] {
  return [...items]
    .map((item) => Object.freeze({ ...item, evidencePaths: sortedStrings(item.evidencePaths) }))
    .sort((a, b) => a.itemId.localeCompare(b.itemId));
}

function sortedGuardSnapshots(snapshots: readonly MaoOperationalGuardSnapshot[]): readonly MaoOperationalGuardSnapshot[] {
  return Object.freeze(
    [...snapshots].map((snapshot) => Object.freeze({ ...snapshot })).sort((a, b) => a.checker.localeCompare(b.checker)),
  );
}

function emptyLaneCounts(): Record<MaoOperationalWorkspaceLane, number> {
  const counts = {} as Record<MaoOperationalWorkspaceLane, number>;
  for (const lane of MAO_OPERATIONAL_CANONICAL_LANES) {
    counts[lane] = 0;
  }
  return counts;
}

/**
 * Pure function building one deterministic operator readout. Never reads or
 * writes any filesystem path, generated state file, UI, queue, provider, or
 * git owner; every fact comes from `input`. Given the same input, this
 * always returns a structurally identical readout.
 */
export function buildOperationalOperatorProjection(
  input: MaoOperationalOperatorProjectionInput,
): MaoOperationalOperatorProjectionResult {
  if (
    input.currentMode.trim().length === 0 ||
    input.activeHandoff.trim().length === 0 ||
    input.nextAllowedMove.trim().length === 0 ||
    input.generatedAt.trim().length === 0 ||
    input.evaluatedAt.trim().length === 0
  ) {
    return {
      ok: false,
      reason: "INVALID_SESSION_FACTS",
      detail: "currentMode, activeHandoff, nextAllowedMove, generatedAt, and evaluatedAt must all be non-empty",
    };
  }

  for (const item of input.workspaceItems) {
    if (!CANONICAL_LANE_SET.has(item.lane)) {
      return {
        ok: false,
        reason: "UNSUPPORTED_LANE",
        detail: `workspace item ${item.itemId} declares unsupported lane ${item.lane}`,
      };
    }
  }

  for (const guard of input.guardSnapshots) {
    if (guard.status === "PASS" && (!guard.evidencePath || guard.evidencePath.trim().length === 0)) {
      return {
        ok: false,
        reason: "UNBACKED_GUARD_PASS",
        detail: `guard ${guard.checker} reports PASS with no non-empty evidence path`,
      };
    }
  }

  const evidenceReadout = buildEvidenceReadout(input.ledger, input.generatedAt);
  const freshness = classifyReadoutFreshness(evidenceReadout, input.staleAfterMs, input.evaluatedAt);
  const milestones = projectWorkspaceMilestones(input.ledger, input.terminalOutcomeEvidenceIds);

  const laneCounts = emptyLaneCounts();
  for (const item of input.workspaceItems) {
    laneCounts[item.lane] += 1;
  }

  const sortedWorkspaceItems = sortedItems(input.workspaceItems);
  const blockedAndParkedItems = sortedWorkspaceItems.filter((item) => item.lane === "blocked" || item.lane === "parked");
  const acceptedMaterialItems = sortedWorkspaceItems.filter((item) => item.lane === "accepted_material");

  const readout: MaoOperationalOperatorReadout = Object.freeze({
    readModelOnly: true,
    currentMode: input.currentMode,
    activeHandoff: input.activeHandoff,
    nextAllowedMove: input.nextAllowedMove,
    evidenceReadout,
    freshness,
    milestones,
    laneCounts: Object.freeze(laneCounts),
    blockedAndParkedItems: Object.freeze(blockedAndParkedItems),
    acceptedMaterialItems: Object.freeze(acceptedMaterialItems),
    guardSnapshots: sortedGuardSnapshots(input.guardSnapshots),
    sessionProjection: input.sessionProjection ?? null,
  });

  return { ok: true, readout };
}

/**
 * Stateless pure composition owner wrapping
 * `buildOperationalOperatorProjection`. Holds no fields and no caller
 * state; every call is an independent pure function of its input, matching
 * the work order's `MaoOperationalOperatorProjection` symbol name while
 * keeping the actual composition logic as a directly testable function.
 */
export class MaoOperationalOperatorProjection {
  build(input: MaoOperationalOperatorProjectionInput): MaoOperationalOperatorProjectionResult {
    return buildOperationalOperatorProjection(input);
  }
}
