// CVF MAO-T1 - Task Graph Contract
//
// Implements the immutable task-graph compile/validate step defined by
// docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md
// ("Task / Role / State Lifecycle" step 2) and the taskGraph/authorityEnvelope
// shapes in CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json. Local execution-plane
// module. MAO-OA-T1 forwards this module's exports through the package root
// via the local ./index.ts barrel; it is still not wired to a provider,
// storage, queue, or any runtime caller.

import { computeDeterministicHash } from "../../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types (mirror CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json definitions) ---

export type MaoRoute =
  | "SINGLE_AGENT_SINGLE_ROLE"
  | "SINGLE_AGENT_MULTI_ROLE"
  | "MULTI_AGENT_SINGLE_ROLE"
  | "MULTI_AGENT_MULTI_ROLE";

export type MaoRiskLevel = "R0" | "R1" | "R2" | "R3";

export type MaoTaskRole = "worker" | "reviewer" | "specialist" | "closer";

export type MaoApprovalCheckpoint =
  | "HIGH_RISK_FAN_OUT"
  | "SCOPE_OR_BUDGET_EXPANSION"
  | "REVIEWER_DISSENT_OVERRIDE"
  | "PARTIAL_RESULT_ACCEPTANCE"
  | "COMMIT_OR_PUBLIC_ACTION";

export interface MaoBudgetAllocation {
  maxInvocations: number;
  maxConcurrentRoles: number;
  maxRevisionDepth: number;
  tokenCostCeiling: number | null;
  wallClockCeilingMs: number | null;
}

export interface MaoAuthorityEnvelopeInput {
  workOrderId: string;
  route: MaoRoute;
  riskLevel: MaoRiskLevel;
  budget: MaoBudgetAllocation;
  closerActorId: string;
  approvalCheckpoints: MaoApprovalCheckpoint[];
}

export interface MaoAuthorityEnvelope extends MaoAuthorityEnvelopeInput {
  authorityHash: string;
}

export interface MaoTaskDefinition {
  taskId: string;
  role: MaoTaskRole;
  riskLevel: MaoRiskLevel;
  fileScope: string[];
  requiresIsolatedSourcePacket: boolean;
}

export interface MaoTaskDefinitionInput {
  taskId: string;
  role: MaoTaskRole;
  riskLevel: MaoRiskLevel;
  fileScope: string[];
  requiresIsolatedSourcePacket?: boolean;
}

export interface MaoDependencyEdge {
  taskId: string;
  dependsOn: string[];
}

export interface MaoTaskGraphInput {
  authority: MaoAuthorityEnvelopeInput;
  tasks: MaoTaskDefinitionInput[];
  dependencyManifest?: MaoDependencyEdge[];
  compilerVersion?: string;
}

export interface MaoTaskGraph {
  taskGraphId: string;
  authorityEnvelope: MaoAuthorityEnvelope;
  compilerVersion: string;
  tasks: MaoTaskDefinition[];
  dependencyManifest: MaoDependencyEdge[];
}

export type MaoGraphCompileFailureReason =
  | "DUPLICATE_TASK_ID"
  | "UNKNOWN_DEPENDENCY_TASK"
  | "DEPENDENCY_CYCLE_DETECTED"
  | "SELF_DEPENDENCY"
  | "OVERLAPPING_WRITE_SCOPE"
  | "EMPTY_TASK_SET"
  | "BUDGET_CONCURRENCY_EXCEEDS_CEILING";

export interface MaoGraphCompileSuccess {
  ok: true;
  graph: MaoTaskGraph;
}

export interface MaoGraphCompileFailure {
  ok: false;
  reason: MaoGraphCompileFailureReason;
  detail: string;
}

export type MaoGraphCompileResult = MaoGraphCompileSuccess | MaoGraphCompileFailure;

const DEFAULT_COMPILER_VERSION = "mao-t1-graph-compiler-0.1.0";
const PILOT_MAX_CONCURRENT_ROLES = 3;

// --- Authority envelope ---

/**
 * Deterministic authority hash bound to work-order content. Recomputing the
 * hash from the same envelope fields always yields the same value; any
 * content change (including budget/route/risk) produces a different hash,
 * which is what makes "stale authority hash" detectable downstream.
 */
export function computeAuthorityHash(input: MaoAuthorityEnvelopeInput): string {
  return computeDeterministicHash(
    "mao-t1-authority-envelope",
    input.workOrderId,
    input.route,
    input.riskLevel,
    String(input.budget.maxInvocations),
    String(input.budget.maxConcurrentRoles),
    String(input.budget.maxRevisionDepth),
    String(input.budget.tokenCostCeiling ?? "null"),
    String(input.budget.wallClockCeilingMs ?? "null"),
    input.closerActorId,
    [...input.approvalCheckpoints].sort().join(","),
  );
}

