import { StateMachine } from "./state.machine.parser"

export function validateStateMachine(machine: StateMachine): void {

  const states = new Set(machine.states)

  for (const [from, targets] of Object.entries(machine.transitions)) {

    if (!states.has(from)) {
      throw new Error(`Invalid state: ${from}`)
    }

    for (const to of targets) {

      if (!states.has(to)) {
        throw new Error(`Invalid transition: ${from} -> ${to}`)
      }

    }

  }

}