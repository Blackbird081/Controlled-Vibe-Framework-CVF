// storage/snapshot.store.ts

export interface SnapshotRecord {
  skillId: string
  versionHash: string
  timestamp: number
}

const snapshotDB: SnapshotRecord[] = []

export function saveSnapshot(record: SnapshotRecord) {
  snapshotDB.push(record)
}

export function getSnapshots(skillId: string): SnapshotRecord[] {
  return snapshotDB.filter(s => s.skillId === skillId)
}