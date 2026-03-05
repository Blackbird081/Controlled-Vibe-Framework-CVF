export interface StateMachine {
  states: string[]
  transitions: Record<string, string[]>
}

export function parseStateMachine(input: any): StateMachine {

  if (!input?.states || !Array.isArray(input.states)) {
    throw new Error("StateMachine: invalid states")
  }

  if (!input?.transitions) {
    throw new Error("StateMachine: transitions missing")
  }

  return {
    states: input.states,
    transitions: input.transitions
  }

}