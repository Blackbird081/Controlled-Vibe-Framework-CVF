export interface ReproducibilitySnapshot {
  sessionId: string
  role: string
  temperature: number
  entropyScore: number
  timestamp: number
}

export function createSnapshot(
  sessionId: string,
  role: string,
  temperature: number,
  entropyScore: number
): ReproducibilitySnapshot {

  return {
    sessionId,
    role,
    temperature,
    entropyScore,
    timestamp: Date.now()
  }
}