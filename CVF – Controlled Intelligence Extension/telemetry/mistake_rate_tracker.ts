// mistake_rate_tracker.ts
// Persisted mistake rate tracking with time series.
// Appends to cvf_telemetry.jsonl alongside other telemetry.

declare const require: (module: string) => any
declare const process: { cwd: () => string; env: Record<string, string | undefined> }

let fs: any
let path: any
try { fs = require("fs"); path = require("path") } catch { fs = null; path = null }

interface MistakeEvent {
  type: "action" | "mistake"
  timestamp: number
  sessionId?: string
}

const events: MistakeEvent[] = []

function getTelemetryPath(): string {
  if (!path) return ""
  return process.env.CVF_TELEMETRY_PATH
    ?? path.join(process.cwd(), "cvf_telemetry_mistakes.jsonl")
}

function appendToDisk(event: MistakeEvent): void {
  if (!fs) return
  try {
    fs.appendFileSync(getTelemetryPath(), JSON.stringify(event) + "\n", "utf-8")
  } catch { /* silent */ }
}

export function recordAction(sessionId?: string): void {
  const event: MistakeEvent = { type: "action", timestamp: Date.now(), sessionId }
  events.push(event)
  appendToDisk(event)
}

export function recordMistake(sessionId?: string): void {
  const event: MistakeEvent = { type: "mistake", timestamp: Date.now(), sessionId }
  events.push(event)
  appendToDisk(event)
}

export function getMistakeRate(): number {
  const total = events.filter(e => e.type === "action").length
  const mistakes = events.filter(e => e.type === "mistake").length
  if (total === 0) return 0
  return mistakes / total
}

/** Get mistake rate within a time window (ms from now). */
export function getMistakeRateInWindow(windowMs: number): number {
  const cutoff = Date.now() - windowMs
  const recent = events.filter(e => e.timestamp >= cutoff)
  const total = recent.filter(e => e.type === "action").length
  const mistakes = recent.filter(e => e.type === "mistake").length
  if (total === 0) return 0
  return mistakes / total
}