// CVF MAO-T2 - Risk-Based Role Resolver
//
// Implements the control-plane policy decisions defined by
// docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md
// ("Role Resolver Ownership", "Risk-Based Role Model",
// "Cost / Token / Latency Controls") and the roleResolutionReceipt shape in
// CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json. This is a pure, deterministic,
// provider-neutral policy function: it decides whether extra roles are
// admitted, never which provider serves a role. It consumes a compiled
// MaoTaskGraph from MAO-T1 as its only structural input. Local control-plane
// module; MAO-OA-T1 forwards this resolver through the package root via
// control.plane.mao.barrel.ts and reuses it (unchanged) inside the pure
// orchestration.composition.contract.ts. No provider, adapter, queue, UI,
// or runtime caller.

import type {
  MaoAuthorityEnvelope,
  MaoRiskLevel,
  MaoTaskDefinition,
  MaoTaskGraph,
  MaoTaskRole,
} from "../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/task.graph.contract";
import { verifyAuthorityEnvelope } from "../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/task.graph.contract";

// --- Types (mirror CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json roleResolutionReceipt) ---

export type MaoRoleResolutionDecision =
  | "SINGLE_WORKER_ADMITTED"
  | "BOUNDED_ROLE_PLAN_ADMITTED"
  | "OPERATOR_APPROVAL_REQUIRED"
  | "REJECTED";

/**
 * Local reason-code vocabulary for MAO-T2. Not claimed as existing T0
 * source; recorded as a new resolver-local implementation output per the
 * paired GC-018's docOnlyNewFields disclosure.
 */
export type MaoRoleResolutionReasonCode =
  | "SINGLE_TASK_LOW_RISK_DEFAULT"
  | "MEDIUM_RISK_REVIEWER_REQUIRED"
  | "HIGH_RISK_SPECIALIST_CHAIN_REQUIRED"
  | "HIGH_RISK_CHECKPOINT_REQUIRED"
  | "REJECTED_EMPTY_TASK_SET"
  | "REJECTED_NO_DECOMPOSABLE_SCOPE"
  | "REJECTED_OVERLAPPING_WRITE_SCOPE"
  | "REJECTED_NO_CLOSER_DESIGNATED"
  | "REJECTED_MISSING_SOURCE_PACKET_FOR_ROLE"
  | "REJECTED_MISSING_REQUIRED_ROLE_FOR_RISK_TIER"
  | "REJECTED_BUDGET_INSUFFICIENT_FOR_ROLE_COUNT"
  | "REJECTED_FANOUT_EXCEEDS_PILOT_CEILING"
  | "REJECTED_REVISION_DEPTH_EXCEEDS_PILOT_CEILING"
  | "REJECTED_ROUTE_ROLE_PATTERN_MISMATCH"
  | "REJECTED_AUTHORITY_HASH_INVALID";

export interface MaoRoleResolutionReceipt {
  receiptId: string;
  taskGraphId: string;
  decision: MaoRoleResolutionDecision;
  admittedRoles: string[];
  excludedRoles: string[];
  riskReason: MaoRoleResolutionReasonCode;
  costJustification: string;
  approvalRequired: boolean;
}

export interface MaoRoleResolverInput {
  graph: MaoTaskGraph;
  /** Deterministic receipt identity seed; caller controls so tests stay reproducible. */
  receiptId: string;
}

const PILOT_MAX_CONCURRENT_ROLES = 3;
const PILOT_MAX_REVISION_DEPTH = 1;

// --- Risk-Based Role Model helpers ---

function highestRiskLevel(tasks: readonly MaoTaskDefinition[]): MaoRiskLevel {
  const order: Record<MaoRiskLevel, number> = { R0: 0, R1: 1, R2: 2, R3: 3 };
  return tasks.reduce<MaoRiskLevel>((highest, task) => (order[task.riskLevel] > order[highest] ? task.riskLevel : highest), "R0");
}

function rolesPresent(tasks: readonly MaoTaskDefinition[]): Set<MaoTaskRole> {
  return new Set(tasks.map((task) => task.role));
}

