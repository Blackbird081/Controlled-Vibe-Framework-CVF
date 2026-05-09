import { StateMachine } from "../state_enforcement/state.machine.parser"

export function generateMermaidStateDiagram(machine: StateMachine): string {

  const lines: string[] = []

  lines.push("stateDiagram-v2")

  for (const [from, targets] of Object.entries(machine.transitions)) {

    for (const to of targets) {

      lines.push(`  ${from} --> ${to}`)

    }

  }

  return lines.join("\n")

}