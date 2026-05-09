import { StateMachine } from "../state_enforcement/state.machine.parser"
import { MermaidStateDiagram } from "./mermaid.parser"

export function checkDiagramConsistency(
  machine: StateMachine,
  diagram: MermaidStateDiagram
): string[] {

  const issues: string[] = []

  for (const state of machine.states) {

    if (!diagram.states.has(state)) {
      issues.push(`Missing state in diagram: ${state}`)
    }

  }

  for (const [from, targets] of Object.entries(machine.transitions)) {

    const diagramTargets = diagram.transitions.get(from) || new Set()

    for (const to of targets) {

      if (!diagramTargets.has(to)) {
        issues.push(`Missing transition in diagram: ${from} -> ${to}`)
      }

    }

  }

  return issues

}