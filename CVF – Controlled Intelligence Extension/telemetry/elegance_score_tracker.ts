let eleganceScore = 0
let samples = 0

export function recordElegance(score: number): void {
  eleganceScore += score
  samples++
}

export function getAverageElegance(): number {
  if (samples === 0) return 0
  return eleganceScore / samples
}