function dependencyOrdersPair(a: string, b: string, graph: MaoTaskGraph): boolean {
  const dependencies = new Map(graph.dependencyManifest.map((edge) => [edge.taskId, edge.dependsOn]));
  function reaches(from: string, target: string, seen = new Set<string>()): boolean {
    if (from === target) return true;
    if (seen.has(from)) return false;
    seen.add(from);
    return (dependencies.get(from) ?? []).some((dependency) => reaches(dependency, target, seen));
  }
  return reaches(a, b) || reaches(b, a);
}

function hasSafeWriteScope(graph: MaoTaskGraph): boolean {
  const tasks = graph.tasks;
  for (let i = 0; i < tasks.length; i += 1) {
    for (let j = i + 1; j < tasks.length; j += 1) {
      const overlap = tasks[i].fileScope.some((file) => tasks[j].fileScope.includes(file));
      if (overlap && !dependencyOrdersPair(tasks[i].taskId, tasks[j].taskId, graph)) return false;
    }
  }
  return true;
}

function everyReviewerHasIsolatedSourcePacket(tasks: readonly MaoTaskDefinition[]): boolean {
  return tasks.filter((task) => task.role === "reviewer").every((task) => task.requiresIsolatedSourcePacket);
}

function hasDesignatedCloser(authority: MaoAuthorityEnvelope): boolean {
  return typeof authority.closerActorId === "string" && authority.closerActorId.trim().length > 0;
}

function isDecomposable(tasks: readonly MaoTaskDefinition[]): boolean {
  // A single-task graph is trivially "decomposable" (nothing to decompose);
  // a multi-task graph is decomposable only when every task declares at
  // least one file in its scope (an empty scope cannot be isolated from
  // its peers, so admission cannot prove non-overlap).
  if (tasks.length <= 1) return true;
  return tasks.every((task) => task.fileScope.length > 0);
}

function routeAllowsRoles(authority: MaoAuthorityEnvelope, roleCount: number): boolean {
  return authority.route.endsWith("MULTI_ROLE") || roleCount === 1;
}

/**
 * Deterministic receipt-identity derivation. Uses only fields already
 * present on the input, so calling this twice with the same graph and
 * caller-supplied receiptId seed always produces the same receiptId - the
 * resolver's own contribution to overall MAO determinism.
 */
function deriveReceiptId(seed: string, taskGraphId: string, decision: string): string {
  return `${seed}:${taskGraphId}:${decision}`;
}

function buildReceipt(
  input: MaoRoleResolverInput,
  decision: MaoRoleResolutionDecision,
  admittedRoles: string[],
  excludedRoles: string[],
  riskReason: MaoRoleResolutionReasonCode,
  costJustification: string,
  approvalRequired: boolean,
): MaoRoleResolutionReceipt {
  return Object.freeze({
    receiptId: deriveReceiptId(input.receiptId, input.graph.taskGraphId, decision),
    taskGraphId: input.graph.taskGraphId,
    decision,
    admittedRoles: Object.freeze([...admittedRoles]) as string[],
    excludedRoles: Object.freeze([...excludedRoles]) as string[],
    riskReason,
    costJustification,
    approvalRequired,
  }) as MaoRoleResolutionReceipt;
}

/**
 * Resolve the role/admission decision for a compiled MAO-T1 task graph.
 *
 * This function never calls a provider, never selects which provider serves
 * a role, and never widens the authority envelope's route, budget, or
 * closer beyond what MAO-T1 already compiled. It fails closed: any
 * violation of a Risk-Based Role Model or Cost / Token / Latency Controls
 * condition returns REJECTED with an explicit reason rather than silently
 * downgrading to a narrower admission.
 *
 * Decision precedence (checked in this order, matching the contract's
 * fail-closed philosophy - structural admission conditions before
 * risk-tier routing):
 *
 * 1. Empty task set -> REJECTED.
 * 2. Concurrent execution-role count exceeding the pilot ceiling of 3 -> REJECTED.
 * 3. Revision-depth budget exceeding the pilot ceiling of 1 -> REJECTED.
 * 4. Multi-task graphs must be decomposable, have non-overlapping or
 *    dependency-serialized write
 *    scope, a designated closer, every reviewer role carrying an isolated
 *    source packet requirement, and sufficient budget for the role count -
 *    any failure -> REJECTED with the specific reason.
 * 5. Highest authority/task risk level selects the route per the Risk-Based Role
 *    Model table: R0/R1 with a single task -> SINGLE_WORKER_ADMITTED;
 *    R0/R1 with multiple admitted roles -> SINGLE_WORKER_ADMITTED is not
 *    applicable (graph already declared multiple roles), so it becomes
 *    BOUNDED_ROLE_PLAN_ADMITTED; R2 -> BOUNDED_ROLE_PLAN_ADMITTED (worker
 *    plus independent reviewer); R3 -> OPERATOR_APPROVAL_REQUIRED (worker,
 *    specialist, reviewer, closer, plus human checkpoint per the contract's
 *    Human Checkpoints decision).
 */
