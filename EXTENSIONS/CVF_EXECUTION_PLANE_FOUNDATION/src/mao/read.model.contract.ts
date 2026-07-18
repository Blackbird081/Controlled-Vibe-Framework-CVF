// CVF MAO-T1 - Generated Read Model Contract
//
// Implements the deterministic read model defined by
// docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md
// ("Storage And Retention Decision": "Read model | deterministic generated
// aggregate, regenerated from the event ledger") and the generatedReadModel
// shape in CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json. The read model is always
// rebuilt fresh from ledger entries; it is never hand-edited and never
// treated as execution truth (the ledger is). Local execution-plane module
// only; no provider, queue, workspace, or session-state mutation.

import { isTerminalState } from "./event.ledger.contract";
import type { MaoEventLedgerEntry, MaoTaskState } from "./event.ledger.contract";
import type { MaoTaskGraph } from "./task.graph.contract";

export type MaoTerminalOutcome = "succeeded" | "rejected" | "blocked" | "cancelled" | "timed_out" | "exhausted" | "failed";

export interface MaoReadModelTaskState {
  taskId: string;
  state: MaoTaskState;
  terminalOutcome: MaoTerminalOutcome | null;
  lastEventId: string;
  lastSequence: number;
}

export interface MaoGeneratedReadModel {
  taskGraphId: string;
  generatedAt: string;
  taskStates: MaoReadModelTaskState[];
  openDissent: string[];
}

export interface MaoReadModelBuildInput {
  graph: MaoTaskGraph;
  entries: readonly MaoEventLedgerEntry[];
  generatedAt: string;
  openDissent?: string[];
}

function terminalOutcomeFor(state: MaoTaskState): MaoTerminalOutcome | null {
  return isTerminalState(state) ? (state as MaoTerminalOutcome) : null;
}

/**
 * Rebuild the generated read model from scratch by folding the append-only
 * event ledger's entries, in ascending `sequence` order, into one state per
 * declared task. This function is a pure reducer: given the same graph and
 * the same entries, it always returns an identical read model (see
 * `readModelsAreEqual` and the deterministic-replay test). Every task
 * declared in the compiled graph appears in the output, defaulting to
 * `planned` with no terminal outcome if the ledger has no entries for it
 * yet - the read model never silently drops a task.
 */
export function buildReadModel(input: MaoReadModelBuildInput): MaoGeneratedReadModel {
  const sortedEntries = [...input.entries].sort((a, b) => a.sequence - b.sequence);

  const latestByTask = new Map<string, MaoEventLedgerEntry>();
  for (const entry of sortedEntries) {
    latestByTask.set(entry.taskId, entry);
  }

  const taskStates: MaoReadModelTaskState[] = input.graph.tasks.map((task) => {
    const latest = latestByTask.get(task.taskId);
    if (!latest) {
      return {
        taskId: task.taskId,
        state: "planned",
        terminalOutcome: null,
        lastEventId: "",
        lastSequence: 0,
      };
    }
    return {
      taskId: task.taskId,
      state: latest.resultingState,
      terminalOutcome: terminalOutcomeFor(latest.resultingState),
      lastEventId: latest.eventId,
      lastSequence: latest.sequence,
    };
  });

  // Deterministic ordering independent of Map iteration order or input order.
  taskStates.sort((a, b) => a.taskId.localeCompare(b.taskId));

  return Object.freeze({
    taskGraphId: input.graph.taskGraphId,
    generatedAt: input.generatedAt,
    taskStates: Object.freeze(taskStates),
    openDissent: Object.freeze([...(input.openDissent ?? [])]),
  }) as MaoGeneratedReadModel;
}

/**
 * Structural equality for two read models, ignoring `generatedAt` (which is
 * expected to differ between replay runs taken at different wall-clock
 * times) but comparing every task's state/outcome/lastEventId/lastSequence
 * and the dissent list. Used by the deterministic-replay test to prove that
 * rebuilding the read model twice from the same ledger produces the same
 * task-state content.
 */
export function readModelsAreEqual(a: MaoGeneratedReadModel, b: MaoGeneratedReadModel): boolean {
  if (a.taskGraphId !== b.taskGraphId) return false;
  if (a.taskStates.length !== b.taskStates.length) return false;
  for (let i = 0; i < a.taskStates.length; i += 1) {
    const left = a.taskStates[i];
    const right = b.taskStates[i];
    if (
      left.taskId !== right.taskId ||
      left.state !== right.state ||
      left.terminalOutcome !== right.terminalOutcome ||
      left.lastEventId !== right.lastEventId ||
      left.lastSequence !== right.lastSequence
    ) {
      return false;
    }
  }
  if (a.openDissent.length !== b.openDissent.length) return false;
  for (let i = 0; i < a.openDissent.length; i += 1) {
    if (a.openDissent[i] !== b.openDissent[i]) return false;
  }
  return true;
}
