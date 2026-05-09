/**
 * Execution Trace — v1.1.2 Hardening
 *
 * Traces a scenario path through a state machine and determines
 * whether all transitions are valid.
 *
 * v1.1.2 changes (De_xuat_04 — Self-Debugging):
 *   - AnomalyType enum — classifies detected anomalies.
 *   - AnomalyReport — structured anomaly result with location.
 *   - detectAnomalies(): detects dead paths, unreachable states, and loop traps.
 *   - traceExecution() extended: populates anomalies field in ExecutionTrace.
 */

import { StateMachine } from "../state_enforcement/state.machine.parser";

export type AnomalyType =
  | "DEAD_PATH"         // transition leads to a state with no further outgoing transitions (and not terminal)
  | "UNREACHABLE_STATE" // state has no incoming transitions from any other state
  | "LOOP_TRAP";        // state leads only back to itself (self-loop with no exit)

export interface AnomalyReport {
  type: AnomalyType;
  state: string;
  detail: string;
}

export interface ExecutionTrace {
  path: string[];
  success: boolean;
  error?: string;
  /** v1.1.2: anomalies detected during this trace execution */
  anomalies: AnomalyReport[];
}

// ─── traceExecution ───────────────────────────────────────────────────────────

export function traceExecution(
  scenario: string[],
  allowedTransitions: (from: string, to: string) => boolean
): ExecutionTrace {

  for (let i = 0; i < scenario.length - 1; i++) {
    const from = scenario[i];
    const to = scenario[i + 1];

    if (!allowedTransitions(from, to)) {
      return {
        path: scenario.slice(0, i + 1),
        success: false,
        error: `${from}->${to} blocked`,
        anomalies: [],
      };
    }
  }

  return {
    path: scenario,
    success: true,
    anomalies: [],
  };
}

// ─── Self-Debugging Anomaly Detection (De_xuat_04) ────────────────────────────

/**
 * detectAnomalies()
 *
 * Analyzes a state machine for structural anomalies BEFORE runtime execution.
 * Pre-runtime detection reduces regression risk significantly.
 *
 * Detects:
 *   DEAD_PATH      — state is reachable but leads to a non-terminal dead-end.
 *   UNREACHABLE_STATE — state has no incoming transitions (orphaned state).
 *   LOOP_TRAP      — state's only outgoing transition leads back to itself.
 *
 * @param machine         StateMachine to analyze
 * @param terminalStates  Set of state names considered valid end-states (not dead-ends)
 */
export function detectAnomalies(
  machine: StateMachine,
  terminalStates: Set<string> = new Set()
): AnomalyReport[] {
  const anomalies: AnomalyReport[] = [];
  const allStates = new Set(machine.states);

  // Build incoming-edges count per state
  const incomingCount = new Map<string, number>();
  for (const s of machine.states) incomingCount.set(s, 0);

  for (const [, targets] of Object.entries(machine.transitions)) {
    for (const t of targets) {
      incomingCount.set(t, (incomingCount.get(t) ?? 0) + 1);
    }
  }

  for (const state of machine.states) {
    const outgoing = machine.transitions[state] ?? [];

    // DEAD_PATH — no outgoing transitions and not terminal
    if (outgoing.length === 0 && !terminalStates.has(state)) {
      anomalies.push({
        type: "DEAD_PATH",
        state,
        detail: `State "${state}" has no outgoing transitions and is not declared terminal.`,
      });
    }

    // UNREACHABLE_STATE — no incoming transitions (and not the first/only start state)
    const isStartState = (incomingCount.get(state) ?? 0) === 0;
    const isOnlyState = machine.states.length === 1;
    const isFirstState = machine.states[0] === state;
    if (isStartState && !isOnlyState && !isFirstState && allStates.size > 1) {
      anomalies.push({
        type: "UNREACHABLE_STATE",
        state,
        detail: `State "${state}" has no incoming transitions — it can never be reached.`,
      });
    }

    // LOOP_TRAP — all outgoing transitions lead back to self only
    if (
      outgoing.length > 0 &&
      outgoing.every((t) => t === state)
    ) {
      anomalies.push({
        type: "LOOP_TRAP",
        state,
        detail: `State "${state}" only transitions back to itself — execution will never exit.`,
      });
    }
  }

  return anomalies;
}