export function resolveRole(input: MaoRoleResolverInput): MaoRoleResolutionReceipt {
  const { graph } = input;
  const tasks = graph.tasks;
  const declaredRoles = [...rolesPresent(tasks)];
  const excludedRoles = (["worker", "reviewer", "specialist", "closer"] as MaoTaskRole[]).filter(
    (role) => !declaredRoles.includes(role),
  );

  if (tasks.length === 0) {
    return buildReceipt(input, "REJECTED", [], [], "REJECTED_EMPTY_TASK_SET", "no cost incurred; nothing to admit", false);
  }

  if (!verifyAuthorityEnvelope(graph.authorityEnvelope)) {
    return buildReceipt(
      input,
      "REJECTED",
      [],
      declaredRoles,
      "REJECTED_AUTHORITY_HASH_INVALID",
      "authority envelope content does not match its immutable authority hash",
      false,
    );
  }

  const executionRoles = declaredRoles.filter((role) => role !== "closer");
  if (executionRoles.length > PILOT_MAX_CONCURRENT_ROLES) {
    return buildReceipt(
      input,
      "REJECTED",
      [],
      declaredRoles,
      "REJECTED_FANOUT_EXCEEDS_PILOT_CEILING",
      `execution role count ${executionRoles.length} exceeds pilot ceiling ${PILOT_MAX_CONCURRENT_ROLES}`,
      false,
    );
  }

  if (graph.authorityEnvelope.budget.maxRevisionDepth > PILOT_MAX_REVISION_DEPTH) {
    return buildReceipt(
      input,
      "REJECTED",
      [],
      declaredRoles,
      "REJECTED_REVISION_DEPTH_EXCEEDS_PILOT_CEILING",
      `maxRevisionDepth ${graph.authorityEnvelope.budget.maxRevisionDepth} exceeds pilot ceiling ${PILOT_MAX_REVISION_DEPTH}`,
      false,
    );
  }

  const isMultiRole = tasks.length > 1;

  if (!routeAllowsRoles(graph.authorityEnvelope, declaredRoles.length)) {
    return buildReceipt(
      input,
      "REJECTED",
      [],
      declaredRoles,
      "REJECTED_ROUTE_ROLE_PATTERN_MISMATCH",
      `authority route ${graph.authorityEnvelope.route} cannot admit ${declaredRoles.length} distinct roles`,
      false,
    );
  }

  if (isMultiRole) {
    if (!isDecomposable(tasks)) {
      return buildReceipt(
        input,
        "REJECTED",
        [],
        declaredRoles,
        "REJECTED_NO_DECOMPOSABLE_SCOPE",
        "one or more tasks declare an empty file scope; scope cannot be proven non-overlapping",
        false,
      );
    }

    if (!hasSafeWriteScope(graph)) {
      return buildReceipt(
        input,
        "REJECTED",
        [],
        declaredRoles,
        "REJECTED_OVERLAPPING_WRITE_SCOPE",
        "two or more tasks declare overlapping file scope",
        false,
      );
    }

    if (!hasDesignatedCloser(graph.authorityEnvelope)) {
      return buildReceipt(
        input,
        "REJECTED",
        [],
        declaredRoles,
        "REJECTED_NO_CLOSER_DESIGNATED",
        "multi-role admission requires exactly one designated closer on the authority envelope",
        false,
      );
    }

    if (!everyReviewerHasIsolatedSourcePacket(tasks)) {
      return buildReceipt(
        input,
        "REJECTED",
        [],
        declaredRoles,
        "REJECTED_MISSING_SOURCE_PACKET_FOR_ROLE",
        "every reviewer role must require an isolated source packet",
        false,
      );
    }

    if (graph.authorityEnvelope.budget.maxConcurrentRoles < executionRoles.length) {
      return buildReceipt(
        input,
        "REJECTED",
        [],
        declaredRoles,
        "REJECTED_BUDGET_INSUFFICIENT_FOR_ROLE_COUNT",
        `maxConcurrentRoles ${graph.authorityEnvelope.budget.maxConcurrentRoles} is below the ${executionRoles.length} execution roles`,
        false,
      );
    }

    if (graph.authorityEnvelope.budget.maxInvocations < tasks.length) {
      return buildReceipt(
        input,
        "REJECTED",
        [],
        declaredRoles,
        "REJECTED_BUDGET_INSUFFICIENT_FOR_ROLE_COUNT",
        `maxInvocations ${graph.authorityEnvelope.budget.maxInvocations} is below the ${tasks.length} declared tasks`,
        false,
      );
    }
  }

  const risk = highestRiskLevel([
    ...tasks,
    { taskId: "authority", role: "worker", riskLevel: graph.authorityEnvelope.riskLevel, fileScope: [], requiresIsolatedSourcePacket: false },
  ]);
  const roles = rolesPresent(tasks);

  if (risk === "R3") {
    // Closer identity is an authority-envelope property (AHB CF-07), never a
    // graph task; hasDesignatedCloser was already checked above for
    // multi-task graphs. R3 requires the task-level roles worker,
    // specialist, and reviewer to be present in addition to that closer.
    const requiredTaskRoles: MaoTaskRole[] = ["worker", "specialist", "reviewer"];
    const missingRoles = requiredTaskRoles.filter((role) => !roles.has(role));
    if (missingRoles.length > 0 || !hasDesignatedCloser(graph.authorityEnvelope)) {
      const missingWithCloser = hasDesignatedCloser(graph.authorityEnvelope) ? missingRoles : [...missingRoles, "closer"];
      return buildReceipt(
        input,
        "REJECTED",
        [],
        declaredRoles,
        "REJECTED_MISSING_REQUIRED_ROLE_FOR_RISK_TIER",
        `R3 admission requires task roles [${requiredTaskRoles.join(", ")}] plus a designated closer; missing [${missingWithCloser.join(", ")}]`,
        false,
      );
    }
    return buildReceipt(
      input,
      "OPERATOR_APPROVAL_REQUIRED",
      declaredRoles,
      excludedRoles,
      "HIGH_RISK_CHECKPOINT_REQUIRED",
      "R3 irreversible/high-consequence risk requires specialist, reviewer, closer, and a human checkpoint before admission",
      true,
    );
  }

  if (risk === "R2") {
    if (!isMultiRole || !roles.has("reviewer")) {
      return buildReceipt(
        input,
        "REJECTED",
        [],
        declaredRoles,
        "HIGH_RISK_SPECIALIST_CHAIN_REQUIRED",
        "R2 admission requires an independent reviewer role in addition to the worker",
        false,
      );
    }
    return buildReceipt(
      input,
      "BOUNDED_ROLE_PLAN_ADMITTED",
      declaredRoles,
      excludedRoles,
      "MEDIUM_RISK_REVIEWER_REQUIRED",
      "R2 governed-artifact or non-trivial integration risk admits worker plus independent reviewer",
      false,
    );
  }

  // R0 / R1
  if (!isMultiRole) {
    return buildReceipt(
      input,
      "SINGLE_WORKER_ADMITTED",
      declaredRoles,
      excludedRoles,
      "SINGLE_TASK_LOW_RISK_DEFAULT",
      "R0/R1 narrow reversible scope; single-worker admission is the default and review separation adds insufficient value",
      false,
    );
  }

  return buildReceipt(
    input,
    "BOUNDED_ROLE_PLAN_ADMITTED",
    declaredRoles,
    excludedRoles,
    "SINGLE_TASK_LOW_RISK_DEFAULT",
    "R0/R1 but graph already declares multiple decomposable, non-overlapping, closer-backed roles",
    false,
  );
}
