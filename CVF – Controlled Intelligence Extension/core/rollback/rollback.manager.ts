import { RollbackSnapshot } from "./rollback.snapshot"

const snapshots: RollbackSnapshot[] = []

export function createRollbackSnapshot(
  sessionId: string,
  state: unknown
): void {
  snapshots.push({
    sessionId,
    state,
    timestamp: Date.now()
  })
}

export function restoreLastSnapshot(
  sessionId: string
): RollbackSnapshot | undefined {

  const history = snapshots.filter(s => s.sessionId === sessionId)

  return history[history.length - 1]
}