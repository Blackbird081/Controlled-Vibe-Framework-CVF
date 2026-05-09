export interface RefactorThresholds {
  maxComplexityGrowthPercent: number
  maxLocGrowthPercent: number
  maxDependencyIncrease: number
  riskLevelAllowed: string[]
}

export const DefaultRefactorThresholds: RefactorThresholds = {
  maxComplexityGrowthPercent: 15,
  maxLocGrowthPercent: 25,
  maxDependencyIncrease: 2,
  riskLevelAllowed: ["R0", "R1", "R2"]
}