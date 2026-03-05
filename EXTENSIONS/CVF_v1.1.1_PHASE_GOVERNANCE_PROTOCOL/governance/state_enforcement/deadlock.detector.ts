import { StateMachine } from "./state.machine.parser"

export function detectDeadlocks(machine: StateMachine): string[] {

  const visited = new Set<string>()
  const stack = new Set<string>()
  const cycles: string[] = []

  function dfs(state: string) {

    if (stack.has(state)) {
      cycles.push(state)
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

  return cycles

}