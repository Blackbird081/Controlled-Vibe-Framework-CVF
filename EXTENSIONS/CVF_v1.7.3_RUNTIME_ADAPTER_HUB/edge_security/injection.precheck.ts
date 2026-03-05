export interface InjectionRisk {
  detected: boolean
  score: number
  signals: string[]
}

const injectionSignals = [
  "ignore previous instructions",
  "override system prompt",
  "act as dan",
  "bypass safety"
]

export function precheckInjection(input: string): InjectionRisk {
  let score = 0
  const signals: string[] = []

  injectionSignals.forEach(signal => {
    if (input.toLowerCase().includes(signal)) {
      score += 1
      signals.push(signal)
    }
  })

  return {
    detected: score > 0,
    score,
    signals
  }
}