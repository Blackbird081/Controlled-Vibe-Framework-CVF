// rollback.manager.ts
// Persisted rollback snapshots — appends to cvf_rollback.jsonl.

// Node.js type declarations (no @types/node dependency needed)
declare const require: (module: string) => any
declare const process: { cwd: () => string; env: Record<string, string | undefined> }

let fs: any
let path: any
try {
  fs = require("fs")
  path = require("path")
} catch {
  fs = null
  path = null
}

import { RollbackSnapshot } from "./rollback.snapshot"

function getRollbackPath(): string {
  if (!path) return ""
  return process.env.CVF_ROLLBACK_PATH
    ?? path.join(process.cwd(), "cvf_rollback.jsonl")
}

// In-memory index
const snapshots: RollbackSnapshot[] = []

// Load existing snapshots from disk on startup
function loadFromDisk(): RollbackSnapshot[] {
  if (!fs) return []
  try {
    const rollbackPath = getRollbackPath()
    if (fs.existsSync(rollbackPath)) {
      const lines: string[] = fs.readFileSync(rollbackPath, "utf-8").split("\n").filter((l: string) => l.length > 0)
      return lines.map((l: string) => JSON.parse(l) as RollbackSnapshot)
    }
  } catch {
    // Fallback to empty
  }
  return []
}

function appendToDisk(snapshot: RollbackSnapshot): void {
  if (!fs) return
  try {
    fs.appendFileSync(getRollbackPath(), JSON.stringify(snapshot) + "\n", "utf-8")
  } catch {
    // Silently continue
  }
}

// Initialize
snapshots.push(...loadFromDisk())

export function createRollbackSnapshot(
  sessionId: string,
  state: unknown
): void {
  const snapshot: RollbackSnapshot = {
    sessionId,
    state,
    timestamp: Date.now()
  }
  snapshots.push(snapshot)
  appendToDisk(snapshot)
}

export function restoreLastSnapshot(
  sessionId: string
): RollbackSnapshot | undefined {
  const history = snapshots.filter(s => s.sessionId === sessionId)
  return history[history.length - 1]
}

export function getAllSnapshots(sessionId: string): RollbackSnapshot[] {
  return snapshots.filter(s => s.sessionId === sessionId)
}

export function getSnapshotPath(): string {
  return getRollbackPath()
}