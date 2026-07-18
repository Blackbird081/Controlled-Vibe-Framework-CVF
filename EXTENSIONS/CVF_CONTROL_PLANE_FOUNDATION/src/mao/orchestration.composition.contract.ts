// CVF MAO-OA-T1 - Pure Orchestration Composition Contract
//
// Composes the existing MAO-T1 task-graph compiler (execution plane) with
// the existing MAO-T2 role resolver (control plane, this package) into one
// deterministic, side-effect-free read: compile the graph, then resolve its
// role/admission receipt only when compilation succeeds. This module owns
// no new compiler, no new risk policy, no storage, no event/evidence
// ledger, no delegation adapter, no lifecycle controller, and no
// reviewer/dissent/closer authority. It never launches a worker, never
// calls a provider, and never widens or reinterprets a result returned by
// either owner function.
//
// Dependency direction: control plane may import the execution-plane graph
// compiler surface; execution plane must never import control plane. This
// file imports compileTaskGraph directly from the execution-plane package
// source (not through a duplicate compiler) and resolveRole from this
// package's own role.resolver.contract.ts (not a duplicated risk policy).
//
// See docs/reference/multi_agent_orchestration/README.md and
// docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md
// for the design authority this module composes without extending.

import type {
  MaoGraphCompileResult,
  MaoTaskGraphInput,
} from "../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/task.graph.contract";
import { compileTaskGraph } from "../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/task.graph.contract";
import type { MaoRoleResolutionReceipt } from "./role.resolver.contract";
import { resolveRole } from "./role.resolver.contract";

export interface MaoOrchestrationCompositionInput {
  graphInput: MaoTaskGraphInput;
  receiptId: string;
}

export interface MaoOrchestrationCompositionResult {
  graphResult: MaoGraphCompileResult;
  roleResolution: MaoRoleResolutionReceipt | null;
}

/**
 * Compile a task graph and, only on compile success, resolve its role
 * admission receipt. Both owner functions are called at most once each.
 *
 * - Compile failure: returns the unchanged `MaoGraphCompileResult` failure
 *   plus `roleResolution: null`. `resolveRole` is never called.
 * - Compile success: calls `resolveRole` exactly once with the compiled
 *   graph and the caller-supplied `receiptId`, and returns the exact
 *   resolver receipt verbatim, including `REJECTED` and
 *   `OPERATOR_APPROVAL_REQUIRED` outcomes. Neither result is caught,
 *   reinterpreted, or used to synthesize a new reason code.
 *
 * The returned top-level result object is frozen. Two independent calls
 * with the same immutable input produce deeply equal results, because this
 * function performs no callback, clock, I/O, environment read, storage,
 * network, adapter, or lifecycle action - it only reads its input and
 * invokes the two existing pure owner functions.
 */
export function composeOrchestrationPlan(
  input: MaoOrchestrationCompositionInput,
): MaoOrchestrationCompositionResult {
  const graphResult = compileTaskGraph(input.graphInput);

  if (!graphResult.ok) {
    return Object.freeze({
      graphResult,
      roleResolution: null,
    }) as MaoOrchestrationCompositionResult;
  }

  const roleResolution = resolveRole({
    graph: graphResult.graph,
    receiptId: input.receiptId,
  });

  return Object.freeze({
    graphResult,
    roleResolution,
  }) as MaoOrchestrationCompositionResult;
}
