import type {
  SimulationContext,
  SimulationResult,
  CVFExecutionResult,
} from "../types/index"
import { getSnapshot } from "./proposal.snapshot"

export interface CVFPublicAPI {
  submitProposal(proposal: Record<string, unknown>): Promise<CVFExecutionResult>
}

export class SimulationEngine {
  constructor(private cvf: CVFPublicAPI) {}

  async simulate(context: SimulationContext): Promise<SimulationResult> {
    const snapshot = getSnapshot(context.proposalId)

    if (!snapshot) {
      throw new Error("Snapshot not found")
    }

    const result = await this.cvf.submitProposal({
      id: snapshot.proposalId,
      source: "openclaw",
      action: "simulation_replay",
      payload: snapshot.proposal,
      createdAt: Date.now(),
      confidence: 1,
      riskLevel: "low",
    })

    return {
      originalDecision: snapshot.decision,
      simulatedDecision: result.status,
      policyVersion: context.policyVersion,
      changed: snapshot.decision !== result.status,
    }
  }
}
