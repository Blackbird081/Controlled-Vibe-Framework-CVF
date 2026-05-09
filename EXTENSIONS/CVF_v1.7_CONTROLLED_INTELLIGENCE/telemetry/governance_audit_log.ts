// governance_audit_log.ts
// Append-only audit log — persists to .jsonl file on disk.
// Falls back gracefully to in-memory if fs is unavailable (browser context).

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

export interface GovernanceEvent {
  eventType: string
  description: string
  timestamp: number
  sessionId?: string
}

// In-memory buffer (always available)
const auditBuffer: GovernanceEvent[] = []

// Configurable log path
function getLogPath(): string {
  if (!path) return ""
  return process.env.CVF_AUDIT_LOG_PATH
    ?? path.join(process.cwd(), "cvf_audit.jsonl")
}

function tryAppendToDisk(event: GovernanceEvent): void {
  if (!fs) return
  try {
    const line = JSON.stringify(event) + "\n"
    fs.appendFileSync(getLogPath(), line, "utf-8")
  } catch {
    // Silently continue — in-memory buffer still has the event
  }
}

export function logGovernanceEvent(
  eventType: string,
  description: string,
  sessionId?: string
): void {
  const event: GovernanceEvent = {
    eventType,
    description,
    timestamp: Date.now(),
    sessionId
  }

  auditBuffer.push(event)
  tryAppendToDisk(event)
}

export function getAuditLog(): GovernanceEvent[] {
  return [...auditBuffer]
}

export function queryAuditLog(eventType: string): GovernanceEvent[] {
  return auditBuffer.filter(e => e.eventType === eventType)
}

export function getAuditLogPath(): string {
  return getLogPath()
}