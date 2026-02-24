export interface EntropyAssessment {
  entropyScore: number
  unstable: boolean
  reason?: string
}

export function assessEntropy(
  tokenVariance: number,
  threshold: number = 0.35
): EntropyAssessment {

  const unstable = tokenVariance > threshold

  return {
    entropyScore: tokenVariance,
    unstable,
    reason: unstable
      ? `Entropy ${tokenVariance} exceeds threshold ${threshold}`
      : undefined
  }
}