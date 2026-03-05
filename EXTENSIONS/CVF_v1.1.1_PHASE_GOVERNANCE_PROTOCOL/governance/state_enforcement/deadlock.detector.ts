import { StateMachine } from "./state.machine.parser"

export interface DeadlockDetectionOptions {
  terminalStates?: string[]
}

export function detectDeadlocks(
  machine: StateMachine,
  options: DeadlockDetectionOptions = {}
): string[] {

  const visited = new Set<string>()
  const stack = new Set<string>()
  const problematic = new Set<string>()
  const terminalStates = new Set(options.terminalStates ?? [])

  function dfs(state: string) {

    if (stack.has(state)) {
      problematic.add(state)
      return
    }

    if (visited.has(state)) return

    visited.add(state)
    stack.add(state)

    const next = machine.transitions[state] || []

    for (const s of next) {
      dfs(s)
    }

    stack.delete(state)

  }

  for (const s of machine.states) {
    dfs(s)
  }

  // Dead-end states: no outgoing transitions and not explicitly terminal.
  for (const state of machine.states) {
    const next = machine.transitions[state] || []
    if (next.length === 0 && !terminalStates.has(state)) {
      problematic.add(state)
    }
  }

  return [...problematic]

}
