import { StateMachine } from "../state_enforcement/state.machine.parser"

export interface FailureResult {
  failedTransitions: string[]
}

export function simulateFailures(
  machine: StateMachine,
  disabledTransitions: string[]
): FailureResult {

  const failed: string[] = []

  for (const [from, targets] of Object.entries(machine.transitions)) {

    for (const to of targets) {

      const key = `${from}->${to}`

      if (disabledTransitions.includes(key)) {
        failed.push(key)
      }

    }

  }

  return {
    failedTransitions: failed
  }

}