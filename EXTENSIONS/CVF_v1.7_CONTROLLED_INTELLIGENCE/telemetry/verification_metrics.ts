// verification_metrics.ts
// Time-tracked verification metrics with session + time window queries.

declare const require: (module: string) => any
declare const process: { cwd: () => string; env: Record<string, string | undefined> }

let fs: any
let path: any
try { fs = require("fs"); path = require("path") } catch { fs = null; path = null }

export interface VerificationEntry {
  testsPassed: number
  testsFailed: number
  timestamp: number
  sessionId?: string
}

const history: VerificationEntry[] = []

function getTelemetryPath(): string {
  if (!path) return ""
  return process.env.CVF_TELEMETRY_PATH
    ?? path.join(process.cwd(), "cvf_telemetry_verification.jsonl")
}

function appendToDisk(entry: VerificationEntry): void {
  if (!fs) return
  try {
    fs.appendFileSync(getTelemetryPath(), JSON.stringify(entry) + "\n", "utf-8")
  } catch { /* silent */ }
}

/** Record a verification run result. */
export function recordVerification(metrics: { testsPassed: number; testsFailed: number }, sessionId?: string): void {
  const entry: VerificationEntry = {
    ...metrics,
    timestamp: Date.now(),
    sessionId
  }
  history.push(entry)
  appendToDisk(entry)
}

/** Calculate pass ratio from a single metrics snapshot. */
export function calculateVerificationScore(metrics: { testsPassed: number; testsFailed: number }): number {
  const total = metrics.testsPassed + metrics.testsFailed
  if (total === 0) return 0
  return metrics.testsPassed / total
}

/** Get overall verification score across all recorded runs. */
export function getOverallVerificationScore(): number {
  if (history.length === 0) return 0
  const totalPassed = history.reduce((sum, e) => sum + e.testsPassed, 0)
  const totalFailed = history.reduce((sum, e) => sum + e.testsFailed, 0)
  return calculateVerificationScore({ testsPassed: totalPassed, testsFailed: totalFailed })
}

/** Get verification score within a time window (ms from now). */
export function getVerificationScoreInWindow(windowMs: number): number {
  const cutoff = Date.now() - windowMs
  const recent = history.filter(e => e.timestamp >= cutoff)
  if (recent.length === 0) return 0
  const totalPassed = recent.reduce((sum, e) => sum + e.testsPassed, 0)
  const totalFailed = recent.reduce((sum, e) => sum + e.testsFailed, 0)
  return calculateVerificationScore({ testsPassed: totalPassed, testsFailed: totalFailed })
}

/** Get history for trend analysis. */
export function getVerificationHistory(): VerificationEntry[] {
  return [...history]
}