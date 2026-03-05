export interface MermaidStateDiagram {
  states: Set<string>
  transitions: Map<string, Set<string>>
}

export function parseMermaidStateDiagram(input: string): MermaidStateDiagram {

  const states = new Set<string>()
  const transitions = new Map<string, Set<string>>()

  const lines = input.split("\n")

  for (const line of lines) {

    const match = line.match(/(\w+)\s*-->\s*(\w+)/)

    if (!match) continue

    const from = match[1]
    const to = match[2]

    states.add(from)
    states.add(to)

    if (!transitions.has(from)) {
      transitions.set(from, new Set())
    }

    transitions.get(from)!.add(to)

  }

  return { states, transitions }

}

/**
 * Convert MermaidStateDiagram (Set/Map) to StateMachine (array/Record)
 * for compatibility with state_enforcement modules.
 */
import { StateMachine } from "../state_enforcement/state.machine.parser"

export function toStateMachine(diagram: MermaidStateDiagram): StateMachine {
  const states = Array.from(diagram.states)
  const transitions: Record<string, string[]> = {}

  for (const [from, toSet] of diagram.transitions) {
    transitions[from] = Array.from(toSet)
  }

  return { states, transitions }
}