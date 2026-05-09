export interface ProofArtifact {
  testResults: string
  diffSnapshot: string
  riskReference: string
  outputSample: string
  timestamp: Date
}

export function validateProofArtifact(proof: ProofArtifact): boolean {
  if (!proof.testResults) return false
  if (!proof.diffSnapshot) return false
  if (!proof.riskReference) return false
  if (!proof.outputSample) return false
  return true
}