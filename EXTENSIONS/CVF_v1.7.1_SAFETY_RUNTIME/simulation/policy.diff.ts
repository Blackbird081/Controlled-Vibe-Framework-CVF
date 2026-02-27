import { listSnapshots } from "./proposal.snapshot"
import { SimulationEngine } from "./simulation.engine"

export async function diffPolicyImpact(
  simulationEngine: SimulationEngine,
  newPolicyVersion: string
) {
  const snapshots = listSnapshots()

  const changedProposals: {
    proposalId: string
    from: string
    to: string
  }[] = []

  for (const snap of snapshots) {
    const result = await simulationEngine.simulate({
      proposalId: snap.proposalId,
      policyVersion: newPolicyVersion,
      simulateOnly: true,
    })

    if (result.changed) {
      changedProposals.push({
        proposalId: snap.proposalId,
        from: snap.decision,
        to: result.simulatedDecision,
      })
    }
  }

  return changedProposals
}
