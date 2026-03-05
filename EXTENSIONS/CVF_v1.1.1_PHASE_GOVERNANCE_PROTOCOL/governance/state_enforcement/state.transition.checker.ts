import { StateMachine } from "./state.machine.parser"

export class StateTransitionChecker {

  constructor(private machine: StateMachine) {}

  canTransition(from: string, to: string): boolean {

    const allowed = this.machine.transitions[from] || []

    return allowed.includes(to)

  }

}