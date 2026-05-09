import type { LifecycleCheckpoint } from "../types/index"

const checkpointStore: Record<string, LifecycleCheckpoint> = {}

export function saveCheckpoint(checkpoint: LifecycleCheckpoint) {
  checkpointStore[checkpoint.proposalId] = checkpoint
}

export function getCheckpoint(proposalId: string): LifecycleCheckpoint {
  const checkpoint = checkpointStore[proposalId]

  if (!checkpoint) {
    throw new Error("Checkpoint not found")
  }

  return checkpoint
}

export function hasCheckpoint(proposalId: string): boolean {
  return Boolean(checkpointStore[proposalId])
}

export function _clearAllCheckpoints() {
  for (const proposalId of Object.keys(checkpointStore)) {
    delete checkpointStore[proposalId]
  }
}
