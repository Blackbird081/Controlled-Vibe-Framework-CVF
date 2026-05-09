export interface StateMachine {
  states: string[]
  transitions: Record<string, string[]>
  terminalStates?: string[]
}

export function parseStateMachine(input: any): StateMachine {

  if (!input?.states || !Array.isArray(input.states)) {
    throw new Error("StateMachine: invalid states")
  }

  if (!input?.transitions) {
    throw new Error("StateMachine: transitions missing")
  }

  if (typeof input.transitions !== "object" || Array.isArray(input.transitions)) {
    throw new Error("StateMachine: invalid transitions map")
  }

  for (const [state, targets] of Object.entries(input.transitions)) {
    if (!Array.isArray(targets)) {
      throw new Error(`StateMachine: transition targets must be string[] for state '${state}'`)
    }

    for (const target of targets) {
      if (typeof target !== "string") {
        throw new Error(`StateMachine: invalid transition target type for state '${state}'`)
      }
    }
  }

  return {
    states: input.states,
    transitions: input.transitions,
    terminalStates: input.terminalStates
  }

}
