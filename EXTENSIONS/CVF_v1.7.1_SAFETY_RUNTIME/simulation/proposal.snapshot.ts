import type { SimulationContext, SimulationResult, ProposalSnapshot } from "../types/index"

const snapshotStore: ProposalSnapshot[] = []

export function saveSnapshot(snapshot: ProposalSnapshot) {
  snapshotStore.push(snapshot)
}

export function getSnapshot(proposalId: string): ProposalSnapshot | undefined {
  return snapshotStore.find(s => s.proposalId === proposalId)
}

export function listSnapshots(): readonly ProposalSnapshot[] {
  return snapshotStore
}