export function buildAuthorityEnvelope(input: MaoAuthorityEnvelopeInput): MaoAuthorityEnvelope {
  return { ...input, authorityHash: computeAuthorityHash(input) };
}

/**
 * Returns true only when a re-derived hash from the same envelope content
 * matches the envelope's recorded authorityHash. This is the primitive a
 * future runtime uses to reject a task graph compiled against authority that
 * has since changed (Threat And Failure Model: "Stale authority hash").
 */
export function verifyAuthorityEnvelope(envelope: MaoAuthorityEnvelope): boolean {
  const { authorityHash, ...rest } = envelope;
  return computeAuthorityHash(rest) === authorityHash;
}

// --- Task graph compilation ---

function detectDuplicateTaskId(tasks: MaoTaskDefinitionInput[]): string | null {
  const seen = new Set<string>();
  for (const task of tasks) {
    if (seen.has(task.taskId)) return task.taskId;
    seen.add(task.taskId);
  }
  return null;
}

function detectSelfDependency(manifest: MaoDependencyEdge[]): string | null {
  for (const edge of manifest) {
    if (edge.dependsOn.includes(edge.taskId)) return edge.taskId;
  }
  return null;
}

function detectUnknownDependency(
  manifest: MaoDependencyEdge[],
  knownTaskIds: Set<string>,
): { taskId: string; unknown: string } | null {
  for (const edge of manifest) {
    for (const dep of edge.dependsOn) {
      if (!knownTaskIds.has(dep)) {
        return { taskId: edge.taskId, unknown: dep };
      }
    }
  }
  return null;
}

/**
 * Depth-first cycle detection over the dependency manifest. Returns the
 * first cycle found as an ordered list of task IDs, or null if the manifest
 * is acyclic. Used to reject a graph before it ever compiles, per the
 * roadmap's "dependency-aware task graph" requirement.
 */
export function detectDependencyCycle(manifest: MaoDependencyEdge[]): string[] | null {
  const dependsOn = new Map<string, string[]>();
  for (const edge of manifest) {
    dependsOn.set(edge.taskId, edge.dependsOn);
  }

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  for (const taskId of dependsOn.keys()) color.set(taskId, WHITE);

  const stack: string[] = [];

  function visit(taskId: string): string[] | null {
    color.set(taskId, GRAY);
    stack.push(taskId);
    for (const dep of dependsOn.get(taskId) ?? []) {
      const depColor = color.get(dep);
      if (depColor === GRAY) {
        const cycleStart = stack.indexOf(dep);
        return [...stack.slice(cycleStart), dep];
      }
      if (depColor === WHITE) {
        const found = visit(dep);
        if (found) return found;
      }
    }
    stack.pop();
    color.set(taskId, BLACK);
    return null;
  }

  for (const taskId of dependsOn.keys()) {
    if (color.get(taskId) === WHITE) {
      const found = visit(taskId);
      if (found) return found;
    }
  }
  return null;
}

function dependencyOrdersPair(a: string, b: string, manifest: MaoDependencyEdge[]): boolean {
  const dependencies = new Map(manifest.map((edge) => [edge.taskId, edge.dependsOn]));
  function reaches(from: string, target: string, seen = new Set<string>()): boolean {
    if (from === target) return true;
    if (seen.has(from)) return false;
    seen.add(from);
    return (dependencies.get(from) ?? []).some((dependency) => reaches(dependency, target, seen));
  }
  return reaches(a, b) || reaches(b, a);
}

function detectOverlappingWriteScope(
  tasks: MaoTaskDefinition[],
  manifest: MaoDependencyEdge[],
): { a: string; b: string; file: string } | null {
  for (let i = 0; i < tasks.length; i += 1) {
    for (let j = i + 1; j < tasks.length; j += 1) {
      const a = tasks[i];
      const b = tasks[j];
      const overlap = a.fileScope.find((file) => b.fileScope.includes(file));
      if (overlap && !dependencyOrdersPair(a.taskId, b.taskId, manifest)) {
        return { a: a.taskId, b: b.taskId, file: overlap };
      }
    }
  }
  return null;
}

function deterministicTaskGraphId(authorityHash: string, tasks: MaoTaskDefinition[], manifest: MaoDependencyEdge[]): string {
  const taskFingerprint = tasks
    .map((t) => `${t.taskId}:${t.role}:${t.riskLevel}:${t.fileScope.join(",")}:${t.requiresIsolatedSourcePacket}`)
    .join("|");
  const manifestFingerprint = manifest
    .map((edge) => `${edge.taskId}<-${[...edge.dependsOn].sort().join(",")}`)
    .join("|");
  return computeDeterministicHash("mao-t1-task-graph-id", authorityHash, taskFingerprint, manifestFingerprint);
}

