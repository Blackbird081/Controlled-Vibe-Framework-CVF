// entropy.guard.ts
// Entropy assessment — self-calculates from token array when available,
// falls back to caller-provided tokenVariance only if raw tokens not provided.

export interface EntropyAssessment {
  entropyScore: number
  unstable: boolean
  reason?: string
  source: "calculated" | "caller-provided"
}

/**
 * Calculate token variance from raw token probability array.
 * Variance = mean of squared deviations from mean.
 */
function calculateVariance(tokenProbabilities: number[]): number {
  if (tokenProbabilities.length === 0) return 0
  const mean = tokenProbabilities.reduce((a, b) => a + b, 0) / tokenProbabilities.length
  const squaredDiffs = tokenProbabilities.map(p => (p - mean) ** 2)
  return squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length
}

/**
 * Assess entropy stability.
 * 
 * @param options.tokenProbabilities — raw token probs from model output (preferred)
 * @param options.tokenVariance — pre-calculated variance from caller (fallback)
 * @param options.threshold — instability threshold (default 0.35)
 * 
 * If tokenProbabilities provided → self-calculate variance (trusted).
 * If only tokenVariance provided → use but mark as "caller-provided" (less trusted).
 */
export function assessEntropy(options: {
  tokenProbabilities?: number[]
  tokenVariance?: number
  threshold?: number
}): EntropyAssessment {

  const threshold = options.threshold ?? 0.35
  let variance: number
  let source: "calculated" | "caller-provided"

  if (options.tokenProbabilities && options.tokenProbabilities.length > 0) {
    variance = calculateVariance(options.tokenProbabilities)
    source = "calculated"
  } else if (options.tokenVariance !== undefined) {
    variance = options.tokenVariance
    source = "caller-provided"
  } else {
    // No data — assume stable
    return {
      entropyScore: 0,
      unstable: false,
      reason: "No entropy data provided — assuming stable",
      source: "caller-provided"
    }
  }

  const unstable = variance > threshold

  return {
    entropyScore: variance,
    unstable,
    reason: unstable
      ? `Entropy ${variance.toFixed(4)} exceeds threshold ${threshold} (source: ${source})`
      : undefined,
    source
  }
}