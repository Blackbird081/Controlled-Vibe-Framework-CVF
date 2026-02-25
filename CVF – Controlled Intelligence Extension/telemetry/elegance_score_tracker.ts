// elegance_score_tracker.ts
// Weighted, time-tracked elegance scoring.
// Persisted to disk. Supports decay weighting (recent scores count more).

declare const require: (module: string) => any
declare const process: { cwd: () => string; env: Record<string, string | undefined> }

let fs: any
let path: any
try { fs = require("fs"); path = require("path") } catch { fs = null; path = null }

interface EleganceEntry {
  score: number
  weight: number
  timestamp: number
  sessionId?: string
}

const entries: EleganceEntry[] = []

function getTelemetryPath(): string {
  if (!path) return ""
  return process.env.CVF_TELEMETRY_PATH
    ?? path.join(process.cwd(), "cvf_telemetry_elegance.jsonl")
}

function appendToDisk(entry: EleganceEntry): void {
  if (!fs) return
  try {
    fs.appendFileSync(getTelemetryPath(), JSON.stringify(entry) + "\n", "utf-8")
  } catch { /* silent */ }
}

/**
 * Record an elegance score with optional weight (default 1.0).
 * Higher weight = more important sample.
 */
export function recordElegance(score: number, weight: number = 1.0, sessionId?: string): void {
  const entry: EleganceEntry = { score, weight, timestamp: Date.now(), sessionId }
  entries.push(entry)
  appendToDisk(entry)
}

/** Simple average (backward compatible). */
export function getAverageElegance(): number {
  if (entries.length === 0) return 0
  const total = entries.reduce((sum, e) => sum + e.score, 0)
  return total / entries.length
}

/** Weighted average — respects sample importance. */
export function getWeightedElegance(): number {
  if (entries.length === 0) return 0
  const weightedSum = entries.reduce((sum, e) => sum + e.score * e.weight, 0)
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0)
  if (totalWeight === 0) return 0
  return weightedSum / totalWeight
}

/** Trend: average of last N samples vs overall average. */
export function getEleganceTrend(windowSize: number = 10): { recent: number; overall: number; improving: boolean } {
  const overall = getWeightedElegance()
  const recentEntries = entries.slice(-windowSize)
  const recent = recentEntries.length > 0
    ? recentEntries.reduce((sum, e) => sum + e.score, 0) / recentEntries.length
    : 0
  return { recent, overall, improving: recent >= overall }
}