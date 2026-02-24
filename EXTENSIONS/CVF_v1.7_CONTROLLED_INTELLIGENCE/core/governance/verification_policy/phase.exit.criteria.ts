export interface PhaseExitCriteria {
  testsPassed: boolean
  diffWithinScope: boolean
  riskValidated: boolean
  logsClean: boolean
  eleganceChecked: boolean
  proofAttached: boolean
}

export function evaluatePhaseExit(criteria: PhaseExitCriteria): boolean {
  return (
    criteria.testsPassed &&
    criteria.diffWithinScope &&
    criteria.riskValidated &&
    criteria.logsClean &&
    criteria.eleganceChecked &&
    criteria.proofAttached
  )
}