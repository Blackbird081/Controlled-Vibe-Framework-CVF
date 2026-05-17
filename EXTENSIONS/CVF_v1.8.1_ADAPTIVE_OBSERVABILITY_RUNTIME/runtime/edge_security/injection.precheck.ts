const injectionSignals = [
  "ignore previous instructions",
  "override system prompt",
  "act as dan",
  "bypass safety",
]

export function checkInjection(input: string): boolean {
  const normalized = input.toLowerCase()
  return injectionSignals.some(signal => normalized.includes(signal))
}
