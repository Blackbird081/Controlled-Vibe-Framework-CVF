import { StateMachine } from "../state_enforcement/state.machine.parser"

const MAX_SCENARIOS = 100
const MAX_DEPTH = 50

export function generateScenarios(
  machine: StateMachine,
  maxScenarios: number = MAX_SCENARIOS,
  maxDepth: number = MAX_DEPTH
): string[][] {

  const scenarios: string[][] = []

  function walk(state: string, path: string[], visited: Set<string>) {

    if (scenarios.length >= maxScenarios) return
    if (path.length >= maxDepth) return

    const next = machine.transitions[state] || []

    const current = [...path, state]

    if (next.length === 0) {
      scenarios.push(current)
      return
    }

    for (const n of next) {
      if (visited.has(n)) {
        // Cycle detected — record path up to cycle point and stop
        scenarios.push([...current, `[CYCLE:${n}]`])
        continue
      }

      visited.add(n)
      walk(n, current, visited)
      visited.delete(n)
    }

  }

  const incoming = new Map<string, number>()
  machine.states.forEach(s => incoming.set(s, 0))

  for (const targets of Object.values(machine.transitions)) {
    for (const to of targets) {
      incoming.set(to, (incoming.get(to) ?? 0) + 1)
    }
  }

  const startStates = machine.states.filter(s => (incoming.get(s) ?? 0) === 0)
  const entrypoints = startStates.length > 0
    ? startStates
    : machine.states.length > 0
      ? [machine.states[0]]
      : []

  for (const start of entrypoints) {
    if (scenarios.length >= maxScenarios) break
    walk(start, [], new Set([start]))
  }

  return scenarios

}
