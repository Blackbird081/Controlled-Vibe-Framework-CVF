export interface EleganceMetrics {
  previousComplexity: number
  currentComplexity: number
  previousLOC: number
  currentLOC: number
  previousDependencies: number
  currentDependencies: number
}

export interface EleganceScoreResult {
  score: number
  complexityGrowth: number
  locGrowth: number
  dependencyIncrease: number
}

export function calculateEleganceScore(
  metrics: EleganceMetrics
): EleganceScoreResult {

  const complexityGrowth =
    ((metrics.currentComplexity - metrics.previousComplexity) /
      Math.max(metrics.previousComplexity, 1)) * 100

  const locGrowth =
    ((metrics.currentLOC - metrics.previousLOC) /
      Math.max(metrics.previousLOC, 1)) * 100

  const dependencyIncrease =
    metrics.currentDependencies - metrics.previousDependencies

  let score = 100

  if (complexityGrowth > 0) score -= complexityGrowth * 0.5
  if (locGrowth > 0) score -= locGrowth * 0.2
  if (dependencyIncrease > 0) score -= dependencyIncrease * 5

  if (score < 0) score = 0

  return {
    score,
    complexityGrowth,
    locGrowth,
    dependencyIncrease
  }
}