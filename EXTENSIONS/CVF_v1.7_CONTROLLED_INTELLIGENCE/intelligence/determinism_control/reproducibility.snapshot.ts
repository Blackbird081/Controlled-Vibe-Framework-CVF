// reproducibility.snapshot.ts
// Snapshot for deterministic reasoning reproduction.
// Includes prompt hash, model version, and snapshotId for full reproducibility.

export interface ReproducibilitySnapshot {
  snapshotId: string    // deterministic hash — sessionId + role + promptHash + temperature + modelVersion
  sessionId: string
  role: string
  temperature: number
  entropyScore: number
  promptHash: string    // hash of basePrompt
  modelVersion: string  // model identifier for version tracking
  timestamp: number
}

/**
 * Simple deterministic hash — NOT cryptographic, just for reproducibility tracking.
 * Uses djb2 algorithm: fast, deterministic, no external deps.
 */
function hashString(input: string): string {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i)
    hash = hash >>> 0  // Keep unsigned 32-bit
  }
  return hash.toString(16).padStart(8, "0")
}

export function createSnapshot(
  sessionId: string,
  role: string,
  temperature: number,
  entropyScore: number,
  basePrompt: string = "",
  modelVersion: string = "unknown"
): ReproducibilitySnapshot {

  const promptHash = hashString(basePrompt)
  const snapshotId = hashString(`${sessionId}|${role}|${promptHash}|${temperature}|${modelVersion}`)

  return {
    snapshotId,
    sessionId,
    role,
    temperature,
    entropyScore,
    promptHash,
    modelVersion,
    timestamp: Date.now()
  }
}