/**
 * Scenario Generator — v1.1.2 Hardening
 *
 * Generates all reachable paths through a state machine for simulation.
 *
 * v1.1.2 changes (De_xuat_05 — System Invariant Verification):
 *   - InvariantRule interface + built-in invariant set.
 *   - checkInvariants(): validates cross-state logical properties after simulation.
 *   - InvariantViolation: describes a failed invariant with location.
 */

import { StateMachine } from "../state_enforcement/state.machine.parser";

const MAX_SCENARIOS = 100;
const MAX_DEPTH = 50;

// ─── System Invariants (De_xuat_05) ──────────────────────────────────────────

export interface InvariantRule {
  id: string;
  description: string;
  /** Returns null if invariant holds, or error message if violated. */
  check: (machine: StateMachine, scenarios: string[][]) => string | null;
}

export interface InvariantViolation {
  invariantId: string;
  description: string;
  detail: string;
}

/**
 * BUILT_IN_INVARIANTS
 *
 * Cross-state invariants that must hold for any valid state machine
 * after scenario simulation. These are structural/logical rules
 * that go beyond individual state checks (which detectAnomalies handles).
 */
export const BUILT_IN_INVARIANTS: InvariantRule[] = [
  {
    id: "INV-01",
    description: "Every declared state must be reachable from at least one scenario path.",
    check: (machine, scenarios) => {
      const visited = new Set<string>();
      for (const path of scenarios) {
        for (const s of path) {
          if (!s.startsWith("[CYCLE:")) visited.add(s);
        }
      }
      const unreachable = machine.states.filter((s) => !visited.has(s));
      if (unreachable.length > 0) {
        return `Unreachable states in simulation: [${unreachable.join(", ")}]`;
      }
      return null;
    },
  },
  {
    id: "INV-02",
    description: "No scenario path should contain consecutive duplicate states (identity loop).",
    check: (_machine, scenarios) => {
      for (const path of scenarios) {
        for (let i = 0; i < path.length - 1; i++) {
          if (path[i] === path[i + 1] && !path[i].startsWith("[CYCLE:")) {
            return `Path contains consecutive duplicate state "${path[i]}" at index ${i}.`;
          }
        }
      }
      return null;
    },
  },
  {
    id: "INV-03",
    description: "At least one scenario path must exist (machine is not empty/degenerate).",
    check: (_machine, scenarios) => {
      if (scenarios.length === 0) {
        return "No scenarios generated — state machine may be empty or fully cyclic with no terminal states.";
      }
      return null;
    },
  },
];

/**
 * checkInvariants()
 *
 * Runs all BUILT_IN_INVARIANTS (+ any custom invariants) against the machine
 * and the generated scenarios. Called after generateScenarios().
 *
 * @returns Array of InvariantViolation — empty means all invariants hold.
 */
export function checkInvariants(
  machine: StateMachine,
  scenarios: string[][],
  customInvariants: InvariantRule[] = []
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  const allRules = [...BUILT_IN_INVARIANTS, ...customInvariants];

  for (const rule of allRules) {
    const result = rule.check(machine, scenarios);
    if (result !== null) {
      violations.push({
        invariantId: rule.id,
        description: rule.description,
        detail: result,
      });
    }
  }

  return violations;
}

// ─── Scenario Generation ─────────────────────────────────────────────────────

export function generateScenarios(
  machine: StateMachine,
  maxScenarios: number = MAX_SCENARIOS,
  maxDepth: number = MAX_DEPTH
): string[][] {

  const scenarios: string[][] = [];

  function walk(state: string, path: string[], visited: Set<string>) {

    if (scenarios.length >= maxScenarios) return;
    if (path.length >= maxDepth) return;

    const next = machine.transitions[state] || [];
    const current = [...path, state];

    if (next.length === 0) {
      scenarios.push(current);
      return;
    }

    for (const n of next) {
      if (visited.has(n)) {
        scenarios.push([...current, `[CYCLE:${n}]`]);
        continue;
      }
      visited.add(n);
      walk(n, current, visited);
      visited.delete(n);
    }
  }

  // Infer entry states: states with no incoming transitions
  const incoming = new Map<string, number>();
  machine.states.forEach((s) => incoming.set(s, 0));

  for (const targets of Object.values(machine.transitions)) {
    for (const to of targets) {
      incoming.set(to, (incoming.get(to) ?? 0) + 1);
    }
  }

  const startStates = machine.states.filter((s) => (incoming.get(s) ?? 0) === 0);
  const entrypoints =
    startStates.length > 0
      ? startStates
      : machine.states.length > 0
        ? [machine.states[0]]
        : [];

  for (const start of entrypoints) {
    if (scenarios.length >= maxScenarios) break;
    walk(start, [], new Set([start]));
  }

  return scenarios;
}
