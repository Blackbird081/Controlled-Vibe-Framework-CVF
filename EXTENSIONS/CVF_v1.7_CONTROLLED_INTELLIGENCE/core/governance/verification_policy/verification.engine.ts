import { PhaseExitCriteria, evaluatePhaseExit } from "./phase.exit.criteria"
import { ProofArtifact, validateProofArtifact } from "./proof.of.correctness"

export interface VerificationContext {
  criteria: PhaseExitCriteria
  proof: ProofArtifact
}

export interface VerificationResult {
  approved: boolean
  reasons?: string[]
}

export function runVerification(context: VerificationContext): VerificationResult {
  const reasons: string[] = []

  if (!evaluatePhaseExit(context.criteria)) {
    reasons.push("Phase exit criteria not satisfied.")
  }

  if (!validateProofArtifact(context.proof)) {
    reasons.push("Proof of correctness incomplete.")
  }

  const approved = reasons.length === 0

  return {
    approved,
    reasons: approved ? undefined : reasons
  }
}