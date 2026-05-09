import { StateMachine } from "../state_enforcement/state.machine.parser"
import { MermaidStateDiagram } from "../diagram_validation/mermaid.parser"

export interface StateCodeDiff {
  missingStates: string[]
  extraStates: string[]
}

export function diffStateVsDiagram(
  machine: StateMachine,
  diagram: MermaidStateDiagram
): StateCodeDiff {

  const missingStates: string[] = []
  const extraStates: string[] = []

  const machineStates = new Set(machine.states)

  for (const s of machine.states) {
    if (!diagram.states.has(s)) {
      missingStates.push(s)
    }
  }

  for (const s of diagram.states) {
    if (!machineStates.has(s)) {
      extraStates.push(s)
    }
  }

  return {
    missingStates,
    extraStates
  }

}