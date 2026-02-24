export interface VerificationMetrics {
  testsPassed: number
  testsFailed: number
}

export function calculateVerificationScore(
  metrics: VerificationMetrics
): number {

  const total = metrics.testsPassed + metrics.testsFailed
  if (total === 0) return 0

  return metrics.testsPassed / total
}