/**
 * Compile an immutable task graph from a work-order authority envelope and a
 * flat task/dependency declaration. Per contract Architecture Decisions
 * ("Task graph source of truth"): once compiled, the returned graph and its
 * authorityHash never change; runtime events (event.ledger.contract.ts)
 * advance task state but never rewrite this definition.
 *
 * Compilation is rejected (not silently repaired) for: duplicate task IDs,
 * a dependency on an unknown task, a self-dependency, any dependency cycle,
 * overlapping declared write scope between concurrent tasks, an empty task
 * set, or a budget whose maxConcurrentRoles exceeds the T0 pilot ceiling of
 * 3. This matches the Threat And Failure Model rows "Overlapping write
 * scope" and the roadmap's fan-out ceiling.
 */
export function compileTaskGraph(input: MaoTaskGraphInput): MaoGraphCompileResult {
  if (input.tasks.length === 0) {
    return { ok: false, reason: "EMPTY_TASK_SET", detail: "a task graph must declare at least one task" };
  }

  if (input.authority.budget.maxConcurrentRoles > PILOT_MAX_CONCURRENT_ROLES) {
    return {
      ok: false,
      reason: "BUDGET_CONCURRENCY_EXCEEDS_CEILING",
      detail: `maxConcurrentRoles ${input.authority.budget.maxConcurrentRoles} exceeds pilot ceiling ${PILOT_MAX_CONCURRENT_ROLES}`,
    };
  }

  const duplicate = detectDuplicateTaskId(input.tasks);
  if (duplicate) {
    return { ok: false, reason: "DUPLICATE_TASK_ID", detail: `duplicate taskId: ${duplicate}` };
  }

  const tasks: MaoTaskDefinition[] = input.tasks.map((task) => ({
    taskId: task.taskId,
    role: task.role,
    riskLevel: task.riskLevel,
    fileScope: [...task.fileScope],
    requiresIsolatedSourcePacket: task.requiresIsolatedSourcePacket ?? task.role === "reviewer",
  }));

  const knownTaskIds = new Set(tasks.map((t) => t.taskId));
  const dependencyManifest: MaoDependencyEdge[] =
    input.dependencyManifest ?? tasks.map((t) => ({ taskId: t.taskId, dependsOn: [] }));

  const unknownDep = detectUnknownDependency(dependencyManifest, knownTaskIds);
  if (unknownDep) {
    return {
      ok: false,
      reason: "UNKNOWN_DEPENDENCY_TASK",
      detail: `task ${unknownDep.taskId} depends on unknown task ${unknownDep.unknown}`,
    };
  }

  const selfDep = detectSelfDependency(dependencyManifest);
  if (selfDep) {
    return { ok: false, reason: "SELF_DEPENDENCY", detail: `task ${selfDep} declares itself as a dependency` };
  }

  const cycle = detectDependencyCycle(dependencyManifest);
  if (cycle) {
    return { ok: false, reason: "DEPENDENCY_CYCLE_DETECTED", detail: `dependency cycle: ${cycle.join(" -> ")}` };
  }

  const overlap = detectOverlappingWriteScope(tasks, dependencyManifest);
  if (overlap) {
    return {
      ok: false,
      reason: "OVERLAPPING_WRITE_SCOPE",
      detail: `tasks ${overlap.a} and ${overlap.b} both declare file scope ${overlap.file}`,
    };
  }

  const authorityEnvelope = buildAuthorityEnvelope(input.authority);
  const compilerVersion = input.compilerVersion ?? DEFAULT_COMPILER_VERSION;
  const taskGraphId = deterministicTaskGraphId(authorityEnvelope.authorityHash, tasks, dependencyManifest);

  const graph: MaoTaskGraph = {
    taskGraphId,
    authorityEnvelope,
    compilerVersion,
    tasks,
    dependencyManifest,
  };

  return { ok: true, graph: deepFreezeGraph(graph) };
}

function deepFreezeGraph(graph: MaoTaskGraph): MaoTaskGraph {
  for (const task of graph.tasks) {
    Object.freeze(task.fileScope);
    Object.freeze(task);
  }
  for (const edge of graph.dependencyManifest) {
    Object.freeze(edge.dependsOn);
    Object.freeze(edge);
  }
  Object.freeze(graph.tasks);
  Object.freeze(graph.dependencyManifest);
  Object.freeze(graph.authorityEnvelope);
  return Object.freeze(graph);
}

/** Direct dependents of a task (children), derived from the immutable manifest. */
export function directDependents(graph: MaoTaskGraph, taskId: string): string[] {
  return graph.dependencyManifest
    .filter((edge) => edge.dependsOn.includes(taskId))
    .map((edge) => edge.taskId);
}

/** Direct dependencies of a task (parents), derived from the immutable manifest. */
export function directDependencies(graph: MaoTaskGraph, taskId: string): string[] {
  return graph.dependencyManifest.find((edge) => edge.taskId === taskId)?.dependsOn ?? [];
}
