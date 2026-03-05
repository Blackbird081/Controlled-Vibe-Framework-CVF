export interface ExecutionTrace {
  path: string[]
  success: boolean
  error?: string
}

export function traceExecution(
  scenario: string[],
  allowedTransitions: (from: string, to: string) => boolean
): ExecutionTrace {

  for (let i = 0; i < scenario.length - 1; i++) {

    const from = scenario[i]
    const to = scenario[i + 1]

    if (!allowedTransitions(from, to)) {

      return {
        path: scenario.slice(0, i + 1),
        success: false,
        error: `${from}->${to} blocked`
      }

    }

  }

  return {
    path: scenario,
    success: true
  }

}